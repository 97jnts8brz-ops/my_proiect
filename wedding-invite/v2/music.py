"""15s calm instrumental in maqam Hijaz on D: string drone + oud-like melody + soft daf.
Usage: python3 music.py <out.wav>"""
import sys, wave
import numpy as np

SR, D = 44100, 15.0
n = int(SR * D)
t = np.arange(n) / SR
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
rng = np.random.default_rng(5)

def oud(f, dur, vel=1.0):
    """Karplus-Strong pluck with a warm low-passed body."""
    N = int(SR / f); L = int(SR * dur)
    buf = rng.uniform(-1, 1, N); out = np.empty(L)
    for i in range(L):
        out[i] = buf[i % N]
        buf[i % N] = 0.497 * (buf[i % N] + buf[(i + 1) % N])
    att = np.minimum(1, np.arange(L) / (SR * .004))
    return out * att * vel

mix = np.zeros(n)
def add(sig, start, gain):
    s = int(start * SR); e = min(n, s + len(sig))
    mix[s:e] += sig[:e - s] * gain

# string pad: D drone with A and a soft Hijaz colour (F#, Eb) rising later
pad = np.zeros(n)
for m, g, ph in [(38, .5, 0), (50, .35, .7), (57, .28, 1.4), (62, .18, 2.1), (66, .10, 0.3)]:
    f = hz(m)
    vib = 1 + .003 * np.sin(2 * np.pi * 5.2 * t + ph)
    phase = 2 * np.pi * np.cumsum(f * vib) / SR
    pad += g * (np.sin(phase) + .3 * np.sin(2 * phase) + .12 * np.sin(3 * phase))
pad *= (.55 + .45 * np.sin(2 * np.pi * .07 * t - 1.5)) * np.clip(t / 2.5, 0, 1)
mix += pad * .22

# melody (time, midi, duration) — Hijaz: D Eb F# G A Bb C
mel = [(1.6, 69, .8), (2.4, 70, .4), (2.8, 69, .4), (3.2, 67, 1.0), (4.2, 66, .5), (4.7, 63, .5), (5.2, 62, 1.5),
       (7.0, 62, .35), (7.35, 66, .35), (7.7, 67, .35), (8.05, 69, 1.0), (9.05, 72, .5), (9.55, 70, .5),
       (10.05, 69, .55), (10.6, 67, .45), (11.05, 66, .45), (11.5, 63, .45), (11.95, 62, 2.6)]
for st, m, du in mel:
    f = hz(m)
    if du >= .9:                     # risha tremolo on long notes, fading
        k = 0
        while k * .11 < du - .1:
            add(oud(f, .5, .9 - .5 * k * .11 / du), st + k * .11, .32)
            k += 1
        add(oud(f, 1.6, .7), st + k * .11, .3)
    else:
        add(oud(f, du + .9), st, .42)
    add(oud(f / 2, du + .6, .5), st, .12)   # octave below for body

# soft daf: low "dum" + light "tak", sparse slow pattern
def drum(freq, decay, noise):
    L = int(SR * .6); tt = np.arange(L) / SR
    body = np.sin(2 * np.pi * freq * tt * (1 + .5 * np.exp(-tt * 30))) * np.exp(-tt * decay)
    return body + noise * rng.uniform(-1, 1, L) * np.exp(-tt * 40)
dum, tak = drum(70, 7, .15), drum(220, 18, .5)
for bar in np.arange(3.2, 13.0, 2.4):
    add(dum, bar, .22); add(tak, bar + .9, .08); add(tak, bar + 1.5, .06); add(dum, bar + 1.8, .14)

# room: a few diffuse delays per channel
L_, R_ = mix.copy(), mix.copy()
for d, g in [(.043, .25), (.089, .2), (.137, .16), (.211, .12), (.317, .08)]:
    k = int(d * SR)
    L_[k:] += g * mix[:-k]
    k2 = int((d * 1.13) * SR)
    R_[k2:] += g * mix[:-k2]
st = np.stack([L_, R_], 1)
st *= (np.clip(t / .6, 0, 1) * np.clip((D - t) / 1.6, 0, 1))[:, None]
st /= np.abs(st).max() * 1.12
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st * 32767).astype('<i2').tobytes())
