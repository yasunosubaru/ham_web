import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Weather, WeatherForecast } from '@/types'

export const useWeatherStore = defineStore('weather', () => {
  const weather = ref<Weather | null>(null)
  const lastUpdated = ref<number>(0)
  const isLoading = ref(false)

  const mockConditions = [
    { condition: '晴', icon: '☀️' },
    { condition: '多云', icon: '⛅' },
    { condition: '阴', icon: '☁️' },
    { condition: '小雨', icon: '🌧️' },
    { condition: '中雨', icon: '🌧️' },
    { condition: '雷阵雨', icon: '⛈️' },
    { condition: '雾', icon: '🌫️' }
  ]

  async function fetchWeather() {
    isLoading.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const temp = 15 + Math.floor(Math.random() * 15)
      const condition = mockConditions[Math.floor(Math.random() * mockConditions.length)]
      
      const forecast: WeatherForecast[] = []
      for (let i = 0; i < 7; i++) {
        const date = new Date()
        date.setDate(date.getDate() + i)
        const fc = mockConditions[Math.floor(Math.random() * mockConditions.length)]
        forecast.push({
          date,
          high: temp + Math.floor(Math.random() * 5),
          low: temp - Math.floor(Math.random() * 5),
          condition: fc.condition,
          icon: fc.icon
        })
      }

      weather.value = {
        temperature: temp,
        condition: condition.condition,
        icon: condition.icon,
        humidity: 40 + Math.floor(Math.random() * 40),
        windSpeed: Math.floor(Math.random() * 20),
        forecast
      }
      lastUpdated.value = Date.now()
    } catch (error) {
      console.error('Failed to fetch weather:', error)
    } finally {
      isLoading.value = false
    }
  }

  function init() {
    const stored = localStorage.getItem('ham_weather')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        weather.value = {
          ...parsed,
          forecast: parsed.forecast.map((f: any) => ({ ...f, date: new Date(f.date) }))
        }
        lastUpdated.value = parsed.lastUpdated || 0
      } catch {}
    }

    if (!weather.value || Date.now() - lastUpdated.value > 30 * 60 * 1000) {
      fetchWeather()
    }
  }

  function saveToStorage() {
    if (weather.value) {
      localStorage.setItem('ham_weather', JSON.stringify({
        ...weather.value,
        lastUpdated: lastUpdated.value
      }))
    }
  }

  return {
    weather,
    isLoading,
    fetchWeather,
    init,
    saveToStorage
  }
})