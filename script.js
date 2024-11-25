document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('videoLink');

    input.addEventListener('keypress', function(event) {
        if (event.keyCode === 13) { // Enter key is pressed
            downloadVideo();
        }
    });
});

function downloadVideo() {
    const videoLink = document.getElementById('videoLink').value;
    const format = document.getElementById('format').value;
    if (!videoLink) {
        document.getElementById('message').innerText = "Please enter a video link.";
        return;
    }
    
    document.getElementById('message').innerText = "Processing your request...";
    
    fetch(`/download?url=${encodeURIComponent(videoLink)}&format=${encodeURIComponent(format)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                document.getElementById('message').innerHTML = `<a href="${data.downloadLink}" download>Click here to download ${format}</a>`;
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
