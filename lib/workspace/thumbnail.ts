/**
 * Mock thumbnail generator for Workspace dashboards.
 *
 * Per the resolved open question, each dashboard's thumbnail is conceptually a
 * generated screenshot of the rendered widget grid captured on save. v1 ships
 * with a deterministic SVG-data-URI generator: it draws a small "wireframe" of
 * the widget grid using each widget's layout box. This produces a unique-
 * looking thumbnail per dashboard without needing a real screenshot library,
 * and refreshes deterministically when the layout changes.
 *
 * Replace with a real screenshot library (`html2canvas`, `dom-to-image`, or
 * Puppeteer-on-server) when product wants pixel-perfect previews.
 */

import type { GridWidget } from "@/components/dashboard/layouts"

/** Deterministic palette — same name → same colors. */
const PALETTES: Array<{ bg: string; fg: string; accent: string }> = [
  { bg: "#0f172a", fg: "#1e293b", accent: "#38bdf8" },
  { bg: "#0c1f1d", fg: "#1f3a36", accent: "#34d399" },
  { bg: "#1c1006", fg: "#3b2410", accent: "#f59e0b" },
  { bg: "#1d0d1a", fg: "#3b1d33", accent: "#ec4899" },
  { bg: "#0f1730", fg: "#1f2a52", accent: "#818cf8" },
  { bg: "#1a0c0c", fg: "#3a1818", accent: "#f87171" },
]

function hashString(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

/**
 * Generate a deterministic SVG-encoded data URI thumbnail. Always returns a
 * value safe to assign to an <img src=… />.
 */
export function generateDashboardThumbnail(
  dashboardId: string,
  name: string,
  widgets: GridWidget[],
): string {
  const palette = PALETTES[hashString(dashboardId) % PALETTES.length]

  const W = 320
  const H = 180
  const pad = 6
  const cols = 12
  const rows = 8

  const cellW = (W - pad * 2) / cols
  const cellH = (H - pad * 2) / rows

  const widgetRects = widgets
    .slice(0, 14)
    .map((w) => {
      const { x, y, w: cw, h: ch } = w.layout
      const safeY = Math.min(y, rows - 1)
      const safeH = Math.min(ch, rows - safeY)
      const px = pad + x * cellW
      const py = pad + safeY * cellH
      const pw = cw * cellW - 4
      const ph = safeH * cellH - 4
      const tone = (hashString(w.id) % 60) / 100 + 0.15
      return `<rect x="${px.toFixed(1)}" y="${py.toFixed(1)}" width="${pw.toFixed(1)}" height="${ph.toFixed(1)}" rx="4" fill="${palette.fg}" fill-opacity="${(0.55 + tone).toFixed(2)}" />`
    })
    .join("")

  const accentBar = `<rect x="${pad}" y="${pad}" width="${W - pad * 2}" height="3" rx="1.5" fill="${palette.accent}" />`

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "DB"

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="${palette.bg}" />
    ${accentBar}
    ${widgetRects}
    <text x="${W - 10}" y="${H - 10}" text-anchor="end" font-family="ui-sans-serif, system-ui, -apple-system, sans-serif" font-weight="700" font-size="12" fill="${palette.accent}" fill-opacity="0.85">${initials}</text>
  </svg>`

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
