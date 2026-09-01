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
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()

async function handleLogin() {
  authStore.setLoginLoading(true)
  authStore.setLoginError(null)

  try {
    const result = await CasAuthService.login()
    
    // 直接跳转到 CAS 官方登录页面
    window.location.href = result.url
  } catch (error: any) {
    authStore.setLoginError(error.message || '登录失败，请重试')
  } finally {
    authStore.setLoginLoading(false)
  }
}

onMounted(async () => {
  // 检查是否从 CAS 回调回来（带 ticket 参数）
  const urlParams = new URLSearchParams(window.location.search)
  const ticket = urlParams.get('ticket')
  
  if (ticket) {
    // 从 CAS 回调回来，清理 URL 并验证登录
    window.history.replaceState({}, document.title, window.location.pathname)
    await verifyTicketAndLogin(ticket)
    return
  }
  
  // 检查是否已登录
  if (authStore.isLoggedIn) {
    router.push('/dashboard')
    return
  }
  
  // 尝试恢复登录状态（防止刷新丢失状态）
  await checkLoginStatus()
})

async function verifyTicketAndLogin(ticket: string) {
  try {
    // 通过 Worker 验证 ticket 并建立会话
    const response = await fetch(`/api/cas/authserver/login?service=${encodeURIComponent('https://jwgl.whu.edu.cn/sso/jznewsixlogin')}&ticket=${ticket}`, {
      credentials: 'include'
    })
    
    if (response.ok) {
      // 验证登录状态
      const loggedIn = await CasAuthService.checkLoginStatus()
      if (loggedIn) {
        router.push('/dashboard')
      } else {
        ElMessage.error('登录验证失败，请重试')
        router.push('/login')
      }
    } else {
      ElMessage.error('登录验证失败，请重试')
      router.push('/login')
    }
  } catch (error) {
    console.error('验证 ticket 失败:', error)
    ElMessage.error('登录验证失败，请重试')
    router.push('/login')
  }
}

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