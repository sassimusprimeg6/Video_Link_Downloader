function downloadVideo() {
    const videoLink = document.getElementById('videoLink').value;
    if (!videoLink) {
        document.getElementById('message').innerText = "Please enter a video link.";
        return;
    }
    
    // This is a placeholder for the actual download logic
    // You would need to use a server-side script to handle video downloading
    fetch(`/download?url=${encodeURIComponent(videoLink)}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('message').innerHTML = `<a href="${data.downloadLink}" download>Click here to download</a>`;
            } else {
                document.getElementById('message').innerText = "Failed to download video.";
            }
        })
        .catch(error => {
            document.getElementById('message').innerText = "An error occurred.";
            console.error('Error:', error);
        });
}
