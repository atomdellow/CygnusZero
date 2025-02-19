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
    contentTypes: [],  // Initialize as empty array
    loading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      pages: 0
    }
  }),

  getters: {
    hasContentTypes: (state) => Array.isArray(state.contentTypes) && state.contentTypes.length > 0,
    getContentTypesCount: (state) => state.contentTypes?.length || 0
  },

  actions: {
    async fetchContentTypes(params = {}) {
      this.loading = true
      this.error = null
      
      try {
        const queryParams = new URLSearchParams({
          page: params?.page?.toString() || this.pagination.page.toString(),
          limit: params?.limit?.toString() || this.pagination.limit.toString(),
          search: params?.search || '',
          sortBy: params?.sortBy || 'name',
          sortOrder: params?.sortOrder || 'asc'
        })

        const response = await axios.get(`/api/content-types?${queryParams}`)
        
        // Handle both paginated and non-paginated responses
        if (response.data) {
          if (response.data.items) {
            // Paginated response
            this.contentTypes = response.data.items
            this.pagination = response.data.pagination
          } else if (Array.isArray(response.data)) {
            // Non-paginated response
            this.contentTypes = response.data
            this.pagination = {
              page: 1,
              limit: response.data.length,
              total: response.data.length,
              pages: 1
            }
          } else {
            throw new Error('Unexpected response format')
          }
        } else {
          throw new Error('No data received from server')
        }

        return this.contentTypes
      } catch (error) {
        this.error = error.message
        this.contentTypes = []
        console.error('Content Types fetch error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async createContentType(contentType) {
      try {
        // Sanitize input
        const sanitizedData = {
          name: String(contentType.name).trim(),
          description: String(contentType.description).trim(),
          selectors: {
            listPage: {
              container: String(contentType.selectors.listPage.container).trim(),
              title: String(contentType.selectors.listPage.title).trim(),
              content: String(contentType.selectors.listPage.content).trim(),
              date: String(contentType.selectors.listPage.date).trim(),
              links: String(contentType.selectors.listPage.links).trim()
            },
            articlePage: {
              container: String(contentType.selectors.articlePage.container).trim(),
              title: String(contentType.selectors.articlePage.title).trim(),
              content: String(contentType.selectors.articlePage.content).trim(),
              date: String(contentType.selectors.articlePage.date).trim(),
              links: String(contentType.selectors.articlePage.links).trim()
            }
          },
          isActive: Boolean(contentType.isActive)
        }

        const response = await axios.post('/api/content-types', sanitizedData)
        this.contentTypes.push(response.data)
        return response.data
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async updateContentType(id, contentType) {
      try {
        // Sanitize input (same as create)
        const sanitizedData = {
          name: String(contentType.name).trim(),
          description: String(contentType.description).trim(),
          selectors: {
            listPage: {
              container: String(contentType.selectors.listPage.container).trim(),
              title: String(contentType.selectors.listPage.title).trim(),
              content: String(contentType.selectors.listPage.content).trim(),
              date: String(contentType.selectors.listPage.date).trim(),
              links: String(contentType.selectors.listPage.links).trim()
            },
            articlePage: {
              container: String(contentType.selectors.articlePage.container).trim(),
              title: String(contentType.selectors.articlePage.title).trim(),
              content: String(contentType.selectors.articlePage.content).trim(),
              date: String(contentType.selectors.articlePage.date).trim(),
              links: String(contentType.selectors.articlePage.links).trim()
            }
          },
          isActive: Boolean(contentType.isActive)
        }

        const response = await axios.put(`/api/content-types/${id}`, sanitizedData)
        const index = this.contentTypes.findIndex(ct => ct._id === id)
        if (index !== -1) {
          this.contentTypes[index] = response.data
        }
        return response.data
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async deleteContentType(id) {
      try {
        await axios.delete(`/api/content-types/${id}`)
        this.contentTypes = this.contentTypes.filter(ct => ct._id !== id)
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
      return this.fetchContentTypes()
    },

    setPage(page) {
      this.pagination.page = page
      return this.fetchContentTypes()
    }
  }
})
