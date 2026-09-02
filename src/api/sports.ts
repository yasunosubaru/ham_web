import requestService from './request'

export interface SportsVenue {
  id: number
  name: string
  type: string
  icon: string
  slots: string[]
  available: boolean
}

export interface SportsBooking {
  venueName: string
  venueType: string
  timeSlot: string
  date: string
}

export class SportsApi {
  static async getVenues(): Promise<SportsVenue[]> {
    try {
      const response = await requestService.proxyGet<SportsVenue[]>('/ham/sports/venues')
      return response || []
    } catch (error) {
      console.error('Get sports venues failed:', error)
      return []
    }
  }

  static async book(data: { venueId: number; venueName: string; venueType: string; timeSlot: string; date: string }): Promise<boolean> {
    try {
      await requestService.proxyPost('/ham/sports/book', data)
      return true
    } catch (error) {
      console.error('Sports book failed:', error)
      throw error
    }
  }

  static async getBooking(): Promise<SportsBooking | null> {
    try {
      const response = await requestService.proxyGet<SportsBooking>('/ham/sports/booking')
      return response
    } catch (error) {
      console.error('Get sports booking failed:', error)
      return null
    }
  }
}

export default SportsApi