import type React from "react"
import { requireAuth } from "@/lib/auth-utils"
import { DesktopSidebar } from "@/components/dashboard/desktop-sidebar"
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { MobileSidebarProvider } from "@/components/dashboard/mobile-sidebar-provider"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireAuth()

  return (
    <MobileSidebarProvider>
      <div className="flex h-screen bg-gray-100">
        {/* Desktop Sidebar - Always visible on large screens */}
        <div className="hidden lg:block">
          <DesktopSidebar user={session.user} />
        </div>
        
        {/* Mobile Sidebar - Overlay on small screens */}
        <MobileSidebar user={session.user} />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader user={session.user} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </MobileSidebarProvider>
  )
}
