import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { EducationApiService } from '@/api/education'
import type { GradeItem, GradeResponse, GPACalculationResult } from '@/types'

export const useGradesStore = defineStore('grades', () => {
  const grades = ref<GradeItem[]>([])
  const userInfo = ref<GradeResponse['userInfo'] | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastFetched = ref<number | null>(null)
  const calculationMethod = ref<'standard' | 'f2-new' | 'f2-old'>('f2-new')
  const enabledGrades = ref<Record<string, boolean>>({})

  const gpaResult = computed((): GPACalculationResult => {
    return EducationApiService.calculateGPA(grades.value, calculationMethod.value)
  })

  const gradesBySemester = computed(() => {
    const map = new Map<string, GradeItem[]>()
    grades.value.forEach(grade => {
      const key = `${grade.year}-${grade.semester}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(grade)
    })
    return map
  })

  const semesters = computed(() => {
    return Array.from(gradesBySemester.value.keys()).sort().reverse()
  })

  const averageScore = computed(() => {
    const enabled = grades.value.filter(g => g.isEnabled)
    if (enabled.length === 0) return 0
    const sum = enabled.reduce((acc, g) => acc + g.score, 0)
    return Math.round((sum / enabled.length) * 100) / 100
  })

  const scoreDistribution = computed(() => {
    const enabled = grades.value.filter(g => g.isEnabled)
    const ranges = [
      { label: '90-100', min: 90, max: 100, color: '#67C23A' },
      { label: '80-89', min: 80, max: 89, color: '#409EFF' },
      { label: '70-79', min: 70, max: 79, color: '#E6A23C' },
      { range: '60-69', min: 60, max: 69, color: '#F56C6C' },
      { range: '<60', min: 0, max: 59, color: '#909399' },
    ]
    const total = enabled.length || 1
    return ranges.map(r => ({
      ...r,
      count: enabled.filter(g => g.score >= r.min && g.score <= r.max).length,
      percentage: Math.round((enabled.filter(g => g.score >= r.min && g.score <= r.max).length / total) * 1000) / 10,
    }))
  })

  async function fetchGrades(year?: number, semester?: number, force = false) {
    if (loading.value) return
    if (!force && lastFetched.value && Date.now() - lastFetched.value < 5 * 60 * 1000) return

    loading.value = true
    error.value = null

    try {
      const response = await EducationApiService.getGradeList(year, semester)
      grades.value = response.items
      userInfo.value = response.userInfo
      lastFetched.value = Date.now()

      // Load enabled states from localStorage
      const stored = localStorage.getItem('ham_grade_enabled')
      if (stored) {
        try {
          enabledGrades.value = JSON.parse(stored)
        } catch {
          enabledGrades.value = {}
        }
      }

      // Initialize enabled states for new grades
      response.items.forEach(g => {
        const key = `${g.year}-${g.semester}-${g.courseId}`
        if (enabledGrades.value[key] === undefined) {
          enabledGrades.value[key] = true
        }
      })
      saveEnabledStates()
    } catch (err: any) {
      error.value = err.message || '获取成绩失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  function setCalculationMethod(method: 'standard' | 'f2-new' | 'f2-old') {
    calculationMethod.value = method
    localStorage.setItem('ham_gpa_method', method)
  }

  function loadCalculationMethod() {
    const stored = localStorage.getItem('ham_gpa_method')
    if (stored) {
      calculationMethod.value = stored as any
    }
  }

  function toggleGradeEnabled(grade: GradeItem) {
    const key = `${grade.year}-${grade.semester}-${grade.courseId}`
    enabledGrades.value[key] = !enabledGrades.value[key]
    saveEnabledStates()
  }

  function isGradeEnabled(grade: GradeItem): boolean {
    const key = `${grade.year}-${grade.semester}-${grade.courseId}`
    return enabledGrades.value[key] !== false
  }

  function saveEnabledStates() {
    localStorage.setItem('ham_grade_enabled', JSON.stringify(enabledGrades.value))
  }

  function clearCache() {
    grades.value = []
    userInfo.value = null
    lastFetched.value = null
    error.value = null
  }

  function getGradeById(year: number, semester: number, courseId: string): GradeItem | undefined {
    return grades.value.find(g => g.year === year && g.semester === semester && g.courseId === courseId)
  }

  return {
    grades,
    userInfo,
    loading,
    error,
    lastFetched,
    calculationMethod,
    enabledGrades,
    gpaResult,
    gradesBySemester,
    semesters,
    averageScore,
    scoreDistribution,
    fetchGrades,
    setCalculationMethod,
    loadCalculationMethod,
    toggleGradeEnabled,
    isGradeEnabled,
    clearCache,
    getGradeById,
  }
})