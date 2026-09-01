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
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { Lock, Loading } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { CasAuthService } from '@/api/cas'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

async function handleLogin() {
  authStore.setLoginLoading(true)
  authStore.setLoginError(null)

  try {
    const result = await CasAuthService.login()
    
    if (result.needsReAuth && result.reAuthUrl) {
      // 需要重新认证，通过代理打开
      const proxyUrl = `/api/cas${new URL(result.reAuthUrl).pathname}${new URL(result.reAuthUrl).search}`
      window.location.href = proxyUrl
      return
    }

    // 正常登录流程 - 直接跳转到 CAS 代理地址
    const casUrl = CasAuthService.getLoginUrl()
    window.location.href = casUrl
  } catch (error: any) {
    authStore.setLoginError(error.message || '登录失败，请重试')
  } finally {
    authStore.setLoginLoading(false)
  }
}

onMounted(() => {
  // 检查是否从 CAS 回调回来
  const urlParams = new URLSearchParams(window.location.search)
  const ticket = urlParams.get('ticket')
  const callback = urlParams.get('callback')
  
  if (ticket || callback) {
    // 从 CAS 回调回来，清理 URL 并检查登录状态
    window.history.replaceState({}, document.title, window.location.pathname)
    checkLoginStatus()
  } else if (authStore.isLoggedIn) {
    router.push('/dashboard')
  }
})

async function checkLoginStatus() {
  try {
    const loggedIn = await CasAuthService.checkLoginStatus()
    if (loggedIn) {
      router.push('/dashboard')
    }
  } catch (error) {
    console.error('检查登录状态失败:', error)
  }
}
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
</style>