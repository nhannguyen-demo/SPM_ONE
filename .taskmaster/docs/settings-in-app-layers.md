# In-app Settings — implementation layers (reference)

**Tag:** `settings-in-app-may2026` · Canonical product rules: `domain.ontology.yaml` (May 3 2026), `PROJECT.md`.

## Product split

| Surface | Purpose |
|---------|---------|
| **Comms → Notifications** | In-app notification feed, unread rail + bell (`/comms/alerts`). |
| **Settings (`AppModule.settings`)** | Per-user **application** preferences: appearance, locale, workspace defaults, tools/export defaults, privacy, about. **v1 = mock** — sidebar panel + optional **`/settings`** page (no persistence). |
| **Module-rail user menu** | Account identity, sign-out — not duplicated inside Settings mock. |

Retired from Settings nav: **General**, **Integrations**, **Alert Settings** (avoid duplicating Comms).

## Layer order (when moving beyond mock)

1. **Domain** — `UserApplicationPreference` (1:1 `User`) in ontology; keep Comms/Settings boundaries in business_rules.
2. **UI shell** — Optional `/settings` full page + `MainRouteSync` / `mainRoutes` (URL parity); or keep rail-only.
3. **Prisma** — Table + migration; encrypt nothing beyond public prefs; theme enum.
4. **API** — `GET/PATCH /api/user/preferences` (session-scoped); rate-limit; zod.
5. **Client** — Hydrate `next-themes` / locale from bootstrap; debounced PATCH; optimistic UI.
6. **QA** — Theme + locale E2E; verify no writes from mock-only build when flag off.

## Mock constraints (current)

- No Zustand slices for preferences; no `fetch` from Settings rows; sidebar entries are inert `PanelNavItem`s.
