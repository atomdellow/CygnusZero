<template>
  <div class="content-types">
    <h1>Content Types</h1>
    
    <!-- Filters -->
    <div class="filters">
      <div class="search-box">
        <input 
          v-model="filters.search" 
          @input="debounceSearch"
          placeholder="Search content types..." 
        />
      </div>
      
      <div class="filter-controls">
        <select v-model="filters.isActive" @change="applyFilters">
          <option :value="null">All Status</option>
          <option :value="true">Active</option>
          <option :value="false">Inactive</option>
        </select>

        <select v-model="filters.sortBy" @change="applyFilters">
          <option value="name">Name</option>
          <option value="createdAt">Created Date</option>
          <option value="updatedAt">Updated Date</option>
        </select>

        <button @click="toggleSortOrder" class="btn">
          {{ filters.sortOrder === 'asc' ? '↑' : '↓' }}
        </button>
      </div>
    </div>

    <div class="controls">
      <button @click="showCreateForm = true" class="btn btn-primary">
        Add New Content Type
      </button>
    </div>

    <div v-if="loading" class="loading">
      Loading content types...
    </div>

    <div v-else-if="error" class="error">
      {{ error }}
      <button @click="retryLoad" class="btn">Retry</button>
    </div>

    <div v-else-if="contentTypes.length === 0" class="no-data">
      No content types found. Add one to get started.
    </div>

    <div v-else class="content-types-grid">
      <div v-for="type in store.contentTypes" :key="type._id" class="type-card">
        <div class="card-header">
          <div class="type-info">
            <h3>{{ type.name }}</h3>
            <span class="badge" :class="{ active: type.isActive }">
              {{ type.isActive ? 'Active' : 'Inactive' }}
            </span>
          </div>
          <div class="card-actions">
            <button @click="editType(type)" class="btn btn-edit">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button @click="confirmDelete(type)" class="btn btn-delete">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
        <p class="description">{{ type.description }}</p>
        
        <div class="selectors-summary">
          <h4>Selectors</h4>
          <div class="selector-group">
            <strong>List Page:</strong>
            <code>{{ type.selectors.listPage.container }}</code>
          </div>
          <div class="selector-group">
            <strong>Article Page:</strong>
            <code>{{ type.selectors.articlePage.container }}</code>
          </div>
        </div>

        <div class="actions">
          <button @click="editType(type)" class="btn">Edit</button>
          <button @click="confirmDelete(type)" class="btn btn-danger">Delete</button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div class="pagination">
      <button 
        :disabled="store.pagination.page === 1"
        @click="changePage(store.pagination.page - 1)"
        class="btn"
      >
        Previous
      </button>
      
      <span class="page-info">
        Page {{ store.pagination.page }} of {{ Math.ceil(store.pagination.total / store.pagination.limit) }}
      </span>
      
      <button 
        :disabled="store.pagination.page >= Math.ceil(store.pagination.total / store.pagination.limit)"
        @click="changePage(store.pagination.page + 1)"
        class="btn"
      >
        Next
      </button>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal">
      <div class="modal-content">
        <h3>Delete Content Type</h3>
        <p>Are you sure you want to delete "{{ deleteTarget?.name }}"?</p>
        <p class="warning">This action cannot be undone.</p>
        <div class="modal-actions">
          <button @click="executeDelete" class="btn btn-danger">Delete</button>
          <button @click="cancelDelete" class="btn">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Edit/Create Form Modal -->
    <ContentTypeForm 
      v-if="showCreateForm"
      :editingType="editingType"
      @close="closeForm"
      @save="saveType"
    />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useContentTypeStore } from '../stores/contentType'
import ContentTypeForm from '../components/ContentTypeForm.vue'
import debounce from 'lodash/debounce'

export default {
  name: 'ContentTypes',
  components: {
    ContentTypeForm
  },
  setup() {
    const store = useContentTypeStore()
    const contentTypes = ref([])
    const loading = ref(true)
    const error = ref(null)
    const showCreateForm = ref(false)
    const editingType = ref(null)
    const showDeleteModal = ref(false)
    const deleteTarget = ref(null)
    const filters = ref({
      search: '',
      isActive: null,
      sortBy: 'name',
      sortOrder: 'asc'
    })

    const loadContentTypes = async () => {
      try {
        loading.value = true;
        error.value = null;
        await store.fetchContentTypes();
      } catch (err) {
        error.value = err.message;
        console.error('Failed to load content types:', err);
      } finally {
        loading.value = false;
      }
    };

    const retryLoad = () => {
      loadContentTypes();
    };

    onMounted(() => {
      loadContentTypes();
    });

    const saveType = async (type) => {
      try {
        loading.value = true;
        if (editingType.value) {
          await store.updateContentType(type._id, type);
        } else {
          await store.createContentType(type);
        }
        showCreateForm.value = false;
        editingType.value = null;
        await loadContentTypes();
      } catch (err) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    };

    const editType = (type) => {
      editingType.value = { ...type }
      showCreateForm.value = true
    }

    const closeForm = () => {
      showCreateForm.value = false
      editingType.value = null
    }

    const deleteType = async (id) => {
      if (!confirm('Are you sure you want to delete this content type?')) {
        return;
      }
      
      try {
        loading.value = true;
        await store.deleteContentType(id);
        await loadContentTypes();
      } catch (err) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    };

    const debounceSearch = debounce(() => {
      applyFilters()
    }, 300)

    const applyFilters = () => {
      store.setFilters(filters.value)
    }

    const toggleSortOrder = () => {
      filters.value.sortOrder = filters.value.sortOrder === 'asc' ? 'desc' : 'asc'
      applyFilters()
    }

    const changePage = (page) => {
      store.setPage(page)
    }

    const confirmDelete = (type) => {
      deleteTarget.value = type
      showDeleteModal.value = true
    }

    const executeDelete = async () => {
      if (!deleteTarget.value) return
      
      try {
        await store.deleteContentType(deleteTarget.value._id)
        showDeleteModal.value = false
        deleteTarget.value = null
      } catch (error) {
        console.error('Delete failed:', error)
      }
    }

    const cancelDelete = () => {
      deleteTarget.value = null
      showDeleteModal.value = false
    }

    return {
      contentTypes,
      loading,
      error,
      showCreateForm,
      editingType,
      saveType,
      editType,
      closeForm,
      deleteType,
      retryLoad,
      filters,
      showDeleteModal,
      deleteTarget,
      confirmDelete,
      executeDelete,
      applyFilters,
      debounceSearch,
      toggleSortOrder,
      changePage,
      cancelDelete
    }
  }
}
</script>

<style scoped>
.content-types {
  padding: 2rem;
}

.type-card {
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.5rem;
}

.type-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.description {
  color: #666;
  margin-bottom: 1rem;
}

.selectors-summary {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  margin: 1rem 0;
}

.selector-group {
  margin: 0.5rem 0;
}

code {
  background: #eee;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-size: 0.9em;
}

.badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  background: #ddd;
}

.badge.active {
  background: var(--secondary-color);
  color: white;
}

.controls {
  margin-bottom: 2rem;
}

.no-data {
  text-align: center;
  padding: 2rem;
  color: #666;
}

/* Add to existing styles */
.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  align-items: center;
}

.search-box {
  flex: 1;
}

.search-box input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
}

.filter-controls {
  display: flex;
  gap: 0.5rem;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.page-info {
  font-size: 0.9rem;
  color: #666;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 400px;
  width: 90%;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.card-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-edit {
  background: var(--primary-color);
  color: white;
}

.btn-delete {
  background: var(--danger-color);
  color: white;
}

.warning {
  color: var(--danger-color);
  margin: 1rem 0;
}

.type-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}
</style>
