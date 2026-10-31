/**
 * Crank-angle pulse engine. One pressure pulse per firing, inside the block
 * at a fractional sample — never snapped to the 128-frame boundary.
 * No allocations in process().
 */

const MAX_FIRINGS = 16;
const MAX_PULSES = 24;

class PulseEngineProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'rpm', defaultValue: 800, minValue: 0, maxValue: 14000, automationRate: 'a-rate' },
      { name: 'load', defaultValue: 0.15, minValue: 0, maxValue: 1, automationRate: 'a-rate' },
      { name: 'pulseGain', defaultValue: 0.8, minValue: 0, maxValue: 2, automationRate: 'k-rate' },
      { name: 'dfco', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
      { name: 'limit', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
      { name: 'popRate', defaultValue: 0, minValue: 0, maxValue: 40, automationRate: 'k-rate' }
    ];
  }

  constructor() {
    super();
    this.theta = 0;
    this.nextIndex = 0;
    this.nFiring = 0;
    this.angles = new Float32Array(MAX_FIRINGS);
    this.banks = new Uint8Array(MAX_FIRINGS);
    this.gains = new Float32Array(MAX_FIRINGS);
    this.idleRpm = 750;
    this.noise = 0.25;
    this.rng = 0xA341316C;

    this.pOn = new Uint8Array(MAX_PULSES);
    this.pAge = new Float32Array(MAX_PULSES);
    this.pAmp = new Float32Array(MAX_PULSES);
    this.pAtk = new Float32Array(MAX_PULSES);
    this.pDec = new Float32Array(MAX_PULSES);
    this.pNoise = new Float32Array(MAX_PULSES);
    this.pBank = new Uint8Array(MAX_PULSES);

    this.rpmWalk = 0;
    this.walkTarget = 0;
    this.walkHold = 0;
    this.tailL = 0;
    this.tailR = 0;
    this.lpY = 0;
    this.pump = 0;
    this.limitOpen = 1;
    this.limitHold = 1;

    this.lpA = 1 - Math.exp((-2 * Math.PI * 250) / sampleRate);
    this.tailA = 1 - Math.exp(-1 / (sampleRate * 0.012));

    this.port.onmessage = (event) => {
      const data = event.data;
      if (!data || data.type !== 'car') return;
      const n = data.count | 0;
      if (n < 1 || n > MAX_FIRINGS) return;
      for (let i = 0; i < n; i++) {
        this.angles[i] = data.angles[i];
        this.banks[i] = data.banks[i];
        this.gains[i] = data.gains[i];
      }
      this.nFiring = n;
      this.idleRpm = data.idleRpm || 800;
      this.noise = data.noise > 0 ? data.noise : 0.2;
      this.nextIndex = 0;
      for (let i = 0; i < n; i++) {
        if (this.angles[i] > this.theta) {
          this.nextIndex = i;
          break;
        }
      }
    };
  }

  _rand() {
    let x = this.rng | 0;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    if (x === 0) x = 0x6d2b79f5;
    this.rng = x;
    return (x >>> 0) * 2.3283064365386963e-10;
  }

  _spawn(amp, atk, dec, noise, bank, age0) {
    const pool = this.pOn;
    for (let s = 0; s < MAX_PULSES; s++) {
      if (pool[s]) continue;
      pool[s] = 1;
      this.pAge[s] = age0;
      this.pAmp[s] = amp;
      this.pAtk[s] = atk > 1 ? atk : 1;
      this.pDec[s] = dec > 1 ? dec : 1;
      this.pNoise[s] = noise;
      this.pBank[s] = bank;
      return;
    }
  }

  _emit(frac, idx, rpm, load, pulseGain, dTheta) {
    const jitDeg = 1 + this._rand();
    const delay = dTheta > 1e-6 ? jitDeg / dTheta : 0;
    const nrm = rpm * 0.000125;
    const nCl = nrm < 0 ? 0 : nrm > 1 ? 1 : nrm;
    const atk = sampleRate * (0.0025 - 0.0019 * nCl);
    const dec = sampleRate * (0.017 - 0.012 * nCl);
    const wobble = 1 + (this._rand() * 2 - 1) * 0.03;
    const amp = 0.36 * (0.42 + 0.58 * load) * this.gains[idx] * wobble * pulseGain;
    const noise = amp * (0.45 + this.noise);
    this._spawn(amp, atk, dec, noise, this.banks[idx], (1 - frac) - delay);
  }

  process(_inputs, outputs, parameters) {
    const leftCh = outputs[0] && outputs[0][0];
    const rightCh = outputs[1] && outputs[1][0];
    const intakeCh = outputs[2] && outputs[2][0];
    const lowCh = outputs[3] && outputs[3][0];
    if (!leftCh || !rightCh || !intakeCh || !lowCh) return true;

    const block = leftCh.length;
    const rpmArr = parameters.rpm;
    const loadArr = parameters.load;
    const rpmN = rpmArr.length;
    const loadN = loadArr.length;
    const pulseGain = parameters.pulseGain[0];
    const dfco = parameters.dfco[0] > 0.5;
    const limit = parameters.limit[0] > 0.5;
    const popRate = parameters.popRate[0];
    const nFire = this.nFiring;

    if (!(this.theta >= 0) || this.theta >= 720) this.theta = 0;

    for (let i = 0; i < block; i++) {
      let rpm = rpmN > 1 ? rpmArr[i] : rpmArr[0];
      let load = loadN > 1 ? loadArr[i] : loadArr[0];
      if (!(rpm > 0)) rpm = 0;
      if (!(load >= 0)) load = 0;
      else if (load > 1) load = 1;

      const nearIdle = rpm < this.idleRpm + 90 && rpm > this.idleRpm - 280 && load < 0.22;
      if (nearIdle) {
        this.walkHold -= 1;
        if (this.walkHold <= 0) {
          this.walkTarget = (this._rand() * 2 - 1) * 30;
          this.walkHold = ((0.16 + this._rand() * 0.3) * sampleRate) | 0;
        }
        this.rpmWalk += (this.walkTarget - this.rpmWalk) * 0.0014;
      } else {
        this.rpmWalk += (0 - this.rpmWalk) * 0.0025;
      }
      const rpmE = rpm + this.rpmWalk > 1 ? rpm + this.rpmWalk : 1;
      const dTheta = 360 * (rpmE / 60) / sampleRate;

      if (limit) {
        this.limitHold -= 1;
        if (this.limitHold <= 0) {
          this.limitOpen = this.limitOpen ? 0 : 1;
          this.limitHold = (sampleRate * 0.042) | 0;
        }
      } else {
        this.limitOpen = 1;
      }

      const prev = this.theta;
      let th = prev + dTheta;
      let wrapped = false;
      if (th >= 720) {
        th -= 720;
        wrapped = true;
      }
      this.theta = th;

      if (nFire > 0 && pulseGain > 0.0001) {
        const allow = !dfco && !(limit && !this.limitOpen);
        let idx = this.nextIndex;
        if (idx >= nFire) idx = 0;
        if (!wrapped) {
          const ang = this.angles[idx];
          if (prev < ang && th >= ang) {
            if (allow) this._emit((ang - prev) / dTheta, idx, rpmE, load, pulseGain, dTheta);
            idx = idx + 1 < nFire ? idx + 1 : 0;
          }
        } else {
          const ang = this.angles[idx];
          if (ang >= prev) {
            if (allow) this._emit((ang - prev) / dTheta, idx, rpmE, load, pulseGain, dTheta);
            idx = idx + 1 < nFire ? idx + 1 : 0;
          }
          const ang2 = this.angles[idx];
          if (ang2 <= th) {
            if (allow) this._emit((ang2 + 720 - prev) / dTheta, idx, rpmE, load, pulseGain, dTheta);
            idx = idx + 1 < nFire ? idx + 1 : 0;
          }
        }
        this.nextIndex = idx;
      }

      if (dfco && popRate > 0 && this._rand() < popRate / sampleRate) {
        const amp = 0.62 + this._rand() * 0.55;
        this._spawn(amp, sampleRate * 0.0011, sampleRate * (0.018 + this._rand() * 0.028), amp, this._rand() < 0.5 ? 0 : 1, 0);
      }

      let envL = 0;
      let envR = 0;
      let nL = 0;
      let nR = 0;
      let intake = 0;
      for (let s = 0; s < MAX_PULSES; s++) {
        if (!this.pOn[s]) continue;
        let age = this.pAge[s];
        if (age < 0) {
          age += 1;
          this.pAge[s] = age;
          continue;
        }
        const atk = this.pAtk[s];
        let env;
        if (age < atk) {
          const u = age / atk;
          env = 0.5 - 0.5 * Math.cos(Math.PI * u);
        } else {
          env = Math.exp(-(age - atk) / this.pDec[s]);
          if (env < 0.0008) {
            this.pOn[s] = 0;
            continue;
          }
        }
        const sig = env * this.pAmp[s];
        if (this.pBank[s] === 0) envL += sig;
        else envR += sig;
        if (age < atk * 1.25) {
          const buzz = (this._rand() * 2 - 1) * env * this.pNoise[s];
          if (this.pBank[s] === 0) nL += buzz;
          else nR += buzz;
          intake += buzz * 0.65;
        }
        intake += sig * 0.2;
        this.pAge[s] = age + 1;
      }

      this.tailL += (envL - this.tailL) * this.tailA;
      this.tailR += (envR - this.tailR) * this.tailA;

      this.pump += (this._rand() * 2 - 1 - this.pump) * (dfco ? 0.08 : 0.01);
      const puff = dfco ? this.pump * 0.22 : 0;

      const left = (envL - this.tailL) + nL + puff * 0.4;
      const right = (envR - this.tailR) + nR + puff * 0.4;
      const breath = intake + puff;

      const spike = (envL - this.tailL) + (envR - this.tailR);
      this.lpY += (spike - this.lpY) * this.lpA;
      if (this.lpY < 1e-8 && this.lpY > -1e-8) this.lpY = 0;

      leftCh[i] = left;
      rightCh[i] = right;
      intakeCh[i] = breath;
      lowCh[i] = this.lpY;
    }
    return true;
  }
}

registerProcessor('pulse-engine', PulseEngineProcessor);
