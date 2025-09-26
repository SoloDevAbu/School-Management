"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Users, GraduationCap, BookOpen, Calendar, DollarSign, FileText, Home, X } from "lucide-react"
import { useMobileSidebar } from "./mobile-sidebar-provider"

interface MobileSidebarProps {
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Users", href: "/users", icon: Users, adminOnly: true },
  { name: "Batches", href: "/batches", icon: Calendar },
  { name: "Classes", href: "/classes", icon: BookOpen },
  { name: "Students", href: "/students", icon: GraduationCap },
  { name: "Subjects", href: "/subjects", icon: BookOpen },
  { name: "Fee Structure", href: "/fee-structure", icon: DollarSign },
  { name: "Fee Collection", href: "/fee-collection", icon: DollarSign },
  { name: "Fee Reports", href: "/fee-reports", icon: FileText },
]

export function MobileSidebar({ user }: MobileSidebarProps) {
  const pathname = usePathname()
  const { isOpen, close } = useMobileSidebar()
  const filteredNavigation = navigation.filter((item) => !item.adminOnly || user.role === "ADMIN")

  return (
    <>
      {/* Mobile Overlay - Only show on mobile when sidebar is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={close}
        />
      )}
      
      {/* Mobile Sidebar - Overlay on small screens */}
      <div className={cn(
        "w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out",
        "fixed inset-y-0 left-0 z-50",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">School Management</h1>
              <p className="text-sm text-gray-600 mt-1">{user.role}</p>
            </div>
            {/* Mobile Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={close}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <nav className="mt-6">
          <div className="px-3">
            {filteredNavigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={close} // Close sidebar on mobile when navigating
                  className={cn(
                    "group flex items-center px-3 py-2 text-sm font-medium rounded-md mb-1",
                    pathname === item.href
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </>
  )
}
