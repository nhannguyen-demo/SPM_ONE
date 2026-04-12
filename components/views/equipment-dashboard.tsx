"use client"

import { useAppStore } from "@/lib/store"
import { sites, plantDocuments, equipmentKPIs, monitoringItems, dashboardCards } from "@/lib/data"
import {
  Maximize2,
  Minimize2,
  Search,
  ExternalLink,
  GripVertical,
  MoreVertical,
  Plus,
  X
} from "lucide-react"
import { DashboardCard } from "@/components/dashboard-card"
import { TrendLineChart, BarChartVertical, GaugeChart } from "@/components/mini-charts"
import { ModuleLibrary } from "@/components/module-library"
import { Equipment3DViewer } from "@/components/equipment-3d"
import { cn } from "@/lib/utils"
// FEATURE 6A — KPI Pill AI Badge Wrappers
// FEATURE 6B — Chart Anomaly Markers
import { AIKPIBadgeWrapper, AILineChartMarkers, AIBarChartThreshold } from "@/components/ai/feature6-ai-insight-overlay"

export function EquipmentDashboard() {
  const {
    currentPath,
    setCurrentPath,
    viewMode,
    setViewMode,
    setWhatIfModalOpen,
    dashboardExpanded,
    setDashboardExpanded,
  } = useAppStore()

  const site = sites.find((s) => s.id === currentPath.site)
  const plant = site?.plants.find((p) => p.id === currentPath.plant)
  const equipment = plant?.equipment.find((e) => e.id === currentPath.equipment)

  if (!site || !plant || !equipment) return null

  const activeTab = currentPath.tab || "#process"
  const isEditMode = viewMode === "edit" || viewMode === "modules"
  const showModules = viewMode === "modules"

  const handleTabChange = (tab: string) => {
    setCurrentPath({ ...currentPath, tab })
  }

  return (
    <div className="flex-1 flex min-w-0 overflow-hidden">
      {/* Main Content */}
      <div className={cn("flex-1 min-w-0 p-6 overflow-y-auto", showModules && "pr-0")}>
        {/* Header with controls */}
        <div className="flex items-center justify-between mb-4">
          <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
            {equipment.name} {activeTab} Dashboard
          </span>
          <div className="flex items-center gap-2">
            {isEditMode ? (
              <>
                <button
                  onClick={() => setViewMode("modules")}
                  className="px-4 py-2 bg-secondary border border-border rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors"
                >
                  Add Modules +
                </button>
                <button
                  onClick={() => setViewMode("view")}
                  className="px-4 py-2 bg-rose-100 text-rose-700 rounded-lg text-sm font-medium hover:bg-rose-200 transition-colors"
                >
                  Exit Editing
                </button>
              </>
            ) : (
              <button
                onClick={() => setViewMode("edit")}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Edit Dashboard
              </button>
            )}
            <button
              onClick={() => setDashboardExpanded(!dashboardExpanded)}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
              aria-label={dashboardExpanded ? "Collapse dashboard" : "Expand dashboard"}
            >
              {dashboardExpanded
                ? <Minimize2 className="w-4 h-4 text-muted-foreground" />
                : <Maximize2 className="w-4 h-4 text-muted-foreground" />
              }
            </button>
          </div>
        </div>

        {/* Main Dashboard Card */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden mb-6">
          <div className="flex">
            {/* KPI Pills Row */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 p-4 border-b border-border flex-wrap">
                {/* FEATURE 6A — each KPI pill wrapped with AI badge that appears when AI Insight is active */}
                <AIKPIBadgeWrapper kpiKey="dmg">
                  <KPIPill label="DMG" value={equipmentKPIs.dmg} isEdit={isEditMode} />
                </AIKPIBadgeWrapper>
                <AIKPIBadgeWrapper kpiKey="reLife">
                  <KPIPill label="Re-Life" value={equipmentKPIs.reLife} isEdit={isEditMode} />
                </AIKPIBadgeWrapper>
                <AIKPIBadgeWrapper kpiKey="date">
                  <KPIPill value={equipmentKPIs.date} isEdit={isEditMode} />
                </AIKPIBadgeWrapper>
                <AIKPIBadgeWrapper kpiKey="id">
                  <KPIPill label="ID" value={equipmentKPIs.id} isEdit={isEditMode} />
                </AIKPIBadgeWrapper>
              </div>

              <div className="flex h-80">
                {/* Left navigation column */}
                <div className={cn(
                  "w-36 border-r border-border p-2 space-y-1 flex-shrink-0",
                  isEditMode && "opacity-50"
                )}>
                  {monitoringItems.map((item, i) => (
                    <button
                      key={item.id}
                      className={cn(
                        "w-full px-3 py-2 rounded-lg text-sm text-left transition-colors",
                        i === 3
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-secondary text-foreground"
                      )}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>

                {/* Main widgets area */}
                <div className="flex-1 p-4 grid grid-cols-2 grid-rows-2 gap-4 min-w-0">
                  {/* Line Chart — FEATURE 6B: wrapped in relative container for marker overlay */}
                  <DashboardWidget title="Fatigue Trend" isEdit={isEditMode}>
                    <div style={{ position: "relative" }}>
                      <TrendLineChart height={100} />
                      {/* FEATURE 6B — dashed vertical anomaly markers on line chart */}
                      <AILineChartMarkers height={100} />
                    </div>
                  </DashboardWidget>

                  {/* Gauge */}
                  <DashboardWidget title="Re-Life Indicator" isEdit={isEditMode}>
                    <GaugeChart value={75} label="Re-Life: 40 yrs" />
                  </DashboardWidget>

                  {/* Bar Chart — FEATURE 6B: wrapped in relative container for threshold overlay */}
                  <DashboardWidget title="Historical Data" isEdit={isEditMode}>
                    <div style={{ position: "relative" }}>
                      <BarChartVertical height={100} />
                      {/* FEATURE 6B — dashed red AI threshold line on bar chart */}
                      <AIBarChartThreshold />
                    </div>
                  </DashboardWidget>

                  {/* Data Table */}
                  <DashboardWidget title="Parameters" isEdit={isEditMode}>
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-muted-foreground">≡</span>
                          <div className="flex-1 flex gap-2">
                            <div className="h-2.5 bg-muted rounded flex-1" />
                            <div className="h-2.5 bg-muted rounded flex-1" />
                            <div className="h-2.5 bg-muted rounded flex-1" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </DashboardWidget>
                </div>
              </div>
            </div>

            {/* 3D Model Panel — hidden when expanded or modules open */}
            {!showModules && !dashboardExpanded && (
              <div className={cn(
                "w-64 flex-shrink-0 border-l border-border",
                isEditMode && "relative"
              )}>
                {isEditMode && (
                  <div className="absolute top-2 left-2 right-2 flex justify-between z-10">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <Equipment3DViewer />
              </div>
            )}
          </div>
        </div>

        {/* Bottom tab bar — with Run What-If Scenarios button when expanded */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {equipment.tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  activeTab === tab
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                {tab}
              </button>
            ))}
            <button className="p-2 hover:bg-secondary rounded-full transition-colors">
              <Plus className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Run What-If Scenarios moves here when dashboard is expanded */}
          {dashboardExpanded && (
            <button
              onClick={() => setWhatIfModalOpen(true)}
              disabled={isEditMode}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                isEditMode
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              Run What-If Scenarios
            </button>
          )}
        </div>

        {/* Dashboard Thumbnail Cards — compact pill-cards when expanded */}
        {dashboardExpanded ? (
          <div className="flex gap-3">
            {["#process", "#integrity"].map((label) => (
              <button
                key={label}
                onClick={() => handleTabChange(label)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl border bg-card shadow-sm text-sm font-medium transition-colors hover:border-primary/50",
                  activeTab === label ? "border-primary text-primary" : "border-border text-foreground"
                )}
              >
                <div className="w-2 h-2 rounded-full bg-primary/60" />
                {label}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {dashboardCards.slice(0, 2).map((card, idx) => (
              // FEATURE 4: pass cardIndex for AI insight strip selection
              <DashboardCard key={card.id} card={card} cardIndex={idx} />
            ))}
          </div>
        )}
      </div>

      {/* Right Panel — Equipment Info or Module Library (hidden when expanded) */}
      {!dashboardExpanded && (
        showModules ? (
          <ModuleLibrary onClose={() => setViewMode("edit")} />
        ) : (
          <div className="w-72 flex-shrink-0 bg-card border-l border-border p-4 overflow-y-auto">
            <h3 className="font-semibold text-foreground mb-4">Equipment Information</h3>
            <div className="space-y-2 mb-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-3 bg-muted rounded" style={{ width: `${50 + i * 10}%` }} />
              ))}
            </div>
            <hr className="border-border my-4" />

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
              <h4 className="font-medium text-foreground">Equipment Document</h4>
              <button className="p-1.5 hover:bg-secondary rounded transition-colors">
                <Search className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-2 mb-6">
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

            {/* What-If Scenarios — shown in right panel when NOT expanded */}
            <div className="mt-6">
              <h4 className="font-medium text-foreground mb-3">What-If Scenarios</h4>
              <button
                onClick={() => setWhatIfModalOpen(true)}
                disabled={isEditMode}
                className={cn(
                  "w-full py-3 rounded-lg text-sm font-medium transition-colors",
                  isEditMode
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                Run What-If Scenarios
              </button>
            </div>
          </div>
        )
      )}
    </div>
  )
}

function KPIPill({
  label,
  value,
  isEdit
}: {
  label?: string
  value: string
  isEdit?: boolean
}) {
  return (
    <div className={cn(
      "relative px-3 py-1.5 bg-secondary rounded-lg",
      isEdit && "pl-6 pr-7"
    )}>
      {isEdit && (
        <div className="absolute left-1 top-1/2 -translate-y-1/2">
          <GripVertical className="w-3 h-3 text-muted-foreground" />
        </div>
      )}
      <span className="text-sm font-medium text-foreground">
        {label && <span className="text-muted-foreground">{label}: </span>}
        {value}
      </span>
      {isEdit && (
        <div className="absolute right-1 top-1/2 -translate-y-1/2">
          <MoreVertical className="w-3 h-3 text-muted-foreground" />
        </div>
      )}
    </div>
  )
}

function DashboardWidget({
  title,
  children,
  isEdit
}: {
  title: string
  children: React.ReactNode
  isEdit?: boolean
}) {
  return (
    <div className={cn(
      "bg-secondary/30 rounded-lg p-3 relative",
      isEdit && "opacity-70"
    )}>
      {isEdit && (
        <div className="absolute top-2 left-2 right-2 flex justify-between z-10">
          <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
          <MoreVertical className="w-4 h-4 text-muted-foreground cursor-pointer" />
        </div>
      )}
      <h5 className={cn(
        "text-xs font-medium text-muted-foreground mb-2",
        isEdit && "ml-6"
      )}>{title}</h5>
      {children}
    </div>
  )
}
