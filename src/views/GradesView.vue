<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">成绩查询</h1>
      <div class="header-actions">
        <el-button size="small" @click="showCalcMethodDialog = true">
          <SwitchButton /> 计算方式
        </el-button>
        <el-button size="small" @click="uploadGrades" :loading="uploading" type="success">
          <Upload /> 贡献成绩
        </el-button>
        <el-button size="small" @click="refreshGrades" :loading="gradeStore.loading" type="primary">
          <Refresh /> 刷新
        </el-button>
      </div>
    </div>

    <div class="gpa-summary" @click="showGpaDetail = true">
      <div class="gpa-summary-title">
        <span>{{ gradeStore.calculationMethod === 'standard' ? 'GPA' : '综测成绩 (F2)' }}</span>
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

    <div class="tab-nav">
      <div class="tab-item" :class="{ active: activeTab === 'all' }" @click="activeTab = 'all'">全部</div>
      <div class="tab-item" :class="{ active: activeTab === 'required' }" @click="activeTab = 'required'">必修</div>
      <div class="tab-item" :class="{ active: activeTab === 'elective' }" @click="activeTab = 'elective'">选修</div>
      <div class="tab-item" :class="{ active: activeTab === 'general' }" @click="activeTab = 'general'">通识</div>
      <div class="tab-item" :class="{ active: activeTab === 'cross' }" @click="activeTab = 'cross'">跨专业</div>
    </div>

    <div class="grade-list">
      <div 
        class="grade-card" 
        v-for="grade in filteredGrades" 
        :key="`${grade.year}-${grade.semester}-${grade.courseId}`"
        @click="toggleGradeSelect(grade)"
        :class="{ selected: selectedGrades.has(getGradeKey(grade)) }"
      >
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
        <div class="grade-details">
          <div class="grade-detail-item">
            <span class="grade-detail-label">类型</span>
            <span>{{ getTypeLabel(grade.courseType) }}</span>
          </div>
          <div class="grade-detail-item">
            <span class="grade-detail-label">绩点</span>
            <span>{{ grade.gpa?.toFixed(2) }}</span>
          </div>
          <div class="grade-detail-item">
            <span class="grade-detail-label">开课院系</span>
            <span>{{ grade.courseCollege }}</span>
          </div>
          <div class="grade-detail-item">
            <span class="grade-detail-label">计入</span>
            <el-switch 
              v-model="gradeStore.enabledGrades[getGradeKey(grade)]" 
              :active-value="true" 
              :inactive-value="false"
              @change="gradeStore.toggleGradeEnabled(grade)"
              size="small"
            />
          </div>
        </div>
      </div>

      <div v-if="filteredGrades.length === 0" class="empty-state" style="margin: 24px 16px;">
        <div class="icon">📝</div>
        <div class="text">{{ activeTab === 'all' ? '暂无成绩记录，点击刷新获取' : '该类别下暂无成绩' }}</div>
        <el-button v-if="activeTab === 'all'" type="primary" @click="refreshGrades">获取成绩</el-button>
      </div>
    </div>

    <div v-if="selectedGrades.size > 0" class="selection-bar">
      <span>已选择 {{ selectedGrades.size }} 门课程</span>
      <el-button type="primary" size="small" @click="calculateSelected">计算 GPA</el-button>
      <el-button size="small" @click="clearSelection">清空选择</el-button>
    </div>
  </div>

  <el-dialog v-model="showCalcMethodDialog" title="选择计算方式" width="400px">
    <el-radio-group v-model="gradeStore.calculationMethod">
      <el-radio label="standard">标准 GPA (4.0制)</el-radio>
      <el-radio label="f2-new">新版 F2 (B1 + B2×0.002)</el-radio>
      <el-radio label="f2-old">旧版 F2 (B1×0.98 + B2×0.02)</el-radio>
    </el-radio-group>
    <div style="margin-top: 12px; padding: 12px; background: #f5f7fa; border-radius: 8px; font-size: 12px; color: #909399;">
      <strong>说明：</strong>
      <ul style="margin: 8px 0 0; padding-left: 20px;">
        <li>标准 GPA：按 4.0 制计算绩点平均</li>
        <li>新版 F2：计算机学院等使用，B1 + B2×0.002</li>
        <li>旧版 F2：资环学院等使用，B1×0.98 + B2×0.02</li>
      </ul>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="showCalcMethodDialog = false">关闭</el-button>
      </div>
    </template>
  </el-dialog>

  <el-dialog v-model="showGpaDetail" title="GPA 详情" width="500px">
    <div class="gpa-detail">
      <div class="detail-section">
        <h4>GPA 计算详情</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">加权平均分</span>
            <span class="detail-value">{{ gradeStore.gpaResult.weightedScore.toFixed(2) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">总学分</span>
            <span class="detail-value">{{ gradeStore.gpaResult.totalCredits }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">已获学分</span>
            <span class="detail-value">{{ gradeStore.gpaResult.earnedCredits }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">GPA (4.0制)</span>
            <span class="detail-value">{{ gradeStore.gpaResult.gpa.toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <div v-if="gradeStore.calculationMethod.startsWith('f2')" class="detail-section">
        <h4>综测 F2 计算详情</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">B1 (必修/通识均分)</span>
            <span class="detail-value">{{ gradeStore.gpaResult.f2Detail?.b1.toFixed(2) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">B2 (选修/跨专业均分)</span>
            <span class="detail-value">{{ gradeStore.gpaResult.f2Detail?.b2.toFixed(2) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">F2 综测成绩</span>
            <span class="detail-value" style="font-weight: 600; color: #409EFF;">{{ gradeStore.gpaResult.f2Score?.toFixed(2) }}</span>
          </div>
        </div>
        
        <div v-if="gradeStore.gpaResult.f2Detail?.selectedElectives.length" class="detail-subsection">
          <h5>参与计算的选修课 (前8门)</h5>
          <div class="elective-list">
            <div v-for="g in gradeStore.gpaResult.f2Detail!.selectedElectives" :key="g.courseId" class="elective-item">
              <span>{{ g.name }}</span>
              <span>{{ g.score }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h4>成绩分布统计</h4>
        <div class="distribution-bars">
          <div class="dist-bar" v-for="range in scoreRanges" :key="range.label">
            <span class="dist-label">{{ range.label }}</span>
            <div class="dist-bar-container">
              <div class="dist-bar-fill" :style="{ width: range.percentage + '%', background: range.color }"></div>
            </div>
            <span class="dist-count">{{ range.count }}</span>
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="showGpaDetail = false">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { SwitchButton, Refresh, Plus, Edit, Delete, Upload } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useGradesStore } from '@/stores/grades'
import { useAuthStore } from '@/stores/auth'
import { EducationApiService } from '@/api/education'
import { GradeDistributionApi } from '@/api/gradeDistribution'

const gradeStore = useGradesStore()
const authStore = useAuthStore()

const activeTab = ref<'all' | 'required' | 'elective' | 'general' | 'cross'>('all')
const showCalcMethodDialog = ref(false)
const showGpaDetail = ref(false)
const selectedGrades = ref<Set<string>>(new Set())
const uploading = ref(false)

const filteredGrades = computed(() => {
  if (activeTab.value === 'all') return gradeStore.grades
  return gradeStore.grades.filter(g => {
    const type = g.courseType
    if (activeTab.value === 'required') return type.includes('必修')
    if (activeTab.value === 'elective') return type.includes('选修')
    if (activeTab.value === 'general') return type.includes('通识')
    if (activeTab.value === 'cross') return type.includes('跨专业')
    return true
  })
})

const displayScore = computed(() => {
  if (gradeStore.calculationMethod.startsWith('f2')) {
    return gradeStore.gpaResult.f2Score?.toFixed(2) || '0.00'
  }
  return gradeStore.gpaResult.gpa.toFixed(2)
})

const scoreRanges = computed(() => {
  const ranges = [
    { label: '90-100', min: 90, max: 100, color: '#67C23A' },
    { label: '80-89', min: 80, max: 89, color: '#409EFF' },
    { label: '70-79', min: 70, max: 79, color: '#E6A23C' },
    { label: '60-69', min: 60, max: 69, color: '#F56C6C' },
    { label: '<60', min: 0, max: 59, color: '#909399' }
  ]
  
  const validGrades = gradeStore.grades.filter(g => gradeStore.isGradeEnabled(g))
  const total = validGrades.length || 1
  
  return ranges.map(r => {
    const count = validGrades.filter(g => g.score >= r.min && g.score <= r.max).length
    return { ...r, count, percentage: Math.round((count / total * 100) * 10) / 10 }
  })
})

onMounted(() => {
  if (authStore.isLoggedIn) {
    gradeStore.fetchGrades()
  }
})

function getGradeKey(grade: any) {
  return `${grade.year}-${grade.semester}-${grade.courseId}`
}

function getTypeLabel(type: string) {
  if (type.includes('必修')) return '必修'
  if (type.includes('选修')) return '选修'
  if (type.includes('通识')) return '通识'
  if (type.includes('跨专业')) return '跨专业'
  return type
}

function toggleGradeSelect(grade: any) {
  const key = getGradeKey(grade)
  if (selectedGrades.value.has(key)) {
    selectedGrades.value.delete(key)
  } else {
    selectedGrades.value.add(key)
  }
}

function clearSelection() {
  selectedGrades.value.clear()
}

function calculateSelected() {
  const keys = Array.from(selectedGrades.value)
  const selectedGradeItems = gradeStore.grades.filter(g => keys.includes(getGradeKey(g)))
  const result = EducationApiService.calculateGPA(selectedGradeItems, gradeStore.calculationMethod)
  ElMessage.success(`GPA: ${result.gpa.toFixed(2)} | 学分: ${result.earnedCredits}/${result.totalCredits}`)
}

async function refreshGrades() {
  try {
    await gradeStore.fetchGrades(undefined, undefined, true)
    ElMessage.success('刷新完成')
  } catch (error) {
    ElMessage.error('刷新失败')
  }
}

async function uploadGrades() {
  if (!gradeStore.grades || gradeStore.grades.length === 0) {
    ElMessage.warning('暂无成绩数据可上传')
    return
  }
  
  uploading.value = true
  try {
    await GradeDistributionApi.uploadGrades(gradeStore.grades)
    ElMessage.success('成绩贡献成功！感谢您帮助完善给分查询数据')
  } catch (error) {
    ElMessage.error('上传失败，请重试')
  } finally {
    uploading.value = false
  }
}

function getScoreClass(score: number) {
  if (score >= 90) return 'excellent'
  if (score >= 80) return 'good'
  if (score >= 60) return 'pass'
  return 'fail'
}

function formatSemester(year: number, semester: number) {
  const semesterMap: Record<number, string> = { 1: '秋季', 2: '春季', 3: '夏季' }
  return `${year}-${year + 1} 学年 ${semesterMap[semester]}学期`
}
</script>

<style scoped>
.header-actions {
  display: flex;
  gap: 8px;
}

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

.grade-card.selected {
  border: 2px solid #409EFF;
  background: #ecf5ff;
}

.selection-bar {
  position: fixed;
  bottom: 70px;
  left: 16px;
  right: 16px;
  background: white;
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.gpa-detail {
  padding: 8px 0;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h4 {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.detail-section h5 {
  margin: 16px 0 8px;
  font-size: 13px;
  font-weight: 500;
  color: #606266;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 12px;
  color: #909399;
}

.detail-value {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.detail-subsection {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f5f7fa;
}

.elective-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.elective-item {
  background: #f5f7fa;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.elective-item span:last-child {
  color: #409EFF;
  font-weight: 500;
}

.distribution-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dist-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dist-label {
  width: 60px;
  font-size: 12px;
  color: #606266;
}

.dist-bar-container {
  flex: 1;
  height: 8px;
  background: #f5f7fa;
  border-radius: 4px;
  overflow: hidden;
}

.dist-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.dist-count {
  width: 30px;
  text-align: right;
  font-size: 12px;
  color: #909399;
}
</style>