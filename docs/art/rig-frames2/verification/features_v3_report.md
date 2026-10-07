# R3 feature verification

All values are mean absolute RGB differences, in 0–255 channel levels. See JSON for fixed ROI coordinates and full method. These numbers measure ink differences; they do not certify perceptual recognizability.

| Gender | Feature | Pair | Source | 80px |
|---|---|---|---:|---:|
| female | eyes | 01-02 | 21.2766 | 13.0197 |
| female | eyes | 01-03 | 27.6681 | 17.1864 |
| female | eyes | 02-03 | 27.9463 | 17.2061 |
| female | brows | 01-02 | 30.1070 | 13.0767 |
| female | brows | 01-03 | 39.2256 | 17.0967 |
| female | brows | 02-03 | 50.5336 | 23.7533 |
| female | nose | 01-02 | 43.1920 | 10.9722 |
| female | mouth | 01-02 | 67.8876 | 39.3611 |
| female | mouth | 01-03 | 29.9787 | 9.6528 |
| female | mouth | 02-03 | 64.0060 | 34.4861 |
| male | eyes | 01-02 | 21.8522 | 13.5132 |
| male | eyes | 01-03 | 30.6025 | 18.4683 |
| male | eyes | 02-03 | 30.5965 | 18.6534 |
| male | brows | 01-02 | 46.5276 | 17.7600 |
| male | brows | 01-03 | 29.2683 | 13.8733 |
| male | brows | 02-03 | 60.7105 | 25.9200 |
| male | nose | 01-02 | 43.1920 | 10.9722 |
| male | mouth | 01-02 | 67.8876 | 39.3611 |
| male | mouth | 01-03 | 29.9787 | 9.6528 |
| male | mouth | 02-03 | 64.0060 | 34.4861 |

Protected files checked: 52; changed: 0. Manifest remains byte-identical. All 52 PNG dimensions and pivots are unchanged.
All-type anchor checks: 1232; maximum error: 0px. Every feature has transparent margins.
Exhaustive regression: 48,384 seam cases / 81,945,216 samples; alpha failures 0, white failures 0; unoutlined head/hair cuts 0. GIF: 80 decoded frames, pass.

Female 01 blue eye bounds match v1 within 1 source pixel (0.13px at runtime); right-eye bounds match exactly. Left eye: v1 28x46px, R3 28x45px. Right eye: both 24x44px. Male 01: 28x40px / 24x39px, with no lash flick. See `features_v3_reference_measurements.json`.

Design: 01 vertical/confident, 02 round/soft/open happy mouth, 03 angular/straight thick brow/neutral mouth. The initial cat mouth was rejected during 80px review and replaced by a straight neutral line. All hurt/closed/ko variants remain available.

Limits: the locked v2 skull and hair silhouette still differ from the lineup; a feature-only revision cannot make the entire head pixel-identical. Nose and small-mouth distinctions have the lowest visual salience at 80px. Native reference-player renders were verified; the running game was not inspected.

Regression details: `report.json`, `features_v3_regression.log`. Visual review: `features_v3_visual_review.json`.

Rebuild only facial curves: `PYTHONDONTWRITEBYTECODE=1 python3 docs/art/rig-frames2/features_v3.py`. Re-run `verify.py`, then `verify_features_v3.py` to regenerate the complete R3 verification set. Do not use the historical `build.py` to rebuild R3 features: it is the preserved v2 full-rig generator.
