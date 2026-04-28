"use client"

import { cn } from "@/lib/utils"
import type { OrgUser } from "@/lib/workspace/types"

const COLOR_RING = [
  "bg-sky-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-teal-500",
  "bg-pink-500",
  "bg-orange-500",
] as const

function colorFor(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return COLOR_RING[Math.abs(h) % COLOR_RING.length]
}

export function UserAvatar({
  user,
  size = "sm",
  className,
}: {
  user: OrgUser | null
  size?: "xs" | "sm" | "md" | "lg"
  className?: string
}) {
  const sizing = {
    xs: "w-5 h-5 text-[9px]",
    sm: "w-6 h-6 text-[10px]",
    md: "w-8 h-8 text-xs",
    lg: "w-10 h-10 text-sm",
  }[size]
  if (!user) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground font-medium",
          sizing,
          className
        )}
      >
        ?
      </span>
    )
  }
  return (
    <span
      title={`${user.name} (${user.email})`}
      className={cn(
        "inline-flex items-center justify-center rounded-full text-white font-medium select-none",
        colorFor(user.id),
        sizing,
        className
      )}
    >
      {user.initials}
    </span>
  )
}

export function UserAvatarStack({
  users,
  max = 3,
  size = "xs",
}: {
  users: OrgUser[]
  max?: number
  size?: "xs" | "sm" | "md"
}) {
  const visible = users.slice(0, max)
  const overflow = users.length - visible.length
  return (
    <div className="inline-flex items-center -space-x-1.5">
      {visible.map((u) => (
        <UserAvatar
          key={u.id}
          user={u}
          size={size}
          className="ring-2 ring-background"
        />
      ))}
      {overflow > 0 && (
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground font-medium ring-2 ring-background",
            size === "xs" ? "w-5 h-5 text-[9px]" : size === "sm" ? "w-6 h-6 text-[10px]" : "w-8 h-8 text-xs"
          )}
        >
          +{overflow}
        </span>
      )}
    </div>
  )
}
