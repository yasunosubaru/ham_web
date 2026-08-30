// User & Auth Types
export interface UserInfo {
  studentId: string
  name: string
  college: string
  major: string
  className?: string
  xhId?: string
}

export interface AuthState {
  isLoggedIn: boolean
  userInfo: UserInfo | null
  casCookie: string | null
  sessionExpires: number | null
}

// Grade Types
export interface GradeItem {
  year: number
  semester: number
  name: string
  courseId: string
  instructor: string
  credit: number
  courseType: string
  score: number
  courseCollege: string
  isEnabled: boolean
  gpa?: number
}

export interface GradeResponse {
  items: GradeItem[]
  userInfo: {
    college: string
    major: string
    name: string
    studentId: string
  }
}

export interface GPACalculationResult {
  gpa: number
  totalCredits: number
  earnedCredits: number
  weightedScore: number
  f2Score?: number
  f2Detail?: {
    b1: number
    b2: number
    selectedElectives: GradeItem[]
  }
}

// Course Types
export interface CourseItem {
  id: string
  name: string
  teacher: string
  location: string
  dayOfWeek: number
  startPeriod: number
  endPeriod: number
  startWeek: number
  endWeek: number
  weeks: number[]
  color: string
  courseType?: string
  credit?: number
}

// Teacher Types
export interface TeacherInfo {
  name: string
  department: string
  college: string
  avatar?: string
  rating: number
  totalRatings: number
  courses: TeacherCourse[]
}

export interface TeacherCourse {
  name: string
  avgScore: number
  rating: number
  totalStudents: number
  distribution: GradeDistribution[]
}

export interface GradeDistribution {
  range: string
  count: number
  percentage: number
}

// 给分查询 Types
export interface GradeDistributionQuery {
  courseName?: string
  teacherName?: string
}

export interface GradeDistributionResult {
  courseName: string
  teacherName: string
  totalStudents: number
  averageScore: number
  medianScore: number
  distribution: {
    range: string
    count: number
    percentage: number
  }[]
  ratings: TeacherRating[]
}

export interface TeacherRating {
  id: string
  courseName: string
  teacherName: string
  rating: number
  difficulty: number
  homework: number
  grading: number
  comment: string
  createdAt: string
  semester: string
  isAnonymous: boolean
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface CasLoginResult {
  url: string
  text: string
  needsReAuth: boolean
  reAuthUrl?: string
}

// Semester Config
export interface SemesterConfig {
  year: number
  semester: number
  validate: string
}

export type Semester = 1 | 2 | 3 // 1=秋季, 2=春季, 3=夏季

// Settings
export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  primaryColor: string
  autoRefreshGrades: boolean
  gradeNotification: boolean
  dataSyncEnabled: boolean
  biometricEnabled: boolean
}