import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { title: '登录', requiresAuth: false, hideTabBar: true },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { title: '首页', icon: 'House', requiresAuth: true },
    },
    {
      path: '/grades',
      name: 'grades',
      component: () => import('@/views/GradesView.vue'),
      meta: { title: '成绩', icon: 'Document', requiresAuth: true },
    },
    {
      path: '/grade-distribution',
      name: 'grade-distribution',
      component: () => import('@/views/GradeDistributionView.vue'),
      meta: { title: '给分查询', icon: 'Histogram', requiresAuth: true },
    },
    {
      path: '/teachers',
      name: 'teachers',
      component: () => import('@/views/TeachersView.vue'),
      meta: { title: '教师查询', icon: 'User', requiresAuth: true },
    },
    {
      path: '/schedule',
      name: 'schedule',
      component: () => import('@/views/ScheduleView.vue'),
      meta: { title: '课程表', icon: 'Calendar', requiresAuth: true },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: { title: '设置', icon: 'Setting', requiresAuth: true },
    },
    {
      path: '/cas-callback',
      name: 'cas-callback',
      component: () => import('@/views/CasCallbackView.vue'),
      meta: { title: '登录中...', requiresAuth: false, hideTabBar: true },
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    next('/login')
  } else if (to.path === '/login' && authStore.isLoggedIn) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router