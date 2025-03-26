// server.js
const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();

// Get backend URL from environment variable
const BACKEND_URL = process.env.BACKEND_URL || 'http://your-flask-backend-url.railway.app';
console.log('Using backend URL:', BACKEND_URL);

// Add an API test endpoint for diagnosing issues
app.get('/api-test', (req, res) => {
  res.json({
    environment: process.env.NODE_ENV,
    backend_url: BACKEND_URL,
    timestamp: new Date().toISOString(),
    message: 'Frontend server is working!'
  });
});

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Proxy API requests to the backend - WITHOUT stripping /api
app.use('/api', createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
    logLevel: 'debug',
    onProxyReq: (proxyReq, req, res) => {
      console.log(`Proxying ${req.method} ${req.url} to ${BACKEND_URL}${proxyReq.path}`);
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`Proxy response from ${req.url}: ${proxyRes.statusCode}`);
      // Log headers for debugging
      const headers = JSON.stringify(proxyRes.headers);
      console.log(`Response headers: ${headers}`);
    },
    onError: (err, req, res) => {
      console.error('Proxy error:', err);
      // Send a more useful error response
      res.status(500).json({ 
        error: 'Proxy error', 
        message: err.message,
        timestamp: new Date().toISOString()
      });
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