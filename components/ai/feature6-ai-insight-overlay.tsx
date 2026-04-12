// FEATURE 6 - AI Insight Overlay (activated via FEATURE 1's "AI Insight" button)
// Sub-components:
//   6A — AIKPIBadges: KPI pill badges + popovers (equipment-dashboard.tsx)
//   6B — AIChartMarkers: Chart anomaly markers (equipment-dashboard.tsx)
//   6C — AIMapBadges: Site map plant status badges (site-overview.tsx)
// To remove this feature: delete this file and remove all usages from the 3 files above.

"use client"

import { useState } from "react"
import { useAppStore } from "@/lib/store"

// ─── Shared sub-utils ─────────────────────────────────────────────────────────
function SparkIcon14() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M12 2L13.5 9L20 12L13.5 15L12 22L10.5 15L4 12L10.5 9L12 2Z" fill="#7c3aed" fillOpacity="0.9"/>
      <path d="M19 3L19.8 5.2L22 6L19.8 6.8L19 9L18.2 6.8L16 6L18.2 5.2L19 3Z" fill="#7c3aed" fillOpacity="0.5"/>
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE 6A — KPI Pill AI Explainer Badges
// Usage: wrap each <KPIPill> in equipment-dashboard.tsx with <AIKPIBadgeWrapper kpiKey="dmg">
// ═══════════════════════════════════════════════════════════════════════════════

const KPI_INSIGHTS: Record<string, { title: string; text: string }> = {
  dmg: {
    title: "DMG: 201%",
    text: "Damage has exceeded design limit by 101%. Primarily driven by fatigue cycling in the top shell course. Engineering review recommended before next cycle.",
  },
  reLife: {
    title: "Re-Life: 40 yrs",
    text: "Remaining life based on current damage rate. If operating conditions worsen by 10%, this drops to 31 years.",
  },
  date: {
    title: "Date: 10/02/2026",
    text: "Next inspection due based on current damage progression. Expedited review may be warranted.",
  },
  id: {
    title: "ID: 260020",
    text: "This equipment has 3 open findings from the last inspection cycle.",
  },
}

export function AIKPIBadgeWrapper({
  kpiKey,
  children,
}: {
  kpiKey: keyof typeof KPI_INSIGHTS
  children: React.ReactNode
}) {
  const { aiInsightActive } = useAppStore()
  const [popoverOpen, setPopoverOpen] = useState(false)

  return (
    <div className="relative flex w-full h-full">
      {children}

      {/* Badge — only visible when AI Insight is active */}
      {aiInsightActive && (
        <button
          onClick={() => setPopoverOpen(v => !v)}
          aria-label={`AI insight for ${kpiKey}`}
          style={{
            position: "absolute",
            top: "-7px",
            right: "-7px",
            width: "18px",
            height: "18px",
            borderRadius: "50%",
            background: "#ffffff",
            border: "1.5px solid #7c3aed",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 20,
            padding: 0,
            boxShadow: "0 1px 4px rgba(124,58,237,0.25)",
            animation: "ai-insight-fadein 0.2s ease-out both",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.15)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
        >
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L13.5 9L20 12L13.5 15L12 22L10.5 15L4 12L10.5 9L12 2Z" fill="#7c3aed"/>
          </svg>
        </button>
      )}

      {/* Popover */}
      {aiInsightActive && popoverOpen && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 10px)",
            left: "50%",
            transform: "translateX(-50%)",
            width: "260px",
            background: "#ffffff",
            borderRadius: "12px",
            boxShadow: "0 12px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)",
            padding: "12px",
            zIndex: 10000,
            animation: "ai-insight-fadein 0.2s ease-out both",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <SparkIcon14 />
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#7c3aed" }}>AI Analysis</span>
            </div>
            <button
              onClick={() => setPopoverOpen(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#9ca3af",
                fontSize: "15px",
                lineHeight: 1,
                padding: "2px 4px",
                borderRadius: "4px",
              }}
              aria-label="Close popover"
            >
              ×
            </button>
          </div>
          <p style={{ margin: 0, fontSize: "13px", color: "#374151", lineHeight: 1.6 }}>
            {KPI_INSIGHTS[kpiKey].text}
          </p>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE 6B — Chart Anomaly Markers
// Usage: <AILineChartMarkers /> overlaid on TrendLineChart container
//        <AIBarChartThreshold /> overlaid on BarChartVertical container
// ═══════════════════════════════════════════════════════════════════════════════

export function AILineChartMarkers({ width = "100%", height = 100 }: { width?: string | number; height?: number }) {
  const { aiInsightActive } = useAppStore()
  const [hovered1, setHovered1] = useState(false)
  const [hovered2, setHovered2] = useState(false)

  if (!aiInsightActive) return null

  const tooltips = [
    "Spike detected — Cycle #447, correlated with pressure event on 03/02/2026",
    "Accelerated rate change — 22% increase in damage accumulation detected",
  ]
  const positions = ["35%", "70%"]

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        animation: "ai-insight-fadein 0.2s ease-out both",
        zIndex: 10,
      }}
    >
      {positions.map((xPos, i) => (
        <div
          key={i}
          style={{ position: "absolute", top: 0, left: xPos, height: "100%", pointerEvents: "all" }}
          onMouseEnter={() => i === 0 ? setHovered1(true) : setHovered2(true)}
          onMouseLeave={() => i === 0 ? setHovered1(false) : setHovered2(false)}
        >
          {/* Dashed vertical line */}
          <div
            style={{
              position: "absolute",
              top: "12px",
              left: 0,
              width: "1.5px",
              height: "calc(100% - 12px)",
              background: "repeating-linear-gradient(to bottom, #f59e0b 0, #f59e0b 4px, transparent 4px, transparent 8px)",
            }}
          />
          {/* Diamond flag at top */}
          <div
            style={{
              position: "absolute",
              top: "2px",
              left: "-6px",
              width: "12px",
              height: "12px",
              background: "#f59e0b",
              transform: "rotate(45deg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          />
          {/* Exclamation in diamond */}
          <div
            style={{
              position: "absolute",
              top: "3px",
              left: "-1px",
              fontSize: "8px",
              color: "white",
              fontWeight: 900,
              lineHeight: 1,
              pointerEvents: "none",
            }}
          >
            !
          </div>

          {/* Tooltip */}
          {(i === 0 ? hovered1 : hovered2) && (
            <div
              style={{
                position: "absolute",
                top: "20px",
                left: "8px",
                width: "230px",
                background: "#1f2937",
                color: "#f9fafb",
                borderRadius: "6px",
                padding: "8px 10px",
                fontSize: "11px",
                lineHeight: 1.5,
                zIndex: 10000,
                animation: "ai-search-fadein 0.1s ease-out both",
                boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                pointerEvents: "none",
              }}
            >
              <style>{`@keyframes ai-search-fadein { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }`}</style>
              {tooltips[i]}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export function AIBarChartThreshold() {
  const { aiInsightActive } = useAppStore()
  if (!aiInsightActive) return null

  return (
    <div
      style={{
        position: "absolute",
        top: "25%",   // 75% from bottom = 25% from top
        left: 0,
        right: 0,
        height: "1.5px",
        pointerEvents: "none",
        animation: "ai-insight-fadein 0.2s ease-out both",
        zIndex: 10,
      }}
    >
      {/* Dashed red line */}
      <div
        style={{
          width: "100%",
          height: "1.5px",
          background: "repeating-linear-gradient(to right, #ef4444 0, #ef4444 6px, transparent 6px, transparent 12px)",
        }}
      />
      {/* Tag label at right end */}
      <div
        style={{
          position: "absolute",
          top: "-9px",
          right: 0,
          background: "#ef4444",
          color: "white",
          fontSize: "9px",
          fontWeight: 700,
          padding: "2px 5px",
          borderRadius: "3px 3px 0 0",
          letterSpacing: "0.03em",
        }}
      >
        AI Threshold
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE 6C — Anomaly Flags on Site Map
// Usage: <AIMapBadges /> inside the map container in site-overview.tsx
// ═══════════════════════════════════════════════════════════════════════════════

const MAP_BADGES = [
  {
    id: "plant-1-badge",
    // Position in top-right of Plant 1 bounding box (top-left quadrant of map)
    style: { top: "8px", left: "calc(50% - 28px)" },
    dot: "#22c55e",
    label: "Normal",
    labelColor: "#15803d",
    bg: "#ffffff",
    tooltip: "No anomalies detected. Last scan: 2 hours ago.",
  },
  {
    id: "plant-2-badge",
    // Position in top-right of Plant 2 bounding box (bottom-right quadrant)
    style: { bottom: "8px", right: "8px", top: "auto", left: "auto" },
    dot: "#f59e0b",
    label: "Warning",
    labelColor: "#d97706",
    bg: "#fffbeb",
    tooltip: "2 anomalies detected — Temperature spike on Equipment c. Review recommended.",
  },
]

function AIMapBadge({
  dot,
  label,
  labelColor,
  bg,
  style,
  tooltip,
}: {
  dot: string
  label: string
  labelColor: string
  bg: string
  style: React.CSSProperties
  tooltip: string
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      style={{
        position: "absolute",
        ...style,
        zIndex: 25,
        animation: "ai-insight-fadein 0.2s ease-out both",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Pill badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          background: bg,
          borderRadius: "99px",
          padding: "3px 8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
          fontSize: "10px",
          fontWeight: 600,
          cursor: "default",
          border: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: dot, flexShrink: 0 }} />
        <span style={{ color: labelColor }}>{label}</span>
      </div>

      {/* Tooltip */}
      {hovered && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            width: "210px",
            background: "#ffffff",
            borderRadius: "8px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
            padding: "10px 12px",
            zIndex: 10000,
            animation: "ai-insight-fadein 0.15s ease-out both",
            pointerEvents: "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "6px" }}>
            <SparkIcon14 />
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#7c3aed" }}>AI DETECTED</span>
          </div>
          <p style={{ margin: 0, fontSize: "12px", color: "#374151", lineHeight: 1.5 }}>{tooltip}</p>
        </div>
      )}
    </div>
  )
}

export function AIMapBadges() {
  const { aiInsightActive } = useAppStore()
  if (!aiInsightActive) return null

  return (
    <>
      {MAP_BADGES.map(badge => (
        <AIMapBadge key={badge.id} {...badge} />
      ))}
    </>
  )
}
