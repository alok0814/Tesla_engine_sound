/**
 * Firing tables (720° crank) and fixed exhaust formants.
 * Frequencies do not track rpm — they are pipe / cabin resonances.
 * Bank 0 = left, bank 1 = right.
 */

function fire(angle, cylinder, bank, gain, timing) {
  return { angle, cylinder, bank, gain, timing: timing || 0 };
}

/** Ford Coyote 1-5-4-8-6-3-7-2. Right bank cyl 1–4, left 5–8. */
const MUSTANG = [
  fire(0, 1, 1, 1.06, 0.6),
  fire(90, 5, 0, 0.9, -1.1),
  fire(180, 4, 1, 1.08, 1.4),
  fire(270, 8, 0, 0.86, -0.5),
  fire(360, 6, 0, 0.94, 1.2),
  fire(450, 3, 1, 1.02, -1.3),
  fire(540, 7, 0, 0.88, 0.4),
  fire(630, 2, 1, 1.1, -0.8)
];

/** Chrysler Hemi 1-8-4-3-6-5-7-2. Left 1/3/5/7, right 2/4/6/8. */
const HELLCAT = [
  fire(0, 1, 0, 1.08, 0.4),
  fire(90, 8, 1, 0.92, 1.6),
  fire(180, 4, 1, 1.05, -0.7),
  fire(270, 3, 0, 0.84, -1.2),
  fire(360, 6, 1, 1.0, 0.9),
  fire(450, 5, 0, 0.9, 1.1),
  fire(540, 7, 0, 1.06, -0.4),
  fire(630, 2, 1, 0.88, -1.5)
];

/** Ferrari F140-style even-fire V12, alternating banks, mild scatter. */
const FERRARI = [
  fire(0, 1, 1, 1.05, 0.8),
  fire(60, 7, 0, 0.92, -1.1),
  fire(120, 5, 1, 1.08, 1.4),
  fire(180, 11, 0, 0.9, -0.6),
  fire(240, 3, 1, 1.0, 0.5),
  fire(300, 9, 0, 0.94, -1.3),
  fire(360, 6, 1, 1.06, 1.0),
  fire(420, 12, 0, 0.88, -0.8),
  fire(480, 2, 1, 1.02, 0.3),
  fire(540, 8, 0, 0.96, 1.2),
  fire(600, 4, 1, 1.04, -1.0),
  fire(660, 10, 0, 0.9, 0.7)
];

/** Huracán / Audi 5.2 V10: 1-6-5-10-2-7-3-8-4-9. Bank A = 1–5. */
const HURACAN = [
  fire(0, 1, 0, 1.08, 0.6),
  fire(72, 6, 1, 0.9, 2.2),
  fire(144, 5, 0, 1.02, -0.8),
  fire(216, 10, 1, 0.86, 1.8),
  fire(288, 2, 0, 1.1, -1.2),
  fire(360, 7, 1, 0.94, 2.4),
  fire(432, 3, 0, 1.0, 0.4),
  fire(504, 8, 1, 0.88, -1.6),
  fire(576, 4, 0, 1.06, 1.0),
  fire(648, 9, 1, 0.92, 2.0)
];

/** Porsche flat-6: 1-6-2-4-3-5. Right 1–3, left 4–6. */
const GT3 = [
  fire(0, 1, 1, 1.04, 0.7),
  fire(120, 6, 0, 0.9, -1.2),
  fire(240, 2, 1, 1.08, 1.1),
  fire(360, 4, 0, 0.92, -0.5),
  fire(480, 3, 1, 1.0, 0.9),
  fire(600, 5, 0, 0.88, -1.4)
];

/** VR38 even-fire V6, alternating banks. */
const GTR = [
  fire(0, 1, 1, 1.04, 0.5),
  fire(120, 2, 0, 0.92, -0.8),
  fire(240, 3, 1, 1.06, 1.0),
  fire(360, 4, 0, 0.9, -1.1),
  fire(480, 5, 1, 1.02, 0.6),
  fire(600, 6, 0, 0.94, -0.4)
];

const PROFILES = {
  'ford-mustang-gt': {
    firings: MUSTANG,
    formants: [
      { hz: 118, q: 1.4, db: 5 },
      { hz: 246, q: 2.2, db: 4 },
      { hz: 520, q: 3.2, db: 5.5 },
      { hz: 1040, q: 4, db: 4 },
      { hz: 2280, q: 3, db: 2.5 }
    ],
    lowpass: { baseHz: 1600, loadHz: 3200 }
  },
  'dodge-challenger-hellcat': {
    firings: HELLCAT,
    formants: [
      { hz: 96, q: 1.3, db: 5.5 },
      { hz: 190, q: 2, db: 4 },
      { hz: 410, q: 2.6, db: 4.5 },
      { hz: 860, q: 3.2, db: 3 },
      { hz: 1680, q: 2.4, db: 2 }
    ],
    lowpass: { baseHz: 1200, loadHz: 2200 }
  },
  'ferrari-812': {
    firings: FERRARI,
    formants: [
      { hz: 280, q: 3.5, db: 4 },
      { hz: 620, q: 4.5, db: 5 },
      { hz: 1240, q: 5, db: 6 },
      { hz: 2480, q: 4, db: 4.5 },
      { hz: 4600, q: 3, db: 3 }
    ],
    lowpass: { baseHz: 2200, loadHz: 4200 }
  },
  'lamborghini-huracan': {
    firings: HURACAN,
    formants: [
      { hz: 240, q: 3, db: 4 },
      { hz: 540, q: 4.2, db: 5.5 },
      { hz: 1120, q: 5, db: 6 },
      { hz: 2100, q: 4, db: 5 },
      { hz: 3900, q: 3, db: 3.5 }
    ],
    lowpass: { baseHz: 2000, loadHz: 3800 }
  },
  'porsche-911-gt3': {
    firings: GT3,
    formants: [
      { hz: 340, q: 3.2, db: 3.5 },
      { hz: 780, q: 4.5, db: 5 },
      { hz: 1560, q: 5.5, db: 6.5 },
      { hz: 2900, q: 4.2, db: 5 },
      { hz: 4800, q: 3, db: 3.5 }
    ],
    lowpass: { baseHz: 2600, loadHz: 4600 }
  },
  'nissan-gtr': {
    firings: GTR,
    formants: [
      { hz: 170, q: 1.6, db: 3.5 },
      { hz: 360, q: 2, db: 3 },
      { hz: 720, q: 2.4, db: 2.5 },
      { hz: 1280, q: 2, db: 2 },
      { hz: 2100, q: 1.6, db: 1.5 }
    ],
    lowpass: { baseHz: 1100, loadHz: 1800 }
  }
};

function evenFire(cylinders) {
  const step = 720 / cylinders;
  const rows = [];
  for (let i = 0; i < cylinders; i++) {
    rows.push(fire(i * step, i + 1, i % 2, 1, ((i % 3) - 1) * 0.8));
  }
  return rows;
}

export function buildProfile(car) {
  const sound = (car && car.sound) || {};
  const id = car && car.id;
  const src = PROFILES[id] || {
    firings: evenFire(car && car.cylinders ? car.cylinders : 8),
    formants: [
      { hz: 180, q: 2, db: 3 },
      { hz: 420, q: 2.5, db: 3 },
      { hz: 900, q: 3, db: 3 },
      { hz: 1800, q: 2.5, db: 2 },
      { hz: 3200, q: 2, db: 1.5 }
    ],
    lowpass: { baseHz: 1500, loadHz: 2500 }
  };
  const cylinders = (car && car.cylinders) || src.firings.length;
  const firings = src.firings.length === cylinders ? src.firings.map((row) => ({ ...row })) : evenFire(cylinders);
  const intake = sound.intake || {};
  return {
    id,
    name: car && car.name,
    cylinders,
    idleRpm: (car && car.idleRpm) || 800,
    redline: (car && (car.redline || car.redlineRpm)) || 7000,
    firings,
    formants: src.formants.map((row) => ({ ...row })),
    lowpass: { baseHz: src.lowpass.baseHz, loadHz: src.lowpass.loadHz },
    burble: sound.burble != null ? sound.burble : 0.35,
    noiseGain: sound.noiseGain != null ? sound.noiseGain : 0.12,
    intakeGain: intake.gain != null ? intake.gain : 0.18,
    whineType: sound.whineType || 'none',
    whineGain: sound.whineGain || 0,
    whineMult: sound.whineMult || 5.5,
    whineOnsetRpm: sound.whineOnsetRpm || 2500,
    blowOff: sound.blowOff || 0
  };
}
