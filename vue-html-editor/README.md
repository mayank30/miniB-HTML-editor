# Vue HTML Editor

A modern, feature-rich WYSIWYG HTML editor built with Vue 3, TipTap, Tailwind CSS 4, and Lucide icons. Perfect for building Notion-like editors and comment systems.

## ✨ Features

### 🎨 Rich Text Editing
- **Text Formatting**: Bold, italic, underline, strikethrough
- **Headings**: H1 through H6 with proper semantic markup
- **Lists**: Bullet and numbered lists
- **Alignment**: Left, center, right, and justify alignment
- **Colors**: Text color picker with predefined colors
- **Highlighting**: Text highlighting support
- **Blockquotes**: Styled quote blocks

### 📎 Content Insertion
- **Links**: Insert links with custom text, target options, and rel attributes
- **Images**: Upload images or use external URLs with alt text and dimensions
- **Tables**: Create tables with customizable rows, columns, and headers
- **Code Blocks**: Insert syntax-highlighted code blocks
- **Horizontal Rules**: Insert divider lines

### 💾 File Management
- **Save Documents**: Save with custom titles and filenames
- **Load Documents**: Browse and load previously saved documents
- **Export HTML**: Generate standalone HTML documents with embedded CSS
- **Auto-save**: Optional auto-save functionality
- **Recent Documents**: Quick access to recently edited documents

### ⌨️ Keyboard Shortcuts
- `Ctrl/Cmd + S`: Save document
- `Ctrl/Cmd + O`: Open document
- `Ctrl/Cmd + B`: Bold
- `Ctrl/Cmd + I`: Italic
- `Ctrl/Cmd + U`: Underline
- `Ctrl/Cmd + Z`: Undo
- `Ctrl/Cmd + Y`: Redo

### 🧰 Advanced Features
- **Event System**: Complete event tracking for all editor actions
- **State Management**: Pinia-based state management
- **Server Integration**: RESTful API for document and image management
- **TypeScript Support**: Full TypeScript implementation
- **Responsive Design**: Works perfectly on all devices
- **Accessibility**: WCAG compliant with proper ARIA labels

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd vue-html-editor

# Install dependencies
npm install

# Start development server
npm run dev

# Start backend server (in another terminal)
cd server
bun install  # or npm install
bun run dev  # or npm run dev
```

### Basic Usage

```vue
<template>
  <div>
    <VueHtmlEditor
      v-model="content"
      :placeholder="'Start writing...'"
      :autosave="true"
      :autosave-interval="30000"
      @save="handleSave"
      @export="handleExport"
      @image-upload="handleImageUpload"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import VueHtmlEditor from '@/components/VueHtmlEditor.vue'

const content = ref('<p>Initial content</p>')

function handleSave(data) {
  console.log('Saving:', data.title, data.content)
}

function handleExport(data) {
  console.log('Exporting:', data.title, data.content)
}

function handleImageUpload(file) {
  console.log('Uploading image:', file.name)
}
</script>
```

## 📁 Project Structure

```
vue-html-editor/
├── src/
│   ├── components/
│   │   ├── VueHtmlEditor.vue          # Main editor component
│   │   └── modals/
│   │       ├── LinkModal.vue          # Link insertion modal
│   │       ├── ImageModal.vue         # Image upload modal
│   │       ├── TableModal.vue         # Table creation modal
│   │       ├── SaveModal.vue          # Document save modal
│   │       └── FileModal.vue          # File browser modal
│   ├── stores/
│   │   └── editor.ts                  # Pinia store for state management
│   ├── types/
│   │   └── editor.ts                  # TypeScript interfaces
│   ├── tests/
│   │   ├── setup.ts                   # Test setup and mocks
│   │   └── VueHtmlEditor.test.ts      # Component tests
│   ├── App.vue                        # Main application component
│   ├── main.ts                        # Application entry point
│   └── style.css                      # Global styles
├── server/
│   ├── index.js                       # Express server
│   ├── package.json                   # Server dependencies
│   ├── documents/                     # Saved documents
│   └── uploads/                       # Uploaded images
├── package.json                       # Frontend dependencies
├── vite.config.ts                     # Vite configuration
├── tailwind.config.js                 # Tailwind CSS configuration
├── vitest.config.ts                   # Vitest configuration
└── README.md                          # This file
```

## 🎯 Component API

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `string` | `''` | HTML content of the editor |
| `placeholder` | `string` | `'Start writing...'` | Placeholder text |
| `editable` | `boolean` | `true` | Whether the editor is editable |
| `autosave` | `boolean` | `false` | Enable auto-save functionality |
| `autosaveInterval` | `number` | `30000` | Auto-save interval in milliseconds |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` | `string` | Emitted when content changes |
| `save` | `{content: string, title: string}` | Emitted when save is triggered |
| `load` | `string` | Emitted when a document is loaded |
| `export` | `{content: string, title: string}` | Emitted when export is triggered |
| `image-upload` | `File` | Emitted when an image is uploaded |

## 🔧 Server API

The backend provides a RESTful API for document and image management:

### Documents
- `GET /api/documents` - List all documents
- `GET /api/documents/:id` - Get specific document
- `POST /api/documents` - Create new document
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document
- `POST /api/documents/:id/export` - Export document as HTML

### Images
- `POST /api/upload/image` - Upload image file

### Utility
- `GET /api/health` - Health check
- `POST /api/cleanup` - Clean up old documents

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Coverage

The project includes comprehensive tests for:
- Component rendering and user interactions
- Event emission and handling
- Keyboard shortcuts
- Modal functionality
- State management
- Error handling
- Auto-save functionality

## 🎨 Customization

### Styling

The editor uses Tailwind CSS 4 for styling. You can customize the appearance by:

1. **Modifying Tailwind Config**: Update `tailwind.config.js` for global theme changes
2. **Custom CSS**: Add custom styles in `src/style.css`
3. **Component Styles**: Modify styles directly in Vue components

### TipTap Extensions

Add or configure TipTap extensions in `VueHtmlEditor.vue`:

```javascript
import YourExtension from '@tiptap/extension-your-extension'

const editor = useEditor({
  extensions: [
    StarterKit,
    YourExtension.configure({
      // Your configuration
    }),
    // ... other extensions
  ]
})
```

### Color Palette

Customize the color picker by modifying the `colors` array in `VueHtmlEditor.vue`:

```javascript
const colors = [
  '#000000', '#ffffff', '#ff0000', // Add your colors
  // ... more colors
]
```

## 🌐 Browser Support

- **Chrome** 88+
- **Firefox** 85+
- **Safari** 14+
- **Edge** 88+

## 🔒 Security Features

- **File Type Validation**: Only allows specific image types
- **File Size Limits**: 5MB maximum for image uploads
- **Filename Sanitization**: Prevents directory traversal attacks
- **CORS Protection**: Configurable CORS settings
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Comprehensive input validation
- **XSS Protection**: HTML sanitization and escaping

## 📱 Mobile Support

- **Touch-friendly Interface**: Optimized for touch interactions
- **Responsive Design**: Adapts to all screen sizes
- **Mobile Toolbar**: Collapsible toolbar for smaller screens
- **Gesture Support**: Touch gestures for common actions

## 🚨 Troubleshooting

### Common Issues

1. **Images not uploading**
   - Check server permissions for uploads directory
   - Verify file size is under 5MB
   - Ensure file type is supported (JPEG, PNG, GIF, WebP)

2. **Auto-save not working**
   - Check if auto-save is enabled in props
   - Verify auto-save interval setting
   - Check browser console for errors

3. **Styles not loading**
   - Verify Tailwind CSS is properly configured
   - Check if custom CSS files are imported
   - Clear browser cache

4. **Server connection issues**
   - Check if backend server is running
   - Verify API endpoint URLs
   - Check CORS configuration

### Performance Tips

- **Large Documents**: Break content into smaller sections
- **Image Optimization**: Compress images before uploading
- **Auto-save Frequency**: Adjust auto-save interval based on needs
- **Bundle Size**: Use dynamic imports for large TipTap extensions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow Vue 3 Composition API patterns
- Use TypeScript for type safety
- Write tests for new features
- Follow existing code style
- Update documentation for API changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎉 What Makes This Editor Special

1. **Modern Architecture**: Built with the latest Vue 3, TypeScript, and Vite
2. **Complete Solution**: Frontend + Backend with full API
3. **Production Ready**: Includes security, testing, and error handling
4. **Highly Customizable**: Easy to modify and extend
5. **Performance Optimized**: Lazy loading and efficient rendering
6. **Mobile First**: Responsive design with touch support
7. **Accessibility**: WCAG compliant with proper semantics
8. **Developer Experience**: Excellent TypeScript support and documentation

## 🔗 Related Projects

- [TipTap](https://tiptap.dev/) - The headless editor framework
- [Vue 3](https://vuejs.org/) - The progressive JavaScript framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Lucide](https://lucide.dev/) - Beautiful & consistent icon pack

---

**Start building amazing content creation experiences with Vue HTML Editor!** 🚀

For questions, issues, or contributions, please visit our [GitHub repository](repository-url).
