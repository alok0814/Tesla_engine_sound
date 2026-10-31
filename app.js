import EngineAudio from './engine-audio.js';

/* file:// では fetch が失敗するため、cars.json と同じ内容を埋め込む。 */

function forAudio(car) {
  if (!car) return null;
  return {
    id: car.id,
    name: car.name,
    cylinders: car.cylinders || 8,
    idleRpm: car.idleRpm || 800,
    redline: car.redlineRpm || 7000,
    sound: car.sound || {}
  };
}
const EMBEDDED_DATA = {
 "cars": [
  {
   "cylinders": 12,
   "engine": "6.5L NA V12",
   "gearTopSpeedsKmh": [
    60,
    85,
    115,
    150,
    190,
    240,
    340
   ],
   "id": "ferrari-812",
   "idleRpm": 900,
   "image": "assets/ferrari-812.jpg",
   "imageSourceUrl": "https://zero2turbo.com/wp-content/uploads/2017/02/812_superfast_2_1.jpg",
   "name": "Ferrari 812 Superfast",
   "redlineRpm": 8900,
   "sound": {
    "burble": 0.15,
    "character": "high-pitched V12 scream, smooth and even",
    "filterBaseHz": 500,
    "filterPerRpmHz": 0.58,
    "filterQ": 2.0,
    "forcedInductionWhine": 0.0,
    "lumpiness": 0.3,
    "noiseGain": 0.1,
    "osc": {
     "sawtooth": 0.55,
     "square": 0.2,
     "triangle": 0.25
    },
    "subOscGain": 0.25,
    "harmonics": [
     1.0,
     0.55,
     0.7,
     0.4,
     0.35,
     0.25
    ],
    "halfOrder": 0.06,
    "drive": 0.35,
    "intake": {
     "gain": 0.25,
     "baseHz": 700,
     "perRpmHz": 0.25
    },
    "resonance": {
     "mult": 3.0,
     "q": 4.0,
     "gainDb": 6
    },
    "whineType": "none",
    "whineGain": 0.0,
    "whineMult": 5.5,
    "whineOnsetRpm": 99999,
    "blowOff": 0.0,
    "valve": {
     "openRpm": 3500,
     "extraHz": 1500
    },
    "noiseBpMult": 2.0,
    "characterV2": "65° V12, even 60° firing. Deep resonant idle rising to a metallic scream; equal-length manifolds emphasise the 3rd/6th harmonics; strong intake bark near redline. Smooth — no lumpiness, no half-order."
   }
  },
  {
   "cylinders": 10,
   "engine": "5.2L NA V10",
   "gearTopSpeedsKmh": [
    55,
    80,
    110,
    140,
    180,
    225,
    325
   ],
   "id": "lamborghini-huracan",
   "idleRpm": 850,
   "image": "assets/lamborghini-huracan.jpg",
   "imageSourceUrl": "https://images.hdqwalls.com/download/2019-lamborghini-huracan-evo-10k-2e-3000x2000.jpg?dl=1",
   "name": "Lamborghini Huracán EVO",
   "redlineRpm": 8500,
   "sound": {
    "burble": 0.5,
    "character": "sharp V10 howl, aggressive, crackly on lift-off",
    "filterBaseHz": 450,
    "filterPerRpmHz": 0.5,
    "filterQ": 2.5,
    "forcedInductionWhine": 0.0,
    "lumpiness": 0.3,
    "noiseGain": 0.14,
    "osc": {
     "sawtooth": 0.6,
     "square": 0.25,
     "triangle": 0.15
    },
    "subOscGain": 0.3,
    "harmonics": [
     1.0,
     0.6,
     0.45,
     0.5,
     0.3,
     0.2
    ],
    "halfOrder": 0.1,
    "drive": 0.5,
    "intake": {
     "gain": 0.2,
     "baseHz": 600,
     "perRpmHz": 0.22
    },
    "resonance": {
     "mult": 2.5,
     "q": 5.0,
     "gainDb": 7
    },
    "whineType": "none",
    "whineGain": 0.0,
    "whineMult": 5.5,
    "whineOnsetRpm": 99999,
    "blowOff": 0.0,
    "valve": {
     "openRpm": 3000,
     "extraHz": 1200
    },
    "noiseBpMult": 2.0,
    "characterV2": "5.2 V10 with SHARED crankpins -> UNEVEN 54°/90° firing intervals (unlike the old 5.0 even-fire). That unevenness is the off-beat, grungy growl: strong half-order (0.5x firing freq) content at low rpm that morphs into a banshee howl; heavy crackle on lift-off."
   }
  },
  {
   "cylinders": 8,
   "engine": "6.2L Supercharged V8",
   "gearTopSpeedsKmh": [
    50,
    75,
    105,
    135,
    170,
    210,
    260,
    327
   ],
   "id": "dodge-challenger-hellcat",
   "idleRpm": 700,
   "image": "assets/dodge-challenger.jpg",
   "imageSourceUrl": "https://dubaiwheels.ae/images/20251007-074232-2025-dodge-challenger-exterior-sideprofile-right.jpg",
   "name": "Dodge Challenger SRT Hellcat",
   "redlineRpm": 6200,
   "sound": {
    "burble": 0.1,
    "character": "deep crossplane V8 rumble + supercharger whine under load",
    "filterBaseHz": 300,
    "filterPerRpmHz": 0.35,
    "filterQ": 1.5,
    "forcedInductionWhine": 0.5,
    "lumpiness": 0.4,
    "noiseGain": 0.16,
    "osc": {
     "sawtooth": 0.4,
     "square": 0.35,
     "triangle": 0.25
    },
    "subOscGain": 0.7,
    "harmonics": [
     1.0,
     0.5,
     0.3,
     0.18,
     0.1,
     0.06
    ],
    "halfOrder": 0.08,
    "drive": 0.45,
    "intake": {
     "gain": 0.1,
     "baseHz": 400,
     "perRpmHz": 0.15
    },
    "resonance": {
     "mult": 2.0,
     "q": 2.0,
     "gainDb": 3
    },
    "whineType": "supercharger",
    "whineGain": 0.5,
    "whineMult": 10.7,
    "whineOnsetRpm": 2800,
    "blowOff": 0.0,
    "valve": {
     "openRpm": 2500,
     "extraHz": 900
    },
    "noiseBpMult": 1.5,
    "characterV2": "Pushrod crossplane HEMI V8: per-bank uneven pulses -> deep lumpy idle, strong half-order. Signature layer is the 2.4L IHI twin-screw supercharger whine (rotors >14,000 rpm) that fades in past ~3,000 rpm and rises with load on top of the exhaust thunder. Low 6,200 rpm redline, lots of sub.",
    "whineHzPerRpm": 0.712,
    "whineHzPerRpm2": 1.07
   }
  },
  {
   "cylinders": 6,
   "engine": "4.0L NA Flat-6",
   "gearTopSpeedsKmh": [
    55,
    80,
    105,
    135,
    170,
    215,
    318
   ],
   "id": "porsche-911-gt3",
   "idleRpm": 900,
   "image": "assets/porsche-911-gt3.webp",
   "imageSourceUrl": "https://www.indigoautogroup.com/used-Rancho+Mirage-2022-Porsche-911-GT3-WP0AC2A92NS270041",
   "name": "Porsche 911 GT3 (992)",
   "redlineRpm": 9000,
   "sound": {
    "burble": 0.15,
    "character": "metallic flat-6 rasp, very high revving, mechanical",
    "filterBaseHz": 600,
    "filterPerRpmHz": 0.62,
    "filterQ": 3.0,
    "forcedInductionWhine": 0.0,
    "lumpiness": 0.28,
    "noiseGain": 0.12,
    "osc": {
     "sawtooth": 0.65,
     "square": 0.15,
     "triangle": 0.2
    },
    "subOscGain": 0.2,
    "harmonics": [
     1.0,
     0.5,
     0.55,
     0.45,
     0.3,
     0.22
    ],
    "halfOrder": 0.06,
    "drive": 0.5,
    "intake": {
     "gain": 0.35,
     "baseHz": 900,
     "perRpmHz": 0.3
    },
    "resonance": {
     "mult": 3.0,
     "q": 6.0,
     "gainDb": 8
    },
    "whineType": "none",
    "whineGain": 0.0,
    "whineMult": 5.5,
    "whineOnsetRpm": 99999,
    "blowOff": 0.0,
    "valve": {
     "openRpm": 3000,
     "extraHz": 1800
    },
    "noiseBpMult": 2.5,
    "characterV2": "4.0 flat-6, even 120° firing, 9,000 rpm. Mournful howl below 4,000 rpm, manic metallic scream above; six individual throttle bodies make intake roar a major layer; exhaust spans ~200 Hz-5 kHz; second intensity layer from ~3,000 rpm (progressive exhaust valve)."
   }
  },
  {
   "cylinders": 8,
   "engine": "5.0L NA V8 (Coyote)",
   "gearTopSpeedsKmh": [
    60,
    95,
    135,
    180,
    235,
    290
   ],
   "id": "ford-mustang-gt",
   "idleRpm": 750,
   "image": "assets/ford-mustang.webp",
   "imageSourceUrl": "https://img-ik.cars.co.za/news-site-za/images/2019/09/Ford-Mustang-side.jpg",
   "name": "Ford Mustang GT",
   "redlineRpm": 7500,
   "sound": {
    "burble": 0.4,
    "character": "classic crossplane V8 burble, lumpy idle, throaty midrange",
    "filterBaseHz": 320,
    "filterPerRpmHz": 0.4,
    "filterQ": 1.8,
    "forcedInductionWhine": 0.0,
    "lumpiness": 0.4,
    "noiseGain": 0.15,
    "osc": {
     "sawtooth": 0.45,
     "square": 0.3,
     "triangle": 0.25
    },
    "subOscGain": 0.55,
    "harmonics": [
     1.0,
     0.55,
     0.35,
     0.22,
     0.14,
     0.08
    ],
    "halfOrder": 0.08,
    "drive": 0.42,
    "intake": {
     "gain": 0.15,
     "baseHz": 500,
     "perRpmHz": 0.2
    },
    "resonance": {
     "mult": 2.0,
     "q": 3.0,
     "gainDb": 4
    },
    "whineType": "none",
    "whineGain": 0.0,
    "whineMult": 5.5,
    "whineOnsetRpm": 99999,
    "blowOff": 0.0,
    "valve": {
     "openRpm": 2800,
     "extraHz": 1000
    },
    "noiseBpMult": 1.5,
    "characterV2": "5.0 Coyote DOHC crossplane V8: uneven per-bank exhaust pulses (90/180/270/180°) = classic burble and choppy idle (strong half-order), but DOHC breathing gives a freer, raspier top end than the pushrod Hellcat, up to the 7,500 rpm redline. Active exhaust valves open with throttle."
   }
  },
  {
   "cylinders": 6,
   "engine": "3.8L Twin-Turbo V6",
   "gearTopSpeedsKmh": [
    55,
    85,
    120,
    160,
    205,
    315
   ],
   "id": "nissan-gtr",
   "idleRpm": 800,
   "image": "assets/nissan-gtr.jpg",
   "imageSourceUrl": "https://spots.ag/2015/05/27/nissan-gt-r-2013-c214827052015000450_5.jpg",
   "name": "Nissan GT-R (R35)",
   "redlineRpm": 7100,
   "sound": {
    "burble": 0.12,
    "character": "smooth turbo V6, boost whoosh under load, muted exhaust",
    "filterBaseHz": 400,
    "filterPerRpmHz": 0.45,
    "filterQ": 1.6,
    "forcedInductionWhine": 0.35,
    "lumpiness": 0.25,
    "noiseGain": 0.2,
    "osc": {
     "sawtooth": 0.4,
     "square": 0.2,
     "triangle": 0.4
    },
    "subOscGain": 0.35,
    "harmonics": [
     1.0,
     0.45,
     0.3,
     0.15,
     0.08,
     0.05
    ],
    "halfOrder": 0.08,
    "drive": 0.3,
    "intake": {
     "gain": 0.2,
     "baseHz": 600,
     "perRpmHz": 0.2
    },
    "resonance": {
     "mult": 2.0,
     "q": 2.0,
     "gainDb": 2
    },
    "whineType": "turbo",
    "whineGain": 0.4,
    "whineMult": 5.5,
    "whineOnsetRpm": 2500,
    "blowOff": 0.8,
    "valve": {
     "openRpm": 3000,
     "extraHz": 400
    },
    "noiseBpMult": 1.5,
    "characterV2": "VR38DETT 60° twin-turbo V6: turbos sit in the exhaust stream and muffle/smooth the note (dark filter, fewer high harmonics). Boost builds from ~2,500-3,000 rpm: induction roar + turbo spool, gravelly battle-cry near the 7,100 rpm redline, short deliberate pops on shifts, blow-off whoosh on lift-off."
   }
  }
 ],
 "note": "Engine/sound parameters for a TeslaSound-style web app. Speeds are km/h at redline in each gear (approximate, for the virtual gearbox). firingFreqHz = rpm/60 * (cylinders/2) for a 4-stroke engine. Images: downloaded copies in ./assets for prototyping; imageSourceUrl is the original page/URL — replace with licensed or own photos before any public release. V2 (2026-10-31): sound objects extended with research-based fields — harmonics[6] (gains at 1x-6x firing freq), halfOrder (0.5x component from uneven firing), drive (waveshaper saturation), intake (intake-roar noise), resonance (tracking peaking filter), whineType/whineGain/whineMult/whineOnsetRpm (supercharger/turbo), blowOff (GT-R), valve (exhaust-valve extra filter opening), noiseBpMult, characterV2 (researched description). See SOUND_RESEARCH.md and engine-audio.js.",
 "soundSchemaVersion": 2
};
const SVG_NS = 'http://www.w3.org/2000/svg';
const CX = 200;
const CY = 208;
const START_DEG = -120;
const SWEEP_DEG = 240;
const DOWNSHIFT_RPM = 1400;

const els = {
  banner: document.getElementById('banner-img'),
  name: document.getElementById('car-name'),
  engine: document.getElementById('car-engine'),
  redline: document.getElementById('car-redline'),
  ticks: document.getElementById('tach-ticks'),
  track: document.getElementById('tach-track'),
  redArc: document.getElementById('tach-red'),
  needle: document.getElementById('needle'),
  shift: document.getElementById('shift-light'),
  gear: document.getElementById('gear'),
  rpm: document.getElementById('rpm'),
  speed: document.getElementById('speed'),
  gps: document.getElementById('gps-status'),
  source: document.getElementById('speed-source'),
  note: document.getElementById('gps-note'),
  cabin: document.getElementById('cabin'),
  latency: document.getElementById('audio-debug'),
  start: document.getElementById('start-btn'),
  rev: document.getElementById('rev-btn'),
  volume: document.getElementById('volume'),
  demoBtn: document.getElementById('demo-toggle'),
  demoSpeed: document.getElementById('demo-speed'),
  demoReadout: document.getElementById('demo-readout'),
  sweep: document.getElementById('sweep-btn'),
  list: document.getElementById('car-list')
};

const state = {
  cars: [],
  carIndex: 0,
  engineOn: false,
  ctx: null,
  synth: null,
  volume: 0.75,
  cabin: 'premium',
  gear: 1,
  lastShiftAt: -10000,
  lastShiftDir: 0,
  cutUntil: 0,
  displayRpm: 0,
  revRpm: 0,
  revHeld: false,
  wasParked: true,
  crankAt: 0,
  wander: 0,
  outputSpeed: 0,
  prevSpeed: 0,
  accel: 0,
  prevAccel: 0,
  demo: false,
  demoSpeed: 0,
  sweeping: false,
  gps: 'idle',
  speedSource: 'none',
  gpsSamples: [],
  lastFix: null,
  watchId: null,
  wakeLock: null,
  lastFrame: 0,
  burbleUntil: 0,
  reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
};

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function currentCar() {
  return state.cars[state.carIndex] || null;
}

function gaugeMax(redline) {
  return Math.ceil((redline * 1.08) / 1000) * 1000;
}

function degPoint(deg, r) {
  const rad = (deg * Math.PI) / 180;
  return [CX + Math.sin(rad) * r, CY - Math.cos(rad) * r];
}

function rpmToDeg(rpm, max) {
  const t = clamp(rpm / max, 0, 1);
  return START_DEG + SWEEP_DEG * t;
}

function arcPath(r, a0, a1) {
  const [x0, y0] = degPoint(a0, r);
  const [x1, y1] = degPoint(a1, r);
  const large = a1 - a0 > 180 ? 1 : 0;
  return 'M ' + x0 + ' ' + y0 + ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x1 + ' ' + y1;
}

function svgEl(name, attrs) {
  const node = document.createElementNS(SVG_NS, name);
  Object.keys(attrs).forEach(function (key) {
    node.setAttribute(key, attrs[key]);
  });
  return node;
}

/* 参照映像の rpm/km/h。各ギアは一定レシオで、シフト点はギアが上がるほど高い。 */
const RPM_PER_KMH = {
  'dodge-challenger-hellcat': [81, 56, 39, 27, 20],
  'ford-mustang-gt': [79, 51, 37, 29, 21],
  'ferrari-812': [93, 65, 48, 38, 30, 24],
  'porsche-911-gt3': [112, 70, 50, 39, 31, 26],
  'lamborghini-huracan': [102, 68, 49, 39, 31, 25],
  'nissan-gtr': [96, 64, 46, 35, 27, 21]
};
const SHIFT_CLIMB = {
  'dodge-challenger-hellcat': [4300, 4800],
  'ford-mustang-gt': [4100, 5300],
  'ferrari-812': [5700, 7700],
  'porsche-911-gt3': [4600, 6700],
  'lamborghini-huracan': [5200, 7400],
  'nissan-gtr': [4500, 6500]
};

function ratioFor(car, gear) {
  const table = RPM_PER_KMH[car.id];
  const top = car.gearTopSpeedsKmh[gear - 1];
  if (!table) return car.redlineRpm / top;
  if (gear <= table.length) return table[gear - 1];
  const last = table[table.length - 1];
  const prev = table[table.length - 2] || last * 1.28;
  return last * Math.pow(last / prev, gear - table.length);
}

function rpmForSpeedInGear(speed, gear, car) {
  return Math.max(car.idleRpm, speed * ratioFor(car, gear));
}

function upshiftRpm(car, gear) {
  const span = SHIFT_CLIMB[car.id];
  if (!span) return car.redlineRpm * 0.97;
  const n = car.gearTopSpeedsKmh.length;
  const t = n <= 1 ? 0 : (gear - 1) / (n - 1);
  return Math.min(car.redlineRpm * 0.98, span[0] + (span[1] - span[0]) * t);
}

function settleGear(speed, car) {
  const maxG = car.gearTopSpeedsKmh.length;
  let gear = 1;
  while (gear < maxG && rpmForSpeedInGear(speed, gear, car) > upshiftRpm(car, gear)) {
    gear += 1;
  }
  state.gear = gear;
  state.lastShiftAt = performance.now();
  state.lastShiftDir = 0;
}

function stepGear(speed, car, now) {
  const maxG = car.gearTopSpeedsKmh.length;
  state.gear = clamp(state.gear, 1, maxG);
  let rpm = rpmForSpeedInGear(speed, state.gear, car);
  const since = now - state.lastShiftAt;
  const upLine = upshiftRpm(car, state.gear);

  if (state.gear < maxG && rpm > upLine) {
    const urgent = rpm > car.redlineRpm * 1.18;
    const blocked = state.lastShiftDir === -1 && since < 300;
    if (!blocked && (urgent || since > 170)) {
      state.gear += 1;
      state.lastShiftAt = now;
      state.lastShiftDir = 1;
      state.cutUntil = now + 120;
      rpm = rpmForSpeedInGear(speed, state.gear, car);
    }
  } else if (state.gear > 1 && rpm < DOWNSHIFT_RPM) {
    const urgent = rpm < 800;
    const blocked = state.lastShiftDir === 1 && since < 420;
    if (!blocked && (urgent || since > 260)) {
      state.gear -= 1;
      state.lastShiftAt = now;
      state.lastShiftDir = -1;
      rpm = rpmForSpeedInGear(speed, state.gear, car);
    }
  }

  return clamp(rpm, 0, gaugeMax(car.redlineRpm));
}

function buildGauge(car) {
  const max = gaugeMax(car.redlineRpm);
  const start = START_DEG;
  const end = START_DEG + SWEEP_DEG;
  els.track.setAttribute('d', arcPath(156, start, end));
  const redDeg = rpmToDeg(car.redlineRpm, max);
  els.redArc.setAttribute('d', arcPath(156, redDeg, end));
  els.ticks.replaceChildren();

  for (let rpm = 0; rpm <= max; rpm += 500) {
    const major = rpm % 1000 === 0;
    const hot = rpm >= car.redlineRpm && rpm > 0;
    const deg = rpmToDeg(rpm, max);
    const outer = 156;
    const inner = major ? 138 : 146;
    const [x0, y0] = degPoint(deg, inner);
    const [x1, y1] = degPoint(deg, outer);
    const tick = svgEl('line', {
      x1: x0, y1: y0, x2: x1, y2: y1,
      class: 'tick' + (major ? '' : ' minor') + (hot ? ' red' : '')
    });
    els.ticks.appendChild(tick);
    if (major) {
      const [lx, ly] = degPoint(deg, 118);
      const label = svgEl('text', {
        x: lx,
        y: ly,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        class: 'tick-label' + (hot ? ' red' : '')
      });
      label.textContent = String(rpm / 1000);
      els.ticks.appendChild(label);
    }
  }
  setNeedle(state.displayRpm, max);
}

function setNeedle(rpm, max) {
  const deg = rpmToDeg(rpm, max);
  els.needle.setAttribute('transform', 'rotate(' + deg.toFixed(2) + ' ' + CX + ' ' + CY + ')');
}

function showNote(text) {
  if (!text) {
    els.note.hidden = true;
    els.note.textContent = '';
    return;
  }
  els.note.hidden = false;
  els.note.textContent = text;
}

function setDemo(on, reason) {
  state.demo = on;
  if (!on) state.sweeping = false;
  els.demoBtn.classList.toggle('on', on);
  els.demoBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
  if (reason) showNote(reason);
  if (!on) showNote('');
}

function setText(node, text) {
  if (node.textContent !== text) node.textContent = text;
}

function renderStatus() {
  let label = '待機';
  let mode = 'idle';
  if (state.demo) {
    label = 'デモ';
    mode = 'demo';
  } else if (state.gps === 'locked') {
    label = 'ロック';
    mode = 'locked';
  } else if (state.gps === 'searching') {
    label = '検索中';
    mode = 'searching';
  } else if (state.gps === 'denied') {
    label = '拒否';
    mode = 'denied';
  } else if (state.gps === 'unavailable') {
    label = '利用不可';
    mode = 'denied';
  }
  setText(els.gps, label);
  if (els.gps.dataset.mode !== mode) els.gps.dataset.mode = mode;

  let source = '—';
  if (state.demo) source = 'デモ';
  else if (state.speedSource === 'gps') source = 'GPS';
  else if (state.speedSource === 'delta') source = '位置推定';
  setText(els.source, source);
  renderLatency();
}

function renderLatency() {
  const ctx = state.ctx;
  if (!ctx || !state.engineOn) {
    setText(els.latency, '遅延 —');
    return;
  }
  const outMs = Number.isFinite(ctx.outputLatency) ? (ctx.outputLatency * 1000).toFixed(1) : '—';
  const baseMs = Number.isFinite(ctx.baseLatency) ? (ctx.baseLatency * 1000).toFixed(1) : '—';
  const voice = state.synth && state.synth.hasLoops ? 'ループ+パルス' : 'パルス';
  setText(els.latency, '遅延 out ' + outMs + ' / base ' + baseMs + ' ms · ' + voice);
}

function selectCar(index, scroll) {
  const car = state.cars[index];
  if (!car) return;
  state.carIndex = index;
  els.banner.src = car.image;
  els.banner.alt = '';
  setText(els.name, car.name);
  setText(els.engine, car.engine);
  setText(els.redline, 'レッドライン ' + car.redlineRpm.toLocaleString('ja-JP') + ' rpm');
  document.title = car.name + ' · Engine Sound';
  const cards = els.list.querySelectorAll('.car-card');
  cards.forEach(function (card, i) {
    const on = i === index;
    card.classList.toggle('active', on);
    card.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  if (state.outputSpeed >= 1) settleGear(state.outputSpeed, car);
  else state.gear = 1;
  buildGauge(car);
  if (state.synth) state.synth.setCar(forAudio(car));
  if (scroll && cards[index]) {
    cards[index].scrollIntoView({
      behavior: state.reduceMotion ? 'auto' : 'smooth',
      inline: 'center',
      block: 'nearest'
    });
  }
}

function renderCards() {
  els.list.replaceChildren();
  state.cars.forEach(function (car, i) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'car-card';
    btn.setAttribute('aria-pressed', 'false');
    const img = document.createElement('img');
    img.src = car.image;
    img.alt = '';
    img.draggable = false;
    img.decoding = 'async';
    const meta = document.createElement('span');
    meta.className = 'car-meta';
    const name = document.createElement('span');
    name.className = 'car-name';
    name.textContent = car.name;
    const engine = document.createElement('span');
    engine.className = 'car-engine';
    engine.textContent = car.engine;
    meta.append(name, engine);
    btn.append(img, meta);
    btn.addEventListener('click', function () { selectCar(i, true); });
    els.list.appendChild(btn);
  });
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const p = Math.PI / 180;
  const dLat = (lat2 - lat1) * p;
  const dLon = (lon2 - lon1) * p;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * p) * Math.cos(lat2 * p) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

function pushSpeedSample(kmh, t) {
  kmh = Math.max(0, kmh);
  const prev = state.gpsSamples[state.gpsSamples.length - 1];
  if (prev) {
    const dt = Math.max(0.05, (t - prev.t) / 1000);
    const accel = (kmh - prev.v) / dt;
    if (Math.abs(accel) > 45) kmh = prev.v + Math.sign(accel) * 45 * dt;
  }
  state.gpsSamples.push({ t: t, v: kmh });
  while (state.gpsSamples.length > 5) state.gpsSamples.shift();
}

function desiredGps(now) {
  const samples = state.gpsSamples;
  if (!samples.length) return 0;
  const last = samples[samples.length - 1];
  if (now - last.t > 2500) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i += 1) sum += samples[i].v;
  const avg = sum / samples.length;
  const first = samples[0];
  const span = (last.t - first.t) / 1000;
  let trend = 0;
  if (span > 0.05) trend = clamp((last.v - first.v) / span, -20, 28);
  const corrected = avg + trend * (span / 2);
  const age = Math.min(0.7, Math.max(0, (now - last.t) / 1000));
  const extra = clamp(trend * age, -4, 7);
  return Math.max(0, corrected + extra);
}

function onGeo(pos) {
  state.gps = 'locked';
  const c = pos.coords;
  const t = performance.now();
  let kmh = null;
  if (typeof c.speed === 'number' && isFinite(c.speed) && c.speed >= 0) {
    kmh = c.speed * 3.6;
    state.speedSource = 'gps';
  } else if (state.lastFix) {
    const dt = (t - state.lastFix.t) / 1000;
    if (dt >= 0.25 && dt <= 6) {
      const meters = haversine(state.lastFix.lat, state.lastFix.lon, c.latitude, c.longitude);
      kmh = (meters / dt) * 3.6;
      state.speedSource = 'delta';
    }
  }
  state.lastFix = { t: t, lat: c.latitude, lon: c.longitude };
  if (kmh == null || !isFinite(kmh)) return;
  if (typeof c.accuracy === 'number' && c.accuracy > 40 && kmh < 3) kmh = 0;
  pushSpeedSample(kmh, t);
}

function onGeoError(err) {
  if (err && err.code === 3) {
    if (state.gps !== 'locked') state.gps = 'searching';
    return;
  }
  state.gps = err && err.code === 1 ? 'denied' : 'unavailable';
  const reason = state.gps === 'denied'
    ? '位置情報が拒否されたため、デモ走行に切り替えました。'
    : '位置情報を取得できないため、デモ走行に切り替えました。';
  setDemo(true, reason);
}

function requestGeo() {
  if (state.watchId != null) return;
  if (!navigator.geolocation || !window.isSecureContext) {
    state.gps = 'unavailable';
    setDemo(true, 'HTTPS ではないため GPS を使えません。デモ走行に切り替えました。');
    return;
  }
  state.gps = 'searching';
  state.watchId = navigator.geolocation.watchPosition(onGeo, onGeoError, {
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 10000
  });
}

async function requestWake() {
  if (!navigator.wakeLock || document.visibilityState !== 'visible') return;
  try {
    const lock = await navigator.wakeLock.request('screen');
    state.wakeLock = lock;
    lock.addEventListener('release', function () {
      if (state.wakeLock === lock) state.wakeLock = null;
    });
  } catch (err) {
    state.wakeLock = null;
  }
}

function releaseWake() {
  const lock = state.wakeLock;
  state.wakeLock = null;
  if (lock) lock.release().catch(function () {});
}

function startEngine() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) {
    showNote('このブラウザは Web Audio に対応していません。');
  } else {
    if (!state.ctx) state.ctx = new AC();
    state.ctx.resume();
    if (!state.synth) state.synth = new EngineAudio(state.ctx);
    state.synth.setVolume(state.volume);
    state.synth.setCabin(state.cabin);
    state.synth.setCar(forAudio(currentCar()));
    state.synth.start();
    state.synth.ready.then(function (ok) {
      if (!ok && state.engineOn) showNote('このブラウザは AudioWorklet に対応していないため、音を出せません。');
    });
  }
  state.engineOn = true;
  state.crankAt = performance.now();
  state.revRpm = 300;
  state.wasParked = state.outputSpeed < 1;
  requestGeo();
  requestWake();
  document.body.classList.add('is-running');
}

function stopEngine() {
  state.engineOn = false;
  state.revHeld = false;
  els.rev.classList.remove('held');
  els.rev.setAttribute('aria-pressed', 'false');
  if (state.synth) state.synth.stop();
  if (state.ctx) {
    window.setTimeout(function () {
      if (!state.engineOn && state.ctx && state.ctx.state === 'running') state.ctx.suspend();
    }, 400);
  }
  releaseWake();
  document.body.classList.remove('is-running');
}

function driveAudio(rpm, load, upshifted, sharpDrop) {
  if (!state.synth || !state.engineOn) return;
  state.synth.setRpm(rpm);
  state.synth.setLoad(load);
  const nowMs = performance.now();
  if (upshifted) {
    state.synth.shift();
  } else if (sharpDrop && nowMs >= state.burbleUntil) {
    state.burbleUntil = nowMs + 900;
    state.synth.liftOff();
  }
  state.synth.update();
}

function holdRev() {
  if (!state.engineOn) {
    els.start.classList.add('nudge');
    window.setTimeout(function () { els.start.classList.remove('nudge'); }, 360);
    return;
  }
  state.revHeld = true;
  els.rev.classList.add('held');
  els.rev.setAttribute('aria-pressed', 'true');
}

function releaseRev() {
  const wasHeld = state.revHeld;
  state.revHeld = false;
  els.rev.classList.remove('held');
  els.rev.setAttribute('aria-pressed', 'false');
  if (wasHeld && state.synth && state.engineOn && state.displayRpm > 2500) {
    state.synth.liftOff();
  }
}

function followSpeed(desired, dt, tau, maxRate) {
  const k = 1 - Math.exp(-dt / tau);
  const next = state.outputSpeed + (desired - state.outputSpeed) * k;
  const cap = maxRate * dt;
  state.outputSpeed = Math.max(0, state.outputSpeed + clamp(next - state.outputSpeed, -cap, cap));
}

function paint(car, speed, gearLabel) {
  const max = gaugeMax(car.redlineRpm);
  setNeedle(state.displayRpm, max);
  const hot = state.displayRpm >= car.redlineRpm * 0.9;
  els.needle.classList.toggle('hot', hot);
  setText(els.rpm, String(Math.round(state.displayRpm)));
  setText(els.gear, gearLabel);
  els.gear.classList.toggle('idle-mark', gearLabel === '–');
  setText(els.speed, String(Math.round(Math.max(0, speed))));
  const nearRed = state.engineOn && state.displayRpm >= car.redlineRpm * 0.92;
  const showShift = nearRed && (speed >= 1 || state.revHeld);
  els.shift.classList.toggle('on', showShift);
  setText(els.start, state.engineOn ? 'エンジン停止' : 'エンジン始動');
  els.start.classList.toggle('running', state.engineOn);
  els.start.setAttribute('aria-pressed', state.engineOn ? 'true' : 'false');
  renderStatus();
}

function frame(now) {
  requestAnimationFrame(frame);
  if (!state.lastFrame) {
    state.lastFrame = now;
    return;
  }
  const dt = Math.min(0.05, (now - state.lastFrame) / 1000);
  state.lastFrame = now;
  const car = currentCar();
  if (!car || dt <= 0) return;

  if (state.sweeping && state.demo) {
    state.demoSpeed = Math.min(160, state.demoSpeed + 10 * dt);
    if (state.demoSpeed >= 159.9) {
      state.demoSpeed = 160;
      state.sweeping = false;
    }
    if (document.activeElement !== els.demoSpeed) {
      els.demoSpeed.value = String(Math.round(state.demoSpeed));
    }
    setText(els.demoReadout, String(Math.round(state.demoSpeed)));
  }

  if (state.demo) {
    followSpeed(state.demoSpeed, dt, 0.08, 90);
  } else {
    const samples = state.gpsSamples;
    const last = samples[samples.length - 1];
    const stale = !last || now - last.t > 2500;
    if (stale && state.gps === 'locked') state.gps = 'searching';
    followSpeed(desiredGps(now), dt, stale ? 1.2 : 0.16, 40);
  }

  const speed = state.outputSpeed;
  const rawAccel = (speed - state.prevSpeed) / dt;
  state.prevSpeed = speed;
  const accel = clamp(rawAccel, -40, 40);
  const ak = 1 - Math.exp(-dt / 0.18);
  state.accel += (accel - state.accel) * ak;

  let load = clamp(state.accel / 12, 0, 1);
  const cutting = now < state.cutUntil;
  let target = 0;
  let gearLabel = '–';
  let upshifted = false;

  if (state.engineOn) {
    if (speed < 1) {
      state.gear = 1;
      if (!state.wasParked) {
        state.revRpm = Math.max(state.displayRpm, car.idleRpm);
        state.wasParked = true;
      }
      const crankU = (now - state.crankAt) / 400;
      if (!state.revHeld && state.crankAt > 0 && crankU >= 0 && crankU < 1) {
        const e = crankU * crankU * (3 - 2 * crankU);
        target = 300 + (car.idleRpm - 300) * e;
        state.revRpm = target;
        load = 0.4;
      } else {
        state.wander += dt;
        const wander = Math.sin(state.wander * 2.15) * 18 + Math.sin(state.wander * 5.4) * 12;
        const goal = state.revHeld ? car.redlineRpm * 0.985 : car.idleRpm + wander;
        const rate = state.revHeld ? 7200 : 8600;
        state.revRpm += clamp(goal - state.revRpm, -rate * dt, rate * dt);
        target = state.revRpm;
        if (state.revHeld) {
          load = clamp((state.revRpm - car.idleRpm) / (car.redlineRpm - car.idleRpm), 0, 1);
        } else {
          load = 0.08;
        }
      }
      gearLabel = 'N';
    } else {
      state.wasParked = false;
      const gearBefore = state.gear;
      target = stepGear(speed, car, now);
      upshifted = state.gear > gearBefore;
      gearLabel = String(state.gear);
      if (cutting) load = 0;
    }
  }

  const sharpDrop = state.engineOn && !upshifted && !cutting && state.displayRpm > 2500 && state.prevAccel - accel > 10;
  state.prevAccel = accel;

  const tau = state.engineOn ? 0.07 : 0.14;
  const k = 1 - Math.exp(-dt / tau);
  state.displayRpm += (target - state.displayRpm) * k;
  if (!state.engineOn && state.displayRpm < 1) state.displayRpm = 0;

  driveAudio(state.displayRpm, load, upshifted, sharpDrop);
  paint(car, speed, gearLabel);
}

function enableControls() {
  [els.start, els.rev, els.demoBtn, els.demoSpeed, els.sweep].forEach(function (node) {
    node.disabled = false;
  });
}

function bindEvents() {
  els.start.addEventListener('click', function () {
    if (state.engineOn) stopEngine();
    else startEngine();
  });

  els.rev.addEventListener('pointerdown', function (event) {
    event.preventDefault();
    try { els.rev.setPointerCapture(event.pointerId); } catch (err) {}
    holdRev();
  });
  els.rev.addEventListener('pointerup', releaseRev);
  els.rev.addEventListener('pointercancel', releaseRev);
  els.rev.addEventListener('contextmenu', function (event) { event.preventDefault(); });
  els.rev.addEventListener('keydown', function (event) {
    if (event.repeat) return;
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    holdRev();
  });
  els.rev.addEventListener('keyup', function (event) {
    if (event.key === ' ' || event.key === 'Enter') releaseRev();
  });
  window.addEventListener('blur', releaseRev);

  els.volume.addEventListener('input', function () {
    state.volume = Number(els.volume.value) / 100;
    if (state.synth) state.synth.setVolume(state.volume);
  });

  els.cabin.addEventListener('click', function (event) {
    const btn = event.target.closest('button[data-cabin]');
    if (!btn) return;
    state.cabin = btn.dataset.cabin;
    els.cabin.querySelectorAll('button').forEach(function (node) {
      node.setAttribute('aria-pressed', node === btn ? 'true' : 'false');
    });
    if (state.synth) state.synth.setCabin(state.cabin);
  });

  els.demoBtn.addEventListener('click', function () {
    if (state.demo) {
      if (state.gps === 'denied' || state.gps === 'unavailable') {
        setDemo(true, '位置情報が使えないため、デモ走行を続けます。');
        return;
      }
      setDemo(false);
      return;
    }
    setDemo(true);
  });

  els.demoSpeed.addEventListener('input', function () {
    state.sweeping = false;
    setDemo(true);
    state.demoSpeed = Number(els.demoSpeed.value);
    setText(els.demoReadout, String(Math.round(state.demoSpeed)));
  });

  els.sweep.addEventListener('click', function () {
    setDemo(true);
    state.demoSpeed = 0;
    state.outputSpeed = 0;
    state.prevSpeed = 0;
    state.accel = 0;
    state.prevAccel = 0;
    state.gear = 1;
    state.sweeping = true;
    els.demoSpeed.value = '0';
    setText(els.demoReadout, '0');
  });

  document.addEventListener('visibilitychange', function () {
    if (!state.ctx) return;
    if (document.visibilityState === 'hidden') {
      if (state.engineOn) state.ctx.suspend();
      return;
    }
    if (state.engineOn) {
      state.ctx.resume().then(function () {
        if (state.engineOn && state.ctx.state !== 'running') {
          showNote('画面をタップすると音が戻ります。');
        }
      });
      requestWake();
    }
  });

  document.addEventListener('pointerdown', function () {
    if (state.engineOn && state.ctx && state.ctx.state !== 'running') {
      state.ctx.resume();
    }
  });
}

async function loadCars() {
  try {
    const res = await fetch('cars.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('status ' + res.status);
    const data = await res.json();
    if (!data || !Array.isArray(data.cars) || !data.cars.length) throw new Error('empty');
    return data;
  } catch (err) {
    return EMBEDDED_DATA;
  }
}

async function boot() {
  const data = await loadCars();
  state.cars = data.cars;
  if (!state.cars.length) {
    showNote('車両データを読み込めませんでした。');
    return;
  }
  renderCards();
  selectCar(0, false);
  bindEvents();
  enableControls();
  requestAnimationFrame(frame);
}

boot();
