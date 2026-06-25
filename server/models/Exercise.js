// models/Exercise.js
// Data access layer — semua operasi baca/cari data latihan ada di sini.
// Kalau suatu saat mau migrasi ke SQLite/PostgreSQL, cukup ubah file ini saja,
// tanpa perlu sentuh controller atau routes.

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/exercises.json');
const LEGACY_GLB_PREFIX = '/3D Model (.glb)';
const PUBLIC_GLB_PREFIX = '/models';

function withPublicGlbPath(exercise) {
  if (!exercise?.glb_path) return exercise;

  return {
    ...exercise,
    glb_path: exercise.glb_path.replace(LEGACY_GLB_PREFIX, PUBLIC_GLB_PREFIX)
  };
}

function readAll() {
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  return JSON.parse(raw).map(withPublicGlbPath);
}

const Exercise = {
  // Ambil semua exercise (dengan optional filter category)
  getAll(category = null) {
    const data = readAll();
    if (!category) return data;
    return data.filter(ex => ex.category === category);
  },

  // Ambil satu exercise by ID
  getById(id) {
    const data = readAll();
    return data.find(ex => ex.id === String(id)) || null;
  },

  // Cari exercise by keyword (title, description, muscle, tags)
  search(query) {
    const data = readAll();
    const q = query.toLowerCase();
    return data.filter(ex => {
      return (
        ex.title.toLowerCase().includes(q) ||
        ex.description.toLowerCase().includes(q) ||
        ex.muscles_primary.some(m => m.toLowerCase().includes(q)) ||
        ex.muscles_secondary.some(m => m.toLowerCase().includes(q)) ||
        ex.tags.some(t => t.toLowerCase().includes(q)) ||
        ex.category.toLowerCase().includes(q)
      );
    });
  },

  // Ambil semua kategori unik
  getCategories() {
    const data = readAll();
    return [...new Set(data.map(ex => ex.category))];
  }
};

module.exports = Exercise;
