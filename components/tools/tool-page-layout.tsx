"use client"

import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { mainRoutes } from "@/lib/main-routes"
import { cn } from "@/lib/utils"
import { BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb"

/** Outer chrome for Tools module pages: gradient background and centered content width. */
export function ToolPageShell({
  children,
  className,
  contentClassName,
}: {
  children: React.ReactNode
  className?: string
  /** Applied to the inner width-constrained wrapper */
  contentClassName?: string
}) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-y-auto bg-gradient-to-b from-background via-background to-muted/25",
        className
      )}
    >
      <div
        className={cn(
          "mx-auto flex w-full max-w-6xl flex-1 flex-col min-h-0 px-4 py-8 sm:px-6 lg:px-8 lg:py-10",
          contentClassName
        )}
      >
        {children}
      </div>
    </div>
  )
}

/** Shared hero for tool routes: optional breadcrumb, title, description, trailing controls. */
export function ToolPageHeader({
  title,
  description,
  breadcrumb,
  trailing,
  titleAdornment,
  className,
}: {
  title: string
  description?: React.ReactNode
  breadcrumb?: React.ReactNode
  trailing?: React.ReactNode
  titleAdornment?: React.ReactNode
  className?: string
}) {
  return (
    <header className={cn("mb-8 shrink-0 border-b border-border/60 pb-8", className)}>
      {breadcrumb ? <div className="mb-5">{breadcrumb}</div> : null}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-2">
          <h1 className="flex flex-wrap items-center gap-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {titleAdornment ? <span className="flex shrink-0 items-center">{titleAdornment}</span> : null}
            <span>{title}</span>
          </h1>
          {description ? (
            <div className="text-sm leading-relaxed text-muted-foreground sm:text-[15px]">{description}</div>
          ) : null}
        </div>
        {trailing ? <div className="flex min-w-0 shrink-0 flex-col gap-2 sm:max-w-md sm:items-end">{trailing}</div> : null}
      </div>
    </header>
  )
}

/**
 * First breadcrumb segment: navigates to Data & Jobs (`/tools/data-sync`), matching prior Tools-link behavior.
 */
export function ToolsModuleHomeCrumb() {
  const router = useRouter()
  const { setCurrentView, setViewMode } = useAppStore()
  return (
    <BreadcrumbItem className="text-xs">
      <BreadcrumbLink asChild>
        <button
          type="button"
          className="cursor-pointer font-normal"
          onClick={() => {
            router.push(mainRoutes.dataSync())
            setCurrentView("data-sync")
            setViewMode("view")
          }}
        >
          Tools
        </button>
      </BreadcrumbLink>
    </BreadcrumbItem>
  )
}

export function ToolPageRouteChip({ path }: { path: string }) {
  return (
    <div className="flex w-fit max-w-full items-center gap-2 rounded-lg border border-border/80 bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
      <span className="break-all font-mono text-[10px] uppercase tracking-wide">{path}</span>
    </div>
  )
}
