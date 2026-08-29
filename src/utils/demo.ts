/**
 * Demo data seeding for first-time users.
 * Seeds realistic WHU campus data when localStorage is empty.
 */
import type { Course, Grade, Schedule } from '@/types'

const DEMO_FLAG_KEY = 'ham_demo_seeded'

export function isDemoSeeded(): boolean {
  return localStorage.getItem(DEMO_FLAG_KEY) === 'true'
}

export function markDemoSeeded() {
  localStorage.setItem(DEMO_FLAG_KEY, 'true')
}

// ─── Courses ───────────────────────────────────────────────

const COURSE_COLORS = [
  '#409EFF', '#67C23A', '#E6A23C', '#F56C6C',
  '#8B5CF6', '#06B6D4', '#EC4899', '#14B8A6',
  '#F97316', '#6366F1'
]

function weeks(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

export const DEMO_COURSES: Course[] = [
  // 周一
  {
    id: 'c1', name: '高等数学A(上)', teacher: '张宏',
    location: '教三-301', dayOfWeek: 1, startPeriod: 1, endPeriod: 2,
    startWeek: 1, endWeek: 16, color: COURSE_COLORS[0],
    credit: 5, type: 'required', weeks: weeks(1, 16)
  },
  {
    id: 'c2', name: '大学英语(二)', teacher: '李芳',
    location: '外院-205', dayOfWeek: 1, startPeriod: 3, endPeriod: 4,
    startWeek: 1, endWeek: 16, color: COURSE_COLORS[1],
    credit: 2, type: 'required', weeks: weeks(1, 16)
  },
  // 周二
  {
    id: 'c3', name: '程序设计基础', teacher: '王建华',
    location: '计软-101', dayOfWeek: 2, startPeriod: 3, endPeriod: 4,
    startWeek: 1, endWeek: 16, color: COURSE_COLORS[2],
    credit: 3, type: 'required', weeks: weeks(1, 16)
  },
  {
    id: 'c4', name: '线性代数', teacher: '陈明',
    location: '教五-502', dayOfWeek: 2, startPeriod: 5, endPeriod: 6,
    startWeek: 1, endWeek: 16, color: COURSE_COLORS[3],
    credit: 3.5, type: 'required', weeks: weeks(1, 16)
  },
  // 周三
  {
    id: 'c5', name: '高等数学A(上)', teacher: '张宏',
    location: '教三-301', dayOfWeek: 3, startPeriod: 1, endPeriod: 2,
    startWeek: 1, endWeek: 16, color: COURSE_COLORS[0],
    credit: 5, type: 'required', weeks: weeks(1, 16)
  },
  {
    id: 'c6', name: '思想道德与法治', teacher: '赵丽华',
    location: '教一-101', dayOfWeek: 3, startPeriod: 5, endPeriod: 6,
    startWeek: 1, endWeek: 12, color: COURSE_COLORS[4],
    credit: 3, type: 'general', weeks: weeks(1, 12)
  },
  // 周四
  {
    id: 'c7', name: '大学物理(上)', teacher: '刘强',
    location: '教四-402', dayOfWeek: 4, startPeriod: 1, endPeriod: 2,
    startWeek: 1, endWeek: 16, color: COURSE_COLORS[5],
    credit: 4, type: 'required', weeks: weeks(1, 16)
  },
  {
    id: 'c8', name: '程序设计基础', teacher: '王建华',
    location: '计软机房A', dayOfWeek: 4, startPeriod: 3, endPeriod: 4,
    startWeek: 1, endWeek: 16, color: COURSE_COLORS[2],
    credit: 3, type: 'required', weeks: weeks(1, 16)
  },
  // 周五
  {
    id: 'c9', name: '大学英语(二)', teacher: '李芳',
    location: '外院-205', dayOfWeek: 5, startPeriod: 1, endPeriod: 2,
    startWeek: 1, endWeek: 16, color: COURSE_COLORS[1],
    credit: 2, type: 'required', weeks: weeks(1, 16)
  },
  {
    id: 'c10', name: '体育(篮球)', teacher: '孙磊',
    location: '奥场篮球场', dayOfWeek: 5, startPeriod: 5, endPeriod: 6,
    startWeek: 1, endWeek: 16, color: COURSE_COLORS[6],
    credit: 1, type: 'required', weeks: weeks(1, 16)
  },
  // 周三晚上 — 选修
  {
    id: 'c11', name: '人工智能导论', teacher: '何炎祥',
    location: '计软-201', dayOfWeek: 3, startPeriod: 9, endPeriod: 10,
    startWeek: 1, endWeek: 16, color: COURSE_COLORS[7],
    credit: 2, type: 'elective', weeks: weeks(1, 16)
  },
]

// ─── Grades ────────────────────────────────────────────────

export const DEMO_GRADES: Grade[] = [
  { id: 'g1', courseName: '高等数学A(上)', teacher: '张宏', credit: 5.0, score: 92, gpa: 4.0, type: 'required', semester: '2025-2026-1', year: 2025, term: 1 },
  { id: 'g2', courseName: '大学英语(二)', teacher: '李芳', credit: 2.0, score: 88, gpa: 3.7, type: 'required', semester: '2025-2026-1', year: 2025, term: 1 },
  { id: 'g3', courseName: '程序设计基础', teacher: '王建华', credit: 3.0, score: 95, gpa: 4.0, type: 'required', semester: '2025-2026-1', year: 2025, term: 1 },
  { id: 'g4', courseName: '线性代数', teacher: '陈明', credit: 3.5, score: 85, gpa: 3.7, type: 'required', semester: '2025-2026-1', year: 2025, term: 1 },
  { id: 'g5', courseName: '思想道德与法治', teacher: '赵丽华', credit: 3.0, score: 82, gpa: 3.3, type: 'general', semester: '2025-2026-1', year: 2025, term: 1 },
  { id: 'g6', courseName: '大学物理(上)', teacher: '刘强', credit: 4.0, score: 78, gpa: 3.0, type: 'required', semester: '2025-2026-1', year: 2025, term: 1 },
  { id: 'g7', courseName: '体育(篮球)', teacher: '孙磊', credit: 1.0, score: 90, gpa: 4.0, type: 'required', semester: '2025-2026-1', year: 2025, term: 1 },
  { id: 'g8', courseName: '人工智能导论', teacher: '何炎祥', credit: 2.0, score: 88, gpa: 3.7, type: 'elective', semester: '2025-2026-1', year: 2025, term: 1 },
]

// ─── Schedule Events ───────────────────────────────────────

function todayAt(hours: number, minutes = 0): Date {
  const d = new Date()
  d.setHours(hours, minutes, 0, 0)
  return d
}

function daysFromNow(days: number, hours: number, minutes = 0): Date {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hours, minutes, 0, 0)
  return d
}

export const DEMO_SCHEDULES: Schedule[] = [
  {
    id: 's1', title: '高等数学期中考试',
    location: '教三-301', note: '复习范围：第1-8章',
    startTime: daysFromNow(1, 14, 0),
    endTime: daysFromNow(1, 16, 0),
    completed: false
  },
  {
    id: 's2', title: '英语小组讨论',
    location: '图书馆研讨室A',
    startTime: daysFromNow(2, 10, 0),
    endTime: daysFromNow(2, 11, 30),
    completed: false
  },
  {
    id: 's3', title: '编程作业截止',
    location: '', note: '提交到教学平台',
    startTime: daysFromNow(3, 23, 59),
    completed: false
  },
  {
    id: 's4', title: '篮球社活动',
    location: '奥场篮球场',
    startTime: daysFromNow(4, 18, 0),
    endTime: daysFromNow(4, 20, 0),
    groupId: 'life',
    completed: false
  },
  {
    id: 's5', title: '图书馆还书',
    location: '总馆一楼',
    startTime: daysFromNow(5, 15, 0),
    completed: false
  },
]

// ─── Seed function ─────────────────────────────────────────

/**
 * Seeds demo data into localStorage if it hasn't been seeded yet.
 * Returns true if data was seeded (first launch).
 */
export function seedDemoData(): boolean {
  if (isDemoSeeded()) return false

  const hasCourses = localStorage.getItem('ham_courses')
  const hasGrades = localStorage.getItem('ham_grades')
  const hasSchedules = localStorage.getItem('ham_schedules')

  // Only seed if all three stores are empty
  if (hasCourses || hasGrades || hasSchedules) {
    markDemoSeeded()
    return false
  }

  // Seed semester start date to ~2 weeks ago so the schedule grid shows current week
  const semesterStart = new Date()
  semesterStart.setDate(semesterStart.getDate() - 14)
  const semesterStartStr = `${semesterStart.getFullYear()}-${String(semesterStart.getMonth() + 1).padStart(2, '0')}-${String(semesterStart.getDate()).padStart(2, '0')}`

  localStorage.setItem('ham_courses', JSON.stringify(DEMO_COURSES))
  localStorage.setItem('ham_grades', JSON.stringify(DEMO_GRADES))
  localStorage.setItem('ham_schedules', JSON.stringify(DEMO_SCHEDULES))
  localStorage.setItem('ham_course_settings', JSON.stringify({
    semesterStartDate: semesterStartStr,
    courseOpacity: 0.9,
    showWeekends: false,
    currentWeek: 3
  }))

  markDemoSeeded()
  return true
}
