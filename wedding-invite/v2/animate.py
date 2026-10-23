"""Animate a still wedding-invitation image into a 15s cinematic 9:16 video.

Every effect is an overlay or a sub-pixel warp on the original pixels, so the
Arabic text, names and the couple are never redrawn.
Usage: python3 animate.py <image> <out.mp4>
"""
import os, sys, subprocess
import numpy as np, cv2

SRC, OUT = sys.argv[1], sys.argv[2]
FPS, DUR = 30, 15.0
OW, OH = 1080, 1920
N = int(FPS * DUR)

base = cv2.imread(SRC).astype(np.float32) / 255.0
H, W = base.shape[:2]
sx, sy = W / 1119.0, H / 2000.0          # layout was measured on a 1119x2000 source
rng = np.random.default_rng(11)

def box(x0, y0, x1, y1):
    return int(x0 * sx), int(y0 * sy), int(x1 * sx), int(y1 * sy)

# ---------- flower sway: tiny displacement only on the floral side borders ----------
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
left = np.clip((260 * sx - xx) / (40 * sx), 0, 1)
right = np.clip((xx - 905 * sx) / (35 * sx), 0, 1)
sway_mask = cv2.GaussianBlur(np.maximum(left, right), (0, 0), 6)

# ---------- names + rings gold mask ----------
nx0, ny0, nx1, ny1 = box(240, 670, 885, 795)
crop = base[ny0:ny1, nx0:nx1]
b, g, r = crop[..., 0], crop[..., 1], crop[..., 2]
gold = ((r > .62) & (r - b > .08)).astype(np.float32)
gold = cv2.GaussianBlur(gold, (0, 0), 0.8)
name_mask = np.zeros((H, W), np.float32); name_mask[ny0:ny1, nx0:nx1] = gold
name_glow = cv2.GaussianBlur(name_mask, (0, 0), 9)
GOLD = np.array([0.45, 0.78, 1.0], np.float32)       # BGR warm gold
ring_bloom = np.exp(-(((np.arange(W)[None, :] - 575 * sx) / (70 * sx)) ** 2 +
                      ((np.arange(H)[:, None] - 735 * sy) / (40 * sy)) ** 2)).astype(np.float32)

# ---------- chandelier glints: brightest local points of the crystals ----------
lum = cv2.cvtColor((base * 255).astype(np.uint8), cv2.COLOR_BGR2GRAY)
glints = []
for (x0, y0, x1, y1) in (box(0, 0, 245, 360), box(875, 0, 1119, 360)):
    reg = lum[y0:y1, x0:x1].astype(np.float32)
    peak = (reg == cv2.dilate(reg, np.ones((15, 15)))) & (reg > 235)
    ys, xs = np.nonzero(peak)
    idx = rng.permutation(len(xs))[:22]
    for i in idx:
        glints.append((x0 + xs[i], y0 + ys[i], rng.uniform(0, 6.28), rng.uniform(.5, 1.1), rng.uniform(5, 11)))

# candle flames: warm flicker glow centred on the candle tips
flames = [(int(x * sx), int(y * sy)) for x, y in
          [(62, 110), (120, 95), (175, 105), (205, 125), (918, 125), (953, 95), (1057, 95), (1100, 120)]]
flame_glow = np.zeros((H, W), np.float32)
for fx, fy in flames:
    cv2.circle(flame_glow, (fx, fy), int(10 * sx), 1.0, -1)
flame_glow = cv2.GaussianBlur(flame_glow, (0, 0), 22 * sx)
flame_glow /= flame_glow.max()

# soft chandelier light pool falling on the wall
cx_l, cx_r = int(115 * sx), int(1000 * sx)
pool = (np.exp(-(((xx - cx_l) / (330 * sx)) ** 2 + ((yy - 200 * sy) / (520 * sy)) ** 2)) +
        np.exp(-(((xx - cx_r) / (330 * sx)) ** 2 + ((yy - 200 * sy) / (520 * sy)) ** 2))).astype(np.float32)

# ---------- petals drifting down the floral borders ----------
petals = []
for _ in range(16):
    side = rng.integers(0, 2)
    x = rng.uniform(20, 230) if side == 0 else rng.uniform(895, 1100)
    petals.append(dict(x=x * sx, y=rng.uniform(-200, 1900) * sy, vy=rng.uniform(28, 55) * sy,
                       amp=rng.uniform(10, 30) * sx, ph=rng.uniform(0, 6.28), rot=rng.uniform(0, 180),
                       vr=rng.uniform(-40, 40), size=rng.uniform(5, 9) * sx, a=rng.uniform(.55, .85)))

def star(img, x, y, size, k):
    """Additive cross-flare sparkle."""
    if k <= 0.01:
        return
    s = int(size * 3)
    x0, y0 = int(x) - s, int(y) - s
    if x0 < 0 or y0 < 0 or x0 + 2 * s + 1 > W or y0 + 2 * s + 1 > H:
        return
    patch = np.zeros((2 * s + 1, 2 * s + 1), np.float32)
    d = int(s * .7)
    cv2.line(patch, (s - d, s - d), (s + d, s + d), 1.0, 1, cv2.LINE_AA)
    cv2.line(patch, (s - d, s + d), (s + d, s - d), 1.0, 1, cv2.LINE_AA)
    patch = cv2.GaussianBlur(patch, (0, 0), .7)
    cv2.circle(patch, (s, s), max(1, int(size * .35)), 1.0, -1, cv2.LINE_AA)
    patch = cv2.GaussianBlur(patch, (0, 0), .9) * 1.6
    img[y0:y0 + 2 * s + 1, x0:x0 + 2 * s + 1] += patch[..., None] * k * np.array([.85, .95, 1.0], np.float32)

ease = lambda u: u * u * (3 - 2 * u)

ff = None if os.environ.get('PREVIEW') else subprocess.Popen(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24',
                       '-s', f'{OW}x{OH}', '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'slow',
                       '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', OUT], stdin=subprocess.PIPE)

fit = OH / H                                   # fit height; width gets ~3px replicated edge
import os
PREV = [int(float(v) * FPS) for v in os.environ.get('PREVIEW', '').split(',') if v]
for f in (PREV or range(N)):
    t = f / FPS
    # 1. flower sway (<=2.2px, wave travelling down the border)
    dx = sway_mask * (2.2 * sx) * np.sin(1.1 * t + yy * 0.006 / sy)
    dy = sway_mask * (1.0 * sy) * np.sin(0.8 * t + yy * 0.004 / sy + 1.3)
    frame = cv2.remap(base, xx + dx, yy + dy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

    # 2. breathing chandelier light + flame flicker
    breathe = .035 + .02 * np.sin(t * 1.3)
    frame += (pool * breathe)[..., None] * GOLD
    flick = .10 + .05 * np.sin(t * 9.1) * np.sin(t * 5.3 + 1) + .03 * np.sin(t * 17)
    frame += (flame_glow * flick)[..., None] * np.array([.35, .7, 1.0], np.float32)

    # 3. gold shimmer on names/rings: soft glow + a sweep moving right-to-left (reading direction)
    frame += (name_glow * (.10 + .05 * np.sin(t * 1.6)))[..., None] * GOLD
    for start in (2.5, 9.0):
        u = (t - start) / 2.6
        if 0 <= u <= 1:
            cxs = (nx1 + 60) - ease(u) * (nx1 - nx0 + 120)
            band = np.exp(-((xx[ny0:ny1, nx0:nx1] - cxs) / (45 * sx)) ** 2)
            frame[ny0:ny1, nx0:nx1] += (gold * band * .55)[..., None] * np.array([.75, .92, 1.0], np.float32)
    # ring glint as the sweep crosses the rings
    for start in (2.5, 9.0):
        k = np.exp(-((t - (start + 1.3)) / .35) ** 2)
        frame += (ring_bloom * k * .35)[..., None] * GOLD

    # 4. crystal glints
    for gx, gy, ph, sp, sz in glints:
        k = max(0.0, np.sin(t * sp * 2.2 + ph)) ** 12
        star(frame, gx, gy, sz * sx * .8, k * .9)

    # 5. petals
    for p in petals:
        y = (p['y'] + p['vy'] * t) % (H + 80) - 40
        x = p['x'] + p['amp'] * np.sin(t * .9 + p['ph'] + y * .004)
        ang = p['rot'] + p['vr'] * t
        a = p['a'] * min(1.0, t / .8)
        x0, y0 = int(x) - 20, int(y) - 20
        if x0 < 0 or y0 < 0 or x0 + 40 > W or y0 + 40 > H:
            continue
        ov = np.zeros((40, 40), np.float32)
        cv2.ellipse(ov, (int(x) - x0, int(y) - y0), (int(p['size']), int(p['size'] * .55)), ang, 0, 360, 1.0, -1, cv2.LINE_AA)
        sub = cv2.GaussianBlur(ov, (0, 0), .8) * a
        tgt = frame[y0:y0 + 40, x0:x0 + 40]
        petal = np.array([.86, .93, .96], np.float32)
        tgt[:] = tgt * (1 - sub[..., None]) + petal * sub[..., None]

    # 6. slow camera push toward the couple, keeping all text in frame
    u = ease(min(1.0, t / DUR))
    z = 1.0 + .065 * u
    cx, cy = 580 * sx, 1430 * sy
    s = fit * z
    M = np.array([[s, 0, OW / 2 - cx * s + (cx - W / 2) * fit],
                  [0, s, OH / 2 - cy * s + (cy - H / 2) * fit]], np.float32)
    out = cv2.warpAffine(np.clip(frame, 0, 1), M, (OW, OH), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)

    # 7. open from a soft dim (thumbnail stays readable) and gentle end settle
    out *= (.72 + .28 * ease(min(1.0, t / 1.2))) * (1 - .12 * ease(max(0.0, (t - 14.2) / .8)))
    if PREV:
        cv2.imwrite(f'{OUT}_{f}.png', (np.clip(out, 0, 1) * 255).astype(np.uint8)); continue
    ff.stdin.write((np.clip(out, 0, 1) * 255).astype(np.uint8).tobytes())

if ff:
    ff.stdin.close(); ff.wait()
