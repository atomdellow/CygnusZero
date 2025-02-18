import { defineStore } from 'pinia'
import axios from 'axios'

export const useAnalyticsStore = defineStore('analytics', {
  state: () => ({
    metrics: [],
    logs: [],
    loading: false,
    error: null
  }),

  actions: {
    async fetchMetrics(timeRange = { days: 7 }) {
      this.loading = true
      try {
        const { data } = await axios.get('/api/analytics/metrics', {
          params: { timeRange }
        })
        this.metrics = data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch metrics'
      } finally {
        this.loading = false
      }
    },

    async fetchLogs(filter = {}) {
      try {
        const { data } = await axios.get('/api/analytics/logs', {
          params: filter
        })
        this.logs = data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch logs'
      }
    }
  },

  getters: {
    sourceActivityLabels: (state) => {
      return state.metrics
        .filter(m => m.eventType === 'scrape')
        .map(m => new Date(m.timestamp).toLocaleDateString())
    },
    sourceActivityData: (state) => {
      return state.metrics
        .filter(m => m.eventType === 'scrape')
        .map(m => m.metadata.contentFound)
    }
    // ... more getters for different visualizations
  }
})
