#!/usr/bin/env python3
"""Cut a dyno recording into seamless RPM loops and write manifest.json.

Measured rpm is always fundamentalHz * 60 / cylinders * 2.
Filenames are labels only and are never used as the rpm.

Example:
  python3 tools/make_loops.py run.wav --cylinders 8 --idle-rpm 750 \\
      --redline 7500 --car-id ford-mustang-gt --perspective exhaust --load on \\
      --out loops/ford-mustang-gt
"""

from __future__ import annotations

import argparse
import json
import math
import os
import shlex
import struct
import subprocess
import sys
import wave


def show(cmd: list[str]) -> None:
    print("+ " + " ".join(shlex.quote(str(part)) for part in cmd), flush=True)


def run(cmd: list[str]) -> None:
    show(cmd)
    subprocess.run(cmd, check=True)


def measured_rpm(fundamental_hz: float, cylinders: int) -> float:
    return fundamental_hz * 60.0 / cylinders * 2.0


def target_rpms(idle: float, redline: float) -> list[float]:
    bands = [float(idle)]
    rpm = 1000.0
    while rpm <= 2500.0 and rpm <= redline + 1:
        if abs(rpm - idle) > 80:
            bands.append(rpm)
        rpm += 250.0
    rpm = 3000.0
    while rpm <= redline + 1:
        bands.append(rpm)
        rpm += 500.0
    return bands


def read_wav(path: str) -> tuple[list[float], int]:
    with wave.open(path, "rb") as handle:
        channels = handle.getnchannels()
        width = handle.getsampwidth()
        sr = handle.getframerate()
        frames = handle.getnframes()
        raw = handle.readframes(frames)
    if width != 2:
        raise SystemExit("ffmpeg の出力が 16-bit wav ではありません")
    count = len(raw) // 2
    ints = struct.unpack("<" + "h" * count, raw)
    if channels == 1:
        samples = [v / 32768.0 for v in ints]
    else:
        samples = [ints[i] / 32768.0 for i in range(0, len(ints), channels)]
    return samples, sr


def firing_track(samples: list[float], sr: int, cylinders: int) -> list[dict]:
    """Peak-interval estimate of firing frequency, hopped every 50 ms."""
    factor = 8
    sr2 = sr / factor
    n = len(samples) // factor
    if n < 8:
        return []
    env = [0.0] * n
    for i in range(n):
        base = i * factor
        peak = 0.0
        for k in range(factor):
            v = samples[base + k]
            if v < 0:
                v = -v
            if v > peak:
                peak = v
        env[i] = peak
    smooth = [0.0] * n
    acc = 0.0
    coeff = 1.0 - math.exp(-1.0 / (sr2 * 0.0025))
    for i in range(n):
        acc += (env[i] - acc) * coeff
        smooth[i] = acc

    min_lag = max(1, int(sr2 / 1200.0))
    decay = math.exp(-1.0 / (sr2 * 0.06))
    peaks: list[int] = []
    last = -10**9
    ceiling = 1e-6
    for i in range(1, n - 1):
        ceiling *= decay
        if smooth[i] > ceiling:
            ceiling = smooth[i]
        if i - last < min_lag:
            continue
        if smooth[i] >= smooth[i - 1] and smooth[i] > smooth[i + 1] and smooth[i] > ceiling * 0.42:
            peaks.append(i)
            last = i

    hop = max(1, int(sr2 * 0.05))
    window = max(hop, int(sr2 * 0.45))
    track: list[dict] = []
    pi = 0
    for center in range(0, n, hop):
        w0 = center - window // 2
        w1 = center + window // 2
        while pi < len(peaks) and peaks[pi] < w0:
            pi += 1
        local = []
        j = pi
        while j < len(peaks) and peaks[j] < w1:
            local.append(peaks[j])
            j += 1
        if len(local) < 3:
            continue
        gaps = [local[k + 1] - local[k] for k in range(len(local) - 1)]
        gaps.sort()
        gap = gaps[len(gaps) // 2]
        if gap <= 0:
            continue
        f0 = sr2 / gap
        if f0 < 15 or f0 > 1400:
            continue
        track.append({
            "t": center / sr2,
            "f0": f0,
            "rpm": measured_rpm(f0, cylinders),
        })
    return track


def best_region(track: list[dict], target: float, need_s: float) -> tuple[float, float, float] | None:
    tol = max(40.0, target * 0.045)
    best = None
    i = 0
    while i < len(track):
        if abs(track[i]["rpm"] - target) > tol:
            i += 1
            continue
        j = i
        while j < len(track) and abs(track[j]["rpm"] - target) <= tol:
            j += 1
        span = track[j - 1]["t"] - track[i]["t"]
        if span >= need_s * 0.85:
            rpms = sorted(row["rpm"] for row in track[i:j])
            median = rpms[len(rpms) // 2]
            score = abs(median - target) - span * 0.01
            if best is None or score < best[0]:
                best = (score, track[i]["t"], track[j - 1]["t"], median)
        i = j
    if best is None:
        return None
    return best[1], best[2], best[3]


def _corr(samples: list[float], i0: int, i1: int, win: int) -> float:
    if i0 < 0 or i1 < 0 or i1 + win > len(samples) or i0 + win > i1:
        return -1.0
    dot = 0.0
    n0 = 0.0
    n1 = 0.0
    for k in range(win):
        x = samples[i0 + k]
        y = samples[i1 + k]
        dot += x * y
        n0 += x * x
        n1 += y * y
    if n0 < 1e-10 or n1 < 1e-10:
        return 0.0
    return dot / math.sqrt(n0 * n1)


def find_loop(samples: list[float], sr: int, start_s: float, end_s: float, f0: float, min_s: float, max_s: float) -> tuple[int, int, float] | None:
    start = max(0, int(start_s * sr))
    end = min(len(samples) - 1, int(end_s * sr))
    if f0 < 15:
        f0 = 15
    period = max(8, int(round(sr / f0)))
    if end - start < int(min_s * sr):
        return None
    search_end = min(end, start + int(0.7 * sr))
    crosses = []
    for i in range(start, search_end):
        if samples[i] <= 0.0 < samples[i + 1]:
            crosses.append(i)
            if len(crosses) >= 24:
                break
    if not crosses:
        return None
    win = max(16, min(period, int(sr * 0.012)))
    min_cycles = max(2, int(min_s * f0))
    max_cycles = max(min_cycles + 1, int(max_s * f0))
    step = max(1, int(0.08 * f0))
    best = None
    for z in crosses:
        cycles = min_cycles
        while cycles <= max_cycles:
            guess = z + cycles * period
            if guess >= end - win:
                break
            snap = guess
            window = max(2, period // 10)
            lo = max(z + period, guess - window)
            hi = min(end - win - 1, guess + window)
            found = None
            for i in range(lo, hi):
                if samples[i] <= 0.0 < samples[i + 1]:
                    found = i
                    break
            if found is not None:
                snap = found
            length = (snap - z) / sr
            if min_s * 0.92 <= length <= max_s * 1.05:
                score = _corr(samples, z, snap, win)
                if best is None or score > best[0]:
                    best = (score, z, snap)
            cycles += step
    if best is None:
        return None
    return best[1], best[2], best[0]


def encode_slice(src_wav: str, start: float, dur: float, dest: str) -> str:
    opus = dest if dest.endswith(".opus") else dest + ".opus"
    cmd = [
        "ffmpeg", "-y", "-i", src_wav,
        "-ss", f"{start:.6f}", "-t", f"{dur:.6f}",
        "-c:a", "libopus", "-b:a", "96k", opus,
    ]
    show(cmd)
    try:
        subprocess.run(cmd, check=True, capture_output=True)
        return os.path.basename(opus)
    except (subprocess.CalledProcessError, FileNotFoundError) as err:
        if isinstance(err, subprocess.CalledProcessError) and err.stderr:
            sys.stderr.write(err.stderr.decode("utf-8", "replace")[-500:] + "\n")
        wav_out = os.path.splitext(opus)[0] + ".wav"
        cmd2 = [
            "ffmpeg", "-y", "-i", src_wav,
            "-ss", f"{start:.6f}", "-t", f"{dur:.6f}",
            "-c:a", "pcm_s16le", wav_out,
        ]
        print("libopus が使えないので wav に落とします", file=sys.stderr)
        run(cmd2)
        return os.path.basename(wav_out)


def main() -> None:
    parser = argparse.ArgumentParser(description="dyno 録音を回転バンドのループに切る")
    parser.add_argument("recording")
    parser.add_argument("--cylinders", type=int, required=True)
    parser.add_argument("--idle-rpm", type=float, default=800)
    parser.add_argument("--redline", type=float, default=7000)
    parser.add_argument("--car-id", default="")
    parser.add_argument("--perspective", default="exhaust", choices=("exhaust", "engine", "intake"))
    parser.add_argument("--load", default="on", choices=("on", "off"))
    parser.add_argument("--out", required=True)
    args = parser.parse_args()
    if args.cylinders < 1:
        raise SystemExit("--cylinders は 1 以上")

    os.makedirs(args.out, exist_ok=True)
    car_id = args.car_id or os.path.splitext(os.path.basename(args.recording))[0]
    decoded = os.path.join(args.out, "_decoded.wav")
    run(["ffmpeg", "-y", "-i", args.recording, "-ac", "1", "-ar", "48000", decoded])
    samples, sr = read_wav(decoded)
    track = firing_track(samples, sr, args.cylinders)
    if len(track) < 4:
        raise SystemExit("点火の基本周波数を追跡できませんでした")

    manifest_path = os.path.join(args.out, "manifest.json")
    if os.path.exists(manifest_path):
        with open(manifest_path, "r", encoding="utf-8") as handle:
            manifest = json.load(handle)
    else:
        manifest = {"version": 1, "carId": car_id, "cylinders": args.cylinders, "perspectives": {}}
    manifest["carId"] = car_id
    manifest["cylinders"] = args.cylinders
    manifest.setdefault("perspectives", {})
    block = manifest["perspectives"].setdefault(args.perspective, {"on": [], "off": []})

    entries = []
    for target in target_rpms(args.idle_rpm, args.redline):
        idle = abs(target - args.idle_rpm) < 1
        need = 3.2 if idle else 1.15
        region = best_region(track, target, need)
        if region is None:
            print(f"skip {target:.0f} rpm: 安定区間がありません")
            continue
        t0, t1, median = region
        f0 = median * args.cylinders / 120.0
        min_s, max_s = (3.0, 5.0) if idle else (1.0, 2.0)
        found = find_loop(samples, sr, t0, t1, f0, min_s, max_s)
        if found is None:
            print(f"skip {target:.0f} rpm: ゼロクロスのループ点が見つかりません")
            continue
        i0, i1, score = found
        cut = samples[i0:i1]
        cut_f0 = firing_track(cut, sr, args.cylinders)
        if cut_f0:
            fundamental = sum(row["f0"] for row in cut_f0) / len(cut_f0)
        else:
            fundamental = f0
        rpm = measured_rpm(fundamental, args.cylinders)
        label = "idle" if idle else f"{int(round(target)):04d}"
        name = f"{args.perspective}-{args.load}-{label}.opus"
        dest = os.path.join(args.out, name)
        written = encode_slice(decoded, i0 / sr, (i1 - i0) / sr, dest)
        print(
            f"{written}: fundamental {fundamental:.2f} Hz -> {rpm:.1f} rpm "
            f"(join {score:.3f}, {((i1 - i0) / sr):.2f}s)"
        )
        entries.append({
            "file": written,
            "fundamentalHz": round(fundamental, 3),
            "measuredRpm": round(rpm, 2),
            "targetRpm": round(target, 1),
            "joinScore": round(score, 3),
        })

    entries.sort(key=lambda row: row["measuredRpm"])
    block[args.load] = entries
    with open(manifest_path, "w", encoding="utf-8") as handle:
        json.dump(manifest, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    print(f"wrote {manifest_path} ({len(entries)} loops)")
    try:
        os.remove(decoded)
    except OSError:
        pass


if __name__ == "__main__":
    main()
