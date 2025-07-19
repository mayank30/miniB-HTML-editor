<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">Open Document</h3>
        <button
          @click="refreshDocuments"
          :disabled="isLoading"
          class="p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
          title="Refresh"
        >
          <RefreshCw :class="['w-4 h-4', { 'animate-spin': isLoading }]" />
        </button>
      </div>
      
      <!-- Search and Filter -->
      <div class="mb-4 space-y-3">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search documents..."
            class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div class="flex items-center space-x-4">
          <div class="flex items-center">
            <label for="sortBy" class="text-sm font-medium text-gray-700 mr-2">Sort by:</label>
            <select
              id="sortBy"
              v-model="sortBy"
              class="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="updatedAt">Last Modified</option>
              <option value="createdAt">Created Date</option>
              <option value="title">Title</option>
            </select>
          </div>
          
          <div class="flex items-center">
            <label for="sortOrder" class="text-sm font-medium text-gray-700 mr-2">Order:</label>
            <select
              id="sortOrder"
              v-model="sortOrder"
              class="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading && !documents.length" class="flex items-center justify-center py-8">
        <div class="flex items-center space-x-2">
          <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span class="text-sm text-gray-600">Loading documents...</span>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
        <div class="flex">
          <AlertCircle class="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
          <div>
            <p class="text-sm text-red-800 font-medium">Failed to load documents</p>
            <p class="text-sm text-red-700 mt-1">{{ error }}</p>
            <button
              @click="refreshDocuments"
              class="mt-2 text-sm text-red-600 hover:text-red-700 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!documents.length" class="text-center py-8">
        <FileText class="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h4 class="text-lg font-medium text-gray-900 mb-2">No documents found</h4>
        <p class="text-sm text-gray-600">
          {{ searchQuery ? 'No documents match your search.' : 'You haven\'t saved any documents yet.' }}
        </p>
      </div>

      <!-- Documents List -->
      <div v-else class="space-y-2 max-h-96 overflow-y-auto">
        <div
          v-for="doc in filteredAndSortedDocuments"
          :key="doc.id"
          @click="selectDocument(doc)"
          :class="[
            'p-4 border border-gray-200 rounded-lg cursor-pointer transition-all hover:bg-gray-50 hover:border-gray-300',
            { 'ring-2 ring-blue-500 border-blue-500': selectedDocument?.id === doc.id }
          ]"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <h4 class="text-sm font-medium text-gray-900 truncate">{{ doc.title }}</h4>
              <div class="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                <span>{{ formatDate(doc.updatedAt || doc.createdAt) }}</span>
                <span>{{ formatFileSize(doc.size || 0) }}</span>
                <span v-if="doc.content">{{ getWordCount(doc.content) }} words</span>
              </div>
              <p v-if="doc.content" class="mt-2 text-xs text-gray-600 line-clamp-2">
                {{ getPlainText(doc.content).substring(0, 100) }}...
              </p>
            </div>
            
            <div class="flex items-center space-x-2 ml-4">
              <button
                @click.stop="downloadDocument(doc)"
                class="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                title="Download"
              >
                <Download class="w-4 h-4" />
              </button>
              <button
                @click.stop="deleteDocument(doc)"
                class="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                title="Delete"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
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
          @click="loadSelectedDocument"
          :disabled="!selectedDocument"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-colors"
        >
          Open Document
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Search, RefreshCw, FileText, Download, Trash2, AlertCircle } from 'lucide-vue-next'
import type { EditorDocument } from '@/types/editor'

// API Base URL
const API_BASE_URL = 'http://localhost:3001/api'

interface Emits {
  (e: 'close'): void
  (e: 'load', document: EditorDocument): void
}

const emit = defineEmits<Emits>()

// Reactive state
const documents = ref<EditorDocument[]>([])
const selectedDocument = ref<EditorDocument | null>(null)
const searchQuery = ref('')
const sortBy = ref<'title' | 'createdAt' | 'updatedAt'>('updatedAt')
const sortOrder = ref<'asc' | 'desc'>('desc')
const isLoading = ref(false)
const error = ref<string | null>(null)

// Computed
const filteredAndSortedDocuments = computed(() => {
  let filtered = documents.value

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(doc =>
      doc.title.toLowerCase().includes(query) ||
      (doc.content && getPlainText(doc.content).toLowerCase().includes(query))
    )
  }

  // Sort documents
  filtered.sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (sortBy.value) {
      case 'title':
        aValue = a.title.toLowerCase()
        bValue = b.title.toLowerCase()
        break
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
        break
      case 'updatedAt':
      default:
        aValue = new Date(a.updatedAt || a.createdAt).getTime()
        bValue = new Date(b.updatedAt || b.createdAt).getTime()
        break
    }

    if (sortOrder.value === 'desc') {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    } else {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    }
  })

  return filtered
})

// Methods
function closeModal() {
  emit('close')
}

async function loadDocuments() {
  isLoading.value = true
  error.value = null

  try {
    const response = await fetch(`${API_BASE_URL}/documents`)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to load documents')
    }

    documents.value = data.documents || []
  } catch (err) {
    console.error('Failed to load documents:', err)
    error.value = err instanceof Error ? err.message : 'Unknown error occurred'
    
    // Fallback to localStorage
    try {
      const localDocs = localStorage.getItem('vue-html-editor-documents')
      if (localDocs) {
        documents.value = JSON.parse(localDocs)
        error.value = null
      }
    } catch (localErr) {
      console.error('Failed to load from localStorage:', localErr)
    }
  } finally {
    isLoading.value = false
  }
}

async function refreshDocuments() {
  await loadDocuments()
}

function selectDocument(doc: EditorDocument) {
  selectedDocument.value = doc
}

async function loadSelectedDocument() {
  if (!selectedDocument.value) return

  try {
    // If we have the content locally, use it
    if (selectedDocument.value.content) {
      emit('load', selectedDocument.value)
      return
    }

    // Otherwise, fetch from server
    isLoading.value = true
    const response = await fetch(`${API_BASE_URL}/documents/${selectedDocument.value.id}`)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to load document')
    }

    emit('load', data.document)
  } catch (err) {
    console.error('Failed to load document:', err)
    error.value = err instanceof Error ? err.message : 'Failed to load document'
  } finally {
    isLoading.value = false
  }
}

async function deleteDocument(doc: EditorDocument) {
  if (!confirm(`Are you sure you want to delete "${doc.title}"? This action cannot be undone.`)) {
    return
  }

  try {
    const response = await fetch(`${API_BASE_URL}/documents/${doc.id}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete document')
    }

    // Remove from local list
    documents.value = documents.value.filter(d => d.id !== doc.id)
    
    // Clear selection if deleted document was selected
    if (selectedDocument.value?.id === doc.id) {
      selectedDocument.value = null
    }
  } catch (err) {
    console.error('Failed to delete document:', err)
    error.value = err instanceof Error ? err.message : 'Failed to delete document'
  }
}

async function downloadDocument(doc: EditorDocument) {
  try {
    const response = await fetch(`${API_BASE_URL}/documents/${doc.id}/export`, {
      method: 'POST'
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = `${doc.title.replace(/[^a-z0-9]/gi, '_')}.html`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (err) {
    console.error('Failed to download document:', err)
    error.value = err instanceof Error ? err.message : 'Failed to download document'
  }
}

function formatDate(date?: Date | string): string {
  if (!date) return 'Unknown'
  
  const d = typeof date === 'string' ? new Date(date) : date
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d)
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function getPlainText(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}

function getWordCount(html: string): number {
  const text = getPlainText(html)
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

// Handle escape key
function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeModal()
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleEscape)
  loadDocuments()
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
  max-width: 48rem;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 1.5rem;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (max-width: 640px) {
  .modal-content {
    margin: 1rem;
    max-width: calc(100vw - 2rem);
  }
}
</style>