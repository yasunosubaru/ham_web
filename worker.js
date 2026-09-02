// worker.js - 静态资源托管 + API 代理 + CAS 登录代理 + 后端 API
const ALLOWED_ORIGIN = 'https://ham-web.vercel.app';
const FRONTEND_URL = 'https://ham-web.vercel.app';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    if (request.method === 'OPTIONS') return corsResponse();
    if (url.pathname === '/health') return new Response('OK', { headers: corsHeaders() });
    
    // CAS 代理
    if (url.pathname.startsWith('/api/cas/')) return handleCasProxy(request, url, env);
    
    // 教务系统代理
    if (url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/ham/')) {
      return handleApiProxy(request, url, env);
    }
    
    // Ham 后端 API (成绩分布、教师评价、图书馆、体育场馆)
    if (url.pathname.startsWith('/api/ham/')) return handleHamApi(request, url, env);
    
    return new Response('Not Found', { status: 404, headers: corsHeaders() });
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': 'https://ham-web.vercel.app',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Cookie, X-Requested-With, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

function corsResponse() { return new Response(null, { headers: corsHeaders() }); }

function addCorsHeaders(resp) {
  const headers = new Headers(resp.headers);
  Object.entries(corsHeaders()).forEach(([k, v]) => headers.set(k, v));
  return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
  });
}

// ===== CAS 代理 =====
async function handleCasProxy(request, url, env) {
  const targetPath = url.pathname.replace('/api/cas', '') + url.search;
  
  try {
    const casResp = await fetch(`https://cas.whu.edu.cn${targetPath}`, {
      method: request.method,
      headers: { 
        Host: 'cas.whu.edu.cn', 
        Referer: 'https://cas.whu.edu.cn/', 
        Cookie: request.headers.get('Cookie') || '' 
      },
      body: ['GET', 'HEAD'].includes(request.method) ? null : await request.text(),
      redirect: 'manual',
    });

    const casLocation = casResp.headers.get('Location');
    if (casLocation && casLocation.includes('ticket=')) {
      const ticketMatch = casLocation.match(/ticket=([^&]+)/);
      if (ticketMatch) {
        return new Response(null, { 
          status: 302, 
          headers: { 
            'Location': `https://ham-web.vercel.app?ticket=${ticketMatch[1]}`, 
            'Access-Control-Allow-Origin': 'https://ham-web.vercel.app', 
            'Access-Control-Allow-Credentials': 'true' 
          }
        });
      }
    }

    return addCorsHeaders(new Response(casResp.body, { 
      status: casResp.status, 
      statusText: casResp.statusText, 
      headers: casResp.headers 
    }));
  } catch (err) {
    return new Response(`Proxy Error: ${err.message}`, { status: 502, headers: corsHeaders() });
  }
}

// ===== 教务系统代理 =====
async function handleApiProxy(request, url, env) {
  const targetHost = url.searchParams.get('__host') || 'jwgl.whu.edu.cn';
  if (!['jwgl.whu.edu.cn', 'cas.whu.edu.cn'].includes(targetHost)) {
    return new Response('Forbidden', { status: 403, headers: corsHeaders() });
  }

  const targetPath = url.pathname.replace('/api', '') + url.search.replace(/[?&]__host=[^&]*/, '');

  try {
    const resp = await fetch(`https://${targetHost}${targetPath}`, {
      method: request.method,
      headers: { Host: targetHost, Referer: `https://${targetHost}/`, Cookie: request.headers.get('Cookie') || '' },
      body: ['GET', 'HEAD'].includes(request.method) ? null : await request.text(),
      redirect: 'manual',
    });

    const respHeaders = new Headers(resp.headers);
    respHeaders.set('Access-Control-Expose-Headers', 'Set-Cookie, Location, Content-Length');

    const cookies = resp.headers.get('set-cookie');
    if (cookies) {
      const fixedCookies = cookies.split(', ').map(c => 
        c.replace(/;\s*Domain=[^;]+/gi, '').replace(/;\s*Secure/gi, '; Secure; SameSite=None')
      ).join(', ');
      const newHeaders = new Headers();
      newHeaders.set('set-cookie', fixedCookies);
      Object.entries(corsHeaders()).forEach(([k, v]) => newHeaders.set(k, v));
      return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers: newHeaders });
    }

    return addCorsHeaders(new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers: respHeaders }));
  } catch (err) {
    return new Response(`Proxy Error: ${err.message}`, { status: 502, headers: corsHeaders() });
  }
}

// ===== In-Memory Storage =====
const memoryStore = {
  userGrades: [],
  teacherRatings: [],
  teacherInfo: new Map(),
  libraryReservations: new Map(),
  sportsBookings: new Map(),
};

function getUserId(request) {
  const auth = request.headers.get('Authorization');
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice(7);
  }
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/ham_user_id=([^;]+)/);
  return match ? match[1] : `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ===== Ham 后端 API =====
async function handleHamApi(request, url, env) {
  const path = url.pathname.replace('/api/ham', '');
  const method = request.method;
  const store = env.DB ? null : memoryStore;

  try {
    if (env.DB) await initDatabase(env);

    // 成绩分布查询
    if (path === '/grade-distribution/search' && method === 'POST') {
      return handleGradeDistributionSearch(request, env, store);
    }
    if (path === '/grade-distribution/upload' && method === 'POST') {
      return handleGradeUpload(request, env, store);
    }

    // 教师查询
    if (path === '/teachers/search' && method === 'POST') {
      return handleTeacherSearch(request, env, store);
    }
    if (path.startsWith('/teachers/') && method === 'GET' && !path.endsWith('/ratings')) {
      const teacherName = path.split('/teachers/')[1];
      return handleTeacherInfo(teacherName, env, store);
    }
    if (path.startsWith('/teachers/') && path.endsWith('/ratings') && method === 'GET') {
      const teacherName = path.split('/teachers/')[1].replace('/ratings', '');
      return handleTeacherRatings(teacherName, url, env, store);
    }

    // 教师评价提交
    if (path === '/ratings' && method === 'POST') {
      return handleSubmitRating(request, env, store);
    }

    // 图书馆预约
    if (path === '/library/buildings' && method === 'GET') {
      return handleLibraryBuildings(env, store);
    }
    if (path === '/library/reserve' && method === 'POST') {
      return handleLibraryReserve(request, env, store);
    }
    if (path === '/library/reservation' && method === 'GET') {
      return handleLibraryReservation(request, env, store);
    }
    if (path === '/library/reservation' && method === 'DELETE') {
      return handleLibraryCancelReservation(request, env, store);
    }

    // 体育场馆预约
    if (path === '/sports/venues' && method === 'GET') {
      return handleSportsVenues(env, store);
    }
    if (path === '/sports/book' && method === 'POST') {
      return handleSportsBook(request, env, store);
    }
    if (path === '/sports/booking' && method === 'GET') {
      return handleSportsBooking(request, env, store);
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders() });
  } catch (err) {
    console.error('Ham API Error:', err);
    return new Response(`Server Error: ${err.message}`, { status: 500, headers: corsHeaders() });
  }
}

// ===== 数据库初始化 =====
async function initDatabase(env) {
  if (!env.DB) return;
  
  await env.DB.exec(`
    CREATE TABLE IF NOT EXISTS user_grades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      course_name TEXT NOT NULL,
      teacher_name TEXT,
      year INTEGER NOT NULL,
      semester INTEGER NOT NULL,
      score REAL NOT NULL,
      credit REAL,
      course_type TEXT,
      course_college TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS teacher_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_name TEXT NOT NULL,
      course_name TEXT NOT NULL,
      user_id TEXT,
      rating REAL NOT NULL,
      difficulty INTEGER,
      homework INTEGER,
      grading INTEGER,
      comment TEXT,
      semester TEXT,
      is_anonymous BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS teacher_info (
      name TEXT PRIMARY KEY,
      department TEXT,
      college TEXT,
      courses TEXT,
      avg_rating REAL DEFAULT 0,
      total_ratings INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS library_reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      building_id TEXT NOT NULL,
      building_name TEXT NOT NULL,
      floor TEXT,
      seat_number TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sports_bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      venue_id INTEGER NOT NULL,
      venue_name TEXT NOT NULL,
      venue_type TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// ===== 成绩分布搜索 =====
async function handleGradeDistributionSearch(request, env, store) {
  const { courseName, teacherName } = await request.json();

  if (env.DB) {
    let query = `
      SELECT 
        course_name, teacher_name, AVG(score) as avg_score, COUNT(*) as total_students,
        SUM(CASE WHEN score >= 60 THEN 1 ELSE 0 END) as pass_count,
        GROUP_CONCAT(score) as all_scores
      FROM user_grades WHERE 1=1
    `;
    const params = [];
    if (courseName) { query += ` AND course_name LIKE ?`; params.push(`%${courseName}%`); }
    if (teacherName) { query += ` AND teacher_name LIKE ?`; params.push(`%${teacherName}%`); }
    query += ` GROUP BY course_name, teacher_name ORDER BY total_students DESC LIMIT 20`;

    const result = await env.DB.prepare(query).bind(...params).all();
    if (!result.results || result.results.length === 0) return jsonResponse(null);

    return jsonResponse(result.results.map(row => formatDistribution(row)).shift());
  } else {
    // Memory store fallback
    let grades = store.userGrades;
    if (courseName) grades = grades.filter(g => g.course_name.includes(courseName));
    if (teacherName) grades = grades.filter(g => g.teacher_name?.includes(teacherName));
    if (grades.length === 0) return jsonResponse(null);

    return jsonResponse(formatDistributionFromMemory(grades));
  }
}

function formatDistribution(row) {
  const scores = row.all_scores.split(',').map(Number).sort((a, b) => a - b);
  const distribution = [
    { range: '90-100', count: scores.filter(s => s >= 90).length },
    { range: '80-89', count: scores.filter(s => s >= 80 && s < 90).length },
    { range: '70-79', count: scores.filter(s => s >= 70 && s < 80).length },
    { range: '60-69', count: scores.filter(s => s >= 60 && s < 70).length },
    { range: '<60', count: scores.filter(s => s < 60).length },
  ];
  const total = scores.length;
  distribution.forEach(d => d.percentage = total > 0 ? Math.round((d.count / total) * 100) : 0);
  return {
    courseName: row.course_name, teacherName: row.teacher_name,
    totalStudents: row.total_students, averageScore: Math.round(row.avg_score * 10) / 10,
    medianScore: scores[Math.floor(scores.length / 2)], distribution,
    passRate: total > 0 ? Math.round((row.pass_count / total) * 100) : 0,
  };
}

function formatDistributionFromMemory(grades) {
  const scores = grades.map(g => g.score).sort((a, b) => a - b);
  const distribution = [
    { range: '90-100', count: scores.filter(s => s >= 90).length },
    { range: '80-89', count: scores.filter(s => s >= 80 && s < 90).length },
    { range: '70-79', count: scores.filter(s => s >= 70 && s < 80).length },
    { range: '60-69', count: scores.filter(s => s >= 60 && s < 70).length },
    { range: '<60', count: scores.filter(s => s < 60).length },
  ];
  const total = scores.length;
  distribution.forEach(d => d.percentage = total > 0 ? Math.round((d.count / total) * 100) : 0);
  const avgScore = total > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / total) * 10) / 10 : 0;
  const passCount = scores.filter(s => s >= 60).length;
  return {
    courseName: grades[0].course_name, teacherName: grades[0].teacher_name,
    totalStudents: total, averageScore: avgScore, medianScore: scores[Math.floor(total/2)],
    distribution, passRate: total > 0 ? Math.round((passCount / total) * 100) : 0,
  };
}

// ===== 上传成绩 =====
async function handleGradeUpload(request, env, store) {
  const { grades } = await request.json();
  const userId = getUserId(request);

  if (!grades || !Array.isArray(grades)) {
    return jsonResponse({ error: 'Invalid grades data' }, 400);
  }

  if (env.DB) {
    const stmt = env.DB.prepare(`
      INSERT INTO user_grades (user_id, course_name, teacher_name, year, semester, score, credit, course_type, course_college)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const grade of grades) {
      await stmt.bind(userId, grade.name || '', grade.instructor || '', grade.year || 0, grade.semester || 0, grade.score || 0, grade.credit || 0, grade.courseType || '', grade.courseCollege || '').run();
    }
  } else {
    for (const grade of grades) {
      store.userGrades.push({
        user_id: userId, course_name: grade.name || '', teacher_name: grade.instructor || '',
        year: grade.year || 0, semester: grade.semester || 0, score: grade.score || 0,
        credit: grade.credit || 0, course_type: grade.courseType || '', course_college: grade.courseCollege || '',
        created_at: new Date().toISOString(),
      });
    }
  }
  return jsonResponse({ success: true, count: grades.length });
}

// ===== 教师搜索 =====
async function handleTeacherSearch(request, env, store) {
  const { keyword } = await request.json();

  if (env.DB) {
    const result = await env.DB.prepare(`
      SELECT DISTINCT ti.name, ti.department, ti.college, ti.courses, ti.avg_rating, ti.total_ratings
      FROM teacher_info ti WHERE ti.name LIKE ? OR ti.courses LIKE ?
    `).bind(`%${keyword}%`, `%${keyword}%`).all();
    return jsonResponse((result.results || []).map(row => ({
      name: row.name, department: row.department, college: row.college,
      courses: row.courses ? row.courses.split(',') : [], rating: row.avg_rating, totalRatings: row.total_ratings,
    })));
  } else {
    // Memory store: search in teacherInfo map
    const teachers = Array.from(store.teacherInfo.values()).filter(t => 
      t.name.includes(keyword) || t.courses.some(c => c.includes(keyword))
    );
    return jsonResponse(teachers);
  }
}

// ===== 教师信息 =====
async function handleTeacherInfo(teacherName, env, store) {
  if (env.DB) {
    const result = await env.DB.prepare('SELECT * FROM teacher_info WHERE name = ?').bind(teacherName).first();
    if (!result) return jsonResponse(null);
    return jsonResponse({
      name: result.name, department: result.department, college: result.college,
      courses: result.courses ? result.courses.split(',') : [], avgRating: result.avg_rating, totalRatings: result.total_ratings,
    });
  } else {
    const info = store.teacherInfo.get(teacherName);
    if (!info) return jsonResponse(null);
    return jsonResponse(info);
  }
}

// ===== 教师评价列表 =====
async function handleTeacherRatings(teacherName, url, env, store) {
  const courseName = url.searchParams.get('courseName');

  if (env.DB) {
    let query = 'SELECT * FROM teacher_ratings WHERE teacher_name = ?';
    const params = [teacherName];
    if (courseName) { query += ' AND course_name = ?'; params.push(courseName); }
    query += ' ORDER BY created_at DESC LIMIT 50';
    const result = await env.DB.prepare(query).bind(...params).all();
    return jsonResponse((result.results || []).map(row => ({
      id: row.id, courseName: row.course_name, teacherName: row.teacher_name,
      rating: row.rating, difficulty: row.difficulty, homework: row.homework,
      grading: row.grading, comment: row.comment, semester: row.semester,
      isAnonymous: row.is_anonymous, createdAt: row.created_at,
    })));
  } else {
    let ratings = store.teacherRatings.filter(r => r.teacher_name === teacherName);
    if (courseName) ratings = ratings.filter(r => r.course_name === courseName);
    return jsonResponse(ratings.slice(0, 50).map(r => ({
      id: r.id, courseName: r.course_name, teacherName: r.teacher_name,
      rating: r.rating, difficulty: r.difficulty, homework: r.homework,
      grading: r.grading, comment: r.comment, semester: r.semester,
      isAnonymous: r.is_anonymous, createdAt: r.created_at,
    })));
  }
}

// ===== 提交评价 =====
async function handleSubmitRating(request, env, store) {
  const data = await request.json();
  const userId = getUserId(request);
  const { courseName, teacherName, rating, difficulty, homework, grading, comment, semester, isAnonymous } = data;

  if (!courseName || !teacherName || !rating) {
    return jsonResponse({ error: 'Missing required fields' }, 400);
  }

  const newRating = {
    id: Date.now(), course_name: courseName, teacher_name: teacherName, user_id: userId,
    rating, difficulty: difficulty || 0, homework: homework || 0, grading: grading || 0,
    comment: comment || '', semester: semester || '', is_anonymous: isAnonymous ? 1 : 0,
    created_at: new Date().toISOString(),
  };

  if (env.DB) {
    const result = await env.DB.prepare(`
      INSERT INTO teacher_ratings (teacher_name, course_name, user_id, rating, difficulty, homework, grading, comment, semester, is_anonymous)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(teacherName, courseName, userId, rating, difficulty || 0, homework || 0, grading || 0, comment || '', semester || '', isAnonymous ? 1 : 0).run();
    await updateTeacherStats(teacherName, env);
    newRating.id = result.meta.last_row_id;
  } else {
    store.teacherRatings.push(newRating);
    updateTeacherStatsMemory(teacherName, store);
  }
  return jsonResponse(newRating);
}

async function updateTeacherStats(teacherName, env) {
  const result = await env.DB.prepare(`SELECT AVG(rating) as avg_rating, COUNT(*) as total_ratings FROM teacher_ratings WHERE teacher_name = ?`).bind(teacherName).first();
  if (result) {
    await env.DB.prepare(`INSERT INTO teacher_info (name, avg_rating, total_ratings, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(name) DO UPDATE SET avg_rating = excluded.avg_rating, total_ratings = excluded.total_ratings, updated_at = CURRENT_TIMESTAMP`).bind(teacherName, result.avg_rating || 0, result.total_ratings || 0).run();
  }
}

function updateTeacherStatsMemory(teacherName, store) {
  const ratings = store.teacherRatings.filter(r => r.teacher_name === teacherName);
  const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b.rating, 0) / ratings.length : 0;
  store.teacherInfo.set(teacherName, { ...store.teacherInfo.get(teacherName), avgRating, totalRatings: ratings.length });
}

// ===== 图书馆 =====
async function handleLibraryBuildings(env, store) {
  return jsonResponse([
    { id: 'lib1', name: '总馆', icon: '🏛️', avail: 120, floors: ['一楼阅览室', '二楼自习室', '三楼研修室', '四楼多媒体室'] },
    { id: 'lib2', name: '工学分馆', icon: '🔧', avail: 85, floors: ['一楼阅览室', '二楼自习室', '三楼研修室'] },
    { id: 'lib3', name: '理学分馆', icon: '🔬', avail: 63, floors: ['一楼阅览室', '二楼自习室', '三楼研修室'] },
    { id: 'lib4', name: '信息分馆', icon: '💻', avail: 42, floors: ['一楼阅览室', '二楼自习室', '三楼研修室'] },
    { id: 'lib5', name: '医学分馆', icon: '🏥', avail: 56, floors: ['一楼阅览室', '二楼自习室'] },
    { id: 'lib6', name: '文科分馆', icon: '📖', avail: 78, floors: ['一楼阅览室', '二楼自习室', '三楼研修室'] },
  ]);
}

async function handleLibraryReserve(request, env, store) {
  const { buildingId, buildingName, floor, seatNumber, timeSlot, date } = await request.json();
  const userId = getUserId(request);

  if (env.DB) {
    const existing = await env.DB.prepare('SELECT * FROM library_reservations WHERE user_id = ? AND status = ?').bind(userId, 'active').first();
    if (existing) return jsonResponse({ error: '已有活跃预约，请先取消' }, 400);
    await env.DB.prepare(`INSERT INTO library_reservations (user_id, building_id, building_name, floor, seat_number, time_slot, date) VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(userId, buildingId, buildingName, floor || '', seatNumber, timeSlot, date).run();
  } else {
    for (const [, res] of store.libraryReservations) { if (res.user_id === userId && res.status === 'active') return jsonResponse({ error: '已有活跃预约，请先取消' }, 400); }
    const res = { user_id: userId, building_id: buildingId, building_name: buildingName, floor: floor || '', seat_number: seatNumber, time_slot: timeSlot, date, status: 'active', created_at: new Date().toISOString() };
    store.libraryReservations.set(userId, res);
  }
  return jsonResponse({ success: true });
}

async function handleLibraryReservation(request, env, store) {
  const userId = getUserId(request);
  let result;
  if (env.DB) {
    result = await env.DB.prepare('SELECT * FROM library_reservations WHERE user_id = ? AND status = ? ORDER BY created_at DESC LIMIT 1').bind(userId, 'active').first();
  } else {
    result = store.libraryReservations.get(userId);
  }
  if (!result || result.status !== 'active') return jsonResponse(null);
  return jsonResponse({ building: result.building_name, seat: `${result.seat_number}号座位${result.floor ? ' (' + result.floor + ')' : ''}`, timeSlot: result.time_slot, date: result.date });
}

async function handleLibraryCancelReservation(request, env, store) {
  const userId = getUserId(request);
  if (env.DB) {
    await env.DB.prepare('UPDATE library_reservations SET status = ? WHERE user_id = ? AND status = ?').bind('cancelled', userId, 'active').run();
  } else {
    const res = store.libraryReservations.get(userId);
    if (res) res.status = 'cancelled';
  }
  return jsonResponse({ success: true });
}

// ===== 体育场馆 =====
async function handleSportsVenues(env, store) {
  return jsonResponse([
    { id: 1, name: '奥场篮球场', type: 'basketball', icon: '🏀', slots: ['08:00-10:00', '10:00-12:00', '14:00-16:00', '16:00-18:00', '19:00-21:00'], available: true },
    { id: 2, name: '桂园羽毛球馆', type: 'badminton', icon: '🏸', slots: ['09:00-11:00', '11:00-13:00', '14:00-16:00', '16:00-18:00'], available: true },
    { id: 3, name: '游泳馆', type: 'swimming', icon: '🏊', slots: ['06:30-08:30', '12:00-14:00', '17:00-19:00', '19:00-21:00'], available: false },
    { id: 4, name: '网球场A', type: 'tennis', icon: '🎾', slots: ['08:00-10:00', '10:00-12:00', '14:00-16:00'], available: true },
    { id: 5, name: '网球场B', type: 'tennis', icon: '🎾', slots: ['08:00-10:00', '16:00-18:00', '18:00-20:00'], available: true },
    { id: 6, name: '梅操篮球场', type: 'basketball', icon: '🏀', slots: ['09:00-11:00', '15:00-17:00', '19:00-21:00'], available: true },
  ]);
}

async function handleSportsBook(request, env, store) {
  const { venueId, venueName, venueType, timeSlot, date } = await request.json();
  const userId = getUserId(request);

  if (env.DB) {
    const existing = await env.DB.prepare('SELECT * FROM sports_bookings WHERE user_id = ? AND status = ?').bind(userId, 'active').first();
    if (existing) return jsonResponse({ error: '已有活跃预约，请先取消' }, 400);
    await env.DB.prepare(`INSERT INTO sports_bookings (user_id, venue_id, venue_name, venue_type, time_slot, date) VALUES (?, ?, ?, ?, ?, ?)`).bind(userId, venueId, venueName, venueType, timeSlot, date).run();
  } else {
    for (const [, b] of store.sportsBookings) { if (b.user_id === userId && b.status === 'active') return jsonResponse({ error: '已有活跃预约，请先取消' }, 400); }
    const b = { user_id: userId, venue_id: venueId, venue_name: venueName, venue_type: venueType, time_slot: timeSlot, date, status: 'active', created_at: new Date().toISOString() };
    store.sportsBookings.set(userId, b);
  }
  return jsonResponse({ success: true });
}

async function handleSportsBooking(request, env, store) {
  const userId = getUserId(request);
  let result;
  if (env.DB) {
    result = await env.DB.prepare('SELECT * FROM sports_bookings WHERE user_id = ? AND status = ? ORDER BY created_at DESC LIMIT 1').bind(userId, 'active').first();
  } else {
    result = store.sportsBookings.get(userId);
  }
  if (!result || result.status !== 'active') return jsonResponse(null);
  return jsonResponse({ venueName: result.venue_name, venueType: result.venue_type, timeSlot: result.time_slot, date: result.date });
}