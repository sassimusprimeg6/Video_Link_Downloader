document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('videoLink');

    input.addEventListener('keypress', function(event) {
        if (event.keyCode === 13) { // Enter key is pressed
            downloadVideo();
        }
    });

    // Initialize quality options based on default format selection
    updateQualityOptions();
});

function updateQualityOptions() {
    const format = document.getElementById('format').value;
    const qualitySelect = document.getElementById('quality');
    
    while (qualitySelect.firstChild) {
        qualitySelect.removeChild(qualitySelect.firstChild);
    }
    
    if (format === 'mp4') {
        const mp4Options = ['720p', '1080p', '4K'];
        mp4Options.forEach(option => {
            let opt = document.createElement('option');
            opt.value = option.toLowerCase();
            opt.textContent = option;
            qualitySelect.appendChild(opt);
        });
    } else if (format === 'mp3') {
        const mp3Options = ['128kbps', '192kbps', '320kbps'];
        mp3Options.forEach(option => {
            let opt = document.createElement('option');
            opt.value = option;
            opt.textContent = option;
            qualitySelect.appendChild(opt);
        });
    }
}

function downloadVideo() {
    const videoLink = document.getElementById('videoLink').value;
    const format = document.getElementById('format').value;
    const quality = document.getElementById('quality').value;
    if (!videoLink) {
        document.getElementById('message').innerText = "Please enter a video link.";
        return;
    }
    
    document.getElementById('message').innerText = "Processing your request...";
    
    fetch(`/download?url=${encodeURIComponent(videoLink)}&format=${encodeURIComponent(format)}&quality=${encodeURIComponent(quality)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                document.getElementById('message').innerHTML = `<a href="${data.downloadLink}" download>Click here to download ${format} (${quality})</a>`;
            }
            else {
                document.getElementById('message').innerText = "Failed to download video.";
            }
        })
        .catch(error => {
            document.getElementById('message').innerText = `An error occurred: ${error.message}`;
            console.error('Error:', error);
        });
}
