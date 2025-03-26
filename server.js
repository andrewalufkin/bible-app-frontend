// server.js
const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();

// Get backend URL from Railway environment variables
// NOTE: In Railway, use BACKEND_URL for the server.js Express app
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';
console.log('Server using BACKEND_URL:', BACKEND_URL);

// Add middleware to log all requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Proxy API requests to the backend
app.use('/api', createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api': '' // Remove /api prefix when forwarding to backend
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`Proxying request to: ${BACKEND_URL}${proxyReq.path}`);
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log(`Proxy response from ${req.url}: status=${proxyRes.statusCode}`);
    },
    onError: (err, req, res) => {
        console.error('Proxy error:', err);
        
        // Send a more graceful error response that won't cause JSON parsing errors
        res.status(502).json({ 
            error: 'Backend connection error', 
            message: err.message,
            code: 'PROXY_ERROR'
        });
    }
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'build')));

// Handle React routing
app.get('/*', function (req, res) {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Express error:', err);
    res.status(500).json({ 
        error: 'Server error', 
        message: err.message,
        code: 'SERVER_ERROR'
    });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Frontend server running on port ${port}`);
    console.log(`Proxying API requests to: ${BACKEND_URL}`);
});