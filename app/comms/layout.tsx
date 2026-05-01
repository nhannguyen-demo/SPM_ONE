import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { auth } from "@/auth"

export default async function CommsLayout({ children }: { children: ReactNode }) {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }
  return <AppShell>{children}</AppShell>
}
