"use client"

import { Bell, LogOut, Settings } from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function Header() {
  const { data: session, status } = useSession()

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6">
      <div className="flex-1 min-w-0" aria-hidden="true" />

      <div className="flex items-center gap-2">
        {status === "authenticated" && session?.user?.email ? (
          <span className="text-xs text-muted-foreground truncate max-w-[160px] hidden sm:inline">
            {session.user.email}
          </span>
        ) : null}
        <button type="button" className="p-2 rounded-lg hover:bg-secondary transition-colors relative">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
        </button>
        <button type="button" className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <Settings className="w-5 h-5 text-muted-foreground" />
        </button>
        {status === "authenticated" ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        ) : null}
      </div>
    </header>
  )
}
