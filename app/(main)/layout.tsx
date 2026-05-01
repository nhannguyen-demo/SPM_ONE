import type { ReactNode } from "react"
import { MainShellWithSync } from "@/components/main-shell-with-sync"

export default function MainLayout({ children }: { children: ReactNode }) {
  return <MainShellWithSync>{children}</MainShellWithSync>
}
