import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AppSettings } from '@/types'

const STORAGE_KEY = 'ham_settings'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<AppSettings>({
    theme: 'system',
    primaryColor: '#409EFF',
    autoRefreshGrades: false,
    gradeNotification: true,
    dataSyncEnabled: false,
    biometricEnabled: false,
  })

  function loadFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        settings.value = { ...settings.value, ...JSON.parse(stored) }
      } catch {}
    }
    applyTheme()
  }

  function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value))
  }

  function updateSettings(updates: Partial<AppSettings>) {
    settings.value = { ...settings.value, ...updates }
    saveToStorage()
    applyTheme()
  }

  function applyTheme() {
    const html = document.documentElement
    if (settings.value.theme === 'dark' || (settings.value.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
    
    // Apply primary color
    html.style.setProperty('--el-color-primary', settings.value.primaryColor)
  }

  function resetToDefaults() {
    settings.value = {
      theme: 'system',
      primaryColor: '#409EFF',
      autoRefreshGrades: false,
      gradeNotification: true,
      dataSyncEnabled: false,
      biometricEnabled: false,
    }
    saveToStorage()
    applyTheme()
  }

  return {
    settings,
    loadFromStorage,
    saveToStorage,
    updateSettings,
    applyTheme,
    resetToDefaults,
  }
})