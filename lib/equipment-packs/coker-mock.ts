/**
 * Deterministic mock payloads for Coker renderers.
 * (Synthetic values — not representative of any real site.)
 */

// ---------------------------------------------------------------------------
// Equipment Data
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Temperature sensors (renamed from raw tag IDs)
// ---------------------------------------------------------------------------

/** Full-window temperature time series — 3 sensor traces. */
export const mockTemperatureSeries = [
  { t: "12/04", s1: 403.1, s2: 398.6, s3: 390.7 },
  { t: "13/04", s1: 404.4, s2: 399.9, s3: 392.0 },
  { t: "14/04", s1: 401.9, s2: 397.5, s3: 390.8 },
  { t: "15/04", s1: 405.7, s2: 401.1, s3: 393.2 },
  { t: "16/04", s1: 403.3, s2: 399.8, s3: 391.9 },
  { t: "17/04", s1: 406.0, s2: 402.1, s3: 394.0 },
  { t: "18/04", s1: 404.8, s2: 400.5, s3: 392.7 },
]

export const TEMPERATURE_SENSOR_LABELS = [
  "Temperature Sensor 1",
  "Temperature Sensor 2",
  "Temperature Sensor 3",
]

// ---------------------------------------------------------------------------
// Pressure sensors (renamed)
// ---------------------------------------------------------------------------

/** Full-window pressure time series — 3 sensor traces. */
export const mockPressureSeries = [
  { t: "12/04", s1: 0.11, s2: 0.12, s3: 0.10 },
  { t: "13/04", s1: 0.12, s2: 0.13, s3: 0.11 },
  { t: "14/04", s1: 0.11, s2: 0.12, s3: 0.10 },
  { t: "15/04", s1: 0.13, s2: 0.14, s3: 0.12 },
  { t: "16/04", s1: 0.12, s2: 0.13, s3: 0.11 },
  { t: "17/04", s1: 0.13, s2: 0.14, s3: 0.12 },
  { t: "18/04", s1: 0.12, s2: 0.13, s3: 0.11 },
]

export const PRESSURE_SENSOR_LABELS = [
  "Pressure Sensor 1",
  "Pressure Sensor 2",
  "Pressure Sensor 3",
]

// ---------------------------------------------------------------------------
// Legacy multi-series (kept for backward-compat with old templateKey widgets)
// Values now represent temperature data with human-readable sensor names.
// ---------------------------------------------------------------------------

export const mockSeriesMulti = mockTemperatureSeries.map((d) => ({
  t: d.t,
  a: d.s1,
  b: d.s2,
  c: d.s3,
}))

export const mockSeriesLastCycle = [
  { t: "12/04", a: 401.4, b: 397.0, c: 389.2 },
  { t: "13/04", a: 401.7, b: 397.2, c: 389.2 },
  { t: "14/04", a: 401.2, b: 396.8, c: 389.2 },
  { t: "15/04", a: 402.0, b: 397.5, c: 389.2 },
  { t: "16/04", a: 401.6, b: 397.1, c: 389.2 },
]

export const mockSeriesSelectedCycle = [
  { t: "12/04", a: 406.0, b: 402.0, c: 395.0 },
  { t: "13/04", a: 406.2, b: 402.0, c: 395.0 },
  { t: "14/04", a: 405.8, b: 402.0, c: 395.0 },
  { t: "15/04", a: 406.4, b: 402.0, c: 395.0 },
  { t: "16/04", a: 406.1, b: 402.0, c: 395.0 },
]

// ---------------------------------------------------------------------------
// Steam Rate & Flow Rate
// ---------------------------------------------------------------------------

export const mockSteamRateSeries = [
  { t: "12/04", v: 1.40 },
  { t: "13/04", v: 1.35 },
  { t: "14/04", v: 1.42 },
  { t: "15/04", v: 1.38 },
  { t: "16/04", v: 1.44 },
  { t: "17/04", v: 1.41 },
  { t: "18/04", v: 1.39 },
]

export const mockFlowRateSeries = [
  { t: "12/04", v: 8.4 },
  { t: "13/04", v: 8.1 },
  { t: "14/04", v: 8.7 },
  { t: "15/04", v: 8.3 },
  { t: "16/04", v: 8.5 },
  { t: "17/04", v: 8.2 },
  { t: "18/04", v: 8.6 },
]

// ---------------------------------------------------------------------------
// Coke Level
// ---------------------------------------------------------------------------

export const mockCokeLevelKpi = {
  value: 24.06,
  unit: "%",
  max: 100,
  warnAt: 75,
  critAt: 90,
}

// ---------------------------------------------------------------------------
// Fatigue Damage
// ---------------------------------------------------------------------------

export const mockDamageByCycle = Array.from({ length: 12 }, (_, i) => ({
  cycle: 2680 + i,
  damage: 52.4 + i * 2.35 + (i > 7 ? 8.2 : 0),
}))

export const mockTopDamageRows = [
  { no: 1, damage: 86.91, az: 6.8, el: 30.2, dir: "NNE", group: "Shell C7" },
  { no: 2, damage: 83.5, az: 89.1, el: 20.6, dir: "E", group: "Shell C4" },
  { no: 3, damage: 67.8, az: 181.4, el: 9.7, dir: "SSW", group: "Cone" },
  { no: 4, damage: 54.2, az: 273.0, el: 15.3, dir: "W", group: "Shell C5" },
  { no: 5, damage: 43.1, az: 45.0, el: 5.1, dir: "NE", group: "Skirt" },
]

export const mockElevationBars = [
  { el: 29.8, v: 0 },
  { el: 25.2, v: 0 },
  { el: 0, v: 0.01063 },
  { el: -10.4, v: 0 },
]

// ---------------------------------------------------------------------------
// Stress
// ---------------------------------------------------------------------------

export const mockStressKpi = {
  value: 0.0,
  unit: "MPa",
  location: "Elev. 0.1 m",
}

// ---------------------------------------------------------------------------
// Remaining Life (gauge)
// ---------------------------------------------------------------------------

export const mockRemainingLifeGauge = {
  value: 2.7,
  unit: "years",
  zones: [
    { min: 0, max: 5, label: "Critical", color: "#ef4444" },
    { min: 5, max: 25, label: "Monitor", color: "#f59e0b" },
    { min: 25, max: 35, label: "Good", color: "#22c55e" },
  ],
}

// ---------------------------------------------------------------------------
// Bulging / PSLF
// ---------------------------------------------------------------------------

export const mockBulgeRows = [
  { r: "R3", pslf: 142, like: "LIKELY", az: 14, el: 22, mag: 0.1, zone: "Cone" },
  { r: "R7", pslf: 86, like: "LIKELY", az: 48, el: 16, mag: 0.068, zone: "Shell Body" },
  { r: "R1", pslf: 59, like: "POSSIBLE", az: 201, el: 4, mag: 0.018, zone: "Skirt" },
  { r: "R9", pslf: 26, like: "UNLIKELY", az: 135, el: 10, mag: 0.009, zone: "Shell Body" },
]

export const mockPslfKpi = { value: 142.35, inspection: "TB 2023" }

// ---------------------------------------------------------------------------
// Ovality
// ---------------------------------------------------------------------------

/** Ovality cross-section — measured vs nominal. Angles 0°–360° at 30° steps. */
export const mockOvalityData = Array.from({ length: 13 }, (_, i) => {
  const deg = i * 30
  const rad = (deg * Math.PI) / 180
  const nominal = 4559 // mm — half of 9118 mm diameter
  // Synthetic elliptical distortion: +18 mm at 0°, -12 mm at 90°
  const delta = 18 * Math.cos(2 * rad) - 12 * Math.sin(2 * rad)
  return { angle: deg, nominal, measured: nominal + delta }
})

export const mockOvalityElevation = 9.5 // default elevation (m)

// ---------------------------------------------------------------------------
// Displacement (polar)
// ---------------------------------------------------------------------------

export const mockDisplacementPolar = [
  { direction: "N", v: 0.17 },
  { direction: "NE", v: 0.09 },
  { direction: "E", v: 0.12 },
  { direction: "SE", v: 0.05 },
  { direction: "S", v: 0.06 },
  { direction: "SW", v: 0.08 },
  { direction: "W", v: 0.11 },
  { direction: "NW", v: 0.14 },
]

// ---------------------------------------------------------------------------
// Crack / FAD
// ---------------------------------------------------------------------------

export const mockFadLine = [
  { lr: 0, kr: 0.86 },
  { lr: 0.48, kr: 0.51 },
  { lr: 0.98, kr: 0.23 },
  { lr: 1.28, kr: 0.11 },
  { lr: 1.55, kr: 0.04 },
]

export const mockCrackRows = [
  { loc: "R4", cycle: 24922, zone: "Cone", deg: 4.5, el: 12.1, len: 0.017, depth: 0.0032, lr: 0.36, kr: 0.30 },
  { loc: "R9", cycle: 24890, zone: "Shell", deg: 90.0, el: 20.8, len: 0.013, depth: 0.0026, lr: 0.31, kr: 0.27 },
  { loc: "R2", cycle: 24850, zone: "Shell", deg: 182.0, el: 15.3, len: 0.009, depth: 0.0019, lr: 0.22, kr: 0.19 },
]
