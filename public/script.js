document.addEventListener('DOMContentLoaded', function () {
  const input = document.getElementById('videoLink')
  const formatSelect = document.getElementById('format')
  const downloadButton = document.getElementById('downloadButton')

  // Handle Enter key on input
  input.addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
      downloadVideo()
    }
  })

  // Handle format change
  formatSelect.addEventListener('change', function () {
    updateQualityOptions()
  })

  // Handle download button click
  downloadButton.addEventListener('click', function () {
    downloadVideo()
  })

  // Initialize quality options
  updateQualityOptions()
})

function updateQualityOptions() {
  const format = document.getElementById('format').value
  const qualitySelect = document.getElementById('quality')

  // Clear existing options
  qualitySelect.innerHTML = ''

  // Both mp3 and mp4 use the same quality options (720p, 1080p, 4K)
  // For mp3, the quality parameter is accepted but audio quality is handled by the backend
  ;['720p', '1080p', '4K'].forEach((opt) => {
    const option = document.createElement('option')
    option.value = opt.toLowerCase()
    option.textContent = opt
    qualitySelect.appendChild(option)
  })
}

function downloadVideo() {
  const videoLink = document.getElementById('videoLink').value
  const format = document.getElementById('format').value
  const quality = document.getElementById('quality').value

  if (!videoLink) {
    document.getElementById('message').innerText = 'Please enter a video link.'
    return
  }

  document.getElementById('message').innerText = 'Processing your request...'

  const downloadUrl = `/download?url=${encodeURIComponent(videoLink)}&format=${encodeURIComponent(
    format
  )}&quality=${encodeURIComponent(quality)}`

  fetch(downloadUrl)
    .then((res) => {
      const contentType = res.headers.get('content-type') || ''
      
      // If it's JSON, it's an error response
      if (contentType.includes('application/json') || !res.ok) {
        return res.json().then((data) => {
          throw new Error(data.message || 'Download failed')
        })
      }
      
      // It's a file download - get the blob and trigger download
      return res.blob().then((blob) => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `video.${format}`
        a.style.display = 'none'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        document.getElementById('message').innerText = 'Download started!'
      })
    })
    .catch((err) => {
      document.getElementById(
        'message'
      ).innerText = `An error occurred: ${err.message}`
      console.error('Error:', err)
    })
}
