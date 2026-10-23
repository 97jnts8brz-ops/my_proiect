import numpy as np, wave, sys
sr=44100; D=26.0; t=np.arange(int(sr*D))/sr
n=lambda m:440*2**((m-69)/12)
chords=[[48,55,64,71,76],[45,52,60,67,72],[41,48,57,64,69],[43,50,59,62,67]]  # Cmaj7 Am7 Fmaj7 G
seg=D/4; out=np.zeros_like(t)
for i,c in enumerate(chords):
    s=i*seg; env=np.clip((t-s)/2.0,0,1)*np.clip((s+seg+2.0-t)/2.5,0,1)
    for k,m in enumerate(c):
        f=n(m); v=np.sin(2*np.pi*f*t)+.35*np.sin(2*np.pi*2*f*t+.3)+.12*np.sin(2*np.pi*3*f*t)
        v*= .55+.45*np.sin(2*np.pi*(.15+k*.03)*t+k)  # slow shimmer
        out+=env*v/(1+k*.4)
# sparse bell notes (pentatonic)
rng=np.random.default_rng(3); bells=[72,76,79,84,88,81]
for bt in np.arange(1.5,D-2,1.3):
    f=n(rng.choice(bells)); tt=t-bt; m=tt>0
    out[m]+=.5*np.sin(2*np.pi*f*tt[m])*np.exp(-tt[m]*2.2)
out/=np.abs(out).max(); out*=np.clip(t/2,0,1)*np.clip((D-t)/2.5,0,1)*.8
# simple stereo echo
d=int(.33*sr); L=out.copy(); R=out.copy()
L[d:]+=.35*out[:-d]; R[2*d:]+=.3*out[:-2*d]
st=np.stack([L,R],1); st/=np.abs(st).max()*1.1
with wave.open(sys.argv[1],'wb') as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes((st*32767).astype('<i2').tobytes())
