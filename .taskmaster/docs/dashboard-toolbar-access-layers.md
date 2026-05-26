# Dashboard popup toolbar & access requests — implementation layers

**Tag:** `dashboard-toolbar-access-may2026` · Rules: `domain.ontology.yaml` (May 2026), `PROJECT.md`, PRD: `dashboard-toolbar-access-prd.md`.

## Product intent

| Today | Target |
|-------|--------|
| Edit `disabled` without edit grant; Share hidden without edit. | Comments, Publish/Unpublish, Edit, Share always visible and clickable. |
| No Publish in popup. | Publish/Unpublish between Comments and Edit for all viewers. |
| Request access via footer / Comments panel only. | Unified modal from any gated toolbar click; optional note → `PermissionRequest.message`. |
| Publish only in editor header. | Owner may publish/unpublish from popup or editor. |

## Layers (ordered)

1. **Domain / product docs** — Ontology `PermissionRequest.message`; business rules for toolbar order, click routing, Publish/Share → edit request. ✅ `domain.ontology.yaml`, `PROJECT.md`, PRD.
2. **Shared UI — AccessRequestDialog** — Modal: title/body by `requestedPermission`, textarea (500), Request/Cancel; calls `useWorkspaceStore.requestPermission`.
3. **Dashboard popup toolbar** — `dashboard-popup.tsx`: add Publish/Unpublish; reorder toolbar; remove `disabled` on Edit; show Share for all; wire click handlers to dialog or real actions; owner-only publish execution.
4. **Comments panel cleanup** — `comments-panel.tsx`: optional — use shared dialog instead of inline request button; keep view-only copy or shorten.
5. **Remove legacy footer affordance** — Drop footer "Request comment/edit access" when toolbar covers all paths.
6. **API / Prisma alignment** — Ensure `PermissionRequest.message` on Prisma model + POST/PATCH routes if not already migrated; mapper in `lib/workspace/server/mappers.ts`.
7. **Editor parity (optional)** — If product wants Publish visible in editor for non-owners with edit: same request-edit dialog (editor already owner-focused).
8. **QA** — Matrix in PRD; verify Notifications `permission_request_received` includes note in body.

## Taskmaster sequencing

**2 → 3 → 4 → 5 → 6 → 8** (layer 1 done with spec).

## Out of scope

- Equipment Home `DashboardPopup` in `equipment-home.tsx` (read-only Asset popup) — separate epic unless product extends same toolbar there.

## Acceptance criteria

- Shared-with view-only user can request comment and edit from toolbar without enabled controls feeling dead.
- Owner publishes from popup; published dashboard appears on Equipment Home without using editor Save bar only.
