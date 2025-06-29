// Test semplificato per isolare il problema del proxy auth
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
const PORT = 4004; // Porta diversa per evitare conflitti

// CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Body parser RIMOSSO - potrebbe interferire con il proxy
// app.use(bodyParser.json({ limit: '10mb' }));
// app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Debug middleware
app.use((req, res, next) => {
  console.log(`🔍 [SIMPLE PROXY] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'simple-proxy', port: PORT });
});

// Proxy middleware per /api/auth - configurazione semplificata
app.use('/api/auth', (req, res, next) => {
  console.log(`🔍 [AUTH MIDDLEWARE] ${req.method} ${req.originalUrl} -> ${req.path}`);
  next();
}, createProxyMiddleware({
  target: 'http://127.0.0.1:4001',
  changeOrigin: true,
  timeout: 10000,
  proxyTimeout: 10000,
  logLevel: 'debug',
  onError: (err, req, res) => {
    console.error('🔍 [PROXY ERROR]:', err.message);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Proxy error', message: err.message });
    }
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔍 [PROXY REQ] ${req.method} ${req.originalUrl} -> ${proxyReq.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`🔍 [PROXY RES] ${proxyRes.statusCode} for ${req.originalUrl}`);
  }
}));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple proxy server running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Auth: http://localhost:${PORT}/api/auth/login`);
});