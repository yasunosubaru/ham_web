<template>
  <div class="score-page">
    <!-- GPA Summary -->
    <div class="gpa-summary" v-if="gpaResult && gpaResult.gpa > 0">
      <div class="gpa-summary-title">加权平均绩点</div>
      <div class="gpa-summary-value">{{ gpaResult.gpa.toFixed(2) }}</div>
      <div class="gpa-summary-stats">
        <div class="gpa-stat">
          <div class="gpa-stat-value">{{ gpaResult.totalCredits }}</div>
          <div class="gpa-stat-label">总学分</div>
        </div>
        <div class="gpa-stat">
          <div class="gpa-stat-value">{{ avgScore.toFixed(1) }}</div>
          <div class="gpa-stat-label">平均分</div>
        </div>
        <div class="gpa-stat">
          <div class="gpa-stat-value">{{ gradeStore.grades.length }}</div>
          <div class="gpa-stat-label">课程数</div>
        </div>
      </div>
    </div>

    <!-- Filter tabs -->
    <div class="tab-nav">
      <div
        v-for="tab in filterTabs"
        :key="tab.value"
        class="tab-item"
        :class="{ active: currentFilter === tab.value }"
        @click="currentFilter = tab.value"
      >
        {{ tab.label }}
      </div>
    </div>

    <!-- Grade list -->
    <div v-if="filteredGrades.length === 0" class="empty-state">
      <div class="icon">📊</div>
      <div class="text">暂无成绩数据</div>
    </div>

    <div v-for="grade in filteredGrades" :key="grade.id" class="grade-card">
      <div class="grade-header">
        <div>
          <div class="grade-course-name">{{ grade.courseName }}</div>
          <div style="font-size:12px;color:#909399;margin-top:2px">{{ grade.teacher }}</div>
        </div>
        <div class="grade-score" :class="gradeStore.gradeColor(grade.score)">{{ grade.score }}</div>
      </div>
      <div class="grade-details">
        <div class="grade-detail-item">
          <span class="grade-detail-label">学分</span>
          <span>{{ grade.credit }}</span>
        </div>
        <div class="grade-detail-item">
          <span class="grade-detail-label">GPA</span>
          <span>{{ gradeStore.scoreToGPA(grade.score).toFixed(1) }}</span>
        </div>
        <div class="grade-detail-item">
          <span class="grade-detail-label">类型</span>
          <span>{{ typeLabels[grade.type] }}</span>
        </div>
        <div class="grade-detail-item">
          <span class="grade-detail-label">学期</span>
          <span>{{ grade.semester }}</span>
        </div>
      </div>
    </div>

    <!-- FAB -->
    <div class="fab" @click="showAddDialog = true">
      <el-icon :size="24"><Plus /></el-icon>
    </div>

    <!-- Add grade dialog -->
    <el-dialog v-model="showAddDialog" title="添加成绩" :close-on-click-modal="false">
      <el-form label-position="top">
        <el-form-item label="课程名称">
          <el-input v-model="newGrade.courseName" placeholder="如：高等数学A" />
        </el-form-item>
        <el-form-item label="授课教师">
          <el-input v-model="newGrade.teacher" placeholder="如：张教授" />
        </el-form-item>
        <el-form-item label="成绩">
          <el-input-number v-model="newGrade.score" :min="0" :max="100" />
        </el-form-item>
        <el-form-item label="学分">
          <el-input-number v-model="newGrade.credit" :min="0" :max="10" :step="0.5" />
        </el-form-item>
        <el-form-item label="课程类型">
          <el-select v-model="newGrade.type" style="width:100%">
            <el-option label="必修" value="required" />
            <el-option label="选修" value="elective" />
            <el-option label="通识" value="general" />
            <el-option label="跨专业" value="cross" />
          </el-select>
        </el-form-item>
        <el-form-item label="学期">
          <el-input v-model="newGrade.semester" placeholder="如：2025-2026-1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="addGrade">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { useGradeStore } from '@/stores/grade'
import type { Grade } from '@/types'

const gradeStore = useGradeStore()
const showAddDialog = ref(false)
const currentFilter = ref('all')

const filterTabs = [
  { label: '全部', value: 'all' },
  { label: '必修', value: 'required' },
  { label: '选修', value: 'elective' },
  { label: '通识', value: 'general' },
]

const typeLabels: Record<string, string> = {
  required: '必修',
  elective: '选修',
  general: '通识',
  cross: '跨专业'
}

const newGrade = ref({
  courseName: '',
  teacher: '',
  score: 85,
  credit: 3.0,
  type: 'required' as Grade['type'],
  semester: '2025-2026-1'
})

onMounted(() => {
  gradeStore.loadFromStorage()
})

const gpaResult = computed(() => gradeStore.calculateGPA())

const avgScore = computed(() => {
  const grades = gradeStore.grades
  if (grades.length === 0) return 0
  return grades.reduce((s, g) => s + g.score, 0) / grades.length
})

const filteredGrades = computed(() => {
  if (currentFilter.value === 'all') return gradeStore.grades
  return gradeStore.grades.filter(g => g.type === currentFilter.value)
})

function addGrade() {
  if (!newGrade.value.courseName) return
  gradeStore.addGrade({
    id: Date.now().toString(),
    courseName: newGrade.value.courseName,
    teacher: newGrade.value.teacher,
    credit: newGrade.value.credit,
    score: newGrade.value.score,
    gpa: gradeStore.scoreToGPA(newGrade.value.score),
    type: newGrade.value.type,
    semester: newGrade.value.semester,
    year: 2025,
    term: 1
  })
  showAddDialog.value = false
  newGrade.value = { courseName: '', teacher: '', score: 85, credit: 3.0, type: 'required', semester: '2025-2026-1' }
}
</script>

<style lang="scss" scoped>
.score-page {
  padding-bottom: 80px;
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

  &:active { transform: scale(0.9); }
}
</style>
