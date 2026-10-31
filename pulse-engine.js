/**
 * Main-thread side of the pulse worklet: loads the processor and exposes the four taps.
 */

export class PulseEngine {
  constructor(ctx) {
    this.ctx = ctx;
    this.bankL = ctx.createGain();
    this.bankR = ctx.createGain();
    this.intake = ctx.createGain();
    this.low = ctx.createGain();
    this.bankL.gain.value = 1;
    this.bankR.gain.value = 1;
    this.intake.gain.value = 0.4;
    this.low.gain.value = 1.15;
    this.node = null;
    this._car = null;
    this._held = { rpm: 800, load: 0.15, pulseGain: 0, dfco: 0, limit: 0, popRate: 0 };
    this.ready = this._load();
  }

  async _load() {
    try {
      await this.ctx.audioWorklet.addModule(new URL('./pulse-worklet.js?v=2', import.meta.url));
      this.node = new AudioWorkletNode(this.ctx, 'pulse-engine', {
        numberOfInputs: 0,
        numberOfOutputs: 4,
        outputChannelCount: [1, 1, 1, 1]
      });
      this.node.connect(this.bankL, 0, 0);
      this.node.connect(this.bankR, 1, 0);
      this.node.connect(this.intake, 2, 0);
      this.node.connect(this.low, 3, 0);
      this._flush();
      if (this._car) this._post(this._car);
      return true;
    } catch (err) {
      this.node = null;
      return false;
    }
  }

  _param(name, value, tau) {
    this._held[name] = value;
    if (!this.node) return;
    const p = this.node.parameters.get(name);
    if (!p) return;
    const t = this.ctx.currentTime;
    p.cancelScheduledValues(t);
    p.setValueAtTime(p.value, t);
    p.setTargetAtTime(value, t, tau);
  }

  _flush() {
    this._param('rpm', this._held.rpm, 0.02);
    this._param('load', this._held.load, 0.03);
    this._param('pulseGain', this._held.pulseGain, 0.02);
    this._param('dfco', this._held.dfco, 0.01);
    this._param('limit', this._held.limit, 0.01);
    this._param('popRate', this._held.popRate, 0.02);
  }

  _post(profile) {
    const rows = profile.firings.map((row) => {
      let angle = row.angle + (row.timing || 0);
      angle %= 720;
      if (angle < 0) angle += 720;
      return { angle, bank: row.bank ? 1 : 0, gain: row.gain > 0 ? row.gain : 1 };
    });
    rows.sort((a, b) => a.angle - b.angle);
    for (let i = 1; i < rows.length; i++) {
      if (rows[i].angle <= rows[i - 1].angle) rows[i].angle = Math.min(719.95, rows[i - 1].angle + 0.05);
    }
    const angles = new Float32Array(rows.length);
    const banks = new Uint8Array(rows.length);
    const gains = new Float32Array(rows.length);
    rows.forEach((row, i) => {
      angles[i] = row.angle;
      banks[i] = row.bank;
      gains[i] = row.gain;
    });
    this.node.port.postMessage({
      type: 'car',
      count: rows.length,
      angles,
      banks,
      gains,
      idleRpm: profile.idleRpm,
      noise: profile.noiseGain
    });
  }

  setCar(profile) {
    this._car = profile;
    if (this.node && profile) this._post(profile);
  }

  setRpm(rpm) { this._param('rpm', rpm, 0.025); }
  setLoad(load) { this._param('load', load, 0.03); }
  setPulseGain(value) { this._param('pulseGain', value, 0.03); }
  setDfco(on) { this._param('dfco', on ? 1 : 0, 0.008); }
  setLimit(on) { this._param('limit', on ? 1 : 0, 0.01); }
  setPopRate(rate) { this._param('popRate', rate, 0.02); }

  setTapGains(bank, low, intake) {
    const t = this.ctx.currentTime;
    this.bankL.gain.setTargetAtTime(bank, t, 0.04);
    this.bankR.gain.setTargetAtTime(bank, t, 0.04);
    this.low.gain.setTargetAtTime(low, t, 0.04);
    this.intake.gain.setTargetAtTime(intake, t, 0.04);
  }
}
