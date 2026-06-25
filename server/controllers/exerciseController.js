// controllers/exerciseController.js
// Controller bertugas sebagai penghubung antara route dan model.
// Tidak ada logika bisnis di route, tidak ada akses data di controller —
// masing-masing layer punya tanggung jawab sendiri.

const Exercise = require('../models/Exercise');

const exerciseController = {

  // GET /api/exercises
  // Jika ada query ?category=xxx, filter berdasarkan kategori
  getAll(req, res) {
    try {
      const { category } = req.query;
      const data = Exercise.getAll(category || null);
      res.json({ success: true, count: data.length, data });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Gagal mengambil data latihan', error: err.message });
    }
  },

  // GET /api/exercises/:id
  getById(req, res) {
    try {
      const exercise = Exercise.getById(req.params.id);
      if (!exercise) {
        return res.status(404).json({ success: false, message: `Exercise dengan ID ${req.params.id} tidak ditemukan` });
      }
      res.json({ success: true, data: exercise });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Gagal mengambil detail latihan', error: err.message });
    }
  },

  // GET /api/search?q=bench
  search(req, res) {
    try {
      const { q } = req.query;
      if (!q || q.trim() === '') {
        return res.status(400).json({ success: false, message: 'Parameter pencarian "q" diperlukan' });
      }
      const results = Exercise.search(q.trim());
      res.json({ success: true, query: q, count: results.length, data: results });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Pencarian gagal', error: err.message });
    }
  },

  // GET /api/categories
  getCategories(req, res) {
    try {
      const categories = Exercise.getCategories();
      res.json({ success: true, data: categories });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Gagal mengambil kategori', error: err.message });
    }
  }
};

module.exports = exerciseController;
