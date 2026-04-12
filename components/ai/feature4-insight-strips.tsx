// FEATURE 4 - AI Insight Strips on Dashboard Thumbnail Cards
// Renders in: components/dashboard-card.tsx — appended at bottom of each card
// To remove this feature: delete this file and remove <AIInsightStrip /> from dashboard-card.tsx

"use client"

// ─── Hardcoded insight text per card index (0–3) ─────────────────────────────
const INSIGHTS: Record<number, string> = {
  0: "↑ 12% above baseline this week",
  1: "Trending toward threshold — review recommended",
  2: "No anomalies detected",
  3: "Data sync incomplete — insights limited",
}

// ─── Tiny Spark Icon ─────────────────────────────────────────────────────────
function TinySparkIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M12 2L13.5 9L20 12L13.5 15L12 22L10.5 15L4 12L10.5 9L12 2Z" fill="#3b82f6" fillOpacity="0.8"/>
    </svg>
  )
}

// ─── FEATURE 4 Main Component ─────────────────────────────────────────────────
export function AIInsightStrip({ cardIndex }: { cardIndex: number }) {
  const insight = INSIGHTS[cardIndex] ?? INSIGHTS[0]

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "5px",
        background: "#eff6ff",
        padding: "4px 10px",
        borderTop: "1px solid #dbeafe",
      }}
    >
      <TinySparkIcon />
      <span
        style={{
          fontSize: "11px",
          color: "#6b7280",
          lineHeight: 1.4,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          flex: 1,
        }}
      >
        {insight}
      </span>
    </div>
  )
}
