import { defineStore } from 'pinia'
import axios from 'axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token'),
    user: null,
    isAuthenticated: false
  }),

  actions: {
    init() {
      // Set up axios auth header if token exists
      const token = localStorage.getItem('token')
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        this.checkAuth()
      }
    },

    async login(credentials) {
      try {
        const { data } = await axios.post('/api/auth/login', credentials)
        this.token = data.token
        localStorage.setItem('token', data.token)
        this.isAuthenticated = true
        return data
      } catch (error) {
        throw error.response?.data || error
      }
    },

    async checkAuth() {
      if (!this.token) return false
      try {
        const { data } = await axios.get('/api/auth/me')
        this.user = data
        this.isAuthenticated = true
        return true
      } catch (error) {
        this.logout()
        return false
      }
    },

    logout() {
      this.token = null
      this.user = null
      this.isAuthenticated = false
      localStorage.removeItem('token')
    }
  }
})
