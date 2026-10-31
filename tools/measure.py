#!/usr/bin/env python3
"""STFT metrics matching the reference notes.

  python3 tools/measure.py tools/out/a.wav --ref Dodge_Hellcat
"""

from __future__ import annotations

import argparse
import json
import sys
import wave

import numpy as np
from scipy.signal import stft

K = np.array([0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8])
BANDS = [
    ("idle", 0, 1200, "idle"),
    ("1.3-2.5k", 1300, 2500, "run"),
    ("2.5-4k", 2500, 4000, "run"),
    ("4-6k", 4000, 6000, "run"),
    ("6k+", 6000, 20000, "run"),
]


def read_wav(path: str) -> tuple[np.ndarray, int]:
    with wave.open(path, "rb") as handle:
        sr = handle.getframerate()
        n = handle.getnframes()
        raw = handle.readframes(n)
        ch = handle.getnchannels()
    audio = np.frombuffer(raw, dtype="<i2").astype(np.float64) / 32768.0
    if ch > 1:
        audio = audio[::ch]
    return audio, sr


def nearest(frames: list[dict], t: float) -> dict | None:
    best = None
    best_d = 1e9
    for row in frames:
        d = abs(row["t"] - t)
        if d < best_d:
            best = row
            best_d = d
    if best is None or best_d > 0.15:
        return None
    return best


def metrics(audio: np.ndarray, sr: int, frames: list[dict], cylinders: int) -> dict:
    hop = 2048
    _f, times, z = stft(audio, fs=sr, window="hann", nperseg=8192, noverlap=8192 - hop, boundary=None)
    mag = np.abs(z)
    freqs = _f
    events = cylinders / 2
    out: dict[str, dict] = {}
    # Precompute band masks of frames
    assigned = {name: [] for name, _, _, _ in BANDS}
    for ti, t in enumerate(times):
        row = nearest(frames, float(t))
        if row is None:
            continue
        rpm = row["rpm"]
        load = row["load"]
        for name, lo, hi, kind in BANDS:
            if not (lo <= rpm < hi):
                continue
            if kind == "idle" and load >= 0.12:
                continue
            if kind == "run" and load <= 0.15:
                continue
            assigned[name].append(ti)
            break
    for name, _lo, _hi, _kind in BANDS:
        idx = assigned[name]
        if len(idx) < 4:
            continue
        cols = mag[:, idx]
        rels = []
        cents = []
        rolls = []
        lows = []
        rms = []
        whine_ratio = []
        for j, ti in enumerate(idx):
            row = nearest(frames, float(times[ti]))
            firing = row["rpm"] / 60.0 * events
            spec = cols[:, j]
            peaks = []
            for k in K:
                target = k * firing
                if target < 15 or target > sr / 2 - 20:
                    peaks.append(np.nan)
                    continue
                width = max(6.0, target * 0.03)
                band = spec[(freqs >= target - width) & (freqs <= target + width)]
                peaks.append(float(band.max()) if band.size else np.nan)
            peaks = np.array(peaks)
            if not np.any(np.isfinite(peaks)) or np.nanmax(peaks) <= 0:
                continue
            db = 20 * np.log10(np.maximum(peaks, 1e-12) / np.nanmax(peaks))
            rels.append(db)
            # spectrum stats on this frame, 40 Hz–12 kHz
            m = (freqs >= 40) & (freqs <= 12000)
            ff = freqs[m]
            pp = spec[m] ** 2
            total = pp.sum() + 1e-20
            cent = float((ff * pp).sum() / total)
            order = np.argsort(ff)
            csum = np.cumsum(pp[order])
            cut = ff[order][min(len(ff) - 1, int(np.searchsorted(csum, 0.95 * total)))]
            cents.append(cent)
            rolls.append(float(cut))
            low_m = (freqs >= 20) & (freqs < 120)
            mid_m = (freqs >= 20) & (freqs <= 4000)
            low_e = float((spec[low_m] ** 2).sum())
            mid_e = float((spec[mid_m] ** 2).sum()) + 1e-20
            lows.append(10 * np.log10(low_e / mid_e))
            # time rms of the hop
            a0 = int(times[ti] * sr)
            a1 = min(len(audio), a0 + hop)
            if a1 > a0:
                seg = audio[a0:a1]
                rms.append(20 * np.log10(np.sqrt(np.mean(seg * seg)) + 1e-12))
            if row["rpm"] > 2500 and row["load"] > 0.4:
                target = 0.712 * row["rpm"]
                width = max(8.0, target * 0.02)
                band = (freqs >= target - width) & (freqs <= target + width)
                if np.any(band):
                    local_f = freqs[band]
                    local_p = spec[band]
                    f_hat = float(local_f[int(np.argmax(local_p))])
                    whine_ratio.append(f_hat / row["rpm"])
        if not rels:
            continue
        rel = np.nanmean(np.vstack(rels), axis=0)
        out[name] = {
            "n": len(rels),
            "rel": [round(float(x), 2) for x in rel],
            "centroid": round(float(np.mean(cents)), 1),
            "rolloff": round(float(np.mean(rolls)), 1),
            "low_db": round(float(np.mean(lows)), 2),
            "rms": round(float(np.mean(rms)), 2) if rms else None,
            "whine_hz_per_rpm": round(float(np.median(whine_ratio)), 4) if whine_ratio else None,
        }
    return out


def compare(got: dict, ref: dict) -> None:
    print(f"{'band':<10} {'k':<5} {'mine':>7} {'ref':>7} {'d':>6}  cent%   low")
    for name, block in ref.items():
        if name not in got:
            print(f"{name:<10} missing")
            continue
        g = got[name]
        deltas = []
        for i, k in enumerate(K):
            if k < 1 or k > 6:
                continue
            d = g["rel"][i] - block["rel"][i]
            deltas.append(d)
            flag = "" if abs(d) <= 4 else " *"
            print(f"{name:<10} {k:<5} {g['rel'][i]:7.1f} {block['rel'][i]:7.1f} {d:6.1f}{flag}")
        cent = (g["centroid"] - block["centroid"]) / block["centroid"] * 100
        print(f"{'':<10} {'cent':<5} {g['centroid']:7.0f} {block['centroid']:7.0f} {cent:5.1f}%  low {g['low_db']:.1f} dB  rms {g['rms']}")
        if g.get("whine_hz_per_rpm"):
            print(f"{'':<10} whine {g['whine_hz_per_rpm']:.4f} Hz/rpm (target 0.712)")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("wav")
    parser.add_argument("--ref", default="")
    parser.add_argument("--profiles", default="reference_data/harmonic_profile.json")
    args = parser.parse_args()
    meta_path = args.wav.rsplit(".", 1)[0] + ".json"
    meta = json.load(open(meta_path, encoding="utf-8"))
    audio, sr = read_wav(args.wav)
    # drop the attack
    cut = int(0.35 * sr)
    audio = audio[cut:]
    frames = []
    for row in meta["frames"]:
        frames.append({"t": row["t"] - 0.35, "rpm": row["rpm"], "load": row["load"]})
    got = metrics(audio, sr, frames, meta["cylinders"])
    print(json.dumps(got, indent=2))
    if args.ref:
        ref = json.load(open(args.profiles, encoding="utf-8"))[args.ref]
        compare(got, ref)
    peak = float(np.max(np.abs(audio))) if len(audio) else 0
    print("peak", round(peak, 3), file=sys.stderr)


if __name__ == "__main__":
    main()
