import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Analytics from '../views/Analytics.vue'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../components/Login.vue'),
    meta: { guest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../components/Register.vue'),
    meta: { guest: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../components/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/sources',
    name: 'Sources',
    component: () => import('../components/Sources.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/analytics',
    name: 'analytics',
    component: Analytics,
    meta: { requiresAuth: true }
  },
  {
    path: '/content-types',
    name: 'ContentTypes',
    component: () => import('../components/ContentTypeList.vue'), // Change this to use ContentTypeList
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Add error handling to router navigation
router.onError((error) => {
  console.error('Router error:', error)
})

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()
  const publicPages = ['/login', '/register']
  const authRequired = !publicPages.includes(to.path)

  if (authRequired) {
    if (!auth.token) {
      return next('/login')
    }
    try {
      await auth.checkAuth()
      next()
    } catch {
      next('/login')
    }
  } else {
    next()
  }
})

export default router
