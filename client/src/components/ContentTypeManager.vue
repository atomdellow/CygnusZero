<template>
  <div class="content-type-manager">
    <h2>Content Types</h2>
    
    <div v-if="loading" class="loading">
      Loading content types...
    </div>

    <div v-else-if="error" class="error">
      {{ error }}
      <button @click="loadContentTypes" class="btn">Retry</button>
    </div>

    <div v-else class="content-types-list">
      <!-- Use store.contentTypes directly -->
      <div v-if="store.contentTypes.length === 0" class="no-types">
        No content types found. Add one to get started.
      </div>
      
      <div v-else v-for="type in store.contentTypes" :key="type._id" class="type-card">
        <h3>{{ type.name }}</h3>
        <p>{{ type.description }}</p>
        <div class="selectors-info">
          <h4>List Page Selectors:</h4>
          <pre>{{ JSON.stringify(type.selectors.listPage, null, 2) }}</pre>
          <h4>Article Page Selectors:</h4>
          <pre>{{ JSON.stringify(type.selectors.articlePage, null, 2) }}</pre>
        </div>
        <div class="actions">
          <button @click="editType(type)" class="btn">Edit</button>
          <button @click="deleteType(type._id)" class="btn delete">Delete</button>
        </div>
      </div>
    </div>
    <pre>Debug: {{ JSON.stringify(store.contentTypes, null, 2) }}</pre>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useContentTypeStore } from '../stores/contentType'

export default {
  name: 'ContentTypeManager',
  setup() {
    const store = useContentTypeStore()
    const loading = ref(false)
    const error = ref(null)

    const loadContentTypes = async () => {
      loading.value = true
      try {
        await store.fetchContentTypes()
        // console.log('Content types loaded:', store.contentTypes)
      } catch (err) {
        error.value = err.message
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      loadContentTypes()
    })

    return {
      store, // Return the store directly
      loading,
      error,
      loadContentTypes
    }
  }
}
</script>

<style scoped>
.content-type-manager {
  padding: 2rem;
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

.modal form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.type-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.type-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.status-active {
  color: green;
  font-weight: bold;
}

.description {
  color: #666;
  margin-bottom: 1rem;
}

.selectors-info {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  margin: 1rem 0;
}

pre {
  background: #eee;
  padding: 0.5rem;
  border-radius: 4px;
  overflow-x: auto;
}

.actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: #42b983;
  color: white;
}

.btn.delete {
  background: #dc3545;
}

.no-types {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.selectors {
  display: grid;
  gap: 1rem;
  margin: 1rem 0;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}
</style>
