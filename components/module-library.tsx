"use client"

import { useState } from "react"
import { moduleLibrary } from "@/lib/data"
import { 
  X, 
  Search, 
  GripVertical,
  BarChart3,
  Table,
  LineChart,
  PieChart,
  List,
  BarChart,
  Grid3X3,
  ChevronDown
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

interface ModuleLibraryProps {
  onClose: () => void
}

export function ModuleLibrary({ onClose }: ModuleLibraryProps) {
  const [activeCategory, setActiveCategory] = useState("Asset Efficiency")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredModules = moduleLibrary.filter((module) => {
    const matchesCategory = module.category === activeCategory
    const matchesSearch = module.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && (searchQuery === "" || matchesSearch)
  })

  return (
    <div className="w-80 bg-card border-l border-border flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button
          onClick={onClose}
          className="p-1 hover:bg-secondary rounded transition-colors"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
        <h3 className="font-semibold text-foreground">Module Library</h3>
        <div className="w-6" />
      </div>

      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search modules..."
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

      {/* Module List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredModules.map((module) => (
          <div
            key={module.id}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors cursor-grab active:cursor-grabbing"
            draggable
          >
            <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="flex items-center gap-2 flex-1">
              <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center">
                {iconMap[module.icon] || <BarChart3 className="w-4 h-4" />}
              </div>
              <span className="text-sm font-medium text-foreground">{module.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <button className="px-2 py-1 text-xs text-muted-foreground hover:bg-muted rounded flex items-center gap-1">
                Options
                <ChevronDown className="w-3 h-3" />
              </button>
              <button className="px-2 py-1 text-xs text-muted-foreground hover:bg-muted rounded flex items-center gap-1">
                Options
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
