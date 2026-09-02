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
    <div v-if="loading" class="loading-state" style="padding: 20px; text-align: center;">
      <el-icon><Loading class="is-rotating" /></el-icon>
      <span>正在加载场馆...</span>
    </div>
    
    <div v-else v-for="venue in filteredVenues" :key="venue.id" class="sport-card">
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
          :class="{ disabled: !venue.available || bookingLoading === venue.id + '-' + idx }"
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
        <el-button type="primary" @click="confirmBooking" :loading="bookingLoading">确认预定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { SportsApi, type SportsVenue } from '@/api/sports'

const filters = [
  { value: 'all', label: '全部', icon: '' },
  { value: 'basketball', label: '篮球', icon: '🏀' },
  { value: 'badminton', label: '羽毛球', icon: '🏸' },
  { value: 'swimming', label: '游泳', icon: '🏊' },
  { value: 'tennis', label: '网球', icon: '🎾' },
]

const currentFilter = ref('all')
const loading = ref(false)
const showBookDialog = ref(false)
const bookingVenue = ref<SportsVenue | null>(null)
const bookingSlot = ref('')
const bookingLoading = ref<string>('')
const venues = ref<SportsVenue[]>([])

const filteredVenues = computed(() => {
  if (currentFilter.value === 'all') return venues.value
  return venues.value.filter(v => v.type === currentFilter.value)
})

const todayStr = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
})

onMounted(async () => {
  await loadVenues()
})

async function loadVenues() {
  loading.value = true
  try {
    const data = await SportsApi.getVenues()
    if (data.length > 0) {
      venues.value = data
    }
  } catch (error) {
    console.error('Failed to load venues:', error)
  } finally {
    loading.value = false
  }
}

function bookVenue(venue: SportsVenue, slot: string) {
  bookingVenue.value = venue
  bookingSlot.value = slot
  showBookDialog.value = true
}

async function confirmBooking() {
  if (!bookingVenue.value || !bookingSlot.value) return
  
  const key = `${bookingVenue.value.id}-${bookingSlot.value}`
  bookingLoading.value = key
  
  try {
    await SportsApi.book({
      venueId: bookingVenue.value.id,
      venueName: bookingVenue.value.name,
      venueType: bookingVenue.value.type,
      timeSlot: bookingSlot.value,
      date: new Date().toLocaleDateString()
    })
    ElMessage.success('预定成功！')
    showBookDialog.value = false
    bookingVenue.value = null
    bookingSlot.value = ''
  } catch (error) {
    ElMessage.error('预定失败，请重试')
  } finally {
    bookingLoading.value = ''
  }
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
  background: var(--bg-card);
  border: 1.5px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary);

  &.active {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
  }

  &:active { transform: scale(0.95); }
}

.sport-card {
  background: var(--bg-card);
  border-radius: 14px;
  padding: 16px;
  margin: 0 12px 10px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  transition: background 0.3s;
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
  color: var(--text-primary);
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
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary);

  &:active { transform: scale(0.95); }

  &.disabled {
    opacity: 0.4;
    pointer-events: none;
  }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--text-tertiary);
}
</style>