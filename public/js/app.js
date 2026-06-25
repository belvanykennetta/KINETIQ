// public/js/app.js
// Orkestrasi utama: page routing, render exercise list, detail view,
// search, filter by category, dan integrasi Three.js viewer.

// ── State ────────────────────────────────────────────────────────────────────
const state = {
  exercises: [],       // semua exercise dari API
  filtered: [],        // exercise yang sedang ditampilkan (setelah filter/search)
  categories: [],      // daftar kategori unik
  activeCategory: null,
  searchQuery: '',
  layout: 'stack',
  activeCardIndex: 0,
  currentPage: 'home', // 'home' | 'exercise' | 'detail'
  viewer: null,        // instance GLBViewer
};

// ── Page Router ───────────────────────────────────────────────────────────────
function showPage(page, data = null) {
  // Destroy Three.js viewer saat meninggalkan halaman detail
  if (state.currentPage === 'detail' && page !== 'detail') {
    state.viewer?.destroy();
    state.viewer = null;
  }

  state.currentPage = page;

  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));

  if (page === 'home') {
    document.getElementById('page-home').classList.add('active');
    document.getElementById('nav-home').classList.add('active');
  } else if (page === 'exercise') {
    document.getElementById('page-exercise').classList.add('active');
    document.getElementById('nav-exercise').classList.add('active');
    loadAndRenderExercises();
  } else if (page === 'detail' && data) {
    document.getElementById('page-detail').classList.add('active');
    renderDetail(data);
  }
}

// ── Exercise List ─────────────────────────────────────────────────────────────
async function loadAndRenderExercises() {
  try {
    showExerciseLoading(true);

    // Ambil data + kategori secara paralel
    const [exercises, categories] = await Promise.all([
      api.getExercises(),
      api.getCategories()
    ]);

    state.exercises = exercises;
    state.filtered  = exercises;
    state.categories = categories;

    renderCategoryFilter();
    renderExerciseCards();
    showExerciseLoading(false);
  } catch (err) {
    showExerciseLoading(false);
    document.getElementById('cards-area').innerHTML =
      `<div class="error-msg">⚠️ Gagal memuat data latihan: ${err.message}</div>`;
  }
}

function renderCategoryFilter() {
  const container = document.getElementById('category-filter');
  if (!container) return;

  const categories = ['all', ...state.categories];
  container.innerHTML = categories.map(cat => `
    <button
      class="filter-btn ${(cat === 'all' && !state.activeCategory) || cat === state.activeCategory ? 'active' : ''}"
      onclick="filterByCategory('${cat}')"
    >
      ${cat === 'all' ? 'Semua' : capitalizeFirst(cat)}
    </button>
  `).join('');
}

function filterByCategory(cat) {
  state.activeCategory = cat === 'all' ? null : cat;
  state.searchQuery    = '';
  document.getElementById('search-input').value = '';

  state.filtered = state.activeCategory
    ? state.exercises.filter(ex => ex.category === state.activeCategory)
    : [...state.exercises];

  state.activeCardIndex = 0;
  renderCategoryFilter();
  renderExerciseCards();
}

async function handleSearch(query) {
  state.searchQuery    = query;
  state.activeCategory = null;

  if (!query.trim()) {
    state.filtered = [...state.exercises];
    renderCategoryFilter();
    renderExerciseCards();
    return;
  }

  try {
    state.filtered = await api.searchExercises(query.trim());
    state.activeCardIndex = 0;
    renderCategoryFilter();
    renderExerciseCards();
  } catch (err) {
    console.error('Search error:', err);
  }
}

// ── Card Renderer ─────────────────────────────────────────────────────────────
function renderExerciseCards() {
  const area = document.getElementById('cards-area');
  if (!area) return;

  const exercises = state.filtered;

  if (exercises.length === 0) {
    area.innerHTML = `<div class="empty-msg">Tidak ada latihan ditemukan 🔍</div>`;
    return;
  }

  if (state.layout === 'stack') {
    renderStackLayout(exercises, area);
  } else if (state.layout === 'grid') {
    renderGridLayout(exercises, area);
  } else {
    renderListLayout(exercises, area);
  }
}

function cardHTML(ex, extraClass = '') {
  const diffColor = { beginner: '#4ade80', intermediate: '#facc15', advanced: '#f87171' };
  const color = diffColor[ex.difficulty] || '#818cf8';
  return `
    <div class="workout-card ${extraClass}" onclick="openDetail('${ex.id}')">
      <div class="card-icon-wrap"><i class="ti ${ex.icon}" aria-hidden="true"></i></div>
      <div class="card-title">${ex.title}</div>
      <div class="card-desc">${ex.description.substring(0, 90)}...</div>
      <div class="card-meta">
        <span class="diff-badge" style="background:${color}22;color:${color};border:1px solid ${color}44">
          ${capitalizeFirst(ex.difficulty)}
        </span>
        <span class="cat-badge">${capitalizeFirst(ex.category)}</span>
      </div>
    </div>`;
}

function renderStackLayout(exercises, area) {
  const idx = state.activeCardIndex % exercises.length;
  const ordered = exercises.map((ex, i) => ({
    ...ex,
    stackPos: (i - idx + exercises.length) % exercises.length
  })).sort((a, b) => b.stackPos - a.stackPos);

  area.innerHTML = `
    <div class="cards-stack-wrapper">
      ${ordered.map(ex => {
        const pos = ex.stackPos;
        const isTop = pos === 0;
        return `
          <div class="workout-card stack-mode stack-${Math.min(pos, 3)} ${isTop ? 'active-top' : ''}"
               onclick="${isTop ? `openDetail('${ex.id}')` : 'advanceCard()'}">
            ${isTop ? `
              <div class="card-icon-wrap"><i class="ti ${ex.icon}"></i></div>
              <div class="card-title">${ex.title}</div>
              <div class="card-desc">${ex.description.substring(0, 90)}...</div>
              <div class="card-meta" style="margin-top:8px">
                <span class="diff-badge">${capitalizeFirst(ex.difficulty)}</span>
                <span class="cat-badge">${capitalizeFirst(ex.category)}</span>
              </div>
              <div class="swipe-hint">Klik untuk detail · ${idx + 1} / ${exercises.length} &nbsp;|&nbsp; <span onclick="event.stopPropagation();advanceCard()">Next →</span></div>
            ` : ''}
          </div>`;
      }).join('')}
    </div>
    <div class="dot-nav">
      ${exercises.map((_, i) => `<div class="dot ${i === idx ? 'active' : ''}" onclick="goCard(${i})"></div>`).join('')}
    </div>`;
}

function renderGridLayout(exercises, area) {
  area.innerHTML = `<div class="cards-grid">${exercises.map(ex => cardHTML(ex, 'grid-mode')).join('')}</div>`;
}

function renderListLayout(exercises, area) {
  area.innerHTML = `<div class="cards-list">
    ${exercises.map(ex => `
      <div class="workout-card list-mode" onclick="openDetail('${ex.id}')">
        <div class="card-icon-wrap" style="margin-bottom:0;flex-shrink:0"><i class="ti ${ex.icon}"></i></div>
        <div style="flex:1">
          <div class="card-title">${ex.title}</div>
          <div style="font-size:12px;color:var(--text-secondary);margin-top:2px">${ex.description.substring(0, 70)}...</div>
        </div>
        <span class="diff-badge">${capitalizeFirst(ex.difficulty)}</span>
      </div>`).join('')}
  </div>`;
}

function advanceCard() {
  state.activeCardIndex = (state.activeCardIndex + 1) % state.filtered.length;
  renderExerciseCards();
}

function goCard(i) {
  state.activeCardIndex = i;
  renderExerciseCards();
}

function setLayout(layout) {
  state.layout = layout;
  ['stack', 'grid', 'list'].forEach(l => {
    document.getElementById('btn-' + l).classList.toggle('active', l === layout);
  });
  renderExerciseCards();
}

// ── Detail Page ───────────────────────────────────────────────────────────────
async function openDetail(id) {
  try {
    const exercise = await api.getExerciseById(id);
    showPage('detail', exercise);
  } catch (err) {
    alert('Gagal memuat detail: ' + err.message);
  }
}

function renderDetail(ex) {
  const diffColor = { beginner: '#4ade80', intermediate: '#facc15', advanced: '#f87171' };
  const color = diffColor[ex.difficulty] || '#818cf8';

  document.getElementById('detail-content').innerHTML = `
    <div class="detail-header">
      <div>
        <div class="detail-category">${capitalizeFirst(ex.category)}</div>
        <h1 class="detail-title">${ex.title}</h1>
        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
          <span class="diff-badge" style="background:${color}22;color:${color};border:1px solid ${color}44;font-size:12px;padding:4px 12px;border-radius:20px">
            ${capitalizeFirst(ex.difficulty)}
          </span>
          <span class="detail-equipment"><i class="ti ti-tool"></i> ${ex.equipment}</span>
        </div>
      </div>
    </div>

    <div class="detail-grid">
      <!-- Left: 3D Viewer -->
      <div class="viewer-panel">
        <div class="viewer-label">Model 3D Interaktif</div>
        <div id="glb-container" class="glb-container">
          <div id="viewer-loading" class="viewer-loading">
            <div class="viewer-spinner"></div>
            <span id="viewer-loading-text">Memuat model...</span>
          </div>
        </div>
        <div class="viewer-controls-hint">
          <i class="ti ti-mouse"></i> Drag: Rotate &nbsp;|&nbsp;
          <i class="ti ti-zoom-in"></i> Scroll: Zoom &nbsp;|&nbsp;
          <i class="ti ti-hand-finger"></i> Kanan: Pan
        </div>
      </div>

      <!-- Right: Info -->
      <div class="detail-info">
        <div class="detail-section">
          <div class="section-label">Deskripsi</div>
          <p class="detail-desc">${ex.description}</p>
        </div>

        <div class="detail-section">
          <div class="section-label">Otot Utama</div>
          <div class="muscle-tags">
            ${ex.muscles_primary.map(m => `<span class="muscle-tag primary">${m}</span>`).join('')}
          </div>
        </div>

        <div class="detail-section">
          <div class="section-label">Otot Pendukung</div>
          <div class="muscle-tags">
            ${ex.muscles_secondary.map(m => `<span class="muscle-tag secondary">${m}</span>`).join('')}
          </div>
        </div>

        <div class="detail-section">
          <div class="section-label">Tips Teknik</div>
          <ul class="tips-list">
            ${ex.tips.map(t => `<li><i class="ti ti-check"></i> ${t}</li>`).join('')}
          </ul>
        </div>

        <div class="detail-section">
          <div class="section-label">Manfaat</div>
          <ul class="tips-list benefits">
            ${ex.benefits.map(b => `<li><i class="ti ti-star"></i> ${b}</li>`).join('')}
          </ul>
        </div>
      </div>
    </div>
  `;

  // Init Three.js viewer setelah DOM dirender
  requestAnimationFrame(() => {
    state.viewer = new GLBViewer('glb-container');
    state.viewer.loadModel(ex.glb_path);
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function capitalizeFirst(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

function showExerciseLoading(show) {
  const el = document.getElementById('exercise-loading');
  if (el) el.style.display = show ? 'flex' : 'none';
  const area = document.getElementById('cards-area');
  if (area) area.style.display = show ? 'none' : 'block';
}

// ── Text Cycle (Home) ─────────────────────────────────────────────────────────
const WORDS = ['workouts', 'progress', 'performance', 'training', 'strength', 'form', 'goals', 'body'];
let wordIdx = 0;
setInterval(() => {
  wordIdx = (wordIdx + 1) % WORDS.length;
  const el = document.getElementById('cycle-word');
  if (!el) return;
  el.style.opacity = '0';
  el.style.transform = 'translateY(-10px)';
  setTimeout(() => {
    el.textContent = WORDS[wordIdx];
    el.style.transition = 'opacity 0.35s, transform 0.35s';
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  }, 300);
}, 2500);

// ── Testimonials (Home) ───────────────────────────────────────────────────────
const TESTIMONIALS = [
  { text: 'This application revolutionized my workout operations, streamlining metrics and posture analysis.', name: 'Briana Patton', role: 'Fitness Coach', initials: 'BP' },
  { text: 'Implementing KINETIQ tracking was smooth and quick. The UI is completely intuitive.', name: 'Bilal Ahmed', role: 'Athlete', initials: 'BA' },
  { text: 'The 3D interactive layout and real-time responses keep me motivated every single day.', name: 'Saman Malik', role: 'Gym Enthusiast', initials: 'SM' },
  { text: 'Its robust features and quick support transformed our training workflows entirely.', name: 'Omar Raza', role: 'Calisthenics Specialist', initials: 'OR' },
  { text: 'The posture feedback is next-level. Never trained so precisely with real-time motion data.', name: 'Leila Hart', role: 'Yoga Instructor', initials: 'LH' },
  { text: 'Clean design, powerful under the hood. Kinetiq is the only fitness tool I need.', name: 'James Kroft', role: 'Personal Trainer', initials: 'JK' },
];

function renderTestimonials() {
  const cols = document.getElementById('testimonials-cols');
  if (!cols) return;
  const makeCard = (t) => `
    <div class="testimonial-card">
      <p class="testimonial-text">${t.text}</p>
      <div class="testimonial-author">
        <div class="author-avatar">${t.initials}</div>
        <div>
          <div class="author-name">${t.name}</div>
          <div class="author-role">${t.role}</div>
        </div>
      </div>
    </div>`;
  const makeCol = (items, cls) => {
    const doubled = [...items, ...items];
    return `<div class="testimonials-col">
      <div class="testimonials-col-track ${cls}">${doubled.map(makeCard).join('')}</div>
    </div>`;
  };
  cols.innerHTML =
    makeCol([TESTIMONIALS[0], TESTIMONIALS[1], TESTIMONIALS[2]], 'col-a') +
    makeCol([TESTIMONIALS[2], TESTIMONIALS[3], TESTIMONIALS[4]], 'col-b') +
    makeCol([TESTIMONIALS[4], TESTIMONIALS[5], TESTIMONIALS[0]], 'col-c');
}
renderTestimonials();

// ── Cursor Spotlight (Exercise Page) ─────────────────────────────────────────
document.addEventListener('mousemove', (e) => {
  const sp = document.getElementById('exercise-spotlight-cursor');
  if (!sp) return;
  const page = document.getElementById('page-exercise');
  if (!page || !page.classList.contains('active')) return;
  const rect = page.getBoundingClientRect();
  sp.style.left = (e.clientX - rect.left - 175) + 'px';
  sp.style.top  = (e.clientY - rect.top  - 175) + 'px';
});

// ── Search Debounce ───────────────────────────────────────────────────────────
let searchTimeout;
function onSearchInput(e) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => handleSearch(e.target.value), 350);
}

// Expose ke global scope (dipanggil dari HTML onclick)
window.showPage      = showPage;
window.setLayout     = setLayout;
window.advanceCard   = advanceCard;
window.goCard        = goCard;
window.filterByCategory = filterByCategory;
window.onSearchInput = onSearchInput;
window.openDetail    = openDetail;
