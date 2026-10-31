/**
 * Layer A — recorded loops.
 * Two buffer voices per perspective, constant-power rpm crossfade.
 * If a car has no manifest, this stays silent and the pulse engine carries the car.
 */

const RATE_MIN = 0.78;
const RATE_MAX = 1.25;

export function measuredRpm(fundamentalHz, cylinders) {
  return fundamentalHz * 60 / cylinders * 2;
}

export function playbackRate(rpm, loopRpm) {
  if (!(loopRpm > 0)) return 1;
  let rate = rpm / loopRpm;
  if (rate < RATE_MIN) rate = RATE_MIN;
  else if (rate > RATE_MAX) rate = RATE_MAX;
  return rate;
}

/** t across the crossfade, gA = cos(t·π/2), gB = sin(t·π/2). */
export function crossfadeGains(rpm, rpmA, rpmB) {
  const mid = (rpmA + rpmB) * 0.5;
  const width = Math.max(rpmA, rpmB) <= 2500 ? 125 : 250;
  let t = (rpm - (mid - width * 0.5)) / width;
  if (t < 0) t = 0;
  else if (t > 1) t = 1;
  return {
    t,
    gA: Math.cos(t * Math.PI * 0.5),
    gB: Math.sin(t * Math.PI * 0.5)
  };
}

export function neighborPair(loops, rpm) {
  const n = loops.length;
  if (!n) return null;
  if (n === 1 || rpm <= loops[0].measuredRpm) {
    return { a: 0, b: 0, gA: 1, gB: 0 };
  }
  const last = n - 1;
  if (rpm >= loops[last].measuredRpm) {
    return { a: last, b: last, gA: 1, gB: 0 };
  }
  let i = 0;
  while (i < last - 1 && loops[i + 1].measuredRpm < rpm) i += 1;
  const fade = crossfadeGains(rpm, loops[i].measuredRpm, loops[i + 1].measuredRpm);
  return { a: i, b: i + 1, gA: fade.gA, gB: fade.gB };
}

export function prepareLoops(list, cylinders) {
  const out = [];
  (list || []).forEach((item) => {
    if (!item || !item.file) return;
    const fundamentalHz = Number(item.fundamentalHz);
    let measured = Number(item.measuredRpm);
    if (!(measured > 0) && fundamentalHz > 0 && cylinders > 0) {
      measured = measuredRpm(fundamentalHz, cylinders);
    }
    if (!(measured > 0)) return;
    out.push({
      file: String(item.file),
      fundamentalHz: fundamentalHz > 0 ? fundamentalHz : 0,
      measuredRpm: measured,
      buffer: null
    });
  });
  out.sort((a, b) => a.measuredRpm - b.measuredRpm);
  return out;
}

function dbToGain(db) {
  return Math.pow(10, db / 20);
}

class Voice {
  constructor(ctx) {
    this.ctx = ctx;
    this.gain = ctx.createGain();
    this.gain.gain.value = 0;
    this.src = null;
    this.fade = null;
    this.loopIndex = -1;
  }

  connect(dest) {
    this.gain.connect(dest);
  }

  setGain(value) {
    const t = this.ctx.currentTime;
    const g = this.gain.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.setTargetAtTime(value, t, 0.02);
  }

  setRate(rate) {
    if (!this.src) return;
    const t = this.ctx.currentTime;
    const p = this.src.playbackRate;
    p.cancelScheduledValues(t);
    p.setValueAtTime(p.value, t);
    p.setTargetAtTime(rate, t, 0.05);
  }

  assign(buffer, index, rate) {
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.playbackRate.setValueAtTime(rate, t);
    const fade = this.ctx.createGain();
    fade.gain.setValueAtTime(0, t);
    fade.gain.linearRampToValueAtTime(1, t + 0.03);
    src.connect(fade);
    fade.connect(this.gain);
    src.start(t);
    if (this.src) {
      const old = this.src;
      const oldFade = this.fade;
      if (oldFade) {
        oldFade.gain.cancelScheduledValues(t);
        oldFade.gain.setValueAtTime(oldFade.gain.value, t);
        oldFade.gain.linearRampToValueAtTime(0, t + 0.03);
      }
      old.stop(t + 0.04);
      old.onended = () => {
        try { old.disconnect(); } catch (err) { /* already gone */ }
        try { if (oldFade) oldFade.disconnect(); } catch (err) { /* already gone */ }
      };
    }
    this.src = src;
    this.fade = fade;
    this.loopIndex = index;
  }

  stop() {
    const t = this.ctx.currentTime;
    this.setGain(0);
    if (this.src) {
      try { this.src.stop(t + 0.05); } catch (err) { /* already stopped */ }
      this.src = null;
      this.fade = null;
    }
    this.loopIndex = -1;
  }
}

function drivePair(voices, loops, rpm, mix) {
  if (!loops.length || mix <= 0.0008) {
    voices[0].setGain(0);
    voices[1].setGain(0);
    return;
  }
  const pair = neighborPair(loops, rpm);
  const want = pair.a === pair.b ? [pair.a] : [pair.a, pair.b];
  const gains = pair.a === pair.b ? [mix] : [pair.gA * mix, pair.gB * mix];
  const used = [false, false];
  const assigned = [-1, -1];
  for (let w = 0; w < want.length; w++) {
    for (let v = 0; v < 2; v++) {
      if (!used[v] && voices[v].loopIndex === want[w]) {
        used[v] = true;
        assigned[w] = v;
        break;
      }
    }
  }
  for (let w = 0; w < want.length; w++) {
    if (assigned[w] >= 0) continue;
    for (let v = 0; v < 2; v++) {
      if (used[v]) continue;
      used[v] = true;
      assigned[w] = v;
      const loop = loops[want[w]];
      if (loop.buffer) voices[v].assign(loop.buffer, want[w], playbackRate(rpm, loop.measuredRpm));
      break;
    }
  }
  for (let v = 0; v < 2; v++) {
    let g = 0;
    let rate = 1;
    let idx = -1;
    for (let w = 0; w < want.length; w++) {
      if (assigned[w] !== v) continue;
      g = gains[w];
      idx = want[w];
      rate = playbackRate(rpm, loops[idx].measuredRpm);
    }
    if (g > 0 && voices[v].loopIndex === idx) voices[v].setRate(rate);
    voices[v].setGain(g);
  }
}

export class LoopEngine {
  constructor(ctx) {
    this.ctx = ctx;
    this.output = ctx.createGain();
    this.output.gain.value = 1;
    this._token = 0;
    this.running = false;
    this.hasLoops = false;
    this.emulating = false;
    this.cylinders = 8;
    this.rpm = 800;
    this.load = 0.2;
    this._sets = [];
    this._buildEmulation();
  }

  _buildEmulation() {
    const ctx = this.ctx;
    this._hp1 = ctx.createBiquadFilter();
    this._hp2 = ctx.createBiquadFilter();
    this._hp1.type = 'highpass';
    this._hp2.type = 'highpass';
    this._hp1.frequency.value = 165;
    this._hp2.frequency.value = 165;
    this._hp1.Q.value = 0.707;
    this._hp2.Q.value = 0.707;

    this.exhaustTrim = ctx.createGain();
    this.engineTrim = ctx.createGain();
    this.intakeTrim = ctx.createGain();
    this.cut2k = ctx.createBiquadFilter();
    this.cut10k = ctx.createBiquadFilter();
    this.cutFund = ctx.createBiquadFilter();
    [this.cut2k, this.cut10k, this.cutFund].forEach((f) => {
      f.type = 'peaking';
      f.gain.value = 0;
    });
    this.cut2k.frequency.value = 2000;
    this.cut2k.Q.value = 1.1;
    this.cut10k.frequency.value = 10000;
    this.cut10k.Q.value = 0.8;
    this.cutFund.frequency.value = 80;
    this.cutFund.Q.value = 2;

    this._hp1.connect(this._hp2);
    this._hp2.connect(this.exhaustTrim);
    this.exhaustTrim.connect(this.cut2k);
    this.cut2k.connect(this.cut10k);
    this.cut10k.connect(this.cutFund);
    this.cutFund.connect(this.output);
    this.engineTrim.connect(this.output);
    this.intakeTrim.connect(this.output);
  }

  async setCar(car) {
    const token = ++this._token;
    this._silence();
    this.hasLoops = false;
    this.emulating = false;
    this.cylinders = (car && car.cylinders) || 8;
    const id = car && car.id;
    if (!id) return;
    let manifest = null;
    try {
      const res = await fetch('loops/' + id + '/manifest.json', { cache: 'no-store' });
      if (res.ok) manifest = await res.json();
    } catch (err) {
      manifest = null;
    }
    if (token !== this._token) return;
    if (!manifest || !manifest.perspectives) return;
    const built = await this._loadManifest(manifest, token);
    if (!built || token !== this._token) return;
    this._sets = built;
    this.hasLoops = built.some((set) => set.on.length || set.off.length);
    this.emulating = this.hasLoops && built.every((set) => set.off.length === 0);
    if (this.running) this._arm();
  }

  async _loadManifest(manifest, token) {
    const cylinders = manifest.cylinders || this.cylinders;
    const perspectives = manifest.perspectives || {};
    const names = ['exhaust', 'engine', 'intake'];
    const built = [];
    for (let i = 0; i < names.length; i++) {
      const block = perspectives[names[i]] || {};
      const on = prepareLoops(block.on, cylinders);
      const off = prepareLoops(block.off, cylinders);
      const all = on.concat(off);
      for (let k = 0; k < all.length; k++) {
        const loop = all[k];
        try {
          const res = await fetch('loops/' + manifest.carId + '/' + loop.file, { cache: 'no-store' });
          if (!res.ok) throw new Error('missing ' + loop.file);
          const raw = await res.arrayBuffer();
          if (token !== this._token) return null;
          loop.buffer = await this.ctx.decodeAudioData(raw.slice(0));
        } catch (err) {
          loop.buffer = null;
        }
      }
      built.push({
        name: names[i],
        on: on.filter((loop) => loop.buffer),
        off: off.filter((loop) => loop.buffer),
        onVoices: null,
        offVoices: null
      });
    }
    const any = built.some((set) => set.on.length || set.off.length);
    return any ? built : built;
  }

  _arm() {
    const ctx = this.ctx;
    this._sets.forEach((set) => {
      const dest = set.name === 'exhaust' ? this._hp1 : set.name === 'engine' ? this.engineTrim : this.intakeTrim;
      if (set.on.length && !set.onVoices) {
        set.onVoices = [new Voice(ctx), new Voice(ctx)];
        set.onVoices.forEach((voice) => voice.connect(dest));
      }
      if (set.off.length && !set.offVoices) {
        set.offVoices = [new Voice(ctx), new Voice(ctx)];
        set.offVoices.forEach((voice) => voice.connect(dest));
      }
    });
  }

  _silence() {
    this._sets.forEach((set) => {
      if (set.onVoices) set.onVoices.forEach((voice) => voice.stop());
      if (set.offVoices) set.offVoices.forEach((voice) => voice.stop());
    });
    this._sets = [];
  }

  start() {
    this.running = true;
    this._arm();
  }

  stop() {
    this.running = false;
    this._sets.forEach((set) => {
      if (set.onVoices) set.onVoices.forEach((voice) => voice.stop());
      if (set.offVoices) set.offVoices.forEach((voice) => voice.stop());
      set.onVoices = null;
      set.offVoices = null;
    });
  }

  update(rpm, load) {
    this.rpm = rpm;
    this.load = load < 0 ? 0 : load > 1 ? 1 : load;
    if (!this.running || !this.hasLoops) return;
    const tLoad = this.load;
    const gOn = Math.sin(tLoad * Math.PI * 0.5);
    const gOff = Math.cos(tLoad * Math.PI * 0.5);
    this._sets.forEach((set) => {
      const hasOff = set.off.length > 0;
      if (set.onVoices) drivePair(set.onVoices, set.on, rpm, hasOff ? gOn : 1);
      if (set.offVoices) drivePair(set.offVoices, set.off, rpm, hasOff ? gOff : 0);
    });
    this._applyEmulation();
  }

  _applyEmulation() {
    const t = this.ctx.currentTime;
    const lift = this.emulating ? 1 - this.load : 0;
    const exhaustDb = -3 * lift;
    const engineDb = -3 * lift;
    this.exhaustTrim.gain.setTargetAtTime(dbToGain(exhaustDb), t, 0.04);
    this.engineTrim.gain.setTargetAtTime(dbToGain(engineDb), t, 0.04);
    this.intakeTrim.gain.setTargetAtTime(this.emulating ? this.load : 1, t, 0.04);
    this.cut2k.gain.setTargetAtTime(-5.5 * lift, t, 0.05);
    this.cut10k.gain.setTargetAtTime(-6.5 * lift, t, 0.05);
    const firing = Math.max(35, this.rpm / 60 * (this.cylinders / 2));
    this.cutFund.frequency.setTargetAtTime(Math.min(18000, firing), t, 0.05);
    this.cutFund.gain.setTargetAtTime(-3.5 * lift, t, 0.05);
  }
}
