# SPM ONE — Project Rules

---

## Project Base Rules

### Stack
Next.js 16 App Router | React 19 | TypeScript | Tailwind CSS v4 | shadcn/ui | Zustand | Recharts | react-grid-layout

### Critical: Read First
- Always read `PROJECT.md` before responding.
- Use `domain.ontology.yaml` as domain source of truth (entities/relationships/rules).

### Folder Conventions (current repo)
- App shell/routes: `app/`
- Feature views: `components/views/`
- Shared components: `components/`
- UI primitives: `components/ui/`
- State: `lib/store.ts`
- Mock/static data: `lib/data.ts`
- Domain docs: `PROJECT.md`, `domain.ontology.yaml`

### Code Rules
- Default to server components in `app/`; add `"use client"` only when interactivity/state/browser APIs are required.
- Keep domain naming consistent with ontology (`Dashboard`, `Widget`, `WhatIfRunSession`, etc.).
- No `any`; prefer explicit types and null-safe handling.
- Use shadcn/ui + Tailwind utilities; avoid ad-hoc CSS systems.
- Reuse existing patterns (Zustand slices, seed hooks, `cn()` helper, error boundaries).
- Do not invent backend behavior; clearly mark mocked/fake data paths.

---

## Self-Improvement Rules

- Before major code suggestions, re-check `PROJECT.md` for current build state and constraints.
- If implementation reality differs from docs, propose doc updates to `PROJECT.md` and/or `domain.ontology.yaml`.
- Prefer incremental, reversible changes over broad rewrites.
- When introducing new domain terms, map them to existing ontology names or propose explicit migration notes.
- Reduce duplication when touching code (extract shared helpers/components instead of copy-paste).
- Call out assumptions clearly when backend behavior is not yet implemented.
- Keep new rules concise, scoped, and based on repeated project patterns.

---

## UI Layer Rules
_Applies when working in `components/**/*.{ts,tsx}`_

- Prefer shadcn/ui primitives and existing shared components before creating new ones.
- Use Tailwind for layout/spacing/visual states; keep styles token-based (`app/globals.css` theme vars).
- Keep feature/domain language aligned with ontology (`Dashboard`, `Widget`, `WhatIfScenario`, `WhatIfRunSession`).
- In equipment dashboards, model placement via reusable widget patterns (not one-off chart islands).
- Preserve existing UX flows:
  - Tools module contains What-If Scenarios.
  - Viewed Data can overlay live + scenario run data.
  - Dashboard editing supports drag/drop + resize + save/discard.
- Keep client components focused; split very large files into smaller presentational/logic pieces when touching them.
- Forms should use `react-hook-form` + `zod` when validating user inputs.

---

## Validation / Form Rules
_Applies when working in `{components,lib}/**/*.{ts,tsx}`_

- Validate all user-entered scenario inputs before run submission.
- Keep input models aligned to ontology entities:
  - `WhatIfScenarioParameter`
  - `WhatIfRunInput`
  - `UserDocument` share metadata
- Prefer Zod schemas colocated by feature when introducing form-heavy flows.
- For create/update flows:
  - create schemas require mandatory fields
  - update schemas should be partial/optional by default
- Normalize types at boundaries (e.g., string form values -> typed domain values where required).
- Surface validation messages in UI; do not silently coerce invalid values.

---

## Schema / Domain Model Rules
_Applies when working with `domain.ontology.yaml`_

- Every persistent entity must include: `id`, `createdAt`, `updatedAt`.
- Keep schema/entity names aligned with current ontology:
  - `Dashboard` (not `DashboardTab`)
  - `Widget` + `DashboardWidget` join
  - `WhatIfRunSelectedDashboard` is removed
- Use enums for lifecycle and type fields (`status`, `kind`, `source`, `category`, etc.).
- Preserve key invariants:
  - Dashboard name unique per equipment.
  - Dashboard widget layout constraints (`x,y,w,h,minW,minH`).
  - WhatIf run status transitions and progress bounds.
  - Referential integrity for Site->Plant->Equipment and run/document links.
- If schema evolves, update both `domain.ontology.yaml` and `PROJECT.md` summary sections together.

---

## API Layer Rules (Backend-Ready Guidance)
_Applies when working in `lib/**/*.{ts,tsx}`_

- Backend is not implemented yet; when adding API code, align models to `domain.ontology.yaml`.
- Define one service/module per core entity group (Assets, Dashboards, WhatIf, Documents, SyncJobs).
- Validate all mutation inputs with Zod schemas.
- Enforce domain invariants from ontology (run status transitions, dashboard/layout constraints, document scoping).
- Prefer typed DTOs and explicit field selection; avoid leaking internal shapes to UI.
- Treat `WhatIfRunSession` as queued/running/completed workflow; support queued concurrent runs.
- Keep side effects idempotent where possible (report generation, run submission retries).
