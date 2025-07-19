<template>
  <div class="vue-html-editor bg-white rounded-lg shadow-lg overflow-hidden">
    <!-- Slash Command Menu -->
    <div
      v-if="showSlashMenu"
      class="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[200px]"
      :style="{ top: slashMenuPosition.top + 'px', left: slashMenuPosition.left + 'px' }"
    >
      <div
        v-for="(command, index) in filteredSlashCommands"
        :key="command.title"
        @click="executeSlashCommand(command)"
        :class="[
          'px-3 py-2 flex items-center cursor-pointer hover:bg-gray-100',
          { 'bg-blue-50': index === selectedSlashCommand }
        ]"
      >
        <component :is="command.icon" class="w-4 h-4 mr-2 text-gray-500" />
        <div>
          <div class="text-sm font-medium">{{ command.title }}</div>
          <div class="text-xs text-gray-500">{{ command.description }}</div>
        </div>
      </div>
    </div>

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
        </div>

        <!-- Elements -->
        <div class="flex items-center gap-1 border-r border-gray-300 pr-3">
          <button
            class="toolbar-button"
            :class="{ 'is-active': editor?.isActive('blockquote') }"
            @click="editor?.chain().focus().toggleBlockquote().run()"
            title="Blockquote"
          >
            <Quote class="w-4 h-4" />
          </button>
          <button
            class="toolbar-button"
            @click="openLinkModal"
            title="Insert Link"
          >
            <LinkIcon class="w-4 h-4" />
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
            <TableIcon class="w-4 h-4" />
          </button>
          <button
            class="toolbar-button"
            :class="{ 'is-active': editor?.isActive('codeBlock') }"
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
      <!-- Placeholder for empty state -->
      <div 
        v-if="isEmpty" 
        class="absolute top-6 left-6 text-gray-400 pointer-events-none flex items-center"
      >
        <span class="text-lg mr-2">✨</span>
        <span>{{ props.placeholder }}</span>
        <span class="ml-2 text-sm bg-gray-100 px-2 py-1 rounded">Type / for commands</span>
      </div>
      
      <editor-content
        :editor="editor"
        class="notion-editor prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto min-h-[400px] max-w-none p-6 focus:outline-none"
        @drop="handleEditorDrop"
        @dragover.prevent
      />
    </div>

    <!-- Loading overlay -->
    <div v-if="isLoading" class="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
      <div class="flex items-center space-x-2">
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span class="text-sm text-gray-600">{{ loadingMessage }}</span>
      </div>
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
      :currentDocument="editorStore.currentDocument"
    />
    
    <FileModal
      v-if="showFileModal"
      @close="showFileModal = false"
      @load="loadDocument"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch, nextTick } from 'vue'
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
  TableIcon, Code, Minus, Save, FolderOpen, Download,
  Type, Heading1, Heading2, Heading3, FileText, Hash
} from 'lucide-vue-next'

// Import modals and composables
import LinkModal from './modals/LinkModal.vue'
import ImageModal from './modals/ImageModal.vue'
import TableModal from './modals/TableModal.vue'
import SaveModal from './modals/SaveModal.vue'
import FileModal from './modals/FileModal.vue'
import { useEditorStore } from '@/stores/editor'
import type { LinkData, ImageUploadData, TableData, EditorDocument } from '@/types/editor'

// API Base URL
const API_BASE_URL = 'http://localhost:3001/api'

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
const isLoading = ref(false)
const loadingMessage = ref('')

// Slash command state
const showSlashMenu = ref(false)
const slashMenuPosition = ref({ top: 0, left: 0 })
const selectedSlashCommand = ref(0)
const slashQuery = ref('')

// Slash commands configuration
const slashCommands = [
  {
    title: 'Heading 1',
    description: 'Large section heading',
    icon: Heading1,
    command: () => editor.value?.chain().focus().toggleHeading({ level: 1 }).run()
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: Heading2,
    command: () => editor.value?.chain().focus().toggleHeading({ level: 2 }).run()
  },
  {
    title: 'Heading 3',
    description: 'Small section heading',
    icon: Heading3,
    command: () => editor.value?.chain().focus().toggleHeading({ level: 3 }).run()
  },
  {
    title: 'Paragraph',
    description: 'Plain text paragraph',
    icon: Type,
    command: () => editor.value?.chain().focus().setParagraph().run()
  },
  {
    title: 'Bullet List',
    description: 'Unordered list with bullets',
    icon: List,
    command: () => editor.value?.chain().focus().toggleBulletList().run()
  },
  {
    title: 'Numbered List',
    description: 'Ordered list with numbers',
    icon: ListOrdered,
    command: () => editor.value?.chain().focus().toggleOrderedList().run()
  },
  {
    title: 'Quote',
    description: 'Capture a quote',
    icon: Quote,
    command: () => editor.value?.chain().focus().toggleBlockquote().run()
  },
  {
    title: 'Code Block',
    description: 'Code snippet with syntax highlighting',
    icon: Code,
    command: () => editor.value?.chain().focus().toggleCodeBlock().run()
  },
  {
    title: 'Table',
    description: 'Insert a table',
    icon: TableIcon,
    command: () => openTableModal()
  },
  {
    title: 'Image',
    description: 'Upload or embed an image',
    icon: ImageIcon,
    command: () => openImageModal()
  },
  {
    title: 'Divider',
    description: 'Horizontal rule',
    icon: Minus,
    command: () => editor.value?.chain().focus().setHorizontalRule().run()
  }
]

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
const isEmpty = computed(() => !editor.value?.getHTML() || editor.value?.getHTML() === '<p></p>')
const filteredSlashCommands = computed(() => {
  if (!slashQuery.value) return slashCommands
  return slashCommands.filter(cmd => 
    cmd.title.toLowerCase().includes(slashQuery.value.toLowerCase()) ||
    cmd.description.toLowerCase().includes(slashQuery.value.toLowerCase())
  )
})

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
        class: 'notion-code-block'
      }
    })
  ],
  editorProps: {
    attributes: {
      class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto focus:outline-none',
      'data-placeholder': props.placeholder
    },
    handleKeyDown: (view, event) => {
      // Handle slash command
      if (event.key === '/') {
        setTimeout(() => {
          checkForSlashCommand()
        }, 100)
      }
      
      // Handle slash menu navigation
      if (showSlashMenu.value) {
        if (event.key === 'ArrowDown') {
          event.preventDefault()
          selectedSlashCommand.value = Math.min(selectedSlashCommand.value + 1, filteredSlashCommands.value.length - 1)
          return true
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault()
          selectedSlashCommand.value = Math.max(selectedSlashCommand.value - 1, 0)
          return true
        }
        if (event.key === 'Enter') {
          event.preventDefault()
          executeSlashCommand(filteredSlashCommands.value[selectedSlashCommand.value])
          return true
        }
        if (event.key === 'Escape') {
          event.preventDefault()
          hideSlashMenu()
          return true
        }
      }
      
      return false
    }
  },
  onUpdate: ({ editor }) => {
    const html = editor.getHTML()
    emit('update:modelValue', html)
    editorStore.updateContent(html)
    
    // Check for slash command as user types
    if (showSlashMenu.value) {
      checkForSlashCommand()
    }
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

// Slash command functionality
function checkForSlashCommand() {
  if (!editor.value) return
  
  const { state } = editor.value
  const { selection } = state
  const { $from } = selection
  
  const textBefore = $from.nodeBefore?.textContent || ''
  const beforeCursor = state.doc.textBetween(Math.max(0, $from.pos - 20), $from.pos)
  
  const slashMatch = beforeCursor.match(/\/(\w*)$/)
  
  if (slashMatch) {
    slashQuery.value = slashMatch[1]
    selectedSlashCommand.value = 0
    showSlashMenu.value = true
    
    // Position the menu
    nextTick(() => {
      const coords = editor.value?.view.coordsAtPos($from.pos)
      if (coords) {
        slashMenuPosition.value = {
          top: coords.bottom + 5,
          left: coords.left
        }
      }
    })
  } else {
    hideSlashMenu()
  }
}

function hideSlashMenu() {
  showSlashMenu.value = false
  slashQuery.value = ''
  selectedSlashCommand.value = 0
}

function executeSlashCommand(command: any) {
  if (!editor.value) return
  
  // Remove the slash and query text
  const { state } = editor.value
  const { selection } = state
  const { $from } = selection
  
  const beforeCursor = state.doc.textBetween(Math.max(0, $from.pos - 20), $from.pos)
  const slashMatch = beforeCursor.match(/\/(\w*)$/)
  
  if (slashMatch) {
    const matchLength = slashMatch[0].length
    editor.value.chain().focus()
      .deleteRange({ from: $from.pos - matchLength, to: $from.pos })
      .run()
  }
  
  hideSlashMenu()
  
  // Execute the command
  setTimeout(() => {
    command.command()
  }, 50)
}

// File upload functionality
async function uploadImageToServer(file: File): Promise<string> {
  isLoading.value = true
  loadingMessage.value = 'Uploading image...'
  
  try {
    const formData = new FormData()
    formData.append('image', file)
    
    const response = await fetch(`${API_BASE_URL}/upload/image`, {
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
    
    return data.url
  } catch (error) {
    console.error('Image upload error:', error)
    throw error
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

// Enhanced drag and drop for editor
function handleEditorDrop(event: DragEvent) {
  event.preventDefault()
  
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files[0]
    
    if (file.type.startsWith('image/')) {
      uploadImageToServer(file)
        .then(url => {
          if (editor.value) {
            editor.value.chain().focus().setImage({ src: url, alt: file.name }).run()
          }
        })
        .catch(error => {
          console.error('Failed to upload image:', error)
        })
    }
  }
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

async function insertImage(data: ImageUploadData) {
  if (!editor.value) return
  
  let imageUrl = data.url
  
  // If file is provided, upload it first
  if (data.file) {
    try {
      imageUrl = await uploadImageToServer(data.file)
    } catch (error) {
      console.error('Failed to upload image:', error)
      return
    }
  }
  
  if (imageUrl) {
    editor.value.chain().focus().setImage({
      src: imageUrl,
      alt: data.alt,
      title: data.alt
    }).run()
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

async function handleSave() {
  if (!editor.value) return
  
  const content = editor.value.getHTML()
  const title = editorStore.currentDocument?.title || 'Untitled Document'
  
  emit('save', { content, title })
  showSaveModal.value = true
}

async function saveDocument(data: { title: string; filename: string }) {
  if (!editor.value) return
  
  isLoading.value = true
  loadingMessage.value = 'Saving document...'
  
  try {
    const content = editor.value.getHTML()
    
    let documentId = editorStore.currentDocument?.id
    
    if (documentId) {
      // Update existing document
      const response = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: data.title,
          content: content
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to save document')
      }
    } else {
      // Create new document
      const response = await fetch(`${API_BASE_URL}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: data.title,
          content: content
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to create document')
      }
      
      const result = await response.json()
      documentId = result.document.id
    }
    
    // Update local state
    if (editorStore.currentDocument) {
      editorStore.currentDocument.title = data.title
      editorStore.currentDocument.content = content
      editorStore.setUnsavedChanges(false)
    } else {
      const doc = editorStore.createNewDocument(data.title)
      doc.content = content
      doc.id = documentId
    }
    
    editorStore.emitEvent('save', { title: data.title, filename: data.filename, content })
    
  } catch (error) {
    console.error('Save error:', error)
    throw error
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
    showSaveModal.value = false
  }
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
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
}

.color-picker-item {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: transform 0.1s;
}

.color-picker-item:hover {
  transform: scale(1.1);
}

.toolbar-button {
  @apply p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors;
}

.toolbar-button.is-active {
  @apply bg-blue-100 text-blue-700;
}

.toolbar-button:disabled {
  @apply text-gray-400 cursor-not-allowed;
}

/* Notion-like editor styles */
.notion-editor {
  line-height: 1.6;
}

.notion-editor :deep(.ProseMirror) {
  outline: none;
  padding: 0;
}

.notion-editor :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: #adb5bd;
  pointer-events: none;
  height: 0;
}

.notion-editor :deep(.ProseMirror h1) {
  @apply text-3xl font-bold text-gray-900 mt-8 mb-4;
}

.notion-editor :deep(.ProseMirror h2) {
  @apply text-2xl font-bold text-gray-900 mt-6 mb-3;
}

.notion-editor :deep(.ProseMirror h3) {
  @apply text-xl font-bold text-gray-900 mt-5 mb-2;
}

.notion-editor :deep(.ProseMirror h4) {
  @apply text-lg font-semibold text-gray-900 mt-4 mb-2;
}

.notion-editor :deep(.ProseMirror h5) {
  @apply text-base font-semibold text-gray-900 mt-3 mb-1;
}

.notion-editor :deep(.ProseMirror h6) {
  @apply text-sm font-semibold text-gray-900 mt-2 mb-1;
}

.notion-editor :deep(.ProseMirror p) {
  @apply text-gray-700 mb-3;
}

.notion-editor :deep(.ProseMirror blockquote) {
  @apply border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 text-gray-700 italic;
}

.notion-editor :deep(.ProseMirror ul, .ProseMirror ol) {
  @apply pl-6 mb-4;
}

.notion-editor :deep(.ProseMirror li) {
  @apply mb-1;
}

.notion-editor :deep(.ProseMirror .notion-code-block) {
  @apply bg-gray-900 text-gray-100 p-4 rounded-lg mb-4 overflow-x-auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.4;
}

.notion-editor :deep(.ProseMirror .notion-code-block pre) {
  @apply bg-transparent p-0 m-0;
}

.notion-editor :deep(.ProseMirror table) {
  @apply w-full border-collapse mb-4;
}

.notion-editor :deep(.ProseMirror th, .ProseMirror td) {
  @apply border border-gray-300 px-3 py-2 text-left;
}

.notion-editor :deep(.ProseMirror th) {
  @apply bg-gray-50 font-semibold;
}

.notion-editor :deep(.ProseMirror hr) {
  @apply border-0 border-t border-gray-300 my-6;
}

.notion-editor :deep(.ProseMirror a) {
  @apply text-blue-600 underline hover:text-blue-800;
}

.notion-editor :deep(.ProseMirror img) {
  @apply max-w-full h-auto rounded-lg shadow-sm my-4;
}

/* Focus states for better accessibility */
.notion-editor :deep(.ProseMirror:focus-within) {
  @apply outline-none;
}

/* Code syntax highlighting improvements */
.notion-editor :deep(.hljs-keyword) {
  @apply text-purple-400;
}

.notion-editor :deep(.hljs-string) {
  @apply text-green-400;
}

.notion-editor :deep(.hljs-number) {
  @apply text-blue-400;
}

.notion-editor :deep(.hljs-comment) {
  @apply text-gray-500;
}

.notion-editor :deep(.hljs-function) {
  @apply text-yellow-400;
}

.notion-editor :deep(.hljs-variable) {
  @apply text-red-400;
}
</style>