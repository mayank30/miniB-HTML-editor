import { vi } from 'vitest'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

global.localStorage = localStorageMock as any

// Mock fetch
global.fetch = vi.fn()

// Mock window.open
global.open = vi.fn()

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url')
global.URL.revokeObjectURL = vi.fn()

// Mock FileReader
global.FileReader = class MockFileReader {
  onload: ((event: any) => void) | null = null
  readAsDataURL = vi.fn().mockImplementation(() => {
    if (this.onload) {
      this.onload({ target: { result: 'data:image/jpeg;base64,mock-data' } })
    }
  })
} as any

// Mock document.createElement for image handling
const originalCreateElement = document.createElement
document.createElement = vi.fn().mockImplementation((tagName: string) => {
  if (tagName === 'a') {
    return {
      href: '',
      download: '',
      click: vi.fn(),
      remove: vi.fn(),
      style: {}
    }
  }
  if (tagName === 'div') {
    return {
      innerHTML: '',
      textContent: '',
      innerText: ''
    }
  }
  return originalCreateElement.call(document, tagName)
})

// Mock document.body.appendChild and removeChild
document.body.appendChild = vi.fn()
document.body.removeChild = vi.fn()

// Mock Blob
global.Blob = class MockBlob {
  constructor(public parts: any[], public options: any) {}
} as any

// Mock setInterval and clearInterval
global.setInterval = vi.fn((fn: any, delay: any) => {
  return setTimeout(fn, delay) as any
})

global.clearInterval = vi.fn((id: any) => {
  clearTimeout(id)
})

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn()
}