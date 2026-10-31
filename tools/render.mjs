/**
 * Offline render of EngineAudio.
 *   node tools/render.mjs --car ford-mustang-gt --rpm 3000 --load 0.8 --seconds 3 --out tools/out/a.wav
 *   node tools/render.mjs --car dodge-challenger-hellcat --trace reference_data/traces/Dodge_Hellcat.csv --out tools/out/hellcat.wav
 */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { OfflineAudioContext } from 'node-web-audio-api';
import { EngineAudio } from '../engine-audio.js';

const CARS = {
  'ford-mustang-gt': { id: 'ford-mustang-gt', cylinders: 8, idleRpm: 750, redline: 7500, sound: { burble: 0.4 } },
  'dodge-challenger-hellcat': { id: 'dodge-challenger-hellcat', cylinders: 8, idleRpm: 700, redline: 6200, sound: { burble: 0.1 } },
  'ferrari-812': { id: 'ferrari-812', cylinders: 12, idleRpm: 900, redline: 8900, sound: { burble: 0.15 } },
  'porsche-911-gt3': { id: 'porsche-911-gt3', cylinders: 6, idleRpm: 900, redline: 9000, sound: { burble: 0.15 } },
  'lamborghini-huracan': { id: 'lamborghini-huracan', cylinders: 10, idleRpm: 850, redline: 8500, sound: { burble: 0.5 } },
  'nissan-gtr': { id: 'nissan-gtr', cylinders: 6, idleRpm: 800, redline: 7100, sound: { burble: 0.12 } }
};

function args(argv) {
  const out = { seconds: 3, load: 0.8, rpm: 3000, sr: 44100 };
  for (let i = 2; i < argv.length; i++) {
    const key = argv[i];
    const val = argv[i + 1];
    if (key === '--car') out.car = val;
    else if (key === '--rpm') out.rpm = Number(val);
    else if (key === '--load') out.load = Number(val);
    else if (key === '--seconds') out.seconds = Number(val);
    else if (key === '--trace') out.trace = val;
    else if (key === '--out') out.out = val;
    else if (key === '--sr') out.sr = Number(val);
    else continue;
    i += 1;
  }
  if (!out.car || !out.out) {
    throw new Error('need --car and --out');
  }
  return out;
}

function parseTrace(path) {
  const lines = readFileSync(path, 'utf8').trim().split(/\n/);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const [t, rpm, kmh, thr] = lines[i].split(',');
    const rpmN = Number(rpm);
    const thrN = Number(thr);
    if (!Number.isFinite(Number(t)) || !Number.isFinite(rpmN)) continue;
    rows.push({
      t: Number(t),
      rpm: rpmN,
      load: Number.isFinite(thrN) ? Math.max(0, Math.min(1, thrN)) : 0
    });
  }
  return rows;
}

function wavBytes(channel, sr) {
  const n = channel.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sr, 24);
  buf.writeUInt32LE(sr * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, channel[i]));
    buf.writeInt16LE((s * 32767) | 0, 44 + i * 2);
  }
  return buf;
}

const opt = args(process.argv);
const car = CARS[opt.car];
if (!car) throw new Error('unknown car ' + opt.car);
const rows = opt.trace ? parseTrace(opt.trace) : null;
const duration = rows ? Math.max(0.5, rows[rows.length - 1].t + 0.2) : opt.seconds;
const length = Math.ceil(opt.sr * duration);
const ctx = new OfflineAudioContext(1, length, opt.sr);
const engine = new EngineAudio(ctx);
engine.setCar(car);
engine.setVolume(0.9);
engine.start();
const frames = [];
if (rows) {
  for (const row of rows) {
    engine.setRpm(row.rpm);
    engine.setLoad(row.load);
    engine.update(row.t);
    frames.push(row);
  }
} else {
  const step = 0.05;
  for (let t = 0; t < duration; t += step) {
    engine.setRpm(opt.rpm);
    engine.setLoad(opt.load);
    engine.update(t);
    frames.push({ t, rpm: opt.rpm, load: opt.load });
  }
}
const rendered = await ctx.startRendering();
const audio = rendered.getChannelData(0);
let peak = 0;
for (let i = 0; i < audio.length; i++) {
  const a = Math.abs(audio[i]);
  if (a > peak) peak = a;
}
mkdirSync(dirname(opt.out), { recursive: true });
writeFileSync(opt.out, wavBytes(audio, opt.sr));
const metaPath = opt.out.replace(/\.wav$/i, '.json');
writeFileSync(metaPath, JSON.stringify({
  sr: opt.sr,
  car: opt.car,
  cylinders: car.cylinders,
  peak,
  frames
}));
console.log(opt.out, 'peak', peak.toFixed(3), 'seconds', duration.toFixed(2));
