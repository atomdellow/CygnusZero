import { defineStore } from 'pinia'
import axios from 'axios'

export const useContentStore = defineStore('content', {
  state: () => ({
    items: [],
    total: 0,
    currentPage: 1,
    loading: false,
    error: null
  }),

  actions: {
    async fetchContents({ page = 1, limit = 10, sort = '-metadata.extractedAt', ...filters } = {}) {
      this.loading = true
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          sort: sort
        })

        // Add filters
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value.toString())
        })

        console.log('Fetching with params:', Object.fromEntries(params))
        
        const { data } = await axios.get(`/api/content?${params}`)
        console.log('Raw API response:', data)

        if (!data || !Array.isArray(data.items)) {
          throw new Error('Invalid response format')
        }

        this.items = data.items
        this.total = data.total
        this.currentPage = page

        console.log('Updated store state:', {
          itemsCount: this.items.length,
          total: this.total,
          currentPage: this.currentPage
        })

      } catch (error) {
        console.error('Content fetch error:', error)
        this.error = error.message
        this.items = []
      } finally {
        this.loading = false
      }
    },

    async markAsRead({ id, read }) {
      await axios.patch(`/api/content/${id}/read`, { read })
      await this.fetchContents({ page: this.currentPage })
    },
    async deleteContent(id) {
      this.loading = true
      try {
        await axios.delete(`/api/content/${id}`);
        await this.fetchContents({
          page: this.currentPage,
          limit: 10,
          sort: '-date'
        });
        return true;
      } catch (error) {
        console.error('Delete error:', error.response || error);
        throw new Error(error.response?.data?.message || 'Failed to delete content');
      } finally {
        this.loading = false;
      }
    }
  }
})
