<template>
  <div class="content-types">
    <div class="header">
      <h2>Content Types</h2>
      <button @click="showCreateForm = true" class="btn btn-primary">
        Add Content Type
      </button>
    </div>
    
    <div v-if="loading" class="loading">
      Loading content types...
    </div>

    <div v-else-if="error" class="error">
      {{ error }}
      <button @click="loadData" class="btn">Retry</button>
    </div>

    <div v-else>
      <div v-if="!store.hasContentTypes" class="no-data">
        No content types found.
      </div>
      
      <div v-else class="content-types-grid">
        <div v-for="type in store.contentTypes" :key="type._id" class="type-card">
          <!-- Add card header with actions -->
          <div class="card-header">
            <h3>{{ type.name }}</h3>
            <div class="card-actions">
              <button @click="editType(type)" class="btn btn-edit">
                <i class="fas fa-edit"></i> Edit
              </button>
              <button @click="confirmDelete(type)" class="btn btn-delete">
                <i class="fas fa-trash"></i> Delete
              </button>
            </div>
          </div>
          
          <p>{{ type.description }}</p>
          <div class="selectors">
            <h4>List Page:</h4>
            <pre>{{ JSON.stringify(type.selectors.listPage, null, 2) }}</pre>
            <h4>Article Page:</h4>
            <pre>{{ JSON.stringify(type.selectors.articlePage, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>

    <!-- Add delete confirmation modal -->
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

    <!-- Update form component to handle both create and edit -->
    <ContentTypeForm
      v-if="showCreateForm"
      :editing-type="editingType"
      @save="saveContentType"
      @close="closeForm"
    />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useContentTypeStore } from '../stores/contentType'
import ContentTypeForm from './ContentTypeForm.vue'
import { storeToRefs } from 'pinia'

export default {
  components: {
    ContentTypeForm
  },
  setup() {
    const store = useContentTypeStore()
    const { loading, error } = storeToRefs(store)
    const showCreateForm = ref(false)
    const editingType = ref(null)
    const showDeleteModal = ref(false)
    const deleteTarget = ref(null)

    const loadData = async () => {
      try {
        await store.fetchContentTypes()
      } catch (err) {
        console.error('Failed to load content types:', err)
      }
    }

    const saveContentType = async (formData) => {
      try {
        if (editingType.value) {
          await store.updateContentType(editingType.value._id, formData)
        } else {
          await store.createContentType(formData)
        }
        closeForm()
        await loadData()
      } catch (err) {
        console.error('Failed to save content type:', err)
      }
    }

    const editType = (type) => {
      editingType.value = { ...type }
      showCreateForm.value = true
    }

    const closeForm = () => {
      showCreateForm.value = false
      editingType.value = null
    }

    const confirmDelete = (type) => {
      deleteTarget.value = type
      showDeleteModal.value = true
    }

    const cancelDelete = () => {
      showDeleteModal.value = false
      deleteTarget.value = null
    }

    const executeDelete = async () => {
      try {
        await store.deleteContentType(deleteTarget.value._id)
        showDeleteModal.value = false
        deleteTarget.value = null
        await loadData()
      } catch (err) {
        console.error('Failed to delete content type:', err)
      }
    }

    onMounted(loadData)

    return {
      store,
      loading,
      error,
      showCreateForm,
      editingType,
      showDeleteModal,
      deleteTarget,
      saveContentType,
      editType,
      closeForm,
      loadData,
      confirmDelete,
      cancelDelete,
      executeDelete
    }
  }
}
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.content-types {
  padding: 20px;
}

.content-types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.type-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
}

.selectors {
  background: #f5f5f5;
  padding: 10px;
  margin-top: 10px;
  border-radius: 4px;
}

pre {
  white-space: pre-wrap;
  word-break: break-word;
  background: #fff;
  padding: 8px;
  border-radius: 4px;
}

/* Add to existing styles */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #ddd;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-edit {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.btn-delete {
  background: #f44336;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
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
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 400px;
  width: 90%;
}

.warning {
  color: #f44336;
  margin: 1rem 0;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

/* ... existing styles ... */
</style>
