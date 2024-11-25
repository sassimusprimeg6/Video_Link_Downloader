const express = require('express');
const app = express();
const port = 3000;

app.use(express.static('public'));

app.get('/download', (req, res) => {
    const videoUrl = req.query.url;
    const format = req.query.format;
    const quality = req.query.quality;

    console.log('Received request:', { videoUrl, format, quality });

    if (!videoUrl || !format || !quality) {
        console.error('Missing parameters:', { videoUrl, format, quality });
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
