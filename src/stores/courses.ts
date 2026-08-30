import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CourseItem } from '@/types'

const STORAGE_KEY = 'ham_courses'
const SETTINGS_KEY = 'ham_course_settings'

export interface CourseSettings {
  semesterStartDate: string
  backgroundImage?: string
  courseOpacity: number
  showWeekends: boolean
  currentWeek: number
}

export const useCourseStore = defineStore('course', () => {
  const courses = ref<CourseItem[]>([])
  const settings = ref<CourseSettings>({
    semesterStartDate: '',
    courseOpacity: 0.9,
    showWeekends: false,
    currentWeek: 1,
  })

  const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const periods = Array.from({ length: 12 }, (_, i) => i + 1)
  const periodTimes = [
    '08:00-08:45', '08:55-09:40', '09:50-10:35', '10:45-11:30',
    '11:40-12:25', '13:30-14:15', '14:25-15:10', '15:20-16:05',
    '16:15-17:00', '17:10-17:55', '18:30-19:15', '19:25-20:10',
  ]

  function loadFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        courses.value = JSON.parse(stored)
      } catch {
        courses.value = []
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courses.value))
  }

  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings.value))
  }

  function addCourse(course: CourseItem) {
    courses.value.push(course)
    saveToStorage()
  }

  function updateCourse(id: string, updates: Partial<CourseItem>) {
    const index = courses.value.findIndex(c => c.id === id)
    if (index !== -1) {
      courses.value[index] = { ...courses.value[index], ...updates }
      saveToStorage()
    }
  }

  function deleteCourse(id: string) {
    courses.value = courses.value.filter(c => c.id !== id)
    saveToStorage()
  }

  function deleteCoursesByNameAndTime(name: string, dayOfWeek: number, startPeriod: number, endPeriod: number) {
    courses.value = courses.value.filter(c => 
      !(c.name === name && c.dayOfWeek === dayOfWeek && c.startPeriod === startPeriod && c.endPeriod === endPeriod)
    )
    saveToStorage()
  }

  function deleteAllCoursesByName(name: string) {
    courses.value = courses.value.filter(c => c.name !== name)
    saveToStorage()
  }

  function getCoursesForWeek(week: number): CourseItem[] {
    return courses.value.filter(c => c.weeks.includes(week))
  }

  function getCoursesForDay(week: number, dayOfWeek: number): CourseItem[] {
    return getCoursesForWeek(week).filter(c => c.dayOfWeek === dayOfWeek)
  }

  function getCourseAtPeriod(week: number, dayOfWeek: number, period: number): CourseItem | null {
    const dayCourses = getCoursesForDay(week, dayOfWeek)
    return dayCourses.find(c => c.startPeriod <= period && c.endPeriod >= period) || null
  }

  function getCurrentWeek(): number {
    if (!settings.value.semesterStartDate) return settings.value.currentWeek
    const start = new Date(settings.value.semesterStartDate)
    const now = new Date()
    const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7))
    return Math.max(1, Math.min(20, diff + 1))
  }

  return {
    courses,
    settings,
    weekDays,
    periods,
    periodTimes,
    loadFromStorage,
    saveToStorage,
    saveSettings,
    addCourse,
    updateCourse,
    deleteCourse,
    deleteCoursesByNameAndTime,
    deleteAllCoursesByName,
    getCoursesForWeek,
    getCoursesForDay,
    getCourseAtPeriod,
    getCurrentWeek,
  }
})