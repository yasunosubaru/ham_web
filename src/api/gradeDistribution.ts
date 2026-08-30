import requestService from './request'
import type { GradeDistributionQuery, GradeDistributionResult, TeacherRating } from '@/types'

// Mock data for grade distribution - in production this would come from Ham's backend
const MOCK_GRADE_DISTRIBUTIONS: Record<string, GradeDistributionResult> = {
  '高等数学': {
    courseName: '高等数学',
    teacherName: '张教授',
    totalStudents: 1200,
    averageScore: 78.5,
    medianScore: 80,
    distribution: [
      { range: '90-100', count: 180, percentage: 15 },
      { range: '80-89', count: 300, percentage: 25 },
      { range: '70-79', count: 360, percentage: 30 },
      { range: '60-69', count: 240, percentage: 20 },
      { range: '<60', count: 120, percentage: 10 },
    ],
    ratings: [
      {
        id: 'r1',
        courseName: '高等数学',
        teacherName: '张教授',
        rating: 4.5,
        difficulty: 4,
        homework: 3,
        grading: 4,
        comment: '讲课非常清晰，作业适量，考试不刁钻，给分很好',
        createdAt: '2024-01-15',
        semester: '2023-2024-1',
        isAnonymous: true,
      },
      {
        id: 'r2',
        courseName: '高等数学',
        teacherName: '张教授',
        rating: 4.2,
        difficulty: 3,
        homework: 4,
        grading: 4,
        comment: '老师很负责，PPT做得很好，期末复习划重点很准',
        createdAt: '2023-12-20',
        semester: '2023-2024-1',
        isAnonymous: true,
      },
    ],
  },
  '大学物理': {
    courseName: '大学物理',
    teacherName: '李老师',
    totalStudents: 800,
    averageScore: 75.2,
    medianScore: 76,
    distribution: [
      { range: '90-100', count: 80, percentage: 10 },
      { range: '80-89', count: 200, percentage: 25 },
      { range: '70-79', count: 280, percentage: 35 },
      { range: '60-69', count: 160, percentage: 20 },
      { range: '<60', count: 80, percentage: 10 },
    ],
    ratings: [
      {
        id: 'r3',
        courseName: '大学物理',
        teacherName: '李老师',
        rating: 4.0,
        difficulty: 4,
        homework: 3,
        grading: 3,
        comment: '物理本身难，老师讲得不错，但考试偏难',
        createdAt: '2024-01-10',
        semester: '2023-2024-1',
        isAnonymous: true,
      },
    ],
  },
  '数据结构': {
    courseName: '数据结构',
    teacherName: '王副教授',
    totalStudents: 500,
    averageScore: 82.3,
    medianScore: 83,
    distribution: [
      { range: '90-100', count: 100, percentage: 20 },
      { range: '80-89', count: 200, percentage: 40 },
      { range: '70-79', count: 125, percentage: 25 },
      { range: '60-69', count: 50, percentage: 10 },
      { range: '<60', count: 25, percentage: 5 },
    ],
    ratings: [
      {
        id: 'r4',
        courseName: '数据结构',
        teacherName: '王副教授',
        rating: 4.7,
        difficulty: 3,
        homework: 4,
        grading: 5,
        comment: '代码量大但学到很多，给分超级好，期末上机',
        createdAt: '2024-01-05',
        semester: '2023-2024-1',
        isAnonymous: true,
      },
      {
        id: 'r5',
        courseName: '数据结构',
        teacherName: '王副教授',
        rating: 4.5,
        difficulty: 4,
        homework: 5,
        grading: 4,
        comment: '作业很多但都很有价值，期末项目制，认真做都能拿高分',
        createdAt: '2023-12-28',
        semester: '2023-2024-1',
        isAnonymous: true,
      },
    ],
  },
}

const MOCK_TEACHERS: Record<string, { name: string; department: string; college: string; courses: string[] }> = {
  '张教授': { name: '张教授', department: '数学学院', college: '数学与统计学院', courses: ['高等数学', '数学分析', '微积分'] },
  '李老师': { name: '李老师', department: '物理学院', college: '物理学院', courses: ['大学物理', '理论力学', '电磁学'] },
  '王副教授': { name: '王副教授', department: '计算机学院', college: '计算机学院', courses: ['数据结构', '算法设计', '离散数学'] },
  '赵讲师': { name: '赵讲师', department: '外国语学院', college: '外国语学院', courses: ['大学英语', '学术英语写作'] },
  '钱老师': { name: '钱老师', department: '马克思主义学院', college: '马克思主义学院', courses: ['毛概', '马原', '思修'] },
}

export class GradeDistributionApi {
  static async search(query: GradeDistributionQuery): Promise<GradeDistributionResult | null> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500))

    if (query.courseName) {
      const key = Object.keys(MOCK_GRADE_DISTRIBUTIONS).find(k => 
        k.includes(query.courseName!) || query.courseName!.includes(k)
      )
      if (key) return MOCK_GRADE_DISTRIBUTIONS[key]
    }

    if (query.teacherName) {
      const key = Object.keys(MOCK_GRADE_DISTRIBUTIONS).find(k => 
        MOCK_GRADE_DISTRIBUTIONS[k].teacherName.includes(query.teacherName!) || 
        query.teacherName!.includes(MOCK_GRADE_DISTRIBUTIONS[k].teacherName)
      )
      if (key) return MOCK_GRADE_DISTRIBUTIONS[key]
    }

    return null
  }

  static async getTeacherInfo(teacherName: string): Promise<{ name: string; department: string; college: string; courses: string[] } | null> {
    await new Promise(resolve => setTimeout(resolve, 300))
    return MOCK_TEACHERS[teacherName] || null
  }

  static async getTeacherRatings(teacherName: string, courseName?: string): Promise<TeacherRating[]> {
    await new Promise(resolve => setTimeout(resolve, 300))
    const allRatings: TeacherRating[] = []
    Object.values(MOCK_GRADE_DISTRIBUTIONS).forEach(d => {
      d.ratings.forEach(r => {
        if (r.teacherName === teacherName && (!courseName || r.courseName === courseName)) {
          allRatings.push(r)
        }
      })
    })
    return allRatings
  }

  static async submitRating(rating: Omit<TeacherRating, 'id' | 'createdAt'>): Promise<TeacherRating> {
    await new Promise(resolve => setTimeout(resolve, 500))
    const newRating: TeacherRating = {
      ...rating,
      id: `rating_${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    return newRating
  }

  static async uploadGrades(grades: any[]): Promise<boolean> {
    // In production, this would send to Ham's backend
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('Uploading grades for 给分:', grades.length)
    return true
  }
}

export default GradeDistributionApi