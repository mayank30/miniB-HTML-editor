<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Insert Table</h3>
      
      <form @submit.prevent="insertTable">
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="tableRows" class="block text-sm font-medium text-gray-700 mb-1">
                Rows *
              </label>
              <input
                id="tableRows"
                v-model.number="tableData.rows"
                type="number"
                min="1"
                max="20"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label for="tableCols" class="block text-sm font-medium text-gray-700 mb-1">
                Columns *
              </label>
              <input
                id="tableCols"
                v-model.number="tableData.cols"
                type="number"
                min="1"
                max="10"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div class="flex items-center">
            <label class="flex items-center">
              <input
                v-model="tableData.withHeaderRow"
                type="checkbox"
                class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span class="ml-2 text-sm text-gray-700">Include header row</span>
            </label>
          </div>
          
          <!-- Table Preview -->
          <div class="border border-gray-200 rounded-md p-4 bg-gray-50">
            <h4 class="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
            <div class="overflow-x-auto">
              <table class="min-w-full border border-gray-300">
                <thead v-if="tableData.withHeaderRow">
                  <tr>
                    <th
                      v-for="col in tableData.cols"
                      :key="`header-${col}`"
                      class="border border-gray-300 px-2 py-1 bg-gray-100 text-xs font-medium text-gray-700"
                    >
                      Header {{ col }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in (tableData.withHeaderRow ? tableData.rows - 1 : tableData.rows)"
                    :key="`row-${row}`"
                  >
                    <td
                      v-for="col in tableData.cols"
                      :key="`cell-${row}-${col}`"
                      class="border border-gray-300 px-2 py-1 text-xs text-gray-600"
                    >
                      Cell {{ row }},{{ col }}
                    </td>
                  </tr>
                </tbody>
              </table>
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
            Insert Table
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { TableData } from '@/types/editor'

interface Emits {
  (e: 'close'): void
  (e: 'insert', data: TableData): void
}

const emit = defineEmits<Emits>()

const tableData = ref<TableData>({
  rows: 3,
  cols: 3,
  withHeaderRow: true
})

const isValid = computed(() => {
  return tableData.value.rows >= 1 && 
         tableData.value.cols >= 1 && 
         tableData.value.rows <= 20 && 
         tableData.value.cols <= 10
})

function closeModal() {
  emit('close')
}

function insertTable() {
  if (isValid.value) {
    emit('insert', { ...tableData.value })
  }
}
</script>