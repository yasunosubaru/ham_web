<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">设置</h1>
    </div>

    <div class="settings-section">
      <h3 class="settings-group-title">账号与安全</h3>
      <div v-if="authStore.isLoggedIn" class="user-info-card">
        <div class="user-avatar" :style="{ background: userAvatarBg }">
          {{ authStore.userInfo?.name?.charAt(0) || 'U' }}
        </div>
        <div class="user-details">
          <div class="user-name">{{ authStore.userInfo?.name }}</div>
          <div class="user-meta">{{ authStore.userInfo?.studentId }} · {{ authStore.userInfo?.college }} · {{ authStore.userInfo?.major }}</div>
        </div>
        <el-button type="danger" size="small" @click="logout">退出登录</el-button>
      </div>
      <div v-else class="login-prompt">
        <el-button type="primary" @click="router.push('/login')">去登录</el-button>
      </div>
    </div>

    <div class="settings-section">
      <h3 class="settings-group-title">通用</h3>
      <el-collapse v-model="activeCollapses" accordion>
        <el-collapse-item name="appearance" title="外观设置">
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">主题模式</span>
              <span class="setting-desc">选择应用的色彩主题</span>
            </div>
            <el-select v-model="settingsStore.settings.theme" placeholder="选择主题" style="width: 140px" @change="settingsStore.updateSettings({ theme: settingsStore.settings.theme })">
              <el-option label="跟随系统" value="system" />
              <el-option label="浅色" value="light" />
              <el-option label="深色" value="dark" />
            </el-select>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">主题色</span>
              <span class="setting-desc">自定义应用的主品牌色</span>
            </div>
            <el-color-picker v-model="settingsStore.settings.primaryColor" show-alpha @change="settingsStore.updateSettings({ primaryColor: settingsStore.settings.primaryColor })" />
          </div>
        </el-collapse-item>

        <el-collapse-item name="notifications" title="通知设置">
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">成绩更新通知</span>
              <span class="setting-desc">成绩有更新时推送通知</span>
            </div>
            <el-switch v-model="settingsStore.settings.gradeNotification" @change="settingsStore.updateSettings({ gradeNotification: settingsStore.settings.gradeNotification })" />
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">自动刷新成绩</span>
              <span class="setting-desc">打开应用时自动检查成绩更新</span>
            </div>
            <el-switch v-model="settingsStore.settings.autoRefreshGrades" @change="settingsStore.updateSettings({ autoRefreshGrades: settingsStore.settings.autoRefreshGrades })" />
          </div>
        </el-collapse-item>

        <el-collapse-item name="data" title="数据管理">
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">导出所有数据</span>
              <span class="setting-desc">导出课程、成绩、日程等所有数据为 JSON</span>
            </div>
            <el-button size="small" @click="exportData">导出</el-button>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">导入数据</span>
              <span class="setting-desc">从 JSON 文件恢复数据</span>
            </div>
            <el-upload
              action="#"
              :auto-upload="false"
              :on-change="onImportData"
              :show-file-list="false"
              accept=".json"
            >
              <el-button size="small">选择文件</el-button>
            </el-upload>
          </div>
          <div class="setting-item danger">
            <div class="setting-info">
              <span class="setting-label">清空所有数据</span>
              <span class="setting-desc">不可恢复，请谨慎操作</span>
            </div>
            <el-button size="small" type="danger" @click="confirmClearData">清空</el-button>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>

    <div class="settings-section">
      <h3 class="settings-group-title">功能设置</h3>
      <el-collapse v-model="activeCollapses" accordion>
        <el-collapse-item name="course" title="课程表">
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">开学日期</span>
              <span class="setting-desc">用于计算当前周次</span>
            </div>
            <el-date-picker v-model="courseStore.settings.semesterStartDate" type="date" placeholder="选择开学日期" style="width: 100%" @change="courseStore.saveSettings" />
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">课程透明度</span>
              <span class="setting-desc">课程块的透明度</span>
            </div>
            <el-slider v-model="courseStore.settings.courseOpacity" :min="0.3" :max="1" :step="0.1" show-stops style="width: 200px" @change="courseStore.saveSettings" />
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">显示周末</span>
              <span class="setting-desc">在课程表中显示周六、周日</span>
            </div>
            <el-switch v-model="courseStore.settings.showWeekends" @change="courseStore.saveSettings" />
          </div>
        </el-collapse-item>

        <el-collapse-item name="grade" title="成绩计算">
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">计算方式</span>
              <span class="setting-desc">综测成绩计算公式</span>
            </div>
            <el-select v-model="gradeStore.calculationMethod" placeholder="选择计算方式" style="width: 100%" @change="gradeStore.setCalculationMethod(gradeStore.calculationMethod)">
              <el-option label="标准 GPA (4.0制)" value="standard" />
              <el-option label="新版 F2 (B1 + B2×0.002)" value="f2-new" />
              <el-option label="旧版 F2 (B1×0.98 + B2×0.02)" value="f2-old" />
            </el-select>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>

    <div class="settings-section">
      <h3 class="settings-group-title">关于</h3>
      <div class="about-card">
        <div class="about-logo">📱</div>
        <h3>WHU Ham</h3>
        <p class="about-version">版本 1.0.0 (Web PWA)</p>
        <p class="about-desc">武汉大学学生生活助手网页版</p>
        <div class="about-links">
          <el-button size="small" @click="openGithub">GitHub 仓库</el-button>
          <el-button size="small" @click="openDocs">文档站点</el-button>
          <el-button size="small" @click="openIssues">问题反馈</el-button>
        </div>
        <p class="about-copyright">© 2024-2025 WHU Ham Team. 基于 Vue 3 + Element Plus 构建</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useCourseStore } from '@/stores/course'
import { useGradesStore } from '@/stores/grades'
import { useSettingsStore } from '@/stores/settings'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()
const courseStore = useCourseStore()
const gradeStore = useGradesStore()
const settingsStore = useSettingsStore()

const activeCollapses = ref<string[]>(['appearance'])

onMounted(() => {
  settingsStore.loadFromStorage()
  courseStore.loadFromStorage()
  gradeStore.loadFromStorage()
  gradeStore.loadCalculationMethod()
})

const userAvatarBg = computed(() => {
  const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#e67e22', '#9b59b6', '#1abc9c']
  const name = authStore.userInfo?.name || ''
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
})

function logout() {
  ElMessageBox.confirm('确定要退出登录吗？', '退出登录', {
    confirmButtonText: '退出',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    authStore.logout()
    router.push('/login')
    ElMessage.success('已退出登录')
  }).catch(() => {})
}

function exportData() {
  const data = {
    courses: courseStore.courses,
    grades: gradeStore.grades,
    schedules: JSON.parse(localStorage.getItem('ham_schedules') || '[]'),
    settings: {
      course: courseStore.settings,
      grade: gradeStore.settings,
      app: settingsStore.settings,
    },
    exportTime: new Date().toISOString()
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ham-backup-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success('数据导出成功')
}

function onImportData(file: File) {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string)
      
      if (data.courses) {
        localStorage.setItem('ham_courses', JSON.stringify(data.courses))
        courseStore.loadFromStorage()
      }
      if (data.grades) {
        localStorage.setItem('ham_grades', JSON.stringify(data.grades))
        gradeStore.loadFromStorage()
      }
      if (data.settings) {
        if (data.settings.course) {
          courseStore.settings = { ...courseStore.settings, ...data.settings.course }
          courseStore.saveSettings()
        }
        if (data.settings.grade) {
          gradeStore.settings = { ...gradeStore.settings, ...data.settings.grade }
        }
        if (data.settings.app) {
          settingsStore.settings = { ...settingsStore.settings, ...data.settings.app }
          settingsStore.saveToStorage()
        }
      }
      
      ElMessage.success('数据导入成功，页面将刷新')
      setTimeout(() => window.location.reload(), 1000)
    } catch (err) {
      ElMessage.error('导入失败：文件格式不正确')
    }
  }
  reader.readAsText(file.raw)
}

async function confirmClearData() {
  try {
    await ElMessageBox.confirm(
      '此操作将永久删除所有本地数据（课程、成绩、日程、预约记录等），且无法恢复。确定要继续吗？',
      '清空所有数据',
      {
        confirmButtonText: '确定清空',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: true
      }
    )
    
    const keysToKeep = ['ham_theme_mode', 'ham_theme_color', 'ham_install_dismissed']
    const allKeys = Object.keys(localStorage)
    for (const key of allKeys) {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key)
      }
    }
    
    ElMessage.success('所有数据已清空，页面将刷新')
    setTimeout(() => window.location.reload(), 1000)
  } catch {}
}

function openGithub() {
  window.open('https://github.com/whu-ham', '_blank')
}

function openDocs() {
  window.open('https://whu-ham.github.io', '_blank')
}

function openIssues() {
  window.open('https://github.com/whu-ham/whu-ham.github.io/issues', '_blank')
}
</script>

<style scoped>
.settings-section {
  margin: 12px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.settings-group-title {
  font-size: 12px;
  font-weight: 500;
  color: #909399;
  padding: 16px 16px 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.user-info-card {
  display: flex;
  align-items: center;
  padding: 16px;
  gap: 12px;
}

.user-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 600;
  color: white;
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.user-meta {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.login-prompt {
  padding: 16px;
  text-align: center;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f5f7fa;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item.danger {
  background: #fef0f0;
}

.setting-info {
  flex: 1;
}

.setting-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.setting-desc {
  font-size: 12px;
  color: #909399;
}

.about-card {
  padding: 32px 16px;
  text-align: center;
}

.about-logo {
  font-size: 48px;
  margin-bottom: 12px;
}

.about-card h3 {
  margin: 0 0 4px;
  font-size: 22px;
  font-weight: 600;
  color: #303133;
}

.about-version {
  margin: 0 0 12px;
  color: #909399;
  font-size: 14px;
}

.about-desc {
  margin: 0 0 20px;
  color: #606266;
  font-size: 13px;
}

.about-links {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.about-copyright {
  margin: 0;
  color: #C0C4CC;
  font-size: 11px;
}
</style>