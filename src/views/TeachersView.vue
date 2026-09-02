<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">教师查询</h1>
    </div>

    <div class="search-bar">
      <el-input 
        v-model="searchKeyword" 
        placeholder="输入教师名或课程名搜索" 
        clearable 
        style="width: 100%"
        @keyup.enter="handleSearch"
      >
        <template #prefix><Search /></template>
        <template #append>
          <el-button @click="handleSearch" :loading="loading">
            <Search v-if="!loading" /> <Loading v-else class="is-rotating" />
          </el-button>
        </template>
      </el-input>
    </div>

    <div class="search-hints" v-if="!loading && searchResults.length === 0 && !searchKeyword">
      <div class="hint-title">热门搜索</div>
      <div class="hint-tags">
        <el-tag 
          v-for="tag in popularTags" 
          :key="tag" 
          @click="quickSearch(tag)"
          style="cursor: pointer;"
        >
          {{ tag }}
        </el-tag>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <el-icon><Loading class="is-rotating" /></el-icon>
      <span>正在搜索教师...</span>
    </div>

    <div v-else-if="searchResults.length > 0" class="teacher-list">
      <div class="teacher-card" v-for="teacher in searchResults" :key="teacher.name">
        <div class="teacher-header">
          <div class="teacher-avatar">{{ getInitial(teacher.name) }}</div>
          <div class="teacher-info">
            <div class="teacher-name">{{ teacher.name }}</div>
            <div class="teacher-dept">{{ teacher.college }} · {{ teacher.department }}</div>
          </div>
          <div class="teacher-rating">
            <StarFilled v-for="i in 5" :key="i" :class="{ filled: i <= Math.round(teacher.rating) }" />
            <span>{{ teacher.rating.toFixed(1) }} ({{ teacher.totalRatings }})</span>
          </div>
        </div>
        <div class="teacher-courses">
          <span class="course-tag" v-for="course in teacher.courses" :key="course">{{ course }}</span>
        </div>
        <el-divider />
        <div class="teacher-actions">
          <el-button size="small" link @click="viewTeacherDetail(teacher)">
            <Document /> 查看详情
          </el-button>
          <el-button size="small" link @click="viewTeacherCourses(teacher)">
            <Reading /> 任教课程
          </el-button>
          <el-button size="small" link @click="viewTeacherRatings(teacher)">
            <ChatDotSquare /> 评价详情
          </el-button>
        </div>
      </div>
    </div>

    <div v-else-if="searchKeyword && !loading" class="empty-state" style="margin: 48px 16px;">
      <div class="icon">🔍</div>
      <div class="text">未找到相关教师</div>
      <div class="text" style="margin-top: 8px; font-size: 12px;">尝试搜索课程名或教师全名</div>
    </div>

    <div v-else class="empty-state" style="margin: 48px 16px;">
      <div class="icon">👨‍🏫</div>
      <div class="text">输入教师名或课程名开始搜索</div>
    </div>
  </div>

  <el-dialog v-model="showTeacherDetail" title="教师详情" width="600px">
    <div v-if="selectedTeacher" class="teacher-detail">
      <div class="detail-header">
        <div class="detail-avatar">{{ getInitial(selectedTeacher.name) }}</div>
        <div class="detail-info">
          <h3>{{ selectedTeacher.name }}</h3>
          <p>{{ selectedTeacher.college }} · {{ selectedTeacher.department }}</p>
          <div class="detail-rating">
            <StarFilled v-for="i in 5" :key="i" :class="{ filled: i <= Math.round(selectedTeacher.rating) }" />
            <span>{{ selectedTeacher.rating.toFixed(1) }} 分 · {{ selectedTeacher.totalRatings }} 人评价</span>
          </div>
        </div>
      </div>
      <el-divider />
      <div class="detail-section">
        <h4>任教课程</h4>
        <div class="course-list">
          <div class="course-item" v-for="courseName in selectedTeacher.courses" :key="courseName">
            <span>{{ courseName }}</span>
            <el-tag size="small" :type="getCourseTagType(courseName)">
              {{ getCourseAvgScore(courseName) }}
            </el-tag>
          </div>
        </div>
      </div>
      <el-divider />
      <div class="detail-section">
        <h4>近期评价</h4>
        <div v-if="selectedTeacherRatings.length > 0">
          <div class="rating-item" v-for="rating in selectedTeacherRatings" :key="rating.id">
            <div class="rating-header">
              <span class="rating-course">{{ rating.courseName }}</span>
              <div class="rating-stars">
                <StarFilled v-for="i in 5" :key="i" :class="{ filled: i <= rating.rating }" />
              </div>
            </div>
            <div class="rating-dimensions">
              <span>难度 {{ rating.difficulty }}/5</span>
              <span>作业 {{ rating.homework }}/5</span>
              <span>给分 {{ rating.grading }}/5</span>
            </div>
            <p class="rating-comment">{{ rating.comment }}</p>
            <div class="rating-meta">
              <span>{{ rating.semester }}</span>
              <el-tag size="small" v-if="rating.isAnonymous">匿名</el-tag>
            </div>
          </div>
        </div>
        <div v-else class="empty-state" style="padding: 16px;">
          <div class="text">暂无评价</div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Search, Loading, Document, Reading, ChatDotSquare, StarFilled, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { GradeDistributionApi } from '@/api/gradeDistribution'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const searchKeyword = ref('')
const loading = ref(false)
const searchResults = ref<Array<{ name: string; department: string; college: string; rating: number; totalRatings: number; courses: string[] }>>([])
const showTeacherDetail = ref(false)
const selectedTeacher = ref<{ name: string; department: string; college: string; rating: number; totalRatings: number; courses: string[] } | null>(null)
const selectedTeacherRatings = ref<any[]>([])

const popularTags = ['高等数学', '大学物理', '数据结构', '毛概', '英语', '计算机', '张教授', '李老师', '王副教授']

onMounted(() => {
  // Load from API or use mock data
})

async function handleSearch() {
  if (!searchKeyword.value.trim()) return
  
  loading.value = true
  try {
    const results = await GradeDistributionApi.searchTeachers(searchKeyword.value)
    if (results && results.length > 0) {
      searchResults.value = results.map(t => ({
        name: t.name,
        department: t.department,
        college: t.college,
        courses: t.courses,
        rating: t.rating,
        totalRatings: t.totalRatings,
      }))
    } else {
      searchResults.value = []
    }
  } catch (error) {
    console.error('Search error:', error)
    ElMessage.error('搜索失败')
  } finally {
    loading.value = false
  }
}

function quickSearch(tag: string) {
  searchKeyword.value = tag
  handleSearch()
}

async function viewTeacherDetail(teacher: any) {
  selectedTeacher.value = teacher
  const ratings = await GradeDistributionApi.getTeacherRatings(teacher.name)
  selectedTeacherRatings.value = ratings
  showTeacherDetail.value = true
}

function viewTeacherCourses(teacher: any) {
  ElMessage.info(`${teacher.name} 任教: ${teacher.courses.join('、')}`)
}

function viewTeacherRatings(teacher: any) {
  viewTeacherDetail(teacher)
}

function getInitial(name: string) {
  return name.charAt(0)
}

function getCourseTagType(courseName: string) {
  const math = ['高等数学', '数学分析', '微积分', '线性代数', '概率论']
  const cs = ['数据结构', '算法', '计算机', '编程', '数据库', '操作系统']
  const phys = ['物理', '力学', '电磁', '光学', '量子']
  
  if (math.some(m => courseName.includes(m))) return 'primary'
  if (cs.some(c => courseName.includes(c))) return 'success'
  if (phys.some(p => courseName.includes(p))) return 'warning'
  return 'info'
}

function getCourseAvgScore(courseName: string) {
  // Mock scores
  const scores: Record<string, string> = {
    '高等数学': '78.5',
    '大学物理': '75.2',
    '数据结构': '82.3',
    '毛概': '85.0',
    '大学英语': '79.8',
  }
  return scores[courseName] || '—'
}
</script>

<style scoped>
.search-bar {
  position: sticky;
  top: 44px;
  z-index: 99;
  background: white;
  padding: 12px 16px;
  border-bottom: 1px solid #e4e7ed;
}

.search-hints {
  padding: 16px;
  background: white;
  margin: 12px;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.hint-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 12px;
}

.hint-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.teacher-list {
  padding: 0 12px;
}

.teacher-card {
  background: white;
  border-radius: 12px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.teacher-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
}

.teacher-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409EFF 0%, #66B1FF 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  font-weight: 600;
}

.teacher-info {
  flex: 1;
  min-width: 0;
}

.teacher-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.teacher-dept {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.teacher-rating {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 600;
  color: #E6A23C;
}

.teacher-courses {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 16px 12px;
}

.course-tag {
  background: #f5f7fa;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  color: #606266;
}

.teacher-actions {
  display: flex;
  padding: 12px 16px;
  border-top: 1px solid #f5f7fa;
}

.teacher-actions .el-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.teacher-detail {
  padding: 8px 0;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
}

.detail-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409EFF 0%, #66B1FF 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 28px;
  font-weight: 600;
}

.detail-info {
  flex: 1;
}

.detail-info h3 {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.detail-info p {
  margin: 0 0 8px;
  color: #909399;
}

.detail-rating {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #E6A23C;
}

.detail-section {
  padding: 16px 0;
}

.detail-section h4 {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.course-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.course-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.rating-item {
  padding: 12px 0;
  border-bottom: 1px solid #f5f7fa;
}

.rating-item:last-child {
  border-bottom: none;
}

.rating-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.rating-course {
  font-weight: 500;
  color: #303133;
}

.rating-stars {
  display: flex;
  gap: 2px;
  color: #E6A23C;
}

.rating-dimensions {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #606266;
  margin-bottom: 8px;
}

.rating-comment {
  font-size: 13px;
  color: #303133;
  line-height: 1.5;
  margin: 8px 0;
}

.rating-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #909399;
}
</style>