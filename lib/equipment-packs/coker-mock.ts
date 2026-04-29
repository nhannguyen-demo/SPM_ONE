/**
 * Deterministic mock payloads for Coker v1 template renderers.
 * (Synthetic values — not representative of any real site.)
 */

export const mockEquipmentDataRows = [
  { item: "Asset Name", value: "Delayed Coker (204-F-0142)" },
  { item: "Shell Diameter", value: "9118 mm" },
  { item: "Shell Thickness", value: "47 mm" },
  { item: "Skirt Thickness", value: "29 mm" },
  { item: "Total Height", value: "42.1 m" },
  { item: "Last Inspection", value: "14/04/2026 16:18:00" },
  { item: "Total Cycles", value: "2751" },
  { item: "Total Damage", value: "86.91 %" },
]

/** Multi series tile — full window (3 traces). */
export const mockSeriesMulti = [
  { t: "12/04/2026", a: 42.1, b: 40.6, c: 39.7 },
  { t: "13/04/2026", a: 42.4, b: 40.9, c: 40.0 },
  { t: "14/04/2026", a: 41.9, b: 40.5, c: 39.8 },
  { t: "15/04/2026", a: 42.7, b: 41.1, c: 40.2 },
  { t: "16/04/2026", a: 42.3, b: 40.8, c: 39.9 },
]

/** Last cycle — two active traces (third column flat for chart scale). */
export const mockSeriesLastCycle = [
  { t: "12/04/2026", a: 41.4, b: 40.0, c: 39.2 },
  { t: "13/04/2026", a: 41.7, b: 40.2, c: 39.2 },
  { t: "14/04/2026", a: 41.2, b: 39.8, c: 39.2 },
  { t: "15/04/2026", a: 42.0, b: 40.5, c: 39.2 },
  { t: "16/04/2026", a: 41.6, b: 40.1, c: 39.2 },
]

/** Selected cycle — single trace. */
export const mockSeriesSelectedCycle = [
  { t: "12/04/2026", a: 43.0, b: 42.0, c: 41.0 },
  { t: "13/04/2026", a: 43.2, b: 42.0, c: 41.0 },
  { t: "14/04/2026", a: 42.8, b: 42.0, c: 41.0 },
  { t: "15/04/2026", a: 43.4, b: 42.0, c: 41.0 },
  { t: "16/04/2026", a: 43.1, b: 42.0, c: 41.0 },
]

export const mockDamageByCycle = Array.from({ length: 12 }, (_, i) => ({
  cycle: 2680 + i,
  damage: 52.4 + i * 2.35 + (i > 7 ? 8.2 : 0),
}))

/** FAD limit line (Lr / Kr) — synthetic assessment curve. */
export const mockFadLine = [
  { lr: 0, kr: 0.86 },
  { lr: 0.48, kr: 0.51 },
  { lr: 0.98, kr: 0.23 },
  { lr: 1.28, kr: 0.11 },
  { lr: 1.55, kr: 0.04 },
]

export const mockTopDamageRows = [
  { no: 1, damage: 86.91, az: 6.8, el: 30.2, dir: "NNE", group: "Shell C7" },
  { no: 2, damage: 83.5, az: 89.1, el: 20.6, dir: "E", group: "Shell C4" },
  { no: 3, damage: 67.8, az: 181.4, el: 9.7, dir: "SSW", group: "Cone" },
]

export const mockBulgeRows = [
  { r: "R3", pslf: 86, like: "LIKELY", az: 14, el: 22, mag: 0.1, zone: "Cone" },
  { r: "R7", pslf: 59, like: "POSSIBLE", az: 48, el: 16, mag: 0.068, zone: "Shell Body" },
  { r: "R1", pslf: 26, like: "UNLIKELY", az: 201, el: 4, mag: 0.018, zone: "Skirt" },
]

export const mockCrackRows = [
  { loc: "R4", cycle: 24922, zone: "Cone", deg: 4.5, el: 12.1, len: 0.017, depth: 0.0032, lr: 0.36, kr: 0.3 },
  { loc: "R9", cycle: 24890, zone: "Shell", deg: 90.0, el: 20.8, len: 0.013, depth: 0.0026, lr: 0.31, kr: 0.27 },
]

export const mockElevationBars = [
  { el: 29.8, v: 0 },
  { el: 25.2, v: 0 },
  { el: 0, v: 0.01063 },
  { el: -10.4, v: 0 },
]
