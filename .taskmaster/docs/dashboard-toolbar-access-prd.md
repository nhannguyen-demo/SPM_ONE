# PRD: Dashboard Popup Toolbar — Universal Actions & Access Requests

**Date:** May 2026  
**Tag:** `dashboard-toolbar-access-may2026`  
**Domain:** `domain.ontology.yaml`, `PROJECT.md`  
**Primary UI:** `components/workspace/dashboard-popup.tsx`

## Problem

Today the Workspace Dashboard Popup disables **Edit** when the user lacks edit permission, hides **Share** unless owner/edit, and has no **Publish/Unpublish** in the popup (only in the editor). Comment access requests live in the Comments panel footer or a separate footer button. Users cannot discover how to request edit access from Publish/Share, and disabled controls feel broken.

## Goals

1. Show **Comments**, **Publish/Unpublish**, **Edit**, and **Share** on the popup toolbar for **all** users who can open the dashboard.
2. Fixed toolbar order: **Comments · Publish/Unpublish · Edit · Share** (Publish/Unpublish between Comments and Edit).
3. All four buttons remain **clickable** (never `disabled` for permission alone).
4. Users **with** the required permission get the real action (toggle comments, navigate to editor, open share dialog, owner publish/unpublish).
5. Users **without** permission get a **modal access-request dialog**: explanation, optional note (max 500 chars), **Request** CTA, cancel.
6. **Publish** and **Share** without edit permission → request **`edit`** access (not a separate publish permission).
7. **Comments** without comment permission → request **`comment`** access.
8. **Edit** without edit permission → request **`edit`** access.
9. Only the **dashboard owner** may execute publish/unpublish transitions (unchanged lifecycle rule).

## Non-goals

- Equipment Home read-only popup (Asset module) — separate surface; may align later but out of this epic unless explicitly scoped.
- New permission tier for "publish" separate from edit.
- Comment notifications on new comments (unchanged).

## User stories

- As a **view-only** share recipient, I click **Comments** and request comment access with an optional note so the owner sees it in Notifications.
- As a **view-only** recipient, I click **Edit**, **Publish**, or **Share** and request edit access with the same dialog pattern.
- As the **owner**, I see Publish/Unpublish in the popup between Comments and Edit and can publish without opening the full editor.
- As a user with **edit** (not owner), I see Publish/Unpublish but clicking it prompts me to request edit if I am not the owner (or we show owner-only message — product: request edit per spec).

## Acceptance criteria

- Toolbar order matches spec on Workspace popup (`/dashboard` card open, shared-with-me, etc.).
- No toolbar button uses `disabled={!canX}` for permission gating.
- Dialog submits `requestPermission({ dashboardId, requestedPermission, message })` and shows success toast.
- Owner publish/unpublish from popup updates `lifecycleStatus` and Asset visibility per existing store/API.
- `PermissionRequest.message` persisted in mock store and API POST body when remote mode on.
- Comments panel inline "Request comment access" may delegate to shared dialog (optional cleanup).

## Technical notes

- Extract `AccessRequestDialog` under `components/workspace/` for reuse from popup and optionally `comments-panel.tsx`.
- `dashboard-editor.tsx` may keep Publish in editor header; popup addition is additive.
- API: verify `POST /api/workspace/permission-requests` accepts `message` (Prisma field if missing = follow-up task).

## Test matrix

| User | Permission | Comments click | Edit click | Publish click | Share click |
|------|------------|----------------|------------|---------------|-------------|
| Owner | — | Toggle panel | → editor | Publish/Unpublish works | Share dialog |
| Sharee | view | Request comment dialog | Request edit | Request edit | Request edit |
| Sharee | comment | Toggle panel | Request edit | Request edit | Request edit |
| Sharee | edit (non-owner) | Toggle panel | → editor | Request edit (not owner) | Share dialog |
