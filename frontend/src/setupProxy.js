const { createProxyMiddleware } = require('http-proxy-middleware');

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8001');

module.exports = function (app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: BACKEND_URL,
      changeOrigin: true,
      secure: false,
    })
  );
  app.use(
    '/uploads',
    createProxyMiddleware({
      target: BACKEND_URL,
      changeOrigin: true,
      secure: false,
    })
  );
  app.use(
    '/api/media',
    createProxyMiddleware({
      target: BACKEND_URL,
      changeOrigin: true,
      secure: false,
    })
  );
};