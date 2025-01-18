// server.js
const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();

// Get backend URL from environment variable
const BACKEND_URL = process.env.BACKEND_URL || 'http://your-flask-backend-url.railway.app';

// Proxy API requests to the backend
app.use('/api', createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api': '' // Remove /api prefix when forwarding to backend
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