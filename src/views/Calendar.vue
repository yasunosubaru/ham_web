<template>
  <div class="calendar-page">
    <!-- Month navigation -->
    <div class="page-header">
      <el-button text @click="changeMonth(-1)">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <span class="page-title">{{ monthLabel }}</span>
      <el-button text @click="changeMonth(1)">
        <el-icon><ArrowRight /></el-icon>
      </el-button>
    </div>

    <!-- Calendar grid -->
    <div class="card">
      <div class="cal-grid">
        <div v-for="h in weekDayHeaders" :key="h" class="cal-header">{{ h }}</div>
        <div
          v-for="(day, idx) in calendarDays"
          :key="idx"
          class="cal-day"
          :class="{
            'other-month': !day.currentMonth,
            'today': day.isToday,
            'has-event': day.hasEvent,
            'selected': day.day === selectedDate?.getDate() && day.currentMonth
          }"
          @click="selectDay(day)"
        >
          {{ day.day }}
        </div>
      </div>
    </div>

    <!-- Events for selected date -->
    <div class="section">
      <div class="section-title">{{ selectedDateLabel }} 的日程</div>
    </div>

    <div v-if="selectedEvents.length === 0" class="empty-state">
      <div class="icon">📅</div>
      <div class="text">该日暂无事件</div>
    </div>

    <div v-for="event in selectedEvents" :key="event.id" class="event-card">
      <div class="event-time-col">
        <div class="event-time-text">{{ formatTime(event.startTime) }}</div>
        <div v-if="event.endTime" class="event-time-sub">至 {{ formatTime(event.endTime) }}</div>
      </div>
      <div class="event-content">
        <div class="event-title">{{ event.title }}</div>
        <div v-if="event.location" class="event-location">📍 {{ event.location }}</div>
        <div v-if="event.note" class="event-note">{{ event.note }}</div>
      </div>
      <el-button text type="danger" @click="scheduleStore.deleteSchedule(event.id)">
        <el-icon><Delete /></el-icon>
      </el-button>
    </div>

    <!-- FAB -->
    <div class="fab" @click="showAddDialog = true">
      <el-icon :size="24"><Plus /></el-icon>
    </div>

    <!-- Add event dialog -->
    <el-dialog v-model="showAddDialog" title="添加日程" :close-on-click-modal="false">
      <el-form label-position="top">
        <el-form-item label="标题">
          <el-input v-model="newEvent.title" placeholder="日程标题" />
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker v-model="newEvent.date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="开始时间">
          <el-time-picker v-model="newEvent.startTime" format="HH:mm" value-format="HH:mm" style="width:100%" />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-time-picker v-model="newEvent.endTime" format="HH:mm" value-format="HH:mm" style="width:100%" />
        </el-form-item>
        <el-form-item label="地点">
          <el-input v-model="newEvent.location" placeholder="地点（可选）" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="newEvent.note" type="textarea" placeholder="备注（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="addEvent">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { ArrowLeft, ArrowRight, Plus, Delete } from '@element-plus/icons-vue'
import { useScheduleStore } from '@/stores/schedule'

const scheduleStore = useScheduleStore()
const showAddDialog = ref(false)

const today = new Date()
const calYear = ref(today.getFullYear())
const calMonth = ref(today.getMonth())
const selectedDate = ref<Date>(today)

const weekDayHeaders = ['一', '二', '三', '四', '五', '六', '日']

const monthLabel = computed(() => {
  return `${calYear.value}年${calMonth.value + 1}月`
})

const selectedDateLabel = computed(() => {
  const d = selectedDate.value
  return `${d.getMonth() + 1}月${d.getDate()}日`
})

const calendarDays = computed(() => {
  const firstDay = new Date(calYear.value, calMonth.value, 1)
  const lastDay = new Date(calYear.value, calMonth.value + 1, 0)
  const startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1

  const days: Array<{
    day: number
    date: Date
    currentMonth: boolean
    isToday: boolean
    hasEvent: boolean
  }> = []

  // Previous month
  const prevMonth = new Date(calYear.value, calMonth.value, 0)
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonth.getDate() - i
    const date = new Date(calYear.value, calMonth.value - 1, d)
    days.push({ day: d, date, currentMonth: false, isToday: false, hasEvent: false })
  }

  // Current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(calYear.value, calMonth.value, d)
    const isToday = d === today.getDate() && calMonth.value === today.getMonth() && calYear.value === today.getFullYear()
    const hasEvent = scheduleStore.getSchedulesForDate(date).length > 0
    days.push({ day: d, date, currentMonth: true, isToday, hasEvent })
  }

  // Next month
  const remaining = 42 - days.length
  for (let d = 1; d <= remaining; d++) {
    const date = new Date(calYear.value, calMonth.value + 1, d)
    days.push({ day: d, date, currentMonth: false, isToday: false, hasEvent: false })
  }

  return days
})

const selectedEvents = computed(() => {
  return scheduleStore.getSchedulesForDate(selectedDate.value)
})

const newEvent = reactive({
  title: '',
  date: formatDateStr(today),
  startTime: '',
  endTime: '',
  location: '',
  note: ''
})

onMounted(() => {
  scheduleStore.loadFromStorage()
})

function formatDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function changeMonth(delta: number) {
  calMonth.value += delta
  if (calMonth.value > 11) { calMonth.value = 0; calYear.value++ }
  if (calMonth.value < 0) { calMonth.value = 11; calYear.value-- }
}

function selectDay(day: { date: Date; currentMonth: boolean }) {
  if (day.currentMonth) {
    selectedDate.value = day.date
  }
}

function formatTime(d: Date): string {
  if (!(d instanceof Date)) return ''
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function addEvent() {
  if (!newEvent.title || !newEvent.date) return
  const [sh, sm] = (newEvent.startTime || '09:00').split(':').map(Number)
  const [eh, em] = (newEvent.endTime || '10:00').split(':').map(Number)
  const [y, mo, d] = newEvent.date.split('-').map(Number)

  scheduleStore.addSchedule({
    id: Date.now().toString(),
    title: newEvent.title,
    location: newEvent.location,
    note: newEvent.note,
    startTime: new Date(y, mo - 1, d, sh, sm),
    endTime: new Date(y, mo - 1, d, eh, em),
    completed: false
  })
  showAddDialog.value = false
  newEvent.title = ''
  newEvent.location = ''
  newEvent.note = ''
}
</script>

<style lang="scss" scoped>
.calendar-page {
  padding-bottom: 80px;
}

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.cal-header {
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
  padding: 6px 0;
}

.cal-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 13px;
  cursor: pointer;
  position: relative;
  color: var(--text-primary);

  &.today {
    background: var(--primary);
    color: white;
    font-weight: 700;
  }

  &.selected:not(.today) {
    background: rgba(64, 158, 255, 0.15);
    color: var(--primary);
    font-weight: 600;
  }

  &.other-month {
    color: var(--text-muted);
  }

  &.has-event::after {
    content: '';
    position: absolute;
    bottom: 4px;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--primary);
  }

  &.today.has-event::after {
    background: white;
  }
}

.event-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  margin: 0 12px 8px;
  background: var(--bg-card);
  border-radius: 12px;
  border-left: 3px solid var(--primary);
  box-shadow: var(--shadow-sm);
  transition: background 0.3s;
}

.event-time-col {
  flex-shrink: 0;
  min-width: 50px;
}

.event-time-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary);
}

.event-time-sub {
  font-size: 11px;
  color: var(--text-tertiary);
}

.event-content {
  flex: 1;
}

.event-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
}

.event-location {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 4px;
}

.event-note {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.fab {
  position: fixed;
  bottom: calc(60px + env(safe-area-inset-bottom, 0px));
  right: 16px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
  cursor: pointer;
  z-index: 50;

  &:active { transform: scale(0.9); }
}
</style>
