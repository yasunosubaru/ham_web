import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/home'
    },
    {
      path: '/home',
      name: 'home',
      component: () => import('@/views/Home.vue'),
      meta: { title: '首页', icon: 'House', tabBar: true }
    },
    {
      path: '/schedule',
      name: 'schedule',
      component: () => import('@/views/Schedule.vue'),
      meta: { title: '课程表', icon: 'Calendar', tabBar: true }
    },
    {
      path: '/grade',
      name: 'grade',
      component: () => import('@/views/Score.vue'),
      meta: { title: '成绩', icon: 'DataAnalysis', tabBar: true }
    },
    {
      path: '/calendar',
      name: 'calendar',
      component: () => import('@/views/Calendar.vue'),
      meta: { title: '日程', icon: 'Clock', tabBar: true }
    },
    {
      path: '/library',
      name: 'library',
      component: () => import('@/views/Library.vue'),
      meta: { title: '图书馆', icon: 'Reading', tabBar: true }
    },
    {
      path: '/sport',
      name: 'sport',
      component: () => import('@/views/Sport.vue'),
      meta: { title: '运动场馆', icon: 'Football', tabBar: true }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/Settings.vue'),
      meta: { title: '设置', icon: 'Setting', tabBar: true }
    }
  ]
})

router.beforeEach((to) => {
  document.title = (to.meta.title ? `${to.meta.title} - ` : '') + 'Ham'
})

export default router
