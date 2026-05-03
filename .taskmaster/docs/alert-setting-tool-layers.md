# Alert Setting tool — implementation layers (Taskmaster reference)

**Tag:** `alert-setting-may2026` · Product rules: `domain.ontology.yaml` (May 2026), `PROJECT.md`, parameter alignment: `lib/data-jobs-mock.ts`.

## Product boundaries

| Surface | Role |
|--------|------|
| **Tools → Alert Setting** (`Tool.key = alert_setting`, `/tools/alert-setting`) | Equipment-scoped **alert rules**: parameters, composable conditions (AND/OR/NOT + per-parameter predicates), assignees + permissions, schedules, multi-rule lifecycle, soft-delete + history + recover. **Not** the retired Settings “Alert Settings” row. |
| **Comms → Notifications** | Delivers **`operational_alert`** when a rule “fires”; mock uses per-rule **Test** only (no live crossing). UI must treat these rows as **higher visual weight** than workspace-comms categories; activation uses **`actionHref`** → Equipment Home. |
| **Data & Jobs → Data Status** | **Canonical mock catalog** for Coker **input** channels / families (Temperature, Pressure, Coke Level, Steam Rate, Flow Rate, Laser) and **output** descriptors — Alert Setting SHALL reuse the same names/ids for Coker 01 consistency. |

**Scope gate:** Full interactive **mock** for **Coker 01** (`equipment-a`) only; **HCU 01** / **SMR Pigtails** → **coming soon** panel in-tool.

## Layers (ordered)

1. **Domain / ontology** — `Tool.key` includes `alert_setting`; entities `EquipmentAlertRule`, `EquipmentAlertAssignee`, `EquipmentAlertDeleteRequest`; `Notification` extensions (`operational_alert`, `equipmentId`, `actionHref`, `equipmentAlertRuleId`). ✅ Spec in `domain.ontology.yaml`.
2. **Shared catalog** — `lib/alert-setting-mock.ts` (or re-exports from `lib/data-jobs-mock.ts`): grouped **inputs** vs **outputs**, Coker-only full list; helpers for “coming soon” equipment ids.
3. **Routing / shell** — `mainRoutes.alertSetting()`, `parseMainShellRoute`, `MainRouteSync`, `currentView` / store branch, `app/(main)/tools/alert-setting/page.tsx`; update `.taskmaster/docs/module-url-parity.md`.
4. **Navigation entry points** — Insights sidebar row; optional Equipment Home tile + `preFilterEquipmentId` / `?equipment` parity with other tools.
5. **Tool UI (mock state)** — Zustand slice or colocated module store: rules[], assignees[], deleteRequests[], deletedHistory[]; screens: list, editor wizard, assignee matrix (role × equipment access mock), schedule mock, deleted history + recover.
6. **Condition builder (UX + model)** — DAG editor (groups + order); leaf predicate types: thresholds, bands, OR-outside-band, slope templates; client-side **consistency checks** (reject impossible combinations); extensibility hooks for future stats predicates.
7. **Notifications integration** — `Test` on a rule → `useWorkspaceStore` (or shared helper) injects `operational_alert` per assignee with `title`/`body`, `equipmentId`, `actionHref` to `/assets/equipment/.../equipment-a`; bell + `/comms/alerts` **bold** styling pass.
8. **API / Prisma (deferred)** — Persist rules, assignments, firing audit, server-side evaluation against time-series — separate epic after mock sign-off.

## Taskmaster sequencing hint

Implement **2 → 3 → 4** first (discoverability), then **5–7** (feature depth), **8** last.
