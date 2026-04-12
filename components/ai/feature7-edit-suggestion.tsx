// FEATURE 7 - Edit Mode "Editing Suggestion" Floating Button
// Renders in: same fixed position as FEATURE 1 spark button
// Activated when: viewMode === "edit" or "modules" in equipment-dashboard.tsx
// Controlled by: FEATURE 1 component (feature1-spark-button.tsx delegates to this)
// To remove this feature: delete this file and remove delegation logic from feature1-spark-button.tsx

"use client"

import { useState } from "react"

// ─── Particle spark element ───────────────────────────────────────────────────
function SparkParticle({ animName, delay }: { animName: string; delay: string }) {
  return (
    <div
      style={{
        position: "absolute",
        width: "4px",
        height: "4px",
        borderRadius: "50%",
        background: "#c4b5fd",
        top: "50%",
        left: "50%",
        animation: `${animName} 0.5s ease-out ${delay} both`,
        pointerEvents: "none",
      }}
    />
  )
}

// ─── FEATURE 7 Main Component ─────────────────────────────────────────────────
export function AIEditingSuggestionButton() {
  const [showTooltip, setShowTooltip] = useState(false)
  const [animPhase, setAnimPhase] = useState<"morph-in" | "idle">("morph-in")

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "20px",
        zIndex: 9999,
      }}
    >
      {/* Tooltip above button */}
      {showTooltip && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            right: 0,
            background: "#1f2937",
            color: "#f9fafb",
            fontSize: "12px",
            padding: "6px 10px",
            borderRadius: "6px",
            whiteSpace: "nowrap",
            boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
            pointerEvents: "none",
            animation: "ai-search-fadein 0.1s ease-out both",
          }}
        >
          <style>{`@keyframes ai-search-fadein { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }`}</style>
          Suggestion based on current status
          {/* Down arrow */}
          <div
            style={{
              position: "absolute",
              bottom: "-4px",
              right: "20px",
              width: "8px",
              height: "8px",
              background: "#1f2937",
              transform: "rotate(45deg)",
            }}
          />
        </div>
      )}

      {/* The pill button */}
      <div style={{ position: "relative" }}>
        {/* Particle sparks — play once on mount */}
        {animPhase === "morph-in" && (
          <>
            <SparkParticle animName="ai-particle-1" delay="300ms" />
            <SparkParticle animName="ai-particle-2" delay="350ms" />
            <SparkParticle animName="ai-particle-3" delay="400ms" />
          </>
        )}

        <button
          aria-label="AI Editing Suggestion"
          style={{
            height: "48px",
            padding: "0 20px",
            borderRadius: "999px",
            background: "linear-gradient(135deg, #7c3aed, #2563eb)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "white",
            fontSize: "14px",
            fontWeight: 600,
            boxShadow: "0 4px 20px rgba(124,58,237,0.45), 0 2px 8px rgba(0,0,0,0.2)",
            animation: animPhase === "morph-in"
              ? "ai-morph-spin 0.4s ease-out both, ai-insight-fadein 0.2s ease-out both"
              : "none",
            whiteSpace: "nowrap",
            transition: "box-shadow 0.2s ease, transform 0.15s ease",
          }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onAnimationEnd={() => setAnimPhase("idle")}
        >
          {/* Sparkle icon with flicker */}
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            style={{
              animation: "ai-icon-glow 1.5s ease-in-out infinite",
            }}
          >
            <path d="M12 2L13.5 9L20 12L13.5 15L12 22L10.5 15L4 12L10.5 9L12 2Z" fill="white" fillOpacity="0.95"/>
            <path d="M19 3L19.8 5.2L22 6L19.8 6.8L19 9L18.2 6.8L16 6L18.2 5.2L19 3Z" fill="white" fillOpacity="0.6"/>
            <path d="M5 17L5.6 18.4L7 19L5.6 19.6L5 21L4.4 19.6L3 19L4.4 18.4L5 17Z" fill="white" fillOpacity="0.5"/>
          </svg>
          ✦ Editing Suggestion
        </button>
      </div>
    </div>
  )
}
