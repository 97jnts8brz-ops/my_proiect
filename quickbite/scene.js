import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// ---------- coordinate helpers: plan (x right, y back->front, h up) -> three ----------
// three.x = x-3.25 ; three.z = y-3.25 (front facade at +z) ; three.y = h
const OX = 3.25, OZ = 3.25;
export const P = (x, y, h = 0) => new THREE.Vector3(x - OX, h, y - OZ);

const C = { red: 0xC7311F, red2: 0xD62718, yellow: 0xFFC72C, char: 0x3a3d42, white: 0xf2f2f0 };

export function build(mode = 'day') {
  const scene = new THREE.Scene();
  const night = mode === 'night';
  const lights = []; // point lights toggled by mode

  // ---------- materials ----------
  const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0, ...o });
  const mat = {
    charcoal: M(C.char, { roughness: 0.35, metalness: 0.55 }),
    red: M(C.red, { roughness: 0.4, metalness: 0.2 }),
    yellow: M(C.yellow, { roughness: 0.45 }),
    white: M(C.white, { roughness: 0.5 }),
    ceramic: M(0xf6f6f4, { roughness: 0.12, metalness: 0.0 }),
    steel: M(0xc9ccd0, { roughness: 0.22, metalness: 1.0 }),
    steelDark: M(0x8e9298, { roughness: 0.35, metalness: 1.0 }),
    black: M(0x151515, { roughness: 0.5, metalness: 0.4 }),
    rubber: M(0x1b1b1b, { roughness: 0.9 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xbfd8e6, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.22, side: THREE.DoubleSide }),
    asphalt: M(0x35373a, { roughness: 0.95 }),
    concrete: M(0xb9b4a8, { roughness: 0.9 }),
    sand: M(0xcdb68b, { roughness: 1 }),
    lineW: M(0xf4f4f4, { roughness: 0.8 }),
    ceilPanel: M(0xeeeeee, { roughness: 0.8 }),
    led: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff2d0, emissiveIntensity: night ? 4 : 1.2 }),
    ledYellow: new THREE.MeshStandardMaterial({ color: C.yellow, emissive: C.yellow, emissiveIntensity: night ? 3 : 0.5 }),
    wood: M(0x9a7b57, { roughness: 0.7 }),
  };

  function tex(w, h, draw, repeat) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); draw(g, w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
    return t;
  }
  const tileTex = (base, grout, repeat) => tex(256, 256, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h); g.strokeStyle = grout; g.lineWidth = 4;
    g.strokeRect(0, 0, w, h);
  }, repeat);

  // ---------- generic box in plan coords ----------
  function box(x0, x1, y0, y1, h0, h1, m, parent = scene, shadow = true) {
    const g = new THREE.BoxGeometry(x1 - x0, h1 - h0, y1 - y0);
    const me = new THREE.Mesh(g, m);
    me.position.copy(P((x0 + x1) / 2, (y0 + y1) / 2, (h0 + h1) / 2));
    me.castShadow = me.receiveShadow = shadow;
    parent.add(me); return me;
  }
  function cyl(x, y, h0, h1, r, m, parent = scene, seg = 24) {
    const me = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h1 - h0, seg), m);
    me.position.copy(P(x, y, (h0 + h1) / 2)); me.castShadow = me.receiveShadow = true; parent.add(me); return me;
  }

  // ---------- ground / site ----------
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), mat.sand);
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; ground.position.y = -0.02; scene.add(ground);
  // asphalt lot in front of building (plan y 6.65 .. 14), x -3..9.5
  const lotX0 = -3.4, lotX1 = 9.9, lotY0 = 6.65, lotY1 = 14.2;
  box(lotX0, lotX1, lotY0, lotY1, -0.02, 0.0, mat.asphalt, scene, false);
  // side paving around building
  box(-3.4, 9.9, -2.5, 6.65, -0.02, 0.0, mat.concrete, scene, false);
  // street
  box(-60, 60, 17.5, 25.5, -0.02, 0.0, mat.asphalt, scene, false);
  box(-60, 60, 14.2, 17.5, -0.02, 0.04, mat.concrete, scene, false); // sidewalk
  for (let x = -58; x < 58; x += 6) box(x, x + 3, 21.4, 21.6, 0, 0.005, M(0xe6c200), scene, false);
  box(-60, 60, 25.5, 28.5, -0.02, 0.04, mat.concrete, scene, false);

  // bays: 5 bays 2.6 wide, 5.0 deep. bay 1 (delivery) at far left.
  const bayW = 2.6, bayY0 = 8.8, bayY1 = 13.8, bayX0 = -3.0;
  const bayCx = (i) => bayX0 + bayW * i + bayW / 2; // i=0..4
  for (let i = 0; i <= 5; i++) box(bayX0 + bayW * i - 0.04, bayX0 + bayW * i + 0.04, bayY0, bayY1, 0, 0.006, mat.lineW, scene, false);
  box(bayX0, bayX0 + bayW * 5, bayY0 - 0.04, bayY0 + 0.04, 0, 0.006, mat.lineW, scene, false);
  for (let i = 0; i < 5; i++) { // wheel stops
    box(bayCx(i) - 0.7, bayCx(i) + 0.7, bayY0 + 0.35, bayY0 + 0.55, 0, 0.1, mat.yellow);
  }
  // delivery bay 1 hatch (yellow outline)
  box(bayCx(0) - 1.2, bayCx(0) + 1.2, bayY0 + 0.1, bayY0 + 0.16, 0.006, 0.01, mat.yellow, scene, false);

  // bay number signs (red post signs, bays 1..4 customers are 2..5? -> brief: red numbered signs 1-4 for customer bays)
  function signPost(x, y, text, color, w = 0.45) {
    const grp = new THREE.Group(); scene.add(grp);
    cyl(x, y, 0, 1.5, 0.025, mat.steelDark, grp, 12);
    const t = tex(128, 128, (g, W, H) => { g.fillStyle = color; g.fillRect(0, 0, W, H); g.fillStyle = '#fff'; g.font = 'bold 84px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, W / 2, H / 2 + 4); });
    const pl = new THREE.Mesh(new THREE.BoxGeometry(w, w, 0.03), [M(0x222), M(0x222), M(0x222), M(0x222), new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: night ? 0.8 : 0.1 }), M(0x222)]);
    pl.position.copy(P(x, y + 0.03, 1.55)); pl.castShadow = true; grp.add(pl);
  }
  // customer bays are bays 2..5 → numbered 1..4 per brief; the delivery bay carries a "D" style sign
  for (let i = 1; i < 5; i++) signPost(bayCx(i), bayY0 + 0.1, String(i), '#C7311F');

  // ---------- building ----------
  const bld = new THREE.Group(); scene.add(bld);
  const H = 4.0, WH = 3.2; // parapet, structural ceiling
  const T = 0.15, SK = 0.05;

  // wall run along X at front (y=6.5..) or back; pieces by openings
  function wallX(yIn, outDir, openings, skinMat, innerMat) {
    // yIn: interior face y; outDir +1 front (y grows) / -1 back
    const segs = []; let cur = -T;
    const ops = [...openings].sort((a, b) => a.a - b.a);
    const add = (x0, x1, h0, h1) => {
      if (x1 - x0 < 1e-4 || h1 - h0 < 1e-4) return;
      const yi0 = outDir > 0 ? yIn : yIn - (T - SK), yi1 = outDir > 0 ? yIn + (T - SK) : yIn;
      const ys0 = outDir > 0 ? yIn + (T - SK) : yIn - T, ys1 = outDir > 0 ? yIn + T : yIn - (T - SK);
      box(x0, x1, yi0, yi1, h0, h1, innerMat, bld);
      box(x0, x1, ys0, ys1, h0, h1, skinMat, bld);
    };
    for (const o of ops) { add(cur, o.a, 0, H); add(o.a, o.b, 0, o.h0); add(o.a, o.b, o.h1, H); cur = o.b; }
    add(cur, 6.5 + T, 0, H);
  }
  function wallY(xIn, outDir, openings, skinMat, innerMat, y0 = -T, y1 = 6.5 + T) {
    let cur = y0;
    const ops = [...openings].sort((a, b) => a.a - b.a);
    const add = (a0, a1, h0, h1) => {
      if (a1 - a0 < 1e-4 || h1 - h0 < 1e-4) return;
      const xi0 = outDir > 0 ? xIn : xIn - (T - SK), xi1 = outDir > 0 ? xIn + (T - SK) : xIn;
      const xs0 = outDir > 0 ? xIn + (T - SK) : xIn - T, xs1 = outDir > 0 ? xIn + T : xIn - (T - SK);
      box(xi0, xi1, a0, a1, h0, h1, innerMat, bld);
      box(xs0, xs1, a0, a1, h0, h1, skinMat, bld);
    };
    for (const o of ops) { add(cur, o.a, 0, H); add(o.a, o.b, 0, o.h0); add(o.a, o.b, o.h1, H); cur = o.b; }
    add(cur, y1, 0, H);
  }
  // interior finish: ceramic lower / paint upper handled by an inner skin overlay
  const paint = M(0xe9e7e1, { roughness: 0.85 });
  const innerMat = mat.ceramic;

  // front (y=6.5): service window x0.9-3.3 (sill 1.0, head 2.2); staff door x5.35-6.35 (h 2.1)
  wallX(6.5, +1, [{ a: 0.9, b: 3.3, h0: 1.0, h1: 2.2 }, { a: 5.35, b: 6.35, h0: 0, h1: 2.1 }], mat.charcoal, innerMat);
  wallX(0, -1, [], mat.charcoal, innerMat);
  // left (x=0): delivery window y4.2-5.4 (sill 1.0, head 2.2)
  wallY(0, -1, [{ a: 4.2, b: 5.4, h0: 1.0, h1: 2.2 }], mat.charcoal, innerMat);
  wallY(6.5, +1, [], mat.charcoal, innerMat);

  // cladding grooves + red accents on front facade
  for (let i = 0; i < 26; i++) {
    const x = -0.1 + i * 0.25; if ((x > 0.85 && x < 3.35) || (x > 5.3 && x < 6.4)) continue;
    box(x, x + 0.008, 6.645, 6.652, 0.1, 3.2, mat.black, bld, false);
  }
  box(-0.15, 0.25, 6.65, 6.72, 0, H, mat.red, bld);          // red corner accent left
  box(6.25, 6.65, 6.65, 6.72, 0, H, mat.red, bld);           // red corner accent right
  box(0.25, 6.25, 6.65, 6.70, 0.0, 0.12, mat.red, bld);      // red plinth band
  // left wall accents
  box(-0.2, -0.15, 0.9, 3.9, 0.1, 3.2, mat.red, bld, false);
  box(-0.2, -0.15, 5.6, 6.65, 0.1, 3.2, mat.red, bld, false);
  // back wall plinth
  box(-0.15, 6.65, -0.2, -0.15, 0, 0.12, mat.red, bld, false);

  // parapet cap
  box(-0.17, 6.67, -0.17, 6.67, H, H + 0.04, mat.steelDark, bld);
  // ---- roof slab (structural ceiling at 3.2) & roof deck
  const roof = box(-0.15, 6.65, -0.15, 6.65, WH, WH + 0.14, M(0x6d7072, { roughness: 0.95 }), bld);
  roof.name = 'roof';
  // suspended ceiling at 2.8
  const ceil = box(0, 6.5, 0, 6.5, 2.78, 2.8, mat.ceilPanel, bld, false); ceil.name = 'ceiling';
  // recessed LED panels
  const ledPanels = [];
  const panelPos = [[1.0, 1.9], [3.5, 1.9], [1.0, 3.9], [3.5, 3.9], [1.5, 5.6], [3.5, 5.6], [5.6, 4.4], [5.6, 5.8], [5.6, 0.75], [5.6, 2.35]];
  for (const [x, y] of panelPos) { ledPanels.push(box(x - 0.3, x + 0.3, y - 0.3, y + 0.3, 2.77, 2.785, mat.led, bld, false)); }
  // interior lights
  const il = [[1.2, 1.9], [3.4, 1.9], [1.2, 4.2], [3.4, 4.2], [2.0, 5.8], [5.6, 4.6], [5.6, 1.0]];
  for (const [x, y] of il) { const pl = new THREE.PointLight(0xfff3e0, night ? 1.6 : 1.4, 7, 1.6); pl.position.copy(P(x, y, 2.6)); scene.add(pl); }

  // ---- interior partitions: storage/WC/staff (x 4.7-6.5)
  wallY(4.7 - 0.0, 1, [{ a: 0.15, b: 1.2, h0: 0, h1: 2.1 }], paint, innerMat, 0, 3.2); // kitchen|storage+WC wall (door opening to storage)
  // partition walls are thin single boxes
  const partM = innerMat;
  box(4.7, 6.5, 1.5 - 0.05, 1.5 + 0.05, 0, 2.8, partM, bld);               // storage|WC
  box(4.7, 5.0, 3.2 - 0.05, 3.2 + 0.05, 0, 2.8, partM, bld);               // WC|staff (left of door)
  box(5.85, 6.5, 3.2 - 0.05, 3.2 + 0.05, 0, 2.8, partM, bld);              // WC|staff (right of door)
  box(5.0, 5.85, 3.2 - 0.05, 3.2 + 0.05, 2.1, 2.8, partM, bld);            // lintel
  // WC door leaf
  box(5.0, 5.85, 3.2 + 0.05, 3.2 + 0.09, 0, 2.1, M(0xd9d9d6, { roughness: 0.6 }), bld);

  // ---- floors
  const floorK = new THREE.Mesh(new THREE.PlaneGeometry(4.7, 6.5), new THREE.MeshStandardMaterial({ map: tileTex('#d9d9d3', '#9a9a95', [4.7 / 0.4, 6.5 / 0.4]), roughness: 0.35 }));
  floorK.rotation.x = -Math.PI / 2; floorK.position.copy(P(2.35, 3.25, 0.002)); floorK.receiveShadow = true; scene.add(floorK);
  const floorS = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.5), M(0x8d9094, { roughness: 0.25 }));
  floorS.rotation.x = -Math.PI / 2; floorS.position.copy(P(5.6, 0.75, 0.002)); floorS.receiveShadow = true; scene.add(floorS);
  const floorO = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 5.0), new THREE.MeshStandardMaterial({ map: tileTex('#cfd0cb', '#8c8c88', [1.8 / 0.6, 5 / 0.6]), roughness: 0.3 }));
  floorO.rotation.x = -Math.PI / 2; floorO.position.copy(P(5.6, 4.0, 0.002)); floorO.receiveShadow = true; scene.add(floorO);
  // slab + outer base
  box(-T, 6.5 + T, -T, 6.5 + T, -0.02, 0.0, mat.concrete, bld, false);

  // ---- windows: front service window (double glazing, sliding)
  const fy = 6.5 + (T - SK) / 2 + 0.0;
  box(0.9, 3.3, 6.46, 6.62, 0.97, 1.0, mat.black, bld);            // sill frame
  box(0.9, 3.3, 6.46, 6.62, 2.2, 2.23, mat.black, bld);            // head frame
  box(0.9, 0.95, 6.46, 6.62, 1.0, 2.2, mat.black, bld);            // jambs
  box(3.25, 3.3, 6.46, 6.62, 1.0, 2.2, mat.black, bld);
  box(2.07, 2.13, 6.5, 6.62, 1.0, 2.2, mat.black, bld);            // mullion (two sliding panels)
  const gl1 = box(0.95, 2.1, 6.54, 6.545, 1.0, 2.2, mat.glass, bld, false);
  const gl2 = box(2.1, 3.25, 6.52, 6.525, 1.0, 2.2, mat.glass, bld, false); gl1.castShadow = gl2.castShadow = false;
  // service ledge outside
  box(0.85, 3.35, 6.65, 6.95, 0.98, 1.02, mat.steel, bld);
  // staff metal door
  box(5.35, 6.35, 6.5, 6.66, 0.0, 2.1, mat.steelDark, bld);
  box(5.4, 6.3, 6.66, 6.69, 0.05, 2.05, M(0x5b5f64, { roughness: 0.35, metalness: 0.9 }), bld);
  box(6.1, 6.14, 6.69, 6.74, 0.95, 1.15, mat.steel, bld);       // handle
  box(5.35, 6.35, 6.5, 6.7, 2.1, 2.14, mat.black, bld);

  // delivery window on left wall x=0 (y4.2-5.4, sill 1, head 2.2)
  box(-0.2, 0.0, 4.15, 4.2, 1.0, 2.2, mat.black, bld);
  box(-0.2, 0.0, 5.4, 5.45, 1.0, 2.2, mat.black, bld);
  box(-0.2, 0.0, 4.15, 5.45, 0.97, 1.0, mat.black, bld);
  box(-0.2, 0.0, 4.15, 5.45, 2.2, 2.24, mat.black, bld);
  box(-0.1, -0.095, 4.2, 5.4, 1.0, 2.2, mat.glass, bld, false);
  box(-0.5, -0.15, 4.1, 5.5, 0.98, 1.03, mat.steel, bld);       // outside shelf
  // awning
  const aw = box(-0.95, -0.15, 4.0, 5.6, 2.38, 2.43, mat.red, bld);
  aw.rotation.z = 0;
  box(-0.95, -0.9, 4.0, 5.6, 2.2, 2.43, mat.red, bld);
  // sign: black board with text + three white tiles (text only)
  const dsign = tex(1024, 512, (g, W, Hh) => {
    g.fillStyle = '#101010'; g.fillRect(0, 0, W, Hh);
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.direction = 'rtl'; g.font = 'bold 74px Arial'; g.fillText('منطقة استلام طلبات التطبيقات', W / 2, 105);
    const names = ['جاهز', 'كيتا', 'هنقرستيشن']; // RTL: right → left reads هنقرستيشن، كيتا، جاهز
    const bw = 290, gap = 22, x0 = (W - (3 * bw + 2 * gap)) / 2;
    names.forEach((n, i) => {
      g.fillStyle = '#fff'; const x = x0 + i * (bw + gap); g.beginPath(); g.roundRect(x, 215, bw, 230, 18); g.fill();
      g.fillStyle = '#111'; g.font = 'bold 66px Arial'; g.fillText(n, x + bw / 2, 330);
    });
  });
  const dsM = [M(0x111), M(0x111), M(0x111), M(0x111), M(0x111), new THREE.MeshStandardMaterial({ map: dsign, emissive: 0xffffff, emissiveMap: dsign, emissiveIntensity: night ? 0.6 : 0.05, roughness: 0.6 })];
  const ds = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.7, 1.45), dsM); // x thin, faces -x
  ds.rotation.y = Math.PI; // map faces -x outward
  ds.position.copy(P(-0.1, 4.8, 2.82)); ds.castShadow = true; bld.add(ds);
  // BoxGeometry face order: +x,-x,+y,-y,+z,-z. After rotation by PI around y, +x face points to -x. Use index 0.
  dsM[0] = dsM[5]; dsM[5] = M(0x111);
  ds.material = dsM;
  // yellow pad on ground below window
  const padT = tex(1024, 1024, (g, W, Hh) => {
    g.fillStyle = '#FFC72C'; g.fillRect(0, 0, W, Hh);
    g.strokeStyle = '#111'; g.lineWidth = 14; g.strokeRect(20, 20, W - 40, Hh - 40);
    g.fillStyle = '#111'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'rtl';
    g.font = 'bold 92px Arial'; g.fillText('استلام طلبات التطبيقات', W / 2, 250);
    g.font = 'bold 84px Arial'; g.fillText('للسائقين فقط', W / 2, 500);
    g.fillStyle = '#C7311F'; g.font = 'bold 92px Arial'; g.fillText('ممنوع الوقوف', W / 2, 760);
  });
  const pad = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9), new THREE.MeshStandardMaterial({ map: padT, roughness: 0.7 }));
  pad.rotation.x = -Math.PI / 2; pad.rotation.z = Math.PI / 2; // text reads toward the wall
  pad.position.copy(P(-1.35, 4.8, 0.008)); pad.receiveShadow = true; scene.add(pad);

  // ---- canopy (1.5 m projection, yellow edge, LED strip, downlights)
  const can = new THREE.Group(); bld.add(can);
  box(-0.15, 6.65, 6.65, 8.15, 3.0, 3.1, mat.charcoal, can);
  box(-0.15, 6.65, 8.1, 8.2, 2.93, 3.14, mat.yellow, can);        // yellow fascia
  box(-0.15, 6.65, 8.06, 8.1, 3.0, 3.04, mat.led, can, false);    // LED strip inside edge (underside)
  for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) {
    const x = 0.6 + i * 1.06, y = 7.2 + j * 0.6;
    const d = cyl(x, y, 2.985, 3.0, 0.055, mat.led, can, 16);
    if (night && (i % 2 === 0)) { const pl = new THREE.PointLight(0xffe4b0, 1.8, 4.5, 1.6); pl.position.copy(P(x, y, 2.85)); scene.add(pl); }
  }
  // support columns
  box(-0.1, 0.0, 8.0, 8.1, 0, 3.0, mat.charcoal, can); box(6.5, 6.6, 8.0, 8.1, 0, 3.0, mat.charcoal, can);

  // ---- sign band above canopy (Arabic via canvas)
  const signT = tex(2048, 400, (g, W, Hh) => {
    const gr = g.createLinearGradient(0, 0, 0, Hh); gr.addColorStop(0, '#E02B1B'); gr.addColorStop(1, '#B8281A');
    g.fillStyle = gr; g.fillRect(0, 0, W, Hh);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'rtl';
    g.fillStyle = '#fff'; g.font = 'bold 210px Arial'; g.fillText('كويك بايت', W / 2, 150);
    g.fillStyle = '#FFC72C'; g.font = 'bold 82px Arial'; g.fillText('اطلب من سيارتك', W / 2, 320);
  });
  const sg = new THREE.Mesh(new THREE.BoxGeometry(5.7, 0.8, 0.25), [M(C.red), M(C.red), M(C.red), M(C.red),
    new THREE.MeshStandardMaterial({ map: signT, emissive: 0xffffff, emissiveMap: signT, emissiveIntensity: night ? 1.6 : 0.15, roughness: 0.4 }), M(C.red)]);
  sg.position.copy(P(3.25, 6.65 + 0.125, 3.6)); sg.castShadow = true; bld.add(sg);
  // yellow outline on the sign
  box(0.4, 6.1, 6.76, 6.79, 3.19, 3.22, mat.yellow, bld, false); box(0.4, 6.1, 6.76, 6.79, 3.98, 4.01, mat.yellow, bld, false);
  if (night) { const pl = new THREE.PointLight(0xff4a30, 2.5, 8, 1.6); pl.position.copy(P(3.25, 7.6, 3.6)); scene.add(pl); }

  // ---- split ACs (3) inside front wall, height 2.45-2.75
  function splitAC(x0, x1) {
    const g = new THREE.Group(); bld.add(g);
    box(x0, x1, 6.28, 6.5, 2.45, 2.75, M(0xf3f3f1, { roughness: 0.35 }), g);
    box(x0 + 0.03, x1 - 0.03, 6.27, 6.29, 2.47, 2.52, mat.black, g, false);
    box(x1 - 0.12, x1 - 0.06, 6.27, 6.29, 2.66, 2.68, mat.ledYellow, g, false);
  }
  splitAC(0.15, 0.85); splitAC(1.65, 2.55); splitAC(3.45, 4.35);

  // ---- rooftop equipment
  const rf = WH + 0.14;
  for (let i = 0; i < 3; i++) { // condensers
    const x = 4.4 + i * 0.7;
    box(x, x + 0.6, 5.3, 5.8, rf + 0.12, rf + 0.72, M(0xdedcd6, { roughness: 0.5 }));
    box(x - 0.02, x + 0.62, 5.3, 5.35, rf, rf + 0.12, mat.steelDark);
    cyl(x + 0.3, 5.55, rf + 0.72, rf + 0.75, 0.24, mat.black, scene, 20);
    box(x + 0.1, x + 0.5, 5.28, 5.3, rf + 0.2, rf + 0.5, mat.steelDark, scene, false);
  }
  // hood duct + exhaust fan
  box(1.9, 2.4, 0.3, 0.7, 2.8, rf + 0.9, mat.steel);
  box(1.75, 2.55, 0.15, 0.85, rf + 0.9, rf + 1.0, mat.steelDark);
  const fan = cyl(2.15, 0.5, rf + 1.0, rf + 1.28, 0.33, mat.steel, scene, 28);
  cyl(2.15, 0.5, rf + 1.28, rf + 1.32, 0.3, mat.black, scene, 28);
  for (let k = 0; k < 4; k++) { const b = box(2.15 - 0.22, 2.15 + 0.22, 0.5 - 0.03, 0.5 + 0.03, rf + 1.33, rf + 1.335, mat.steelDark); b.rotation.y = k * Math.PI / 4; }
  // roof hatch / waterproofing look: slightly lighter border
  box(0.1, 6.4, 0.1, 6.4, rf, rf + 0.02, M(0x8a8d8f, { roughness: 1 }), scene, false);

  // ---------- interior equipment ----------
  const eq = new THREE.Group(); scene.add(eq);
  // hood (stainless) x0.05-4.2, y0.05-1.0, height 2.0..2.8
  box(0.05, 4.2, 0.05, 1.0, 2.0, 2.8, mat.steel, eq);
  box(0.05, 4.2, 0.97, 1.0, 1.95, 2.0, mat.steelDark, eq);
  box(0.05, 4.2, 0.05, 1.0, 2.0, 2.02, mat.black, eq, false);
  // hood filters underside lights
  box(0.3, 4.0, 0.3, 0.7, 1.99, 2.0, mat.led, eq, false);
  // back wall splash
  box(0.0, 4.7, 0.0, 0.03, 0.0, 2.4, mat.steel, eq, false);

  function grill(cx, cy) {
    const g = new THREE.Group(); eq.add(g);
    const w = 1.55, d = 0.62, hh = 1.15;
    const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - d / 2, y1 = cy + d / 2;
    // black frame cart + wheels
    box(x0 + 0.2, x1 - 0.2, y0 + 0.02, y1 - 0.02, 0.1, 0.78, mat.black, g);
    // lower cabinet doors (stainless) facing front (+y)
    box(x0 + 0.25, cx - 0.01, y1 - 0.04, y1 - 0.01, 0.15, 0.74, mat.steel, g);
    box(cx + 0.01, x1 - 0.25, y1 - 0.04, y1 - 0.01, 0.15, 0.74, mat.steel, g);
    box(cx - 0.09, cx - 0.06, y1 - 0.01, y1 + 0.02, 0.35, 0.55, mat.black, g, false);
    box(cx + 0.06, cx + 0.09, y1 - 0.01, y1 + 0.02, 0.35, 0.55, mat.black, g, false);
    box(x0 + 0.03, x0 + 0.2, y0, y1, 0.1, 0.78, mat.black, g);
    box(x1 - 0.2, x1 - 0.03, y0, y1, 0.1, 0.78, mat.black, g);
    // main body (control panel + burners deck)
    box(x0 + 0.25, x1 - 0.25, y0, y1, 0.78, 0.98, mat.steel, g);
    // six knobs on the front
    for (let k = 0; k < 6; k++) { const kx = x0 + 0.38 + k * ((w - 0.76) / 5); const kn = cyl(kx, y1 + 0.02, 0.84, 0.92, 0.025, mat.steelDark, g, 12); kn.rotation.x = Math.PI / 2; kn.position.z = P(0, y1 + 0.03).z; kn.position.y = 0.88; }
    // side shelves
    box(x0, x0 + 0.25, y0 + 0.03, y1 - 0.03, 0.9, 0.93, mat.steel, g);
    box(x1 - 0.25, x1, y0 + 0.03, y1 - 0.03, 0.9, 0.93, mat.steel, g);
    // cooking grate area + lid (open back, lid hinged)
    box(x0 + 0.27, x1 - 0.27, y0 + 0.03, y1 - 0.05, 0.98, 1.0, mat.black, g);
    for (let k = 0; k < 9; k++) box(x0 + 0.3 + k * 0.1, x0 + 0.33 + k * 0.1, y0 + 0.05, y1 - 0.07, 1.0, 1.015, mat.steelDark, g, false);
    box(x0 + 0.25, x1 - 0.25, y0 + 0.0, y0 + 0.03, 1.0, 1.15, mat.black, g);   // rear wall of hood
    const lid = box(x0 + 0.25, x1 - 0.25, y0 + 0.0, y0 + 0.02, 1.0, 1.14, mat.steelDark, g);
    // lid handle
    cyl(cx, y0 + 0.02, 1.12, 1.14, 0.012, mat.steel, g, 8);
    // wheels
    for (const [wx, wy] of [[x0 + 0.1, y0 + 0.08], [x1 - 0.1, y0 + 0.08], [x0 + 0.1, y1 - 0.08], [x1 - 0.1, y1 - 0.08]]) {
      const wh = cyl(wx, wy, 0.0, 0.1, 0.05, mat.rubber, g, 16); wh.rotation.z = Math.PI / 2;
      wh.geometry = new THREE.CylinderGeometry(0.05, 0.05, 0.04, 16); wh.rotation.z = Math.PI / 2; wh.position.y = 0.05;
    }
  }
  grill(0.95, 0.45); grill(2.6, 0.45);

  // fryer 27L electric: centred x3.8 y0.5, 0.42(w) x 0.75(d) x 1.20(h)
  (function fryer() {
    const g = new THREE.Group(); eq.add(g);
    const cx = 3.8, cy = 0.5, w = 0.42, d = 0.75;
    const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - d / 2, y1 = cy + d / 2;
    box(x0, x1, y0, y1 - 0.0, 0.15, 0.9, mat.steel, g);                 // cabinet
    box(x0 - 0.01, x1 + 0.01, y0, y1 + 0.01, 0.9, 0.93, mat.steel, g);  // top deck
    box(x0, x1, y0, y0 + 0.03, 0.93, 1.2, mat.steel, g);                // backsplash
    // blue control panel
    box(x0 + 0.02, x1 - 0.02, y1 - 0.01, y1 + 0.015, 0.71, 0.85, M(0x12306b, { roughness: 0.4, metalness: 0.3 }), g, false);
    box(x0 + 0.03, x1 - 0.03, y1 + 0.015, y1 + 0.02, 0.73, 0.83, mat.black, g, false);
    box(x0 + 0.05, x1 - 0.05, y1 + 0.02, y1 + 0.022, 0.76, 0.8, mat.led, g, false);
    // door with handle
    box(x0 + 0.015, x1 - 0.015, y1 + 0.0, y1 + 0.015, 0.2, 0.69, mat.steel, g);
    box(x0 + 0.06, x1 - 0.06, y1 + 0.015, y1 + 0.03, 0.62, 0.66, mat.steelDark, g, false);
    // legs
    for (const [lx, ly] of [[x0 + 0.05, y0 + 0.06], [x1 - 0.05, y0 + 0.06], [x0 + 0.05, y1 - 0.06], [x1 - 0.05, y1 - 0.06]]) cyl(lx, ly, 0, 0.15, 0.02, mat.steelDark, g, 12);
    // basket with blue handle
    box(cx - 0.17, cx + 0.17, cy - 0.12, cy + 0.2, 0.93, 1.0, mat.steelDark, g, false);
    for (let k = 0; k < 6; k++) box(cx - 0.17 + k * 0.068, cx - 0.165 + k * 0.068, cy - 0.12, cy + 0.2, 0.93, 1.0, mat.steel, g, false);
    const hb = box(cx - 0.015, cx + 0.015, cy + 0.2, cy + 0.55, 1.0, 1.015, M(0x1f3fa5, { roughness: 0.6 }), g, false);
    hb.rotation.x = 0.18;
  })();

  // prep table x1.9-2.6, y2.3-4.3, 0.90 high, lower shelf
  box(1.9, 2.6, 2.3, 4.3, 0.87, 0.9, mat.steel, eq);
  box(1.9, 2.6, 2.3, 2.33, 0.78, 0.9, mat.steel, eq, false); box(1.9, 2.6, 4.27, 4.3, 0.78, 0.9, mat.steel, eq, false);
  box(1.9, 1.93, 2.3, 4.3, 0.78, 0.9, mat.steel, eq, false); box(1.97, 2.6, 4.27, 4.3, 0.78, 0.9, mat.steel, eq, false);
  box(1.92, 2.58, 2.32, 4.28, 0.3, 0.33, mat.steel, eq);
  for (const [lx, ly] of [[1.93, 2.33], [2.57, 2.33], [1.93, 4.27], [2.57, 4.27]]) cyl(lx, ly, 0, 0.87, 0.022, mat.steelDark, eq, 12);
  // gastro trays / cutting board on the table
  box(2.0, 2.5, 2.6, 3.0, 0.9, 0.93, M(0xf4f4ef, { roughness: 0.7 }), eq, false);
  box(2.05, 2.45, 3.4, 3.9, 0.9, 0.94, M(0x2f7d3a, { roughness: 0.7 }), eq, false);

  // packing shelves on left wall (0.40 x 1.60 x 1.95)
  (function packShelves() {
    const y0 = 2.0, y1 = 3.6, x0 = 0.0, x1 = 0.4;
    box(x0, x0 + 0.03, y0, y1, 0.0, 1.95, mat.steelDark, eq, false);
    for (let k = 0; k < 5; k++) box(x0, x1, y0, y1, 0.25 + k * 0.4, 0.28 + k * 0.4, mat.steel, eq);
    for (const y of [y0 + 0.02, y1 - 0.02, (y0 + y1) / 2]) box(x1 - 0.03, x1, y - 0.01, y + 0.01, 0, 1.95, mat.steelDark, eq, false);
    // packaging boxes/bags
    for (let k = 0; k < 4; k++) for (let j = 0; j < 4; j++) box(0.04 + (j % 2) * 0.01, 0.32, y0 + 0.1 + j * 0.37, y0 + 0.4 + j * 0.37, 0.28 + k * 0.4, 0.28 + k * 0.4 + 0.18 + (j % 2) * 0.05, M([0xC7311F, 0xFFC72C, 0xf2f2f0, 0x3a3d42][(k + j) % 4], { roughness: 0.8 }), eq, false);
  })();

  // handover counter x0.3-3.2 y5.6-6.35 (2.90 x 0.75 x 0.95)
  box(0.3, 3.2, 5.6, 6.35, 0.0, 0.95, M(0xe7e5df, { roughness: 0.4 }), eq);
  box(0.3, 3.2, 5.6, 6.35, 0.93, 0.97, M(0x2a2c2f, { roughness: 0.3, metalness: 0.3 }), eq);       // dark worktop
  box(0.3, 3.2, 5.6, 5.64, 0.0, 0.12, mat.steelDark, eq, false);                                     // kick
  for (let k = 0; k < 4; k++) box(0.35 + k * 0.72, 0.35 + k * 0.72 + 0.01, 5.595, 5.6, 0.15, 0.9, mat.black, eq, false);
  // POS terminals x2
  for (const x of [0.7, 1.5]) {
    box(x - 0.17, x + 0.17, 5.85, 6.05, 0.97, 0.99, mat.black, eq, false);
    const sc = box(x - 0.17, x + 0.17, 5.98, 6.02, 1.0, 1.28, mat.black, eq); sc.rotation.x = -0.2;
    box(x - 0.15, x + 0.15, 5.965, 5.98, 1.03, 1.25, new THREE.MeshStandardMaterial({ color: 0x1c3a6e, emissive: 0x2a63c8, emissiveIntensity: 0.9 }), eq, false).rotation.x = -0.2;
  }
  // order printer
  box(2.0, 2.3, 5.85, 6.15, 0.97, 1.1, mat.black, eq); box(2.03, 2.27, 5.82, 5.86, 1.0, 1.06, mat.white, eq, false);
  // tablet on stand
  box(2.65, 2.9, 5.95, 5.99, 1.0, 1.2, mat.black, eq).rotation.x = -0.3;
  box(2.7, 2.85, 5.93, 5.95, 1.02, 1.16, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff0c0, emissiveIntensity: 0.6 }), eq, false).rotation.x = -0.3;
  // paper bags on counter (hand-over)
  for (const x of [1.0, 1.2]) box(x - 0.1, x + 0.1, 6.15, 6.3, 0.97, 1.2, M(0xd9b98c, { roughness: 0.9 }), eq, false);

  // fridge 0.65x0.85x1.90 : x3.3-3.95 y5.5-6.35
  (function fridge() {
    box(3.3, 3.95, 5.5, 6.35, 0.05, 1.9, mat.steel, eq);
    box(3.32, 3.93, 5.46, 5.5, 0.05, 1.88, mat.steelDark, eq, false);
    box(3.3, 3.95, 5.5, 6.35, 0.0, 0.05, mat.black, eq, false);
    box(3.3, 3.95, 5.46, 5.5, 1.0, 1.02, mat.black, eq, false);         // door split
    box(3.4, 3.43, 5.43, 5.46, 1.1, 1.7, mat.steel, eq, false); box(3.4, 3.43, 5.43, 5.46, 0.2, 0.9, mat.steel, eq, false);
  })();

  // storage: freezer x5.72-6.37, y0.5-1.35 (upright) + dry shelves
  box(5.72, 6.37, 0.5, 1.35, 0.05, 1.85, mat.steel, eq);
  box(5.72, 5.75, 0.5, 1.35, 0.05, 1.85, mat.steelDark, eq, false);
  box(5.72, 5.75, 0.65, 0.68, 0.9, 1.3, mat.black, eq, false);
  for (let k = 0; k < 4; k++) box(4.75, 5.15, 0.15, 1.4, 0.3 + k * 0.5, 0.33 + k * 0.5, mat.steelDark, eq);
  box(4.75, 4.78, 0.15, 1.4, 0, 1.9, mat.steelDark, eq, false);
  for (let k = 0; k < 4; k++) for (let j = 0; j < 3; j++) box(4.78, 5.1, 0.25 + j * 0.4, 0.5 + j * 0.4, 0.33 + k * 0.5, 0.33 + k * 0.5 + 0.22, M([0xcaa46a, 0xe8e2d4, 0xC7311F][(k + j) % 3], { roughness: 0.85 }), eq, false);

  // staff area: 3-compartment wash sink x5.68-6.35, y3.4-4.9 against right wall
  (function sink() {
    box(5.68, 6.35, 3.4, 4.9, 0.0, 0.85, mat.steel, eq);
    box(5.68, 6.35, 3.4, 4.9, 0.85, 0.9, mat.steel, eq);
    for (let k = 0; k < 3; k++) { const y0 = 3.45 + k * 0.48; box(5.74, 6.2, y0, y0 + 0.42, 0.86, 0.905, mat.black, eq, false); }
    box(6.3, 6.35, 3.4, 4.9, 0.9, 1.1, mat.steel, eq);                  // splash
    for (let k = 0; k < 3; k++) { box(6.2, 6.28, 3.64 + k * 0.48, 3.68 + k * 0.48, 1.0, 1.3, mat.steel, eq, false); box(6.0, 6.28, 3.64 + k * 0.48, 3.68 + k * 0.48, 1.28, 1.3, mat.steel, eq, false); }
    box(5.68, 5.72, 3.4, 4.9, 0.0, 0.2, mat.black, eq, false);
  })();
  // lockers (staff area) against back-right: x5.0-5.6, y4.95-5.95?? keep inside 4.7-6.5 staff zone
  (function lockers() {
    const x0 = 5.0, x1 = 6.45, y0 = 5.45, y1 = 6.0;
    for (let k = 0; k < 3; k++) {
      const a = 5.15 + k * 0.42; box(a, a + 0.4, 5.55, 6.0, 0.0, 1.8, M(0x5c6168, { roughness: 0.4, metalness: 0.7 }), eq);
      box(a + 0.28, a + 0.3, 5.53, 5.55, 1.0, 1.25, mat.steel, eq, false);
      for (let v = 0; v < 3; v++) box(a + 0.08, a + 0.32, 5.53, 5.555, 1.55 + v * 0.05, 1.57 + v * 0.05, mat.black, eq, false);
    }
  })();

  // ---------- vehicles / people / props ----------
  function car(x, y, color, face = 'north') {
    const g = new THREE.Group(); scene.add(g);
    const cm = M(color, { roughness: 0.25, metalness: 0.6 });
    const body = box(-0.9, 0.9, -2.2, 2.2, 0.35, 0.9, cm, g);
    box(-0.8, 0.8, -1.0, 1.2, 0.9, 1.45, cm, g);
    box(-0.78, 0.78, -0.95, 1.15, 0.92, 1.4, mat.glass, g, false).material = M(0x1a232b, { roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.8 });
    for (const [wx, wy] of [[-0.85, -1.4], [0.85, -1.4], [-0.85, 1.4], [0.85, 1.4]]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 24), mat.rubber); wh.rotation.z = Math.PI / 2; wh.position.copy(P(wx, wy, 0.34)); wh.castShadow = true; g.add(wh); }
    box(-0.7, -0.45, 2.2, 2.21, 0.55, 0.7, mat.led, g, false); box(0.45, 0.7, 2.2, 2.21, 0.55, 0.7, mat.led, g, false);
    box(-0.7, -0.45, -2.21, -2.2, 0.55, 0.7, M(0xaa0000, { emissive: 0xaa0000, emissiveIntensity: night ? 2 : 0.2 }), g, false);
    g.position.set(x, 0, y); // x,y here are three coordinates shift
    g.userData.plan = true; return g;
  }
  const carPos = (cx, cy) => [cx - OX, cy - OZ];
  const c1 = car(...carPos(bayCx(2), 11.4), 0xe8e8e8); c1.rotation.y = Math.PI;   // faces building (south->north?) front toward -z
  const c2 = car(...carPos(bayCx(4), 11.6), 0x5b0f10); c2.rotation.y = Math.PI;
  // staff member (faceless), red cap, white bag
  (function staff() {
    const g = new THREE.Group(); scene.add(g);
    const shirt = M(0xC7311F, { roughness: 0.8 }), skin = M(0xb98a63, { roughness: 0.8 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.5, 6, 16), shirt); body.position.set(0, 1.15, 0); body.castShadow = true; g.add(body);
    const legs = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.55, 6, 12), M(0x23262b)); legs.position.set(0, 0.5, 0); legs.castShadow = true; g.add(legs);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.115, 20, 20), skin); head.position.set(0, 1.72, 0); head.castShadow = true; g.add(head);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.125, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat.red); cap.position.set(0, 1.74, 0); g.add(cap);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.012, 20, 1, false, 0, Math.PI), mat.red); brim.position.set(0, 1.75, -0.1); brim.rotation.y = Math.PI; g.add(brim);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.45, 4, 8), shirt); arm.position.set(0.28, 1.1, -0.15); arm.rotation.x = -1.0; g.add(arm);
    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.28, 0.12), M(0xf6f3ea, { roughness: 0.9 })); bag.position.set(0.3, 0.95, -0.38); g.add(bag);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.205, 0.07, 0.125), mat.red); stripe.position.set(0.3, 1.04, -0.38); g.add(stripe);
    g.position.copy(P(bayCx(2) + 1.45, 10.1, 0)); g.rotation.y = Math.PI / 2 + 0.3;
  })();

  // street lamps
  function lamp(x, y) {
    const g = new THREE.Group(); scene.add(g);
    cyl(x, y, 0, 6.5, 0.07, mat.steelDark, g, 12);
    box(x - 0.04, x + 1.3, y - 0.04, y + 0.04, 6.4, 6.5, mat.steelDark, g, false);
    box(x + 0.9, x + 1.45, y - 0.12, y + 0.12, 6.28, 6.4, mat.led, g, false);
    if (night) { const pl = new THREE.PointLight(0xffd9a0, 6, 14, 1.4); pl.position.copy(P(x + 1.1, y, 6.0)); scene.add(pl); }
  }
  lamp(-3.0, 15.4); lamp(7.0, 15.4); lamp(11.0, 15.4); lamp(-3.5, 1.0);

  // palms
  function palm(x, y, s = 1, lean = 0.15) {
    const g = new THREE.Group(); scene.add(g);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * s, 0.24 * s, 5.2 * s, 12), M(0x7b6044, { roughness: 1 }));
    trunk.position.y = 2.6 * s; trunk.castShadow = true; g.add(trunk);
    for (let r = 0; r < 12; r++) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2 * s - 0.0, 0.015, 6, 16), M(0x5d4a35)); ring.rotation.x = Math.PI / 2; ring.position.y = 0.5 * s + r * 0.4 * s; g.add(ring); }
    const frM = new THREE.MeshStandardMaterial({ color: 0x2f6b2c, roughness: 0.8, side: THREE.DoubleSide });
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 2, len = 2.2 * s;
      const geo = new THREE.PlaneGeometry(0.5 * s, len, 1, 6);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) { const yy = pos.getY(i) + len / 2; pos.setZ(i, -0.25 * s * (yy / len) ** 2 * 2.2); pos.setX(i, pos.getX(i) * (1 - yy / len * 0.9)); }
      geo.computeVertexNormals();
      const fr = new THREE.Mesh(geo, frM); fr.castShadow = true;
      fr.position.set(0, 5.2 * s, 0); fr.rotation.set(0, a, 0); fr.rotateX(Math.PI / 2 - 0.35 - (k % 2) * 0.25); fr.translateY(len / 2);
      g.add(fr);
    }
    g.position.copy(P(x, y, 0)); g.rotation.z = lean; g.rotation.y = x;
  }
  palm(-2.6, 7.4, 1.0, 0.1); palm(9.2, 7.2, 1.1, -0.12); palm(9.4, 2.0, 1.0, -0.1); palm(-3.0, -1.2, 0.95, 0.08);
  palm(6.4, 15.4, 0.9, 0.05); palm(1.6, 15.5, 1.0, -0.06);

  // trash bin and small details
  box(7.0, 7.45, 6.9, 7.35, 0, 0.9, M(0x2c3035, { roughness: 0.7 }));

  // ---------- lights / env by mode ----------
  const pm = new THREE.PMREMGenerator; // set later in main (renderer needed)
  scene.userData.mode = mode;
  scene.userData.hide = { roof, ceil };
  return { scene, roof, ceil, can, bld, P, panelPos };
}

export { C };
