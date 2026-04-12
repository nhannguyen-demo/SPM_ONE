"use client"

import { dataStatusItems, syncJobs } from "@/lib/data"
import { GripVertical, Archive, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

export function DataSyncView() {
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      {/* Data Status Section */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">Data Status</h2>
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
              {dataStatusItems.map((item, i) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Sync & FEA Jobs Section */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Sync & FEA Jobs</h2>
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
              {syncJobs.map((job, i) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
