// FEATURE 1 - Global Floating AI Spark Button System
// Renders on: Site Overview, Plant Overview, Equipment Home
// Does NOT render on: Data & Sync screen, any modal
// To remove this feature: delete this file and remove <AISparkButton /> from app/page.tsx
// Note: When viewMode === "edit", this component renders AIEditingSuggestionButton (FEATURE 7) instead.

"use client"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { AIEditingSuggestionButton } from "@/components/ai/feature7-edit-suggestion"

// ─── Sparkle SVG icon (shared) ─────────────────────────────────────────────
export function SparkleIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M12 2L13.5 9L20 12L13.5 15L12 22L10.5 15L4 12L10.5 9L12 2Z"
        fill="currentColor"
        fillOpacity="0.9"
      />
      <path
        d="M19 3L19.8 5.2L22 6L19.8 6.8L19 9L18.2 6.8L16 6L18.2 5.2L19 3Z"
        fill="currentColor"
        fillOpacity="0.6"
      />
      <path
        d="M5 17L5.6 18.4L7 19L5.6 19.6L5 21L4.4 19.6L3 19L4.4 18.4L5 17Z"
        fill="currentColor"
        fillOpacity="0.5"
      />
    </svg>
  )
}

// ─── FEATURE 1 Main Component ──────────────────────────────────────────────
export function AISparkButton() {
  const {
    currentView,
    viewMode,
    aiSparkExpanded,
    setAiSparkExpanded,
    aiInsightActive,
    setAiInsightActive,
  } = useAppStore()

  const [chatValue, setChatValue] = useState("")

  // Only render on dashboard views
  if (!["site", "plant", "equipment-home"].includes(currentView)) return null

  // FEATURE 7 integration: when in edit mode, delegate to editing suggestion button
  if (viewMode === "edit" || viewMode === "modules") {
    return <AIEditingSuggestionButton />
  }

  const handleCollapse = () => {
    setAiSparkExpanded(false)
  }

  const handleAIInsight = () => {
    setAiInsightActive(!aiInsightActive)
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "20px",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* ── Collapsed: Single Spark Button ── */}
      {!aiSparkExpanded && (
        <button
          onClick={() => setAiSparkExpanded(true)}
          aria-label="Open AI Assistant"
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "50%",
            background: "#1a1a2e",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "ai-spark-pulse 2s ease-in-out infinite",
            transition: "transform 0.2s ease",
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.08)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
        >
          <SparkleIcon
            size={22}
            className="text-purple-300"
            // CSS animation applied via inline style for the glow
          />
          <style>{`
            .ai-spark-icon { animation: ai-icon-glow 2s ease-in-out infinite; }
          `}</style>
        </button>
      )}

      {/* ── Expanded: 3-Component Row ── */}
      {aiSparkExpanded && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          {/* Left: Minimize Chevron Button */}
          <div
            style={{
              animation: "ai-insight-fadein 0.18s ease-out both",
              animationDelay: "0ms",
            }}
          >
            <button
              onClick={handleCollapse}
              aria-label="Collapse AI assistant"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "#1a1a2e",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                transition: "transform 0.15s ease",
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.1)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M8 2L4 6L8 10" stroke="#c4b5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Center: AI Chat Input Pill */}
          <div
            style={{
              animation: "ai-insight-fadein 0.18s ease-out both",
              animationDelay: "80ms",
            }}
          >
            <div
              style={{
                width: "300px",
                height: "48px",
                borderRadius: "999px",
                background: "#ffffff",
                border: "1px solid #e0e0e0",
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                display: "flex",
                alignItems: "center",
                padding: "0 12px",
                gap: "8px",
              }}
            >
              {/* Decorative spark icon inside input */}
              <SparkleIcon size={14} className="text-purple-400" />

              <input
                type="text"
                value={chatValue}
                onChange={e => setChatValue(e.target.value)}
                placeholder="Ask anything"
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: "13px",
                  color: "#374151",
                  fontStyle: "italic",
                }}
              />

              {/* Send button */}
              <button
                aria-label="Send AI message"
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "#1a1a2e",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "opacity 0.15s ease",
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M1 12L12 6.5L1 1V5.5L9 6.5L1 7.5V12Z" fill="#c4b5fd"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Right: AI Insight Button */}
          <div
            style={{
              animation: "ai-insight-fadein 0.18s ease-out both",
              animationDelay: "160ms",
            }}
          >
            <button
              onClick={handleAIInsight}
              aria-label="Toggle AI Insight overlay"
              style={{
                height: "48px",
                padding: "0 18px",
                borderRadius: "999px",
                background: aiInsightActive
                  ? "linear-gradient(135deg, #7c3aed, #2563eb)"
                  : "linear-gradient(135deg, #2563eb, #7c3aed)",
                border: "1.5px solid rgba(139, 92, 246, 0.5)",
                boxShadow: aiInsightActive
                  ? "0 0 0 3px rgba(139,92,246,0.25), 0 4px 16px rgba(37,99,235,0.3)"
                  : "0 0 16px rgba(124, 58, 237, 0.3), 0 4px 16px rgba(37,99,235,0.2)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "white",
                fontSize: "13px",
                fontWeight: 600,
                whiteSpace: "nowrap",
                transition: "box-shadow 0.2s ease, transform 0.15s ease",
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.04)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
            >
              <SparkleIcon size={14} />
              AI Insight
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
