"use client"

import { useState } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./components/app-sidebar"
import { DashboardContent } from "./components/dashboard-content"
import { CarsSection } from "./components/cars-section"
import { WorkOrdersSection } from "./components/work-orders-section"
import { ClientsSection } from "./components/clients-section"

import { ReportsSection } from "./components/reports-section"

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState("dashboard")

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardContent />
      case "cars":
        return <CarsSection />
      case "work-orders":
        return <WorkOrdersSection />
      case "clients":
        return <ClientsSection />
      case "reports":
        return <ReportsSection />
      default:
        return <DashboardContent />
    }
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar activeSection={activeSection} setActiveSection={setActiveSection} />
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto">
            <div className="container-responsive p-3 sm:p-4 md:p-6 max-w-full">{renderContent()}</div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
