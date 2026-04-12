"use client"

import { useAppStore } from "@/lib/store"
import { sites, plantDocuments, dashboardCards } from "@/lib/data"
import { Maximize2, Plus, Filter, Search, ExternalLink } from "lucide-react"
import { DashboardCard } from "@/components/dashboard-card"
import { MiniPieChart, MiniBarChart } from "@/components/mini-charts"

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
    <div className="flex-1 flex">
      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
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

            {/* Right P&ID diagram */}
            <div className="flex-1 p-4 relative bg-gradient-to-br from-slate-50 to-slate-100">
              {/* P&ID Process Flow Diagram */}
              <div className="absolute inset-4">
                {/* On indicator */}
                <div className="absolute top-2 left-2 flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500" />
                  <span className="text-xs font-medium text-foreground">On</span>
                </div>

                {/* Equipment shapes */}
                <svg viewBox="0 0 400 200" className="w-full h-full">
                  {/* Purple vessel */}
                  <rect x="40" y="40" width="40" height="60" rx="4" fill="#8B5CF6" />
                  
                  {/* Blue columns */}
                  <rect x="120" y="20" width="25" height="120" rx="3" fill="#3B82F6" />
                  <rect x="160" y="30" width="25" height="100" rx="3" fill="#3B82F6" />
                  
                  {/* Cyan tall cylinders */}
                  <rect x="220" y="10" width="20" height="140" rx="10" fill="#06B6D4" />
                  <rect x="250" y="20" width="20" height="130" rx="10" fill="#06B6D4" />
                  <rect x="280" y="15" width="20" height="135" rx="10" fill="#06B6D4" />

                  {/* Red X flanges */}
                  <circle cx="100" cy="70" r="10" fill="none" stroke="#EF4444" strokeWidth="2" />
                  <line x1="94" y1="64" x2="106" y2="76" stroke="#EF4444" strokeWidth="2" />
                  <line x1="106" y1="64" x2="94" y2="76" stroke="#EF4444" strokeWidth="2" />

                  {/* Red butterfly valve */}
                  <circle cx="180" cy="160" r="12" fill="none" stroke="#EF4444" strokeWidth="2" />
                  <line x1="168" y1="160" x2="192" y2="160" stroke="#EF4444" strokeWidth="2" />

                  {/* Green valve */}
                  <circle cx="220" cy="170" r="10" fill="#22C55E" />

                  {/* Gray heat exchanger */}
                  <rect x="320" y="80" width="50" height="70" rx="4" fill="#9CA3AF" />
                  <line x1="330" y1="90" x2="360" y2="90" stroke="#fff" strokeWidth="2" />
                  <line x1="330" y1="100" x2="360" y2="100" stroke="#fff" strokeWidth="2" />
                  <line x1="330" y1="110" x2="360" y2="110" stroke="#fff" strokeWidth="2" />

                  {/* Piping */}
                  <path d="M80 70 H100" stroke="#64748B" strokeWidth="2" fill="none" />
                  <path d="M145 70 H160" stroke="#64748B" strokeWidth="2" fill="none" />
                  <path d="M185 70 H220" stroke="#64748B" strokeWidth="2" fill="none" />
                  <path d="M300 70 H320" stroke="#64748B" strokeWidth="2" fill="none" />

                  {/* Output label */}
                  <text x="350" y="170" fontSize="10" fill="#64748B">Output 1</text>
                </svg>

                {/* Radiation symbol */}
                <div className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center">
                  <span className="text-black text-xs">☢</span>
                </div>
              </div>
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
            {dashboardCards.slice(0, 2).map((card) => (
              <div key={card.id} onClick={() => handleEquipmentClick("equipment-a")} className="cursor-pointer">
                <DashboardCard card={card} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Plant Information */}
      <div className="w-72 bg-card border-l border-border p-4 overflow-y-auto">
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
