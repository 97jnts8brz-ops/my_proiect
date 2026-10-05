import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { build, P } from './scene.js';

const q = new URLSearchParams(location.search);
const shot = q.get('shot') || 'front_golden';
const W = +q.get('w') || 1920, Hh = +q.get('h') || 1080;
const SHOTS = {
  front_golden: { mode: 'day', sun: [0xffb066, 3.2, [-14, 7, 20]], sky: 0xf2c79a, fog: 0xf0c9a0, cam: [[10.5, 19.5, 3.4], [2.4, 4.0, 1.6], 34], env: 0.35, exp: 0.95 },
  front_night:  { mode: 'night', sun: [0x5a6fa8, 0.35, [-10, 12, 10]], sky: 0x0b1226, fog: 0x0b1226, cam: [[10.5, 19.0, 2.6], [2.4, 4.0, 1.8], 36], env: 0.08, exp: 1.15 },
  aerial:       { mode: 'day', sun: [0xffe2b8, 3.4, [-18, 22, 16]], sky: 0xb9d4ea, fog: 0xd6e3ee, cam: [[-9, 27, 25], [3.2, 8.0, 0.5], 40], env: 0.45, exp: 1.0 },
  delivery:     { mode: 'day', sun: [0xffd6a0, 3.0, [-16, 9, 6]], sky: 0xe9c9a2, fog: 0xe9cfae, cam: [[-6.4, 10.2, 1.8], [-0.6, 5.2, 1.3], 52], env: 0.4, exp: 0.95 },
  kitchen_cook: { mode: 'day', sun: [0xfff0d8, 1.2, [10, 14, 10]], sky: 0xd8d8d8, fog: 0xd8d8d8, cam: [[3.6, 5.3, 1.65], [1.9, 0.5, 1.15], 66], env: 0.55, exp: 1.05, interior: true },
  kitchen_hand: { mode: 'day', sun: [0xfff0d8, 1.2, [10, 14, 10]], sky: 0xd8d8d8, fog: 0xd8d8d8, cam: [[2.8, 1.5, 1.6], [2.2, 6.5, 1.55], 72], env: 0.55, exp: 1.05, interior: true },
};
const S = SHOTS[shot];
const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
r.setSize(W, Hh); r.setPixelRatio(1);
r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = S.exp;
document.body.appendChild(r.domElement);
const { scene, roof, ceil } = build(S.mode);
scene.background = new THREE.Color(S.sky);
scene.fog = new THREE.Fog(S.fog, 40, 140);
const pm = new THREE.PMREMGenerator(r);
scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = S.env;
scene.add(new THREE.HemisphereLight(S.sky, 0x6b5a45, S.mode === 'night' ? 0.25 : 0.55));
const sun = new THREE.DirectionalLight(S.sun[0], S.sun[1]); sun.position.set(...S.sun[2]); sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096); const sc = sun.shadow.camera; sc.left = -22; sc.right = 22; sc.top = 22; sc.bottom = -22; sc.near = 1; sc.far = 80; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
scene.add(sun);
const cam = new THREE.PerspectiveCamera(S.cam[2], W / Hh, 0.05, 300);
const [cx, cy, ch] = S.cam[0], [tx, ty, th] = S.cam[1];
cam.position.copy(P(cx, cy, ch)); cam.lookAt(P(tx, ty, th));
if (S.interior) { /* keep roof; interior lit by point lights + env */ }
window.__frame = () => { r.render(scene, cam); window.__ready = true; };
r.render(scene, cam); r.render(scene, cam); window.__ready = true;
window.__camPlan = () => cam.position.toArray();
