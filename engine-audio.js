/**
 * Real-time engine voice. Sine partials only (a sawtooth cancels the even
 * harmonics), plus a band-limited haze. No samples and no recorded loops.
 *
 * setCar / start / setRpm / setLoad / update / liftOff / shift / stop / setVolume
 */

import { PARTIALS, PROFILES, VOICE } from './sound-profiles.js';

const BAND_EDGE = [0, 1300, 2500, 4000, 6000];
const BAND_ORDER = ['idle', '1.3-2.5k', '2.5-4k', '4-6k', '6k+'];
const CROSS = 180;

const CABIN = {
  premium: { hpf: 105, shelf: 0 },
  base: { hpf: 130, shelf: -3 },
  headphones: { hpf: 90, shelf: 0 }
};

function dbToGain(db) {
  return Math.pow(10, db / 20);
}

function clamp(x, a, b) {
  return x < a ? a : x > b ? b : x;
}

const held = new WeakMap();
let scheduling = false;

function glide(param, value, t, tau) {
  const prev = scheduling && held.has(param) ? held.get(param) : param.value;
  param.cancelScheduledValues(t);
  param.setValueAtTime(prev, t);
  param.setTargetAtTime(value, t, tau);
  if (scheduling) held.set(param, value);
}

function sampleProfile(profile, rpm) {
  const avail = [];
  for (let i = 0; i < BAND_ORDER.length; i++) {
    if (profile[BAND_ORDER[i]]) avail.push(i);
  }
  let ia = avail[0];
  let ib = avail[0];
  let t = 0;
  for (let n = 0; n < avail.length; n++) {
    const i = avail[n];
    const lo = BAND_EDGE[i];
    const hi = i + 1 < BAND_EDGE.length ? BAND_EDGE[i + 1] : 20000;
    if (rpm >= lo && rpm < hi) {
      ia = i;
      const next = avail[n + 1];
      if (next !== undefined && rpm > hi - CROSS) {
        ib = next;
        t = clamp((rpm - (hi - CROSS)) / CROSS, 0, 1);
      } else {
        ib = i;
      }
      break;
    }
    ia = ib = i;
  }
  const a = { band: profile[BAND_ORDER[ia]] };
  const b = { band: profile[BAND_ORDER[ib]] };
  const gains = new Array(PARTIALS.length);
  let peak = 0;
  for (let k = 0; k < PARTIALS.length; k++) {
    const g = dbToGain(a.band.rel[k]) * (1 - t) + dbToGain(b.band.rel[k]) * t;
    gains[k] = g;
    if (g > peak) peak = g;
  }
  const norm = peak || 1;
  for (let k = 0; k < gains.length; k++) gains[k] /= norm;
  return {
    gains,
    rms: a.band.rms * (1 - t) + b.band.rms * t,
    centroid: a.band.centroid * (1 - t) + b.band.centroid * t,
    rolloff: a.band.rolloff * (1 - t) + b.band.rolloff * t,
    thr: a.band.thr * (1 - t) + b.band.thr * t
  };
}

function clipCurve() {
  const n = 512;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = Math.tanh(1.4 * x);
  }
  return curve;
}

export default class EngineAudio {
  constructor(audioContext) {
    this.ctx = audioContext;
    this.cabin = 'premium';
    this.ready = Promise.resolve(true);
    this.hasLoops = false;
    this._running = false;
    this._rpm = 800;
    this._load = 0.1;
    this._profile = null;
    this._voice = VOICE['ford-mustang-gt'];
    this._cylinders = 8;
    this._burble = 0.15;
    this._liftUntil = 0;
    this._whineHold = 0;
    this._built = false;
    this._build();
    this.setCabin('premium');
    this.setCar({ id: 'ford-mustang-gt', cylinders: 8, idleRpm: 750, redline: 7500, sound: {} });
  }

  _build() {
    const ctx = this.ctx;
    this.sum = ctx.createGain();
    this.sum.gain.value = 0.04;
    this.level = ctx.createGain();
    this.level.gain.value = 1;
    this.wander = ctx.createGain();
    this.wander.gain.value = 1;
    this.hpf = ctx.createBiquadFilter();
    this.hpf.type = 'highpass';
    this.hpf.frequency.value = 105;
    this.hpf.Q.value = 0.707;
    this.shelf = ctx.createBiquadFilter();
    this.shelf.type = 'lowshelf';
    this.shelf.frequency.value = 180;
    this.shelf.gain.value = 0;
    this.lpf = ctx.createBiquadFilter();
    this.lpf.type = 'lowpass';
    this.lpf.frequency.value = 1600;
    this.lpf.Q.value = 0.7;
    this.shiftGain = ctx.createGain();
    this.shiftGain.gain.value = 1;
    this.limiter = ctx.createDynamicsCompressor();
    this.limiter.threshold.value = -6;
    this.limiter.knee.value = 3;
    this.limiter.ratio.value = 12;
    this.limiter.attack.value = 0.005;
    this.limiter.release.value = 0.12;
    this.clip = ctx.createWaveShaper();
    this.clip.curve = clipCurve();
    this.clip.oversample = '2x';
    this.volume = ctx.createGain();
    this.volume.gain.value = 0.75;

    this.oscs = [];
    this.gains = [];
    for (let i = 0; i < PARTIALS.length; i++) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 40 * PARTIALS[i];
      const gain = ctx.createGain();
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(this.sum);
      osc.start();
      this.oscs.push(osc);
      this.gains.push(gain);
    }

    const seconds = 2;
    const n = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, n, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let y = 0;
    for (let i = 0; i < n; i++) {
      y = y * 0.02 + (Math.random() * 2 - 1) * 0.98;
      data[i] = y * 0.5;
    }
    this.noise = ctx.createBufferSource();
    this.noise.buffer = buffer;
    this.noise.loop = true;
    this.hazeHp = ctx.createBiquadFilter();
    this.hazeHp.type = 'highpass';
    this.hazeHp.frequency.value = 280;
    this.hazeHp.Q.value = 0.707;
    this.hazeLp = ctx.createBiquadFilter();
    this.hazeLp.type = 'lowpass';
    this.hazeLp.frequency.value = 1750;
    this.hazeLp.Q.value = 0.7;
    this.hazeAmp = ctx.createGain();
    this.hazeAmp.gain.value = 0.45;
    this.hazeLevel = ctx.createGain();
    this.hazeLevel.gain.value = 0.08;
    this.hazeMod = ctx.createGain();
    this.hazeMod.gain.value = 0.28;
    this.noise.connect(this.hazeHp);
    this.hazeHp.connect(this.hazeLp);
    this.hazeLp.connect(this.hazeAmp);
    this.hazeAmp.connect(this.hazeLevel);
    this.hazeLevel.connect(this.sum);
    this.oscs[1].connect(this.hazeMod);
    this.hazeMod.connect(this.hazeAmp.gain);
    this.noise.start();

    this.whine = [ctx.createOscillator(), ctx.createOscillator()];
    this.whineGain = [ctx.createGain(), ctx.createGain()];
    for (let i = 0; i < 2; i++) {
      this.whine[i].type = 'sine';
      this.whine[i].frequency.value = 1000;
      this.whineGain[i].gain.value = 0;
      this.whine[i].connect(this.whineGain[i]);
      this.whineGain[i].connect(this.sum);
      this.whine[i].start();
    }

    this.sum.connect(this.level);
    this.level.connect(this.wander);
    this.wander.connect(this.hpf);
    this.hpf.connect(this.shelf);
    this.shelf.connect(this.lpf);
    this.lpf.connect(this.shiftGain);
    this.shiftGain.connect(this.limiter);
    this.limiter.connect(this.clip);
    this.clip.connect(this.volume);
    this.volume.connect(ctx.destination);
    this._built = true;
  }

  setCabin(mode) {
    const preset = CABIN[mode] || CABIN.premium;
    this.cabin = CABIN[mode] ? mode : 'premium';
    const t = this.ctx.currentTime;
    glide(this.hpf.frequency, preset.hpf, t, 0.04);
    glide(this.shelf.gain, preset.shelf, t, 0.04);
  }

  setVolume(value) {
    glide(this.volume.gain, clamp(value, 0, 1), this.ctx.currentTime, 0.02);
  }

  setCar(car) {
    const id = (car && car.id) || 'ford-mustang-gt';
    this._id = id;
    this._profile = PROFILES[id] || PROFILES['ford-mustang-gt'];
    this._voice = VOICE[id] || VOICE['ford-mustang-gt'];
    this._cylinders = (car && car.cylinders) || 8;
    this._idle = (car && car.idleRpm) || 800;
    const sound = (car && car.sound) || {};
    this._burble = sound.burble != null ? sound.burble : this._voice.burble;
    if (this._running) {
      const t = this.ctx.currentTime;
      glide(this.shiftGain.gain, 0.25, t, 0.01);
      this.shiftGain.gain.setTargetAtTime(1, t + 0.04, 0.03);
    }
  }

  setRpm(rpm) { this._rpm = rpm > 0 ? rpm : 0; }
  setLoad(load) { this._load = clamp(load, 0, 1); }

  liftOff() {
    if (this._rpm < 2500) return;
    this._liftUntil = this.ctx.currentTime + 0.45;
    this._whineHold = this.ctx.currentTime + 0.5;
    if (this._burble >= 0.35 && this._rpm > 3500 && Math.random() < this._burble * 0.25) {
      this._pop();
    }
  }

  /** Torque hole on an upshift: about −23 dB for 70 ms. RPM drop is the gearbox. */
  shift() {
    const t = this.ctx.currentTime;
    const depth = dbToGain(-22);
    const g = this.shiftGain.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(depth, t + 0.018);
    g.linearRampToValueAtTime(1, t + 0.09);
    this._liftUntil = Math.max(this._liftUntil, t + 0.06);
  }

  _pop() {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noise.buffer;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 180 + Math.random() * 500;
    bp.Q.value = 1.2;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.2, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    src.connect(bp);
    bp.connect(g);
    g.connect(this.lpf);
    src.start(t);
    src.stop(t + 0.1);
  }

  start() {
    if (this.ctx.resume) this.ctx.resume();
    this._running = true;
    const t = this.ctx.currentTime;
    glide(this.shiftGain.gain, 1, t, 0.03);
    glide(this.level.gain, 0.04, t, 0.02);
  }

  stop() {
    this._running = false;
    const t = this.ctx.currentTime;
    glide(this.level.gain, 0.0001, t, 0.04);
    for (let i = 0; i < this.whineGain.length; i++) glide(this.whineGain[i].gain, 0, t, 0.03);
  }

  update(at) {
    if (!this._running || !this._profile) return;
    scheduling = typeof at === 'number';
    const t = scheduling ? at : this.ctx.currentTime;
    let rpm = this._rpm;
    let load = this._load;
    if (t < this._liftUntil) load *= 0.15;
    const frame = sampleProfile(this._profile, rpm);
    const firing = Math.max(12, rpm / 60 * (this._cylinders / 2));
    const partialScale = 0.22;
    const hpfHz = (CABIN[this.cabin] || CABIN.premium).hpf;
    for (let i = 0; i < PARTIALS.length; i++) {
      const freq = clamp(PARTIALS[i] * firing, 18, 14000);
      const f2 = freq * freq;
      const c2 = hpfHz * hpfHz;
      const hpfMag = (f2 * f2) / ((f2 * f2) + (c2 * c2));
      const restore = 1 / Math.max(0.18, Math.sqrt(hpfMag));
      glide(this.oscs[i].frequency, freq, t, 0.03);
      glide(this.gains[i].gain, frame.gains[i] * partialScale * restore, t, 0.04);
    }
    const idleRms = this._profile.idle ? this._profile.idle.rms : frame.rms;
    const db = (frame.rms - idleRms) * 1.25 + (load - frame.thr) * this._voice.lift;
    const loud = dbToGain(clamp(db, -8, 16));
    glide(this.level.gain, 0.28 * loud, t, 0.05);

    const bright = clamp(frame.rolloff * (1.05 + 0.35 * load), 1600, 5200);
    glide(this.lpf.frequency, bright, t, 0.05);
    glide(this.hazeLp.frequency, clamp(1100 + rpm * 0.22, 1200, 2100), t, 0.06);
    const haze = partialScale * dbToGain(-this._voice.haze) * (0.55 + load) * (0.85 + rpm / 6500);
    glide(this.hazeLevel.gain, haze * 32, t, 0.05);

    const wobble = Math.sin(t * Math.PI * 2 * 4.2) * 0.16
      + Math.sin(t * Math.PI * 2 * 7.4) * 0.08
      + Math.sin(t * Math.PI * 2 * (rpm / 60)) * 0.05;
    glide(this.wander.gain, clamp(1 + wobble, 0.6, 1.4), t, 0.02);

    const whineOn = this._voice.whine && t >= this._whineHold && load > 0.08;
    const fadeIn = clamp((rpm - 2600) / 700, 0, 1);
    const whineAmt = whineOn ? Math.pow(load, 1.6) * fadeIn * fadeIn : 0;
    glide(this.whine[0].frequency, clamp(0.712 * rpm, 30, 12000), t, 0.04);
    glide(this.whine[1].frequency, clamp(1.07 * rpm, 30, 14000), t, 0.04);
    glide(this.whineGain[0].gain, whineAmt * 0.11, t, 0.04);
    glide(this.whineGain[1].gain, whineAmt * 0.16, t, 0.04);
    scheduling = false;
  }
}

export { EngineAudio };
