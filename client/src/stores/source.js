import { defineStore } from 'pinia'
import axios from 'axios'

export const useSourceStore = defineStore('source', {
  state: () => ({
    sources: [],
    loading: false,
    error: null
  }),

  actions: {
    async fetchSources() {
      this.loading = true
      try {
        const { data } = await axios.get('/api/sources')
        console.log('Fetched sources:', data)
        this.sources = data
        return data
      } catch (error) {
        console.error('Error fetching sources:', error)
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async addSource(sourceData) {
      try {
        console.log('Adding source with data:', sourceData)
        const { data } = await axios.post('/api/sources', sourceData)
        console.log('Source created:', data)
        this.sources.push(data)
        return data
      } catch (error) {
        console.error('Error adding source:', error.response?.data || error)
        throw error
      }
    },

    async triggerScrape(sourceId) {
      try {
        console.log('Triggering manual scrape for source:', sourceId)
        const { data } = await axios.post(`/api/sources/${sourceId}/trigger`)
        
        // Update the source in the store with new scrape data
        const sourceIndex = this.sources.findIndex(s => s._id === sourceId)
        if (sourceIndex !== -1) {
          this.sources[sourceIndex] = {
            ...this.sources[sourceIndex],
            lastRun: data.lastRun,
            lastStatus: 'success',
            stats: data.stats
          }
        }
        
        return data
      } catch (error) {
        console.error('Scrape trigger error:', error)
        throw error
      }
    },

    async deleteSource(sourceId) {
      this.loading = true;
      try {
        console.log('Deleting source:', sourceId);
        const response = await axios.delete(`/api/sources/${sourceId}`);
        
        if (response.status === 200) {
          // Remove from local state
          this.sources = this.sources.filter(s => s._id !== sourceId);
          console.log('Source deleted successfully:', response.data);
          return true;
        }
        throw new Error('Failed to delete source');
        
      } catch (error) {
        console.error('Delete source error:', error.response?.data || error);
        throw error.response?.data?.error || 'Failed to delete source';
      } finally {
        this.loading = false;
      }
    }
  }
})
