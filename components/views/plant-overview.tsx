"use client"

import { useAppStore } from "@/lib/store"
import { sites, plantDocuments, dashboardCards } from "@/lib/data"
import { Maximize2, Plus, Filter, Search, ExternalLink } from "lucide-react"
import { DashboardCard } from "@/components/dashboard-card"
import { MiniPieChart, MiniBarChart } from "@/components/mini-charts"
// FEATURE 3 — AI Health Summary Card
import { AIHealthSummaryCard } from "@/components/ai/feature3-health-summary"
// FEATURE 5 — P&ID Anomaly Overlay
import { PIDAnomalyOverlay } from "@/components/ai/feature5-pid-anomaly"

export function PlantOverview() {
  const { currentPath, setCurrentPath, setCurrentView, toggleEquipmentExpanded } = useAppStore()
  
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

  return (
    <div className="flex-1 flex min-w-0 overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 min-w-0 p-6 overflow-y-auto">
        {/* Main Dashboard Card */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden mb-6">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
              {plant.name} Overview Dashboard
            </span>
            <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
              <Maximize2 className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          
          <div className="flex h-72">
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
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Dashboards of {plant.name}</h2>
            <div className="flex items-center gap-2">
              <select className="h-9 px-3 bg-secondary border border-border rounded-lg text-sm">
                <option>Equipment a</option>
                <option>Equipment b</option>
                <option>Equipment c</option>
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

          <div className="flex gap-4 overflow-x-auto pb-2">
            {dashboardCards.slice(0, 2).map((card, idx) => (
              <div key={card.id} onClick={() => handleEquipmentClick("equipment-a")} className="cursor-pointer">
                {/* FEATURE 4: pass cardIndex for AI insight strip selection */}
                <DashboardCard card={card} cardIndex={idx} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Plant Information */}
      <div className="w-72 flex-shrink-0 bg-card border-l border-border p-4 overflow-y-auto">
        {/* FEATURE 3 — AI Health Summary Card: inserted above Plant Information header */}
        <AIHealthSummaryCard level="plant" />
        <h3 className="font-semibold text-foreground mb-4">Plant Information</h3>
        <div className="space-y-2 mb-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-3 bg-muted rounded" style={{ width: `${50 + Math.random() * 40}%` }} />
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
