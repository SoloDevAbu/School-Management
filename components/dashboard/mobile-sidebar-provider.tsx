"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface MobileSidebarContextType {
  isOpen: boolean
  toggle: () => void
  close: () => void
  open: () => void
}

const MobileSidebarContext = createContext<MobileSidebarContextType | undefined>(undefined)

export function MobileSidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const toggle = () => setIsOpen(prev => !prev)
  const close = () => setIsOpen(false)
  const open = () => setIsOpen(true)

  return (
    <MobileSidebarContext.Provider value={{ isOpen, toggle, close, open }}>
      {children}
    </MobileSidebarContext.Provider>
  )
}

export function useMobileSidebar() {
  const context = useContext(MobileSidebarContext)
  if (context === undefined) {
    throw new Error("useMobileSidebar must be used within a MobileSidebarProvider")
  }
  return context
}
