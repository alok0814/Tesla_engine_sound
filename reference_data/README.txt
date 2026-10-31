reference_data/
  traces/<video>.csv      rpm / km/h / throttle read off the on-screen UI of each screen recording
                          every 0.1 s (OCR, so a few noisy samples remain; gear column omitted because
                          OCR of gear digits was unreliable). audio_lag_s = delay of the audio versus the
                          on-screen numbers (0.03-0.08 s; the GT3 clip is 0.43 s).
  harmonic_profile.json   per car x rpm band: level (dBFS RMS), spectral centroid, 95% rolloff, and the
                          harmonic levels (dB relative to the strongest) at k x firing frequency for
                          k = 0.5,1,1.5,2,2.5,3,4,5,6,8.
Throttle is the width of the orange bar on screen / 700 px, so treat it as approximately 0..1.
