import type { ReactNode } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { MainShellWithSync } from "@/components/main-shell-with-sync"

export default async function MainLayout({ children }: { children: ReactNode }) {
  const session = await auth()
  if (!session?.user) {
    const h = await headers()
    const target = h.get("x-spm-pathname") ?? "/home"
    redirect(`/login?callbackUrl=${encodeURIComponent(target)}`)
  }
  return <MainShellWithSync>{children}</MainShellWithSync>
}
