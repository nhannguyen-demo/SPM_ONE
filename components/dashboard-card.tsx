"use client"

import { MiniLineChart, MiniPieChart } from "@/components/mini-charts"
import { X } from "lucide-react"
// FEATURE 4 — AI Insight Strips on Dashboard Thumbnail Cards
import { AIInsightStrip } from "@/components/ai/feature4-insight-strips"

interface DashboardCardProps {
  card: {
    id: string
    equipment: string
    tag: string
    metrics: { value1: string; value2: string } | null
  }
  // FEATURE 4: cardIndex determines which hardcoded insight to show (0–3)
  cardIndex?: number
}

export function DashboardCard({ card, cardIndex = 0 }: DashboardCardProps) {
  return (
    <div className="flex-shrink-0 w-48 bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-3 h-24 flex items-center justify-center gap-3">
        {card.metrics ? (
          <>
            <div className="text-center">
              <MiniLineChart />
              <span className="text-xs text-muted-foreground">{card.metrics.value2}</span>
            </div>
            <div className="text-center">
              <MiniPieChart value={parseInt(card.metrics.value1)} />
              <span className="text-lg font-bold text-foreground">{card.metrics.value1}</span>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/50 rounded">
            <X className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="px-3 py-2 border-t border-border bg-secondary/30">
        <div className="font-medium text-sm text-foreground truncate">{card.equipment}</div>
        <span className="inline-block px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full mt-1">
          {card.tag}
        </span>
      </div>
      {/* FEATURE 4 — AI Insight Strip: sits flush at bottom of card */}
      <AIInsightStrip cardIndex={cardIndex} />
    </div>
  )
}

