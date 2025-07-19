<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Plus, Settings, CheckCircle, XCircle, Info, X } from 'lucide-vue-next'
import VueHtmlEditor from '@/components/VueHtmlEditor.vue'
import { useEditorStore } from '@/stores/editor'
import type { EditorDocument } from '@/types/editor'

// Store
const editorStore = useEditorStore()

// Reactive state
const content = ref('')
const showSettings = ref(false)
const notification = ref<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)

// Settings
const settings = ref({
  autosave: false,
  autosaveInterval: 30000, // milliseconds
  showEventLog: true,
  notifications: true
})

const autosaveSeconds = computed({
  get: () => settings.value.autosaveInterval / 1000,
  set: (value: number) => {
    settings.value.autosaveInterval = value * 1000
  }
})

// Computed
const wordCount = computed(() => {
  const text = content.value.replace(/<[^>]*>/g, '')
  return text.trim() ? text.trim().split(/\s+/).length : 0
})

const charCount = computed(() => {
  return content.value.replace(/<[^>]*>/g, '').length
})

// Methods
function createNewDocument() {
  if (editorStore.hasUnsavedChanges) {
    if (!confirm('You have unsaved changes. Create a new document?')) {
      return
    }
  }
  
  editorStore.createNewDocument()
  content.value = ''
  showNotification('Created new document', 'info')
}

async function loadDocument(doc: EditorDocument) {
  if (editorStore.hasUnsavedChanges) {
    if (!confirm('You have unsaved changes. Load this document?')) {
      return
    }
  }
  
  try {
    // Load from server if we don't have content locally
    if (!doc.content) {
      const response = await fetch(`http://localhost:3001/api/documents/${doc.id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          doc = data.document
        }
      }
    }
    
    editorStore.setCurrentDocument(doc)
    editorStore.addToRecent(doc)
    content.value = doc.content
    showNotification(`Loaded "${doc.title}"`, 'success')
  } catch (error) {
    console.error('Failed to load document:', error)
    showNotification('Failed to load document', 'error')
  }
}

async function handleSave(data: { content: string; title: string }) {
  try {
    showNotification('Saving document...', 'info')
    
    let documentId = editorStore.currentDocument?.id
    
    if (documentId) {
      // Update existing document
      const response = await fetch(`http://localhost:3001/api/documents/${documentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: data.title,
          content: data.content
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to save document')
      }
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to save document')
      }
    } else {
      // Create new document  
      const response = await fetch('http://localhost:3001/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: data.title,
          content: data.content
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to create document')
      }
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to create document')
      }
      
      documentId = result.document.id
      
      // Update current document with new ID
      if (editorStore.currentDocument) {
        editorStore.currentDocument.id = documentId
      }
    }
    
    // Update local state
    if (editorStore.currentDocument) {
      editorStore.currentDocument.title = data.title
      editorStore.currentDocument.content = data.content
      editorStore.setUnsavedChanges(false)
    }
    
    showNotification('Document saved successfully', 'success')
  } catch (error) {
    console.error('Save error:', error)
    showNotification('Failed to save document', 'error')
    
    // Fallback to localStorage
    const documents = JSON.parse(localStorage.getItem('vue-html-editor-documents') || '[]')
    
    if (editorStore.currentDocument) {
      const index = documents.findIndex((doc: any) => doc.id === editorStore.currentDocument!.id)
      if (index > -1) {
        documents[index] = {
          ...editorStore.currentDocument,
          title: data.title,
          content: data.content,
          updatedAt: new Date().toISOString()
        }
      } else {
        documents.push({
          ...editorStore.currentDocument,
          title: data.title,
          content: data.content
        })
      }
    }
    
    localStorage.setItem('vue-html-editor-documents', JSON.stringify(documents))
    showNotification('Document saved locally', 'info')
  }
}

function handleLoad(id: string) {
  showNotification('Document loaded', 'success')
}

function handleExport(data: { content: string; title: string }) {
  // Generate complete HTML
  const completeHtml = generateCompleteHTML(data.content, data.title)
  
  // Create and download file
  const blob = new Blob([completeHtml], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${data.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  showNotification('Document exported successfully', 'success')
}

async function handleImageUpload(file: File) {
  try {
    showNotification('Uploading image...', 'info')
    
    const formData = new FormData()
    formData.append('image', file)
    
    const response = await fetch('http://localhost:3001/api/upload/image', {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      throw new Error('Upload failed')
    }
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Upload failed')
    }
    
    showNotification('Image uploaded successfully', 'success')
    return data.url
  } catch (error) {
    console.error('Image upload error:', error)
    showNotification('Failed to upload image', 'error')
    
    // Fallback to data URL
    const reader = new FileReader()
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string
      showNotification('Image loaded locally (not uploaded)', 'info')
      return imageUrl
    }
    reader.readAsDataURL(file)
  }
}

function generateCompleteHTML(content: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
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
            line-height: 1.2;
        }
        h1 { font-size: 2.25rem; }
        h2 { font-size: 1.875rem; }
        h3 { font-size: 1.5rem; }
        h4 { font-size: 1.25rem; }
        h5 { font-size: 1.125rem; }
        h6 { font-size: 1rem; }
        p { margin-bottom: 1rem; }
        ul, ol { margin-bottom: 1rem; padding-left: 2rem; }
        li { margin-bottom: 0.25rem; }
        a { color: #3182ce; text-decoration: underline; }
        a:hover { color: #2c5aa0; }
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
            color: #e11d48;
        }
        pre {
            background-color: #2d3748;
            color: #e2e8f0;
            padding: 1rem;
            border-radius: 0.5rem;
            overflow-x: auto;
            margin: 1rem 0;
        }
        pre code {
            background-color: transparent;
            padding: 0;
            color: inherit;
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
        hr {
            border: none;
            border-top: 1px solid #e2e8f0;
            margin: 2rem 0;
        }
    </style>
</head>
<body>
    ${content}
</body>
</html>`
}

function showNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
  if (!settings.value.notifications) return
  
  notification.value = { message, type }
  setTimeout(() => {
    notification.value = null
  }, 5000)
}

function formatDate(date?: Date): string {
  if (!date) return 'N/A'
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date)
}

function resetSettings() {
  settings.value = {
    autosave: false,
    autosaveInterval: 30000,
    showEventLog: true,
    notifications: true
  }
  showNotification('Settings reset to defaults', 'info')
}

// Load settings from localStorage
const savedSettings = localStorage.getItem('vue-html-editor-settings')
if (savedSettings) {
  try {
    Object.assign(settings.value, JSON.parse(savedSettings))
  } catch (error) {
    console.warn('Failed to load settings from localStorage')
  }
}

// Save settings to localStorage
watch(
  settings,
  (newSettings) => {
    localStorage.setItem('vue-html-editor-settings', JSON.stringify(newSettings))
  },
  { deep: true }
)

// Initialize with a new document
editorStore.createNewDocument()
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Vue HTML Editor</h1>
            <p class="text-sm text-gray-600 mt-1">
              A modern, TipTap-based rich text editor for Vue 3
            </p>
          </div>
          
          <div class="flex items-center space-x-4">
            <div class="text-right">
              <p class="text-sm font-medium text-gray-900">
                {{ editorStore.currentDocument?.title || 'Untitled Document' }}
              </p>
              <p class="text-xs text-gray-500">
                {{ editorStore.hasUnsavedChanges ? 'Unsaved changes' : 'All changes saved' }}
              </p>
            </div>
            
            <div class="flex items-center space-x-2">
              <button
                @click="createNewDocument"
                class="px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                <Plus class="w-4 h-4 mr-1" />
                New
              </button>
              
              <button
                @click="showSettings = !showSettings"
                class="p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
                title="Settings"
              >
                <Settings class="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 py-6">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Editor Column -->
        <div class="lg:col-span-3">
          <VueHtmlEditor
            v-model="content"
            :placeholder="'Start writing your amazing content here...'"
            :autosave="settings.autosave"
            :autosave-interval="settings.autosaveInterval"
            @save="handleSave"
            @load="handleLoad"
            @export="handleExport"
            @image-upload="handleImageUpload"
          />
        </div>

        <!-- Sidebar -->
        <div class="lg:col-span-1 space-y-6">
          <!-- Document Info -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 class="text-sm font-medium text-gray-900 mb-3">Document Info</h3>
            <div class="space-y-2 text-xs text-gray-600">
              <div class="flex justify-between">
                <span>Words:</span>
                <span>{{ wordCount }}</span>
              </div>
              <div class="flex justify-between">
                <span>Characters:</span>
                <span>{{ charCount }}</span>
              </div>
              <div class="flex justify-between">
                <span>Created:</span>
                <span>{{ formatDate(editorStore.currentDocument?.createdAt) }}</span>
              </div>
              <div v-if="editorStore.currentDocument?.updatedAt" class="flex justify-between">
                <span>Modified:</span>
                <span>{{ formatDate(editorStore.currentDocument.updatedAt) }}</span>
              </div>
            </div>
          </div>

          <!-- Recent Documents -->
          <div v-if="editorStore.recentDocuments.length > 0" class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 class="text-sm font-medium text-gray-900 mb-3">Recent Documents</h3>
            <div class="space-y-2">
              <button
                v-for="doc in editorStore.recentDocuments.slice(0, 5)"
                :key="doc.id"
                @click="loadDocument(doc)"
                class="w-full text-left p-2 text-xs text-gray-600 hover:bg-gray-50 rounded border-l-2 border-transparent hover:border-blue-500 transition-all"
              >
                <div class="font-medium truncate">{{ doc.title }}</div>
                <div class="text-gray-400">{{ formatDate(doc.updatedAt) }}</div>
              </button>
            </div>
          </div>

          <!-- Event Log -->
          <div v-if="settings.showEventLog" class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 class="text-sm font-medium text-gray-900 mb-3">Event Log</h3>
            <div class="space-y-1 max-h-40 overflow-y-auto">
              <div
                v-for="event in editorStore.events.slice(-10).reverse()"
                :key="event.timestamp.getTime()"
                class="text-xs text-gray-600 p-1 border-l-2 border-gray-200"
              >
                <div class="font-medium">{{ event.type }}</div>
                <div class="text-gray-400">{{ formatTime(event.timestamp) }}</div>
              </div>
            </div>
            <button
              @click="editorStore.clearEvents"
              class="mt-2 text-xs text-gray-500 hover:text-gray-700"
            >
              Clear log
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Settings Panel -->
    <div
      v-if="showSettings"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="showSettings = false"
    >
      <div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4" @click.stop>
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Editor Settings</h3>
        
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">Auto-save</label>
            <input
              v-model="settings.autosave"
              type="checkbox"
              class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </div>
          
          <div v-if="settings.autosave">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Auto-save interval (seconds)
            </label>
            <input
              v-model.number="autosaveSeconds"
              type="number"
              min="10"
              max="300"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">Show event log</label>
            <input
              v-model="settings.showEventLog"
              type="checkbox"
              class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </div>
          
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">Enable notifications</label>
            <input
              v-model="settings.notifications"
              type="checkbox"
              class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div class="flex justify-end space-x-3 mt-6">
          <button
            @click="resetSettings"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Reset
          </button>
          <button
            @click="showSettings = false"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Notifications -->
    <div
      v-if="notification"
      class="fixed top-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 transition-all duration-300"
      :class="{
        'border-green-200 bg-green-50': notification.type === 'success',
        'border-red-200 bg-red-50': notification.type === 'error',
        'border-blue-200 bg-blue-50': notification.type === 'info'
      }"
    >
      <div class="flex items-center">
        <CheckCircle v-if="notification.type === 'success'" class="w-5 h-5 text-green-500 mr-2" />
        <XCircle v-if="notification.type === 'error'" class="w-5 h-5 text-red-500 mr-2" />
        <Info v-if="notification.type === 'info'" class="w-5 h-5 text-blue-500 mr-2" />
        <span class="text-sm font-medium text-gray-900">{{ notification.message }}</span>
        <button
          @click="notification = null"
          class="ml-3 text-gray-400 hover:text-gray-600"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<style>
/* Additional global styles if needed */
</style>
