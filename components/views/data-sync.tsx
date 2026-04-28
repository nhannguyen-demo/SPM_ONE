"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/lib/store"
import { dataStatusItems, syncJobs, sites } from "@/lib/data"
import { GripVertical, Archive, ExternalLink, Filter, X } from "lucide-react"
import { cn } from "@/lib/utils"

const ALL_ASSETS = "all"

export function DataSyncView() {
  const { preFilterEquipmentId, setPreFilterEquipmentId } = useAppStore()

  // Derive unique asset names from mock data (union of both tables)
  const assetOptions = Array.from(
    new Set([
      ...dataStatusItems.map((i) => i.asset),
      ...syncJobs.map((j) => j.asset),
    ])
  ).sort()

  // Derive a display name from the equipment id if a pre-filter is set
  const getEquipmentName = (equipmentId: string): string => {
    for (const site of sites) {
      for (const unit of site.units) {
        const equip = unit.equipment.find((e) => e.id === equipmentId)
        if (equip) return equip.name
      }
    }
    return equipmentId
  }

  const [filterAsset, setFilterAsset] = useState<string>(ALL_ASSETS)

  // Consume the pre-filter from the store when navigating from Equipment Home Page
  useEffect(() => {
    if (!preFilterEquipmentId) return
    const name = getEquipmentName(preFilterEquipmentId)
    // Only apply if the name matches a known asset in the tables
    if (assetOptions.includes(name)) {
      setFilterAsset(name)
    }
    setPreFilterEquipmentId(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredStatus = filterAsset === ALL_ASSETS
    ? dataStatusItems
    : dataStatusItems.filter((i) => i.asset === filterAsset)

  const filteredJobs = filterAsset === ALL_ASSETS
    ? syncJobs
    : syncJobs.filter((j) => j.asset === filterAsset)

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span className="font-medium">Filter by equipment:</span>
        </div>
        <div className="relative">
          <select
            value={filterAsset}
            onChange={(e) => setFilterAsset(e.target.value)}
            className={cn(
              "h-9 pl-3 pr-8 bg-card border border-border rounded-lg text-sm appearance-none cursor-pointer",
              "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
              "text-foreground",
              filterAsset !== ALL_ASSETS && "border-primary/50 bg-primary/5"
            )}
            aria-label="Filter by equipment"
          >
            <option value={ALL_ASSETS}>All equipment</option>
            {assetOptions.map((asset) => (
              <option key={asset} value={asset}>{asset}</option>
            ))}
          </select>
        </div>
        {filterAsset !== ALL_ASSETS && (
          <button
            onClick={() => setFilterAsset(ALL_ASSETS)}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
            aria-label="Clear filter"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* Data Status Section */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Data Status
          {filterAsset !== ALL_ASSETS && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              — {filterAsset}
            </span>
          )}
        </h2>
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="w-10 px-3 py-3"></th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Asset</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Number of data file</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Load Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Last update</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Error</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Detail</th>
              </tr>
            </thead>
            <tbody>
              {filteredStatus.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No data status entries for this equipment.
                  </td>
                </tr>
              ) : (
                filteredStatus.map((item, i) => (
                  <tr key={i} className="border-t border-border hover:bg-secondary/30 transition-colors">
                    <td className="px-3 py-3">
                      <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground font-medium">{item.asset}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{item.files}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{item.loadStatus}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{item.lastUpdate}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={cn(
                        item.error.startsWith("0") ? "text-foreground" : "text-amber-600"
                      )}>
                        {item.error}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-sm text-primary hover:underline flex items-center gap-1">
                        link
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Sync & FEA Jobs Section */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Sync &amp; FEA Jobs
          {filterAsset !== ALL_ASSETS && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              — {filterAsset}
            </span>
          )}
        </h2>
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="w-10 px-3 py-3"></th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Asset</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Description</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Current State</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Start Time</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Elapsed</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Tokens</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No sync jobs for this equipment.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job, i) => (
                  <tr key={i} className="border-t border-border hover:bg-secondary/30 transition-colors">
                    <td className="px-3 py-3">
                      <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground font-medium">{job.asset}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{job.description}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                        job.state === "Success"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      )}>
                        {job.state}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{job.startTime}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{job.elapsed}</td>
                    <td className="px-4 py-3 text-sm text-foreground truncate max-w-32">{job.user}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{job.tokens}</td>
                    <td className="px-4 py-3">
                      <button className="p-1.5 hover:bg-secondary rounded transition-colors">
                        <Archive className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
