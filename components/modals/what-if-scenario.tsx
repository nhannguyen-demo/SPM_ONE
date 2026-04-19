"use client"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { whatIfResults } from "@/lib/data"
import { X, Info, ChevronDown, Check, Share2 } from "lucide-react"
import { cn } from "@/lib/utils"
// FEATURE 8 — What-If AI Summary Card
import { AIWhatIfSummaryCard } from "@/components/ai/feature8-whatif-summary"
// FEATURE 9 — AI Optimization Recommendation Card
import { AIOptimizationCard } from "@/components/ai/feature9-optimization-rec"
// FEATURE 10 — Generate AI Report Share Option
import { AIShareDropdown } from "@/components/ai/feature10-generate-report"

export function WhatIfScenarioModal() {
  const { whatIfModalOpen, setWhatIfModalOpen, setWhatIfResultOpen } = useAppStore()
  
  if (!whatIfModalOpen) return null

  const handleRunScenario = () => {
    setWhatIfModalOpen(false)
    setWhatIfResultOpen(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setWhatIfModalOpen(false)}
      />
      
      {/* Modal */}
      <div className="relative bg-card rounded-xl shadow-2xl w-[90vw] max-w-6xl max-h-[85vh] overflow-hidden">
        {/* Close button */}
        <button
          onClick={() => setWhatIfModalOpen(false)}
          className="absolute top-4 right-4 p-2 hover:bg-secondary rounded-lg transition-colors z-10"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        <div className="flex h-[70vh]">
          {/* Panel 1 - Scenario Configuration */}
          <div className="w-1/3 border-r border-border p-6 overflow-y-auto">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-foreground">Scenario Configuration</h3>
              <Info className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-6">Input scenario configuration</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Scenario Name
                </label>
                <input
                  type="text"
                  placeholder="Scenario Name"
                  className="w-full h-10 px-3 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <div className="flex items-center gap-1 mb-1.5">
                  <label className="text-sm font-medium text-foreground">Production Unit</label>
                  <Info className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="relative">
                  <select className="w-full h-10 px-3 bg-secondary border border-border rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option>Plant 1</option>
                    <option>Plant 2</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1 mb-1.5">
                  <label className="text-sm font-medium text-foreground">Inspection SubArea</label>
                  <Info className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="relative">
                  <select className="w-full h-10 px-3 bg-secondary border border-border rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option>F</option>
                    <option>A</option>
                    <option>B</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Calculation Method
                </label>
                <div className="relative">
                  <select className="w-full h-10 px-3 bg-secondary border border-border rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option>IEC 12345-6-789</option>
                    <option>API 579</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="recompute" className="w-4 h-4 rounded border-border" />
                <label htmlFor="recompute" className="text-sm text-foreground">
                  Re-compute pressure
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <button className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                  Add
                </button>
                <button className="flex-1 py-2 px-4 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors">
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Panel 2 - Parameter Input */}
          <div className="w-2/5 border-r border-border p-6 overflow-y-auto">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-foreground">Parameter Input</h3>
              <Info className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-6">Input parameters to calculate the acoustic parameters</p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Inspection Location
              </label>
              <div className="relative">
                <select className="w-full h-10 px-3 bg-secondary border border-border rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option>111RC-12345</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Parameter Table */}
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-foreground">Parameter</th>
                    <th className="px-3 py-2 text-left font-medium text-foreground">Value</th>
                    <th className="px-3 py-2 text-left font-medium text-foreground">Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { p: "Inlet Pressure", v: "150.5", u: "barg" },
                    { p: "Inlet Temp", v: "450.2", u: "°C" },
                    { p: "Mass Flow", v: "12.4", u: "kg/s" },
                    { p: "Molecular Wt", v: "28.05", u: "g/mol" },
                    { p: "Cp/Cv", v: "1.32", u: "-" },
                    { p: "Z Factor", v: "0.98", u: "-" },
                    { p: "Pipe Diameter", v: "250", u: "mm" },
                    { p: "Wall Thickness", v: "12.5", u: "mm" },
                  ].map((param, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{param.p}</td>
                      <td className="px-3 py-2">
                        <div className="relative">
                          <input 
                            type="text" 
                            defaultValue={param.v}
                            className="w-full h-8 px-2 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{param.u}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Panel 3 - Acoustic Output */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-foreground">Acoustic Output</h3>
              <Info className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-6">Acoustic Parameter for Equipment</p>

            {/* Output Table */}
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-2 py-2 w-8"></th>
                    <th className="px-2 py-2 text-left font-medium text-foreground text-xs">Name</th>
                    <th className="px-2 py-2 text-left font-medium text-foreground text-xs">PWL (dB)</th>
                    <th className="px-2 py-2 text-left font-medium text-foreground text-xs">Flow Rate</th>
                    <th className="px-2 py-2 text-left font-medium text-foreground text-xs">Set Press.</th>
                    <th className="px-2 py-2 text-left font-medium text-foreground text-xs">Back Press.</th>
                    <th className="px-2 py-2 text-left font-medium text-foreground text-xs">Method</th>
                    <th className="px-2 py-2 text-left font-medium text-foreground text-xs">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border">
                    <td className="px-2 py-2">
                      <input type="checkbox" className="w-4 h-4 rounded border-border" />
                    </td>
                    <td className="px-2 py-2 text-muted-foreground text-xs">...</td>
                    <td className="px-2 py-2 text-muted-foreground text-xs">...</td>
                    <td className="px-2 py-2 text-muted-foreground text-xs">...</td>
                    <td className="px-2 py-2 text-muted-foreground text-xs">...</td>
                    <td className="px-2 py-2 text-muted-foreground text-xs">...</td>
                    <td className="px-2 py-2 text-muted-foreground text-xs">...</td>
                    <td className="px-2 py-2 text-muted-foreground text-xs">...</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleRunScenario}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Run What-If Scenarios
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function WhatIfResultModal() {
  const { whatIfResultOpen, setWhatIfResultOpen } = useAppStore()
  const [shareMenuOpen, setShareMenuOpen] = useState(false)
  
  if (!whatIfResultOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setWhatIfResultOpen(false)}
      />
      
      {/* Modal */}
      <div className="relative bg-card rounded-xl shadow-2xl w-[600px] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <h3 className="font-semibold text-foreground">What-If scenario Result</h3>
          <button
            onClick={() => setWhatIfResultOpen(false)}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* FEATURE 8 — AI Summary Card: inserted between modal header and results table */}
        <div className="flex-shrink-0">
          <AIWhatIfSummaryCard />
        </div>

        {/* Results List */}
        <div className="p-4 flex-1 min-h-[100px] overflow-y-auto">
          <div className="space-y-2">
            {whatIfResults.map((result, i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-secondary/50 rounded-lg">
                <div className="w-5 h-5 rounded border-2 border-primary bg-primary/10 flex items-center justify-center">
                  {result.checked && <Check className="w-3 h-3 text-primary" />}
                </div>
                <div className="flex-1 grid grid-cols-3 gap-4">
                  <span className="text-sm text-foreground">{result.col1}</span>
                  <span className="text-sm text-foreground">{result.col2}</span>
                  <span className={cn(
                    "text-sm font-medium",
                    result.col3 === "Pass" ? "text-green-600" : "text-amber-600"
                  )}>{result.col3}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FEATURE 9 — AI Optimization Recommendation: inserted below results, above Share footer */}
        <div className="flex-shrink-0">
          <AIOptimizationCard />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex justify-end flex-shrink-0">
          <div className="relative">
            <button
              onClick={() => setShareMenuOpen(!shareMenuOpen)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share
              <ChevronDown className="w-4 h-4" />
            </button>

            {/* Share dropdown menu — FEATURE 10: replaced with AIShareDropdown that adds Generate AI Report item */}
            {shareMenuOpen && <AIShareDropdown />}
          </div>
        </div>
      </div>
    </div>
  )
}
