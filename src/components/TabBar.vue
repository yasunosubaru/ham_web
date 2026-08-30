<template>
  <div class="tab-bar" :class="{ 'safe-bottom': isIOS }">
    <div class="tab-item" 
      v-for="(tab, index) in tabs" 
      :key="tab.path"
      :class="{ active: current === index }"
      @click="$emit('change', index)"
    >
      <component :is="tab.icon" class="tab-icon" />
      <span class="tab-label">{{ tab.title }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { House, Document, Histogram, User, Calendar, Setting } from '@element-plus/icons-vue'

const props = defineProps<{
  current: number
}>()

const emit = defineEmits<{
  change: [index: number]
}>()

const isIOS = computed(() => /iPad|iPhone|iPod/.test(navigator.userAgent))

const tabs = [
  { path: '/dashboard', title: '首页', icon: House },
  { path: '/grades', title: '成绩', icon: Document },
  { path: '/grade-distribution', title: '给分', icon: Histogram },
  { path: '/teachers', title: '教师', icon: User },
  { path: '/schedule', title: '课表', icon: Calendar },
  { path: '/settings', title: '设置', icon: Setting },
]
</script>

<style scoped>
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: white;
  border-top: 1px solid #e4e7ed;
  display: flex;
  z-index: 100;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.tab-bar.safe-bottom {
  height: calc(56px + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: #909399;
  cursor: pointer;
  transition: color 0.2s ease;
}

.tab-item.active {
  color: #409EFF;
}

.tab-icon {
  font-size: 22px;
  line-height: 1;
}

.tab-label {
  font-size: 11px;
  font-weight: 500;
}
</style>