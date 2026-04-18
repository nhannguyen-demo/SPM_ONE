"use client"

import { useState } from "react"
import { DashboardCard } from "@/components/dashboard-card"

interface DashboardTabStackProps {
  equipId: string;
  equipmentName: string;
  cards: any[];
  isExpanded: boolean;
  autoExpand?: boolean;   // When only one group exists, expand automatically
  onExpand: () => void;
  onCardClick: (card: any) => void;
}

export function DashboardTabStack({
  equipId,
  equipmentName,
  cards,
  isExpanded,
  autoExpand = false,
  onExpand,
  onCardClick,
}: DashboardTabStackProps) {
  const [isHovered, setIsHovered] = useState(false)

  if (cards.length === 0) return null

  // Single card or auto-expand: show without stacking
  const shouldExpand = isExpanded || autoExpand || cards.length === 1

  if (shouldExpand) {
    return (
      <div className="flex gap-3 flex-shrink-0 relative pl-0 py-1">
        {/* Equipment label above */}
        <div className="absolute -top-5 left-0 text-[10px] font-semibold text-primary/70 uppercase tracking-widest whitespace-nowrap">
          {equipmentName}
          {cards.length > 1 && <span className="ml-1 text-muted-foreground">({cards.length})</span>}
        </div>
        {cards.map((card, idx) => (
          <div key={card.id} className="cursor-pointer flex-shrink-0" onClick={() => onCardClick(card)}>
            <DashboardCard card={card} cardIndex={idx} />
          </div>
        ))}
      </div>
    )
  }

  // Stacked mode (collapsed) — max 3 visible shadow layers
  const stackDepth = Math.min(cards.length - 1, 2) // 0 = no shadow, 1-2 shadows behind

  return (
    <div
      className="relative flex-shrink-0 cursor-pointer group"
      style={{ width: 220, marginRight: stackDepth * 8 + 16 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onExpand}
    >
      {/* Equipment name label above the stack */}
      <div className="absolute -top-5 left-0 text-[10px] font-semibold text-primary/70 uppercase tracking-widest whitespace-nowrap">
        {equipmentName}
      </div>

      {/* Badge - floated above the top edge */}
      <div
        className="absolute -top-3 right-2 z-20 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg transition-all duration-300 group-hover:scale-105"
      >
        {cards.length} tabs
      </div>

      {/* Shadow cards behind — stacked offset going right+down */}
      {Array.from({ length: stackDepth }).map((_, i) => {
        const depth = stackDepth - i // 2,1
        const offsetX = isHovered ? depth * 10 : depth * 5
        const offsetY = isHovered ? depth * -6 : depth * -3
        const scale = 1 - depth * 0.03
        return (
          <div
            key={i}
            className="absolute inset-0 rounded-xl border border-border bg-card shadow-sm transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
            style={{
              transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
              zIndex: i + 1,
              opacity: 0.85 - i * 0.15,
            }}
          />
        )
      })}

      {/* Front card */}
      <div className="relative z-10 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-1">
        <DashboardCard card={cards[0]} cardIndex={0} />
      </div>

      {/* Expand hint */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[10px] text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-full z-20 whitespace-nowrap">
        Click to expand ↔
      </div>
    </div>
  )
}
