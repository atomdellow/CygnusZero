<template>
  <div class="modal">
    <div class="modal-content">
      <h2>{{ editingType ? 'Edit' : 'Create' }} Content Type</h2>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>Name</label>
          <input v-model="form.name" required />
        </div>

        <div class="form-group">
          <label>Description</label>
          <textarea v-model="form.description"></textarea>
        </div>

        <div class="selectors">
          <h3>List Page Selectors</h3>
          <div class="selector-group">
            <div class="form-group">
              <label>Container</label>
              <input v-model="form.selectors.listPage.container" placeholder=".news-item" />
            </div>
            <div class="form-group">
              <label>Title</label>
              <input v-model="form.selectors.listPage.title" placeholder="h2" />
            </div>
            <div class="form-group">
              <label>Content</label>
              <input v-model="form.selectors.listPage.content" placeholder=".summary" />
            </div>
            <div class="form-group">
              <label>Date</label>
              <input v-model="form.selectors.listPage.date" placeholder=".date" />
            </div>
            <div class="form-group">
              <label>Links</label>
              <input v-model="form.selectors.listPage.links" placeholder="a[href*='/article/']" />
            </div>
          </div>

          <h3>Article Page Selectors</h3>
          <div class="selector-group">
            <div class="form-group">
              <label>Container</label>
              <input v-model="form.selectors.articlePage.container" placeholder=".article-container" />
            </div>
            <div class="form-group">
              <label>Title</label>
              <input v-model="form.selectors.articlePage.title" placeholder="h1" />
            </div>
            <div class="form-group">
              <label>Content</label>
              <input v-model="form.selectors.articlePage.content" placeholder=".content p" />
            </div>
            <div class="form-group">
              <label>Date</label>
              <input v-model="form.selectors.articlePage.date" placeholder=".date" />
            </div>
            <div class="form-group">
              <label>Links</label>
              <input v-model="form.selectors.articlePage.links" placeholder="a[href]" />
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary">
            {{ editingType ? 'Update' : 'Create' }}
          </button>
          <button type="button" class="btn" @click="$emit('close')">Cancel</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  editingType: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['save', 'close'])

const form = ref({
  name: '',
  description: '',
  isActive: true,
  selectors: {
    listPage: {
      container: '',
      title: '',
      content: '',
      date: '',
      links: ''
    },
    articlePage: {
      container: '',
      title: '',
      content: '',
      date: '',
      links: ''
    }
  }
})

onMounted(() => {
  if (props.editingType) {
    // Deep copy the editing type to avoid mutations
    form.value = JSON.parse(JSON.stringify(props.editingType))
  }
})

const handleSubmit = () => {
  emit('save', form.value)
}
</script>

<style scoped>
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
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.selector-group {
  display: grid;
  gap: 1rem;
  margin-bottom: 2rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.selectors h3 {
  margin: 1.5rem 0 1rem;
}

input, textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
}

textarea {
  min-height: 100px;
}
</style>
