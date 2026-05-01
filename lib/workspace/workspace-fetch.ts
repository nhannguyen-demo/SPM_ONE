import { workspaceApiPaths } from "@/lib/workspace/api-paths"
import type {
  DashboardComment,
  DashboardShare,
  Notification,
  PermissionRequest,
  ShareLink,
  WorkspaceDashboard,
  WorkspaceFolder,
} from "@/lib/workspace/types"

export async function workspaceFetch(path: string, init?: RequestInit): Promise<Response> {
  const hasBody = init?.body !== undefined && init?.body !== null
  return fetch(path, {
    ...init,
    credentials: "include",
    headers: hasBody
      ? { "Content-Type": "application/json", ...(init?.headers as Record<string, string>) }
      : { ...(init?.headers as Record<string, string>) },
  })
}

export async function parseJsonOk<T>(res: Response): Promise<T> {
  const json = (await res.json()) as { ok?: boolean; data?: T; error?: string }
  if (!res.ok || json.ok !== true) {
    throw new Error(json.error ?? res.statusText ?? "Request failed")
  }
  return json.data as T
}

export type WorkspaceBootstrapPayload = {
  folders: WorkspaceFolder[]
  dashboards: WorkspaceDashboard[]
  shares: DashboardShare[]
  shareLinks: ShareLink[]
  comments: DashboardComment[]
  permissionRequests: PermissionRequest[]
  notifications: Notification[]
}

export async function fetchWorkspaceBootstrap(): Promise<WorkspaceBootstrapPayload> {
  const res = await workspaceFetch(workspaceApiPaths.bootstrap)
  return parseJsonOk<WorkspaceBootstrapPayload>(res)
}

export async function fetchShareLinkResolve(
  token: string
): Promise<{ link: ShareLink; dashboard: WorkspaceDashboard }> {
  const res = await workspaceFetch(workspaceApiPaths.shareLinkResolve(token))
  return parseJsonOk<{ link: ShareLink; dashboard: WorkspaceDashboard }>(res)
}
