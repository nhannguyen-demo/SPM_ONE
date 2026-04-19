"use client"

import { useAppStore } from "@/lib/store"
import { sites, plantDocuments, dashboardCards } from "@/lib/data"
import { Maximize2, Minimize2, Plus, Filter, Search, ExternalLink } from "lucide-react"
import { DashboardCard } from "@/components/dashboard-card"
import { MiniPieChart, MiniBarChart } from "@/components/mini-charts"
import { cn } from "@/lib/utils"
// FEATURE 3 — AI Health Summary Card
import { AIHealthSummaryCard } from "@/components/ai/feature3-health-summary"
// FEATURE 5 — P&ID Anomaly Overlay
import { PIDAnomalyOverlay } from "@/components/ai/feature5-pid-anomaly"
import { useState } from "react"
import { DashboardTabStack } from "@/components/ui/dashboard-tab-stack"

export function PlantOverview() {
  const { currentPath, setCurrentPath, setCurrentView, toggleEquipmentExpanded, dashboardExpanded, setDashboardExpanded, expandedEquipment } = useAppStore()
  const [selectedFilter, setSelectedFilter] = useState("All")
  const [expandedEquipStack, setExpandedEquipStack] = useState<string | null>(null)

  const handleDashboardClick = (card: any) => {
    // Map "Equipment: a" -> "equipment-a" safely
    const equipId = card.equipId || card.equipment.toLowerCase().replace(": ", "-").replace(" ", "-")
    setCurrentPath({
      ...currentPath,
      equipment: equipId,
      tab: card.tag
    })
    setCurrentView("equipment")
    if (!expandedEquipment.includes(equipId)) {
      toggleEquipmentExpanded(equipId)
    }
  }
  
  const site = sites.find((s) => s.id === currentPath.site)
  const plant = site?.plants.find((p) => p.id === currentPath.plant)
  
  if (!site || !plant) return null

  const handleEquipmentClick = (equipmentId: string) => {
    setCurrentPath({ 
      site: currentPath.site, 
      plant: currentPath.plant, 
      equipment: equipmentId,
      tab: "#process"
    })
    setCurrentView("equipment")
    toggleEquipmentExpanded(equipmentId)
  }

  // grouping cards
  const plantCards = dashboardCards.filter(c => plant.equipment.some(eq => eq.id === c.equipId))
  const filteredCards = selectedFilter === "All" ? plantCards : plantCards.filter(c => c.equipment === selectedFilter)
  
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
              {plant.name} Overview Dashboard
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
          
          <div className="flex flex-1 min-h-[288px]">
            {/* Left stats panel */}
            <div className="w-1/3 p-4 border-r border-border">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col items-center">
                  <MiniPieChart value={65} />
                  <span className="text-xs text-muted-foreground mt-1">0.001%</span>
                </div>
                <div className="flex flex-col items-center">
                  <MiniPieChart value={80} />
                  <span className="text-xs text-muted-foreground mt-1">0.001%</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center">
                  <MiniPieChart value={45} />
                  <span className="text-xs text-muted-foreground mt-1">0.001%</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="flex items-end gap-1">
                    <div className="w-3 h-8 bg-primary rounded-t" />
                    <div className="w-3 h-6 bg-primary/70 rounded-t" />
                    <div className="w-3 h-10 bg-primary rounded-t" />
                  </div>
                  <span className="text-lg font-bold text-foreground mt-1">90%</span>
                </div>
              </div>
              <div className="mt-4">
                <MiniBarChart />
              </div>
            </div>

            {/* Right P&ID diagram — place your image at public/images/pid-diagram.jpg */}
            <div className="flex-1 relative bg-slate-50 overflow-hidden">
              <img
                src="/images/pid-diagram.jpg"
                alt="P&ID Process Flow Diagram"
                className="absolute inset-0 w-full h-full object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none"
                }}
              />
              {/* Fallback placeholder shown until image is provided */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-xs text-muted-foreground/40 select-none">P&amp;ID Diagram</span>
              </div>
              {/* On indicator overlay */}
              <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs font-medium text-foreground bg-white/80 px-1.5 py-0.5 rounded">On</span>
              </div>
              {/* FEATURE 5 — P&ID Anomaly Overlay: pulsing rings over component positions */}
              <PIDAnomalyOverlay />
            </div>
          </div>
        </div>

        {/* Dashboards Section */}
        {!dashboardExpanded && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Dashboards of {plant.name}</h2>
              <div className="flex items-center gap-2">
                <select 
                  className="h-9 px-3 bg-secondary border border-border rounded-lg text-sm"
                  value={selectedFilter}
                  onChange={(e) => {
                    setSelectedFilter(e.target.value)
                    setExpandedEquipStack(null)
                  }}
                >
                  <option value="All">All Equipments</option>
                  {plant.equipment.map(eq => (
                    <option key={eq.id} value={eq.name}>{eq.name}</option>
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
                    onCardClick={handleDashboardClick}
                  />
                ))
              ) : (
                filteredCards.map((card, idx) => (
                  <div key={card.id} onClick={() => handleDashboardClick(card)} className="cursor-pointer flex-shrink-0">
                    <DashboardCard card={card} cardIndex={idx} />
                  </div>
                ))
              )}
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
              <h2 className="text-lg font-semibold text-foreground">Dashboards of {plant.name}</h2>
              <div className="flex items-center gap-2">
                <select 
                  className="h-9 px-3 bg-secondary border border-border rounded-lg text-sm"
                  value={selectedFilter}
                  onChange={(e) => {
                    setSelectedFilter(e.target.value)
                    setExpandedEquipStack(null)
                  }}
                >
                  <option value="All">All Equipments</option>
                  {plant.equipment.map(eq => (
                    <option key={eq.id} value={eq.name}>{eq.name}</option>
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

            <div className="flex gap-4 overflow-x-auto pb-6 pt-2">
              {selectedFilter === "All" ? (
                Object.entries(groupedCards).map(([equipId, group]) => (
                  <DashboardTabStack
                    key={equipId}
                    equipId={equipId}
                    equipmentName={group.equipmentName}
                    cards={group.cards}
                    isExpanded={expandedEquipStack === equipId}
                    onExpand={() => setExpandedEquipStack(equipId)}
                    onCardClick={handleDashboardClick}
                  />
                ))
              ) : (
                filteredCards.map((card, idx) => (
                  <div key={card.id} onClick={() => handleDashboardClick(card)} className="cursor-pointer flex-shrink-0">
                    <DashboardCard card={card} cardIndex={idx} />
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Plant Information */}
      <div className={cn(
        "w-72 flex-shrink-0 bg-card border-l border-border p-4 overflow-y-auto transition-all duration-300",
        dashboardExpanded ? "hidden" : ""
      )}>
        {/* FEATURE 3 — AI Health Summary Card: inserted above Plant Information header */}
        <AIHealthSummaryCard level="plant" />
        <h3 className="font-semibold text-foreground mb-4">Plant Information</h3>
        <div className="space-y-2 mb-4">
          {[75, 60, 85, 45, 70].map((width, i) => (
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
          <h4 className="font-medium text-foreground">Plant Document</h4>
          <button className="p-1.5 hover:bg-secondary rounded transition-colors">
            <Search className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-2">
          {plantDocuments.map((doc, i) => (
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
