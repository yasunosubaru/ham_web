import { ref, watchEffect } from 'vue'

const STORAGE_KEY = 'ham_dark_mode'

function getInitialValue(): boolean {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored !== null) return stored === 'true'
  // Default: follow system preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

const isDark = ref(getInitialValue())

export function useDarkMode() {
  function toggle() {
    isDark.value = !isDark.value
  }

  function setDark(value: boolean) {
    isDark.value = value
  }

  // Sync to DOM and localStorage whenever isDark changes
  watchEffect(() => {
    const dark = isDark.value
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem(STORAGE_KEY, String(dark))
    // Update theme-color meta for iOS status bar
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      meta.setAttribute('content', dark ? '#1a1a2e' : '#409EFF')
    }
  })

  return { isDark, toggle, setDark }
}
