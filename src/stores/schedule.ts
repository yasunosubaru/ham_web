import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Schedule, ScheduleGroup, RepeatRule } from '@/types'

const STORAGE_KEY = 'ham_schedules'
const GROUPS_KEY = 'ham_schedule_groups'

export const useScheduleStore = defineStore('schedule', () => {
  const schedules = ref<Schedule[]>([])
  const groups = ref<ScheduleGroup[]>([
    { id: 'default', name: '默认', icon: 'Document', color: '#409EFF' },
    { id: 'study', name: '学习', icon: 'Reading', color: '#67C23A' },
    { id: 'life', name: '生活', icon: 'House', color: '#E6A23C' },
    { id: 'course', name: '课程相关', icon: 'Book', color: '#F56C6C' }
  ])

  function loadFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        schedules.value = parsed.map((s: any) => ({
          ...s,
          startTime: new Date(s.startTime),
          endTime: s.endTime ? new Date(s.endTime) : undefined,
          repeatRule: s.repeatRule ? {
            ...s.repeatRule,
            endDate: s.repeatRule.endDate ? new Date(s.repeatRule.endDate) : undefined
          } : undefined
        }))
      } catch {
        schedules.value = []
      }
    }

    const storedGroups = localStorage.getItem(GROUPS_KEY)
    if (storedGroups) {
      try {
        groups.value = [...groups.value, ...JSON.parse(storedGroups)]
      } catch {}
    }
  }

  function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules.value))
  }

  function saveGroups() {
    const customGroups = groups.value.filter(g => !['default', 'study', 'life', 'course'].includes(g.id))
    localStorage.setItem(GROUPS_KEY, JSON.stringify(customGroups))
  }

  function addSchedule(schedule: Schedule) {
    schedules.value.push(schedule)
    saveToStorage()
  }

  function updateSchedule(id: string, updates: Partial<Schedule>) {
    const index = schedules.value.findIndex(s => s.id === id)
    if (index !== -1) {
      schedules.value[index] = { ...schedules.value[index], ...updates }
      saveToStorage()
    }
  }

  function deleteSchedule(id: string, deleteAllRepeats = false) {
    const schedule = schedules.value.find(s => s.id === id)
    if (!schedule || !schedule.repeatRule || !deleteAllRepeats) {
      schedules.value = schedules.value.filter(s => s.id !== id)
      saveToStorage()
      return
    }

    const baseStartTime = schedule.startTime.getTime()
    schedules.value = schedules.value.filter(s => {
      if (s.id === id) return false
      if (s.repeatRule && s.startTime.getTime() > baseStartTime && 
          s.title === schedule.title && s.location === schedule.location) {
        return false
      }
      return true
    })
    saveToStorage()
  }

  function toggleComplete(id: string) {
    const schedule = schedules.value.find(s => s.id === id)
    if (schedule) {
      schedule.completed = !schedule.completed
      saveToStorage()
    }
  }

  function getSchedulesForDate(date: Date): Schedule[] {
    const targetTime = date.getTime()
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    return schedules.value.filter(s => {
      if (s.completed && s.startTime < startOfDay) return false
      
      if (s.repeatRule) {
        return isScheduleOnDate(s, targetTime, startOfDay, endOfDay)
      }
      
      return s.startTime >= startOfDay && s.startTime <= endOfDay
    }).sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  }

  function isScheduleOnDate(schedule: Schedule, targetTime: number, _startOfDay: Date, endOfDay: Date): boolean {
    const { repeatRule, startTime } = schedule
    if (!repeatRule) return false

    if (startTime > endOfDay) return false
    if (repeatRule.endDate && startTime > repeatRule.endDate) return false

    const diffDays = Math.floor((targetTime - startTime.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return false

    switch (repeatRule.frequency) {
      case 'daily':
        return diffDays % repeatRule.interval === 0
      case 'weekly':
        const weekDiff = Math.floor(diffDays / 7)
        if (weekDiff % repeatRule.interval !== 0) return false
        const dayOfWeek = new Date(targetTime).getDay()
        return repeatRule.daysOfWeek?.includes(dayOfWeek === 0 ? 7 : dayOfWeek) ?? true
      case 'monthly':
        const startMonth = startTime.getMonth()
        const targetMonth = new Date(targetTime).getMonth()
        const monthDiff = (targetMonth - startMonth) + 12 * (new Date(targetTime).getFullYear() - startTime.getFullYear())
        if (monthDiff % repeatRule.interval !== 0) return false
        return startTime.getDate() === new Date(targetTime).getDate()
      default:
        return false
    }
  }

  function getUpcomingSchedules(limit = 5): Schedule[] {
    const now = Date.now()
    return schedules.value
      .filter(s => !s.completed && s.startTime.getTime() > now)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
      .slice(0, limit)
  }

  function getOverdueSchedules(): Schedule[] {
    const now = Date.now()
    return schedules.value
      .filter(s => !s.completed && s.startTime.getTime() < now)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
  }

  function addGroup(group: Omit<ScheduleGroup, 'id'>) {
    const newGroup: ScheduleGroup = {
      ...group,
      id: `custom_${Date.now()}`
    }
    groups.value.push(newGroup)
    saveGroups()
    return newGroup
  }

  function deleteGroup(id: string) {
    if (['default', 'study', 'life', 'course'].includes(id)) return
    groups.value = groups.value.filter(g => g.id !== id)
    schedules.value = schedules.value.map(s => s.groupId === id ? { ...s, groupId: 'default' } : s)
    saveGroups()
    saveToStorage()
  }

  function getGroupById(id: string) {
    return groups.value.find(g => g.id === id)
  }

  return {
    schedules,
    groups,
    loadFromStorage,
    saveToStorage,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    toggleComplete,
    getSchedulesForDate,
    getUpcomingSchedules,
    getOverdueSchedules,
    addGroup,
    deleteGroup,
    getGroupById
  }
})