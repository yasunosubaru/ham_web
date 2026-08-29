import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { SportVenue, SportSession } from '@/types'

const STORAGE_KEY = 'ham_sport_bookings'
const FAVORITES_KEY = 'ham_sport_favorites'

export const useSportStore = defineStore('sport', () => {
  const bookings = ref<SportSession[]>([])
  const favorites = ref<string[]>([])
  const preferredVenue = ref<{ venueId: string; court: string; timeSlot: string } | null>(null)

  const venues: SportVenue[] = [
    { id: 'venue1', name: '武汉大学体育馆', sportType: '综合', address: '武汉大学本部体育馆' },
    { id: 'venue2', name: '武汉大学网球场', sportType: '网球', address: '武汉大学本部网球场' },
    { id: 'venue3', name: '武汉大学羽毛球馆', sportType: '羽毛球', address: '武汉大学本部羽毛球馆' },
    { id: 'venue4', name: '武汉大学游泳馆', sportType: '游泳', address: '武汉大学本部游泳馆' },
    { id: 'venue5', name: '武汉大学足球场', sportType: '足球', address: '武汉大学本部足球场' },
    { id: 'venue6', name: '武汉大学篮球场', sportType: '篮球', address: '武汉大学本部篮球场' }
  ]

  const courts = {
    venue1: ['主场馆', '副场馆A', '副场馆B'],
    venue2: ['1号场', '2号场', '3号场', '4号场'],
    venue3: ['1号馆', '2号馆', '3号馆'],
    venue4: ['标准池', '训练池'],
    venue5: ['A场', 'B场'],
    venue6: ['室内篮球场', '室外篮球场']
  }

  const timeSlots = [
    '06:00-07:00', '07:00-08:00', '08:00-09:00', '09:00-10:00',
    '10:00-11:00', '11:00-12:00', '14:00-15:00', '15:00-16:00',
    '16:00-17:00', '17:00-18:00', '18:00-19:00', '19:00-20:00',
    '20:00-21:00', '21:00-22:00'
  ]

  function loadFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        bookings.value = parsed.map((b: any) => ({
          ...b,
          date: new Date(b.date)
        }))
      } catch {
        bookings.value = []
      }
    }

    const storedFav = localStorage.getItem(FAVORITES_KEY)
    if (storedFav) {
      try {
        favorites.value = JSON.parse(storedFav)
      } catch {
        favorites.value = []
      }
    }

    const storedPref = localStorage.getItem('ham_sport_preferred')
    if (storedPref) {
      try {
        preferredVenue.value = JSON.parse(storedPref)
      } catch {}
    }
  }

  function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings.value))
  }

  function saveFavorites() {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites.value))
  }

  function savePreferred() {
    if (preferredVenue.value) {
      localStorage.setItem('ham_sport_preferred', JSON.stringify(preferredVenue.value))
    }
  }

  function generateSessions(venueId: string, date: Date): SportSession[] {
    const venueCourts = courts[venueId as keyof typeof courts] || []
    const sessions: SportSession[] = []

    for (const court of venueCourts) {
      for (const timeSlot of timeSlots) {
        const isBooked = bookings.value.some(b => 
          b.venueId === venueId && 
          b.court === court &&
          b.date.toDateString() === date.toDateString() &&
          b.startTime === timeSlot.split('-')[0] &&
          b.status === 'booked'
        )

        const favKey = `${venueId}-${court}-${timeSlot}`
        const isFav = favorites.value.includes(favKey)

        sessions.push({
          id: `${venueId}-${court}-${timeSlot}-${date.toISOString().split('T')[0]}`,
          venueId,
          court,
          date: new Date(date),
          startTime: timeSlot.split('-')[0],
          endTime: timeSlot.split('-')[1],
          status: isBooked ? 'booked' : isFav ? 'available' : Math.random() > 0.6 ? 'available' : 'full',
          price: 10 + Math.floor(Math.random() * 20)
        })
      }
    }

    return sessions
  }

  function bookSession(session: SportSession): SportSession {
    const bookedSession = { ...session, status: 'booked' as const }
    bookings.value.push(bookedSession)
    saveToStorage()
    return bookedSession
  }

  function cancelBooking(sessionId: string) {
    const index = bookings.value.findIndex(b => b.id === sessionId)
    if (index !== -1) {
      bookings.value[index].status = 'available'
      saveToStorage()
    }
  }

  function getActiveBookings(): SportSession[] {
    const now = new Date()
    return bookings.value.filter(b => 
      b.status === 'booked' && 
      b.date >= now
    ).sort((a, b) => a.date.getTime() - b.date.getTime() || a.startTime.localeCompare(b.startTime))
  }

  function getHistoryBookings(): SportSession[] {
    const now = new Date()
    return bookings.value.filter(b => 
      b.status !== 'booked' || b.date < now
    ).sort((a, b) => b.date.getTime() - a.date.getTime())
  }

  function toggleFavorite(venueId: string, court: string, timeSlot: string) {
    const key = `${venueId}-${court}-${timeSlot}`
    const index = favorites.value.indexOf(key)
    if (index === -1) {
      favorites.value.push(key)
    } else {
      favorites.value.splice(index, 1)
    }
    saveFavorites()
  }

  function isFavorite(venueId: string, court: string, timeSlot: string): boolean {
    return favorites.value.includes(`${venueId}-${court}-${timeSlot}`)
  }

  function setPreferredVenue(venueId: string, court: string, timeSlot: string) {
    preferredVenue.value = { venueId, court, timeSlot }
    savePreferred()
  }

  function quickBook(date: Date): SportSession | null {
    if (!preferredVenue.value) return null

    const sessions = generateSessions(preferredVenue.value.venueId, date)
    const preferred = sessions.find(s => 
      s.court === preferredVenue.value!.court && 
      s.startTime === preferredVenue.value!.timeSlot.split('-')[0]
    )

    if (preferred && preferred.status === 'available') {
      return bookSession(preferred)
    }

    const available = sessions.find(s => s.status === 'available')
    if (available) {
      return bookSession(available)
    }

    return null
  }

  return {
    bookings,
    favorites,
    preferredVenue,
    venues,
    courts,
    timeSlots,
    loadFromStorage,
    generateSessions,
    bookSession,
    cancelBooking,
    getActiveBookings,
    getHistoryBookings,
    toggleFavorite,
    isFavorite,
    setPreferredVenue,
    quickBook
  }
})