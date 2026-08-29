import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isLoggedIn = computed(() => !!user.value)
  const token = ref<string | null>(localStorage.getItem('ham_token'))

  function initAuth() {
    const stored = localStorage.getItem('ham_user')
    if (stored) {
      try {
        user.value = JSON.parse(stored)
      } catch {
        localStorage.removeItem('ham_user')
      }
    }
  }

  function login(userData: User, authToken: string) {
    user.value = userData
    token.value = authToken
    localStorage.setItem('ham_user', JSON.stringify(userData))
    localStorage.setItem('ham_token', authToken)
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('ham_user')
    localStorage.removeItem('ham_token')
  }

  function updateUser(updates: Partial<User>) {
    if (user.value) {
      user.value = { ...user.value, ...updates }
      localStorage.setItem('ham_user', JSON.stringify(user.value))
    }
  }

  return {
    user,
    isLoggedIn,
    token,
    login,
    logout,
    updateUser,
    initAuth
  }
})