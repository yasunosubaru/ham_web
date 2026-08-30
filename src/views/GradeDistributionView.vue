<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">给分查询</h1>
    </div>

    <div class="search-bar">
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="课程名">
          <el-input 
            v-model="searchForm.courseName" 
            placeholder="输入课程名（如：高等数学、毛概）" 
            clearable 
            style="width: 200px"
            @keyup.enter="handleSearch"
          >
            <template #prefix><Search /></template>
          </el-input>
        </el-form-item>
        <el-form-item label="教师">
          <el-input 
            v-model="searchForm.teacherName" 
            placeholder="输入教师名（可选）" 
            clearable 
            style="width: 180px"
            @keyup.enter="handleSearch"
          >
            <template #prefix><User /></template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :loading="gradeDistStore.loading">
            <Search v-if="!gradeDistStore.loading" /> <Loading v-else class="is-rotating" />
            查询
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div v-if="gradeDistStore.searchHistory.length > 0 && !gradeDistStore.hasResults" class="history-section">
      <div class="section-title">搜索历史</div>
      <div class="history-tags">
        <el-tag 
          v-for="item in gradeDistStore.searchHistory" 
          :key="item" 
          closable 
          @close="removeHistory(item)"
          @click="useHistory(item)"
        >
          {{ item }}
        </el-tag>
      </div>
    </div>

    <div v-if="gradeDistStore.loading" class="loading-state">
      <el-icon><Loading class="is-rotating" /></el-icon>
      <span>正在查询给分情况...</span>
    </div>

    <div v-else-if="gradeDistStore.hasResults" class="results-container">
      <div class="result-header">
        <h3 class="result-title">{{ gradeDistStore.searchResults.courseName }}</h3>
        <div class="result-meta">
          <span><User /> {{ gradeDistStore.searchResults.teacherName }}</span>
          <span><Document /> {{ gradeDistStore.searchResults.totalStudents }} 人评价</span>
          <span><StarFilled style="color: #E6A23C;" /> 平均分 {{ gradeDistStore.searchResults.averageScore }}</span>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ gradeDistStore.searchResults.averageScore }}</div>
          <div class="stat-label">平均分</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ gradeDistStore.searchResults.medianScore }}</div>
          <div class="stat-label">中位数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ gradeDistStore.searchResults.totalStudents }}</div>
          <div class="stat-label">参评人数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ getPassRate() }}%</div>
          <div class="stat-label">及格率</div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">分数分布</div>
        <div class="distribution-bars">
          <div class="dist-bar" v-for="item in gradeDistStore.searchResults.distribution" :key="item.range">
            <span class="dist-label">{{ item.range }}</span>
            <div class="dist-bar-container">
              <div class="dist-bar-fill" :style="{ width: item.percentage + '%', background: getRangeColor(item.range) }"></div>
            </div>
            <span class="dist-count">{{ item.count }} ({{ item.percentage }}%)</span>
          </div>
        </div>
      </div>

      <div v-if="gradeDistStore.teacherRatings.length > 0" class="card">
        <div class="card-title">
          <ChatDotSquare /> 教师评价 ({{ gradeDistStore.teacherRatings.length }})
        </div>
        <div class="rating-list">
          <div class="rating-item" v-for="rating in gradeDistStore.teacherRatings" :key="rating.id">
            <div class="rating-header">
              <div class="rating-stars">
                <StarFilled v-for="i in 5" :key="i" :class="{ filled: i <= rating.rating }" />
              </div>
              <div class="rating-meta">
                <span>{{ rating.semester }}</span>
                <el-tag size="small" v-if="rating.isAnonymous">匿名</el-tag>
              </div>
            </div>
            <div class="rating-dimensions">
              <span>难度: {{ rating.difficulty }}/5</span>
              <span>作业: {{ rating.homework }}/5</span>
              <span>给分: {{ rating.grading }}/5</span>
            </div>
            <div class="rating-comment">{{ rating.comment }}</div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-top: 16px;">
        <div class="card-title">
          <Edit /> 发布评价
        </div>
        <el-form :model="ratingForm" ref="ratingFormRef" label-width="80px">
          <el-form-item label="课程名">
            <el-input v-model="ratingForm.courseName" :disabled="true" />
          </el-form-item>
          <el-form-item label="教师">
            <el-input v-model="ratingForm.teacherName" :disabled="true" />
          </el-form-item>
          <el-form-item label="学期">
            <el-select v-model="ratingForm.semester" placeholder="选择学期" style="width: 100%">
              <el-option v-for="s in availableSemesters" :key="s" :label="s" :value="s" />
            </el-select>
          </el-form-item>
          <el-form-item label="综合评分">
            <el-rate v-model="ratingForm.rating" :max="5" :show-score="true" />
          </el-form-item>
          <el-form-item label="难度">
            <el-rate v-model="ratingForm.difficulty" :max="5" />
          </el-form-item>
          <el-form-item label="作业量">
            <el-rate v-model="ratingForm.homework" :max="5" />
          </el-form-item>
          <el-form-item label="给分">
            <el-rate v-model="ratingForm.grading" :max="5" />
          </el-form-item>
          <el-form-item label="评价内容">
            <el-input v-model="ratingForm.comment" type="textarea" :rows="3" placeholder="分享你的选课体验..." />
          </el-form-item>
          <el-form-item label="匿名发布">
            <el-switch v-model="ratingForm.isAnonymous" />
          </el-form-item>
        </el-form>
        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px;">
          <el-button @click="showRatingDialog = false">取消</el-button>
          <el-button type="primary" @click="submitRating" :loading="submittingRating">提交评价</el-button>
        </div>
      </div>
    </div>

    <div v-else class="empty-state" style="margin: 48px 16px;">
      <div class="icon">🔍</div>
      <div class="text">输入课程名或教师名查询给分情况</div>
      <div class="text" style="margin-top: 8px; font-size: 12px;">支持模糊搜索，如输入"毛概"可查到《毛泽东思想和中国特色社会主义理论体系概论》</div>
    </div>
  </div>

  <el-dialog v-model="showRatingDialog" title="发布课程评价" width="500px" destroy-on-close>
    <el-form :model="ratingForm" ref="ratingFormRef" label-width="80px">
      <el-form-item label="课程名">
        <el-input v-model="ratingForm.courseName" :disabled="true" />
      </el-form-item>
      <el-form-item label="教师">
        <el-input v-model="ratingForm.teacherName" :disabled="true" />
      </el-form-item>
      <el-form-item label="学期">
        <el-select v-model="ratingForm.semester" placeholder="选择学期" style="width: 100%">
          <el-option v-for="s in availableSemesters" :key="s" :label="s" :value="s" />
        </el-select>
      </el-form-item>
      <el-form-item label="综合评分">
        <el-rate v-model="ratingForm.rating" :max="5" :show-score="true" />
      </el-form-item>
      <el-form-item label="难度">
        <el-rate v-model="ratingForm.difficulty" :max="5" />
      </el-form-item>
      <el-form-item label="作业量">
        <el-rate v-model="ratingForm.homework" :max="5" />
      </el-form-item>
      <el-form-item label="给分">
        <el-rate v-model="ratingForm.grading" :max="5" />
      </el-form-item>
      <el-form-item label="评价内容">
        <el-input v-model="ratingForm.comment" type="textarea" :rows="3" placeholder="分享你的选课体验..." />
      </el-form-item>
      <el-form-item label="匿名发布">
        <el-switch v-model="ratingForm.isAnonymous" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="showRatingDialog = false">取消</el-button>
        <el-button type="primary" @click="submitRating" :loading="submittingRating">提交评价</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Search, User, Document, StarFilled, ChatDotSquare, Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useGradeDistributionStore } from '@/stores/gradeDistribution'
import { useAuthStore } from '@/stores/auth'

const gradeDistStore = useGradeDistributionStore()
const authStore = useAuthStore()

const searchForm = ref({
  courseName: '',
  teacherName: '',
})

const showRatingDialog = ref(false)
const submittingRating = ref(false)
const ratingFormRef = ref<any>()

const ratingForm = ref({
  courseName: '',
  teacherName: '',
  semester: '',
  rating: 0,
  difficulty: 0,
  homework: 0,
  grading: 0,
  comment: '',
  isAnonymous: true,
})

const availableSemesters = computed(() => {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()
  const semesters: string[] = []
  
  for (let i = 0; i < 6; i++) {
    const year = currentYear - Math.floor(i / 2)
    const semester = i % 2 === 0 ? 1 : 2
    const label = `${year}-${year + 1} 学年 ${semester === 1 ? '秋季' : '春季'}学期`
    semesters.push(label)
  }
  return semesters
})

onMounted(() => {
  gradeDistStore.loadFromStorage()
})

function handleSearch() {
  const query = {
    courseName: searchForm.value.courseName || undefined,
    teacherName: searchForm.value.teacherName || undefined,
  }
  
  if (!query.courseName && !query.teacherName) {
    ElMessage.warning('请输入课程名或教师名')
    return
  }
  
  gradeDistStore.search(query)
}

function useHistory(item: string) {
  searchForm.value.courseName = item
  searchForm.value.teacherName = ''
  handleSearch()
}

function removeHistory(item: string) {
  gradeDistStore.searchHistory.value = gradeDistStore.searchHistory.value.filter(h => h !== item)
  gradeDistStore.saveHistory()
}

function getPassRate() {
  if (!gradeDistStore.searchResults) return 0
  const passCount = gradeDistStore.searchResults.distribution
    .filter(d => d.range !== '<60')
    .reduce((sum, d) => sum + d.count, 0)
  return Math.round((passCount / gradeDistStore.searchResults.totalStudents) * 100)
}

function getRangeColor(range: string) {
  const colors: Record<string, string> = {
    '90-100': '#67C23A',
    '80-89': '#409EFF',
    '70-79': '#E6A23C',
    '60-69': '#F56C6C',
    '<60': '#909399',
  }
  return colors[range] || '#409EFF'
}

async function submitRating() {
  if (!ratingForm.value.rating) {
    ElMessage.warning('请给出综合评分')
    return
  }
  
  submittingRating.value = true
  try {
    await gradeDistStore.submitRating({
      courseName: ratingForm.value.courseName,
      teacherName: ratingForm.value.teacherName,
      rating: ratingForm.value.rating,
      difficulty: ratingForm.value.difficulty,
      homework: ratingForm.value.homework,
      grading: ratingForm.value.grading,
      comment: ratingForm.value.comment,
      semester: ratingForm.value.semester,
      isAnonymous: ratingForm.value.isAnonymous,
    })
    ElMessage.success('评价提交成功！')
    showRatingDialog.value = false
    // Refresh ratings
    if (gradeDistStore.searchResults) {
      gradeDistStore.search({
        courseName: gradeDistStore.searchResults.courseName,
        teacherName: gradeDistStore.searchResults.teacherName,
      })
    }
  } catch (error) {
    ElMessage.error('提交失败')
  } finally {
    submittingRating.value = false
  }
}

// Open rating dialog when clicking on result
function openRatingDialog() {
  if (!gradeDistStore.searchResults) return
  ratingForm.value = {
    courseName: gradeDistStore.searchResults.courseName,
    teacherName: gradeDistStore.searchResults.teacherName,
    semester: availableSemesters.value[0],
    rating: 5,
    difficulty: 3,
    homework: 3,
    grading: 4,
    comment: '',
    isAnonymous: true,
  }
  showRatingDialog.value = true
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

.search-form {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.history-section {
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
}

.history-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.results-container {
  padding: 0 12px 80px;
}

.result-header {
  padding: 16px;
  background: white;
  border-radius: 12px 12px 0 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.result-title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.result-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
  color: #909399;
}

.result-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin: 12px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #409EFF;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.rating-list {
  padding: 8px 0;
}

.rating-item {
  padding: 16px;
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

.rating-stars {
  display: flex;
  gap: 2px;
  color: #E6A23C;
}

.rating-stars .filled {
  color: #E6A23C;
}

.rating-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #909399;
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
}
</style>