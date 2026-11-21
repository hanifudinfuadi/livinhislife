const { createProxyMiddleware } = require('http-proxy-middleware');

// Backend local berjalan di port 8001 (lihat package.json "dev:backend").
// `typeof window` tidak pernah terdefinisi di Node, jadi default-nya harus
// eksplisit di sini; kalau tidak, proxy jatuh ke origin undefined.
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const proxy = () =>
  createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
    secure: false,
  });

module.exports = function (app) {
  // Urutan penting: /api/media harus dipasang sebelum /api.
  app.use('/api/media', proxy());
  // Endpoint yang sama dibuka backend di root (mis. media_url() mengembalikan
  // "/api/media/..."), jadi /api sudah mencakup semuanya.
  app.use('/api', proxy());
  app.use('/uploads', proxy());
};
