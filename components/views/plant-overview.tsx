"use client"

import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { useWorkspaceStore } from "@/lib/workspace/store"
import { useShallow } from "zustand/react/shallow"
import { getPublishedDashboardsForEquipment, type EquipmentHomeDashCard } from "@/lib/workspace-data"
import { sites, getEquipmentDashboardThumbnail } from "@/lib/data"
import { Maximize2, Minimize2, Plus, Filter, Search } from "lucide-react"
import { DashboardCard } from "@/components/dashboard-card"
import { cn } from "@/lib/utils"
import { PIDAnomalyOverlay } from "@/components/ai/feature5-pid-anomaly"
import { useState, useMemo } from "react"
import { DashboardTabStack } from "@/components/ui/dashboard-tab-stack"
import { mainRoutes } from "@/lib/main-routes"
import { UnitContextPanel } from "@/components/asset/unit-context-panel"

export function PlantOverview() {
  const router = useRouter()
  const {
    currentPath,
    setCurrentPath,
    setCurrentView,
    toggleEquipmentExpanded,
    dashboardExpanded,
    setDashboardExpanded,
    expandedEquipment,
    addRecentDashboard,
  } = useAppStore()
  const rawDashboards = useWorkspaceStore(useShallow((s) => s.dashboards))
  const [selectedFilter, setSelectedFilter] = useState("All")
  const [expandedEquipStack, setExpandedEquipStack] = useState<string | null>(null)
  const [contextPanelOpen, setContextPanelOpen] = useState(true)

  const handleDashboardClick = (card: EquipmentHomeDashCard) => {
    if (!currentPath.site || !currentPath.plant) return
    addRecentDashboard(card.id)
    setCurrentPath({ ...currentPath, equipment: card.equipId, tab: card.tag })
    router.push(
      mainRoutes.equipmentHome(currentPath.site, currentPath.plant, card.equipId, {
        tab: card.tag,
        openDashboard: card.id,
      }),
    )
    setCurrentView("equipment-home")
    if (!expandedEquipment.includes(card.equipId)) toggleEquipmentExpanded(card.equipId)
  }

  const handleEquipmentNameClick = (equipId: string) => {
    if (!currentPath.site || !currentPath.plant) return
    setCurrentPath({ ...currentPath, equipment: equipId })
    router.push(mainRoutes.equipment(currentPath.site, currentPath.plant, equipId))
    setCurrentView("equipment-home")
    if (!expandedEquipment.includes(equipId)) toggleEquipmentExpanded(equipId)
  }

  const site = sites.find((s) => s.id === currentPath.site)
  const unit = site?.units.find((p) => p.id === currentPath.plant)

  const plantCards = useMemo(() => {
    if (!unit) return []
    const result: EquipmentHomeDashCard[] = []
    for (const eq of unit.equipment) {
      result.push(...getPublishedDashboardsForEquipment(eq.id, rawDashboards))
    }
    return result
  }, [unit, rawDashboards])

  if (!site || !unit) return null

  const filteredCards =
    selectedFilter === "All" ? plantCards : plantCards.filter((c) => c.equipment === selectedFilter)

  const groupedCards = filteredCards.reduce(
    (acc, card) => {
      if (!acc[card.equipId]) acc[card.equipId] = { equipmentName: card.equipment, cards: [] }
      acc[card.equipId].cards.push(card)
      return acc
    },
    {} as Record<string, { equipmentName: string; cards: EquipmentHomeDashCard[] }>
  )

  const showContextPanel = !dashboardExpanded

  return (
    <div className="flex-1 flex min-w-0 overflow-hidden">
      <div className="flex-1 min-w-0 p-6 overflow-y-auto flex flex-col relative">
        <div
          className={cn(
            "bg-card rounded-xl border border-border shadow-sm overflow-hidden flex-1 flex flex-col",
            dashboardExpanded ? "mb-0" : "mb-6"
          )}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
              {unit.name} Overview Dashboard
            </span>
            <button
              type="button"
              onClick={() => setDashboardExpanded(!dashboardExpanded)}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
              aria-label={dashboardExpanded ? "Minimize overview dashboard" : "Maximize overview dashboard"}
            >
              {dashboardExpanded ? (
                <Minimize2 className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Maximize2 className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>

          <div className="relative flex-1 min-h-[288px] bg-slate-50 overflow-hidden">
            <img
              src="/images/pid-diagram.jpg"
              alt="P&ID Process Flow Diagram"
              className="absolute inset-0 w-full h-full object-contain"
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).style.display = "none"
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-xs text-muted-foreground/40 select-none">P&amp;ID Diagram</span>
            </div>
            <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-xs font-medium text-foreground bg-white/80 px-1.5 py-0.5 rounded">
                On
              </span>
            </div>
            <PIDAnomalyOverlay />
          </div>
        </div>

        {!dashboardExpanded && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Dashboards of {unit.name}</h2>
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
                  {unit.equipment.map((eq) => (
                    <option key={eq.id} value={eq.name}>
                      {eq.name}
                    </option>
                  ))}
                </select>
                <button type="button" className="p-2 hover:bg-secondary rounded-lg transition-colors">
                  <Plus className="w-4 h-4 text-muted-foreground" />
                </button>
                <button type="button" className="p-2 hover:bg-secondary rounded-lg transition-colors">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                </button>
                <button type="button" className="p-2 hover:bg-secondary rounded-lg transition-colors">
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
                    onEquipmentNameClick={handleEquipmentNameClick}
                  />
                ))
              ) : (
                filteredCards.map((card, idx) => (
                  <div
                    key={card.id}
                    onClick={() => handleDashboardClick(card)}
                    className="cursor-pointer flex-shrink-0"
                  >
                    <DashboardCard
                      card={card}
                      cardIndex={idx}
                      thumbnailSrc={getEquipmentDashboardThumbnail(card.equipId)}
                      showEquipmentName={false}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {dashboardExpanded && (
          <div className="absolute left-6 right-6 bottom-0 translate-y-[calc(100%-12px)] hover:translate-y-0 transition-transform duration-300 z-50 bg-background border border-border shadow-[0_-10px_40px_rgba(0,0,0,0.1)] rounded-t-xl px-6 py-4 flex flex-col">
            <div className="absolute -top-3 left-0 right-0 h-4 cursor-pointer flex items-center justify-center">
              <div className="w-16 h-1.5 rounded-full bg-border/80" />
            </div>

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Dashboards of {unit.name}</h2>
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
                  {unit.equipment.map((eq) => (
                    <option key={eq.id} value={eq.name}>
                      {eq.name}
                    </option>
                  ))}
                </select>
                <button type="button" className="p-2 hover:bg-secondary rounded-lg transition-colors">
                  <Plus className="w-4 h-4 text-muted-foreground" />
                </button>
                <button type="button" className="p-2 hover:bg-secondary rounded-lg transition-colors">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                </button>
                <button type="button" className="p-2 hover:bg-secondary rounded-lg transition-colors">
                  <Search className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-6 pt-6">
              {selectedFilter === "All" ? (
                Object.entries(groupedCards).map(([equipId, group]) => (
                  <DashboardTabStack
                    key={equipId}
                    equipId={equipId}
                    equipmentName={group.equipmentName}
                    cards={group.cards}
                    isExpanded={expandedEquipStack === equipId}
                    onExpand={() => setExpandedEquipStack(equipId)}
                    onCollapse={() => setExpandedEquipStack(null)}
                    onCardClick={handleDashboardClick}
                    onEquipmentNameClick={handleEquipmentNameClick}
                  />
                ))
              ) : (
                filteredCards.map((card, idx) => (
                  <div
                    key={card.id}
                    onClick={() => handleDashboardClick(card)}
                    className="cursor-pointer flex-shrink-0"
                  >
                    <DashboardCard
                      card={card}
                      cardIndex={idx}
                      thumbnailSrc={getEquipmentDashboardThumbnail(card.equipId)}
                      showEquipmentName={false}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {showContextPanel && (
        <UnitContextPanel
          isOpen={contextPanelOpen}
          onToggle={() => setContextPanelOpen((open) => !open)}
          unitName={unit.name}
        />
      )}
    </div>
  )
}
