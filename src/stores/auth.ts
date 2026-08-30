import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo, AuthState } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const isLoggedIn = ref(false)
  const userInfo = ref<UserInfo | null>(null)
  const casCookie = ref<string | null>(null)
  const sessionExpires = ref<number | null>(null)
  const loginLoading = ref(false)
  const loginError = ref<string | null>(null)

  const isSessionValid = computed(() => {
    if (!sessionExpires.value) return false
    return Date.now() < sessionExpires.value
  })

  function initAuth() {
    const storedCookie = localStorage.getItem('ham_cas_cookie')
    const storedUserInfo = localStorage.getItem('ham_user_info')
    const storedExpires = localStorage.getItem('ham_session_expires')

    if (storedCookie) {
      casCookie.value = storedCookie
    }
    if (storedUserInfo) {
      try {
        userInfo.value = JSON.parse(storedUserInfo)
        isLoggedIn.value = true
      } catch {
        localStorage.removeItem('ham_user_info')
      }
    }
    if (storedExpires) {
      sessionExpires.value = parseInt(storedExpires)
    }
  }

  function setLoginState(user: UserInfo, cookie: string, expiresInHours = 24) {
    isLoggedIn.value = true
    userInfo.value = user
    casCookie.value = cookie
    sessionExpires.value = Date.now() + expiresInHours * 60 * 60 * 1000

    localStorage.setItem('ham_user_info', JSON.stringify(user))
    localStorage.setItem('ham_cas_cookie', cookie)
    localStorage.setItem('ham_session_expires', sessionExpires.value.toString())
  }

  function logout() {
    isLoggedIn.value = false
    userInfo.value = null
    casCookie.value = null
    sessionExpires.value = null

    localStorage.removeItem('ham_user_info')
    localStorage.removeItem('ham_cas_cookie')
    localStorage.removeItem('ham_session_expires')
    localStorage.removeItem('ham_token')
  }

  function updateUserInfo(updates: Partial<UserInfo>) {
    if (userInfo.value) {
      userInfo.value = { ...userInfo.value, ...updates }
      localStorage.setItem('ham_user_info', JSON.stringify(userInfo.value))
    }
  }

  function setLoginLoading(loading: boolean) {
    loginLoading.value = loading
  }

  function setLoginError(error: string | null) {
    loginError.value = error
  }

  return {
    isLoggedIn,
    userInfo,
    casCookie,
    sessionExpires,
    loginLoading,
    loginError,
    isSessionValid,
    initAuth,
    setLoginState,
    logout,
    updateUserInfo,
    setLoginLoading,
    setLoginError,
  }
})