/**
 * When true, workspace folder/dashboard mutations use the REST API (session cookies).
 * Set after a successful bootstrap for authenticated users.
 */
let workspaceRemoteMode = false

export function setWorkspaceRemoteMode(value: boolean): void {
  workspaceRemoteMode = value
}

export function getWorkspaceRemoteMode(): boolean {
  return workspaceRemoteMode
}
