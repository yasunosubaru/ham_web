<template>
  <div class="app-container">
    <!-- Status bar spacer for iOS -->
    <div class="status-bar-spacer" />

    <!-- Page content -->
    <div class="page-container">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>

    <!-- Bottom Tab Bar -->
    <nav class="tab-bar">
      <div
        v-for="tab in tabs"
        :key="tab.path"
        class="tab-bar-item"
        :class="{ active: currentPath === tab.path }"
        @click="navigateTo(tab.path)"
      >
        <el-icon :size="22">
          <component :is="tab.icon" />
        </el-icon>
        <span class="tab-bar-label">{{ tab.label }}</span>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  House, Calendar, DataAnalysis, Clock,
  Reading, Football, Setting
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const tabs = [
  { path: '/home', label: '首页', icon: House },
  { path: '/schedule', label: '课表', icon: Calendar },
  { path: '/grade', label: '成绩', icon: DataAnalysis },
  { path: '/calendar', label: '日程', icon: Clock },
  { path: '/library', label: '图书馆', icon: Reading },
  { path: '/sport', label: '运动', icon: Football },
  { path: '/settings', label: '设置', icon: Setting },
]

const currentPath = computed(() => route.path)

function navigateTo(path: string) {
  if (route.path !== path) {
    router.push(path)
  }
}
</script>

<style lang="scss" scoped>
.app-container {
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.status-bar-spacer {
  height: env(safe-area-inset-top, 0px);
  background: white;
  flex-shrink: 0;
}

.page-container {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.tab-bar {
  display: flex;
  background: white;
  border-top: 1px solid #ebeef5;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  flex-shrink: 0;
  z-index: 100;
}

.tab-bar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6px 0 4px;
  gap: 2px;
  cursor: pointer;
  color: #909399;
  transition: color 0.2s;

  &.active {
    color: #409EFF;
  }

  &:active {
    opacity: 0.7;
  }
}

.tab-bar-label {
  font-size: 10px;
  line-height: 1;
}

// Transition animations
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
