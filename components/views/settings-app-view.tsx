"use client"

import { useMemo, useState } from "react"
import { SETTINGS_MOCK_ROWS } from "@/lib/settings-mock"
import { navMatches } from "@/components/sidebar/config"
import { Search, X, Palette, Globe, LayoutGrid, SlidersHorizontal, Shield, Info } from "lucide-react"
import { cn } from "@/lib/utils"

const ROW_ICONS = {
  appearance: Palette,
  locale: Globe,
  workspace: LayoutGrid,
  tools: SlidersHorizontal,
  privacy: Shield,
  about: Info,
} as const

/**
 * Full-page Settings surface. Mirrors the Settings rail panel; preferences are not persisted yet.
 */
export function SettingsAppView() {
  const [q, setQ] = useState("")
  const rows = useMemo(
    () =>
      SETTINGS_MOCK_ROWS.filter(
        (row) => navMatches(row.label, q) || navMatches(row.hint, q)
      ),
    [q]
  )

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-background">
      <div className="mx-auto max-w-2xl px-6 py-8 pb-16">
        <h1 className="text-2xl font-semibold tracking-tight">Application settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Preferences are not saved yet. Use the module rail for the same sections in the side panel.
        </p>

        <div className="relative mt-8">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            placeholder="Search settings…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className={cn(
              "w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-10 text-sm",
              "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
            aria-label="Search application settings"
          />
          {q ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQ("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <p className="mt-6 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Application
        </p>

        <ul className="mt-3 flex flex-col gap-2">
          {rows.length === 0 ? (
            <li className="text-sm text-muted-foreground py-4">No sections match.</li>
          ) : (
            rows.map((row) => {
              const Icon = ROW_ICONS[row.key]
              return (
                <li
                  key={row.key}
                  className="flex gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left shadow-sm"
                >
                  <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-muted">
                    <Icon className="h-4 w-4 text-foreground" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{row.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{row.hint}</p>
                  </div>
                </li>
              )
            })
          )}
        </ul>
      </div>
    </div>
  )
}
