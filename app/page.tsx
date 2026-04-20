"use client"

import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { SiteOverview } from "@/components/views/site-overview"
import { PlantOverview } from "@/components/views/plant-overview"
import { EquipmentDashboard } from "@/components/views/equipment-dashboard"
import { DataSyncView } from "@/components/views/data-sync"
import { HomeView } from "@/components/views/home-view"
import { WhatifToolView } from "@/components/views/whatif-tool-view"
import { DocumentsView } from "@/components/views/documents-view"
import { WhatIfScenarioModal, WhatIfResultModal } from "@/components/modals/what-if-scenario"
import { useAppStore } from "@/lib/store"
// FEATURE 1 — Global Floating AI Spark Button (also houses FEATURE 7 logic)
import { AISparkButton } from "@/components/ai/feature1-spark-button"

export default function Home() {
  const { currentView } = useAppStore()

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 min-w-0 flex overflow-hidden">
          {currentView === "home"           && <HomeView />}
          {currentView === "site"           && <SiteOverview />}
          {currentView === "plant"          && <PlantOverview />}
          {currentView === "equipment"      && <EquipmentDashboard />}
          {currentView === "data-sync"      && <DataSyncView />}
          {currentView === "whatif-tool"    && <WhatifToolView />}
          {currentView === "documents-tool" && <DocumentsView />}
        </main>
      </div>
      
      {/* Modals */}
      <WhatIfScenarioModal />
      <WhatIfResultModal />

      {/* FEATURE 1 — Global Floating AI Spark Button
          Only renders on site/plant/equipment views; self-excludes on data-sync and modals */}
      <AISparkButton />
    </div>
  )
}
