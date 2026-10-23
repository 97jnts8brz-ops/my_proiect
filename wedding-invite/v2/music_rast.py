"""15s festive-yet-elegant wedding instrumental in maqam Rast (C) with real quarter tones:
qanun melody, string ensemble swells, soft maqsum on darbuka/riq, opening harp-like run.
Usage: python3 music_rast.py <out.wav>"""
import sys, wave
import numpy as np

SR, D = 44100, 15.0
n = int(SR * D)
t = np.arange(n) / SR
hz = lambda m: 440 * 2 ** ((m - 69) / 12)        # fractional midi = quarter tones
rng = np.random.default_rng(9)
mix = np.zeros(n)

def add(sig, start, gain):
    s = int(start * SR); e = min(n, s + len(sig))
    if s < n:
        mix[s:e] += sig[:e - s] * gain

def qanun(f, dur, vel=1.0):
    """Bright plucked string (Karplus-Strong) with a little pick noise."""
    N = int(round(SR / f)); L = int(SR * dur)
    buf = rng.uniform(-1, 1, N); out = np.empty(L)
    for i in range(L):
        j = i % N
        out[i] = buf[j]
        buf[j] = 0.4985 * (buf[j] + buf[(j + 1) % N])
    return out * np.minimum(1, np.arange(L) / (SR * .002)) * vel

def strings(midi_notes, start, dur, gain, attack=1.2, release=1.2):
    L = int(SR * dur); tt = np.arange(L) / SR
    env = np.minimum(1, tt / attack) * np.clip((dur - tt) / release, 0, 1)
    sig = np.zeros(L)
    for k, m in enumerate(midi_notes):
        for det in (-0.06, 0, 0.07):              # ensemble detune
            f = hz(m + det)
            ph = 2 * np.pi * np.cumsum(f * (1 + .004 * np.sin(2 * np.pi * (5 + k * .3) * tt + k))) / SR
            sig += (np.sin(ph) + .45 * np.sin(2 * ph) + .25 * np.sin(3 * ph) + .12 * np.sin(4 * ph)) / 3
    add(sig * env, start, gain)

# --- opening: rising Rast run (harp/qanun glissando) over a string swell ---
rast = [60, 62, 63.5, 65, 67, 69, 70.5, 72, 74, 75.5, 77, 79, 81, 82.5, 84]
for i, m in enumerate(rast):
    add(qanun(hz(m), 1.4, .8), .25 + i * .085, .16)
strings([48, 55, 60, 67], 0.0, 3.4, .10, attack=.8, release=1.0)

# --- string bed following the harmony ---
strings([48, 55, 60, 64], 2.4, 3.2, .045)          # C
strings([53, 60, 65, 69], 5.2, 3.0, .045)          # F
strings([55, 62, 67, 71], 8.0, 2.8, .05)           # G
strings([53, 57, 60, 65], 10.6, 2.6, .05)          # F
strings([48, 55, 60, 64, 67, 72], 12.9, 2.1, .075, attack=.5, release=1.6)   # final C, grand

# --- qanun melody (time, midi, duration) ---
mel = [(2.6, 67, .35), (2.95, 69, .35), (3.3, 70.5, .35), (3.65, 72, .7), (4.35, 70.5, .35), (4.7, 69, .35),
       (5.05, 67, .7), (5.75, 65, .35), (6.1, 63.5, .35), (6.45, 65, .35), (6.8, 67, 1.4),
       (8.55, 72, .35), (8.9, 74, .35), (9.25, 75.5, .7), (9.95, 74, .35), (10.3, 72, .35), (10.65, 70.5, .35),
       (11.0, 69, .35), (11.35, 67, .7), (12.05, 65, .35), (12.4, 63.5, .35), (12.75, 62, .35), (13.1, 60, 1.9)]
for st, m, du in mel:
    f = hz(m)
    if du >= .65:                                  # qanun tremolo on held notes
        k, step = 0, .075
        while k * step < du - .05:
            v = .85 - .35 * (k * step / du)
            add(qanun(f, .45, v), st + k * step, .2)
            add(qanun(2 * f, .3, v * .5), st + k * step, .07)
            k += 1
    else:
        add(qanun(f, du + 1.0), st, .3)
        add(qanun(2 * f, du + .6, .6), st, .09)
    if st >= 8.5:                                  # strings double the second phrase
        strings([m - 12], st, du + .25, .022, attack=.08, release=.2)

# --- percussion: soft maqsum (dum tak - tak dum - tak -) at 84 bpm ---
def hit(freq, decay, noise, ndecay):
    L = int(SR * .5); tt = np.arange(L) / SR
    body = np.sin(2 * np.pi * freq * tt * (1 + .6 * np.exp(-tt * 40))) * np.exp(-tt * decay)
    return body + noise * rng.uniform(-1, 1, L) * np.exp(-tt * ndecay)
dum, tak = hit(75, 9, .1, 60), hit(380, 30, .4, 50)
riq = rng.uniform(-1, 1, int(SR * .25)) * np.exp(-np.arange(int(SR * .25)) / SR * 25)   # jingles
e8 = 60 / 84 / 2
pattern = ['D', 'T', '', 'T', 'D', '', 'T', '']
s0 = 2.6
k = 0
while s0 + k * e8 < 13.1:
    tm = s0 + k * e8
    p = pattern[k % 8]
    ramp = min(1.0, (tm - s0) / 2.0)               # percussion fades in
    if p == 'D': add(dum, tm, .30 * ramp)
    if p == 'T': add(tak, tm, .10 * ramp)
    add(riq, tm, (.02 if k % 2 == 0 else .01) * ramp)
    k += 1
add(dum, 13.1, .34)                                # final accent with the last chord
for i in range(6):                                 # riq roll into the ending
    add(riq, 12.75 + i * .06, .03)

# --- room: diffuse stereo delays ---
L_, R_ = mix.copy(), mix.copy()
for d, g in [(.031, .22), (.067, .18), (.113, .15), (.173, .11), (.251, .08), (.353, .05)]:
    a, b = int(d * SR), int(d * 1.17 * SR)
    L_[a:] += g * mix[:-a]; R_[b:] += g * mix[:-b]
st = np.stack([L_, R_], 1)
st *= (np.clip(t / .15, 0, 1) * np.clip((D - t) / 1.4, 0, 1))[:, None]
st = np.tanh(st / np.abs(st).max() * 1.4) / np.tanh(1.4) * .9    # gentle glue/limiting
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st * 32767).astype('<i2').tobytes())
