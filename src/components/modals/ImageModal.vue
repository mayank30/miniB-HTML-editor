<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Insert Image</h3>
      
      <div class="space-y-4">
        <!-- Upload Tab -->
        <div class="border-b border-gray-200">
          <nav class="-mb-px flex space-x-8">
            <button
              @click="activeTab = 'upload'"
              :class="[
                'py-2 px-1 border-b-2 font-medium text-sm',
                activeTab === 'upload'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              Upload File
            </button>
            <button
              @click="activeTab = 'url'"
              :class="[
                'py-2 px-1 border-b-2 font-medium text-sm',
                activeTab === 'url'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              From URL
            </button>
          </nav>
        </div>

        <!-- Upload Tab Content -->
        <div v-if="activeTab === 'upload'" class="space-y-4">
          <div
            @drop="handleDrop"
            @dragover.prevent
            @dragenter.prevent
            @dragleave="isDragOver = false"
            @dragenter="isDragOver = true"
            :class="[
              'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
              isDragOver 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            ]"
            @click="triggerFileInput"
          >
            <div v-if="isUploading" class="flex flex-col items-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <p class="text-sm text-gray-600">Uploading...</p>
              <div v-if="uploadProgress > 0" class="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  class="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  :style="{ width: uploadProgress + '%' }"
                ></div>
              </div>
            </div>
            <div v-else>
              <Upload class="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p class="text-sm text-gray-600 mb-2">
                <span v-if="isDragOver" class="text-blue-600 font-medium">
                  Drop your image here
                </span>
                <span v-else>
                  Drag and drop an image here, or
                  <span class="text-blue-600 hover:text-blue-700 underline cursor-pointer">
                    browse
                  </span>
                </span>
              </p>
              <p class="text-xs text-gray-500">
                Supports: JPEG, PNG, GIF, WebP (max 5MB)
              </p>
            </div>
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              @change="handleFileSelect"
              class="hidden"
            />
          </div>
          
          <!-- File Preview -->
          <div v-if="selectedFile && !isUploading" class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
            <img 
              v-if="previewUrl" 
              :src="previewUrl" 
              :alt="selectedFile.name"
              class="w-16 h-16 object-cover rounded-lg"
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">{{ selectedFile.name }}</p>
              <p class="text-sm text-gray-500">{{ formatFileSize(selectedFile.size) }}</p>
              <button
                @click="removeSelectedFile"
                class="text-xs text-red-600 hover:text-red-700 mt-1"
              >
                Remove
              </button>
            </div>
          </div>

          <!-- Upload Error -->
          <div v-if="uploadError" class="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div class="flex">
              <AlertCircle class="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p class="text-sm text-red-800 font-medium">Upload failed</p>
                <p class="text-sm text-red-700 mt-1">{{ uploadError }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- URL Tab Content -->
        <div v-if="activeTab === 'url'" class="space-y-4">
          <div>
            <label for="imageUrl" class="block text-sm font-medium text-gray-700 mb-1">
              Image URL *
            </label>
            <input
              id="imageUrl"
              v-model="imageData.url"
              type="url"
              required
              placeholder="https://example.com/image.jpg"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              @input="validateUrl"
            />
            <p v-if="urlError" class="text-sm text-red-600 mt-1">{{ urlError }}</p>
          </div>

          <!-- URL Preview -->
          <div v-if="imageData.url && !urlError" class="space-y-2">
            <img 
              :src="imageData.url" 
              :alt="imageData.alt || 'Preview'"
              class="max-w-full h-32 object-contain rounded-lg border border-gray-200"
              @load="onUrlImageLoad"
              @error="onUrlImageError"
            />
          </div>
        </div>

        <!-- Common Fields -->
        <div class="space-y-4">
          <div>
            <label for="imageAlt" class="block text-sm font-medium text-gray-700 mb-1">
              Alt Text
            </label>
            <input
              id="imageAlt"
              v-model="imageData.alt"
              type="text"
              placeholder="Describe the image for accessibility"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p class="text-xs text-gray-500 mt-1">
              Alt text helps screen readers and improves SEO
            </p>
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
          @click="insertImage"
          :disabled="!canInsert || isUploading"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-colors"
        >
          <span v-if="isUploading">Uploading...</span>
          <span v-else>Insert Image</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Upload, AlertCircle } from 'lucide-vue-next'

interface Emits {
  (e: 'close'): void
  (e: 'insert', data: { url?: string; file?: File; alt: string }): void
}

const emit = defineEmits<Emits>()

// Reactive state
const activeTab = ref<'upload' | 'url'>('upload')
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const isDragOver = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)
const uploadError = ref<string | null>(null)
const urlError = ref<string | null>(null)

const imageData = ref({
  url: '',
  alt: ''
})

// Refs
const fileInput = ref<HTMLInputElement>()

// Computed
const canInsert = computed(() => {
  if (activeTab.value === 'upload') {
    return selectedFile.value && !isUploading.value && !uploadError.value
  } else {
    return imageData.value.url && !urlError.value
  }
})

// Methods
function closeModal() {
  cleanupPreview()
  emit('close')
}

function triggerFileInput() {
  if (!isUploading.value) {
    fileInput.value?.click()
  }
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    validateAndSetFile(file)
  }
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = false
  
  if (isUploading.value) return
  
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files[0]
    validateAndSetFile(file)
  }
}

function validateAndSetFile(file: File) {
  uploadError.value = null
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    uploadError.value = 'Please select an image file (JPEG, PNG, GIF, WebP)'
    return
  }
  
  // Validate file size (5MB limit)
  const maxSize = 5 * 1024 * 1024 // 5MB in bytes
  if (file.size > maxSize) {
    uploadError.value = 'File size must be less than 5MB'
    return
  }
  
  selectedFile.value = file
  createPreview(file)
  
  // Auto-populate alt text with filename (without extension)
  if (!imageData.value.alt) {
    imageData.value.alt = file.name.split('.').slice(0, -1).join('.')
  }
}

function createPreview(file: File) {
  cleanupPreview()
  
  const reader = new FileReader()
  reader.onload = (e) => {
    previewUrl.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

function removeSelectedFile() {
  selectedFile.value = null
  cleanupPreview()
  uploadError.value = null
  
  // Clear file input
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function cleanupPreview() {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
}

function validateUrl() {
  urlError.value = null
  
  if (!imageData.value.url) return
  
  try {
    new URL(imageData.value.url)
    
    // Check if it looks like an image URL
    const url = imageData.value.url.toLowerCase()
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp']
    const hasImageExtension = imageExtensions.some(ext => url.includes(ext))
    
    if (!hasImageExtension && !url.includes('imgur') && !url.includes('unsplash') && !url.includes('pexels')) {
      urlError.value = 'URL should point to an image file'
    }
  } catch {
    urlError.value = 'Please enter a valid URL'
  }
}

function onUrlImageLoad() {
  urlError.value = null
}

function onUrlImageError() {
  urlError.value = 'Failed to load image from this URL'
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

async function insertImage() {
  if (!canInsert.value) return
  
  if (activeTab.value === 'upload' && selectedFile.value) {
    // For file upload, pass the file to parent component
    emit('insert', {
      file: selectedFile.value,
      alt: imageData.value.alt || selectedFile.value.name
    })
  } else if (activeTab.value === 'url' && imageData.value.url) {
    // For URL, pass the URL directly
    emit('insert', {
      url: imageData.value.url,
      alt: imageData.value.alt || 'Image'
    })
  }
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
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
  cleanupPreview()
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
  max-width: 28rem;
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