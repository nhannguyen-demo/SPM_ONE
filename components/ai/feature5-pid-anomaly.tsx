// FEATURE 5 - P&ID Anomaly Overlay (Plant Overview Screen Only)
// Renders in: plant-overview.tsx — layered over the P&ID diagram container
// To remove this feature: delete this file and remove <PIDAnomalyOverlay /> from plant-overview.tsx

"use client"

import { useState } from "react"

// ─── Hardcoded anomaly position config ───────────────────────────────────────
const ANOMALIES = [
  {
    id: "anomaly-1",
    // lower-center — red valve area
    position: { bottom: "32%", left: "57%" },
    tooltip: "Flow rate at Output 1 is 18% below expected. Possible cause: partial blockage upstream.",
    label: "Valve Output 1",
  },
  {
    id: "anomaly-2",
    // center-left — purple vessel area
    position: { top: "28%", left: "28%" },
    tooltip: "Temperature deviation detected: +14°C above operating norm. Monitor closely.",
    label: "Vessel T-102",
  },
]

// ─── Spark Label Icon ─────────────────────────────────────────────────────────
function AIDetectedLabel() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "6px" }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L13.5 9L20 12L13.5 15L12 22L10.5 15L4 12L10.5 9L12 2Z" fill="#7c3aed"/>
      </svg>
      <span style={{ fontSize: "10px", fontWeight: 700, color: "#7c3aed", letterSpacing: "0.04em" }}>
        AI DETECTED
      </span>
    </div>
  )
}

// ─── Single Anomaly Indicator ─────────────────────────────────────────────────
function AnomalyIndicator({
  position,
  tooltip,
}: {
  position: React.CSSProperties
  tooltip: string
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      style={{
        position: "absolute",
        ...position,
        zIndex: 20,
        cursor: "pointer",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Tooltip — appears above on hover */}
      {hovered && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 10px)",
            left: "50%",
            transform: "translateX(-50%)",
            width: "220px",
            background: "#ffffff",
            borderRadius: "8px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)",
            padding: "10px 12px",
            zIndex: 10000,
            animation: "ai-tooltip-fadein 0.15s ease-out both",
            pointerEvents: "none",
          }}
        >
          <style>{`
            @keyframes ai-tooltip-fadein {
              from { opacity: 0; transform: translateX(-50%) translateY(4px); }
              to   { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
          `}</style>
          <AIDetectedLabel />
          <p style={{ margin: 0, fontSize: "12px", color: "#374151", lineHeight: 1.55 }}>
            {tooltip}
          </p>
          {/* Arrow */}
          <div
            style={{
              position: "absolute",
              bottom: "-5px",
              left: "50%",
              transform: "translateX(-50%) rotate(45deg)",
              width: "10px",
              height: "10px",
              background: "#ffffff",
              boxShadow: "2px 2px 4px rgba(0,0,0,0.06)",
            }}
          />
        </div>
      )}

      {/* Outer ripple ring (sonar ping) */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          border: "2px solid #f59e0b",
          background: "transparent",
          animation: "ai-sonar-ring 2s ease-out infinite",
          pointerEvents: "none",
        }}
      />

      {/* Inner solid indicator */}
      <div
        style={{
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          border: "2px solid #f59e0b",
          background: "rgba(245, 158, 11, 0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          transition: "background 0.15s ease",
          ...(hovered ? { background: "rgba(245,158,11,0.3)" } : {}),
        }}
      >
        {/* Warning triangle icon */}
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
          <path d="M8 2L15 14H1L8 2Z" fill="#f59e0b" stroke="#d97706" strokeWidth="0.5"/>
          <path d="M8 6V9" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="8" cy="11.5" r="0.75" fill="white"/>
        </svg>
      </div>
    </div>
  )
}

// ─── FEATURE 5 Main Component ─────────────────────────────────────────────────
export function PIDAnomalyOverlay() {
  return (
    <>
      {ANOMALIES.map(anomaly => (
        <AnomalyIndicator
          key={anomaly.id}
          position={anomaly.position}
          tooltip={anomaly.tooltip}
        />
      ))}
    </>
  )
}
