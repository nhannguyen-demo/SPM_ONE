"use client"

import { useAppStore } from "@/lib/store"
import { sites, siteDocuments, dashboardCards } from "@/lib/data"
import { Maximize2, Minimize2, Plus, Filter, Search, ExternalLink, ChevronRight } from "lucide-react"
import { DashboardCard } from "@/components/dashboard-card"
import { MiniLineChart, MiniPieChart, MiniBarChart } from "@/components/mini-charts"

export function SiteOverview() {
  const { currentPath, setCurrentPath, setCurrentView, togglePlantExpanded, dashboardExpanded, setDashboardExpanded } = useAppStore()
  
  const site = sites.find((s) => s.id === currentPath.site)
  if (!site) return null

  const handlePlantClick = (plantId: string) => {
    setCurrentPath({ site: currentPath.site, plant: plantId })
    setCurrentView("plant")
    togglePlantExpanded(plantId)
  }

  return (
    <div className="flex-1 flex min-w-0 overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 min-w-0 p-6 overflow-y-auto">
        {/* Main Dashboard Card */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden mb-6">
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
          <div className="relative h-80 bg-stone-100 overflow-hidden">
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

            {/* Plant markers */}
            <button
              onClick={() => handlePlantClick("plant-1")}
              className="absolute top-8 left-8 right-1/2 bottom-1/2 border-2 border-dashed border-red-500 rounded-lg flex items-center justify-center hover:bg-red-500/10 transition-colors cursor-pointer z-10"
            >
              <span className="px-3 py-1 bg-white/90 rounded text-sm font-medium text-foreground shadow">
                Plant 1
              </span>
            </button>
            <button
              onClick={() => handlePlantClick("plant-2")}
              className="absolute bottom-8 right-8 left-1/2 top-1/2 border-2 border-dashed border-red-500 rounded-lg flex items-center justify-center hover:bg-red-500/10 transition-colors cursor-pointer z-10"
            >
              <span className="px-3 py-1 bg-white/90 rounded text-sm font-medium text-foreground shadow">
                Plant 2
              </span>
            </button>

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
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Dashboards of {site.name}</h2>
            <div className="flex items-center gap-2">
              <select className="h-9 px-3 bg-secondary border border-border rounded-lg text-sm">
                <option>Plant 1</option>
                <option>Plant 2</option>
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
            {dashboardCards.map((card) => (
              <DashboardCard key={card.id} card={card} />
            ))}
            <button className="flex-shrink-0 w-48 h-36 border-2 border-dashed border-border rounded-xl flex items-center justify-center hover:border-primary/50 hover:bg-primary/5 transition-colors">
              <ChevronRight className="w-6 h-6 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Site Information (hidden when expanded) */}
      <div className={`w-72 flex-shrink-0 bg-card border-l border-border p-4 overflow-y-auto transition-all duration-300 ${dashboardExpanded ? "hidden" : ""}`}>
        <h3 className="font-semibold text-foreground mb-4">Site Information</h3>
        <div className="space-y-2 mb-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-3 bg-muted rounded" style={{ width: `${60 + Math.random() * 30}%` }} />
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
