<template>
  <div class="dashboard">
    <div class="filters">
      <!-- Search and existing filters -->
      <div class="search-group">
        <input 
          v-model="search" 
          @input="debounceSearch"
          placeholder="Search content..." 
        />
        <div class="domain-filter">
          <input 
            v-model="domainFilter"
            placeholder="Filter by domain..."
          />
          <button @click="applyDomainFilter" class="filter-btn">
            Apply Filter
          </button>
        </div>
      </div>

      <div class="filter-row">
        <div class="domain-filter">
          <input 
            v-model="filters.domain"
            placeholder="Filter by domain..."
          />
          <button @click="applyFilters" class="filter-btn">
            Filter
          </button>
        </div>

        <!-- Date Range Filter -->
        <div class="date-filter">
          <select v-model="filters.datePreset" @change="handleDatePreset">
            <option value="">Custom Range</option>
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last Week</option>
            <option value="30d">Last Month</option>
            <option value="365d">Last Year</option>
          </select>
          
          <div v-if="!filters.datePreset" class="custom-range">
            <input 
              type="datetime-local" 
              v-model="filters.dateFrom"
              :max="today"
            />
            <span>to</span>
            <input 
              type="datetime-local" 
              v-model="filters.dateTo"
              :max="today"
            />
          </div>
        </div>
      </div>

      <div class="filter-options">
        <label>
          <input 
            type="checkbox" 
            v-model="showLinkedOnly"
            @change="fetchContent"
          >
          Show Linked Content Only
        </label>
        
        <select v-model="sort">
          <option value="-date">Newest first</option>
          <option value="date">Oldest first</option>
          <option value="-title">Title Z-A</option>
          <option value="title">Title A-Z</option>
        </select>
      </div>

      <!-- Batch actions -->
      <div class="batch-actions" v-if="items.length">
        <label>
          <input 
            type="checkbox" 
            :checked="allSelected" 
            @change="toggleSelectAll"
          >
          Select All
        </label>
        <button 
          @click="deleteSelected" 
          class="delete-selected"
          :disabled="!selectedItems.length"
        >
          Delete Selected ({{ selectedItems.length }})
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading...</div>
    
    <div v-else-if="!items?.length" class="empty-state">
      No content found.
    </div>
    
    <div v-else class="content-grid">
      <article 
        v-for="item in items" 
        :key="item._id"
        :class="{ read: item.read }"
      >
        <div class="article-header">
          <input 
            type="checkbox" 
            v-model="selected[item._id]"
            class="select-item"
          >
          <h3>{{ item.title }}</h3>
          <button 
            @click="confirmDelete(item)"
            class="delete-btn"
            title="Delete content"
          >
            ×
          </button>
        </div>
        <p>{{ item.content }}</p>
        <div class="meta">
          <!-- Source info -->
          <div class="source-info">
            <span>Source: <a :href="item.url" target="_blank">{{ getDomain(item.url) }}</a></span>
            <span>Content Type: {{ getContentTypeName(item.contentType) }}</span>
            <span>Scraped: {{ formatDate(item.metadata?.extractedAt) }}</span>
          </div>

          <!-- Related content -->
          <div v-if="item.relatedContent?.length" class="related-content">
            <strong>Related Articles:</strong>
            <ul>
              <li v-for="related in item.relatedContent" :key="related._id">
                <span class="related-title">{{ related.title || 'Untitled' }}</span>
                <span class="related-id">(ID: {{ related._id }})</span>
                <button @click="viewRelatedContent(related._id)" class="view-btn">
                  View
                </button>
              </li>
            </ul>
          </div>

          <!-- Existing actions -->
          <div class="actions">
            <button @click="toggleRead(item)">
              {{ item.read ? 'Mark unread' : 'Mark read' }}
            </button>
            <button 
              v-if="item.source"
              @click="triggerManualScrape(item.source._id)"
              class="trigger-btn"
              :disabled="isTriggering[item.source._id]"
            >
              {{ isTriggering[item.source?._id] ? 'Scraping...' : 'Scrape Now' }}
            </button>
          </div>
          <small v-if="item.source?.lastRun">
            Last scraped: {{ formatDate(item.source.lastRun) }}
          </small>
        </div>
      </article>
    </div>

    <div class="pagination">
      <button 
        :disabled="currentPage === 1"
        @click="changePage(currentPage - 1)"
      >
        Previous
      </button>
      <span>Page {{ currentPage }} of {{ totalPages }}</span>
      <button 
        :disabled="currentPage === totalPages"
        @click="changePage(currentPage + 1)"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useContentStore } from '../stores/content'
import { useSourceStore } from '../stores/source'
import { useContentTypeStore } from '../stores/contentType'
import debounce from 'lodash/debounce'

export default {
  name: 'Dashboard',
  setup() {
    // Store instances
    const contentStore = useContentStore()
    const sourceStore = useSourceStore()
    const contentTypeStore = useContentTypeStore()
    
    // Reactive state
    const loading = ref(true)
    const error = ref(null)
    const selected = ref({})
    const isTriggering = ref({})
    const search = ref('')
    const sort = ref('-metadata.extractedAt') // Changed default sort
    const showLinkedOnly = ref(false)
    const domainFilter = ref('')
    const contentTypes = ref({})
    const today = ref(new Date().toISOString().split('T')[0])
    const filters = ref({
      domain: '',
      datePreset: '',
      dateFrom: null,
      dateTo: null,
      sort: '-metadata.extractedAt'  // Changed default sort
    })

    // Computed properties
    const items = computed(() => {
      const storeItems = contentStore.items
      console.log('Computing items from store:', storeItems?.length)
      return storeItems || []
    })
    const currentPage = computed(() => contentStore.currentPage)
    const totalPages = computed(() => Math.ceil(contentStore.total / 10))
    const selectedItems = computed(() => {
      return Object.entries(selected.value)
        .filter(([_, isSelected]) => isSelected)
        .map(([id]) => id)
    })
    const allSelected = computed(() => {
      return items.value.length > 0 && 
        items.value.every(item => selected.value[item._id])
    })

    // Debug function
    const logContentState = () => {
      console.log('Current content state:', {
        items: contentStore.items,
        total: contentStore.total,
        loading: contentStore.loading,
        error: contentStore.error
      })
    }

    // Modified fetchContent with better error handling
    const fetchContent = async () => {
      loading.value = true
      error.value = null
      
      try {
        console.log('Fetching content with filters:', {
          page: currentPage.value,
          sort: sort.value,
          filters: filters.value
        })

        await contentStore.fetchContents({
          page: currentPage.value || 1,
          limit: 10,
          sort: sort.value,
          search: search.value,
          domain: filters.value.domain,
          linkedOnly: showLinkedOnly.value,
          dateFrom: filters.value.dateFrom,
          dateTo: filters.value.dateTo
        })

        // Verify data was loaded
        console.log('Content loaded:', {
          itemsCount: contentStore.items?.length,
          total: contentStore.total
        })

        if (!contentStore.items) {
          throw new Error('No items received from store')
        }

      } catch (err) {
        error.value = err.message
        console.error('Failed to fetch content:', err)
      } finally {
        loading.value = false
      }
    }

    const loadContentTypes = async () => {
      try {
        await contentTypeStore.fetchContentTypes()
        contentTypes.value = contentTypeStore.contentTypes.reduce((acc, type) => {
          acc[type._id] = type
          return acc
        }, {})
      } catch (error) {
        console.error('Failed to load content types:', error)
      }
    }

    const toggleSelectAll = () => {
      const newValue = !allSelected.value
      items.value.forEach(item => {
        selected.value[item._id] = newValue
      })
    }

    const deleteSelected = async () => {
      if (!confirm(`Delete ${selectedItems.value.length} items?`)) return
      
      try {
        await Promise.all(
          selectedItems.value.map(id => contentStore.deleteContent(id))
        )
        selected.value = {}
        await fetchContent()
      } catch (error) {
        console.error('Failed to delete items:', error)
      }
    }

    const getDomain = (url) => {
      try {
        return new URL(url).hostname
      } catch {
        return url
      }
    }

    const debounceSearch = debounce(() => {
      contentStore.currentPage = 1
      fetchContent()
    }, 300)

    const changePage = (page) => {
      contentStore.currentPage = page
      fetchContent()
    }

    const toggleRead = (item) => {
      contentStore.markAsRead({
        id: item._id,
        read: !item.read
      })
    }

    const triggerManualScrape = async (sourceId) => {
      if (!sourceId) return;
      try {
        isTriggering.value[sourceId] = true;
        await sourceStore.triggerScrape(sourceId);
        await fetchContent();
      } catch (error) {
        console.error('Scraping failed:', error);
      } finally {
        isTriggering.value[sourceId] = false;
      }
    };

    const confirmDelete = async (item) => {
      if (confirm('Are you sure you want to delete this content?')) {
        try {
          await contentStore.deleteContent(item._id);
        } catch (error) {
          console.error('Failed to delete content:', error);
        }
      }
    }

    const applyDomainFilter = () => {
      contentStore.currentPage = 1
      fetchContent()
    }

    const getContentTypeName = (typeId) => {
      return contentTypes.value[typeId]?.name || 'Unknown'
    }

    const handleDatePreset = () => {
      const now = new Date()
      const preset = filters.value.datePreset

      if (preset) {
        const from = new Date()
        switch (preset) {
          case '1h':
            from.setHours(from.getHours() - 1)
            break
          case '24h':
            from.setDate(from.getDate() - 1)
            break
          case '7d':
            from.setDate(from.getDate() - 7)
            break
          case '30d':
            from.setDate(from.getDate() - 30)
            break
          case '365d':
            from.setDate(from.getDate() - 365)
            break
        }
        filters.value.dateFrom = from.toISOString().slice(0, 16)
        filters.value.dateTo = now.toISOString().slice(0, 16)
      }
      applyFilters()
    }

    const applyFilters = () => {
      contentStore.currentPage = 1
      fetchContent()
    }

    const viewRelatedContent = (id) => {
      // Implement viewing related content
      console.log('Viewing content:', id)
      // You might want to add a modal or navigation here
    }

    // Watchers
    watch(showLinkedOnly, () => {
      contentStore.currentPage = 1
      fetchContent()
    })

    watch([search, domainFilter, showLinkedOnly], () => {
      selected.value = {}
    })

    // Initialize with immediate fetch
    onMounted(async () => {
      console.log('Dashboard mounted, initializing...')
      await loadContentTypes()
      await fetchContent()
    })

    return {
      // Store access
      contentStore,
      sourceStore,
      
      // State
      items,
      loading,
      error,
      selected,
      filters,
      isTriggering,
      search,
      sort,
      showLinkedOnly,
      domainFilter,
      contentTypes,
      today,
      currentPage,
      totalPages,
      selectedItems,
      allSelected,

      // Methods
      fetchContent,
      toggleSelectAll,
      deleteSelected,
      getDomain,
      applyDomainFilter,
      getContentTypeName,
      handleDatePreset,
      applyFilters,
      viewRelatedContent,
      debounceSearch,
      changePage,
      toggleRead,
      triggerManualScrape,
      confirmDelete,
      
      // Formatting
      formatDate: (date) => new Date(date).toLocaleDateString()
    }
  }
}
</script>

<style scoped>
/* Add to existing styles */
.filters {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

.search-group {
  display: flex;
  gap: 1rem;
}

.domain-filter {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.filter-btn {
  background: var(--secondary-color);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.filter-options {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.batch-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 0.5rem;
  background: #f5f5f5;
  border-radius: 4px;
}

.delete-selected {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.delete-selected:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.source-info {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: #666;
}

.select-item {
  margin-right: 1rem;
}

.related-content {
  margin-top: 0.5rem;
  font-size: 0.9rem;
}

.related-content ul {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.trigger-btn {
  background-color: #4a5568;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}

.trigger-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.article-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
}

.delete-btn {
  background: none;
  border: none;
  color: #dc3545;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0 0.5rem;
  line-height: 1;
}

.delete-btn:hover {
  color: #bd2130;
}

.filter-row {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.date-filter {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.custom-range {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.related-content li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.related-id {
  color: #666;
  font-size: 0.8rem;
}

.view-btn {
  padding: 0.2rem 0.5rem;
  font-size: 0.8rem;
  background: var(--secondary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
