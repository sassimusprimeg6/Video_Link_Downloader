document.addEventListener('DOMContentLoaded', function () {
  const input = document.getElementById('videoLink')

  input.addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
      downloadVideo()
    }
  })

  updateQualityOptions()
})

function updateQualityOptions() {
  const format = document.getElementById('format').value
  const qualitySelect = document.getElementById('quality')

  // Clear existing options
  qualitySelect.innerHTML = ''

  if (format === 'mp4') {
    ;['720p', '1080p', '4K'].forEach((opt) => {
      const option = document.createElement('option')
      option.value = opt.toLowerCase()
      option.textContent = opt
      qualitySelect.appendChild(option)
    })
  } else if (format === 'mp3') {
    ;['128kbps', '192kbps', '320kbps'].forEach((opt) => {
      const option = document.createElement('option')
      option.value = opt
      option.textContent = opt
      qualitySelect.appendChild(option)
    })
  }
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

  fetch(
    `/download?url=${encodeURIComponent(videoLink)}&format=${encodeURIComponent(
      format
    )}&quality=${encodeURIComponent(quality)}`
  )
    .then((res) => {
      if (!res.ok) throw new Error('Network response was not ok')
      return res.json()
    })
    .then((data) => {
      if (data.success) {
        document.getElementById(
          'message'
        ).innerHTML = `<a href="${data.downloadLink}" download>Click here to download ${format} (${quality})</a>`
      } else {
        document.getElementById('message').innerText =
          'Failed to download video.'
      }
    })
    .catch((err) => {
      document.getElementById(
        'message'
      ).innerText = `An error occurred: ${err.message}`
      console.error('Error:', err)
    })
}
