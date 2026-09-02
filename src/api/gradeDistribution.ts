import requestService from './request'
import type { GradeDistributionQuery, GradeDistributionResult, TeacherRating } from '@/types'

export class GradeDistributionApi {
  static async search(query: GradeDistributionQuery): Promise<GradeDistributionResult | null> {
    try {
      const response = await requestService.proxyPost<GradeDistributionResult>('/ham/grade-distribution/search', query)
      return response
    } catch (error) {
      console.error('Grade distribution search failed:', error)
      return null
    }
  }

  static async searchTeachers(keyword: string): Promise<Array<{ name: string; department: string; college: string; courses: string[]; rating: number; totalRatings: number }>> {
    try {
      const response = await requestService.proxyPost<Array<{ name: string; department: string; college: string; courses: string[]; rating: number; totalRatings: number }>>('/ham/teachers/search', { keyword })
      return response || []
    } catch (error) {
      console.error('Teacher search failed:', error)
      return []
    }
  }

  static async getTeacherInfo(teacherName: string): Promise<{ name: string; department: string; college: string; courses: string[] } | null> {
    try {
      const response = await requestService.proxyGet<{ name: string; department: string; college: string; courses: string[] }>(
        `/ham/teachers/${encodeURIComponent(teacherName)}`
      )
      return response
    } catch (error) {
      console.error('Get teacher info failed:', error)
      return null
    }
  }

  static async getTeacherRatings(teacherName: string, courseName?: string): Promise<TeacherRating[]> {
    try {
      const params = courseName ? { courseName } : {}
      const response = await requestService.proxyGet<TeacherRating[]>(
        `/ham/teachers/${encodeURIComponent(teacherName)}/ratings`,
        params
      )
      return response || []
    } catch (error) {
      console.error('Get teacher ratings failed:', error)
      return []
    }
  }

  static async submitRating(rating: Omit<TeacherRating, 'id' | 'createdAt'>): Promise<TeacherRating> {
    const response = await requestService.proxyPost<TeacherRating>('/ham/ratings', rating)
    return response
  }

  static async uploadGrades(grades: any[]): Promise<boolean> {
    try {
      await requestService.proxyPost('/ham/grade-distribution/upload', { grades })
      return true
    } catch (error) {
      console.error('Upload grades failed:', error)
      throw error
    }
  }
}

export default GradeDistributionApi