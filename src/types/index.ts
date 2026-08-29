export interface Course {
  id: string
  name: string
  teacher: string
  location: string
  dayOfWeek: number
  startPeriod: number
  endPeriod: number
  startWeek: number
  endWeek: number
  color: string
  credit?: number
  type?: string
  weeks: number[]
}

export interface Grade {
  id: string
  courseName: string
  teacher: string
  credit: number
  score: number
  gpa: number
  type: 'required' | 'elective' | 'general' | 'cross'
  semester: string
  year: number
  term: number
}

export interface Schedule {
  id: string
  title: string
  location?: string
  note?: string
  startTime: Date
  endTime?: Date
  groupId?: string
  reminderMinutes?: number
  repeatRule?: RepeatRule
  courseId?: string
  completed: boolean
}

export interface RepeatRule {
  frequency: 'daily' | 'weekly' | 'monthly'
  interval: number
  endDate?: Date
  daysOfWeek?: number[]
}

export interface ScheduleGroup {
  id: string
  name: string
  icon: string
  color: string
}

export interface LibrarySeat {
  id: string
  library: string
  floor: string
  room: string
  seatNumber: string
  status: 'available' | 'booked' | 'full' | 'maintenance'
  startTime?: Date
  endTime?: Date
}

export interface LibraryBooking {
  id: string
  seat: LibrarySeat
  startTime: Date
  endTime: Date
  status: 'active' | 'completed' | 'cancelled' | 'expired'
}

export interface SportVenue {
  id: string
  name: string
  sportType: string
  address: string
  image?: string
}

export interface SportSession {
  id: string
  venueId: string
  court: string
  date: Date
  startTime: string
  endTime: string
  status: 'available' | 'booked' | 'full'
  price: number
}

export interface BusStop {
  id: string
  name: string
  latitude: number
  longitude: number
  routes: BusRoute[]
}

export interface BusRoute {
  id: string
  name: string
  direction: string
  nextArrival: number
  subsequentArrivals: number[]
}

export interface Weather {
  temperature: number
  condition: string
  icon: string
  humidity: number
  windSpeed: number
  forecast: WeatherForecast[]
}

export interface WeatherForecast {
  date: Date
  high: number
  low: number
  condition: string
  icon: string
}

export interface User {
  id: string
  studentId: string
  name: string
  avatar?: string
  college: string
  major: string
  grade: string
  casUsername?: string
}

export interface GPAResult {
  gpa: number
  totalCredits: number
  earnedCredits: number
  weightedScore: number
  f2Score?: number
  f2Detail?: {
    b1: number
    b2: number
    selectedElectives: Grade[]
  }
}

export interface GradeDistribution {
  courseName: string
  teacher: string
  total: number
  distribution: {
    range: string
    count: number
    percentage: number
  }[]
  average: number
  median: number
}