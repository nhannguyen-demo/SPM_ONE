// FEATURE 2 - AI-Powered Search Bar Autocomplete
// Renders in: components/header.tsx — replaces the existing raw <input> block
// To remove this feature: delete this file and restore the original <input> in header.tsx

"use client"

import { useState, useRef, useEffect } from "react"
import { Search } from "lucide-react"

// ─── Hardcoded AI suggestions ───────────────────────────────────────────────
const AI_SUGGESTIONS = [
  "Show me all equipment exceeding damage threshold this month",
  "Run what-if on Equipment b with pressure +10%",
]

// ─── Small Sparkle Icon for dropdown rows ────────────────────────────────────
function RowSparkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path
        d="M12 2L13.5 9L20 12L13.5 15L12 22L10.5 15L4 12L10.5 9L12 2Z"
        fill="#7c3aed"
        fillOpacity="0.85"
      />
      <path
        d="M19 3L19.8 5.2L22 6L19.8 6.8L19 9L18.2 6.8L16 6L18.2 5.2L19 3Z"
        fill="#7c3aed"
        fillOpacity="0.5"
      />
    </svg>
  )
}

// ─── FEATURE 2 Main Component ────────────────────────────────────────────────
export function AISearchAutocomplete() {
  const [value, setValue] = useState("")
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleMouseDown)
    return () => document.removeEventListener("mousedown", handleMouseDown)
  }, [])

  const handleSelect = (suggestion: string) => {
    setValue(suggestion)
    setOpen(false)
  }

  return (
    <div ref={wrapperRef} style={{ position: "relative", flex: 1, maxWidth: "560px" }}>
      {/* ── Search Input (mirrors existing header styling) ── */}
      <div style={{ position: "relative" }}>
        <Search
          style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "16px",
            height: "16px",
            color: "var(--muted-foreground)",
            pointerEvents: "none",
          }}
        />
        <input
          id="ai-search-input"
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search assets, tags, or ask AI..."
          className="w-full h-10 pl-10 pr-10 bg-secondary rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        {/* Decorative sparkles icon right side */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          style={{
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--muted-foreground)",
            pointerEvents: "none",
            opacity: 0.6,
          }}
        >
          <path d="M12 2L13.5 9L20 12L13.5 15L12 22L10.5 15L4 12L10.5 9L12 2Z" fill="currentColor"/>
        </svg>
      </div>

      {/* ── AI Suggestion Dropdown ── */}
      {open && (
        <div
          id="ai-search-dropdown"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06)",
            zIndex: 10000,
            overflow: "hidden",
            animation: "ai-search-fadein 0.1s ease-out both",
          }}
        >
          <style>{`
            @keyframes ai-search-fadein {
              from { opacity: 0; transform: translateY(-4px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {/* Label row */}
          <div
            style={{
              padding: "8px 12px 6px",
              fontSize: "11px",
              fontWeight: 600,
              color: "#9ca3af",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            AI Suggestions
          </div>

          {AI_SUGGESTIONS.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => handleSelect(suggestion)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 12px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.1s ease",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <RowSparkIcon />
              <span style={{ flex: 1, fontSize: "13px", color: "#374151", lineHeight: 1.4 }}>
                {suggestion}
              </span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                style={{ flexShrink: 0, color: "#d1d5db" }}
              >
                <path d="M2 12L12 2M12 2H5M12 2V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
