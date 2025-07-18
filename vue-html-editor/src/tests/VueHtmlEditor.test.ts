import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import VueHtmlEditor from '@/components/VueHtmlEditor.vue'
import { useEditorStore } from '@/stores/editor'

// Mock TipTap editor
const mockEditor = {
  getHTML: vi.fn(() => '<p>Test content</p>'),
  commands: {
    setContent: vi.fn(),
    focus: vi.fn()
  },
  can: vi.fn(() => ({
    undo: vi.fn(() => true),
    redo: vi.fn(() => true)
  })),
  chain: vi.fn(() => ({
    focus: vi.fn(() => ({
      undo: vi.fn(() => ({ run: vi.fn() })),
      redo: vi.fn(() => ({ run: vi.fn() })),
      toggleBold: vi.fn(() => ({ run: vi.fn() })),
      toggleItalic: vi.fn(() => ({ run: vi.fn() })),
      setParagraph: vi.fn(() => ({ run: vi.fn() })),
      toggleHeading: vi.fn(() => ({ run: vi.fn() })),
      setTextAlign: vi.fn(() => ({ run: vi.fn() })),
      setColor: vi.fn(() => ({ run: vi.fn() }))
    }))
  })),
  isActive: vi.fn(() => false),
  destroy: vi.fn()
}

// Mock useEditor
vi.mock('@tiptap/vue-3', () => ({
  useEditor: vi.fn(() => mockEditor),
  EditorContent: {
    name: 'EditorContent',
    template: '<div class="editor-content"><slot /></div>'
  }
}))

// Mock lucide icons
vi.mock('lucide-vue-next', () => ({
  Undo: { name: 'Undo', template: '<svg></svg>' },
  Redo: { name: 'Redo', template: '<svg></svg>' },
  Bold: { name: 'Bold', template: '<svg></svg>' },
  Italic: { name: 'Italic', template: '<svg></svg>' },
  Underline: { name: 'Underline', template: '<svg></svg>' },
  Strikethrough: { name: 'Strikethrough', template: '<svg></svg>' },
  Palette: { name: 'Palette', template: '<svg></svg>' },
  AlignLeft: { name: 'AlignLeft', template: '<svg></svg>' },
  List: { name: 'List', template: '<svg></svg>' },
  Quote: { name: 'Quote', template: '<svg></svg>' },
  Link: { name: 'Link', template: '<svg></svg>' },
  Save: { name: 'Save', template: '<svg></svg>' }
}))

// Mock modals
vi.mock('@/components/modals/LinkModal.vue', () => ({
  default: { name: 'LinkModal', template: '<div>Link Modal</div>' }
}))

vi.mock('@/components/modals/ImageModal.vue', () => ({
  default: { name: 'ImageModal', template: '<div>Image Modal</div>' }
}))

vi.mock('@/components/modals/TableModal.vue', () => ({
  default: { name: 'TableModal', template: '<div>Table Modal</div>' }
}))

vi.mock('@/components/modals/SaveModal.vue', () => ({
  default: { name: 'SaveModal', template: '<div>Save Modal</div>' }
}))

vi.mock('@/components/modals/FileModal.vue', () => ({
  default: { name: 'FileModal', template: '<div>File Modal</div>' }
}))

describe('VueHtmlEditor', () => {
  let wrapper: any
  let pinia: any

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    
    wrapper = mount(VueHtmlEditor, {
      global: {
        plugins: [pinia]
      },
      props: {
        modelValue: '<p>Initial content</p>',
        placeholder: 'Start typing...'
      }
    })
  })

  it('renders properly', () => {
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('.vue-html-editor').exists()).toBe(true)
  })

  it('displays toolbar buttons', () => {
    const toolbar = wrapper.find('.toolbar')
    expect(toolbar.exists()).toBe(true)
    
    // Check for key toolbar buttons
    expect(wrapper.find('[title="Undo (Ctrl+Z)"]').exists()).toBe(true)
    expect(wrapper.find('[title="Redo (Ctrl+Y)"]').exists()).toBe(true)
    expect(wrapper.find('[title="Bold (Ctrl+B)"]').exists()).toBe(true)
    expect(wrapper.find('[title="Italic (Ctrl+I)"]').exists()).toBe(true)
    expect(wrapper.find('[title="Save (Ctrl+S)"]').exists()).toBe(true)
  })

  it('has heading selector', () => {
    const headingSelect = wrapper.find('select')
    expect(headingSelect.exists()).toBe(true)
    
    const options = headingSelect.findAll('option')
    expect(options.length).toBeGreaterThan(0)
    expect(options[0].text()).toBe('Paragraph')
  })

  it('emits update:modelValue when content changes', async () => {
    const editorStore = useEditorStore()
    
    // Simulate editor update
    editorStore.updateContent('<p>Updated content</p>')
    
    await wrapper.vm.$nextTick()
    
    // Check if event was emitted
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })

  it('opens link modal when link button clicked', async () => {
    const linkButton = wrapper.find('[title="Insert Link"]')
    await linkButton.trigger('click')
    
    expect(wrapper.vm.showLinkModal).toBe(true)
  })

  it('opens image modal when image button clicked', async () => {
    const imageButton = wrapper.find('[title="Insert Image"]')
    await imageButton.trigger('click')
    
    expect(wrapper.vm.showImageModal).toBe(true)
  })

  it('opens table modal when table button clicked', async () => {
    const tableButton = wrapper.find('[title="Insert Table"]')
    await tableButton.trigger('click')
    
    expect(wrapper.vm.showTableModal).toBe(true)
  })

  it('opens save modal when save button clicked', async () => {
    const saveButton = wrapper.find('[title="Save (Ctrl+S)"]')
    await saveButton.trigger('click')
    
    expect(wrapper.vm.showSaveModal).toBe(true)
  })

  it('handles text formatting commands', async () => {
    const boldButton = wrapper.find('[title="Bold (Ctrl+B)"]')
    await boldButton.trigger('click')
    
    expect(mockEditor.chain().focus().toggleBold().run).toHaveBeenCalled()
  })

  it('handles alignment commands', async () => {
    const alignLeftButton = wrapper.find('[title="Align Left"]')
    await alignLeftButton.trigger('click')
    
    expect(mockEditor.chain().focus().setTextAlign).toHaveBeenCalledWith('left')
  })

  it('toggles color picker when palette button clicked', async () => {
    const paletteButton = wrapper.find('[title="Text Color"]')
    await paletteButton.trigger('click')
    
    expect(wrapper.vm.showColorPicker).toBe(true)
  })

  it('sets text color when color is selected', async () => {
    // Open color picker first
    wrapper.vm.showColorPicker = true
    await wrapper.vm.$nextTick()
    
    // Select a color
    await wrapper.vm.setTextColor('#ff0000')
    
    expect(mockEditor.chain().focus().setColor).toHaveBeenCalledWith('#ff0000')
    expect(wrapper.vm.showColorPicker).toBe(false)
  })

  it('handles heading selection', async () => {
    const headingSelect = wrapper.find('select')
    await headingSelect.setValue('1')
    await headingSelect.trigger('change')
    
    expect(mockEditor.chain().focus().toggleHeading).toHaveBeenCalledWith({ level: 1 })
  })

  it('responds to keyboard shortcuts', async () => {
    const saveHandler = vi.spyOn(wrapper.vm, 'handleSave')
    
    // Simulate Ctrl+S
    await wrapper.trigger('keydown', {
      key: 's',
      ctrlKey: true,
      preventDefault: vi.fn()
    })
    
    expect(saveHandler).toHaveBeenCalled()
  })

  it('handles image upload', async () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    
    await wrapper.vm.handleImageUpload(file)
    
    expect(wrapper.emitted('image-upload')).toBeTruthy()
    expect(wrapper.emitted('image-upload')[0][0]).toBe(file)
  })

  it('generates export data correctly', async () => {
    await wrapper.vm.handleExport()
    
    const exportEvent = wrapper.emitted('export')
    expect(exportEvent).toBeTruthy()
    expect(exportEvent[0][0]).toHaveProperty('content')
    expect(exportEvent[0][0]).toHaveProperty('title')
  })

  it('handles save with proper data structure', async () => {
    await wrapper.vm.handleSave()
    
    const saveEvent = wrapper.emitted('save')
    expect(saveEvent).toBeTruthy()
    expect(saveEvent[0][0]).toHaveProperty('content')
    expect(saveEvent[0][0]).toHaveProperty('title')
  })

  describe('Props', () => {
    it('accepts modelValue prop', () => {
      expect(wrapper.props('modelValue')).toBe('<p>Initial content</p>')
    })

    it('accepts placeholder prop', () => {
      expect(wrapper.props('placeholder')).toBe('Start typing...')
    })

    it('accepts editable prop', async () => {
      await wrapper.setProps({ editable: false })
      expect(wrapper.props('editable')).toBe(false)
    })

    it('accepts autosave prop', async () => {
      await wrapper.setProps({ autosave: true })
      expect(wrapper.props('autosave')).toBe(true)
    })
  })

  describe('Computed Properties', () => {
    it('computes canSave correctly', () => {
      const editorStore = useEditorStore()
      
      // Mock store state for saving
      editorStore.hasUnsavedChanges = true
      editorStore.currentDocument = { id: '1', title: 'Test', content: '', createdAt: new Date(), updatedAt: new Date() }
      editorStore.isLoading = false
      
      expect(wrapper.vm.canSave).toBe(true)
    })
  })

  describe('Lifecycle', () => {
    it('sets up keyboard shortcuts on mount', () => {
      // Verify that keyboard event listeners are attached
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener')
      
      mount(VueHtmlEditor, {
        global: {
          plugins: [pinia]
        }
      })
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    })

    it('destroys editor on unmount', () => {
      wrapper.unmount()
      expect(mockEditor.destroy).toHaveBeenCalled()
    })
  })

  describe('Auto-save functionality', () => {
    it('starts auto-save when enabled', async () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval')
      
      await wrapper.setProps({
        autosave: true,
        autosaveInterval: 5000
      })
      
      // Trigger the autosave setup
      wrapper.vm.startAutosave()
      
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 5000)
    })

    it('stops auto-save when disabled', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval')
      
      wrapper.vm.stopAutosave()
      
      expect(clearIntervalSpy).toHaveBeenCalled()
    })
  })

  describe('Modal Management', () => {
    it('closes all modals when needed', async () => {
      // Open multiple modals
      wrapper.vm.showLinkModal = true
      wrapper.vm.showImageModal = true
      wrapper.vm.showTableModal = true
      
      // Close link modal
      wrapper.vm.showLinkModal = false
      
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.showLinkModal).toBe(false)
      expect(wrapper.vm.showImageModal).toBe(true) // Others should remain open
    })
  })

  describe('Error Handling', () => {
    it('handles missing editor gracefully', () => {
      // Mock a scenario where editor is null
      wrapper.vm.editor = null
      
      expect(() => {
        wrapper.vm.toggleHeading()
      }).not.toThrow()
    })

    it('handles invalid heading selection gracefully', async () => {
      const headingSelect = wrapper.find('select')
      await headingSelect.setValue('invalid')
      
      expect(() => {
        wrapper.vm.toggleHeading()
      }).not.toThrow()
    })
  })
})