const express = require('express');
const app = express();
const port = 3000;

// Serve static files (HTML, CSS, JS) from the 'public' folder
app.use(express.static('public'));

// Handle download requests
app.get('/download', (req, res) => {
    const videoUrl = req.query.url;
    const format = req.query.format;

    if (!videoUrl || !format) {
        return res.status(400).json({ success: false, message: 'Missing parameters' });
    }

    // Placeholder for actual download logic
    // Simulate success response
    res.json({
        success: true,
        downloadLink: `/path/to/downloaded/file.${format}`
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
