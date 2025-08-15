import { getServerSession } from "next-auth"
import { authOptions } from "./auth"
import { redirect } from "next/navigation"

export async function requireAuth() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  return session
}

export async function requireAdmin() {
  const session = await requireAuth()

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  return session
}

export function hasPermission(userRole: string, requiredRole: "ADMIN" | "STAFF") {
  if (requiredRole === "ADMIN") {
    return userRole === "ADMIN"
  }

  return userRole === "ADMIN" || userRole === "STAFF"
}
