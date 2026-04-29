"use client"

import { useMemo, useState } from "react"
import { X, Search, Plus, BarChart3, Table, LineChart, PieChart, List, Grid3X3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { SPM_WIDGET_DRAG_TYPE, type LibraryModule } from "@/components/module-library"
import {
  CATEGORY_LABEL,
  getCatalogTemplatesForType,
  COKER_V1_VERSION,
  listCategoryOrder,
} from "@/lib/equipment-packs"
import type { ParameterCategory } from "@/lib/equipment-packs/types"
import { getSiteEquipment } from "@/lib/data"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useWorkspaceStore } from "@/lib/workspace/store"
import { getCurrentUserId, findOrgUserById } from "@/lib/workspace/identity"
import { toast } from "sonner"

const iconMap: Record<string, React.ReactNode> = {
  "bar-chart": <BarChart3 className="w-4 h-4" />,
  table: <Table className="w-4 h-4" />,
  "line-chart": <LineChart className="w-4 h-4" />,
  "pie-chart": <PieChart className="w-4 h-4" />,
  list: <List className="w-4 h-4" />,
  chart: <BarChart3 className="w-4 h-4" />,
  grid: <Grid3X3 className="w-4 h-4" />,
}

const UI_CATEGORY: Record<ParameterCategory, string> = {
  asset_information: CATEGORY_LABEL.asset_information,
  asset_efficiency: CATEGORY_LABEL.asset_efficiency,
  event_visualization: CATEGORY_LABEL.event_visualization,
  other: CATEGORY_LABEL.other,
}

export type CatalogDragPayload = LibraryModule & {
  mode: "catalog"
  templateKey: string
  packVersion: string
  defaultW: number
  defaultH: number
  minW: number
  minH: number
}

export function CatalogModuleLibrary({
  equipmentId,
  onClose,
  onAddModule,
  onWidgetDragStart,
  onWidgetDragEnd,
  onRequestSubmitted,
}: {
  equipmentId: string
  onClose?: () => void
  onAddModule?: (mod: LibraryModule) => void
  onWidgetDragStart?: (mod: LibraryModule) => void
  onWidgetDragEnd?: () => void
  onRequestSubmitted?: () => void
}) {
  const equ = getSiteEquipment(equipmentId)
  const typeKey = equ?.equipmentTypeKey ?? "other"
  const addOn = equ?.parameterAddonKeys ?? []
  const [active, setActive] = useState<ParameterCategory>(listCategoryOrder()[0]!)
  const [q, setQ] = useState("")
  const [reqOpen, setReqOpen] = useState(false)
  const [reqBody, setReqBody] = useState("")
  const [reqCat, setReqCat] = useState("")

  const submit = useWorkspaceStore((s) => s.submitCatalogParameterRequest)
  const currentRole = findOrgUserById(getCurrentUserId())?.role

  const templates = useMemo(() => {
    const all = getCatalogTemplatesForType(typeKey, addOn)
    const m = q.trim().toLowerCase()
    if (m) {
      return all.filter(
        (t) => t.displayName.toLowerCase().includes(m) || t.key.toLowerCase().includes(m)
      )
    }
    return all.filter((t) => t.category === active)
  }, [typeKey, addOn, active, q])

  const toPayload = (t: (typeof templates)[0]): CatalogDragPayload => ({
    id: t.key,
    name: t.displayName,
    icon: t.icon,
    mode: "catalog",
    templateKey: t.key,
    packVersion: COKER_V1_VERSION,
    defaultW: t.defaultW,
    defaultH: t.defaultH,
    minW: t.minW,
    minH: t.minH,
  })

  return (
    <div className="w-full bg-card flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Coker library</h3>
        {onClose && (
          <button type="button" onClick={onClose} className="p-1 hover:bg-secondary rounded">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
      </div>
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search templates…"
            className="w-full h-10 pl-10 pr-4 bg-secondary rounded-lg text-sm"
          />
        </div>
      </div>
      <div className="flex border-b border-border overflow-x-auto">
        {listCategoryOrder().map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setActive(c)}
            className={cn(
              "flex-shrink-0 px-3 py-2 text-xs font-medium border-b-2",
              active === c
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground"
            )}
          >
            {UI_CATEGORY[c]}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-2 min-h-0">
        {templates.length === 0 && (
          <p className="text-xs text-muted-foreground p-2">No templates in this category.</p>
        )}
        {templates.map((t) => {
          const payload = toPayload(t)
          return (
            <div
              key={t.key}
              role="button"
              tabIndex={0}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData(SPM_WIDGET_DRAG_TYPE, JSON.stringify(payload))
                e.dataTransfer.effectAllowed = "copy"
                onWidgetDragStart?.(payload)
              }}
              onDragEnd={() => onWidgetDragEnd?.()}
              onClick={() => onAddModule?.(payload)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  onAddModule?.(payload)
                }
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary text-left cursor-grab"
            >
              <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center flex-shrink-0">
                {iconMap[t.icon] || <BarChart3 className="w-4 h-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{t.displayName}</div>
                {t.referenceScreenId && (
                  <div className="text-[10px] text-muted-foreground">Ref {t.referenceScreenId}</div>
                )}
              </div>
              <Plus className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </div>
          )
        })}
      </div>
      <div className="p-3 border-t border-border">
        <Button
          type="button"
          variant="outline"
          className="w-full text-xs"
          onClick={() => setReqOpen(true)}
        >
          Request new parameter
        </Button>
      </div>
      <Dialog open={reqOpen} onOpenChange={setReqOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request a new parameter</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            This sends a request to the product team only (not shared with your organization).
            {currentRole !== "product_team" && " You will not receive email; check with PM for follow-up."}
          </p>
          <Textarea
            value={reqBody}
            onChange={(e) => setReqBody(e.target.value)}
            placeholder="Describe the parameter or data you need on dashboards…"
            className="min-h-[100px] text-sm"
          />
          <input
            value={reqCat}
            onChange={(e) => setReqCat(e.target.value)}
            placeholder="Category hint (optional)"
            className="w-full h-9 px-2 rounded border border-border text-sm"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReqOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                submit({ body: reqBody, equipmentId, categoryHint: reqCat || null })
                toast.success("Request submitted")
                setReqOpen(false)
                setReqBody("")
                setReqCat("")
                onRequestSubmitted?.()
              }}
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
