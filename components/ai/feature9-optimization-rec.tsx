// FEATURE 9 - What-If Scenario Result: AI Optimization Recommendation
// Renders in: modals/what-if-scenario.tsx — between results table and Share footer
// To remove this feature: delete this file and remove <AIOptimizationCard /> from the modal

"use client"

// ─── FEATURE 9 Main Component ─────────────────────────────────────────────────
export function AIOptimizationCard() {
  return (
    <div
      style={{
        margin: "12px 16px 0",
        borderRadius: "10px",
        background: "#f0fdf4",
        borderLeft: "3px solid #16a34a",
        padding: "12px 16px",
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
        {/* Green checkmark-spark icon */}
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#22c55e" fillOpacity="0.15"/>
          <path d="M7 12.5L10.5 16L17 9" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M19 3L19.8 5.2L22 6L19.8 6.8L19 9L18.2 6.8L16 6L18.2 5.2L19 3Z" fill="#16a34a" fillOpacity="0.6"/>
        </svg>
        <span style={{ fontSize: "12px", fontWeight: 700, color: "#15803d" }}>
          AI Optimization Recommendation
        </span>
      </div>

      {/* Body with bold key options */}
      <p style={{ margin: 0, fontSize: "13px", color: "#374151", lineHeight: 1.6 }}>
        To maintain the current Re-Life target: {" "}
        <strong style={{ color: "#15803d" }}>reduce operating pressure to 8.2 MPa</strong>{" "}
        — OR —{" "}
        <strong style={{ color: "#15803d" }}>increase inspection frequency to every 6 months in Course 3 (upper shell)</strong>.
      </p>
    </div>
  )
}
