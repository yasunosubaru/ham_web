<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">首页</h1>
      <el-button size="small" @click="refreshAll" :loading="isLoading" class="refresh-btn">
        <Refresh v-if="isLoading" /> 刷新
      </el-button>
    </div>

    <div class="gpa-summary" @click="router.push('/grades')">
      <div class="gpa-summary-title">
        <span>综测成绩 / GPA</span>
        <el-tag v-if="gradeStore.calculationMethod !== 'standard'" size="small" style="margin-left: 8px">
          {{ gradeStore.calculationMethod === 'f2-new' ? '新版F2' : '旧版F2' }}
        </el-tag>
      </div>
      <div class="gpa-summary-value">{{ displayScore }}</div>
      <div class="gpa-summary-stats">
        <div class="gpa-stat">
          <div class="gpa-stat-value">{{ gradeStore.gpaResult.totalCredits }}</div>
          <div class="gpa-stat-label">总学分</div>
        </div>
        <div class="gpa-stat">
          <div class="gpa-stat-value">{{ gradeStore.gpaResult.earnedCredits }}</div>
          <div class="gpa-stat-label">已获学分</div>
        </div>
        <div class="gpa-stat">
          <div class="gpa-stat-value">{{ gradeStore.gpaResult.f2Detail?.b1.toFixed(2) || gradeStore.gpaResult.weightedScore.toFixed(1) }}</div>
          <div class="gpa-stat-label">{{ gradeStore.calculationMethod.startsWith('f2') ? 'B1' : '加权均分' }}</div>
        </div>
        <div class="gpa-stat" v-if="gradeStore.calculationMethod.startsWith('f2')">
          <div class="gpa-stat-value">{{ gradeStore.gpaResult.f2Detail?.b2.toFixed(2) || '-' }}</div>
          <div class="gpa-stat-label">B2</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">
        <Document /> 今日课程
      </div>
      <div v-if="todayCourses.length > 0">
        <div class="course-item" v-for="course in todayCourses" :key="course.id" @click="router.push('/schedule')">
          <div class="course-time-badge" :style="{ background: course.color }">{{ formatPeriod(course.startPeriod) }}-{{ formatPeriod(course.endPeriod) }}</div>
          <div class="course-info">
            <div class="course-name">{{ course.name }}</div>
            <div class="course-location">{{ course.location }}</div>
          </div>
          <div class="course-teacher">{{ course.teacher }}</div>
        </div>
      </div>
      <div v-else class="empty-state" style="padding: 24px 16px; margin: 0;">
        <div class="icon">📚</div>
        <div class="text">今日无课程，享受假期吧！</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">快捷入口</div>
      <div class="function-grid">
        <el-button @click="router.push('/grades')" style="flex: 1;">
          <Document style="margin-right: 6px; font-size: 18px;" /> 成绩查询
        </el-button>
        <el-button @click="router.push('/grade-distribution')" style="flex: 1;">
          <Histogram style="margin-right: 6px; font-size: 18px;" /> 给分查询
        </el-button>
        <el-button @click="router.push('/teachers')" style="flex: 1;">
          <User style="margin-right: 6px; font-size: 18px;" /> 教师评价
        </el-button>
        <el-button @click="router.push('/schedule')" style="flex: 1;">
          <Calendar style="margin-right: 6px; font-size: 18px;" /> 课程表
        </el-button>
      </div>
    </div>

    <div class="section">
      <div class="section-title">最近成绩</div>
      <div v-if="recentGrades.length > 0">
        <div class="grade-card" v-for="grade in recentGrades" :key="`${grade.year}-${grade.semester}-${grade.courseId}`">
          <div class="grade-header">
            <div>
              <div class="grade-course-name">{{ grade.name }}</div>
              <div class="grade-course-meta">{{ grade.instructor }} · {{ grade.credit }} 学分 · {{ formatSemester(grade.year, grade.semester) }}</div>
            </div>
            <div class="text-right">
              <div class="grade-score" :class="getScoreClass(grade.score)">
                {{ grade.score }}
              </div>
              <div class="grade-gpa">GPA: {{ grade.gpa?.toFixed(1) }}</div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="empty-state" style="padding: 24px 16px; margin: 0;">
        <div class="icon">📝</div>
        <div class="text">暂无成绩数据</div>
        <el-button type="primary" @click="loadGrades">获取成绩</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Document, Refresh, Histogram, User, Calendar, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useCourseStore } from '@/stores/course'
import { useGradesStore } from '@/stores/grades'
import { EducationApiService } from '@/api/education'

const router = useRouter()
const authStore = useAuthStore()
const courseStore = useCourseStore()
const gradeStore = useGradesStore()

const isLoading = ref(false)
const recentGrades = ref<any[]>([])

const displayScore = computed(() => {
  if (gradeStore.calculationMethod.startsWith('f2')) {
    return gradeStore.gpaResult.f2Score?.toFixed(2) || '0.00'
  }
  return gradeStore.gpaResult.gpa.toFixed(2)
})

const today = computed(() => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
})

const currentWeek = computed(() => courseStore.getCurrentWeek())

const todayCourses = computed(() => 
  courseStore.getCoursesForDay(currentWeek.value, today.value.getDay() === 0 ? 7 : today.value.getDay())
)

onMounted(async () => {
  courseStore.loadFromStorage()
  gradeStore.loadFromStorage()
  gradeStore.loadCalculationMethod()
  await loadGrades()
})

async function loadGrades() {
  if (!authStore.isLoggedIn) return
  
  try {
    await gradeStore.fetchGrades()
    // Get recent 5 grades
    const allGrades = gradeStore.grades
      .filter(g => gradeStore.isGradeEnabled(g))
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year
        return b.semester - a.semester
      })
    recentGrades.value = allGrades.slice(0, 5)
  } catch (error) {
    console.warn('Failed to load grades:', error)
  }
}

async function refreshAll() {
  isLoading.value = true
  try {
    await Promise.all([
      gradeStore.fetchGrades(undefined, undefined, true),
      loadGrades(),
    ])
    ElMessage.success('刷新完成')
  } catch (error) {
    ElMessage.error('刷新失败')
  } finally {
    isLoading.value = false
  }
}

function formatPeriod(period: number) {
  return `${period}`
}

function formatSemester(year: number, semester: number) {
  const semesterMap: Record<number, string> = { 1: '秋季', 2: '春季', 3: '夏季' }
  return `${year}-${year + 1} 学年 ${semesterMap[semester]}学期`
}

function getScoreClass(score: number) {
  if (score >= 90) return 'excellent'
  if (score >= 80) return 'good'
  if (score >= 60) return 'pass'
  return 'fail'
}
</script>

<style scoped>
.text-right {
  text-align: right;
}

.grade-course-meta {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
}

.grade-gpa {
  font-size: 11px;
  color: #409EFF;
  margin-top: 2px;
}

.function-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin: 0 12px;
}

.function-grid .el-button {
  height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px;
  font-size: 12px;
}

.refresh-btn {
  height: 28px;
  padding: 0 12px;
}
</style>