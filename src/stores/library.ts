import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { LibrarySeat, LibraryBooking } from '@/types'

const STORAGE_KEY = 'ham_library_bookings'
const FAVORITES_KEY = 'ham_library_favorites'

export const useLibraryStore = defineStore('library', () => {
  const bookings = ref<LibraryBooking[]>([])
  const favorites = ref<string[]>([])
  const preferredSeat = ref<{ libraryId: string; roomId: string; seatId: string } | null>(null)

  const libraries = [
    { id: 'lib1', name: '武汉大学图书馆', shortName: '总馆', floors: ['1F', '2F', '3F', '4F', '5F'] },
    { id: 'lib2', name: '武汉大学医学部图书馆', shortName: '医学馆', floors: ['1F', '2F', '3F', '4F'] },
    { id: 'lib3', name: '武汉大学城市设计学院图书馆', shortName: '城设馆', floors: ['1F', '2F'] }
  ]

  const rooms = [
    { libraryId: 'lib1', id: 'room101', name: '一楼大厅', seats: 120 },
    { libraryId: 'lib1', id: 'room102', name: '二楼自习室', seats: 80 },
    { libraryId: 'lib1', id: 'room103', name: '三楼研讨室', seats: 60 },
    { libraryId: 'lib1', id: 'room104', name: '四楼期刊室', seats: 40 },
    { libraryId: 'lib1', id: 'room105', name: '五楼特藏室', seats: 30 },
    { libraryId: 'lib2', id: 'room201', name: '一楼阅览室', seats: 100 },
    { libraryId: 'lib2', id: 'room202', name: '二楼电子阅览室', seats: 80 },
    { libraryId: 'lib2', id: 'room203', name: '三楼研讨室', seats: 50 },
    { libraryId: 'lib2', id: 'room204', name: '四楼期刊室', seats: 40 },
    { libraryId: 'lib3', id: 'room301', name: '一楼自习区', seats: 60 },
    { libraryId: 'lib3', id: 'room302', name: '二楼研讨室', seats: 40 }
  ]

  function loadFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        bookings.value = parsed.map((b: any) => ({
          ...b,
          startTime: new Date(b.startTime),
          endTime: new Date(b.endTime)
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

    const storedPref = localStorage.getItem('ham_library_preferred')
    if (storedPref) {
      try {
        preferredSeat.value = JSON.parse(storedPref)
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
    if (preferredSeat.value) {
      localStorage.setItem('ham_library_preferred', JSON.stringify(preferredSeat.value))
    }
  }

  function generateMockSeats(libraryId: string, roomId: string, date: Date): LibrarySeat[] {
    const room = rooms.find(r => r.libraryId === libraryId && r.id === roomId)
    if (!room) return []

    const seats: LibrarySeat[] = []
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    const cols = 15

    for (const row of rows) {
      for (let col = 1; col <= cols; col++) {
        if (seats.length >= room.seats) break
        
        const isBooked = bookings.value.some(b => 
          b.seat.library === libraryId && 
          b.seat.room === roomId && 
          b.seat.seatNumber === `${row}${col}` &&
          b.status === 'active' &&
          b.startTime <= date &&
          b.endTime >= date
        )

        const isFav = favorites.value.includes(`${libraryId}-${roomId}-${row}${col}`)

        seats.push({
          id: `${libraryId}-${roomId}-${row}${col}`,
          library: libraryId,
          floor: room.name.includes('一楼') ? '1F' : room.name.includes('二楼') ? '2F' : room.name.includes('三楼') ? '3F' : room.name.includes('四楼') ? '4F' : '5F',
          room: roomId,
          seatNumber: `${row}${col}`,
          status: isBooked ? 'booked' : isFav ? 'available' : Math.random() > 0.7 ? 'available' : 'full',
          startTime: isBooked ? date : undefined,
          endTime: isBooked ? new Date(date.getTime() + 3 * 60 * 60 * 1000) : undefined
        })
      }
      if (seats.length >= room.seats) break
    }

    return seats
  }

  function bookSeat(seat: LibrarySeat, startTime: Date, endTime: Date): LibraryBooking {
    const booking: LibraryBooking = {
      id: `booking_${Date.now()}`,
      seat,
      startTime,
      endTime,
      status: 'active'
    }
    bookings.value.push(booking)
    saveToStorage()
    return booking
  }

  function cancelBooking(bookingId: string) {
    const booking = bookings.value.find(b => b.id === bookingId)
    if (booking) {
      booking.status = 'cancelled'
      saveToStorage()
    }
  }

  function getActiveBookings(): LibraryBooking[] {
    const now = new Date()
    return bookings.value.filter(b => 
      b.status === 'active' && 
      b.startTime <= now && 
      b.endTime >= now
    )
  }

  function getUpcomingBookings(): LibraryBooking[] {
    const now = new Date()
    return bookings.value.filter(b => 
      b.status === 'active' && 
      b.startTime > now
    ).sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  }

  function getHistoryBookings(): LibraryBooking[] {
    const now = new Date()
    return bookings.value.filter(b => 
      b.status !== 'active' || b.endTime < now
    ).sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
  }

  function toggleFavorite(seatId: string) {
    const index = favorites.value.indexOf(seatId)
    if (index === -1) {
      favorites.value.push(seatId)
    } else {
      favorites.value.splice(index, 1)
    }
    saveFavorites()
  }

  function isFavorite(seatId: string): boolean {
    return favorites.value.includes(seatId)
  }

  function setPreferredSeat(libraryId: string, roomId: string, seatId: string) {
    preferredSeat.value = { libraryId, roomId, seatId }
    savePreferred()
  }

  function quickBook(preferredTime: Date): LibraryBooking | null {
    if (!preferredSeat.value) return null

    const seats = generateMockSeats(
      preferredSeat.value.libraryId,
      preferredSeat.value.roomId,
      preferredTime
    )

    const preferred = seats.find(s => s.seatNumber === preferredSeat.value!.seatId)
    if (preferred && preferred.status === 'available') {
      return bookSeat(preferred, preferredTime, new Date(preferredTime.getTime() + 3 * 60 * 60 * 1000))
    }

    const available = seats.find(s => s.status === 'available')
    if (available) {
      return bookSeat(available, preferredTime, new Date(preferredTime.getTime() + 3 * 60 * 60 * 1000))
    }

    return null
  }

  return {
    bookings,
    favorites,
    preferredSeat,
    libraries,
    rooms,
    loadFromStorage,
    generateMockSeats,
    bookSeat,
    cancelBooking,
    getActiveBookings,
    getUpcomingBookings,
    getHistoryBookings,
    toggleFavorite,
    isFavorite,
    setPreferredSeat,
    quickBook
  }
})