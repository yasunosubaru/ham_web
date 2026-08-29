import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { BusStop, BusRoute } from '@/types'

export const useBusStore = defineStore('bus', () => {
  const stops = ref<BusStop[]>([])
  const selectedStopId = ref<string | null>(null)

  const mockStops: BusStop[] = [
    {
      id: 'stop1',
      name: '珞珈山门',
      latitude: 30.5278,
      longitude: 114.3608,
      routes: [
        { id: 'r1', name: '校园巴士1号线', direction: '珞珈山门 → 信息学部', nextArrival: 3, subsequentArrivals: [15, 27, 39] },
        { id: 'r2', name: '校园巴士2号线', direction: '珞珈山门 → 医学部', nextArrival: 8, subsequentArrivals: [20, 32, 44] }
      ]
    },
    {
      id: 'stop2',
      name: '老斋舍',
      latitude: 30.5298,
      longitude: 114.3588,
      routes: [
        { id: 'r1', name: '校园巴士1号线', direction: '珞珈山门 → 信息学部', nextArrival: 5, subsequentArrivals: [17, 29, 41] },
        { id: 'r3', name: '校园巴士3号线', direction: '老斋舍 → 未来城', nextArrival: 2, subsequentArrivals: [14, 26, 38] }
      ]
    },
    {
      id: 'stop3',
      name: '新斋舍',
      latitude: 30.5318,
      longitude: 114.3568,
      routes: [
        { id: 'r1', name: '校园巴士1号线', direction: '珞珈山门 → 信息学部', nextArrival: 7, subsequentArrivals: [19, 31, 43] },
        { id: 'r2', name: '校园巴士2号线', direction: '珞珈山门 → 医学部', nextArrival: 10, subsequentArrivals: [22, 34, 46] }
      ]
    },
    {
      id: 'stop4',
      name: '信息学部',
      latitude: 30.5358,
      longitude: 114.3528,
      routes: [
        { id: 'r1', name: '校园巴士1号线', direction: '信息学部 → 珞珈山门', nextArrival: 4, subsequentArrivals: [16, 28, 40] },
        { id: 'r4', name: '校园巴士4号线', direction: '信息学部 → 计算机学院', nextArrival: 6, subsequentArrivals: [18, 30, 42] }
      ]
    },
    {
      id: 'stop5',
      name: '计算机学院',
      latitude: 30.5378,
      longitude: 114.3508,
      routes: [
        { id: 'r4', name: '校园巴士4号线', direction: '计算机学院 → 信息学部', nextArrival: 3, subsequentArrivals: [15, 27, 39] }
      ]
    },
    {
      id: 'stop6',
      name: '医学部',
      latitude: 30.5258,
      longitude: 114.3658,
      routes: [
        { id: 'r2', name: '校园巴士2号线', direction: '医学部 → 珞珈山门', nextArrival: 5, subsequentArrivals: [17, 29, 41] }
      ]
    },
    {
      id: 'stop7',
      name: '未来城',
      latitude: 30.5408,
      longitude: 114.3458,
      routes: [
        { id: 'r3', name: '校园巴士3号线', direction: '未来城 → 老斋舍', nextArrival: 8, subsequentArrivals: [20, 32, 44] }
      ]
    }
  ]

  function init() {
    stops.value = mockStops
    const stored = localStorage.getItem('ham_bus_selected_stop')
    if (stored) {
      selectedStopId.value = stored
    } else if (stops.value.length > 0) {
      selectedStopId.value = stops.value[0].id
    }
  }

  function selectStop(stopId: string) {
    selectedStopId.value = stopId
    localStorage.setItem('ham_bus_selected_stop', stopId)
  }

  function getSelectedStop(): BusStop | undefined {
    return stops.value.find(s => s.id === selectedStopId.value)
  }

  function getAllStops(): BusStop[] {
    return stops.value
  }

  function simulateRealTime() {
    stops.value = stops.value.map(stop => ({
      ...stop,
      routes: stop.routes.map(route => ({
        ...route,
        nextArrival: Math.max(1, route.nextArrival - 1),
        subsequentArrivals: route.subsequentArrivals.map(t => Math.max(1, t - 1))
      }))
    }))
  }

  return {
    stops,
    selectedStopId,
    init,
    selectStop,
    getSelectedStop,
    getAllStops,
    simulateRealTime
  }
})