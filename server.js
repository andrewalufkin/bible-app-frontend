// server.js
const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();

// Get backend URL from Railway environment variables
// NOTE: In Railway, use BACKEND_URL for the server.js Express app
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';
console.log('Server using BACKEND_URL:', BACKEND_URL);

// Proxy API requests to the backend
app.use('/api', createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api': '' // Remove /api prefix when forwarding to backend
    },
    onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(500).json({ error: 'Proxy error', message: err.message });
    }
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'build')));

// Handle React routing
app.get('/*', function (req, res) {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Frontend server running on port ${port}`);
    console.log(`Proxying API requests to: ${BACKEND_URL}`);
});