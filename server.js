const express = require('express')
const cors = require('cors')
const path = require('path')
const helmet = require('helmet')
const fs = require('fs-extra')
const YTDlpWrap = require('yt-dlp-wrap-plus').default
const ffmpeg = require('fluent-ffmpeg')

const app = express()
const port = 3000

// Ensure downloads directory exists
const downloadsDir = path.join(__dirname, 'downloads')
fs.ensureDirSync(downloadsDir)

// Initialize yt-dlp wrapper
const ytDlpWrap = new YTDlpWrap()

// Set binary path if yt-dlp is installed via Homebrew
const { execSync } = require('child_process')
try {
  const ytDlpPath = execSync('which yt-dlp', { encoding: 'utf8' }).trim()
  if (ytDlpPath) {
    ytDlpWrap.setBinaryPath(ytDlpPath)
    console.log(`Using yt-dlp at: ${ytDlpPath}`)
  }
} catch (error) {
  console.warn('Could not find yt-dlp in PATH, wrapper will try to locate it automatically')
}

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
app.get('/download', async (req, res) => {
  const { url, format, quality } = req.query
  console.log('Received request:', { url, format, quality })

  if (!url || !format || !quality) {
    return res
      .status(400)
      .json({ success: false, message: 'Missing parameters' })
  }

  // Basic URL validation
  if (!url || (!url.includes('youtube.com') && !url.includes('youtu.be'))) {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid YouTube URL' })
  }

  try {
    // Get video info first to get the title
    const videoInfo = await ytDlpWrap.getVideoInfo(url)
    const videoTitle = (videoInfo.title || 'video').replace(/[^a-z0-9]/gi, '_').substring(0, 100)
    const outputPath = path.join(downloadsDir, `${videoTitle}.${format}`)

    if (format === 'mp3') {
      // Download best audio and convert to MP3
      await ytDlpWrap.execPromise([
        url,
        '-f', 'bestaudio/best',
        '-x', // Extract audio
        '--audio-format', 'mp3',
        '--audio-quality', '192K',
        '-o', outputPath.replace('.mp3', '.%(ext)s'),
      ])

      // yt-dlp might add .mp3 extension, check if file exists
      if (!fs.existsSync(outputPath)) {
        // Try to find the file with any extension
        const files = fs.readdirSync(downloadsDir)
        const downloadedFile = files.find(f => 
          f.startsWith(videoTitle) && (f.endsWith('.mp3') || f.endsWith('.m4a') || f.endsWith('.webm'))
        )
        
        if (downloadedFile) {
          const downloadedPath = path.join(downloadsDir, downloadedFile)
          if (downloadedPath !== outputPath) {
            fs.moveSync(downloadedPath, outputPath, { overwrite: true })
          }
        } else {
          throw new Error('Failed to download audio file')
        }
      }

      // Send file and clean up after download
      res.download(outputPath, `${videoTitle}.mp3`, (err) => {
        if (err) {
          console.error('Download error:', err)
        }
        // Clean up file after sending
        setTimeout(() => {
          if (fs.existsSync(outputPath)) {
            fs.removeSync(outputPath)
          }
        }, 5000)
      })
    } else if (format === 'mp4') {
      // Map quality to yt-dlp format selector
      // Try combined format first (no merging needed), then fallback to separate streams
      let formatSelector
      if (quality === '720p') {
        formatSelector = 'best[height<=720]/bestvideo[height<=720]+bestaudio/best[height<=720]'
      } else if (quality === '1080p') {
        formatSelector = 'best[height<=1080]/bestvideo[height<=1080]+bestaudio/best[height<=1080]'
      } else if (quality === '4k') {
        formatSelector = 'best[height<=2160]/bestvideo[height<=2160]+bestaudio/best[height<=2160]'
      } else {
        formatSelector = 'best/bestvideo+bestaudio'
      }

      // Use a template for output path - yt-dlp will replace %(ext)s with the actual extension
      const outputTemplate = path.join(downloadsDir, `${videoTitle}.%(ext)s`)

      // Download video with verbose output for debugging
      try {
        console.log(`Downloading video with format: ${formatSelector}`)
        console.log(`Output template: ${outputTemplate}`)
        
        const result = await ytDlpWrap.execPromise([
          url,
          '-f', formatSelector,
          '--merge-output-format', 'mp4',
          '--embed-metadata', // Embed metadata
          '--no-mtime', // Don't set file modification time
          '--no-playlist', // Don't download playlists
          '-o', outputTemplate,
        ])
        
        console.log('yt-dlp completed successfully')
      } catch (execError) {
        console.error('yt-dlp execution error:', execError)
        console.error('Error details:', JSON.stringify(execError, null, 2))
        throw new Error(`Download failed: ${execError.message || execError.toString()}`)
      }

      // Check if file exists - yt-dlp might need time to merge video and audio
      let finalOutputPath = outputPath
      if (!fs.existsSync(outputPath)) {
        // Wait for merge to complete - check multiple times
        let mergedFile = null
        for (let i = 0; i < 10; i++) {
          await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second between checks
          
          const files = fs.readdirSync(downloadsDir)
          console.log(`Check ${i + 1}: Files in downloads directory:`, files)
          
          // Look for the merged file (without format codes like .f251, .f398)
          // The merged file should be: videoTitle.mp4 (or videoTitle.mkv)
          mergedFile = files.find(f => {
            // Match files that start with videoTitle and end with .mp4 or .mkv
            // but don't have format codes (like .f251, .f398) in the name
            const matchesBase = f.startsWith(videoTitle)
            const hasVideoExt = f.endsWith('.mp4') || f.endsWith('.mkv')
            const noFormatCode = !f.match(/\.f\d+\.(mp4|mkv|webm)$/) // No format code before extension
            return matchesBase && hasVideoExt && noFormatCode
          })
          
          if (mergedFile) {
            console.log(`Found merged file: ${mergedFile}`)
            break
          }
        }
        
        if (mergedFile) {
          finalOutputPath = path.join(downloadsDir, mergedFile)
          // If it's not .mp4, we can still serve it or convert it
          if (!finalOutputPath.endsWith('.mp4')) {
            console.log(`Merged file is ${mergedFile}, will serve as-is`)
          }
        } else {
          // If merge didn't complete, try to find the best available file
          const files = fs.readdirSync(downloadsDir)
          const videoFiles = files.filter(f => 
            f.startsWith(videoTitle) && (f.endsWith('.mp4') || f.endsWith('.mkv') || f.endsWith('.webm'))
          )
          
          if (videoFiles.length > 0) {
            // Prefer .mp4 files
            const mp4File = videoFiles.find(f => f.endsWith('.mp4'))
            finalOutputPath = path.join(downloadsDir, mp4File || videoFiles[0])
            console.log(`Using available file: ${path.basename(finalOutputPath)}`)
          } else {
            console.error('Available files in downloads directory:', files)
            throw new Error(`Failed to download/merge video file. Expected: ${outputPath}. Files found: ${files.join(', ')}`)
          }
        }
      } else {
        console.log(`File exists at expected path: ${outputPath}`)
      }

      // Send file and clean up after download
      res.download(finalOutputPath, `${videoTitle}.mp4`, (err) => {
        if (err) {
          console.error('Download error:', err)
        }
        // Clean up file after sending
        setTimeout(() => {
          if (fs.existsSync(finalOutputPath)) {
            fs.removeSync(finalOutputPath)
          }
        }, 5000)
      })
    } else {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid format. Use mp3 or mp4' })
    }
  } catch (error) {
    console.error('Download error:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Download failed'
    if (error.message.includes('403')) {
      errorMessage = 'Access denied by YouTube. The video may be restricted, private, or unavailable.'
    } else if (error.message.includes('404')) {
      errorMessage = 'Video not found. Please check the URL.'
    } else if (error.message.includes('Sign in to confirm your age')) {
      errorMessage = 'This video is age-restricted and requires authentication.'
    } else {
      errorMessage = error.message || 'Unknown error occurred'
    }
    
    return res
      .status(500)
      .json({ success: false, message: errorMessage })
  }
})

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})
