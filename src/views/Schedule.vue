<template>
  <div class="schedule-page">
    <!-- Header with week selector -->
    <div class="page-header">
      <el-button text @click="changeWeek(-1)">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <span class="page-title">第{{ currentWeek }}周</span>
      <el-button text @click="changeWeek(1)">
        <el-icon><ArrowRight /></el-icon>
      </el-button>
    </div>

    <!-- Day tabs -->
    <div class="day-tabs">
      <div
        v-for="(day, idx) in weekDays"
        :key="idx"
        class="day-tab"
        :class="{ active: selectedDay === idx + 1, today: isToday(idx + 1) }"
        @click="selectedDay = idx + 1"
      >
        <div class="day-name">{{ day }}</div>
        <div class="day-date">{{ getDayDate(idx + 1) }}</div>
      </div>
    </div>

    <!-- Course grid -->
    <div class="course-grid-wrapper">
      <div class="course-grid">
        <!-- Header row -->
        <div class="grid-header" />

        <!-- Time + course cells -->
        <template v-for="period in periods" :key="period">
          <div class="period-label">
            <div class="period-num">{{ period }}</div>
            <div class="period-time">{{ getPeriodStartTime(period) }}</div>
          </div>
          <div
            v-for="day in 7"
            :key="`${period}-${day}`"
            class="grid-cell"
            :class="{ 'current-cell': isCurrentCell(day, period) }"
            @click="onCellTap(day, period)"
          >
            <div
              v-if="getCourse(day, period)"
              class="course-block"
              :style="{ background: getCourse(day, period)!.color }"
            >
              <div class="course-block-name">{{ getCourse(day, period)!.name }}</div>
              <div class="course-block-location">{{ getCourse(day, period)!.location }}</div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Add course FAB -->
    <div class="fab" @click="showAddDialog = true">
      <el-icon :size="24"><Plus /></el-icon>
    </div>

    <!-- Add course dialog -->
    <el-dialog v-model="showAddDialog" title="添加课程" :close-on-click-modal="false">
      <el-form label-position="top">
        <el-form-item label="课程名称">
          <el-input v-model="newCourse.name" placeholder="如：高等数学A" />
        </el-form-item>
        <el-form-item label="授课教师">
          <el-input v-model="newCourse.teacher" placeholder="如：张教授" />
        </el-form-item>
        <el-form-item label="上课地点">
          <el-input v-model="newCourse.location" placeholder="如：教三-301" />
        </el-form-item>
        <el-form-item label="星期">
          <el-select v-model="newCourse.dayOfWeek" style="width:100%">
            <el-option v-for="(d,i) in weekDays" :key="i" :label="d" :value="i+1" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始节次">
          <el-select v-model="newCourse.startPeriod" style="width:100%">
            <el-option v-for="p in periods" :key="p" :label="`第${p}节`" :value="p" />
          </el-select>
        </el-form-item>
        <el-form-item label="结束节次">
          <el-select v-model="newCourse.endPeriod" style="width:100%">
            <el-option v-for="p in periods.filter(p => p >= newCourse.startPeriod)" :key="p" :label="`第${p}节`" :value="p" />
          </el-select>
        </el-form-item>
        <el-form-item label="学分">
          <el-input-number v-model="newCourse.credit" :min="0" :max="10" :step="0.5" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="addCourse">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ArrowLeft, ArrowRight, Plus } from '@element-plus/icons-vue'
import { useCourseStore } from '@/stores/course'
import type { Course } from '@/types'

const courseStore = useCourseStore()
const selectedDay = ref(new Date().getDay() === 0 ? 7 : new Date().getDay())
const weekOffset = ref(0)
const showAddDialog = ref(false)

const weekDays = courseStore.weekDays
const periods = courseStore.periods

const newCourse = ref({
  name: '',
  teacher: '',
  location: '',
  dayOfWeek: 1,
  startPeriod: 1,
  endPeriod: 2,
  credit: 3.0
})

onMounted(() => {
  courseStore.loadFromStorage()
})

const currentWeek = computed(() => {
  const base = courseStore.settings.currentWeek || 1
  return base + weekOffset.value
})

function changeWeek(delta: number) {
  weekOffset.value += delta
}

function isToday(dayOfWeek: number): boolean {
  const today = new Date().getDay()
  const todayIdx = today === 0 ? 7 : today
  return dayOfWeek === todayIdx && weekOffset.value === 0
}

function getDayDate(dayOfWeek: number): string {
  const now = new Date()
  const currentDay = now.getDay() === 0 ? 7 : now.getDay()
  const diff = dayOfWeek - currentDay + weekOffset.value * 7
  const d = new Date(now)
  d.setDate(d.getDate() + diff)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function getPeriodStartTime(period: number): string {
  const t = courseStore.periodTimes[period - 1]
  return t ? t.split('-')[0] : ''
}

function getCourse(day: number, period: number): Course | null {
  return courseStore.getCourseAtPeriod(currentWeek.value, day, period)
}

function isCurrentCell(day: number, period: number): boolean {
  if (!isToday(day)) return false
  const now = new Date()
  const h = now.getHours()
  const m = now.getMinutes()
  const timeStr = courseStore.periodTimes[period - 1]
  if (!timeStr) return false
  const [sh, sm] = timeStr.split('-')[0].split(':').map(Number)
  const [eh, em] = timeStr.split('-')[1].split(':').map(Number)
  const cur = h * 60 + m
  return cur >= sh * 60 + sm && cur <= eh * 60 + em
}

function onCellTap(day: number, period: number) {
  if (!getCourse(day, period)) {
    newCourse.value.dayOfWeek = day
    newCourse.value.startPeriod = period
    newCourse.value.endPeriod = period
    showAddDialog.value = true
  }
}

function addCourse() {
  if (!newCourse.value.name) return
  const weeks = Array.from({ length: 20 }, (_, i) => i + 1)
  const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#8B5CF6', '#06B6D4', '#EC4899']
  courseStore.addCourse({
    id: Date.now().toString(),
    name: newCourse.value.name,
    teacher: newCourse.value.teacher,
    location: newCourse.value.location,
    dayOfWeek: newCourse.value.dayOfWeek,
    startPeriod: newCourse.value.startPeriod,
    endPeriod: newCourse.value.endPeriod,
    startWeek: 1,
    endWeek: 20,
    color: colors[Math.floor(Math.random() * colors.length)],
    credit: newCourse.value.credit,
    weeks
  })
  showAddDialog.value = false
  newCourse.value = { name: '', teacher: '', location: '', dayOfWeek: 1, startPeriod: 1, endPeriod: 2, credit: 3.0 }
}
</script>

<style lang="scss" scoped>
.schedule-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.day-tabs {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  overflow-x: auto;
}

.day-tab {
  flex: 1;
  min-width: 44px;
  padding: 8px 4px;
  border-radius: 10px;
  background: white;
  border: 1.5px solid #e4e7ed;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;

  &.active {
    background: #409EFF;
    color: white;
    border-color: #409EFF;
  }

  &.today:not(.active) {
    border-color: #409EFF;
    color: #409EFF;
  }
}

.day-name {
  font-size: 12px;
  font-weight: 600;
}

.day-date {
  font-size: 10px;
  opacity: 0.7;
  margin-top: 2px;
}

.course-grid-wrapper {
  flex: 1;
  overflow: auto;
  padding: 0 8px 8px;
  -webkit-overflow-scrolling: touch;
}

.course-grid {
  display: grid;
  grid-template-columns: 42px repeat(7, 1fr);
  gap: 1px;
  background: #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  min-width: 100%;
}

.grid-header {
  background: #f5f7fa;
}

.period-label {
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px;
  min-height: 52px;
}

.period-num {
  font-size: 12px;
  font-weight: 600;
  color: #606266;
}

.period-time {
  font-size: 9px;
  color: #909399;
}

.grid-cell {
  background: white;
  min-height: 52px;
  position: relative;
  cursor: pointer;

  &.current-cell {
    background: #ecf5ff;
  }

  &:active {
    background: #f5f7fa;
  }
}

.course-block {
  position: absolute;
  inset: 1px;
  border-radius: 4px;
  padding: 3px 5px;
  color: white;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.course-block-name {
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.course-block-location {
  font-size: 9px;
  opacity: 0.9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fab {
  position: fixed;
  bottom: calc(60px + env(safe-area-inset-bottom, 0px));
  right: 16px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #409EFF;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
  cursor: pointer;
  z-index: 50;
  transition: transform 0.2s;

  &:active {
    transform: scale(0.9);
  }
}
</style>
