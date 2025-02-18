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
    </div>

    <div v-else>
      <div v-if="store.contentTypes.length === 0">
        No content types found.
      </div>
      
      <div v-else class="content-types-grid">
        <div v-for="type in store.contentTypes" :key="type._id" class="type-card">
          <h3>{{ type.name }}</h3>
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

    <ContentTypeForm
      v-if="showCreateForm"
      :editing-type="null"
      @save="saveContentType"
      @close="showCreateForm = false"
    />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useContentTypeStore } from '../stores/contentType'
import ContentTypeForm from './ContentTypeForm.vue'

export default {
  components: {
    ContentTypeForm
  },
  setup() {
    const store = useContentTypeStore()
    const loading = ref(true)
    const error = ref(null)
    const showCreateForm = ref(false)

    const loadData = async () => {
      loading.value = true
      try {
        await store.fetchContentTypes()
        // console.log('Content types loaded:', store.contentTypes)
      } catch (err) {
        error.value = err.message
        console.error('Failed to load:', err)
      } finally {
        loading.value = false
      }
    }

    const saveContentType = async (formData) => {
      try {
        await store.createContentType(formData)
        showCreateForm.value = false
        await loadData()
      } catch (err) {
        console.error('Failed to save content type:', err)
      }
    }

    onMounted(() => {
      loadData()
    })

    return {
      store,
      loading,
      error,
      showCreateForm,
      saveContentType
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
</style>
