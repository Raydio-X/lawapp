import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', noAuth: true }
  },
  {
    path: '/',
    component: () => import('@/layouts/TabBarLayout.vue'),
    redirect: '/home',
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/views/home/index.vue'),
        meta: { title: '社区' }
      },
      {
        path: 'study',
        name: 'Study',
        component: () => import('@/views/study/index.vue'),
        meta: { title: '学习' }
      },
      {
        path: 'create',
        name: 'Create',
        component: () => import('@/views/create/index.vue'),
        meta: { title: '创作' }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/profile/index.vue'),
        meta: { title: '我的' }
      }
    ]
  },
  {
    path: '/home/hotCards',
    name: 'HotCards',
    component: () => import('@/views/home/HotCards.vue'),
    meta: { title: '热门卡片' }
  },
  {
    path: '/home/search',
    name: 'Search',
    component: () => import('@/views/home/Search.vue'),
    meta: { title: '搜索' }
  },
  {
    path: '/library/:id',
    name: 'LibraryDetail',
    component: () => import('@/views/library/Detail.vue'),
    meta: { title: '知识库详情' }
  },
  {
    path: '/card/study',
    name: 'CardStudy',
    component: () => import('@/views/card/Study.vue'),
    meta: { title: '卡片学习' }
  },
  {
    path: '/study/select',
    name: 'StudySelect',
    component: () => import('@/views/study/Select.vue'),
    meta: { title: '选择知识库' }
  },
  {
    path: '/study/cards',
    name: 'StudyCards',
    component: () => import('@/views/study/Cards.vue'),
    meta: { title: '学习卡片' }
  },
  {
    path: '/study/exam/setup',
    name: 'ExamSetup',
    component: () => import('@/views/study/exam/Setup.vue'),
    meta: { title: '模拟考试设置' }
  },
  {
    path: '/study/exam/do',
    name: 'ExamDo',
    component: () => import('@/views/study/exam/Do.vue'),
    meta: { title: '模拟考试' }
  },
  {
    path: '/study/exam/review',
    name: 'ExamReview',
    component: () => import('@/views/study/exam/Review.vue'),
    meta: { title: '考试回顾' }
  },
  {
    path: '/profile/favorites',
    name: 'Favorites',
    component: () => import('@/views/profile/Favorites.vue'),
    meta: { title: '我的收藏' }
  },
  {
    path: '/profile/messages',
    name: 'Messages',
    component: () => import('@/views/profile/Messages.vue'),
    meta: { title: '消息中心' }
  },
  {
    path: '/profile/study-stats',
    name: 'StudyStats',
    component: () => import('@/views/profile/StudyStats.vue'),
    meta: { title: '学习统计' }
  },
  {
    path: '/create/card',
    name: 'CreateCard',
    component: () => import('@/views/create/CardForm.vue'),
    meta: { title: '创建卡片' }
  },
  {
    path: '/create/library',
    name: 'CreateLibrary',
    component: () => import('@/views/create/LibraryForm.vue'),
    meta: { title: '创建知识库' }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/admin/index.vue'),
    meta: { title: '管理后台' }
  },
  {
    path: '/admin/broadcast',
    name: 'AdminBroadcast',
    component: () => import('@/views/admin/Broadcast.vue'),
    meta: { title: '发布通知' }
  },
  {
    path: '/admin/library-form',
    name: 'AdminLibraryForm',
    component: () => import('@/views/admin/LibraryForm.vue'),
    meta: { title: '编辑知识库' }
  },
  {
    path: '/admin/card-form',
    name: 'AdminCardForm',
    component: () => import('@/views/admin/CardForm.vue'),
    meta: { title: '编辑卡片' }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/home'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = (to.meta.title as string) || '法硕背诵助手'
  
  const userStore = useUserStore()
  const token = userStore.token || localStorage.getItem('access_token')
  
  if (!to.meta.noAuth && !token) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }
  
  next()
})

export default router
