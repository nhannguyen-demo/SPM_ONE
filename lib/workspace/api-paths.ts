/** REST paths for `app/api/workspace/*` (Task 5+). Use with `fetch` + session cookies. */
export const workspaceApiPaths = {
  bootstrap: "/api/workspace/bootstrap",
  folders: "/api/workspace/folders",
  folder: (folderId: string) => `/api/workspace/folders/${encodeURIComponent(folderId)}`,
  dashboards: "/api/workspace/dashboards",
  dashboardTrash: "/api/workspace/dashboards?trash=1",
  dashboard: (dashboardId: string) =>
    `/api/workspace/dashboards/${encodeURIComponent(dashboardId)}`,
  dashboardRestore: (dashboardId: string) =>
    `/api/workspace/dashboards/${encodeURIComponent(dashboardId)}/restore`,
  dashboardComments: (dashboardId: string) =>
    `/api/workspace/dashboards/${encodeURIComponent(dashboardId)}/comments`,
  shares: "/api/workspace/shares",
  share: (shareId: string) => `/api/workspace/shares/${encodeURIComponent(shareId)}`,
  shareFirstView: (shareId: string) =>
    `/api/workspace/shares/${encodeURIComponent(shareId)}/first-view`,
  shareLinks: "/api/workspace/share-links",
  shareLink: (linkId: string) =>
    `/api/workspace/share-links/${encodeURIComponent(linkId)}`,
  shareLinkRegenerate: (linkId: string) =>
    `/api/workspace/share-links/${encodeURIComponent(linkId)}/regenerate`,
  shareLinkResolve: (token: string) =>
    `/api/workspace/share-link/resolve?token=${encodeURIComponent(token)}`,
  shareLinkAccept: "/api/workspace/share-link/accept",
  permissionRequests: "/api/workspace/permission-requests",
  permissionRequest: (requestId: string) =>
    `/api/workspace/permission-requests/${encodeURIComponent(requestId)}`,
  notification: (notificationId: string) =>
    `/api/workspace/notifications/${encodeURIComponent(notificationId)}`,
  notificationsReadAll: "/api/workspace/notifications/read-all",
} as const
