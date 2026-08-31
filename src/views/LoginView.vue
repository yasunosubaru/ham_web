<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-logo">
        <div class="login-logo-icon">H</div>
        <h1 class="login-title">WHU Ham</h1>
        <p class="login-subtitle">武汉大学学生生活助手</p>
      </div>

      <div class="cas-notice">
        <div class="cas-notice-title">⚠️ 登录说明</div>
        <div>将跳转至武汉大学统一身份认证 (CAS) 页面</div>
        <div>请使用信息门户账号密码登录</div>
        <div>登录成功后将自动返回应用</div>
      </div>

      <div class="login-form">
        <el-button 
          type="primary" 
          size="large" 
          block 
          @click="handleLogin" 
          :loading="authStore.loginLoading"
          class="login-btn"
        >
          <Lock v-if="!authStore.loginLoading" style="margin-right: 8px;" />
          <Loading v-else class="is-rotating" style="margin-right: 8px;" />
          {{ authStore.loginLoading ? '登录中...' : '通过信息门户登录' }}
        </el-button>

        <div v-if="authStore.loginError" class="error-message">
          {{ authStore.loginError }}
        </div>
      </div>

      <div class="login-footer">
        <p>登录即表示同意 <a href="https://github.com/whu-ham" target="_blank">用户协议</a> 和 <a href="https://github.com/whu-ham" target="_blank">隐私政策</a></p>
        <p>非官方应用，由 WHU Ham Team 开发维护</p>
      </div>
    </div>

    <!-- CAS 登录 iframe（隐藏，登录时显示） -->
    <div v-if="showCasIframe" class="cas-iframe-overlay">
      <div class="cas-iframe-container">
        <div class="cas-iframe-header">
          <span>武汉大学统一身份认证</span>
          <el-button size="small" @click="closeCasIframe">
            <Close />
          </el-button>
        </div>
        <iframe 
          ref="casIframe" 
          :src="casIframeSrc" 
          @load="onIframeLoad"
          sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-top-navigation-by-user-activation"
        ></iframe>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Lock, Loading, Close } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { CasAuthService } from '@/api/cas'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()

const showCasIframe = ref(false)
const casIframeSrc = ref('')
const casIframe = ref<HTMLIFrameElement | null>(null)

async function handleLogin() {
  authStore.setLoginLoading(true)
  authStore.setLoginError(null)

  try {
    const result = await CasAuthService.login()
    
    if (result.needsReAuth && result.reAuthUrl) {
      // 需要重新认证，通过代理打开
      const proxyUrl = `/api/cas${new URL(result.reAuthUrl).pathname}${new URL(result.reAuthUrl).search}`
      openCasIframe(proxyUrl)
      return
    }

    // 正常登录流程
    const casUrl = CasAuthService.getLoginUrl()
    openCasIframe(casUrl)
  } catch (error: any) {
    authStore.setLoginError(error.message || '登录失败，请重试')
  } finally {
    authStore.setLoginLoading(false)
  }
}

function openCasIframe(url: string) {
  casIframeSrc.value = url
  showCasIframe.value = true
}

function closeCasIframe() {
  showCasIframe.value = false
  casIframeSrc.value = ''
  // 关闭后检查是否登录成功
  checkLoginStatus()
}

function onIframeLoad() {
  // 检查 iframe 是否重定向回应用
  try {
    const iframe = casIframe.value
    if (iframe && iframe.contentWindow) {
      const href = iframe.contentWindow.location.href
      if (href.includes(window.location.origin) || href.includes('/dashboard') || href.includes('/callback')) {
        // 登录成功，关闭 iframe 并刷新页面
        closeCasIframe()
        router.push('/dashboard')
        ElMessage.success('登录成功')
      }
    }
  } catch (e) {
    // 跨域无法访问 iframe contentWindow，忽略
  }
}

async function checkLoginStatus() {
  const loggedIn = await CasAuthService.checkLoginStatus()
  if (loggedIn) {
    router.push('/dashboard')
  }
}

onMounted(() => {
  if (authStore.isLoggedIn) {
    router.push('/dashboard')
  }
})
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 32px 24px;
}

.login-logo {
  text-align: center;
  margin-bottom: 24px;
}

.login-logo-icon {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: linear-gradient(135deg, #409EFF 0%, #66B1FF 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  font-size: 36px;
  font-weight: 700;
  color: white;
}

.login-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px;
}

.login-subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.cas-notice {
  background: #fef0f0;
  border: 1px solid #f56c6c;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #F56C6C;
  line-height: 1.8;
}

.cas-notice-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.login-btn {
  height: 48px;
  font-size: 16px;
  font-weight: 500;
}

.error-message {
  margin-top: 12px;
  padding: 10px 12px;
  background: #fef0f0;
  border: 1px solid #f56c6c;
  border-radius: 8px;
  color: #F56C6C;
  font-size: 13px;
  text-align: center;
}

.login-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 12px;
  color: #909399;
  line-height: 1.8;
}

.login-footer a {
  color: #409EFF;
  text-decoration: none;
}

.login-footer a:active {
  opacity: 0.7;
}

/* CAS Iframe Overlay */
.cas-iframe-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.cas-iframe-container {
  width: 100%;
  max-width: 480px;
  height: 80vh;
  max-height: 700px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
}

.cas-iframe-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e4e7ed;
  font-weight: 500;
  color: #303133;
}

.cas-iframe-container iframe {
  flex: 1;
  border: none;
  width: 100%;
  min-height: 0;
}
</style>