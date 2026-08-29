<template>
  <div class="home-page">
    <!-- Greeting -->
    <div class="home-header">
      <div class="greeting">{{ greeting }} 👋</div>
      <div class="date-text">{{ dateText }}</div>
    </div>

    <!-- Next class card -->
    <div v-if="nextClass" class="next-class-card">
      <div class="next-class-label">📢 下一节课</div>
      <div class="next-class-name">{{ nextClass.name }}</div>
      <div class="next-class-info">
        {{ nextClass.location }} · {{ getPeriodTime(nextClass.startPeriod) }}
      </div>
      <div class="next-class-countdown">{{ countdown }}</div>
    </div>

    <!-- Quick actions -->
    <div class="quick-actions">
      <div class="quick-action" v-for="action in quickActions" :key="action.path"
           @click="$router.push(action.path)">
        <div class="quick-action-icon">{{ action.icon }}</div>
        <div class="quick-action-text">{{ action.label }}</div>
      </div>
    </div>

    <!-- Stats -->
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-icon">📖</div>
        <div class="stat-content">
          <div class="stat-value">{{ courseStore.courses.length }}</div>
          <div class="stat-label">本学期课程</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🏆</div>
        <div class="stat-content">
          <div class="stat-value">{{ gpaText }}</div>
          <div class="stat-label">当前 GPA</div>
        </div>
      </div>
    </div>

    <!-- Today's schedule -->
    <div class="card">
      <div class="card-title">📌 今日安排</div>
      <div v-if="todayEvents.length === 0" class="empty-text">今天暂无日程安排 ✨</div>
      <div v-for="event in todayEvents.slice(0, 3)" :key="event.id" class="event-row">
        <div class="event-dot" />
        <div class="event-info">
          <div class="event-title">{{ event.title }}</div>
          <div class="event-detail">{{ event.location || '' }} {{ event.startTime ? formatTime(event.startTime) : '' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCourseStore } from '@/stores/course'
import { useGradeStore } from '@/stores/grade'
import { useScheduleStore } from '@/stores/schedule'
import type { Course } from '@/types'

const courseStore = useCourseStore()
const gradeStore = useGradeStore()
const scheduleStore = useScheduleStore()

const now = ref(new Date())
let timer: number

onMounted(() => {
  courseStore.loadFromStorage()
  gradeStore.loadFromStorage()
  scheduleStore.loadFromStorage()
  timer = window.setInterval(() => { now.value = new Date() }, 60000)
})

onUnmounted(() => clearInterval(timer))

const greeting = computed(() => {
  const h = now.value.getHours()
  if (h < 6) return '夜深了'
  if (h < 12) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const dateText = computed(() => {
  const d = now.value
  const days = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${days[d.getDay()]}`
})

const currentWeekDay = computed(() => {
  const d = now.value.getDay()
  return d === 0 ? 7 : d
})

const currentWeek = computed(() => {
  const settings = courseStore.settings
  if (!settings.semesterStartDate) return 1
  const start = new Date(settings.semesterStartDate)
  const diff = now.value.getTime() - start.getTime()
  return Math.max(1, Math.ceil(diff / (7 * 86400000)))
})

const nextClass = computed<Course | null>(() => {
  const courses = courseStore.getCoursesForDay(currentWeek.value, currentWeekDay.value)
  if (courses.length === 0) return null
  const h = now.value.getHours()
  const m = now.value.getMinutes()
  const currentTimeSlot = h * 60 + m
  for (const c of courses) {
    const periodTime = courseStore.periodTimes[c.startPeriod - 1]
    if (!periodTime) continue
    const [startH, startM] = periodTime.split('-')[0].split(':').map(Number)
    const courseTime = startH * 60 + startM
    if (courseTime > currentTimeSlot) return c
  }
  return null
})

const countdown = computed(() => {
  if (!nextClass.value) return ''
  const periodTime = courseStore.periodTimes[nextClass.value.startPeriod - 1]
  if (!periodTime) return ''
  const [h, m] = periodTime.split('-')[0].split(':').map(Number)
  const target = new Date(now.value)
  target.setHours(h, m, 0, 0)
  const diff = target.getTime() - now.value.getTime()
  if (diff < 0) return '已开始'
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(mins / 60)
  return hrs > 0 ? `${hrs}小时${mins % 60}分钟` : `${mins}分钟后`
})

const todayEvents = computed(() => {
  return scheduleStore.getSchedulesForDate(now.value)
})

const gpaText = computed(() => {
  const r = gradeStore.calculateGPA()
  return r.gpa > 0 ? r.gpa.toFixed(2) : '-'
})

const quickActions = [
  { path: '/schedule', icon: '📅', label: '课表' },
  { path: '/grade', icon: '📊', label: '成绩' },
  { path: '/library', icon: '📚', label: '图书馆' },
  { path: '/sport', icon: '🏸', label: '运动场馆' },
]

function getPeriodTime(period: number): string {
  return courseStore.periodTimes[period - 1] || ''
}

function formatTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<style lang="scss" scoped>
.home-page {
  padding-bottom: 8px;
}

.home-header {
  padding: 20px 16px 16px;
  background: var(--bg-card);
  transition: background 0.3s;
}

.greeting {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.date-text {
  font-size: 13px;
  color: var(--text-tertiary);
  margin-top: 4px;
}

.next-class-card {
  margin: 12px;
  padding: 20px;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  border-radius: 16px;
  color: white;
}

.next-class-label {
  font-size: 12px;
  opacity: 0.85;
}

.next-class-name {
  font-size: 20px;
  font-weight: 700;
  margin-top: 4px;
}

.next-class-info {
  font-size: 13px;
  opacity: 0.9;
  margin-top: 2px;
}

.next-class-countdown {
  font-size: 28px;
  font-weight: 800;
  margin-top: 12px;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 12px;
}

.quick-action {
  background: var(--bg-card);
  border-radius: 14px;
  padding: 14px 8px;
  text-align: center;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: background 0.3s;

  &:active { transform: scale(0.95); }
}

.quick-action-icon {
  font-size: 28px;
  margin-bottom: 4px;
}

.quick-action-text {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-secondary);
}

.stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 0 12px 12px;
}

.stat-card {
  background: var(--bg-card);
  border-radius: 14px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: var(--shadow-sm);
  transition: background 0.3s;
}

.stat-icon {
  font-size: 24px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: 11px;
  color: var(--text-tertiary);
  margin-top: 2px;
}

.empty-text {
  text-align: center;
  color: var(--text-tertiary);
  font-size: 13px;
  padding: 16px 0;
}

.event-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 0;

  & + & {
    border-top: 1px solid var(--border-light);
  }
}

.event-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary);
  margin-top: 5px;
  flex-shrink: 0;
}

.event-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.event-detail {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 2px;
}
</style>
