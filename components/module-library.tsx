"use client"

import { useState } from "react"
import { moduleLibrary } from "@/lib/data"
import { 
  X, 
  Search, 
  Plus,
  BarChart3,
  Table,
  LineChart,
  PieChart,
  List,
  BarChart,
  Grid3X3,
} from "lucide-react"
import { cn } from "@/lib/utils"

const iconMap: Record<string, React.ReactNode> = {
  "bar-chart": <BarChart3 className="w-4 h-4" />,
  "table": <Table className="w-4 h-4" />,
  "line-chart": <LineChart className="w-4 h-4" />,
  "pie-chart": <PieChart className="w-4 h-4" />,
  "list": <List className="w-4 h-4" />,
  "chart": <BarChart className="w-4 h-4" />,
  "grid": <Grid3X3 className="w-4 h-4" />,
}

const categories = ["Asset Efficiency", "Asset Information", "Event Visualization", "Other"]

/** MIME type for HTML5 drag payload (read on drop in dashboard editor). */
export const SPM_WIDGET_DRAG_TYPE = "application/x-spm-widget"

export interface LibraryModule {
  id: string
  name: string
  icon: string
}

interface ModuleLibraryProps {
  onClose?: () => void
  onAddModule?: (module: LibraryModule) => void
  onWidgetDragStart?: (module: LibraryModule) => void
  onWidgetDragEnd?: () => void
}

export function ModuleLibrary({
  onClose,
  onAddModule,
  onWidgetDragStart,
  onWidgetDragEnd,
}: ModuleLibraryProps) {
  const [activeCategory, setActiveCategory] = useState("Asset Efficiency")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredModules = moduleLibrary.filter((module) => {
    const matchesCategory = module.category === activeCategory
    const matchesSearch = module.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && (searchQuery === "" || matchesSearch)
  })

  return (
    <div className="w-full bg-card flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Add Widgets</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-secondary rounded transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search widgets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-secondary rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={cn(
              "flex-shrink-0 px-3 py-2 text-xs font-medium border-b-2 transition-colors",
              activeCategory === category
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Widget list — drag to dashboard or click to add at end */}
      <div className="flex-1 overflow-y-auto p-2 min-h-0">
        <p className="text-[10px] text-muted-foreground px-2 pb-2">
          Drag onto the grid or click to add.
        </p>
        {filteredModules.map((module) => (
          <div
            key={module.id}
            role="button"
            tabIndex={0}
            draggable
            onDragStart={(e) => {
              const payload: LibraryModule = {
                id: module.id,
                name: module.name,
                icon: module.icon,
              }
              e.dataTransfer.setData(SPM_WIDGET_DRAG_TYPE, JSON.stringify(payload))
              e.dataTransfer.effectAllowed = "copy"
              onWidgetDragStart?.(payload)
            }}
            onDragEnd={() => onWidgetDragEnd?.()}
            onClick={() => onAddModule?.(module)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onAddModule?.(module)
              }
            }}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors text-left group cursor-grab active:cursor-grabbing select-none"
          >
            <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 pointer-events-none">
              {iconMap[module.icon] || <BarChart3 className="w-4 h-4" />}
            </div>
            <span className="text-sm font-medium text-foreground flex-1 pointer-events-none">{module.name}</span>
            <Plus className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 pointer-events-none" />
          </div>
        ))}
      </div>
    </div>
  )
}
