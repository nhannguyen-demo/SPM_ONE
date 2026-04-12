"use client"

import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { SiteOverview } from "@/components/views/site-overview"
import { PlantOverview } from "@/components/views/plant-overview"
import { EquipmentDashboard } from "@/components/views/equipment-dashboard"
import { DataSyncView } from "@/components/views/data-sync"
import { WhatIfScenarioModal, WhatIfResultModal } from "@/components/modals/what-if-scenario"
import { useAppStore } from "@/lib/store"

export default function Home() {
  const { currentView } = useAppStore()

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 flex overflow-hidden">
          {currentView === "site" && <SiteOverview />}
          {currentView === "plant" && <PlantOverview />}
          {currentView === "equipment" && <EquipmentDashboard />}
          {currentView === "data-sync" && <DataSyncView />}
        </main>
      </div>
      
      {/* Modals */}
      <WhatIfScenarioModal />
      <WhatIfResultModal />
    </div>
  )
}
