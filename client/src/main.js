import { createApp } from 'vue'
import { createPinia } from 'pinia'
import axios from 'axios'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { useAuthStore } from './stores/auth'
import App from './App.vue'
import router from './router'
import './assets/styles.css'

// Configure Axios
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Add axios interceptor for auth
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)
app.use(router)

// Initialize auth store
const authStore = useAuthStore(pinia)
authStore.init()

// Error handling
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue error:', err)
}

app.mount('#app')
