import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { GradeDistributionApi } from '@/api/gradeDistribution'
import type { GradeDistributionResult, TeacherRating, GradeDistributionQuery } from '@/types'

export const useGradeDistributionStore = defineStore('gradeDistribution', () => {
  const searchResults = ref<GradeDistributionResult | null>(null)
  const teacherInfo = ref<{ name: string; department: string; college: string; courses: string[] } | null>(null)
  const teacherRatings = ref<TeacherRating[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const searchHistory = ref<string[]>([])
  const myRatings = ref<TeacherRating[]>([])

  const hasResults = computed(() => searchResults.value !== null)

  function loadFromStorage() {
    const history = localStorage.getItem('ham_grade_search_history')
    if (history) {
      try {
        searchHistory.value = JSON.parse(history)
      } catch {}
    }

    const ratings = localStorage.getItem('ham_my_ratings')
    if (ratings) {
      try {
        myRatings.value = JSON.parse(ratings)
      } catch {}
    }
  }

  function saveHistory() {
    localStorage.setItem('ham_grade_search_history', JSON.stringify(searchHistory.value))
  }

  function saveMyRatings() {
    localStorage.setItem('ham_my_ratings', JSON.stringify(myRatings.value))
  }

  async function search(query: GradeDistributionQuery) {
    loading.value = true
    error.value = null
    searchResults.value = null
    teacherInfo.value = null
    teacherRatings.value = []

    try {
      const result = await GradeDistributionApi.search(query)
      searchResults.value = result

      if (result) {
        // Add to search history
        const queryStr = query.courseName || query.teacherName || ''
        if (queryStr && !searchHistory.value.includes(queryStr)) {
          searchHistory.value.unshift(queryStr)
          if (searchHistory.value.length > 20) searchHistory.value.pop()
          saveHistory()
        }

        // Fetch teacher info if searching by teacher
        if (query.teacherName) {
          teacherInfo.value = await GradeDistributionApi.getTeacherInfo(query.teacherName)
          teacherRatings.value = await GradeDistributionApi.getTeacherRatings(query.teacherName, query.courseName)
        } else if (result.teacherName) {
          teacherInfo.value = await GradeDistributionApi.getTeacherInfo(result.teacherName)
          teacherRatings.value = await GradeDistributionApi.getTeacherRatings(result.teacherName, result.courseName)
        }
      }
    } catch (err: any) {
      error.value = err.message || '查询失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function submitRating(rating: Omit<TeacherRating, 'id' | 'createdAt'>) {
    loading.value = true
    try {
      const newRating = await GradeDistributionApi.submitRating(rating)
      myRatings.value.unshift(newRating)
      saveMyRatings()
      
      // Update local ratings if viewing this teacher
      if (teacherRatings.value.length > 0) {
        teacherRatings.value.unshift(newRating)
      }
      return newRating
    } catch (err: any) {
      error.value = err.message || '提交评价失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function uploadMyGrades(grades: any[]) {
    loading.value = true
    try {
      await GradeDistributionApi.uploadGrades(grades)
      return true
    } catch (err: any) {
      error.value = err.message || '上传成绩失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  function clearResults() {
    searchResults.value = null
    teacherInfo.value = null
    teacherRatings.value = []
    error.value = null
  }

  function clearHistory() {
    searchHistory.value = []
    saveHistory()
  }

  return {
    searchResults,
    teacherInfo,
    teacherRatings,
    loading,
    error,
    searchHistory,
    myRatings,
    hasResults,
    loadFromStorage,
    search,
    submitRating,
    uploadMyGrades,
    clearResults,
    clearHistory,
  }
})