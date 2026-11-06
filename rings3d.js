/* =========================================================
   CINCIN KAHWIN 3D (Three.js)
   Dua cincin emas bertaut + berlian, terbang ikut scroll
   ========================================================= */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const canvas = document.getElementById("rings3d");
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
} catch (e) {
  document.body.classList.add("no-webgl");
  throw e;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
camera.position.z = 10;

// Lampu untuk kilauan bergerak
const key = new THREE.DirectionalLight(0xfff1d0, 2.4);
scene.add(key);
const warm = new THREE.PointLight(0xffc766, 25, 20);
warm.position.set(-3, -2, 3);
scene.add(warm);

/* ---------- Bahan ---------- */
const goldMat = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color(1.0, 0.77, 0.34), metalness: 1, roughness: 0.15,
  clearcoat: 0.6, clearcoatRoughness: 0.06, envMapIntensity: 1.5,
});
const champMat = goldMat.clone();
champMat.color = new THREE.Color(0.99, 0.86, 0.6);
champMat.roughness = 0.1;

const diaMat = new THREE.MeshPhysicalMaterial({
  color: 0xffffff, metalness: 0.05, roughness: 0, clearcoat: 1, flatShading: true,
  envMapIntensity: 7, iridescence: 1, iridescenceIOR: 2.0, iridescenceThicknessRange: [200, 800],
  transparent: true, opacity: 0.96,
});

/* ---------- Bina cincin ---------- */
const R = 1.15, T = 0.11;
const makeBand = (mat) => {
  const m = new THREE.Mesh(new THREE.TorusGeometry(R, T, 64, 220), mat);
  m.scale.z = 2.0; // band lebar & leper
  return m;
};

const rings = new THREE.Group();
scene.add(rings);
const pivot = new THREE.Group();
pivot.rotation.x = 0.75;
rings.add(pivot);

// Cincin pengantin lelaki
const groom = new THREE.Group();
groom.position.x = -0.5;
groom.add(makeBand(goldMat));
pivot.add(groom);

// Cincin pengantin perempuan (bertaut, berserenjang)
const bride = new THREE.Group();
bride.position.x = 0.5;
bride.rotation.x = Math.PI / 2;
const brideBand = makeBand(champMat);
brideBand.scale.set(0.94, 0.94, 1.7);
bride.add(brideBand);
pivot.add(bride);

// Berlian + mahkota
const y0 = R * 0.94 + T * 0.6;
const head = new THREE.Group();
head.position.y = y0;
bride.add(head);
const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.07, 0.18, 24), champMat);
cup.position.y = 0.09; head.add(cup);
const pav = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.0, 0.3, 16, 1), diaMat);
pav.position.y = 0.33; head.add(pav);
const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.3, 0.12, 16, 1), diaMat);
crown.position.y = 0.54; head.add(crown);
for (let i = 0; i < 4; i++) {
  const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
  const p = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.03, 0.46, 8), champMat);
  p.position.set(Math.cos(a) * 0.27, 0.36, Math.sin(a) * 0.27);
  head.add(p);
}

/* ---------- Kilauan bintang ---------- */
function starTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.12, "rgba(255,240,200,.85)");
  grd.addColorStop(0.4, "rgba(255,215,140,.15)");
  grd.addColorStop(1, "rgba(255,215,140,0)");
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  g.fillStyle = "rgba(255,252,240,.95)";
  g.beginPath();
  g.moveTo(64, 0); g.lineTo(67, 61); g.lineTo(128, 64); g.lineTo(67, 67);
  g.lineTo(64, 128); g.lineTo(61, 67); g.lineTo(0, 64); g.lineTo(61, 61);
  g.closePath(); g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const starTex = starTexture();
const sparkles = [];
function addSparkle(parent, pos, base, speed) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({
    map: starTex, color: 0xfff4d6, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, transparent: true,
  }));
  s.position.copy(pos);
  parent.add(s);
  sparkles.push({ s, base, speed, phase: Math.random() * 10 });
}
addSparkle(head, new THREE.Vector3(0, 0.62, 0), 0.9, 1.6);
addSparkle(head, new THREE.Vector3(0.12, 0.45, 0.1), 0.5, 2.3);
for (let i = 0; i < 4; i++) {
  const a = Math.random() * Math.PI * 2;
  addSparkle(groom, new THREE.Vector3(Math.cos(a) * (R + T), Math.sin(a) * (R + T), 0.1), 0.45, 1 + Math.random() * 1.5);
  const b = Math.random() * Math.PI * 2;
  addSparkle(bride, new THREE.Vector3(Math.cos(b) * (R + T) * 0.94, Math.sin(b) * (R + T) * 0.94, 0.1), 0.4, 1 + Math.random() * 1.5);
}

/* ---------- Habuk emas mengorbit ---------- */
const N = 220;
const dustGeo = new THREE.BufferGeometry();
const pos = new Float32Array(N * 3);
for (let i = 0; i < N; i++) {
  const r = 1.8 + Math.random() * 1.6, th = Math.random() * Math.PI * 2, ph = (Math.random() - 0.5) * 1.2;
  pos[i * 3] = Math.cos(th) * r; pos[i * 3 + 1] = ph * 1.5; pos[i * 3 + 2] = Math.sin(th) * r;
}
dustGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
  map: starTex, size: 0.09, color: 0xffd98a, transparent: true, opacity: 0.85,
  blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
}));
rings.add(dust);

/* ---------- Kedudukan ikut "stage" dalam halaman ---------- */
const stages = [...document.querySelectorAll("[data-ring-stage]")];
const isMobile = matchMedia("(max-width: 700px)").matches;
function target() {
  const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
  const halfW = halfH * camera.aspect;
  for (const st of stages) {
    const r = st.getBoundingClientRect();
    if (!r.height) continue;
    const cy = r.top + r.height / 2;
    if (cy > -r.height * 0.2 && cy < innerHeight + r.height * 0.2) {
      const x = ((r.left + r.width / 2) / innerWidth * 2 - 1) * halfW;
      const y = -(cy / innerHeight * 2 - 1) * halfH;
      const wH = (r.height / innerHeight) * 2 * halfH, wW = (r.width / innerWidth) * 2 * halfW;
      return { x, y, s: Math.min(wH / 2.9, wW / 3.8), o: 1 };
    }
  }
  // "terapung" di tepi semasa membaca
  return { x: halfW * 0.8, y: -halfH * 0.62, s: isMobile ? 0.3 : 0.4, o: isMobile ? 0.28 : 0.5 };
}

/* ---------- Interaksi ---------- */
let entered = !!window.__ringsEntered, spin = 0;
const cur = { x: 0, y: 0, s: 0, o: 0 };
addEventListener("rings:enter", () => { entered = true; spin = 9; });
addEventListener("rings:celebrate", () => { spin = 16; });
const mouse = { x: 0, y: 0 };
addEventListener("pointermove", (e) => { mouse.x = e.clientX / innerWidth - 0.5; mouse.y = e.clientY / innerHeight - 0.5; });
addEventListener("deviceorientation", (e) => {
  if (e.gamma == null) return;
  mouse.x = Math.max(-0.5, Math.min(0.5, e.gamma / 60));
  mouse.y = Math.max(-0.5, Math.min(0.5, ((e.beta || 45) - 45) / 60));
});

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener("resize", resize);
resize();

const clock = new THREE.Clock();
function loop() {
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  const tg = entered ? target() : { x: 0, y: 0, s: 0.001, o: 0 };
  const k = 1 - Math.pow(0.004, dt);
  cur.x += (tg.x - cur.x) * k; cur.y += (tg.y - cur.y) * k;
  cur.s += (tg.s - cur.s) * k; cur.o += (tg.o - cur.o) * k;

  rings.position.set(cur.x, cur.y + Math.sin(t * 1.2) * 0.05 * cur.s, 0);
  rings.scale.setScalar(Math.max(cur.s, 0.001));
  spin *= Math.pow(0.22, dt);
  rings.rotation.y += dt * (0.35 + spin);
  rings.rotation.x += ((mouse.y * 0.5 + Math.sin(t * 0.5) * 0.08) - rings.rotation.x) * 0.05;
  rings.rotation.z += ((-mouse.x * 0.3) - rings.rotation.z) * 0.05;
  canvas.style.opacity = cur.o.toFixed(3);

  key.position.set(Math.cos(t * 0.7) * 5, 4, Math.sin(t * 0.7) * 5 + 2);
  dust.rotation.y = -t * 0.08;
  for (const sp of sparkles) {
    const v = Math.pow(Math.max(0, Math.sin(t * sp.speed + sp.phase)), 8);
    sp.s.scale.setScalar(sp.base * (0.05 + v * 1.3));
    sp.s.material.rotation = t * 0.6;
  }
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
loop();
document.body.classList.add("webgl-ready");
