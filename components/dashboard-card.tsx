"use client"

import { useState } from "react"
import Image from "next/image"
import { MiniLineChart, MiniPieChart } from "@/components/mini-charts"
import { X } from "lucide-react"
// FEATURE 4 — AI Insight Strips on Dashboard Thumbnail Cards
import { AIInsightStrip } from "@/components/ai/feature4-insight-strips"

interface DashboardCardProps {
  card: {
    id: string
    equipment: string
    equipId?: string
    tag: string
    metrics: { value1: string; value2: string } | null
  }
  /** When set (e.g. from getEquipmentDashboardThumbnail), replaces chart preview in the top area. */
  thumbnailSrc?: string
  // FEATURE 4: cardIndex determines which hardcoded insight to show (0–3)
  cardIndex?: number
  showEquipmentName?: boolean
}

export function DashboardCard({
  card,
  thumbnailSrc,
  cardIndex = 0,
  showEquipmentName = true,
}: DashboardCardProps) {
  const [thumbFailed, setThumbFailed] = useState(false)
  const showThumbnail = Boolean(thumbnailSrc) && !thumbFailed

  return (
    <div className="flex-shrink-0 w-48 bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative h-24 w-full bg-muted/40">
        {showThumbnail ? (
          <Image
            src={thumbnailSrc!}
            alt={`${card.equipment} preview`}
            fill
            sizes="192px"
            className="object-cover"
            onError={() => setThumbFailed(true)}
            priority={false}
          />
        ) : card.metrics ? (
          <div className="absolute inset-0 p-3 flex items-center justify-center gap-3">
            <div className="text-center">
              <MiniLineChart />
              <span className="text-xs text-muted-foreground">{card.metrics.value2}</span>
            </div>
            <div className="text-center">
              <MiniPieChart value={parseInt(card.metrics.value1)} />
              <span className="text-lg font-bold text-foreground">{card.metrics.value1}</span>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <X className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="px-3 py-2 border-t border-border bg-secondary/30">
        <div className="font-semibold text-sm text-foreground truncate">{card.tag}</div>
        {showEquipmentName && (
          <span className="inline-block px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full mt-1">
            {card.equipment}
          </span>
        )}
      </div>
      {/* FEATURE 4 — AI Insight Strip: sits flush at bottom of card */}
      <AIInsightStrip cardIndex={cardIndex} />
    </div>
  )
}

