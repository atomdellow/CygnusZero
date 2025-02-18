<template>
  <div class="content-types">
    <h1>Content Types</h1>
    
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
      <div v-for="type in contentTypes" :key="type._id" class="type-card">
        <div class="type-header">
          <h3>{{ type.name }}</h3>
          <span class="badge" :class="{ active: type.isActive }">
            {{ type.isActive ? 'Active' : 'Inactive' }}
          </span>
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
          <button @click="deleteType(type._id)" class="btn btn-danger">Delete</button>
        </div>
      </div>
    </div>

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
        if (editingType.value) {
          await store.updateContentType(type._id, type)
        } else {
          await store.createContentType(type)
        }
        showCreateForm.value = false
        editingType.value = null
        contentTypes.value = store.contentTypes
      } catch (err) {
        error.value = err.message
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

    const deleteType = async (id) => {
      if (confirm('Are you sure you want to delete this content type?')) {
        try {
          await store.deleteContentType(id)
          contentTypes.value = store.contentTypes
        } catch (err) {
          error.value = err.message
        }
      }
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
      retryLoad
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
</style>
