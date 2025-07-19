<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content max-w-lg" @click.stop>
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Open Document</h3>
      
      <div class="space-y-4">
        <div v-if="isLoading" class="text-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p class="mt-2 text-sm text-gray-600">Loading documents...</p>
        </div>
        
        <div v-else-if="documents.length === 0" class="text-center py-8">
          <FolderOpen class="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p class="text-sm text-gray-600">No documents found</p>
          <p class="text-xs text-gray-500 mt-1">Save a document first to see it here</p>
        </div>
        
        <div v-else class="space-y-2 max-h-96 overflow-y-auto">
          <div
            v-for="doc in documents"
            :key="doc.id"
            class="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
            @click="selectDocument(doc)"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0">
                <h4 class="text-sm font-medium text-gray-900 truncate">
                  {{ doc.title }}
                </h4>
                <p class="text-xs text-gray-500 mt-1">
                  Created: {{ formatDate(doc.createdAt) }}
                </p>
                <p v-if="doc.updatedAt && doc.updatedAt !== doc.createdAt" class="text-xs text-gray-500">
                  Modified: {{ formatDate(doc.updatedAt) }}
                </p>
              </div>
              <div class="flex items-center space-x-2 ml-3">
                <button
                  @click.stop="previewDocument(doc)"
                  class="p-1 text-gray-400 hover:text-gray-600"
                  title="Preview"
                >
                  <Eye class="w-4 h-4" />
                </button>
                <button
                  @click.stop="deleteDocument(doc)"
                  class="p-1 text-gray-400 hover:text-red-600"
                  title="Delete"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <!-- Content Preview -->
            <div v-if="doc.content" class="mt-2 text-xs text-gray-600 line-clamp-2">
              {{ getTextPreview(doc.content) }}
            </div>
          </div>
        </div>
        
        <!-- Recent Documents -->
        <div v-if="recentDocuments.length > 0" class="border-t border-gray-200 pt-4">
          <h4 class="text-sm font-medium text-gray-700 mb-2">Recent Documents</h4>
          <div class="space-y-1">
            <button
              v-for="doc in recentDocuments.slice(0, 3)"
              :key="`recent-${doc.id}`"
              @click="selectDocument(doc)"
              class="w-full text-left px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded truncate"
            >
              {{ doc.title }}
            </button>
          </div>
        </div>
      </div>
      
      <div class="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          @click="closeModal"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          Cancel
        </button>
        <button
          @click="refreshDocuments"
          :disabled="isLoading"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 rounded-md transition-colors"
        >
          <RefreshCw class="w-4 h-4 mr-1" />
          Refresh
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { FolderOpen, Eye, Trash2, RefreshCw } from 'lucide-vue-next'
import { useEditorStore } from '@/stores/editor'
import type { EditorDocument } from '@/types/editor'

interface Emits {
  (e: 'close'): void
  (e: 'load', document: EditorDocument): void
}

const emit = defineEmits<Emits>()
const editorStore = useEditorStore()

const isLoading = ref(false)
const documents = ref<EditorDocument[]>([])

const recentDocuments = computed(() => editorStore.recentDocuments)

function closeModal() {
  emit('close')
}

function selectDocument(doc: EditorDocument) {
  emit('load', doc)
}

function previewDocument(doc: EditorDocument) {
  // Create a preview window with the document content
  const previewWindow = window.open('', '_blank', 'width=800,height=600')
  if (previewWindow) {
    previewWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Preview: ${doc.title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          h1, h2, h3, h4, h5, h6 {
            color: #2d3748;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
          }
          img {
            max-width: 100%;
            height: auto;
            border-radius: 0.5rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            margin: 1rem 0;
          }
          blockquote {
            border-left: 4px solid #3182ce;
            padding-left: 1rem;
            font-style: italic;
            color: #4a5568;
            background-color: #f7fafc;
            padding: 1rem;
            margin: 1rem 0;
          }
          code {
            background-color: #f7fafc;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-family: 'Courier New', monospace;
            font-size: 0.875rem;
          }
          pre {
            background-color: #2d3748;
            color: #e2e8f0;
            padding: 1rem;
            border-radius: 0.5rem;
            overflow-x: auto;
            margin: 1rem 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 1rem 0;
          }
          th, td {
            border: 1px solid #e2e8f0;
            padding: 0.75rem;
            text-align: left;
          }
          th {
            background-color: #f7fafc;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <h1>Preview: ${doc.title}</h1>
        <hr>
        ${doc.content}
      </body>
      </html>
    `)
    previewWindow.document.close()
  }
}

async function deleteDocument(doc: EditorDocument) {
  if (confirm(`Are you sure you want to delete "${doc.title}"?`)) {
    try {
      // Remove from documents list
      documents.value = documents.value.filter(d => d.id !== doc.id)
      
      // Remove from recent documents
      const recentIndex = editorStore.recentDocuments.findIndex(d => d.id === doc.id)
      if (recentIndex > -1) {
        editorStore.recentDocuments.splice(recentIndex, 1)
      }
      
      // Emit delete event for server-side handling
      editorStore.emitEvent('delete', { documentId: doc.id })
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Failed to delete document')
    }
  }
}

async function refreshDocuments() {
  await loadDocuments()
}

async function loadDocuments() {
  isLoading.value = true
  try {
    // In a real implementation, this would fetch from the server
    // For now, we'll use mock data and local storage
    const savedDocs = localStorage.getItem('vue-html-editor-documents')
    if (savedDocs) {
      const parsedDocs = JSON.parse(savedDocs)
      documents.value = parsedDocs.map((doc: any) => ({
        ...doc,
        createdAt: new Date(doc.createdAt),
        updatedAt: new Date(doc.updatedAt)
      }))
    } else {
      documents.value = []
    }
  } catch (error) {
    console.error('Error loading documents:', error)
    documents.value = []
  } finally {
    isLoading.value = false
  }
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

function getTextPreview(html: string): string {
  // Create a temporary div to extract text content
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html
  const textContent = tempDiv.textContent || tempDiv.innerText || ''
  return textContent.length > 100 ? textContent.substring(0, 100) + '...' : textContent
}

// Load documents when modal opens
onMounted(() => {
  loadDocuments()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>