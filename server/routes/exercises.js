// routes/exercises.js
// Route hanya mendefinisikan endpoint dan memanggil controller.
// Tidak ada logika bisnis di sini.

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/exerciseController');

// GET /api/exercises?category=push
router.get('/', ctrl.getAll);

// GET /api/exercises/categories  <- harus di atas /:id agar tidak diparse sebagai ID
router.get('/categories', ctrl.getCategories);

// GET /api/exercises/:id
router.get('/:id', ctrl.getById);

module.exports = router;
