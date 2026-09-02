import requestService from './request'

export interface LibraryBuilding {
  id: string
  name: string
  icon: string
  avail: number
  floors: string[]
}

export interface LibraryReservation {
  building: string
  seat: string
  timeSlot: string
  date: string
}

export class LibraryApi {
  static async getBuildings(): Promise<LibraryBuilding[]> {
    try {
      const response = await requestService.proxyGet<LibraryBuilding[]>('/ham/library/buildings')
      return response || []
    } catch (error) {
      console.error('Get library buildings failed:', error)
      return []
    }
  }

  static async reserve(data: { buildingId: string; buildingName: string; floor?: string; seatNumber: string; timeSlot: string; date: string }): Promise<boolean> {
    try {
      await requestService.proxyPost('/ham/library/reserve', data)
      return true
    } catch (error) {
      console.error('Library reserve failed:', error)
      throw error
    }
  }

  static async getReservation(): Promise<LibraryReservation | null> {
    try {
      const response = await requestService.proxyGet<LibraryReservation>('/ham/library/reservation')
      return response
    } catch (error) {
      console.error('Get library reservation failed:', error)
      return null
    }
  }

  static async cancelReservation(): Promise<boolean> {
    try {
      await requestService.proxyDelete('/ham/library/reservation')
      return true
    } catch (error) {
      console.error('Cancel library reservation failed:', error)
      throw error
    }
  }
}

export default LibraryApi