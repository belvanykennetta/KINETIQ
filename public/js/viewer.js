// public/js/viewer.js
// Menginisialisasi Three.js scene untuk menampilkan file .glb
// dengan fitur rotate (klik+drag), zoom (scroll), dan pan (klik kanan+drag)
// via OrbitControls.

class GLBViewer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.scene     = null;
    this.camera    = null;
    this.renderer  = null;
    this.controls  = null;
    this.model     = null;
    this.animFrame = null;

    this._init();
  }

  _init() {
    const W = this.container.clientWidth  || 480;
    const H = this.container.clientHeight || 480;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f1117); // match --bg-base

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, W / H, 0.01, 100);
    this.camera.position.set(0, 1.2, 3.5);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(W, H);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    this.scene.add(dirLight);

    // Accent rim light (indigo, sesuai tema)
    const rimLight = new THREE.PointLight(0x6366f1, 1.5, 8);
    rimLight.position.set(-3, 2, -2);
    this.scene.add(rimLight);

    // OrbitControls — rotate, zoom, pan
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping    = true;
    this.controls.dampingFactor    = 0.06;
    this.controls.minDistance      = 0.5;
    this.controls.maxDistance      = 15;
    this.controls.target.set(0, 0.8, 0);
    this.controls.update();

    // Handle resize
    window.addEventListener('resize', () => this._onResize());

    // Start render loop
    this._animate();
  }

  _animate() {
    this.animFrame = requestAnimationFrame(() => this._animate());
    this.controls?.update();
    this.renderer.render(this.scene, this.camera);
  }

  _onResize() {
    if (!this.container) return;
    const W = this.container.clientWidth;
    const H = this.container.clientHeight;
    this.camera.aspect = W / H;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(W, H);
  }

  // Muat file .glb dari path
  loadModel(glbPath) {
    glbPath = this._normalizeModelPath(glbPath);

    // Hapus model lama kalau ada
    if (this.model) {
      this.scene.remove(this.model);
      this.model = null;
    }

    // Tampilkan loading spinner
    this._showLoading(true);

    const loader = new THREE.GLTFLoader();
    loader.load(
      glbPath,
      (gltf) => {
        this.model = gltf.scene;

        // Auto-center dan scale agar model pas di viewport
        const box    = new THREE.Box3().setFromObject(this.model);
        const size   = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale  = 2.0 / maxDim;

        this.model.scale.setScalar(scale);
        this.model.position.sub(center.multiplyScalar(scale));

        this.scene.add(this.model);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
        this._showLoading(false);
      },
      (xhr) => {
        // Progress — bisa digunakan untuk progress bar
        const pct = Math.round((xhr.loaded / xhr.total) * 100);
        this._updateLoadingText(`Memuat model... ${pct}%`);
      },
      (err) => {
        console.warn('GLB tidak ditemukan atau gagal dimuat:', glbPath, err);
        this._showPlaceholder();
        this._showLoading(false);
      }
    );
  }

  _normalizeModelPath(glbPath) {
    if (!glbPath) return glbPath;
    return glbPath.replace(/^\/3D Model \(\.glb\)/, '/models');
  }

  // Tampilkan placeholder mesh jika .glb belum ada
  _showPlaceholder() {
    if (this.model) {
      this.scene.remove(this.model);
      this.model = null;
    }
    const geo  = new THREE.TorusKnotGeometry(0.7, 0.25, 120, 16);
    const mat  = new THREE.MeshStandardMaterial({
      color: 0x6366f1,
      roughness: 0.3,
      metalness: 0.6,
      wireframe: false
    });
    this.model = new THREE.Mesh(geo, mat);
    this.scene.add(this.model);

    // Putar perlahan sebagai animasi idle
    const rotate = () => {
      if (!this.model) return;
      this.model.rotation.y += 0.005;
      requestAnimationFrame(rotate);
    };
    rotate();
  }

  _showLoading(show) {
    const el = document.getElementById('viewer-loading');
    if (el) el.style.display = show ? 'flex' : 'none';
  }

  _updateLoadingText(text) {
    const el = document.getElementById('viewer-loading-text');
    if (el) el.textContent = text;
  }

  // Destroy viewer (bersihkan memory saat pindah halaman)
  destroy() {
    cancelAnimationFrame(this.animFrame);
    if (this.renderer) {
      this.renderer.dispose();
      this.container?.removeChild(this.renderer.domElement);
    }
    this.scene     = null;
    this.camera    = null;
    this.renderer  = null;
    this.controls  = null;
    this.model     = null;
  }
}

window.GLBViewer = GLBViewer;
