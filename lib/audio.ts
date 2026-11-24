import type { SoundEvent, SoundStyle } from "./engine/types";

const SCALE = [0, 2, 4, 7, 9]; // major pentatonic

function noteFreq(i: number, base = 261.63) {
  const idx = Math.max(0, Math.floor(i));
  const oct = Math.floor(idx / SCALE.length);
  const semi = SCALE[idx % SCALE.length] + 12 * Math.min(oct, 3);
  return base * Math.pow(2, semi / 12);
}

/**
 * Procedural ASMR sound engine (no audio files). Created lazily on a user gesture.
 * All output is routed both to the speakers and to a MediaStream for recording.
 */
export class AudioEngine {
  ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private bus: GainNode | null = null;
  private streamDest: MediaStreamAudioDestinationNode | null = null;
  private noise: AudioBuffer | null = null;
  private tokens = 8;
  private lastRefill = 0;
  private active = 0;

  enabled = true;
  volume = 0.7;
  style: SoundStyle = "marimba";

  ensure() {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AC: typeof AudioContext | undefined =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      const ctx = new AC({ latencyHint: "interactive" });
      const bus = ctx.createGain();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.knee.value = 12;
      comp.ratio.value = 6;
      comp.attack.value = 0.003;
      comp.release.value = 0.2;
      const master = ctx.createGain();
      master.gain.value = this.enabled ? this.volume : 0;
      // tiny feedback delay for space
      const delay = ctx.createDelay(0.5);
      delay.delayTime.value = 0.11;
      const fb = ctx.createGain();
      fb.gain.value = 0.18;
      const wet = ctx.createGain();
      wet.gain.value = 0.22;
      bus.connect(comp);
      bus.connect(delay);
      delay.connect(fb);
      fb.connect(delay);
      delay.connect(wet);
      wet.connect(comp);
      comp.connect(master);
      master.connect(ctx.destination);
      let dest: MediaStreamAudioDestinationNode | null = null;
      try {
        dest = ctx.createMediaStreamDestination();
        master.connect(dest);
      } catch {
        dest = null;
      }
      const len = Math.floor(ctx.sampleRate * 0.5);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.ctx = ctx;
      this.bus = bus;
      this.master = master;
      this.streamDest = dest;
      this.noise = buf;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  get stream(): MediaStream | null {
    return this.streamDest?.stream ?? null;
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    this.applyGain();
  }

  setVolume(v: number) {
    this.volume = v;
    this.applyGain();
  }

  private applyGain() {
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(this.enabled ? this.volume : 0, this.ctx.currentTime, 0.02);
  }

  /** consume a frame's worth of events, throttled to keep things musical */
  play(events: SoundEvent[], ballCount: number) {
    const ctx = this.ctx;
    if (!ctx || !this.enabled || ctx.state !== "running" || !events.length) return;
    const now = ctx.currentTime;
    const dtRefill = now - this.lastRefill;
    this.lastRefill = now;
    this.tokens = Math.min(8, this.tokens + dtRefill * 36);
    // priority: special events first, then the loudest hits
    const pri = (e: SoundEvent) => (e.kind === "boom" || e.kind === "chime" || e.kind === "split" ? 2 : 0) + e.vol;
    events.sort((a, b) => pri(b) - pri(a));
    const density = 1 / Math.sqrt(Math.max(1, events.length / 3));
    let n = 0;
    for (const e of events) {
      if (this.tokens < 1 || this.active > 28 || n >= 4) break;
      if (e.vol < 0.03) continue;
      this.tokens -= 1;
      n++;
      const pitch = e.pitch >= 0 ? e.pitch : Math.floor(Math.random() * 10) + Math.min(5, Math.floor(Math.log2(ballCount + 1) / 2));
      this.voice(e.kind, e.vol * (0.6 + 0.4 * density), pitch, now + n * 0.004);
    }
  }

  private track(node: AudioScheduledSourceNode) {
    this.active++;
    node.onended = () => {
      this.active--;
    };
  }

  private env(g: GainNode, t: number, peak: number, decay: number, attack = 0.002) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  voice(kind: SoundEvent["kind"], vol: number, pitch: number, t: number) {
    const ctx = this.ctx;
    const bus = this.bus;
    if (!ctx || !bus) return;
    if (kind === "boom") return this.boom(vol, t);
    let style: SoundStyle = this.style;
    if (kind === "tick") style = "tick";
    else if (kind === "pop") style = style === "marimba" ? "pop" : style;
    const f = noteFreq(pitch + (kind === "chime" || kind === "split" ? 5 : 0));
    const v = vol * 0.32;
    switch (style) {
      case "marimba": {
        const o = ctx.createOscillator();
        const o2 = ctx.createOscillator();
        const g = ctx.createGain();
        const g2 = ctx.createGain();
        o.type = "sine";
        o2.type = "sine";
        o.frequency.value = f;
        o2.frequency.value = f * 4;
        this.env(g, t, v, 0.45);
        this.env(g2, t, v * 0.35, 0.07);
        o.connect(g).connect(bus);
        o2.connect(g2).connect(bus);
        o.start(t);
        o2.start(t);
        o.stop(t + 0.55);
        o2.stop(t + 0.15);
        this.track(o);
        break;
      }
      case "pop": {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(f * 2.2, t);
        o.frequency.exponentialRampToValueAtTime(f * 0.6, t + 0.07);
        this.env(g, t, v * 1.1, 0.09, 0.001);
        o.connect(g).connect(bus);
        o.start(t);
        o.stop(t + 0.13);
        this.track(o);
        break;
      }
      case "tick": {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        const hp = ctx.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = 1800;
        o.type = "triangle";
        o.frequency.value = 2200 + (pitch % 10) * 160;
        this.env(g, t, v * 0.7, 0.028, 0.0008);
        o.connect(hp).connect(g).connect(bus);
        o.start(t);
        o.stop(t + 0.05);
        this.track(o);
        break;
      }
      case "synth": {
        const o = ctx.createOscillator();
        const o2 = ctx.createOscillator();
        const lp = ctx.createBiquadFilter();
        const g = ctx.createGain();
        o.type = "sawtooth";
        o2.type = "sawtooth";
        o.frequency.value = f;
        o2.frequency.value = f * 1.006;
        lp.type = "lowpass";
        lp.Q.value = 6;
        lp.frequency.setValueAtTime(600 + vol * 4000, t);
        lp.frequency.exponentialRampToValueAtTime(300, t + 0.25);
        this.env(g, t, v * 0.45, 0.28, 0.004);
        o.connect(lp);
        o2.connect(lp);
        lp.connect(g).connect(bus);
        o.start(t);
        o2.start(t);
        o.stop(t + 0.35);
        o2.stop(t + 0.35);
        this.track(o);
        break;
      }
    }
  }

  private boom(vol: number, t: number) {
    const ctx = this.ctx!;
    const bus = this.bus!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.35);
    this.env(g, t, vol * 0.7, 0.45, 0.004);
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + 0.5);
    this.track(o);
    if (this.noise) {
      const s = ctx.createBufferSource();
      s.buffer = this.noise;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 900;
      const ng = ctx.createGain();
      this.env(ng, t, vol * 0.25, 0.25, 0.002);
      s.connect(lp).connect(ng).connect(bus);
      s.start(t);
      s.stop(t + 0.3);
    }
  }
}
