<template>
  <div class="vue-html-editor bg-white rounded-lg shadow-lg overflow-hidden">
    <!-- Toolbar -->
    <div class="toolbar bg-gray-50 border-b border-gray-200 p-3">
      <div class="flex flex-wrap items-center gap-2">
        <!-- History -->
        <div class="flex items-center gap-1 border-r border-gray-300 pr-3">
          <button
            class="toolbar-button"
            :class="{ 'is-active': false }"
            :disabled="!editor?.can().undo()"
            @click="editor?.chain().focus().undo().run()"
            title="Undo (Ctrl+Z)"
          >
            <Undo class="w-4 h-4" />
          </button>
          <button
            class="toolbar-button"
            :class="{ 'is-active': false }"
            :disabled="!editor?.can().redo()"
            @click="editor?.chain().focus().redo().run()"
            title="Redo (Ctrl+Y)"
          >
            <Redo class="w-4 h-4" />
          </button>
        </div>

        <!-- Headings -->
        <div class="flex items-center gap-1 border-r border-gray-300 pr-3">
          <select
            v-model="selectedHeading"
            @change="toggleHeading"
            class="text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Paragraph</option>
            <option value="1">Heading 1</option>
            <option value="2">Heading 2</option>
            <option value="3">Heading 3</option>
            <option value="4">Heading 4</option>
            <option value="5">Heading 5</option>
            <option value="6">Heading 6</option>
          </select>
        </div>

        <!-- Text Formatting -->
        <div class="flex items-center gap-1 border-r border-gray-300 pr-3">
          <button
            class="toolbar-button"
            :class="{ 'is-active': editor?.isActive('bold') }"
            @click="editor?.chain().focus().toggleBold().run()"
            title="Bold (Ctrl+B)"
          >
            <Bold class="w-4 h-4" />
          </button>
          <button
            class="toolbar-button"
            :class="{ 'is-active': editor?.isActive('italic') }"
            @click="editor?.chain().focus().toggleItalic().run()"
            title="Italic (Ctrl+I)"
          >
            <Italic class="w-4 h-4" />
          </button>
          <button
            class="toolbar-button"
            :class="{ 'is-active': editor?.isActive('underline') }"
            @click="editor?.chain().focus().toggleUnderline().run()"
            title="Underline (Ctrl+U)"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 4v12a6 6 0 0 0 12 0V4"></path>
              <line x1="4" y1="20" x2="16" y2="20"></line>
            </svg>
          </button>
          <button
            class="toolbar-button"
            :class="{ 'is-active': editor?.isActive('strike') }"
            @click="editor?.chain().focus().toggleStrike().run()"
            title="Strikethrough"
          >
            <Strikethrough class="w-4 h-4" />
          </button>
        </div>

        <!-- Text Color -->
        <div class="flex items-center gap-1 border-r border-gray-300 pr-3">
          <button
            class="toolbar-button"
            @click="showColorPicker = !showColorPicker"
            title="Text Color"
          >
            <Palette class="w-4 h-4" />
          </button>
          <button
            class="toolbar-button"
            :class="{ 'is-active': editor?.isActive('highlight') }"
            @click="editor?.chain().focus().toggleHighlight().run()"
            title="Highlight"
          >
            <Highlighter class="w-4 h-4" />
          </button>
        </div>

        <!-- Alignment -->
        <div class="flex items-center gap-1 border-r border-gray-300 pr-3">
          <button
            class="toolbar-button"
            :class="{ 'is-active': editor?.isActive({ textAlign: 'left' }) }"
            @click="editor?.chain().focus().setTextAlign('left').run()"
            title="Align Left"
          >
            <AlignLeft class="w-4 h-4" />
          </button>
          <button
            class="toolbar-button"
            :class="{ 'is-active': editor?.isActive({ textAlign: 'center' }) }"
            @click="editor?.chain().focus().setTextAlign('center').run()"
            title="Align Center"
          >
            <AlignCenter class="w-4 h-4" />
          </button>
          <button
            class="toolbar-button"
            :class="{ 'is-active': editor?.isActive({ textAlign: 'right' }) }"
            @click="editor?.chain().focus().setTextAlign('right').run()"
            title="Align Right"
          >
            <AlignRight class="w-4 h-4" />
          </button>
          <button
            class="toolbar-button"
            :class="{ 'is-active': editor?.isActive({ textAlign: 'justify' }) }"
            @click="editor?.chain().focus().setTextAlign('justify').run()"
            title="Justify"
          >
            <AlignJustify class="w-4 h-4" />
          </button>
        </div>

        <!-- Lists -->
        <div class="flex items-center gap-1 border-r border-gray-300 pr-3">
          <button
            class="toolbar-button"
            :class="{ 'is-active': editor?.isActive('bulletList') }"
            @click="editor?.chain().focus().toggleBulletList().run()"
            title="Bullet List"
          >
            <List class="w-4 h-4" />
          </button>
          <button
            class="toolbar-button"
            :class="{ 'is-active': editor?.isActive('orderedList') }"
            @click="editor?.chain().focus().toggleOrderedList().run()"
            title="Numbered List"
          >
            <ListOrdered class="w-4 h-4" />
          </button>
          <button
            class="toolbar-button"
            :class="{ 'is-active': editor?.isActive('blockquote') }"
            @click="editor?.chain().focus().toggleBlockquote().run()"
            title="Blockquote"
          >
            <Quote class="w-4 h-4" />
          </button>
        </div>

        <!-- Insert Elements -->
        <div class="flex items-center gap-1 border-r border-gray-300 pr-3">
          <button
            class="toolbar-button"
            @click="openLinkModal"
            title="Insert Link"
          >
            <Link class="w-4 h-4" />
          </button>
          <button
            class="toolbar-button"
            @click="openImageModal"
            title="Insert Image"
          >
            <ImageIcon class="w-4 h-4" />
          </button>
          <button
            class="toolbar-button"
            @click="openTableModal"
            title="Insert Table"
          >
            <Table class="w-4 h-4" />
          </button>
          <button
            class="toolbar-button"
            @click="insertCodeBlock"
            title="Code Block"
          >
            <Code class="w-4 h-4" />
          </button>
          <button
            class="toolbar-button"
            @click="editor?.chain().focus().setHorizontalRule().run()"
            title="Horizontal Rule"
          >
            <Minus class="w-4 h-4" />
          </button>
        </div>

        <!-- File Operations -->
        <div class="flex items-center gap-1">
          <button
            class="toolbar-button"
            @click="handleSave"
            :disabled="!canSave"
            title="Save (Ctrl+S)"
          >
            <Save class="w-4 h-4" />
          </button>
          <button
            class="toolbar-button"
            @click="openFileModal"
            title="Open File"
          >
            <FolderOpen class="w-4 h-4" />
          </button>
          <button
            class="toolbar-button"
            @click="handleExport"
            title="Export HTML"
          >
            <Download class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Color Picker -->
      <div
        v-if="showColorPicker"
        class="absolute mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
      >
        <div class="color-picker-grid">
          <button
            v-for="color in colors"
            :key="color"
            :style="{ backgroundColor: color }"
            class="color-picker-item"
            @click="setTextColor(color)"
          ></button>
        </div>
        <button
          @click="editor?.chain().focus().unsetColor().run(); showColorPicker = false"
          class="mt-2 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
        >
          Remove Color
        </button>
      </div>
    </div>

    <!-- Editor Content -->
    <div class="relative">
      <editor-content
        :editor="editor"
        class="prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto min-h-[400px] max-w-none p-6 focus:outline-none"
      />
    </div>

    <!-- Modals -->
    <LinkModal
      v-if="showLinkModal"
      @close="showLinkModal = false"
      @insert="insertLink"
    />
    
    <ImageModal
      v-if="showImageModal"
      @close="showImageModal = false"
      @insert="insertImage"
    />
    
    <TableModal
      v-if="showTableModal"
      @close="showTableModal = false"
      @insert="insertTable"
    />
    
    <SaveModal
      v-if="showSaveModal"
      @close="showSaveModal = false"
      @save="saveDocument"
    />
    
    <FileModal
      v-if="showFileModal"
      @close="showFileModal = false"
      @load="loadDocument"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'

// Import icons from lucide-vue-next
import {
  Undo, Redo, Bold, Italic, Strikethrough,
  Palette, Highlighter, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote, Link as LinkIcon, Image as ImageIcon,
  Table as TableIcon, Code, Minus, Save, FolderOpen, Download
} from 'lucide-vue-next'

// Import modals and composables
import LinkModal from './modals/LinkModal.vue'
import ImageModal from './modals/ImageModal.vue'
import TableModal from './modals/TableModal.vue'
import SaveModal from './modals/SaveModal.vue'
import FileModal from './modals/FileModal.vue'
import { useEditorStore } from '@/stores/editor'
import type { LinkData, ImageUploadData, TableData, EditorDocument } from '@/types/editor'

// Props and Emits
interface Props {
  modelValue?: string
  placeholder?: string
  editable?: boolean
  autosave?: boolean
  autosaveInterval?: number
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'save', data: { content: string; title: string }): void
  (e: 'load', id: string): void
  (e: 'export', data: { content: string; title: string }): void
  (e: 'image-upload', file: File): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Start writing your content here...',
  editable: true,
  autosave: false,
  autosaveInterval: 30000
})

const emit = defineEmits<Emits>()

// Store
const editorStore = useEditorStore()

// Reactive state
const selectedHeading = ref('')
const showColorPicker = ref(false)
const showLinkModal = ref(false)
const showImageModal = ref(false)
const showTableModal = ref(false)
const showSaveModal = ref(false)
const showFileModal = ref(false)

// Colors for color picker
const colors = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef',
  '#f3f3f3', '#ffffff', '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff',
  '#4a86e8', '#0000ff', '#9900ff', '#ff00ff', '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc',
  '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc'
]

// Create lowlight instance for code highlighting
const lowlight = createLowlight(common)

// Computed
const canSave = computed(() => editorStore.canSave)

// TipTap Editor setup
const editor = useEditor({
  content: props.modelValue,
  editable: props.editable,
  extensions: [
    StarterKit.configure({
      codeBlock: false
    }),
    Underline,
    TextAlign.configure({
      types: ['heading', 'paragraph']
    }),
    TextStyle,
    Color,
    Highlight.configure({
      multicolor: true
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-blue-600 underline hover:text-blue-800'
      }
    }),
    Image.configure({
      HTMLAttributes: {
        class: 'max-w-full h-auto rounded-lg shadow-md'
      }
    }),
    Table.configure({
      resizable: true
    }),
    TableRow,
    TableHeader,
    TableCell,
    CodeBlockLowlight.configure({
      lowlight,
      HTMLAttributes: {
        class: 'rounded-lg bg-gray-800 text-white p-4 font-mono text-sm'
      }
    })
  ],
  editorProps: {
    attributes: {
      class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto focus:outline-none',
      'data-placeholder': props.placeholder
    }
  },
  onUpdate: ({ editor }) => {
    const html = editor.getHTML()
    emit('update:modelValue', html)
    editorStore.updateContent(html)
  }
})

// Methods
function toggleHeading() {
  if (!editor.value) return
  
  if (selectedHeading.value === '') {
    editor.value.chain().focus().setParagraph().run()
  } else {
    const level = parseInt(selectedHeading.value) as 1 | 2 | 3 | 4 | 5 | 6
    editor.value.chain().focus().toggleHeading({ level }).run()
  }
}

function setTextColor(color: string) {
  editor.value?.chain().focus().setColor(color).run()
  showColorPicker.value = false
}

function openLinkModal() {
  showLinkModal.value = true
}

function insertLink(data: LinkData) {
  if (!editor.value) return
  
  if (data.url) {
    editor.value.chain().focus().extendMarkRange('link').setLink({
      href: data.url,
      target: data.target,
      rel: data.rel
    }).run()
  }
  showLinkModal.value = false
}

function openImageModal() {
  showImageModal.value = true
}

function insertImage(data: ImageUploadData) {
  if (!editor.value) return
  
  if (data.url) {
    editor.value.chain().focus().setImage({
      src: data.url,
      alt: data.alt,
      title: data.alt
    }).run()
  }
  
  if (data.file) {
    emit('image-upload', data.file)
  }
  
  showImageModal.value = false
}

function openTableModal() {
  showTableModal.value = true
}

function insertTable(data: TableData) {
  if (!editor.value) return
  
  editor.value.chain().focus().insertTable({
    rows: data.rows,
    cols: data.cols,
    withHeaderRow: data.withHeaderRow
  }).run()
  
  showTableModal.value = false
}

function insertCodeBlock() {
  editor.value?.chain().focus().toggleCodeBlock().run()
}

function handleSave() {
  if (!editor.value) return
  
  const content = editor.value.getHTML()
  const title = editorStore.currentDocument?.title || 'Untitled Document'
  
  emit('save', { content, title })
  showSaveModal.value = true
}

function saveDocument(data: { title: string; filename: string }) {
  if (!editor.value) return
  
  const content = editor.value.getHTML()
  
  // Update current document
  if (editorStore.currentDocument) {
    editorStore.currentDocument.title = data.title
    editorStore.currentDocument.content = content
    editorStore.setUnsavedChanges(false)
  } else {
    const doc = editorStore.createNewDocument(data.title)
    doc.content = content
  }
  
  editorStore.emitEvent('save', { title: data.title, filename: data.filename, content })
  showSaveModal.value = false
}

function openFileModal() {
  showFileModal.value = true
}

function loadDocument(doc: EditorDocument) {
  if (!editor.value) return
  
  editor.value.commands.setContent(doc.content)
  editorStore.setCurrentDocument(doc)
  editorStore.addToRecent(doc)
  editorStore.emitEvent('load', { documentId: doc.id })
  
  emit('load', doc.id)
  showFileModal.value = false
}

function handleExport() {
  if (!editor.value) return
  
  const content = editor.value.getHTML()
  const title = editorStore.currentDocument?.title || 'Untitled Document'
  
  emit('export', { content, title })
  editorStore.emitEvent('export', { title, content })
}

// Keyboard shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 's':
          e.preventDefault()
          if (canSave.value) {
            handleSave()
          }
          break
        case 'o':
          e.preventDefault()
          openFileModal()
          break
      }
    }
  })
}

// Auto-save functionality
let autosaveInterval: NodeJS.Timeout | null = null

function startAutosave() {
  if (props.autosave && props.autosaveInterval > 0) {
    autosaveInterval = setInterval(() => {
      if (canSave.value) {
        handleSave()
      }
    }, props.autosaveInterval)
  }
}

function stopAutosave() {
  if (autosaveInterval) {
    clearInterval(autosaveInterval)
    autosaveInterval = null
  }
}

// Watch for external content changes
watch(() => props.modelValue, (newValue) => {
  if (editor.value && editor.value.getHTML() !== newValue) {
    editor.value.commands.setContent(newValue, false)
  }
})

// Update selected heading based on current position
watch(() => editor.value?.isActive('heading'), () => {
  if (!editor.value) return
  
  for (let level = 1; level <= 6; level++) {
    if (editor.value.isActive('heading', { level })) {
      selectedHeading.value = level.toString()
      return
    }
  }
  selectedHeading.value = ''
}, { immediate: true })

// Lifecycle hooks
onMounted(() => {
  setupKeyboardShortcuts()
  startAutosave()
  
  // Initialize with empty document if none exists
  if (!editorStore.currentDocument) {
    editorStore.createNewDocument()
  }
})

onBeforeUnmount(() => {
  stopAutosave()
  editor.value?.destroy()
})
</script>

<style scoped>
.vue-html-editor {
  position: relative;
}

.toolbar {
  position: relative;
}

.color-picker-grid {
  position: relative;
  z-index: 20;
}
</style>