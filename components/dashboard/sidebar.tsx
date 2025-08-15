"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Users, GraduationCap, BookOpen, Calendar, DollarSign, FileText, Home } from "lucide-react"

interface SidebarProps {
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Users", href: "/dashboard/users", icon: Users, adminOnly: true },
  { name: "Batches", href: "/dashboard/batches", icon: Calendar },
  { name: "Classes", href: "/dashboard/classes", icon: BookOpen },
  { name: "Students", href: "/dashboard/students", icon: GraduationCap },
  { name: "Subjects", href: "/dashboard/subjects", icon: BookOpen },
  { name: "Fee Structure", href: "/dashboard/fee-structure", icon: DollarSign },
  { name: "Fee Collection", href: "/dashboard/fee-collection", icon: DollarSign },
  { name: "Fee Reports", href: "/dashboard/fee-reports", icon: FileText },
]

export function DashboardSidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  const filteredNavigation = navigation.filter((item) => !item.adminOnly || user.role === "ADMIN")

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-900">School Management</h1>
        <p className="text-sm text-gray-600 mt-1">{user.role}</p>
      </div>
      <nav className="mt-6">
        <div className="px-3">
          {filteredNavigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
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
  )
}
