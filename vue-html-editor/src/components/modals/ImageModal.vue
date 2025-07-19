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
            class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
          >
            <Upload class="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p class="text-sm text-gray-600 mb-2">
              Drag and drop an image here, or
              <button
                @click="triggerFileInput"
                class="text-blue-600 hover:text-blue-700 underline"
              >
                browse
              </button>
            </p>
            <p class="text-xs text-gray-500">
              Supports: JPEG, PNG, GIF, WebP (max 5MB)
            </p>
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              @change="handleFileSelect"
              class="hidden"
            />
          </div>
          
          <!-- File Preview -->
          <div v-if="selectedFile" class="text-sm text-gray-600">
            <p><strong>Selected:</strong> {{ selectedFile.name }}</p>
            <p><strong>Size:</strong> {{ formatFileSize(selectedFile.size) }}</p>
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
              placeholder="Describe the image"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="imageWidth" class="block text-sm font-medium text-gray-700 mb-1">
                Width (px)
              </label>
              <input
                id="imageWidth"
                v-model.number="imageData.width"
                type="number"
                min="1"
                placeholder="Auto"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label for="imageHeight" class="block text-sm font-medium text-gray-700 mb-1">
                Height (px)
              </label>
              <input
                id="imageHeight"
                v-model.number="imageData.height"
                type="number"
                min="1"
                placeholder="Auto"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
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
            @click="insertImage"
            :disabled="!canInsert"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
          >
            Insert Image
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Upload } from 'lucide-vue-next'
import type { ImageUploadData } from '@/types/editor'

interface Emits {
  (e: 'close'): void
  (e: 'insert', data: ImageUploadData): void
}

const emit = defineEmits<Emits>()

const activeTab = ref<'upload' | 'url'>('upload')
const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement>()

const imageData = ref<ImageUploadData>({
  file: undefined,
  url: '',
  alt: '',
  width: undefined,
  height: undefined
})

const canInsert = computed(() => {
  return activeTab.value === 'upload' ? selectedFile.value : imageData.value.url
})

function closeModal() {
  emit('close')
}

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file && isValidFile(file)) {
    selectedFile.value = file
    imageData.value.file = file
    
    // Auto-fill alt text with filename (without extension)
    if (!imageData.value.alt) {
      imageData.value.alt = file.name.replace(/\.[^/.]+$/, '')
    }
  }
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  const files = event.dataTransfer?.files
  const file = files?.[0]
  
  if (file && isValidFile(file)) {
    selectedFile.value = file
    imageData.value.file = file
    
    // Auto-fill alt text with filename (without extension)
    if (!imageData.value.alt) {
      imageData.value.alt = file.name.replace(/\.[^/.]+$/, '')
    }
  }
}

function isValidFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  const maxSize = 5 * 1024 * 1024 // 5MB
  
  if (!validTypes.includes(file.type)) {
    alert('Invalid file type. Please select a JPEG, PNG, GIF, or WebP image.')
    return false
  }
  
  if (file.size > maxSize) {
    alert('File too large. Please select an image under 5MB.')
    return false
  }
  
  return true
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function insertImage() {
  if (activeTab.value === 'upload' && selectedFile.value) {
    imageData.value.file = selectedFile.value
  }
  
  emit('insert', { ...imageData.value })
}
</script>