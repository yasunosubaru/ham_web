<template>
  <div class="settings-page">
    <!-- Settings groups -->
    <div class="setting-group">
      <div class="setting-item" @click="showSemesterDialog = true">
        <div class="setting-left">
          <span class="setting-icon">🗓️</span>
          <span class="setting-name">学期设置</span>
        </div>
        <span class="setting-arrow">›</span>
      </div>
      <div class="setting-item">
        <div class="setting-left">
          <span class="setting-icon">🔒</span>
          <span class="setting-name">生物识别锁定</span>
        </div>
        <div class="toggle" :class="{ on: bioLock }" @click="bioLock = !bioLock" />
      </div>
    </div>

    <div class="setting-group">
      <div class="setting-item" @click="exportData">
        <div class="setting-left">
          <span class="setting-icon">📤</span>
          <span class="setting-name">导出数据</span>
        </div>
        <span class="setting-arrow">›</span>
      </div>
      <div class="setting-item" @click="importData">
        <div class="setting-left">
          <span class="setting-icon">📥</span>
          <span class="setting-name">导入数据</span>
        </div>
        <span class="setting-arrow">›</span>
      </div>
      <div class="setting-item" @click="clearData">
        <div class="setting-left">
          <span class="setting-icon">🗑️</span>
          <span class="setting-name danger">清除所有数据</span>
        </div>
        <span class="setting-arrow">›</span>
      </div>
    </div>

    <!-- About -->
    <div class="about-card">
      <div class="about-icon">🎓</div>
      <div class="about-name">Ham Web v1.0</div>
      <div class="about-desc">武汉大学校园生活助手</div>
      <div class="about-sub">Web 版 · 可添加到 iOS 主屏幕使用</div>
    </div>

    <!-- Semester dialog -->
    <el-dialog v-model="showSemesterDialog" title="学期设置" :close-on-click-modal="false">
      <el-form label-position="top">
        <el-form-item label="开学日期">
          <el-date-picker
            v-model="semesterStart"
            type="date"
            value-format="YYYY-MM-DD"
            style="width:100%"
          />
        </el-form-item>
        <el-form-item label="总周数">
          <el-input-number v-model="totalWeeks" :min="1" :max="30" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSemesterDialog = false">取消</el-button>
        <el-button type="primary" @click="saveSemester">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCourseStore } from '@/stores/course'
import { ElMessageBox, ElMessage } from 'element-plus'

const courseStore = useCourseStore()
const bioLock = ref(true)
const showSemesterDialog = ref(false)
const semesterStart = ref('')
const totalWeeks = ref(20)

onMounted(() => {
  courseStore.loadFromStorage()
  semesterStart.value = courseStore.settings.semesterStartDate || '2026-02-23'
  totalWeeks.value = 20
})

function saveSemester() {
  courseStore.settings.semesterStartDate = semesterStart.value
  courseStore.saveSettings()
  showSemesterDialog.value = false
  ElMessage.success('已保存')
}

function exportData() {
  const data = {
    courses: courseStore.courses,
    settings: courseStore.settings,
    grades: JSON.parse(localStorage.getItem('ham_grades') || '[]'),
    events: JSON.parse(localStorage.getItem('ham_events') || '[]'),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ham-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function importData() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        if (data.courses) {
          localStorage.setItem('ham_courses', JSON.stringify(data.courses))
        }
        if (data.grades) {
          localStorage.setItem('ham_grades', JSON.stringify(data.grades))
        }
        if (data.events) {
          localStorage.setItem('ham_events', JSON.stringify(data.events))
        }
        if (data.settings) {
          localStorage.setItem('ham_course_settings', JSON.stringify(data.settings))
        }
        ElMessage.success('导入成功，请刷新页面')
      } catch {
        ElMessage.error('导入失败：文件格式错误')
      }
    }
    reader.readAsText(file)
  }
  input.click()
}

function clearData() {
  ElMessageBox.confirm('确定清除所有数据？此操作不可恢复。', '确认清除', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    localStorage.clear()
    ElMessage.success('已清除，请刷新页面')
  }).catch(() => {})
}
</script>

<style lang="scss" scoped>
.settings-page {
  padding: 12px;
  padding-bottom: 80px;
}

.setting-group {
  background: white;
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #f5f7fa;
  cursor: pointer;

  &:last-child { border-bottom: none; }
  &:active { background: #f5f7fa; }
}

.setting-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.setting-icon {
  font-size: 20px;
}

.setting-name {
  font-size: 14px;

  &.danger { color: #F56C6C; }
}

.setting-arrow {
  color: #d1d5db;
  font-size: 18px;
}

.toggle {
  width: 46px;
  height: 28px;
  background: #d1d5db;
  border-radius: 14px;
  position: relative;
  cursor: pointer;
  transition: background 0.3s;

  &::after {
    content: '';
    width: 22px;
    height: 22px;
    background: white;
    border-radius: 50%;
    position: absolute;
    top: 3px;
    left: 3px;
    transition: transform 0.3s;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  }

  &.on {
    background: #67C23A;
    &::after { transform: translateX(18px); }
  }
}

.about-card {
  background: white;
  border-radius: 14px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.about-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.about-name {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
}

.about-desc {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.about-sub {
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 8px;
}
</style>
