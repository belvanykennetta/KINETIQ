// public/js/api.js
// Semua komunikasi ke backend ada di sini.
// Komponen lain cukup import fungsi ini — tidak perlu tahu URL atau format response.

const API_BASE = '/api';

const api = {
  // Ambil semua exercise, optional filter by category
  async getExercises(category = null) {
    const url = category
      ? `${API_BASE}/exercises?category=${encodeURIComponent(category)}`
      : `${API_BASE}/exercises`;
    const res = await fetch(url);
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  // Ambil detail satu exercise by ID
  async getExerciseById(id) {
    const res = await fetch(`${API_BASE}/exercises/${id}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  // Cari exercise by keyword
  async searchExercises(query) {
    const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  // Ambil semua kategori
  async getCategories() {
    const res = await fetch(`${API_BASE}/exercises/categories`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }
};

window.api = api;
