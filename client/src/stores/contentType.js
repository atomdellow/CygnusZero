import { defineStore } from 'pinia'
import axios from 'axios'

// Use axios instance with auth token
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const useContentTypeStore = defineStore('contentType', {
  state: () => ({
    contentTypes: [],
    loading: false,
    error: null
  }),

  actions: {
    async fetchContentTypes() {
      this.loading = true
      try {
        const { data } = await axios.get('/api/content-types')
        // console.log('Store received content types:', data)
        this.contentTypes = data
        return data // Return the data for component use
      } catch (error) {
        console.error('Store error:', error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
