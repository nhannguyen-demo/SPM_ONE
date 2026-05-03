"use client"

import type { ReactNode } from "react"
import { Suspense } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { WhatIfScenarioModal, WhatIfResultModal } from "@/components/modals/what-if-scenario"
import { MainRouteSync } from "@/components/main-route-sync"
import { Toaster } from "@/components/ui/sonner"
import { AISparkButton } from "@/components/ai/feature1-spark-button"

/**
 * Main app chrome (legacy `/` shell) plus URL↔store sync for `/home`, `/assets/*`, `/tools/*`, `/settings`.
 */
export function MainShellWithSync({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Suspense fallback={null}>
        <MainRouteSync />
      </Suspense>
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 min-w-0 flex overflow-hidden">{children}</main>
      </div>
      <WhatIfScenarioModal />
      <WhatIfResultModal />
      <AISparkButton />
      <Toaster richColors position="top-center" />
    </div>
  )
}
