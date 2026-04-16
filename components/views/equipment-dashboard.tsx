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
  Trash2
} from "lucide-react"
import { DashboardCard } from "@/components/dashboard-card"
import { ModuleLibrary } from "@/components/module-library"
import { Equipment3DViewer } from "@/components/equipment-3d"
import { cn } from "@/lib/utils"
import { useState, useId } from "react"
// Recharts imports
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  BarChart, Bar, LineChart, Line, ComposedChart, Legend, ScatterChart, Scatter, ZAxis, PieChart, Pie, Cell
} from "recharts"
// FEATURE 6A — KPI Pill AI Badge Wrappers
// FEATURE 6B — Chart Anomaly Markers
import { AIKPIBadgeWrapper, AILineChartMarkers, AIBarChartThreshold } from "@/components/ai/feature6-ai-insight-overlay"

// DnD Kit imports
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragOverlay,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES & DEFAULT LAYOUTS
   ═══════════════════════════════════════════════════════════════════════════ */
type WidgetData = {
  id: string;
  viewType: string;
  maximized: boolean;
  title?: string; // Optional custom title override
}

const DEFAULT_LAYOUTS: Record<string, WidgetData[]> = {
  "Demo Engineer Team's Dashboard": [
    { id: 'w-demo-1', viewType: "demo-pie", maximized: false },
    { id: 'w-demo-2', viewType: "demo-bar", maximized: false },
    { id: 'w-demo-3', viewType: "demo-summary", maximized: true },
  ],
  "Monitoring": [
    { id: 'w-mon-1', viewType: "mon-sensor-1", maximized: true },
    { id: 'w-mon-2', viewType: "mon-sensor-2", maximized: false },
    { id: 'w-mon-3', viewType: "mon-temp", maximized: false },
  ],
  "Process": [
    { id: 'w-pro-1', viewType: "proc-composed", maximized: true },
    { id: 'w-pro-2', viewType: "proc-stream", maximized: true },
  ],
  "Fatigue": [
    { id: 'w-fat-1', viewType: "fatigue-trend", maximized: true },
    { id: 'w-fat-2', viewType: "fatigue-cycle", maximized: false },
    { id: 'w-fat-3', viewType: "fatigue-rem", maximized: false },
  ],
  "Bulging": [
    { id: 'w-bul-1', viewType: "bulge-bar", maximized: false },
    { id: 'w-bul-2', viewType: "bulge-scatter", maximized: false },
  ],
  "Cracking": [
    { id: 'w-cra-1', viewType: "crack-line", maximized: true },
    { id: 'w-cra-2', viewType: "crack-flaws", maximized: true },
  ]
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD EXPORT
   ═══════════════════════════════════════════════════════════════════════════ */
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

  // Layout State
  const [layouts, setLayouts] = useState<Record<string, WidgetData[]>>(DEFAULT_LAYOUTS);
  const [activeDragWidget, setActiveDragWidget] = useState<WidgetData | null>(null);

  const site = sites.find((s) => s.id === currentPath.site)
  const plant = site?.plants.find((p) => p.id === currentPath.plant)
  const equipment = plant?.equipment.find((e) => e.id === currentPath.equipment)

  const dndId = useId()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // minimum drag distance before triggering
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  if (!site || !plant || !equipment) return null

  const activeTab = currentPath.tab || "Demo Engineer Team's Dashboard"
  const isEditMode = viewMode === "edit" || viewMode === "modules"
  const showModules = viewMode === "modules"

  const handleTabChange = (tab: string) => {
    setCurrentPath({ ...currentPath, tab })
  }

  const currentWidgets = layouts[activeTab] || [];

  // DnD Handlers
  const handleDragStart = (event: any) => {
    const { active } = event;
    const widget = currentWidgets.find(w => w.id === active.id);
    if (widget) setActiveDragWidget(widget);
  }

  const handleDragEnd = (event: any) => {
    setActiveDragWidget(null);
    const { active, over } = event;

    if (!over) return;

    if (active.data.current?.isLibraryItem) {
      // Adding a new widget from the library
      const module = active.data.current.module;
      const newWidgetId = `w-new-${Date.now()}`;
      
      // Map arbitrary viewType
      let viewType = "generic";
      if (module.name.toLowerCase().includes("sensor")) viewType = "mon-sensor-2";
      if (module.name.toLowerCase().includes("vibration")) viewType = "crack-line";
      if (module.name.toLowerCase().includes("map")) viewType = "bulge-scatter";
      
      setLayouts(prev => {
        const tabLayout = prev[activeTab] ? [...prev[activeTab]] : [];
        const overIndex = tabLayout.findIndex(w => w.id === over.id);
        const insertionIndex = overIndex >= 0 ? overIndex : tabLayout.length;
        
        tabLayout.splice(insertionIndex, 0, {
          id: newWidgetId,
          viewType,
          maximized: false,
          title: module.name
        });
        
        return { ...prev, [activeTab]: tabLayout };
      });
      return;
    }

    if (active.id !== over.id) {
      setLayouts(prev => {
        const tabLayout = prev[activeTab] ? [...prev[activeTab]] : [];
        const oldIndex = tabLayout.findIndex(w => w.id === active.id);
        const newIndex = tabLayout.findIndex(w => w.id === over.id);
        return { ...prev, [activeTab]: arrayMove(tabLayout, oldIndex, newIndex) };
      });
    }
  }

  // Widget Actions
  const toggleMaximize = (widgetId: string) => {
    setLayouts(prev => {
      const tabLayout = prev[activeTab].map(w =>
        w.id === widgetId ? { ...w, maximized: !w.maximized } : w
      );
      return { ...prev, [activeTab]: tabLayout };
    });
  }

  const removeWidget = (widgetId: string) => {
    setLayouts(prev => {
      const tabLayout = prev[activeTab].filter(w => w.id !== widgetId);
      return { ...prev, [activeTab]: tabLayout };
    });
  }

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 flex min-w-0 overflow-hidden">
        {/* Main Content */}
        <div className={cn("flex-1 min-w-0 p-6 overflow-y-auto flex flex-col relative", showModules && "pr-0")}>
          {/* Header with controls */}
          <div className="flex items-center justify-between mb-4">
            <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
              {equipment.name} {activeTab} Dashboard
            </span>
            <div className="flex items-center gap-2">
              {isEditMode ? (
                <>
                  <button
                    onClick={() => setViewMode(showModules ? "edit" : "modules")}
                    className="px-4 py-2 bg-secondary border border-border rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors"
                  >
                    Add Widgets +
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
          <div className={cn(
            "bg-card rounded-xl border border-border shadow-sm overflow-hidden flex-1 flex flex-col",
            dashboardExpanded ? "mb-0" : "mb-6"
          )}>
            <div className="flex flex-1 min-h-0">
              {/* KPI Pills Row */}
              <div className="flex-1 min-w-0 flex flex-col min-h-0">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 border-b border-border flex-shrink-0">
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

                <div className="flex flex-1 min-h-0 overflow-hidden">
                  {/* Main widgets area */}
                  <div className="flex-1 p-4 overflow-y-auto">
                    <SortableContext items={currentWidgets.map(w => w.id)} strategy={rectSortingStrategy}>
                      <div className="grid grid-cols-1 xl:grid-cols-2 auto-rows-[250px] gap-4 w-full">
                        {currentWidgets.map(widget => (
                          <SortableWidget
                            key={widget.id}
                            widget={widget}
                            isEdit={isEditMode}
                            onMaximize={() => toggleMaximize(widget.id)}
                            onRemove={() => removeWidget(widget.id)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </div>
                </div>
              </div>

              {/* 3D Model Panel — hidden when expanded or modules open */}
              {!showModules && !dashboardExpanded && (
                <div className={cn(
                  "w-1/4 min-w-[200px] max-w-[320px] flex-shrink-0 border-l border-border relative",
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

          {/* Regular bottom items — hidden when expanded */}
          {!dashboardExpanded && (
            <div className="flex gap-4 overflow-x-auto pb-2 overflow-y-hidden">
              {dashboardCards.map((card, idx) => (
                <button
                  key={card.id}
                  onClick={() => handleTabChange(card.tag)}
                  className={cn(
                    "text-left transition-all rounded-xl border-2 border-transparent",
                    activeTab === card.tag && "border-primary shadow-md"
                  )}
                >
                  <DashboardCard card={card} cardIndex={idx} />
                </button>
              ))}
              <button className="flex-shrink-0 w-16 h-[min(100%,130px)] my-auto border-2 border-dashed border-border rounded-xl flex items-center justify-center hover:border-primary/50 hover:bg-primary/5 transition-colors">
                <Plus className="w-6 h-6 text-muted-foreground" />
              </button>
            </div>
          )}

          {/* Slide-up bottom panel — shown when expanded */}
          {dashboardExpanded && (
            <div className="absolute left-6 right-6 bottom-0 translate-y-[calc(100%-12px)] hover:translate-y-0 transition-transform duration-300 z-50 bg-background border border-border shadow-[0_-10px_40px_rgba(0,0,0,0.1)] rounded-t-xl px-6 py-4 flex flex-col">
              <div className="absolute -top-3 left-0 right-0 h-4 cursor-pointer flex items-center justify-center">
                <div className="w-16 h-1.5 rounded-full bg-border/80" />
              </div>

              <div className="flex items-center justify-between">
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
              </div>
            </div>
          )}
        </div>

        {/* Right Panel — Equipment Info or Module Library */}
        {showModules ? (
          <div className={cn(
            "h-full flex-shrink-0 transition-all",
            dashboardExpanded ? "absolute right-0 top-0 bottom-0 z-50 shadow-2xl" : ""
          )}>
            <ModuleLibrary onClose={() => setViewMode("edit")} />
          </div>
        ) : (
          !dashboardExpanded && (
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

      <DragOverlay>
        {activeDragWidget ? (
          <div className="bg-background border border-primary shadow-xl rounded-lg p-4 opacity-80 scale-105">
            <div className="text-sm font-semibold">{activeDragWidget.title || activeDragWidget.viewType}</div>
          </div>
        ) : null}
      </DragOverlay>

    </DndContext>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */

function KPIPill({ label, value, isEdit }: { label?: string; value: string; isEdit?: boolean }) {
  return (
    <div className={cn(
      "relative p-4 bg-secondary/30 border border-border/50 rounded-xl flex flex-col justify-center items-center w-full min-h-[80px]",
      isEdit && "pl-8 pr-8"
    )}>
      {isEdit && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
      {label && <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</span>}
      <span className="text-2xl font-bold text-foreground">{value}</span>
      {isEdit && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <MoreVertical className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </div>
  )
}

function SortableWidget({ 
  widget, 
  isEdit, 
  onMaximize, 
  onRemove 
}: { 
  widget: WidgetData; 
  isEdit: boolean; 
  onMaximize: () => void; 
  onRemove: () => void 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-secondary/30 rounded-lg p-3 relative flex flex-col h-full border border-transparent transition-all",
        widget.maximized && "xl:col-span-2",
        isEdit && "border-border shadow-sm hover:border-primary/50"
      )}
    >
      {isEdit && (
        <>
          {/* Drag Handle */}
          <div 
            {...attributes} 
            {...listeners} 
            className="absolute top-2 left-2 cursor-grab active:cursor-grabbing p-1 bg-background/80 rounded z-20 hover:bg-muted"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
          {/* Options */}
          <div className="absolute top-2 right-2 flex gap-1 z-20">
             <button 
                onClick={onMaximize} 
                className="p-1 bg-background/80 rounded hover:bg-muted text-muted-foreground"
                title={widget.maximized ? "Shrink" : "Maximize"}
              >
               {widget.maximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
             </button>
             <button 
                onClick={onRemove} 
                className="p-1 bg-background/80 rounded hover:bg-rose-100 text-rose-500"
                title="Remove widget"
              >
               <Trash2 className="w-4 h-4" />
             </button>
          </div>
        </>
      )}

      <h5 className={cn(
        "text-xs font-medium text-muted-foreground mb-2 flex-shrink-0",
        isEdit && "ml-8" // clear drag handle
      )}>
        {widget.title || "Dashboard Widget"}
      </h5>
      
      <div className="flex-1 min-h-0 flex flex-col justify-center relative pointer-events-auto">
         {/* Pass down mapping for Recharts */}
         <WidgetViewResolver viewType={widget.viewType} />
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MOCKUP DASHBOARD VIEWS - Dynamic Resolver
   ═══════════════════════════════════════════════════════════════════════════ */

const mockLineData = [
  { name: 'Jan', value: 400 }, { name: 'Feb', value: 300 }, { name: 'Mar', value: 550 },
  { name: 'Apr', value: 450 }, { name: 'May', value: 600 }, { name: 'Jun', value: 700 },
]

const mockProcessData = [
  { time: '08:00', pressure: 120, throughput: 800 }, { time: '10:00', pressure: 130, throughput: 850 },
  { time: '12:00', pressure: 150, throughput: 900 }, { time: '14:00', pressure: 125, throughput: 870 },
  { time: '16:00', pressure: 140, throughput: 920 }, { time: '18:00', pressure: 110, throughput: 810 },
]

const mockScatterData = [
  { x: 10, y: 30, z: 200 }, { x: 20, y: 50, z: 260 }, { x: 30, y: 40, z: 400 },
  { x: 40, y: 60, z: 280 }, { x: 50, y: 30, z: 500 }, { x: 60, y: 80, z: 200 },
]

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const pieData = [
  { name: 'Process A', value: 400 },
  { name: 'Process B', value: 300 },
  { name: 'Process C', value: 300 },
  { name: 'Process D', value: 200 },
];

function WidgetViewResolver({ viewType }: { viewType: string }) {
  switch (viewType) {
    case "demo-pie":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value">
              {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
          </PieChart>
        </ResponsiveContainer>
      );
    case "demo-bar":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mockLineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
            <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis fontSize={11} tickLine={false} axisLine={false} />
            <RechartsTooltip cursor={{fill: 'var(--color-secondary)'}} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    case "demo-summary":
      return (
        <div className="flex gap-4 items-center justify-around h-full">
          {[
            { label: 'OEE', val: '86%' },
            { label: 'Uptime', val: '99.9%' },
            { label: 'Quality', val: '98.5%' }
          ].map(k => (
             <div key={k.label} className="text-center">
               <div className="text-sm text-muted-foreground">{k.label}</div>
               <div className="text-3xl font-bold text-foreground">{k.val}</div>
             </div>
          ))}
        </div>
      );
    case "mon-sensor-1":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mockLineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
            <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis fontSize={11} tickLine={false} axisLine={false} />
            <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
            <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
          </LineChart>
        </ResponsiveContainer>
      );
    case "mon-sensor-2":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mockLineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
            <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis fontSize={11} tickLine={false} axisLine={false} />
            <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
            <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      );
    case "mon-temp":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={mockProcessData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
             <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
             <XAxis dataKey="time" fontSize={11} />
             <YAxis fontSize={11} />
             <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
             <Area type="monotone" dataKey="pressure" fill="#ef4444" fillOpacity={0.2} stroke="#ef4444" />
          </ComposedChart>
        </ResponsiveContainer>
      );
    case "proc-composed":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={mockProcessData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
            <XAxis dataKey="time" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis yAxisId="left" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis yAxisId="right" orientation="right" fontSize={11} tickLine={false} axisLine={false} />
            <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
            <Legend wrapperStyle={{fontSize: '11px', paddingTop: '10px'}} />
            <Bar yAxisId="left" dataKey="throughput" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
            <Line yAxisId="right" type="monotone" dataKey="pressure" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} />
          </ComposedChart>
        </ResponsiveContainer>
      );
    case "proc-stream":
      return (
        <div className="flex gap-4 overflow-x-auto h-full items-center">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="min-w-[150px] p-4 bg-background rounded-lg border border-border shrink-0">
                <div className="text-xs text-muted-foreground mb-1">Process Point {i}</div>
                <div className="text-xl font-bold">{(Math.random() * 100).toFixed(1)}</div>
              </div>
            ))}
         </div>
      );
    case "fatigue-trend":
      return (
        <>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockLineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
              <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} />
              <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
              <Area type="monotone" dataKey="value" stroke="#7c3aed" fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
          <AILineChartMarkers height={100} />
        </>
      );
    case "fatigue-cycle":
      return (
        <>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockLineData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="name" hide />
              <YAxis hide />
              <RechartsTooltip cursor={{fill: 'var(--color-secondary)'}} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
              <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <AIBarChartThreshold />
        </>
      );
    case "fatigue-rem":
      return (
        <div className="flex flex-col items-center justify-center h-full">
            <div className="text-4xl font-black text-rose-500 mb-2">12,405</div>
            <div className="text-sm text-muted-foreground w-3/4 text-center">Cycles remaining until critical threshold reached</div>
         </div>
      );
    case "bulge-bar":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mockScatterData} layout="vertical" margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={false} />
            <XAxis type="number" fontSize={11} />
            <YAxis dataKey="x" type="category" fontSize={11} tickLine={false} axisLine={false} />
            <RechartsTooltip cursor={{fill: 'var(--color-secondary)'}} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
            <Bar dataKey="y" fill="#f59e0b" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    case "bulge-scatter":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis type="number" dataKey="x" name="stature" fontSize={11} />
            <YAxis type="number" dataKey="y" name="weight" fontSize={11} />
            <ZAxis type="number" dataKey="z" range={[60, 400]} name="score" />
            <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
            <Scatter name="Thickness" data={mockScatterData} fill="#ef4444" opacity={0.6} />
          </ScatterChart>
        </ResponsiveContainer>
      );
    case "crack-line":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mockProcessData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
            <XAxis dataKey="time" fontSize={11} />
            <YAxis fontSize={11} />
            <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
            <Line type="stepAfter" dataKey="pressure" stroke="#dc2626" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      );
    case "crack-flaws":
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-full items-center">
           {[1,2,3,4].map(n => (
             <div key={n} className="bg-secondary/50 p-4 rounded-lg flex flex-col justify-center items-center">
                <span className="text-2xl mb-1">🔍</span>
                <span className="text-sm font-medium">Flaw Region {n}</span>
                <span className="text-xs text-rose-500">{(Math.random() * 5).toFixed(2)} mm</span>
             </div>
           ))}
        </div>
      );
    case "generic":
    default:
      return (
        <div className="flex flex-col items-center justify-center h-full opacity-50">
           <BarChart className="w-12 h-12 mb-2 text-muted-foreground" />
           <span className="text-sm text-muted-foreground">New Module</span>
        </div>
      );
  }
}
