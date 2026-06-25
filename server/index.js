// server/index.js
// Entry point Express.js. Mengatur middleware, routes, static files,
// dan menjalankan server.

const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());                          // Izinkan request dari origin apapun (dev-mode)
app.use(express.json());                  // Parse JSON request body
app.use(express.urlencoded({ extended: true }));

// ── Static Files ────────────────────────────────────────────────────────────
// Serve seluruh folder public/ sebagai file statis.
// File .glb di folder "3D Model (.glb)" bisa diakses via /models/namafile.glb
app.use(express.static(path.join(__dirname, '../public')));
app.use('/models', express.static(path.join(__dirname, '../3D Model (.glb)')));

// ── API Routes ───────────────────────────────────────────────────────────────
const exerciseRoutes = require('./routes/exercises.js');

app.use('/api/exercises', exerciseRoutes);

// GET /api/search?q=bench  (shorthand route)
app.get('/api/search', (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ success: false, message: 'Parameter q diperlukan' });

  const Exercise = require('./models/Exercise');
  const results = Exercise.search(q.trim());
  res.json({ success: true, query: q, count: results.length, data: results });
});

// GET /api/category/:category  (alternative filter route)
app.get('/api/category/:category', (req, res) => {
  const Exercise = require('./models/Exercise');
  const data = Exercise.getAll(req.params.category);
  res.json({ success: true, count: data.length, data });
});

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'KINETIQ API is running', timestamp: new Date().toISOString() });
});

// ── Catch-All: Serve index.html untuk SPA routing ────────────────────────────
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🏋️  KINETIQ Server running at http://localhost:${PORT}`);
  console.log(`📡 API Endpoints:`);
  console.log(`   GET /api/exercises`);
  console.log(`   GET /api/exercises/:id`);
  console.log(`   GET /api/exercises/categories`);
  console.log(`   GET /api/search?q=keyword`);
  console.log(`   GET /api/category/:category`);
  console.log(`   GET /api/health\n`);
});

module.exports = app;
