import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { EditorDocument, EditorState, EditorEvent } from '@/types/editor'

export const useEditorStore = defineStore('editor', () => {
  // State
  const isLoading = ref(false)
  const hasUnsavedChanges = ref(false)
  const currentDocument = ref<EditorDocument | null>(null)
  const recentDocuments = ref<EditorDocument[]>([])
  const events = ref<EditorEvent[]>([])

  // Getters
  const state = computed<EditorState>(() => ({
    isLoading: isLoading.value,
    hasUnsavedChanges: hasUnsavedChanges.value,
    currentDocument: currentDocument.value,
    recentDocuments: recentDocuments.value
  }))

  const canSave = computed(() => 
    currentDocument.value && hasUnsavedChanges.value && !isLoading.value
  )

  const canUndo = computed(() => events.value.length > 0)

  // Actions
  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  function setUnsavedChanges(changes: boolean) {
    hasUnsavedChanges.value = changes
  }

  function setCurrentDocument(doc: EditorDocument | null) {
    currentDocument.value = doc
    hasUnsavedChanges.value = false
  }

  function updateContent(content: string) {
    if (currentDocument.value) {
      currentDocument.value.content = content
      currentDocument.value.updatedAt = new Date()
      hasUnsavedChanges.value = true
      
      // Emit content change event
      emitEvent('content-change', { content })
    }
  }

  function createNewDocument(title: string = 'Untitled Document'): EditorDocument {
    const doc: EditorDocument = {
      id: generateId(),
      title,
      content: '',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    setCurrentDocument(doc)
    return doc
  }

  function addToRecent(doc: EditorDocument) {
    const index = recentDocuments.value.findIndex(d => d.id === doc.id)
    if (index > -1) {
      recentDocuments.value.splice(index, 1)
    }
    recentDocuments.value.unshift(doc)
    
    // Keep only last 10 documents
    if (recentDocuments.value.length > 10) {
      recentDocuments.value = recentDocuments.value.slice(0, 10)
    }
  }

  function emitEvent(type: EditorEvent['type'], data: any) {
    const event: EditorEvent = {
      type,
      data,
      timestamp: new Date()
    }
    
    events.value.push(event)
    
    // Keep only last 100 events
    if (events.value.length > 100) {
      events.value = events.value.slice(-100)
    }
  }

  function clearEvents() {
    events.value = []
  }

  function generateId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  return {
    // State
    isLoading,
    hasUnsavedChanges,
    currentDocument,
    recentDocuments,
    events,
    
    // Getters
    state,
    canSave,
    canUndo,
    
    // Actions
    setLoading,
    setUnsavedChanges,
    setCurrentDocument,
    updateContent,
    createNewDocument,
    addToRecent,
    emitEvent,
    clearEvents
  }
})