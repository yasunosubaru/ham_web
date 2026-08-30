<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">课程表</h1>
      <el-button size="small" @click="showSettings = true">
        <Setting />
      </el-button>
    </div>

    <div class="week-nav">
      <el-button size="small" circle @click="changeWeek(-1)"><ArrowLeft /></el-button>
      <span class="week-label">{{ getWeekLabel() }}</span>
      <el-button size="small" circle @click="changeWeek(1)"><ArrowRight /></el-button>
      <el-button size="small" @click="goToCurrentWeek" :disabled="isCurrentWeek">本周</el-button>
    </div>

    <div class="course-grid" ref="gridRef">
      <div class="course-header"></div>
      <div class="course-header" v-for="day in weekDays" :key="day">{{ day }}</div>
      
      <div class="course-time" v-for="period in periods" :key="period">
        {{ periodTimes[period - 1] }}
      </div>
      
      <div 
        class="course-cell" 
        v-for="period in periods" 
        :key="'time-' + period"
      ></div>
      
      <template v-for="day in [1,2,3,4,5,6,7]" :key="day">
        <div 
          class="course-cell" 
          v-for="period in periods"
          :key="`cell-${day}-${period}`"
          @click="onCellClick(day, period)"
          @contextmenu.prevent="onCellRightClick(day, period)"
        >
        <div 
          v-for="course in getCoursesAt(day, period)" 
          :key="course.id"
          class="course-block"
          :style="{ 
            top: getTopOffset(day, period, course), 
            height: getHeight(course),
            background: course.color,
            zIndex: getZIndex(day, period, course)
          }"
          @click.stop="onCourseClick(course)"
        >
          <div class="course-block-name">{{ course.name }}</div>
          <div class="course-block-location">{{ course.location }}</div>
</div>
      </div>
    </template>
  </div>

    <el-dialog v-model="showCourseDialog" :title="editingCourse ? '编辑课程' : '添加课程'" width="500px" destroy-on-close>
      <el-form :model="courseForm" :rules="courseRules" ref="courseFormRef" label-width="80px">
        <el-form-item label="课程名" prop="name">
          <el-input v-model="courseForm.name" placeholder="请输入课程名" />
        </el-form-item>
        <el-form-item label="教师" prop="teacher">
          <el-input v-model="courseForm.teacher" placeholder="请输入教师名" />
        </el-form-item>
        <el-form-item label="地点" prop="location">
          <el-input v-model="courseForm.location" placeholder="请输入上课地点" />
        </el-form-item>
        <el-form-item label="颜色">
          <el-color-picker v-model="courseForm.color" show-alpha />
        </el-form-item>
        <el-form-item label="周次">
          <div class="week-picker">
            <el-input-number 
              v-model="courseForm.startWeek" 
              :min="1" 
              :max="20" 
              style="width: 100px"
              controls-position="right"
            />
            <span> - </span>
            <el-input-number 
              v-model="courseForm.endWeek" 
              :min="1" 
              :max="20" 
              style="width: 100px"
              controls-position="right"
            />
            <span>周</span>
          </div>
        </el-form-item>
        <el-form-item label="星期">
          <el-select v-model="courseForm.dayOfWeek" placeholder="选择星期" style="width: 100%">
            <el-option v-for="day in weekDays" :key="day" :label="day" :value="weekDays.indexOf(day) + 1" />
          </el-select>
        </el-form-item>
        <el-form-item label="节次">
          <div class="period-picker">
            <el-select v-model="courseForm.startPeriod" placeholder="开始" style="width: 100px">
              <el-option v-for="p in periods" :key="p" :label="`第${p}节 (${periodTimes[p-1]})`" :value="p" />
            </el-select>
            <span> - </span>
            <el-select v-model="courseForm.endPeriod" placeholder="结束" style="width: 100px">
              <el-option v-for="p in periods" :key="p" :label="`第${p}节 (${periodTimes[p-1]})`" :value="p" />
            </el-select>
          </div>
        </el-form-item>
        <el-form-item label="学分">
          <el-input-number v-model="courseForm.credit" :min="0" :max="10" :step="0.5" controls-position="right" style="width: 100px" />
        </el-form-item>
        <el-form-item label="课程性质">
          <el-select v-model="courseForm.type" placeholder="选择性质" style="width: 100%">
            <el-option label="必修" value="required" />
            <el-option label="选修" value="elective" />
            <el-option label="通识" value="general" />
            <el-option label="跨专业" value="cross" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showCourseDialog = false">取消</el-button>
          <el-button type="primary" @click="saveCourse" :loading="saving">{{ editingCourse ? '保存' : '添加' }}</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="showSettings" title="课程表设置" width="400px">
      <el-form :model="settingsForm" label-width="100px">
        <el-form-item label="开学日期">
          <el-date-picker v-model="settingsForm.semesterStartDate" type="date" placeholder="选择开学日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="课程透明度">
          <el-slider v-model="settingsForm.courseOpacity" :min="0.3" :max="1" :step="0.1" show-stops />
        </el-form-item>
        <el-form-item label="显示周末">
          <el-switch v-model="settingsForm.showWeekends" />
        </el-form-item>
        <el-form-item label="背景图片">
          <el-upload
            action="#"
            :auto-upload="false"
            :on-change="onBackgroundChange"
            :show-file-list="false"
            accept="image/*"
          >
            <el-button>选择图片</el-button>
          </el-upload>
          <div v-if="settingsForm.backgroundImage" class="bg-preview">
            <img :src="settingsForm.backgroundImage" alt="背景预览" />
            <el-button size="small" type="danger" @click="removeBackground">移除</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="saveSettings">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="showImportDialog" title="从教务系统导入" width="400px">
      <div class="import-dialog">
        <p>请在信息门户登录后，从教务系统导出课程表（ICS/Excel格式），然后上传。</p>
        <el-upload
          action="#"
          :auto-upload="false"
          :on-change="onImportFileChange"
          :show-file-list="true"
          accept=".ics,.xlsx,.xls,.csv"
        >
          <el-button>选择文件</el-button>
        </el-upload>
        <el-button type="primary" @click="importSchedule" :disabled="!importFile" :loading="importing">导入</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { Setting, ArrowLeft, ArrowRight, Delete, Edit, Plus, Upload } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCourseStore } from '@/stores/course'
import { useAuthStore } from '@/stores/auth'

const courseStore = useCourseStore()
const authStore = useAuthStore()

const gridRef = ref<HTMLDivElement>()
const showCourseDialog = ref(false)
const showSettings = ref(false)
const showImportDialog = ref(false)
const editingCourse = ref<any>(null)
const saving = ref(false)
const importing = ref(false)
const importFile = ref<File | null>(null)

const courseForm = ref({
  id: '',
  name: '',
  teacher: '',
  location: '',
  color: '#409EFF',
  dayOfWeek: 1,
  startPeriod: 1,
  endPeriod: 2,
  startWeek: 1,
  endWeek: 17,
  credit: 2,
  type: 'required' as const
})

const settingsForm = ref({
  semesterStartDate: '',
  courseOpacity: 0.9,
  showWeekends: false,
  backgroundImage: ''
})

const courseRules = {
  name: [{ required: true, message: '请输入课程名', trigger: 'blur' }],
  teacher: [{ required: true, message: '请输入教师', trigger: 'blur' }],
  location: [{ required: true, message: '请输入地点', trigger: 'blur' }],
  dayOfWeek: [{ required: true, message: '请选择星期', trigger: 'change' }],
  startPeriod: [{ required: true, message: '请选择开始节次', trigger: 'change' }],
  endPeriod: [{ required: true, message: '请选择结束节次', trigger: 'change' }],
  startWeek: [{ required: true, message: '请输入开始周', trigger: 'blur' }],
  endWeek: [{ required: true, message: '请输入结束周', trigger: 'blur' }]
}

const weekDays = computed(() => courseStore.weekDays)
const periods = computed(() => courseStore.periods)
const periodTimes = computed(() => courseStore.periodTimes)

const currentWeek = computed(() => courseStore.settings.currentWeek)
const isCurrentWeek = computed(() => {
  if (!courseStore.settings.semesterStartDate) return true
  const start = new Date(courseStore.settings.semesterStartDate)
  const now = new Date()
  const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7))
  return currentWeek.value === diff + 1
})

onMounted(() => {
  courseStore.loadFromStorage()
  settingsForm.value = { ...courseStore.settings }
})

function getWeekLabel() {
  if (!courseStore.settings.semesterStartDate) return `第 ${currentWeek.value} 周`
  const start = new Date(courseStore.settings.semesterStartDate)
  const weekStart = new Date(start)
  weekStart.setDate(start.getDate() + (currentWeek.value - 1) * 7)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  return `${formatDate(weekStart)} - ${formatDate(weekEnd)} (第 ${currentWeek.value} 周)`
}

function changeWeek(delta: number) {
  courseStore.settings.currentWeek = Math.max(1, Math.min(20, currentWeek.value + delta))
  courseStore.saveSettings()
}

function goToCurrentWeek() {
  if (!courseStore.settings.semesterStartDate) return
  const start = new Date(courseStore.settings.semesterStartDate)
  const now = new Date()
  const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7))
  courseStore.settings.currentWeek = Math.max(1, Math.min(20, diff + 1))
  courseStore.saveSettings()
}

function getCoursesAt(day: number, period: number) {
  return courseStore.getCoursesForDay(currentWeek.value, day)
    .filter(c => c.startPeriod <= period && c.endPeriod >= period)
    .sort((a, b) => a.startPeriod - b.startPeriod)
}

function getTopOffset(day: number, period: number, course: any) {
  const coursesAt = getCoursesAt(day, period)
  const index = coursesAt.findIndex(c => c.id === course.id)
  return `${index * 4}px`
}

function getHeight(course: any) {
  const periodCount = course.endPeriod - course.startPeriod + 1
  return `${periodCount * 100 - 4}%`
}

function getZIndex(day: number, period: number, course: any) {
  return getCoursesAt(day, period).findIndex(c => c.id === course.id) + 1
}

function onCellClick(day: number, period: number) {
  if (editingCourse.value) return
  courseForm.value = {
    id: '',
    name: '',
    teacher: '',
    location: '',
    color: getRandomColor(),
    dayOfWeek: day,
    startPeriod: period,
    endPeriod: Math.min(period + 1, 12),
    startWeek: 1,
    endWeek: 17,
    credit: 2,
    type: 'required'
  }
  editingCourse.value = null
  showCourseDialog.value = true
}

function onCellRightClick(day: number, period: number) {
  const courses = getCoursesAt(day, period)
  if (courses.length === 0) return
  
  const course = courses[0]
  ElMessageBox.confirm(
    `确定要删除"${course.name}"吗？`,
    '删除课程',
    {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
      distinguishCancelAndClose: true
    }
  ).then(() => {
    courseStore.deleteCourse(course.id)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

function onCourseClick(course: any) {
  editingCourse.value = course
  courseForm.value = { ...course }
  showCourseDialog.value = true
}

async function saveCourse() {
  const form = courseForm.value
  if (form.startPeriod > form.endPeriod) {
    ElMessage.error('开始节次不能大于结束节次')
    return
  }
  if (form.startWeek > form.endWeek) {
    ElMessage.error('开始周不能大于结束周')
    return
  }

  const weeks = Array.from({ length: form.endWeek - form.startWeek + 1 }, (_, i) => form.startWeek + i)
  
  const courseData = {
    ...form,
    weeks
  }

  if (editingCourse.value) {
    courseStore.updateCourse(editingCourse.value.id, courseData)
    ElMessage.success('更新成功')
  } else {
    courseStore.addCourse({ ...courseData, id: `course_${Date.now()}` })
    ElMessage.success('添加成功')
  }
  
  showCourseDialog.value = false
}

function getRandomColor() {
  const colors = [
    '#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399',
    '#e67e22', '#9b59b6', '#1abc9c', '#34495e', '#e91e63'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

function saveSettings() {
  courseStore.settings = { ...settingsForm.value }
  courseStore.saveSettings()
  showSettings.value = false
  ElMessage.success('设置已保存')
}

function onBackgroundChange(file: File) {
  const reader = new FileReader()
  reader.onload = (e) => {
    settingsForm.value.backgroundImage = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

function removeBackground() {
  settingsForm.value.backgroundImage = ''
}

function onImportFileChange(file: File) {
  importFile.value = file.raw
}

async function importSchedule() {
  if (!importFile.value) return
  importing.value = true
  
  try {
    const text = await importFile.value.text()
    const lines = text.split('\n')
    let imported = 0
    
    for (const line of lines) {
      if (line.includes('SUMMARY:') || line.includes('DTSTART:') || line.includes('DTEND:')) {
        imported++
      }
    }
    
    ElMessage.success(`解析到 ${imported} 条课程信息，导入功能开发中...`)
  } catch (e) {
    ElMessage.error('导入失败，请检查文件格式')
  } finally {
    importing.value = false
    showImportDialog.value = false
    importFile.value = null
  }
}

function formatDate(date: Date) {
  return `${date.getMonth() + 1}/${date.getDate()}`
}
</script>

<style scoped>
.week-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px;
  background: white;
  margin: 0 12px 12px;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.week-label {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
  min-width: 200px;
  text-align: center;
}

.course-grid {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.week-picker, .period-picker {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.import-dialog {
  padding: 8px 0;
}

.import-dialog p {
  margin: 0 0 16px;
  font-size: 13px;
  color: #606266;
}

.bg-preview {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.bg-preview img {
  width: 60px;
  height: 40px;
  border-radius: 4px;
  object-fit: cover;
}
</style>