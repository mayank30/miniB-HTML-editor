<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Save Document</h3>
      
      <form @submit.prevent="saveDocument">
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
            />
          </div>
          
          <div>
            <label for="filename" class="block text-sm font-medium text-gray-700 mb-1">
              Filename *
            </label>
            <div class="flex">
              <input
                id="filename"
                v-model="saveData.filename"
                type="text"
                required
                placeholder="my-document"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span class="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-r-md">
                .html
              </span>
            </div>
            <p class="mt-1 text-xs text-gray-500">
              Only letters, numbers, hyphens, and underscores are allowed
            </p>
          </div>
          
          <div class="space-y-3">
            <h4 class="text-sm font-medium text-gray-700">Save Options</h4>
            
            <div class="space-y-2">
              <label class="flex items-center">
                <input
                  v-model="saveData.saveAsComplete"
                  type="radio"
                  :value="true"
                  name="saveType"
                  class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span class="ml-2 text-sm text-gray-700">
                  Complete HTML document
                  <span class="text-gray-500">(standalone file with embedded CSS)</span>
                </span>
              </label>
              
              <label class="flex items-center">
                <input
                  v-model="saveData.saveAsComplete"
                  type="radio"
                  :value="false"
                  name="saveType"
                  class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span class="ml-2 text-sm text-gray-700">
                  Content only
                  <span class="text-gray-500">(HTML content without document structure)</span>
                </span>
              </label>
            </div>
          </div>
          
          <div v-if="saveData.saveAsComplete" class="border border-gray-200 rounded-md p-3 bg-gray-50">
            <div class="flex items-start">
              <Info class="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
              <div class="text-xs text-gray-600">
                <p class="font-medium">Complete HTML document includes:</p>
                <ul class="mt-1 list-disc list-inside space-y-0.5">
                  <li>DOCTYPE declaration and HTML structure</li>
                  <li>Embedded CSS styling for beautiful output</li>
                  <li>Responsive design and typography</li>
                  <li>Ready to open in any web browser</li>
                </ul>
              </div>
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
            type="submit"
            :disabled="!isValid"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
          >
            Save Document
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Info } from 'lucide-vue-next'

interface SaveData {
  title: string
  filename: string
  saveAsComplete: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'save', data: { title: string; filename: string }): void
}

const emit = defineEmits<Emits>()

const saveData = ref<SaveData>({
  title: 'Untitled Document',
  filename: '',
  saveAsComplete: true
})

const isValid = computed(() => {
  return saveData.value.title.trim() && 
         saveData.value.filename.trim() && 
         isValidFilename(saveData.value.filename)
})

function isValidFilename(filename: string): boolean {
  // Only allow letters, numbers, hyphens, and underscores
  return /^[a-zA-Z0-9_-]+$/.test(filename)
}

function closeModal() {
  emit('close')
}

function saveDocument() {
  if (isValid.value) {
    emit('save', {
      title: saveData.value.title.trim(),
      filename: saveData.value.filename.trim()
    })
  }
}

// Auto-generate filename from title
watch(() => saveData.value.title, (newTitle) => {
  if (!saveData.value.filename || saveData.value.filename === generateFilename(saveData.value.title)) {
    saveData.value.filename = generateFilename(newTitle)
  }
})

function generateFilename(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    || 'untitled-document'
}

// Initialize with default values
import { onMounted } from 'vue'
onMounted(() => {
  saveData.value.filename = generateFilename(saveData.value.title)
})
</script>