"use client"

import { useState } from "react"
import { ChevronLeft } from "lucide-react"
import { DashboardCard } from "@/components/dashboard-card"
import { getEquipmentDashboardThumbnail } from "@/lib/data"

interface DashboardTabStackProps {
  equipId: string;
  equipmentName: string;
  cards: any[];
  isExpanded: boolean;
  autoExpand?: boolean;   // When only one group exists, expand automatically
  onExpand: () => void;
  /** Collapse back to fan stack (only shown when user has expanded this stack). */
  onCollapse?: () => void;
  onCardClick: (card: any) => void;
}

function EquipmentStackLabel({
  equipmentName,
  tabCount,
  showCollapse,
  onCollapse,
}: {
  equipmentName: string
  tabCount: number
  showCollapse: boolean
  onCollapse?: () => void
}) {
  return (
    <div className="absolute -top-5 left-0 z-30 flex items-center gap-0.5">
      <span className="text-xs font-bold text-primary/80 uppercase tracking-wider whitespace-nowrap">
        {equipmentName}
        {tabCount > 1 && (
          <span className="ml-1 text-muted-foreground font-medium normal-case tracking-normal">
            ({tabCount})
          </span>
        )}
      </span>
      {showCollapse && onCollapse && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onCollapse()
          }}
          className="p-0.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors -mt-0.5"
          aria-label="Collapse dashboard tabs"
        >
          <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
        </button>
      )}
    </div>
  )
}

export function DashboardTabStack({
  equipId,
  equipmentName,
  cards,
  isExpanded,
  autoExpand = false,
  onExpand,
  onCollapse,
  onCardClick,
}: DashboardTabStackProps) {
  const [isHovered, setIsHovered] = useState(false)

  if (cards.length === 0) return null

  const thumbnailSrc = getEquipmentDashboardThumbnail(equipId)

  // Single card or auto-expand: show without stacking
  const shouldExpand = isExpanded || autoExpand || cards.length === 1

  if (shouldExpand) {
    const showCollapse = Boolean(isExpanded && cards.length > 1 && onCollapse)
    return (
      <div className="flex gap-3 flex-shrink-0 relative pl-0 py-1">
        <EquipmentStackLabel
          equipmentName={equipmentName}
          tabCount={cards.length}
          showCollapse={showCollapse}
          onCollapse={onCollapse}
        />
        {cards.map((card, idx) => (
          <div key={card.id} className="cursor-pointer flex-shrink-0" onClick={() => onCardClick(card)}>
            <DashboardCard card={card} cardIndex={idx} thumbnailSrc={thumbnailSrc} showEquipmentName={false} />
          </div>
        ))}
      </div>
    )
  }

  // Collapsed: fan of real tab cards (back = next tabs), not empty rectangles
  const stackDepth = Math.min(cards.length - 1, 2)
  const fanSpread = isHovered ? 1.25 : 1
  const containerW = 192 + stackDepth * 18 * fanSpread

  return (
    <div
      className="relative flex-shrink-0 cursor-pointer group pt-1 pb-2"
      style={{
        width: containerW,
        marginRight: Math.max(12, stackDepth * 10 + 8),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onExpand}
    >
      <EquipmentStackLabel
        equipmentName={equipmentName}
        tabCount={cards.length}
        showCollapse={false}
      />

      {/* Fan back layers — next tab(s), rotated around bottom edge like a hand of cards */}
      <div
        className="relative mx-auto overflow-visible"
        style={{ width: 192, minHeight: 188 }}
      >
        {cards.slice(1, 3).map((card, i) => {
          const depth = i + 1
          const angle = -7 * depth * fanSpread
          const tx = depth * 5 * fanSpread
          const ty = -depth * 2.5
          const scale = 1 - depth * 0.04
          return (
            <div
              key={card.id}
              className="absolute left-0 top-0 w-48 pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
              style={{
                transformOrigin: "50% 100%",
                transform: `translate(${tx}px, ${ty}px) rotate(${angle}deg) scale(${scale})`,
                zIndex: depth,
                opacity: 0.88 - depth * 0.06,
                filter: depth > 1 ? "brightness(0.97)" : undefined,
              }}
            >
              <DashboardCard card={card} cardIndex={depth} thumbnailSrc={thumbnailSrc} showEquipmentName={false} />
            </div>
          )
        })}

        <div
          className="absolute left-0 top-0 w-48 z-10 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-1 group-hover:shadow-lg"
          style={{ transformOrigin: "50% 100%" }}
        >
          <DashboardCard card={cards[0]} cardIndex={0} thumbnailSrc={thumbnailSrc} showEquipmentName={false} />
        </div>
      </div>

      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[10px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full z-20 whitespace-nowrap backdrop-blur-sm pointer-events-none">
        Click to expand all tabs
      </div>
    </div>
  )
}
