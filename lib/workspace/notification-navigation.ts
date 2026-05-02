import type { Notification } from "@/lib/workspace/types"

/**
 * Returns an in-app URL to open when the user activates a notification, or null
 * when there is no safe default target (stay on the list / dismiss only).
 */
export function notificationHref(n: Notification): string | null {
  if (n.dashboardId) {
    return `/dashboard?d=${encodeURIComponent(n.dashboardId)}`
  }
  return null
}
