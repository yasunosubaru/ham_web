<template>
  <div id="app" :class="{ 'safe-area': isIOS }">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
    
    <TabBar v-if="showTabBar" :current="currentRoute" @change="onTabChange" />
    
    <div v-if="showInstallPrompt" class="install-prompt">
      <div class="install-content">
        <span class="install-icon">📱</span>
        <div class="install-text">
          <p>安装 "WHU Ham" 到主屏幕</p>
          <p class="install-sub">像原生应用一样使用，离线也可访问</p>
        </div>
        <el-button size="small" @click="installApp">安装</el-button>
        <el-button size="small" link @click="dismissInstall">稍后</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import TabBar from '@/components/TabBar.vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()

const tabRoutes = ['/dashboard', '/grades', '/grade-distribution', '/teachers', '/schedule', '/settings']
const showTabBar = computed(() => tabRoutes.some(r => route.path.startsWith(r)))

const currentRoute = computed(() => {
  const index = tabRoutes.findIndex(r => route.path.startsWith(r))
  return index >= 0 ? index : 0
})

function onTabChange(index: number) {
  router.push(tabRoutes[index])
}

const isIOS = computed(() => /iPad|iPhone|iPod/.test(navigator.userAgent))

const showInstallPrompt = ref(false)
let deferredPrompt: any = null

onMounted(() => {
  if (!isIOS.value) {
    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault()
      deferredPrompt = e
      setTimeout(() => {
        if (!localStorage.getItem('ham_install_dismissed')) {
          showInstallPrompt.value = true
        }
      }, 10000)
    })

    window.addEventListener('appinstalled', () => {
      showInstallPrompt.value = false
      deferredPrompt = null
    })
  }
})

async function installApp() {
  if (deferredPrompt) {
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      ElMessage.success('安装成功！')
    }
    deferredPrompt = null
    showInstallPrompt.value = false
  }
}

function dismissInstall() {
  showInstallPrompt.value = false
  localStorage.setItem('ham_install_dismissed', 'true')
}
</script>

<style scoped>
#app {
  min-height: 100vh;
  background: #f5f7fa;
}

.safe-area {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

.install-prompt {
  position: fixed;
  bottom: 70px;
  left: 16px;
  right: 16px;
  z-index: 1000;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.install-content {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.install-icon {
  font-size: 28px;
}

.install-text {
  flex: 1;
}

.install-text p {
  margin: 0;
  font-size: 14px;
  color: #303133;
}

.install-sub {
  font-size: 12px !important;
  color: #909399 !important;
  margin-top: 4px !important;
}
</style>