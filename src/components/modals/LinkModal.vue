<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Insert Link</h3>
      
      <form @submit.prevent="insertLink">
        <div class="space-y-4">
          <div>
            <label for="linkUrl" class="block text-sm font-medium text-gray-700 mb-1">
              URL *
            </label>
            <input
              id="linkUrl"
              v-model="linkData.url"
              type="url"
              required
              placeholder="https://example.com"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label for="linkText" class="block text-sm font-medium text-gray-700 mb-1">
              Link Text (optional)
            </label>
            <input
              id="linkText"
              v-model="linkData.text"
              type="text"
              placeholder="Custom link text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div class="flex items-center space-x-4">
            <label class="flex items-center">
              <input
                v-model="openInNewTab"
                type="checkbox"
                class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span class="ml-2 text-sm text-gray-700">Open in new tab</span>
            </label>
          </div>
          
          <div v-if="openInNewTab">
            <label for="linkRel" class="block text-sm font-medium text-gray-700 mb-1">
              Rel attribute
            </label>
            <input
              id="linkRel"
              v-model="linkData.rel"
              type="text"
              placeholder="noopener noreferrer"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
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
            :disabled="!linkData.url"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
          >
            Insert Link
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { LinkData } from '@/types/editor'

interface Emits {
  (e: 'close'): void
  (e: 'insert', data: LinkData): void
}

const emit = defineEmits<Emits>()

const linkData = ref<LinkData>({
  url: '',
  text: '',
  target: '_self',
  rel: ''
})

const openInNewTab = ref(false)

// Watch for new tab changes
watch(openInNewTab, (newValue) => {
  linkData.value.target = newValue ? '_blank' : '_self'
  if (newValue && !linkData.value.rel) {
    linkData.value.rel = 'noopener noreferrer'
  } else if (!newValue) {
    linkData.value.rel = ''
  }
})

function closeModal() {
  emit('close')
}

function insertLink() {
  if (linkData.value.url) {
    emit('insert', { ...linkData.value })
  }
}

// Auto-focus on URL input when modal opens
import { onMounted } from 'vue'
onMounted(() => {
  const urlInput = document.getElementById('linkUrl') as HTMLInputElement
  if (urlInput) {
    urlInput.focus()
  }
})
</script>