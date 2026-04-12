// FEATURE 10 - What-If Scenario Result: "Generate AI Report" Share Option
// Renders in: modals/what-if-scenario.tsx — replaces the inline share dropdown JSX
// To remove this feature: delete this file and restore original 3-item dropdown in the modal

"use client"

// ─── FEATURE 10 Main Component ────────────────────────────────────────────────
// Includes the "✦ Generate AI Report" item at top + the original 3 share items below.
export function AIShareDropdown() {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "calc(100% + 8px)",
        right: 0,
        width: "220px",
        background: "var(--card, #ffffff)",
        border: "1px solid var(--border, #e5e7eb)",
        borderRadius: "8px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        overflow: "hidden",
        zIndex: 10,
      }}
    >
      {/* ✦ Generate AI Report — top, visually distinct */}
      <button
        style={{
          width: "100%",
          padding: "10px 16px",
          background: "#f5f3ff",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          gap: "7px",
          fontSize: "13px",
          fontWeight: 600,
          color: "#7c3aed",
          transition: "background 0.1s ease",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "#ede9fe")}
        onMouseLeave={e => (e.currentTarget.style.background = "#f5f3ff")}
      >
        {/* Purple spark icon */}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
          <path d="M12 2L13.5 9L20 12L13.5 15L12 22L10.5 15L4 12L10.5 9L12 2Z" fill="#7c3aed"/>
          <path d="M19 3L19.8 5.2L22 6L19.8 6.8L19 9L18.2 6.8L16 6L18.2 5.2L19 3Z" fill="#7c3aed" fillOpacity="0.55"/>
        </svg>
        ✦ Generate AI Report
      </button>

      {/* Divider between AI item and regular items */}
      <div style={{ height: "1px", background: "#e5e7eb" }} />

      {/* Original 3 share items */}
      {[
        "Publish Report & Save to Storage",
        "Save to Storage",
        "Share to Stakeholders",
      ].map(label => (
        <button
          key={label}
          style={{
            width: "100%",
            padding: "10px 16px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
            fontSize: "14px",
            color: "var(--foreground, #111827)",
            transition: "background 0.1s ease",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "var(--secondary, #f3f4f6)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
