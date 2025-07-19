<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <h3 class="text-lg font-semibold text-gray-900 mb-4">
        {{ isEditing ? 'Save Document' : 'Save New Document' }}
      </h3>
      
      <div class="space-y-4">
        <div>
          <label for="documentTitle" class="block text-sm font-medium text-gray-700 mb-1">
            Document Title *
          </label>
          <input
            id="documentTitle"
            v-model="saveData.title"
            type="text"
            required
            placeholder="Enter document title"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            @keydown.enter="saveDocument"
          />
          <p v-if="titleError" class="text-sm text-red-600 mt-1">{{ titleError }}</p>
        </div>
        
        <div>
          <label for="documentFilename" class="block text-sm font-medium text-gray-700 mb-1">
            Filename
          </label>
          <input
            id="documentFilename"
            v-model="saveData.filename"
            type="text"
            placeholder="Auto-generated from title"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            @keydown.enter="saveDocument"
          />
          <p class="text-xs text-gray-500 mt-1">
            Leave blank to auto-generate from title. Must end with .html
          </p>
          <p v-if="filenameError" class="text-sm text-red-600 mt-1">{{ filenameError }}</p>
        </div>

        <!-- Document Info -->
        <div v-if="currentDocument" class="bg-gray-50 rounded-lg p-3">
          <h4 class="text-sm font-medium text-gray-900 mb-2">Document Information</h4>
          <div class="grid grid-cols-2 gap-4 text-xs text-gray-600">
            <div>
              <span class="font-medium">Created:</span>
              <div>{{ formatDate(currentDocument.createdAt) }}</div>
            </div>
            <div v-if="currentDocument.updatedAt">
              <span class="font-medium">Last Modified:</span>
              <div>{{ formatDate(currentDocument.updatedAt) }}</div>
            </div>
            <div>
              <span class="font-medium">Word Count:</span>
              <div>{{ wordCount }}</div>
            </div>
            <div>
              <span class="font-medium">Characters:</span>
              <div>{{ charCount }}</div>
            </div>
          </div>
        </div>

        <!-- Save Options -->
        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900">Save Options</h4>
          
          <div class="flex items-center">
            <input
              id="saveAsComplete"
              v-model="saveData.saveAsComplete"
              type="checkbox"
              class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label for="saveAsComplete" class="ml-2 text-sm text-gray-700">
              Save as complete HTML document
            </label>
          </div>
          <p class="text-xs text-gray-500 ml-6">
            Includes styling and can be opened in any web browser
          </p>
          
          <div class="flex items-center">
            <input
              id="updateRecent"
              v-model="saveData.updateRecent"
              type="checkbox"
              class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label for="updateRecent" class="ml-2 text-sm text-gray-700">
              Add to recent documents
            </label>
          </div>
        </div>
      </div>
      
      <div class="flex justify-end space-x-3 mt-6">
        <button
          @click="closeModal"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          Cancel
        </button>
        <button
          @click="saveDocument"
          :disabled="!canSave"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-colors"
        >
          {{ isEditing ? 'Update Document' : 'Save Document' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { EditorDocument } from '@/types/editor'

interface Props {
  currentDocument?: EditorDocument | null
}

interface Emits {
  (e: 'close'): void
  (e: 'save', data: { title: string; filename: string; saveAsComplete: boolean; updateRecent: boolean }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Reactive state
const saveData = ref({
  title: '',
  filename: '',
  saveAsComplete: true,
  updateRecent: true
})

const titleError = ref<string | null>(null)
const filenameError = ref<string | null>(null)

// Computed
const isEditing = computed(() => !!props.currentDocument?.id)

const canSave = computed(() => {
  return saveData.value.title.trim() && !titleError.value && !filenameError.value
})

const wordCount = computed(() => {
  if (!props.currentDocument?.content) return 0
  const text = props.currentDocument.content.replace(/<[^>]*>/g, '')
  return text.trim() ? text.trim().split(/\s+/).length : 0
})

const charCount = computed(() => {
  if (!props.currentDocument?.content) return 0
  return props.currentDocument.content.replace(/<[^>]*>/g, '').length
})

// Methods
function closeModal() {
  emit('close')
}

function validateTitle() {
  titleError.value = null
  
  if (!saveData.value.title.trim()) {
    titleError.value = 'Title is required'
    return false
  }
  
  if (saveData.value.title.trim().length < 1) {
    titleError.value = 'Title must be at least 1 character'
    return false
  }
  
  if (saveData.value.title.trim().length > 100) {
    titleError.value = 'Title must be less than 100 characters'
    return false
  }
  
  // Check for invalid characters in title
  const invalidChars = /[<>:"/\\|?*]/
  if (invalidChars.test(saveData.value.title)) {
    titleError.value = 'Title contains invalid characters: < > : " / \\ | ? *'
    return false
  }
  
  return true
}

function validateFilename() {
  filenameError.value = null
  
  if (!saveData.value.filename.trim()) {
    // Auto-generate filename from title
    generateFilename()
    return true
  }
  
  const filename = saveData.value.filename.trim()
  
  // Check if filename ends with .html
  if (!filename.toLowerCase().endsWith('.html')) {
    filenameError.value = 'Filename must end with .html'
    return false
  }
  
  // Check for invalid characters in filename
  const invalidChars = /[<>:"/\\|?*]/
  if (invalidChars.test(filename)) {
    filenameError.value = 'Filename contains invalid characters: < > : " / \\ | ? *'
    return false
  }
  
  // Check filename length
  if (filename.length > 255) {
    filenameError.value = 'Filename is too long (max 255 characters)'
    return false
  }
  
  return true
}

function generateFilename() {
  if (!saveData.value.title.trim()) return
  
  // Create a safe filename from title
  const safeTitle = saveData.value.title
    .trim()
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .toLowerCase()
  
  saveData.value.filename = `${safeTitle}.html`
}

function saveDocument() {
  if (!validateTitle() || !validateFilename()) {
    return
  }
  
  emit('save', {
    title: saveData.value.title.trim(),
    filename: saveData.value.filename.trim() || generateFilenameFromTitle(),
    saveAsComplete: saveData.value.saveAsComplete,
    updateRecent: saveData.value.updateRecent
  })
}

function generateFilenameFromTitle(): string {
  const safeTitle = saveData.value.title
    .trim()
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase()
  
  return `${safeTitle}.html`
}

function formatDate(date?: Date): string {
  if (!date) return 'N/A'
  
  const d = typeof date === 'string' ? new Date(date) : date
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d)
}

// Handle escape key
function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeModal()
  }
}

// Watch for title changes to auto-generate filename
watch(() => saveData.value.title, () => {
  validateTitle()
  if (!saveData.value.filename.trim()) {
    generateFilename()
  }
})

watch(() => saveData.value.filename, () => {
  validateFilename()
})

// Initialize form data
onMounted(() => {
  document.addEventListener('keydown', handleEscape)
  
  // Initialize with current document data if editing
  if (props.currentDocument) {
    saveData.value.title = props.currentDocument.title || ''
    saveData.value.filename = '' // Let it auto-generate
  } else {
    saveData.value.title = 'Untitled Document'
    saveData.value.filename = ''
  }
  
  // Generate initial filename
  generateFilename()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-width: 32rem;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 1.5rem;
}

@media (max-width: 640px) {
  .modal-content {
    margin: 1rem;
    max-width: calc(100vw - 2rem);
  }
}
</style>