<template>
  <div class="sources-container">
    <h2>Manage Sources</h2>
    
    <button @click="showForm = !showForm" class="add-btn">
      {{ showForm ? 'Cancel' : 'Add New Source' }}
    </button>

    <SourceForm 
      v-if="showForm" 
      :source="editingSource"
      @submit="handleSourceSubmitted" 
    />

    <div class="import-section">
      <h3>Import Sources</h3>
      <div class="upload-zone">
        <input 
          type="file" 
          @change="handleFileUpload" 
          accept=".csv,.xlsx,.xls"
          ref="fileInput"
          style="display: none"
        />
        <button @click="$refs.fileInput.click()" class="import-btn">
          Import from CSV/Excel
        </button>
        <a href="/templates/contact-scraper-template.csv" download class="template-link">
          Download Template
        </a>
      </div>
    </div>

    <div class="sources-list">
      <div v-if="loading" class="loading">Loading sources...</div>
      
      <div v-else-if="!sources.length" class="empty-state">
        No sources added yet. Add your first source to start tracking content.
      </div>
      
      <div v-else v-for="source in sources" :key="source._id" class="source-card">
        <div class="source-header">
          <h3>{{ source.url }}</h3>
          <span class="badge">{{ source.contentType?.name }}</span>
        </div>
        
        <div class="source-details">
          <p>Schedule: {{ formatSchedule(source.schedule) }}</p>
          <p v-if="source.lastRun">Last scraped: {{ formatDate(source.lastRun) }}</p>
          <p v-if="source.lastStatus">Status: {{ source.lastStatus }}</p>
          <p v-if="source.stats">
            Found: {{ source.stats.summariesFound || 0 }} summaries, 
            {{ source.stats.articlesFound || 0 }} articles
          </p>
          
          <div class="actions">
            <button @click="editSource(source)" class="edit-btn">Edit</button>
            <button @click="handleDelete(source._id)" class="delete-btn">Delete</button>
            <button 
              @click="triggerManualScrape(source._id)"
              :disabled="isTriggering[source._id]"
              class="scrape-btn"
            >
              {{ isTriggering[source._id] ? 'Scraping...' : 'Run Now' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-if="showDeleteDialog" class="delete-modal">
    <div class="modal-content">
      <h3>Delete Source</h3>
      <p>How would you like to handle the deletion of "{{ sourceToDelete?.url }}"?</p>
      
      <div class="delete-options">
        <button @click="handleDelete('archive')" class="btn archive">
          Archive Source
          <small>Keep all content but stop scraping</small>
        </button>
        
        <button @click="handleDelete('keep-content')" class="btn keep">
          Remove Source Only
          <small>Keep content but remove source configuration</small>
        </button>
        
        <button @click="handleDelete('delete-all')" class="btn delete">
          Delete Everything
          <small>Remove source and all associated content</small>
        </button>
      </div>
      
      <button @click="showDeleteDialog = false" class="btn cancel">Cancel</button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useSourceStore } from '../stores/source'
import SourceForm from './SourceForm.vue'
import { read, utils } from 'xlsx'

export default {
  name: 'Sources',
  components: { SourceForm },
  
  setup() {
    const sourceStore = useSourceStore()
    const showForm = ref(false)
    const editingSource = ref(null)
    const isTriggering = ref({})
    const showDeleteDialog = ref(false)
    const sourceToDelete = ref(null)
    const loading = ref(false)
    const error = ref(null)

    const sources = computed(() => sourceStore.sources)

    const formatSchedule = (schedule) => {
      const scheduleMap = {
        '*/30 * * * *': 'Every 30 minutes',
        '0 * * * *': 'Every hour',
        '0 */6 * * *': 'Every 6 hours',
        '0 0 * * *': 'Daily',
        '0 0 * * 0': 'Weekly'
      }
      return scheduleMap[schedule] || schedule
    }

    const formatDate = (date) => {
      if (!date) return ''
      return new Date(date).toLocaleString()
    }

    const handleSourceSubmitted = async (sourceData) => {
      try {
        loading.value = true
        console.log('Form submitted with:', sourceData)
        await sourceStore.addSource(sourceData)
        console.log('Source added successfully')
        showForm.value = false
        await sourceStore.fetchSources() // Refresh the list
      } catch (err) {
        console.error('Failed to add source:', err)
        error.value = err.message
      } finally {
        loading.value = false
      }
    }

    const editSource = (source) => {
      editingSource.value = source
      showForm.value = true
    }

    const confirmDelete = (source) => {
      sourceToDelete.value = source
      showDeleteDialog.value = true
    }

    const handleDelete = async (sourceId) => {
      if (!confirm('Are you sure you want to delete this source? This will also delete all content from this source.')) {
        return;
      }

      loading.value = true;
      try {
        await sourceStore.deleteSource(sourceId)
        console.log('Source deleted successfully')
      } catch (error) {
        console.error('Delete failed:', error)
        alert(error.message || 'Failed to delete source')
      } finally {
        loading.value = false
      }
    }

    const triggerManualScrape = async (sourceId) => {
      if (!sourceId) return
      
      try {
        isTriggering.value[sourceId] = true
        const result = await sourceStore.triggerScrape(sourceId)
        console.log('Scrape result:', result)
        
        // Immediately fetch updated source data
        await sourceStore.fetchSources()
        
      } catch (error) {
        console.error('Scraping failed:', error)
      } finally {
        isTriggering.value[sourceId] = false
      }
    }

    const handleFileUpload = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const data = new Uint8Array(e.target.result);
          const workbook = read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = utils.sheet_to_json(firstSheet);

          // First, create a content type for contact scraping
          const contentType = await contentTypeStore.createContentType({
            name: 'Contact Information',
            description: 'Scrapes contact information from websites',
            selectors: {
              listPage: {
                container: 'body',
                name: '[itemtype*="Person"] [itemprop="name"], .person-name, .contact-name',
                position: '[itemtype*="Person"] [itemprop="jobTitle"], .position, .job-title',
                phone: '[itemprop="telephone"], .phone, [href*="tel:"]',
                email: '[itemprop="email"], .email, [href*="mailto:"]'
              }
            }
          });

          // Then create sources for each row
          for (const row of rows) {
            await sourceStore.addSource({
              url: row.url,
              name: row.name || row.url,
              contentType: contentType._id,
              schedule: '0 0 * * *', // Daily
              scrapeMode: 'list',
              maxDepth: 1,
              metadata: {
                importedFrom: file.name,
                importDate: new Date(),
                targetData: {
                  company: row.company,
                  category: row.category,
                  notes: row.notes
                }
              }
            });
          }

          alert(`Successfully imported ${rows.length} sources`);
        };
        reader.readAsArrayBuffer(file);
      } catch (error) {
        console.error('Import failed:', error);
        alert('Failed to import sources. Please check the file format.');
      }
    }

    onMounted(async () => {
      loading.value = true
      try {
        await sourceStore.fetchSources()
      } catch (err) {
        error.value = err.message
        console.error('Failed to fetch sources:', err)
      } finally {
        loading.value = false
      }
    })

    return {
      sources,
      loading,
      error,
      showForm,
      editingSource,
      handleSourceSubmitted,
      editSource,
      confirmDelete,
      handleDelete,
      formatSchedule,
      formatDate,
      isTriggering,
      triggerManualScrape,
      showDeleteDialog,
      sourceToDelete,
      handleFileUpload
    }
  }
}
</script>

<style scoped>
.source-card {
  border: 1px solid #ddd;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 4px;
}

.source-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.scrape-btn {
  background-color: #42b983;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.scrape-btn:disabled {
  background-color: #a8d5c2;
  cursor: not-allowed;
}

.edit-btn {
  background-color: #4a5568;
}

.delete-btn {
  background-color: #dc3545;
}

.edit-btn, .delete-btn {
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.delete-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 500px;
}

.delete-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 1rem 0;
}

.delete-options button {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 1rem;
  text-align: left;
}

.delete-options small {
  font-size: 0.8rem;
  opacity: 0.8;
}

.archive { background: #4a5568; }
.keep { background: #2c5282; }
.delete { background: #c53030; }
.cancel { background: #718096; }

.import-section {
  margin: 2rem 0;
  padding: 1rem;
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  text-align: center;
}

.import-btn {
  background: var(--primary-color);
  color: white;
  padding: 1rem 2rem;
  border-radius: 4px;
  cursor: pointer;
  border: none;
  margin: 1rem;
}

.template-link {
  display: block;
  color: var(--secondary-color);
  margin-top: 1rem;
}
</style>
