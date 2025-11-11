const express = require('express')
const cors = require('cors')
const path = require('path')
const helmet = require('helmet')

const app = express()
const port = 3000

// Enable CORS
app.use(cors())

// Helmet CSP for security
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        imgSrc: ["'self'", 'data:'],
        scriptSrc: ["'self'"],
      },
    },
  })
)

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')))

// Root route — serve index.html
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: path.join(__dirname, 'public') })
})

// Download endpoint
app.get('/download', (req, res) => {
  const { url, format, quality } = req.query
  console.log('Received request:', { url, format, quality })

  if (!url || !format || !quality) {
    return res
      .status(400)
      .json({ success: false, message: 'Missing parameters' })
  }

  // TO BE DONE - ADD DOWNLOAD LOGIC
  res.json({
    success: true,
    downloadLink: `/path/to/downloaded/file.${format}`,
  })
})

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})
