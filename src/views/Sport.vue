<template>
  <div class="sport-page">
    <!-- Sport type filter -->
    <div class="filter-bar">
      <div
        v-for="filter in filters"
        :key="filter.value"
        class="filter-chip"
        :class="{ active: currentFilter === filter.value }"
        @click="currentFilter = filter.value"
      >
        {{ filter.icon }} {{ filter.label }}
      </div>
    </div>

    <!-- Venue list -->
    <div v-for="venue in filteredVenues" :key="venue.id" class="sport-card">
      <div class="sport-header">
        <div class="sport-name">{{ venue.icon }} {{ venue.name }}</div>
        <span class="sport-badge" :class="venue.available ? 'available' : 'full'">
          {{ venue.available ? '可预订' : '已满' }}
        </span>
      </div>
      <div class="sport-sessions">
        <div
          v-for="(slot, idx) in venue.slots"
          :key="idx"
          class="time-chip"
          :class="{ disabled: !venue.available && idx > 1 }"
          @click="venue.available && bookVenue(venue, slot)"
        >
          {{ slot }}
        </div>
      </div>
    </div>

    <!-- Book dialog -->
    <el-dialog v-model="showBookDialog" title="确认预定" width="90%">
      <div v-if="bookingVenue" style="text-align:center">
        <div style="font-size:48px;margin-bottom:8px">{{ bookingVenue.icon }}</div>
        <div style="font-size:18px;font-weight:600">{{ bookingVenue.name }}</div>
        <div style="font-size:14px;color:#606266;margin-top:4px">{{ bookingSlot }}</div>
        <div style="font-size:13px;color:#909399;margin-top:4px">{{ todayStr }}</div>
      </div>
      <template #footer>
        <el-button @click="showBookDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmBooking">确认预定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Venue {
  id: number
  name: string
  type: string
  icon: string
  slots: string[]
  available: boolean
}

const venues: Venue[] = [
  { id: 1, name: '奥场篮球场', type: 'basketball', icon: '🏀', slots: ['08:00-10:00', '10:00-12:00', '14:00-16:00', '16:00-18:00', '19:00-21:00'], available: true },
  { id: 2, name: '桂园羽毛球馆', type: 'badminton', icon: '🏸', slots: ['09:00-11:00', '11:00-13:00', '14:00-16:00', '16:00-18:00'], available: true },
  { id: 3, name: '游泳馆', type: 'swimming', icon: '🏊', slots: ['06:30-08:30', '12:00-14:00', '17:00-19:00', '19:00-21:00'], available: false },
  { id: 4, name: '网球场A', type: 'tennis', icon: '🎾', slots: ['08:00-10:00', '10:00-12:00', '14:00-16:00'], available: true },
  { id: 5, name: '网球场B', type: 'tennis', icon: '🎾', slots: ['08:00-10:00', '16:00-18:00', '18:00-20:00'], available: true },
  { id: 6, name: '梅操篮球场', type: 'basketball', icon: '🏀', slots: ['09:00-11:00', '15:00-17:00', '19:00-21:00'], available: true },
]

const filters = [
  { value: 'all', label: '全部', icon: '' },
  { value: 'basketball', label: '篮球', icon: '🏀' },
  { value: 'badminton', label: '羽毛球', icon: '🏸' },
  { value: 'swimming', label: '游泳', icon: '🏊' },
  { value: 'tennis', label: '网球', icon: '🎾' },
]

const currentFilter = ref('all')
const showBookDialog = ref(false)
const bookingVenue = ref<Venue | null>(null)
const bookingSlot = ref('')

const filteredVenues = computed(() => {
  if (currentFilter.value === 'all') return venues
  return venues.filter(v => v.type === currentFilter.value)
})

const todayStr = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
})

function bookVenue(venue: Venue, slot: string) {
  bookingVenue.value = venue
  bookingSlot.value = slot
  showBookDialog.value = true
}

function confirmBooking() {
  showBookDialog.value = false
  bookingVenue.value = null
  bookingSlot.value = ''
}
</script>

<style lang="scss" scoped>
.sport-page {
  padding-bottom: 80px;
}

.filter-bar {
  display: flex;
  gap: 8px;
  padding: 12px;
  overflow-x: auto;
}

.filter-chip {
  flex-shrink: 0;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  background: white;
  border: 1.5px solid #e4e7ed;
  cursor: pointer;
  transition: all 0.2s;

  &.active {
    background: #409EFF;
    color: white;
    border-color: #409EFF;
  }

  &:active { transform: scale(0.95); }
}

.sport-card {
  background: white;
  border-radius: 14px;
  padding: 16px;
  margin: 0 12px 10px;
  border: 1px solid #e4e7ed;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.sport-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.sport-name {
  font-size: 15px;
  font-weight: 600;
}

.sport-badge {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 20px;
  font-weight: 500;

  &.available {
    background: #f0f9eb;
    color: #67C23A;
  }

  &.full {
    background: #fef0f0;
    color: #F56C6C;
  }
}

.sport-sessions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.time-chip {
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 12px;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  cursor: pointer;
  transition: all 0.2s;

  &:active { transform: scale(0.95); }

  &.disabled {
    opacity: 0.4;
    pointer-events: none;
  }
}
</style>
