import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import multer from 'multer'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs-extra'
import { v4 as uuidv4 } from 'uuid'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// Directories
const uploadsDir = join(__dirname, 'uploads')
const documentsDir = join(__dirname, 'documents')

// Ensure directories exist
await fs.ensureDir(uploadsDir)
await fs.ensureDir(documentsDir)

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}))

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})
app.use(limiter)

// Static file serving for uploads
app.use('/uploads', express.static(uploadsDir))

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = file.originalname.split('.').pop()
    cb(null, `${uniqueSuffix}.${ext}`)
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'))
    }
  }
})

// Utility functions
function sanitizeFilename(filename) {
  return filename.replace(/[^a-z0-9_-]/gi, '').toLowerCase()
}

function generateCompleteHTML(content, title) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h1, h2, h3, h4, h5, h6 {
            color: #2d3748;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
        }
        h1 { font-size: 2.25rem; }
        h2 { font-size: 1.875rem; }
        h3 { font-size: 1.5rem; }
        h4 { font-size: 1.25rem; }
        h5 { font-size: 1.125rem; }
        h6 { font-size: 1rem; }
        p { margin-bottom: 1rem; }
        ul, ol { margin-bottom: 1rem; padding-left: 2rem; }
        li { margin-bottom: 0.25rem; }
        a { color: #3182ce; text-decoration: underline; }
        a:hover { color: #2c5aa0; }
        img { 
            max-width: 100%; 
            height: auto; 
            border-radius: 0.5rem; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
            margin: 1rem 0; 
        }
        blockquote {
            border-left: 4px solid #3182ce;
            padding-left: 1rem;
            font-style: italic;
            color: #4a5568;
            background-color: #f7fafc;
            padding: 1rem;
            margin: 1rem 0;
        }
        code {
            background-color: #f7fafc;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-family: 'Courier New', monospace;
            font-size: 0.875rem;
        }
        pre {
            background-color: #2d3748;
            color: #e2e8f0;
            padding: 1rem;
            border-radius: 0.5rem;
            overflow-x: auto;
            margin: 1rem 0;
        }
        pre code {
            background-color: transparent;
            padding: 0;
            color: inherit;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 1rem 0;
        }
        th, td {
            border: 1px solid #e2e8f0;
            padding: 0.75rem;
            text-align: left;
        }
        th {
            background-color: #f7fafc;
            font-weight: 600;
        }
        hr {
            border: none;
            border-top: 1px solid #e2e8f0;
            margin: 2rem 0;
        }
    </style>
</head>
<body>
    ${content}
</body>
</html>`
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Image upload
app.post('/api/upload/image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      })
    }

    const imageUrl = `/uploads/${req.file.filename}`
    
    res.json({
      success: true,
      url: imageUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Document management

// Save document
app.post('/api/documents', async (req, res) => {
  try {
    const { id, title, content, saveAsComplete = true } = req.body

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Title and content are required'
      })
    }

    const documentId = id || uuidv4()
    const sanitizedTitle = sanitizeFilename(title) || 'untitled'
    const filename = `${documentId}-${sanitizedTitle}.html`
    const timestamp = new Date().toISOString()

    // Prepare content
    let htmlContent
    if (saveAsComplete) {
      htmlContent = generateCompleteHTML(content, title)
    } else {
      htmlContent = content
    }

    // Document metadata
    const document = {
      id: documentId,
      title,
      content,
      filename,
      saveAsComplete,
      createdAt: timestamp,
      updatedAt: timestamp,
      size: htmlContent.length
    }

    // Save HTML file
    const filePath = join(documentsDir, filename)
    await fs.writeFile(filePath, htmlContent, 'utf8')

    // Save metadata
    const metadataPath = join(documentsDir, `${documentId}.json`)
    await fs.writeFile(metadataPath, JSON.stringify(document, null, 2), 'utf8')

    res.json({
      success: true,
      document,
      message: `Document saved successfully as ${filename}`
    })

  } catch (error) {
    console.error('Save error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to save document'
    })
  }
})

// Get all documents
app.get('/api/documents', async (req, res) => {
  try {
    const files = await fs.readdir(documentsDir)
    const jsonFiles = files.filter(file => file.endsWith('.json'))
    
    const documents = await Promise.all(
      jsonFiles.map(async (file) => {
        try {
          const content = await fs.readFile(join(documentsDir, file), 'utf8')
          return JSON.parse(content)
        } catch (error) {
          console.error(`Error reading ${file}:`, error)
          return null
        }
      })
    )

    const validDocuments = documents
      .filter(doc => doc !== null)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))

    res.json({
      success: true,
      documents: validDocuments
    })

  } catch (error) {
    console.error('List documents error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to list documents'
    })
  }
})

// Get specific document
app.get('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params
    const metadataPath = join(documentsDir, `${id}.json`)
    
    if (!(await fs.pathExists(metadataPath))) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      })
    }

    const document = JSON.parse(await fs.readFile(metadataPath, 'utf8'))
    
    res.json({
      success: true,
      document
    })

  } catch (error) {
    console.error('Get document error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get document'
    })
  }
})

// Update document
app.put('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { title, content, saveAsComplete = true } = req.body
    
    const metadataPath = join(documentsDir, `${id}.json`)
    
    if (!(await fs.pathExists(metadataPath))) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      })
    }

    // Load existing document
    const existingDoc = JSON.parse(await fs.readFile(metadataPath, 'utf8'))
    
    // Update document
    const updatedDoc = {
      ...existingDoc,
      title: title || existingDoc.title,
      content: content || existingDoc.content,
      saveAsComplete,
      updatedAt: new Date().toISOString()
    }

    // Generate new filename if title changed
    if (title && title !== existingDoc.title) {
      const sanitizedTitle = sanitizeFilename(title) || 'untitled'
      const newFilename = `${id}-${sanitizedTitle}.html`
      
      // Remove old HTML file
      const oldHtmlPath = join(documentsDir, existingDoc.filename)
      if (await fs.pathExists(oldHtmlPath)) {
        await fs.remove(oldHtmlPath)
      }
      
      updatedDoc.filename = newFilename
    }

    // Prepare content
    let htmlContent
    if (saveAsComplete) {
      htmlContent = generateCompleteHTML(updatedDoc.content, updatedDoc.title)
    } else {
      htmlContent = updatedDoc.content
    }

    updatedDoc.size = htmlContent.length

    // Save updated HTML file
    const htmlPath = join(documentsDir, updatedDoc.filename)
    await fs.writeFile(htmlPath, htmlContent, 'utf8')

    // Save updated metadata
    await fs.writeFile(metadataPath, JSON.stringify(updatedDoc, null, 2), 'utf8')

    res.json({
      success: true,
      document: updatedDoc,
      message: 'Document updated successfully'
    })

  } catch (error) {
    console.error('Update document error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update document'
    })
  }
})

// Delete document
app.delete('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params
    const metadataPath = join(documentsDir, `${id}.json`)
    
    if (!(await fs.pathExists(metadataPath))) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      })
    }

    // Load document to get filename
    const document = JSON.parse(await fs.readFile(metadataPath, 'utf8'))
    
    // Remove HTML file
    const htmlPath = join(documentsDir, document.filename)
    if (await fs.pathExists(htmlPath)) {
      await fs.remove(htmlPath)
    }

    // Remove metadata file
    await fs.remove(metadataPath)

    res.json({
      success: true,
      message: 'Document deleted successfully'
    })

  } catch (error) {
    console.error('Delete document error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete document'
    })
  }
})

// Export document as HTML
app.post('/api/documents/:id/export', async (req, res) => {
  try {
    const { id } = req.params
    const metadataPath = join(documentsDir, `${id}.json`)
    
    if (!(await fs.pathExists(metadataPath))) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      })
    }

    const document = JSON.parse(await fs.readFile(metadataPath, 'utf8'))
    const completeHtml = generateCompleteHTML(document.content, document.title)

    res.setHeader('Content-Type', 'text/html')
    res.setHeader('Content-Disposition', `attachment; filename="${document.title.replace(/[^a-z0-9]/gi, '_')}.html"`)
    res.send(completeHtml)

  } catch (error) {
    console.error('Export document error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to export document'
    })
  }
})

// Clean up old files (utility endpoint)
app.post('/api/cleanup', async (req, res) => {
  try {
    const { olderThanDays = 30 } = req.body
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    const files = await fs.readdir(documentsDir)
    let deletedCount = 0

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = join(documentsDir, file)
        const stats = await fs.stat(filePath)
        
        if (stats.mtime < cutoffDate) {
          // Load document to get HTML filename
          try {
            const document = JSON.parse(await fs.readFile(filePath, 'utf8'))
            const htmlPath = join(documentsDir, document.filename)
            
            // Remove both files
            await fs.remove(filePath)
            if (await fs.pathExists(htmlPath)) {
              await fs.remove(htmlPath)
            }
            
            deletedCount++
          } catch (error) {
            console.error(`Error deleting ${file}:`, error)
          }
        }
      }
    }

    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} old documents`,
      deletedCount
    })

  } catch (error) {
    console.error('Cleanup error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup old documents'
    })
  }
})

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 5MB.'
      })
    }
  }
  
  console.error('Server error:', error)
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Vue HTML Editor Server running on port ${PORT}`)
  console.log(`📁 Documents directory: ${documentsDir}`)
  console.log(`📁 Uploads directory: ${uploadsDir}`)
  console.log(`🌐 API base URL: http://localhost:${PORT}/api`)
})