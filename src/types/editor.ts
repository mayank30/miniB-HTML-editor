export interface EditorDocument {
  id: string
  title: string
  content: string
  createdAt: Date
  updatedAt: Date
}

export interface EditorEvent {
  type: 'content-change' | 'save' | 'load' | 'export' | 'image-upload' | 'delete'
  data: any
  timestamp: Date
}

export interface ImageUploadData {
  file?: File
  url?: string
  alt?: string
  width?: number
  height?: number
}

export interface TableData {
  rows: number
  cols: number
  withHeaderRow: boolean
}

export interface LinkData {
  url: string
  text?: string
  target?: '_blank' | '_self'
  rel?: string
}

export interface CodeBlockData {
  language: string
  code: string
}

export interface EditorState {
  isLoading: boolean
  hasUnsavedChanges: boolean
  currentDocument: EditorDocument | null
  recentDocuments: EditorDocument[]
}

export interface EditorConfig {
  placeholder: string
  autosave: boolean
  autosaveInterval: number
  maxImageSize: number
  allowedImageTypes: string[]
  enableCollaboration: boolean
}

export interface ServerAPI {
  saveDocument: (doc: Partial<EditorDocument>) => Promise<EditorDocument>
  loadDocument: (id: string) => Promise<EditorDocument>
  listDocuments: () => Promise<EditorDocument[]>
  deleteDocument: (id: string) => Promise<boolean>
  uploadImage: (file: File) => Promise<{ url: string }>
  exportHTML: (content: string, title: string) => Promise<{ html: string }>
}