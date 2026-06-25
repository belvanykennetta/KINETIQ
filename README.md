# KINETIQ — 3D Gym Exercise Visualizer

A web-based gym education platform that lets users explore exercises with interactive **3D model previews**. Built as a Computer Graphics final project (Semester 4).

## What It Does

- Browse gym exercises grouped by category: **Push, Pull, Legs, Core**
- View real-time **3D animated `.glb` models** of each exercise using Three.js
- Filter exercises by category, search by keyword, or browse by muscle group
- REST API backend serving exercise data (title, muscles, tips, difficulty, equipment)

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Node.js + Express |
| Frontend | Vanilla JS + HTML/CSS |
| 3D Rendering | Three.js (GLTFLoader) |
| 3D Models | `.glb` files (Push / Pull / Legs / Core) |
| Data | JSON flat-file (`exercises.json`) |

## Project Structure

```
KINETIQ/
├── server/
│   ├── index.js              # Express entry point
│   ├── routes/exercises.js   # API route definitions
│   ├── controllers/          # Request handlers
│   ├── models/Exercise.js    # Data access layer
│   └── data/exercises.json   # Exercise database
├── public/
│   ├── index.html            # Single-page app shell
│   ├── js/
│   │   ├── app.js            # Main frontend logic
│   │   ├── api.js            # API client
│   │   └── viewer.js         # Three.js 3D viewer
│   └── css/
├── 3D Model (.glb)/
│   ├── Push/                 # e.g. Bench Press, Dips, Push-Up
│   ├── Pull/
│   ├── Legs/
│   └── Core/
└── package.json
```

## Setup & Run

**Prerequisites:** Node.js >= 16

```bash
# 1. Install dependencies
npm install

# 2. Start development server (auto-reload on change)
npm run dev

# 3. Or start production server
npm start
```

Open **http://localhost:3000** in your browser.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/exercises` | All exercises (optional `?category=push`) |
| GET | `/api/exercises/:id` | Single exercise by ID |
| GET | `/api/exercises/categories` | List of all categories |
| GET | `/api/search?q=keyword` | Search by title, muscle, tag |
| GET | `/api/category/:category` | Filter by category |
| GET | `/api/health` | Server health check |

## Exercise Data Schema

Each exercise in `exercises.json`:

```json
{
  "id": "1",
  "title": "Barbell Bench Press",
  "category": "push",
  "difficulty": "intermediate",
  "equipment": "Barbell",
  "muscles_primary": ["Pectoralis Major"],
  "muscles_secondary": ["Triceps", "Anterior Deltoid"],
  "tips": ["..."],
  "benefits": ["..."],
  "glb_path": "/models/Push/Barbell Bench Press.glb",
  "tags": ["chest", "push", "bench"]
}
```

## Notes

- 3D model files are large (36–44 MB each). Loading time depends on connection/disk speed.
- Models are served from `/models/` which maps to the `3D Model (.glb)/` directory.
- The app is a single-page app — all routes fall back to `index.html`.
