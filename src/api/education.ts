import requestService from './request'
import type { GradeItem, GradeResponse, GPACalculationResult, SemesterConfig, CourseItem, UserInfo } from '@/types'

export class EducationApiService {
  static async login(): Promise<void> {
    await requestService.loginEducation()
  }

  static async getUserInfo(): Promise<UserInfo> {
    return requestService.getUserInfo()
  }

  static async getGradeList(year?: number, semester?: number): Promise<GradeResponse> {
    return requestService.getGradeList(year, semester)
  }

  static async getCourseList(year?: number, semester?: number): Promise<string> {
    return requestService.getCourseList(year, semester)
  }

  static async getSemesterConfig(): Promise<SemesterConfig> {
    const config = await requestService.getSemesterConfig()
    return {
      ...config,
      validate: requestService['generateValidate'](),
    }
  }

  static calculateGPA(grades: GradeItem[], method: 'standard' | 'f2-new' | 'f2-old' = 'standard'): GPACalculationResult {
    const enabledGrades = grades.filter(g => g.isEnabled)
    
    if (enabledGrades.length === 0) {
      return { gpa: 0, totalCredits: 0, earnedCredits: 0, weightedScore: 0 }
    }

    // Standard GPA calculation (4.0 scale)
    let totalCredits = 0
    let earnedCredits = 0
    let weightedScore = 0

    for (const grade of enabledGrades) {
      totalCredits += grade.credit
      if (grade.score >= 60) {
        earnedCredits += grade.credit
      }
      weightedScore += grade.gpa! * grade.credit
    }

    const gpa = totalCredits > 0 ? weightedScore / totalCredits : 0

    let f2Score: number | undefined
    let f2Detail: GPACalculationResult['f2Detail']

    if (method.startsWith('f2')) {
      const requiredGrades = enabledGrades.filter(g => 
        g.courseType.includes('必修') || g.courseType.includes('通识')
      )
      const electiveGrades = enabledGrades.filter(g => 
        g.courseType.includes('选修') || g.courseType.includes('跨专业')
      ).sort((a, b) => b.score - a.score)

      let b1 = 0, b1Credits = 0
      for (const g of requiredGrades) {
        b1 += g.score * g.credit
        b1Credits += g.credit
      }
      const b1Avg = b1Credits > 0 ? b1 / b1Credits : 0

      const selectedElectives = electiveGrades.slice(0, 8)
      let b2 = 0, b2Credits = 0
      for (const g of selectedElectives) {
        b2 += g.score * g.credit
        b2Credits += g.credit
      }
      const b2Avg = b2Credits > 0 ? b2 / b2Credits : 0

      if (method === 'f2-old') {
        f2Score = b1Avg * 0.98 + b2Avg * 0.02
      } else {
        f2Score = b1Avg + b2Avg * 0.002
      }

      f2Detail = {
        b1: Math.round(b1Avg * 100) / 100,
        b2: Math.round(b2Avg * 100) / 100,
        selectedElectives,
      }
    }

    return {
      gpa: Math.round(gpa * 100) / 100,
      totalCredits,
      earnedCredits,
      weightedScore: Math.round(weightedScore * 100) / 100,
      f2Score: f2Score ? Math.round(f2Score * 100) / 100 : undefined,
      f2Detail,
    }
  }

  static parseCourseHtml(html: string): CourseItem[] {
    // Parse course HTML from the education system
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const courses: CourseItem[] = []

    // This is a simplified parser - the actual implementation would be more complex
    const rows = doc.querySelectorAll('table tbody tr')
    rows.forEach((row, index) => {
      const cells = row.querySelectorAll('td')
      if (cells.length >= 8) {
        courses.push({
          id: `course_${index}`,
          name: cells[1]?.textContent?.trim() || '',
          teacher: cells[4]?.textContent?.trim() || '',
          location: cells[5]?.textContent?.trim() || '',
          dayOfWeek: parseInt(cells[2]?.textContent?.trim() || '1') || 1,
          startPeriod: parseInt(cells[3]?.textContent?.split('-')[0] || '1') || 1,
          endPeriod: parseInt(cells[3]?.textContent?.split('-')[1] || '2') || 2,
          startWeek: 1,
          endWeek: 18,
          weeks: Array.from({ length: 18 }, (_, i) => i + 1),
          color: this.getRandomColor(),
          courseType: cells[6]?.textContent?.trim() || '',
          credit: parseFloat(cells[7]?.textContent?.trim() || '2') || 2,
        })
      }
    })

    return courses
  }

  private static getRandomColor(): string {
    const colors = [
      '#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399',
      '#e67e22', '#9b59b6', '#1abc9c', '#34495e', '#e91e63',
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  static getScoreColor(score: number): string {
    if (score >= 90) return 'excellent'
    if (score >= 80) return 'good'
    if (score >= 60) return 'pass'
    return 'fail'
  }

  static getScoreLabel(score: number): string {
    if (score >= 90) return '优秀'
    if (score >= 80) return '良好'
    if (score >= 60) return '及格'
    return '不及格'
  }

  static formatSemester(year: number, semester: number): string {
    const semesterMap: Record<number, string> = { 1: '秋季', 2: '春季', 3: '夏季' }
    return `${year}-${year + 1} 学年 ${semesterMap[semester]}学期`
  }
}

export default EducationApiService