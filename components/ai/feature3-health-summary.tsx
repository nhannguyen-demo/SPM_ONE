// FEATURE 3 - AI Health Summary Card (Site Level + Plant Level)
// Renders in: 
//   - site-overview.tsx right panel — above "Site Information" header
//   - plant-overview.tsx right panel — above "Plant Information" header
// To remove this feature: delete this file and remove <AIHealthSummaryCard /> from both views

"use client"

// ─── Hardcoded content per level ────────────────────────────────────────────
const HEALTH_CONTENT = {
  site: {
    text: "Site 2000 is operating within normal parameters. One unit has equipment approaching a damage threshold. Last inspection was 14 days ago.",
    status: "Normal" as const,
  },
  plant: {
    text: "Plant 1 is operating within normal parameters. Plant 2 has 1 equipment approaching damage threshold. Last inspection was 14 days ago.",
    status: "Normal" as const,
  },
}

const STATUS_COLORS = {
  Normal:   { dot: "#22c55e", text: "#15803d" },
  Warning:  { dot: "#f59e0b", text: "#d97706" },
  Critical: { dot: "#ef4444", text: "#dc2626" },
}

// ─── Small Sparkle Icon ──────────────────────────────────────────────────────
function SparkleSmall() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M12 2L13.5 9L20 12L13.5 15L12 22L10.5 15L4 12L10.5 9L12 2Z" fill="#7c3aed" fillOpacity="0.85"/>
      <path d="M19 3L19.8 5.2L22 6L19.8 6.8L19 9L18.2 6.8L16 6L18.2 5.2L19 3Z" fill="#7c3aed" fillOpacity="0.5"/>
    </svg>
  )
}

// ─── FEATURE 3 Main Component ────────────────────────────────────────────────
export function AIHealthSummaryCard({ level }: { level: "site" | "plant" }) {
  const content = HEALTH_CONTENT[level]
  const statusColor = STATUS_COLORS[content.status]

  return (
    <div
      style={{
        borderRadius: "12px",
        background: "linear-gradient(135deg, #eff6ff, #f5f3ff)",
        borderLeft: "3px solid #6366f1",
        padding: "12px 14px",
        marginBottom: "14px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Breathing left border accent via pseudo-overlay */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "3px",
          height: "100%",
          background: "#6366f1",
          borderRadius: "12px 0 0 12px",
          animation: "ai-border-breathe 3s ease-in-out infinite",
        }}
      />

      {/* Top row: label + status */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <SparkleSmall />
          <span style={{ fontSize: "11px", fontWeight: 600, color: "#6d28d9", letterSpacing: "0.02em" }}>
            AI Health Summary
          </span>
        </div>
        {/* Status dot + label */}
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: statusColor.dot,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: "11px", fontWeight: 600, color: statusColor.text }}>
            {content.status}
          </span>
        </div>
      </div>

      {/* Body text */}
      <p
        style={{
          fontSize: "12px",
          color: "#374151",
          lineHeight: 1.6,
          margin: 0,
          marginBottom: "8px",
        }}
      >
        {content.text}
      </p>

      {/* Timestamp */}
      <span style={{ fontSize: "11px", color: "#9ca3af" }}>
        Updated just now
      </span>
    </div>
  )
}
