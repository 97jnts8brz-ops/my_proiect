"""Calmer variant of music_romantic.py: sparser piano, softer and darker violin, fuller strings.
15s romantic instrumental in maqam Nahawand (C): solo violin over piano arpeggios and
soft strings, no percussion, resolving to a warm C major at the end.
Usage: python3 music_romantic.py <out.wav>"""
import sys, wave
import numpy as np

SR, D = 44100, 15.0
n = int(SR * D)
t = np.arange(n) / SR
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
rng = np.random.default_rng(21)
mix = np.zeros(n)

def add(sig, start, gain):
    s = int(start * SR); e = min(n, s + len(sig))
    if s < n:
        mix[s:e] += sig[:e - s] * gain

def piano(m, dur=3.0, vel=1.0):
    f = hz(m); L = int(SR * dur); tt = np.arange(L) / SR
    sig = np.zeros(L)
    for k in range(1, 9):
        fk = f * k * np.sqrt(1 + .0004 * k * k)          # slight string inharmonicity
        if fk > SR / 2.2:
            break
        sig += np.sin(2 * np.pi * fk * tt) * np.exp(-tt * (1.2 + .9 * k)) / k ** 1.3
    sig *= np.minimum(1, tt / .003)
    return sig * vel

def strings(notes, start, dur, gain, attack=1.4, release=1.4):
    L = int(SR * dur); tt = np.arange(L) / SR
    env = np.minimum(1, tt / attack) * np.clip((dur - tt) / release, 0, 1)
    sig = np.zeros(L)
    for k, m in enumerate(notes):
        for det in (-.07, 0, .08):
            f = hz(m + det)
            ph = 2 * np.pi * np.cumsum(f * (1 + .003 * np.sin(2 * np.pi * (4.6 + k * .4) * tt + k))) / SR
            sig += (np.sin(ph) + .4 * np.sin(2 * ph) + .18 * np.sin(3 * ph)) / 3
    add(sig * env, start, gain)

# --- harmony: Cm  Ab  Fm  G  -> C major ---
chords = [(0.0, [48, 55, 60, 63, 67]), (3.2, [44, 51, 56, 60, 63]), (6.4, [41, 48, 53, 56, 60]),
          (9.6, [43, 50, 55, 59, 62]), (12.8, [48, 55, 60, 64, 67, 72])]
step = 60 / 66                                             # quarter notes at 66 bpm (sparser)
for i, (st, ch) in enumerate(chords):
    last = i == len(chords) - 1
    strings(ch[1:4], st, (2.2 if last else 3.8), .04 if not last else .05, attack=1.8, release=1.8)
    add(piano(ch[0] - 12, 3.5, .7), st, .14)               # bass note
    seq = ch + ch[-2:0:-1] if not last else ch            # broken chord up and down
    for j, m in enumerate(seq[:7]):
        tm = st + j * step
        if tm < st + 3.2 and tm < 14.2:
            add(piano(m, 3.0, .45), tm, .12)
    if last:
        add(piano(84, 2.2, .5), st + .9, .12)             # high sparkle on the resolution

# --- solo violin: continuous legato voice with glides and delayed vibrato ---
mel = [(1.6, 67, .5), (2.1, 72, .5), (2.6, 74, .5), (3.1, 75, 1.4), (4.5, 74, .4), (4.9, 72, .4),
       (5.3, 70, .5), (5.8, 68, 1.0), (6.8, 72, .5), (7.3, 68, .5), (7.8, 67, 1.2), (9.0, 65, .4),
       (9.4, 63, .4), (9.8, 62, .5), (10.3, 67, .5), (10.8, 71, .7), (11.5, 74, .6), (12.1, 74, .7),
       (12.8, 72, 2.0)]
pitch = np.full(n, np.nan); amp = np.zeros(n)
for idx, (st, m, du) in enumerate(mel):
    s, e = int(st * SR), min(n, int((st + du) * SR))
    pitch[s:e] = m
    tt = np.arange(e - s) / SR
    a = np.minimum(1, tt / .25) * (0.85 + .15 * np.sin(np.pi * np.clip(tt / du, 0, 1)))
    if idx == len(mel) - 1:
        a *= np.clip((du - tt) / 1.2, 0, 1)
    amp[s:e] = np.maximum(amp[s:e], a)
# hold pitch through tiny gaps, then glide between notes (~70 ms portamento)
for i in range(1, n):
    if np.isnan(pitch[i]):
        pitch[i] = pitch[i - 1]
pitch = np.nan_to_num(pitch, nan=67)
g = int(.07 * SR)
pitch = np.convolve(np.pad(pitch, (g, g), mode='edge'), np.ones(g) / g, 'same')[g:-g]
amp = np.convolve(amp, np.ones(int(.03 * SR)) / int(.03 * SR), 'same')
# vibrato grows on held notes
held = np.convolve((amp > .5).astype(float), np.ones(int(.35 * SR)) / int(.35 * SR), 'same')
f = hz(pitch) * (1 + 0.004 * held * np.sin(2 * np.pi * 5.6 * t))
ph = 2 * np.pi * np.cumsum(f) / SR
vio = sum(np.sin(k * ph) * (1 / k) * (1.0 if k < 4 else .6) for k in range(1, 7))
bow = 0
vio = (vio + bow) * amp
# body resonance: gentle one-pole lowpass for warmth
out = np.empty(n); y = 0.0; a_lp = .18
for i in range(n):
    y += a_lp * (vio[i] - y); out[i] = y
mix += out * .07

# --- lush hall: many diffuse stereo delays ---
L_, R_ = mix.copy(), mix.copy()
for d, gn in [(.029, .25), (.053, .22), (.079, .2), (.113, .17), (.157, .14), (.211, .11), (.283, .08), (.379, .06), (.491, .04)]:
    a, b = int(d * SR), int(d * 1.19 * SR)
    L_[a:] += gn * mix[:-a]; R_[b:] += gn * mix[:-b]
st = np.stack([L_, R_], 1)
st *= (np.clip(t / .3, 0, 1) * np.clip((D - t) / 1.3, 0, 1))[:, None]
st = np.tanh(st / np.abs(st).max() * 1.2) / np.tanh(1.2) * .62
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st * 32767).astype('<i2').tobytes())
