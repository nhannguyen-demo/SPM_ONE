"use client"

import { useAppStore } from "@/lib/store"
import { useWorkspaceStore } from "@/lib/workspace/store"
import { useShallow } from "zustand/react/shallow"
import { getPublishedDashboardsForEquipment, type EquipmentHomeDashCard } from "@/lib/workspace-data"
import { sites, siteDocuments, getEquipmentDashboardThumbnail, getUnitIdForEquipment } from "@/lib/data"
import { Maximize2, Minimize2, Plus, Filter, Search, ExternalLink, ChevronRight, ArrowUpRight } from "lucide-react"
import { DashboardCard } from "@/components/dashboard-card"
import { MiniLineChart, MiniPieChart, MiniBarChart } from "@/components/mini-charts"
import { cn } from "@/lib/utils"
// FEATURE 3 — AI Health Summary Card
import { AIHealthSummaryCard } from "@/components/ai/feature3-health-summary"
// FEATURE 6C — AI Map Badges (activated via FEATURE 1 AI Insight button)
import { AIMapBadges } from "@/components/ai/feature6-ai-insight-overlay"
import { useState, useMemo } from "react"
import { DashboardTabStack } from "@/components/ui/dashboard-tab-stack"

export function SiteOverview() {
  const { currentPath, setCurrentPath, setCurrentView, togglePlantExpanded, dashboardExpanded, setDashboardExpanded, addRecentDashboard, setEquipmentHomeAutoOpenTab, toggleEquipmentExpanded, expandedEquipment } = useAppStore()
  const rawDashboards = useWorkspaceStore(useShallow((s) => s.dashboards))
  const [selectedFilter, setSelectedFilter] = useState("All")
  const [expandedEquipStack, setExpandedEquipStack] = useState<string | null>(null)
  
  const site = sites.find((s) => s.id === currentPath.site)
  if (!site) return null

  const handlePlantClick = (plantId: string) => {
    setCurrentPath({ site: currentPath.site, plant: plantId })
    setCurrentView("plant")
    togglePlantExpanded(plantId)
  }

  const defaultUnitId = site.units[0]?.id
  const handleDashboardClick = (card: EquipmentHomeDashCard) => {
    const plantId =
      getUnitIdForEquipment(card.equipId) ?? currentPath.plant ?? defaultUnitId
    addRecentDashboard(card.id)
    setCurrentPath({ ...currentPath, plant: plantId, equipment: card.equipId, tab: card.tag })
    setEquipmentHomeAutoOpenTab(card.id)
    setCurrentView("equipment-home")
    if (!expandedEquipment.includes(card.equipId)) toggleEquipmentExpanded(card.equipId)
  }

  const handleEquipmentNameClick = (equipId: string, card: EquipmentHomeDashCard) => {
    const plantId = getUnitIdForEquipment(equipId) ?? currentPath.plant ?? defaultUnitId
    setCurrentPath({ ...currentPath, plant: plantId, equipment: equipId, tab: card.tag })
    setCurrentView("equipment-home")
    if (!expandedEquipment.includes(equipId)) toggleEquipmentExpanded(equipId)
  }

  // grouping cards — derived from published WorkspaceDashboard records
  const siteCards = useMemo(() => {
    const result: EquipmentHomeDashCard[] = []
    for (const unit of site.units) {
      for (const eq of unit.equipment) {
        result.push(...getPublishedDashboardsForEquipment(eq.id, rawDashboards))
      }
    }
    return result
  }, [site, rawDashboards])
  const filteredCards = selectedFilter === "All" 
    ? siteCards 
    : siteCards.filter(c => site.units.find(p => p.name === selectedFilter)?.equipment.some(eq => eq.id === c.equipId))
  
  const groupedCards = filteredCards.reduce((acc, card) => {
    if (!acc[card.equipId]) acc[card.equipId] = { equipmentName: card.equipment, cards: [] }
    acc[card.equipId].cards.push(card)
    return acc
  }, {} as Record<string, { equipmentName: string, cards: any[] }>)

  return (
    <div className="flex-1 flex min-w-0 overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 min-w-0 p-6 overflow-y-auto flex flex-col relative">
        {/* Main Dashboard Card */}
        <div className={cn(
          "bg-card rounded-xl border border-border shadow-sm overflow-hidden flex-1 flex flex-col",
          dashboardExpanded ? "mb-0" : "mb-6"
        )}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
              {site.name} Overview Dashboard
            </span>
            <button
              onClick={() => setDashboardExpanded(!dashboardExpanded)}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              {dashboardExpanded
                ? <Minimize2 className="w-4 h-4 text-muted-foreground" />
                : <Maximize2 className="w-4 h-4 text-muted-foreground" />
              }
            </button>
          </div>
          
          {/* Map with overlay stats */}
          <div className="relative flex-1 min-h-[320px] bg-stone-100 overflow-hidden">
            {/* Site aerial image — place your image at public/images/site-map.jpg */}
            <img
              src="/images/site-map.jpg"
              alt="Site aerial view"
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none"
              }}
            />
            {/* Fallback tinted background shown until image is provided */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-200/60 via-amber-100/40 to-stone-200/60" />

            {/* Process unit markers (Site 2000) */}
            <button
              type="button"
              onClick={() => handlePlantClick("unit-2006-dcu")}
              className="absolute top-8 left-8 w-[45%] h-[42%] border-2 border-dashed border-red-500 rounded-lg flex items-center justify-center hover:bg-red-500/10 transition-colors cursor-pointer z-10"
            >
              <span className="px-3 py-1 bg-white/90 rounded text-sm font-medium text-foreground shadow text-center max-w-[95%]">
                Unit 2006 - DCU
              </span>
            </button>
            <button
              type="button"
              onClick={() => handlePlantClick("unit-2007-hcu")}
              className="absolute top-8 right-8 w-[45%] h-[42%] border-2 border-dashed border-red-500 rounded-lg flex items-center justify-center hover:bg-red-500/10 transition-colors cursor-pointer z-10"
            >
              <span className="px-3 py-1 bg-white/90 rounded text-sm font-medium text-foreground shadow text-center max-w-[95%]">
                Unit 2007 - HCU
              </span>
            </button>
            <button
              type="button"
              onClick={() => handlePlantClick("unit-2008-h2")}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[70%] h-[30%] border-2 border-dashed border-red-500 rounded-lg flex items-center justify-center hover:bg-red-500/10 transition-colors cursor-pointer z-10"
            >
              <span className="px-3 py-1 bg-white/90 rounded text-sm font-medium text-foreground shadow text-center max-w-[95%]">
                Unit 2008 - Hydrogen Unit
              </span>
            </button>
            {/* FEATURE 6C — AI Map Badges: positioned over plant bounding boxes (appears when AI Insight is active) */}
            <AIMapBadges />

            {/* Stats overlay - left side */}
            <div className="absolute top-12 left-12 bg-white/95 backdrop-blur rounded-lg p-4 shadow-lg z-10">
              <div className="space-y-3">
                <MiniLineChart />
                <div className="flex gap-3">
                  <MiniPieChart />
                  <div className="text-center">
                    <MiniBarChart />
                    <span className="text-xs text-muted-foreground">0.001%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats overlay - bottom right */}
            <div className="absolute bottom-12 right-12 bg-white/95 backdrop-blur rounded-lg p-4 shadow-lg z-10">
              <div className="text-3xl font-bold text-foreground">90%</div>
              <div className="flex gap-1 my-2">
                <div className="w-2 h-2 rounded-full bg-muted" />
                <div className="w-2 h-2 rounded-full bg-muted" />
                <div className="w-2 h-2 rounded-full bg-muted" />
              </div>
              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-4/5 bg-foreground rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Dashboards Section */}
        {!dashboardExpanded && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Dashboards of {site.name}</h2>
              <div className="flex items-center gap-2">
                <select 
                  className="h-9 px-3 bg-secondary border border-border rounded-lg text-sm"
                  value={selectedFilter}
                  onChange={(e) => {
                    setSelectedFilter(e.target.value)
                    setExpandedEquipStack(null)
                  }}
                >
                  <option value="All">All units</option>
                  {site.units.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
                <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                  <Plus className="w-4 h-4 text-muted-foreground" />
                </button>
                <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                </button>
                <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                  <Search className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-10 pt-6">
              {selectedFilter === "All" ? (
                Object.entries(groupedCards).map(([equipId, group]) => (
                  <DashboardTabStack
                    key={equipId}
                    equipId={equipId}
                    equipmentName={group.equipmentName}
                    cards={group.cards}
                    isExpanded={expandedEquipStack === equipId}
                    autoExpand={Object.keys(groupedCards).length === 1}
                    onExpand={() => setExpandedEquipStack(equipId)}
                    onCollapse={() => setExpandedEquipStack(null)}
                    onCardClick={handleDashboardClick}
                    onEquipmentNameClick={(id) => handleEquipmentNameClick(id, group.cards[0])}
                  />
                ))
              ) : (
                filteredCards.map((card, idx) => (
                  <div key={card.id} onClick={() => handleDashboardClick(card)} className="cursor-pointer flex-shrink-0">
                    <DashboardCard
                      card={card}
                      cardIndex={idx}
                      thumbnailSrc={getEquipmentDashboardThumbnail(card.equipId)}
                      showEquipmentName={false}
                    />
                  </div>
                ))
              )}
              <button className="flex-shrink-0 w-48 h-36 border-2 border-dashed border-border rounded-xl flex items-center justify-center hover:border-primary/50 hover:bg-primary/5 transition-colors mt-5">
                <ChevronRight className="w-6 h-6 text-muted-foreground" />
              </button>
            </div>
          </div>
        )}

        {/* Slide-up bottom panel — shown when expanded */}
        {dashboardExpanded && (
          <div className="absolute left-6 right-6 bottom-0 translate-y-[calc(100%-12px)] hover:translate-y-0 transition-transform duration-300 z-50 bg-background border border-border shadow-[0_-10px_40px_rgba(0,0,0,0.1)] rounded-t-xl px-6 py-4 flex flex-col">
            {/* Hover trigger handle */}
            <div className="absolute -top-3 left-0 right-0 h-4 cursor-pointer flex items-center justify-center">
              <div className="w-16 h-1.5 rounded-full bg-border/80" />
            </div>

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Dashboards of {site.name}</h2>
              <div className="flex items-center gap-2">
                <select 
                  className="h-9 px-3 bg-secondary border border-border rounded-lg text-sm"
                  value={selectedFilter}
                  onChange={(e) => {
                    setSelectedFilter(e.target.value)
                    setExpandedEquipStack(null)
                  }}
                >
                  <option value="All">All units</option>
                  {site.units.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
                <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                  <Plus className="w-4 h-4 text-muted-foreground" />
                </button>
                <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                </button>
                <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                  <Search className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-6 pt-6">
              {Object.entries(groupedCards).map(([equipId, group]) => (
                <DashboardTabStack
                  key={equipId}
                  equipId={equipId}
                  equipmentName={group.equipmentName}
                  cards={group.cards}
                  isExpanded={expandedEquipStack === equipId}
                  onExpand={() => setExpandedEquipStack(equipId)}
                  onCollapse={() => setExpandedEquipStack(null)}
                  onCardClick={handleDashboardClick}
                  onEquipmentNameClick={(id) => handleEquipmentNameClick(id, group.cards[0])}
                />
              ))}
              <button className="flex-shrink-0 w-48 h-36 border-2 border-dashed border-border rounded-xl flex items-center justify-center hover:border-primary/50 hover:bg-primary/5 transition-colors">
                <ChevronRight className="w-6 h-6 text-muted-foreground" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Site Information (hidden when expanded) */}
      <div className={`w-72 flex-shrink-0 bg-card border-l border-border p-4 overflow-y-auto transition-all duration-300 ${dashboardExpanded ? "hidden" : ""}`}>
        {/* FEATURE 3 — AI Health Summary Card: inserted above Site Information header */}
        <AIHealthSummaryCard level="site" />
        <h3 className="font-semibold text-foreground mb-4">Site Information</h3>
        <div className="space-y-2 mb-4">
          {[75, 60, 85, 45].map((width, i) => (
            <div key={i} className="h-3 bg-muted rounded" style={{ width: `${width}%` }} />
          ))}
        </div>
        <hr className="border-border my-4" />
        
        {/* Tabular placeholder */}
        <div className="space-y-2 mb-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
              <div className="flex-1 flex gap-2">
                <div className="h-3 bg-muted rounded flex-1" />
                <div className="h-3 bg-muted rounded flex-1" />
                <div className="h-3 bg-muted rounded flex-1" />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-foreground">Site Document</h4>
          <button className="p-1.5 hover:bg-secondary rounded transition-colors">
            <Search className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-2">
          {siteDocuments.map((doc, i) => (
            <button
              key={i}
              className="w-full flex items-center justify-between px-3 py-2 bg-secondary/50 hover:bg-secondary rounded-lg text-sm text-foreground transition-colors"
            >
              <span className="truncate">{doc.name}</span>
              <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-2" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
