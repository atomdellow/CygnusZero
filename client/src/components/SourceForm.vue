<template>
  <form @submit.prevent="handleSubmit" class="source-form">
    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div class="form-group">
      <label for="url">Website URL</label>
      <div class="url-input-group">
        <input 
          id="url"
          v-model="form.url"
          type="url"
          required
          placeholder="https://example.com"
          @input="validateUrl"
          :class="{ 'invalid': urlError }"
        />
        <label class="checkbox-label">
          <input 
            type="checkbox" 
            v-model="isLocalhost"
          /> Allow localhost
        </label>
      </div>
      <small class="error-text" v-if="urlError">{{ urlError }}</small>
      <small class="help-text">Please include http:// or https:// in the URL</small>
    </div>

    <div class="form-group">
      <label for="schedule">Schedule</label>
      <select id="schedule" v-model="form.schedule">
        <option value="*/30 * * * *">Every 30 minutes</option>
        <option value="0 * * * *">Hourly</option>
        <option value="0 */6 * * *">Every 6 hours</option>
        <option value="0 0 * * *">Daily</option>
        <option value="0 0 * * 0">Weekly</option>
      </select>
    </div>

    <div class="form-group">
      <label>Content Type</label>
      <div v-if="contentTypeLoading" class="loading">
        Loading content types...
      </div>
      <div v-else-if="contentTypeError" class="error">
        {{ contentTypeError }}
        <button @click="loadContentTypes" class="btn">Retry</button>
      </div>
      <select 
        v-else
        v-model="form.contentTypeId" 
        required
        :disabled="!store.hasContentTypes"
      >
        <option value="">Select a content type</option>
        <option 
          v-for="type in store.contentTypes" 
          :key="type._id" 
          :value="type._id"
        >
          {{ type.name }}
        </option>
      </select>
    </div>

    <div class="form-group">
      <label for="scrapeMode">Scraping Mode</label>
      <select id="scrapeMode" v-model="form.scrapeMode">
        <option value="selective">Selective (Use custom selectors)</option>
        <option value="smart">Smart (Auto-detect content)</option>
        <option value="full">Full Page</option>
        <option value="link-association">Link Association Only</option>
      </select>
      <small v-if="form.scrapeMode === 'link-association'" class="help-text">
        This mode will only find and associate full articles for existing summaries
      </small>
    </div>

    <div class="form-group" v-if="form.scrapeMode === 'selective'">
      <label>Custom CSS Selectors (Optional)</label>
      <input 
        v-model="form.selectors.title"
        placeholder="Title selector (optional)"
      />
      <input 
        v-model="form.selectors.content"
        placeholder="Content selector (optional)"
      />
      <input 
        v-model="form.selectors.date"
        placeholder="Date selector (optional)"
      />
      <input 
        v-model="form.selectors.links"
        placeholder="Links selector (optional)"
      />
    </div>

    <div class="form-group">
      <label for="linkBehavior">Link Following</label>
      <div class="link-options">
        <label class="checkbox-label">
          <input 
            type="checkbox" 
            v-model="form.followLinks"
          /> Follow article links
        </label>
        
        <div v-if="form.followLinks" class="depth-control">
          <label for="maxDepth">Link Depth:</label>
          <select v-model="form.maxDepth" id="maxDepth">
            <option value="0">Unlimited</option>
            <option value="1">1 Level</option>
            <option value="2">2 Levels</option>
            <option value="3">3 Levels</option>
          </select>
        </div>
      </div>
    </div>

    <div class="form-group content-type-header">
      <label>Content Types</label>
      <div class="dropdown">
        <button type="button" @click="showTypeMenu = !showTypeMenu" class="add-type-btn">
          Add Type <span class="icon">+</span>
        </button>
        <div v-if="showTypeMenu" class="dropdown-menu">
          <div 
            v-for="type in store.contentTypes" 
            :key="type._id"
            @click="addContentType(type)"
            class="dropdown-item"
            :class="{ 'disabled': hasContentType(type._id) }"
          >
            {{ type.name }}
            <span v-if="hasContentType(type._id)" class="already-added">(Added)</span>
          </div>
        </div>
      </div>
    </div>

    <div class="form-group">
      <label>Additional Content Types</label>
      <select v-model="selectedAdditionalType">
        <option value="">Select additional type</option>
        <option v-for="type in store.contentTypes" 
                :key="type._id"
                :value="type">
          {{ type.name }}
        </option>
      </select>
      <button type="button" 
              @click="addAdditionalType" 
              :disabled="!selectedAdditionalType"
              class="btn">
        Add Type
      </button>
    </div>

    <div class="content-types-container">
      <div v-for="(type, index) in form.contentTypes" :key="index" class="content-type-card">
        <div class="content-type-header">
          <h4>{{ type.type }}</h4>
          <button type="button" @click="removeContentType(index)" class="remove-btn">×</button>
        </div>
        <div class="selectors-grid">
          <div class="form-group">
            <label>Container</label>
            <input v-model="type.selectors.container" placeholder=".container" />
          </div>
          <div class="form-group">
            <label>Title</label>
            <input v-model="type.selectors.title" placeholder=".title, h1" />
          </div>
          <div class="form-group">
            <label>Content</label>
            <input v-model="type.selectors.content" placeholder=".content" />
          </div>
          <div class="form-group">
            <label>Date</label>
            <input v-model="type.selectors.date" placeholder=".date" />
          </div>
        </div>
      </div>
    </div>

    <button type="submit">{{ isEdit ? 'Update Source' : 'Add Source' }}</button>
  </form>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useSourceStore } from '../stores/source'
import { useRouter } from 'vue-router'
import { useContentTypeStore } from '../stores/contentType'
import { storeToRefs } from 'pinia'

const CONTENT_TYPES = ['article', 'full', 'auto', 'news', 'blog', 'summary'];

export default {
  name: 'SourceForm',
  emits: ['submit'],
  props: {
    source: {
      type: Object,
      default: null
    }
  },
  setup(props, { emit }) {
    const sourceStore = useSourceStore()
    const store = useContentTypeStore() // Use the same store instance
    const router = useRouter()
    const error = ref('')
    
    const form = ref({
      url: props.source?.url || '',
      contentType: props.source?.contentType || '',
      schedule: props.source?.schedule || '*/30 * * * *',
      scrapeMode: props.source?.scrapeMode || 'smart',
      followLinks: props.source?.followLinks ?? true,
      maxDepth: props.source?.maxDepth ?? 1,
      selectors: props.source?.selectors || {
        title: '',
        content: '',
        date: '',
        links: ''
      },
      contentTypes: props.source?.contentTypes || []
    })

    const urlError = ref('')
    const isLocalhost = ref(false)
    const showTypeMenu = ref(false)
    const availableTypes = ['article', 'full', 'summary', 'news', 'blog']
    const availableContentTypes = CONTENT_TYPES;
    const defaultSelectors = {
      article: {
        container: '.article-container',
        title: 'h1',
        content: '.content p',
        date: '.date'
      },
      summary: {
        container: '.summary-container',
        title: 'h2',
        content: '.summary',
        date: '.date'
      },
      // Add more default selectors for other types
    }

    const selectedAdditionalType = ref(null)

    const validateUrl = () => {
      let url = form.value.url.trim();
      
      try {
        // Add protocol if missing
        if (!/^https?:\/\//i.test(url)) {
          url = `http://${url}`;
          form.value.url = url;
        }

        const parsedUrl = new URL(url);
        
        // Allow localhost URLs with paths
        if (isLocalhost.value && 
            (parsedUrl.hostname === 'localhost' || 
             parsedUrl.hostname === '127.0.0.1')) {
          urlError.value = '';
          return true;
        }

        // Regular URL validation
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          urlError.value = 'URL must use http or https protocol';
          return false;
        }

        urlError.value = '';
        return true;
      } catch (err) {
        console.error('URL validation error:', err);
        urlError.value = 'Please enter a valid URL';
        return false;
      }
    };

    const handleSubmit = async () => {
      error.value = ''
      try {
        if (!validateUrl()) {
          error.value = 'Please enter a valid URL'
          return
        }

        // Validate content type is selected
        if (!form.value.contentType) {
          error.value = 'Please select a content type'
          return
        }

        console.log('Submitting form with data:', form.value)
        emit('submit', form.value)
      } catch (err) {
        console.error('Form submission error:', err)
        error.value = err.message || 'Failed to save source'
      }
    }

    // Validate URL on initial load if editing
    if (props.source?.url) {
      validateUrl()
    }

    const formatContentType = (type) => {
      return type.charAt(0).toUpperCase() + type.slice(1);
    };

    const contentTypeStore = useContentTypeStore()
    const contentTypes = ref([])
    const loading = ref(true)

    const loadContentTypes = async () => {
      try {
        await store.fetchContentTypes()
        // console.log('Available content types:', store.contentTypes)
        
        // If editing, preselect the content type
        if (props.source?.contentType) {
          form.value.contentType = props.source.contentType
        }
      } catch (err) {
        error.value = 'Failed to load content types'
        console.error('Error loading content types:', err)
      } finally {
        loading.value = false
      }
    }

    const addAdditionalType = () => {
      if (selectedAdditionalType.value) {
        form.value.contentTypes.push(selectedAdditionalType.value)
        selectedAdditionalType.value = null
      }
    }

    const { loading: contentTypeLoading, error: contentTypeError } = storeToRefs(store)

    onMounted(() => {
      loadContentTypes()
    })

    return {
      form,
      error,
      urlError,
      handleSubmit,
      validateUrl,
      isEdit: !!props.source,
      isLocalhost,
      showTypeMenu,
      availableTypes,
      availableContentTypes,
      formatContentType,
      defaultSelectors,
      contentTypes,
      loading,
      store, // Return the store to make it available in template
      selectedAdditionalType,
      addAdditionalType,
      contentTypeLoading,
      contentTypeError,
      loadContentTypes
    }
  },
  data() {
    return {
      contentTypes: [],
      availableTypes: ['article', 'full', 'summary']
    }
  },
  methods: {
    hasContentType(typeId) {
      return this.form.contentTypes.some(t => t._id === typeId)
    },

    addContentType(type) {
      if (this.hasContentType(type._id)) {
        this.$emit('show-error', `Content type '${type.name}' is already added`)
        return
      }

      this.form.contentTypes.push({
        _id: type._id,
        name: type.name,
        selectors: type.selectors
      })
      this.showTypeMenu = false
    },

    removeContentType(index) {
      this.form.contentTypes.splice(index, 1)
    }
  }
}
</script>

<style scoped>
.link-options {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.depth-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.depth-control select {
  width: auto;
}

.help-text {
  display: block;
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.25rem;
}

.error-message {
  color: #dc3545;
  padding: 0.5rem;
  margin-bottom: 1rem;
  border: 1px solid #dc3545;
  border-radius: 4px;
  background-color: #f8d7da;
}

.error-text {
  color: #dc3545;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.invalid {
  border-color: #dc3545;
}

.url-input-group {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.content-type-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.dropdown {
  position: relative;
}

.add-type-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--secondary-color);
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
}

.dropdown-menu {
  position: absolute;
  right: 0;
  top: 100%;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 1000;
  min-width: 150px;
}

.dropdown-item {
  padding: 0.5rem 1rem;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dropdown-item:hover {
  background: #f8f9fa;
}

.dropdown-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.already-added {
  font-size: 0.8rem;
  color: #666;
}

.content-types-container {
  display: grid;
  gap: 1rem;
  margin-bottom: 1rem;
}

.content-type-card {
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 1rem;
}

.selectors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.warning {
  color: #856404;
  background-color: #fff3cd;
  border: 1px solid #ffeeba;
  padding: 0.5rem;
  margin-top: 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
}
</style>
