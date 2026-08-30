<template>
  <div class="cas-callback">
    <div class="callback-container">
      <div class="callback-icon">
        <Loading class="is-rotating" />
      </div>
      <h2 class="callback-title">登录中...</h2>
      <p class="callback-message">{{ message }}</p>
      <el-progress :percentage="progress" :stroke-width="4" status="active" />
      
      <div v-if="error" class="error-section">
        <p class="error-text">{{ error }}</p>
        <el-button type="primary" @click="retryLogin">重新登录</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { CasAuthService } from '@/api/cas'
import { useAuthStore } from '@/stores/auth'
import { EducationApiService } from '@/api/education'

const router = useRouter()
const authStore = useAuthStore()

const message = ref('正在验证登录状态...')
const progress = ref(0)
const error = ref<string | null>(null)

onMounted(async () => {
  await handleCallback()
})

async function handleCallback() {
  try {
    progress.value = 10
    message.value = '正在获取用户信息...'

    // Check if we have a valid CAS cookie
    const cookie = localStorage.getItem('ham_cas_cookie')
    if (!cookie) {
      throw new Error('未检测到登录凭证，请重新登录')
    }

    progress.value = 30
    message.value = '正在登录教务系统...'

    // Login to education system
    await EducationApiService.login()

    progress.value = 60
    message.value = '正在获取个人信息...'

    // Get user info
    const userInfo = await EducationApiService.getUserInfo()

    progress.value = 80
    message.value = '登录成功，正在跳转...'

    // Save auth state
    authStore.setLoginState(userInfo, cookie)

    progress.value = 100
    message.value = '登录成功！'

    setTimeout(() => {
      router.replace('/dashboard')
    }, 500)
  } catch (err: any) {
    error.value = err.message || '登录验证失败'
    progress.value = 0
  }
}

function retryLogin() {
  error.value = null
  progress.value = 0
  message.value = '正在重新登录...'
  handleCallback()
}
</script>

<style scoped>
.cas-callback {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
}

.callback-container {
  width: 100%;
  max-width: 320px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 40px 32px;
  text-align: center;
}

.callback-icon {
  font-size: 48px;
  color: #409EFF;
  margin-bottom: 16px;
}

.callback-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px;
}

.callback-message {
  font-size: 14px;
  color: #909399;
  margin: 0 0 24px;
}

.error-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #f5f7fa;
}

.error-text {
  font-size: 14px;
  color: #F56C6C;
  margin: 0 0 16px;
}
</style>