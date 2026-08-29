import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Grade, GPAResult } from '@/types'

const STORAGE_KEY = 'ham_grades'
const SETTINGS_KEY = 'ham_grade_settings'

export interface GradeSettings {
  calculationMethod: 'f2-new' | 'f2-old' | 'custom'
  customScript?: string
  enabledGrades: Record<string, boolean>
}

export const useGradeStore = defineStore('grade', () => {
  const grades = ref<Grade[]>([])
  const settings = ref<GradeSettings>({
    calculationMethod: 'f2-new',
    enabledGrades: {}
  })

  function loadFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        grades.value = JSON.parse(stored)
      } catch {
        grades.value = []
      }
    }

    const storedSettings = localStorage.getItem(SETTINGS_KEY)
    if (storedSettings) {
      try {
        settings.value = { ...settings.value, ...JSON.parse(storedSettings) }
      } catch {}
    }
  }

  function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(grades.value))
  }

  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings.value))
  }

  function addGrade(grade: Grade) {
    grades.value.push(grade)
    saveToStorage()
  }

  function updateGrade(id: string, updates: Partial<Grade>) {
    const index = grades.value.findIndex(g => g.id === id)
    if (index !== -1) {
      grades.value[index] = { ...grades.value[index], ...updates }
      saveToStorage()
    }
  }

  function deleteGrade(id: string) {
    grades.value = grades.value.filter(g => g.id !== id)
    saveToStorage()
  }

  function setGradeEnabled(id: string, enabled: boolean) {
    settings.value.enabledGrades[id] = enabled
    saveSettings()
  }

  function isGradeEnabled(id: string): boolean {
    return settings.value.enabledGrades[id] !== false
  }

  function calculateGPA(selectedIds?: string[]): GPAResult {
    const validGrades = grades.value.filter(g => 
      isGradeEnabled(g.id) && (!selectedIds || selectedIds.includes(g.id))
    )

    if (validGrades.length === 0) {
      return { gpa: 0, totalCredits: 0, earnedCredits: 0, weightedScore: 0 }
    }

    let totalCredits = 0
    let earnedCredits = 0
    let weightedScore = 0

    for (const grade of validGrades) {
      totalCredits += grade.credit
      if (grade.score >= 60) {
        earnedCredits += grade.credit
      }
      weightedScore += grade.score * grade.credit
    }

    const gpa = totalCredits > 0 ? weightedScore / totalCredits / 25 * 4 : 0

    return {
      gpa: Math.round(gpa * 100) / 100,
      totalCredits,
      earnedCredits,
      weightedScore: Math.round(weightedScore * 100) / 100
    }
  }

  function calculateF2(): GPAResult {
    const baseResult = calculateGPA()
    
    const requiredGrades = grades.value.filter(g => 
      isGradeEnabled(g.id) && (g.type === 'required' || g.type === 'general')
    )
    const electiveGrades = grades.value.filter(g => 
      isGradeEnabled(g.id) && (g.type === 'elective' || g.type === 'cross')
    ).sort((a, b) => b.score - a.score)

    let b1 = 0
    let b1Credits = 0
    for (const g of requiredGrades) {
      b1 += g.score * g.credit
      b1Credits += g.credit
    }
    const b1Avg = b1Credits > 0 ? b1 / b1Credits : 0

    const selectedElectives = electiveGrades.slice(0, 8)
    let b2 = 0
    let b2Credits = 0
    for (const g of selectedElectives) {
      b2 += g.score * g.credit
      b2Credits += g.credit
    }
    const b2Avg = b2Credits > 0 ? b2 / b2Credits : 0

    let f2: number
    if (settings.value.calculationMethod === 'f2-old') {
      f2 = b1Avg * 0.98 + b2Avg * 0.02
    } else {
      f2 = b1Avg + b2Avg * 0.002
    }

    return {
      ...baseResult,
      f2Score: Math.round(f2 * 100) / 100,
      f2Detail: {
        b1: Math.round(b1Avg * 100) / 100,
        b2: Math.round(b2Avg * 100) / 100,
        selectedElectives
      }
    }
  }

  const gradeColor = (score: number) => {
    if (score >= 90) return 'excellent'
    if (score >= 80) return 'good'
    if (score >= 60) return 'pass'
    return 'fail'
  }

  const scoreToGPA = (score: number) => {
    if (score >= 90) return 4.0
    if (score >= 85) return 3.7
    if (score >= 82) return 3.3
    if (score >= 78) return 3.0
    if (score >= 75) return 2.7
    if (score >= 72) return 2.3
    if (score >= 68) return 2.0
    if (score >= 64) return 1.5
    if (score >= 60) return 1.0
    return 0
  }

  return {
    grades,
    settings,
    loadFromStorage,
    saveToStorage,
    saveSettings,
    addGrade,
    updateGrade,
    deleteGrade,
    setGradeEnabled,
    isGradeEnabled,
    calculateGPA,
    calculateF2,
    gradeColor,
    scoreToGPA
  }
})