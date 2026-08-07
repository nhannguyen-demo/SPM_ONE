# SPM ONE — Functional Feature Listing

A complete inventory of every currently **working** function, button, and action in the product, for engineering reference during maintenance and development.

**Scope & method:** Every row was verified directly against the source code (not against planning docs, which contain aspirational items not yet built). A row only exists if it has a real, observable effect — navigation, a state change, a filter, a persisted write, etc. Static/mock data (used throughout most of the app) does **not** disqualify a row; only dead UI does (no handler, no-op handler, permanently disabled, "coming soon," or unreachable code). Items known to be non-functional mockups or placeholders are intentionally omitted.

**Data note:** The **Dashboard** module (folders, dashboards, sharing, comments, notifications) is backed by a real PostgreSQL + Prisma database via `/api/workspace/*` for signed-in users. Nearly everything else (asset hierarchy, KPIs, What-If, Documents, Data & Jobs, Alert Setting) runs on static/mock data in `lib/*.ts`, with `localStorage` for Alert Setting — the interactions themselves are fully functional either way.

## Contents
1. [Authentication & Sign-In](#authentication--sign-in)
2. [Session & Route Protection](#session--route-protection)
3. [Global Navigation — Sidebar](#global-navigation--sidebar)
4. [Global Navigation — Header & Notification Bell](#global-navigation--header--notification-bell)
5. [Global Navigation — AI Assistant](#global-navigation--ai-assistant)
6. [Settings](#settings)
7. [Home](#home)
8. [Site Overview](#site-overview)
9. [Unit / Plant Overview](#unit--plant-overview)
10. [Equipment Home Page](#equipment-home-page)
11. [Dashboard Popup (read-only preview overlay)](#dashboard-popup-read-only-preview-overlay)
12. [Full-Screen Dashboard Viewer](#full-screen-dashboard-viewer)
13. [Dashboard Widget Catalog](#dashboard-widget-catalog)
14. [Dashboard Module — Navigation & Organization](#dashboard-module--navigation--organization)
15. [Dashboard Module — Editor](#dashboard-module--editor)
16. [Dashboard Module — Sharing](#dashboard-module--sharing)
17. [Dashboard Module — Comments & Access Requests](#dashboard-module--comments--access-requests)
18. [Share Link Landing Page](#share-link-landing-page)
19. [Tools — What-If Scenario](#tools--what-if-scenario)
20. [Tools — Documents](#tools--documents)
21. [Tools — Data & Jobs](#tools--data--jobs)
22. [Tools — Alert Setting](#tools--alert-setting)
23. [Comms — Notifications](#comms--notifications)

---

## Authentication & Sign-In

| Location | Feature | Success Criteria |
|---|---|---|
| `/login` (`app/login/login-form.tsx`) | Email field validation | Required + type=email input blocks submit until a syntactically valid email is entered. |
| `/login` (`app/login/login-form.tsx`) | Password field validation | Required input blocks submit until a non-empty password value is entered. |
| `/login` (`app/login/login-form.tsx`) | Sign-in submit | Correct email/password authenticates via Auth.js credentials provider and redirects to the callback URL (default `/home`). |
| `/login` (`app/login/login-form.tsx`) | Invalid-credentials error message | Wrong email or password shows "Invalid email or password." below the form without navigating away. |
| `/login` (`lib/security/auth-rate-limit.ts`) | Login rate limiting | Rapid repeated sign-in POSTs from one IP (>20/15min default) return HTTP 429 with a "Too many sign-in attempts" message. |
| `/login` (`app/login/login-form.tsx`) | Submit pending state | While signing in, the button reads "Signing in…" and the fields and button are disabled. |
| `/login` (`app/login/login-form.tsx`) | `callbackUrl` redirect target | `?callbackUrl=` query param sends the user back to the originally requested page after successful login. |
| `/` (`app/page.tsx`) | Root path session redirect | Visiting `/` sends signed-in users to `/home` and signed-out users to `/login`. |
| `/login` (`app/login/page.tsx`) | Redirect signed-in users away from login | Visiting `/login` while already authenticated server-redirects to `/home` instead of showing the form. |

## Session & Route Protection

| Location | Feature | Success Criteria |
|---|---|---|
| Global shell (`app/(main)/layout.tsx`) | Server-side auth guard for main-shell pages | Signed-out request to `/home`, `/assets/*`, `/tools/*`, or `/settings` redirects to `/login?callbackUrl=<path>`; enforced in the layout, not `middleware.ts`. |
| `/dashboard` (`app/dashboard/layout.tsx`) | Dashboard module requires a signed-in session | Visiting any `/dashboard/*` route while signed out redirects to `/login`. |
| Global shell (`components/providers/workspace-server-sync.tsx`) | Workspace data load on sign-in | After sign-in, `GET /api/workspace/bootstrap` loads dashboards/folders/notifications; a failed fetch toasts an error and falls back to seed data. |
| Global shell (`components/providers/app-auth-providers.tsx`) | Workspace identity sync with session | Signing in or out updates which user's folders/shares/notifications are treated as "mine" app-wide. |
| Global shell (`components/main-route-sync.tsx`) | URL-to-state sync for deep links | Loading or back/forward-navigating to a main-shell URL sets the matching site/plant/equipment/tool view in app state. |

## Global Navigation — Sidebar

| Location | Feature | Success Criteria |
|---|---|---|
| Global shell (`components/sidebar.tsx`) | Home rail icon | Click routes to `/home`, sets Home as the current view, and closes the contextual panel. |
| Global shell (`components/sidebar.tsx`) | Assets rail icon | Click opens the Assets tree panel; from Dashboard/Comms pages it also routes back to the last-viewed site/plant/equipment. |
| Global shell (`components/sidebar.tsx`) | Dashboard rail icon | Click routes to `/dashboard` and opens the folder-tree panel. |
| Global shell (`components/sidebar.tsx`) | Tools rail icon | Click opens the Tools panel; from Dashboard/Comms/Settings pages it also routes to `/tools/what-if`. |
| Global shell (`components/sidebar.tsx`) | Comms rail icon | Click routes to `/comms/alerts` and opens its panel. |
| Global shell (`components/sidebar.tsx`) | Settings rail icon | Click routes to `/settings` from any page and opens its panel. |
| Global shell (`components/sidebar.tsx`) | Comms unread-count badge | A red badge with the unread notification count shows on the Comms rail icon only when count > 0. |
| Global shell (`components/sidebar.tsx`) | Active module highlighting | The currently active rail icon renders filled/highlighted versus the inactive ones. |
| Global shell (`components/sidebar.tsx`) | Re-click active icon to collapse/expand panel | Clicking the already-active Assets/Tools/Settings icon hides the panel; clicking again reopens it. |
| Global shell (`components/sidebar.tsx`) | Panel close (×) button | Click collapses the open contextual panel to width 0. |
| Global shell (`components/sidebar.tsx`) | Assets tree — site navigation | Click routes to `/assets/site/:id`, marks the row active, and auto-expands its plant list. |
| Global shell (`components/sidebar.tsx`) | Assets tree — site expand/collapse | Chevron click toggles the plant list open/closed without changing the route. |
| Global shell (`components/sidebar.tsx`) | Assets tree — plant navigation | Click routes to `/assets/plant/:site/:unit`, marks the row active, and auto-expands its equipment list. |
| Global shell (`components/sidebar.tsx`) | Assets tree — plant expand/collapse | Chevron click toggles the equipment list open/closed without navigating. |
| Global shell (`components/sidebar.tsx`) | Assets tree — equipment navigation | Click on a non-placeholder equipment row routes to its Equipment Home page and marks it active. |
| Global shell (`components/sidebar.tsx`) | Assets tree active-row highlighting | The site/plant/equipment row matching the current route renders with a highlighted background. |
| Global shell (`components/sidebar.tsx`) | Assets panel search | Typing filters the site/plant/equipment tree to name matches and auto-expands matching branches. |
| Global shell (`components/sidebar.tsx`) | Insights panel — Data & Jobs item | Click routes to `/tools/data-sync` and highlights the row when active. |
| Global shell (`components/sidebar.tsx`) | Insights panel — Documents item | Click routes to `/tools/documents` and highlights the row when active. |
| Global shell (`components/sidebar.tsx`) | Insights panel — What-If Scenario item | Click routes to `/tools/what-if`, resets the selected scenario, and highlights when active. |
| Global shell (`components/sidebar.tsx`) | Insights panel — Alert Setting item | Click routes to `/tools/alert-setting` and highlights the row when active. |
| Global shell (`components/sidebar.tsx`) | Insights panel search | Typing filters the Tools list (Data & Jobs, Documents, What-If, Alert Setting) by label. |
| Global shell (`components/sidebar.tsx`) | Comms panel — Notifications item | Click routes to `/comms/alerts`, shows the unread badge, and highlights when active. |
| Global shell (`components/sidebar.tsx`) | Comms panel search | Typing filters the Comms list by label. |
| Global shell (`components/sidebar.tsx`) | Dashboard panel folder-tree navigation | Clicking All Dashboards/Shared/Recent/Trash or a folder switches the `/dashboard` view to that location. |
| Global shell (`components/sidebar.tsx`) | Dashboard panel search | Typing filters the folder tree and virtual views (All/Shared/Recent/Trash) by name. |
| Global shell (`components/sidebar.tsx`) | Contextual panel search clear (×) | An × appears once text is entered in any module's panel search; clicking it empties the query. |
| Global shell (`components/sidebar.tsx`) | Account menu open | Click on the avatar circle opens a menu showing the signed-in user's name and email. |
| Global shell (`components/sidebar.tsx`) | Sign out | Selecting "Sign out" ends the session and redirects to `/login`. |

## Global Navigation — Header & Notification Bell

| Location | Feature | Success Criteria |
|---|---|---|
| Global shell (`components/header.tsx`) | Notification bell dropdown | Click opens a dropdown listing recent notifications; clicking outside closes it. |
| Global shell (`components/header.tsx`) | Bell unread-count badge | A red badge with the unread count shows on the bell only when count > 0. |
| Global shell (`components/header.tsx`) | Notification list preview | Dropdown shows up to 8 most recent notifications with title/body, or "You're all caught up." when empty. |
| Global shell (`components/header.tsx`) | Notification click-through | Clicking a notification marks it read and, if it has a linked destination, navigates there. |
| Global shell (`components/header.tsx`) | Operational-alert visual flag | Notifications categorized as operational alerts render with an amber highlight/border in the dropdown and popups. |
| Global shell (`components/header.tsx`) | "View all notifications" link | Click navigates to `/comms/alerts`. |
| Global shell (`components/header.tsx`) | Ephemeral new-notification popup | A new unread notification shows a toast-like card under the bell for about 4 seconds, then auto-dismisses. |
| Global shell (`components/header.tsx`) | Ephemeral popup click-through | Clicking the popup marks it read and navigates to its linked destination if one exists. |
| Global shell (`components/header.tsx`) | Ephemeral popup dismiss (×) | Click marks the notification read and removes the popup immediately, before its timeout. |

## Global Navigation — AI Assistant

| Location | Feature | Success Criteria |
|---|---|---|
| Global shell (`components/ai/feature1-spark-button.tsx`) | AI spark button expand | On a site/plant/equipment dashboard in view mode, click expands the floating button into a chat bar plus an Insight button. |
| Global shell (`components/ai/feature1-spark-button.tsx`) | AI spark button collapse | Click on the chevron collapses the expanded bar back to the single round spark button. |
| Global shell (`components/ai/feature1-spark-button.tsx`) | "AI Insight" overlay toggle | Click toggles the button's active style and shows/hides the AI insight overlay on the current dashboard. |
| Global shell (`components/ai/feature7-edit-suggestion.tsx`) | Editing-suggestion pill hover tooltip | In dashboard edit mode, hovering the floating pill shows "Suggestion based on current status." |

## Settings

| Location | Feature | Success Criteria |
|---|---|---|
| `/settings` (`components/views/settings-app-view.tsx`) and module rail (`components/sidebar.tsx`) | Settings search filter | Typing filters the 6 settings sections (Appearance, Language & region, Workspace defaults, Tools & exports, Privacy, About) by name/hint in both surfaces. |
| `/settings` (`components/views/settings-app-view.tsx`) and module rail (`components/sidebar.tsx`) | Settings search clear (×) | Click empties the settings search query and restores all 6 sections, in both surfaces. |

*(The 6 settings rows themselves are static display cards only — no toggles/inputs are wired up yet; preferences are explicitly not persisted.)*

## Home

| Location | Feature | Success Criteria |
|---|---|---|
| `/home` (`components/views/home-view.tsx`) | Personalized greeting displays the signed-in user's name or email | Heading shows "Welcome back, {name}"; falls back to email prefix, then "there", if unavailable. |
| `/home` (`components/views/home-view.tsx`) | Global search input filters live suggestions across sites, plants, equipment, dashboards | Typing a matching name lists up to 10 results in a dropdown below the search box. |
| `/home` (`components/views/home-view.tsx`) | Clear (X) button in search box empties the query | Clicking the X icon (shown only when text is entered) clears the input and refocuses it. |
| `/home` (`components/views/home-view.tsx`) | Arrow Up/Down keys move the highlighted row in search suggestions | With suggestions open, ArrowDown/ArrowUp shifts the tinted highlight to the next/previous row. |
| `/home` (`components/views/home-view.tsx`) | Selecting a search suggestion (click, or arrow-highlight + Enter) navigates to it | Clicking a result, or pressing Enter after highlighting one, routes to its site/plant/equipment/dashboard page. |
| `/home` (`components/views/home-view.tsx`) | Escape key closes the search suggestions dropdown | With at least one suggestion showing, pressing Escape hides the dropdown without navigating. |
| `/home` (`components/views/home-view.tsx`) | Search shows a "no results" message for unmatched queries | Typing text matching no site/plant/equipment/dashboard shows 'No results for "query"' in the dropdown. |
| `/home` (`components/views/home-view.tsx`) | AI Summary "Critical Notices" panel displays severity-tagged notices | Panel renders 3 entries, each with a warning/info icon, title, body text, and dashboard location tag. |
| `/home` (`components/views/home-view.tsx`) | AI Summary "Suggested Actions" panel displays recommended actions | Panel renders 3 entries with icon, action text, reason, referenced dashboard, and an advisory disclaimer. |
| `/home` (`components/views/home-view.tsx`) | Recent Dashboards card click navigates to that dashboard's equipment page | Clicking a card opens the equipment page with the dashboard pre-opened and moves it to the front of Recents (max 6). |
| `/home` (`components/views/home-view.tsx`) | Recent Dashboards empty state shown when no dashboards visited yet | With an empty list, section shows "No recently visited dashboards yet…" placeholder; resets on refresh (in-memory only). |
| `/home` (`components/dashboard-card.tsx`) | Dashboard card shows a static "AI insight" caption strip at its bottom | Every Recent/Favorite card shows 1 of 4 fixed captions chosen by row position. |
| `/home` (`components/views/home-view.tsx`) | Favorite Dashboards card click navigates to that dashboard's equipment page | Clicking a favorited card opens its equipment page with the dashboard pre-opened and adds it to Recents. |
| `/home` (`components/views/home-view.tsx`) | "Show N more" / "Show fewer" toggle expands or collapses the Favorites list | With more than 6 favorites, clicking switches the visible list between 6 cards and the full set. |
| `/home` (`components/views/home-view.tsx`) | Favorite Dashboards empty state shown when nothing is favorited | With zero favorites, section shows "No favorited dashboards yet — click the bookmark icon…" placeholder text. |
| `/home` (`components/views/home-view.tsx`) | Change Log tab filter (All Changes / Dashboard / Operations) | Clicking a tab filters table rows to that entry type and highlights the active tab. |
| `/home` (`components/views/home-view.tsx`) | Documents category filter tabs (All / Uploaded / Shared) | Clicking a tab filters the document grid to matching category and highlights the active tab. |
| `/home` (`components/views/home-view.tsx`) | Documents asset filter dropdown (by site, plant, or equipment) | Choosing an asset filters the document grid to documents scoped to that site/plant/equipment. |
| `/home` (`components/views/home-view.tsx`) | Documents name search box filters the document grid live | Typing text filters cards to name matches; shows "No documents match your filters" when none match. |

## Site Overview

| Location | Feature | Success Criteria |
|---|---|---|
| `/assets/site/[siteId]` (`components/views/site-overview.tsx`) | Maximize2/Minimize2 toggle on the Site Overview Dashboard card | Click Maximize2: map card fills the panel, dashboards list and right panel hide; Minimize2 restores them. |
| `/assets/site/[siteId]` (`components/views/site-overview.tsx`) | Click "Unit 2006 - DCU" marker on the site aerial map | Marker tints red on hover; click navigates to `/assets/plant/site-x/unit-2006-dcu`, opening that unit's Overview page. |
| `/assets/site/[siteId]` (`components/views/site-overview.tsx`) | Click "Unit 2007 - HCU" marker on the site aerial map | Marker tints red on hover; click navigates to `/assets/plant/site-x/unit-2007-hcu`, opening that unit's Overview page. |
| `/assets/site/[siteId]` (`components/views/site-overview.tsx`) | Click "Unit 2008 - Hydrogen Unit" marker on the site aerial map | Marker tints red on hover; click navigates to `/assets/plant/site-x/unit-2008-h2`, opening that unit's Overview page. |
| `/assets/site/[siteId]` (`components/ai/feature6-ai-insight-overlay.tsx`) | Hover an AI status badge (AIMapBadges) on a map unit | With AI Insight mode on, hovering shows a tooltip; Unit 2008 shows a Warning tooltip, Units 2006/2007 show Normal. |
| `/assets/site/[siteId]` (`components/views/site-overview.tsx`) | "All units" filter dropdown above the Dashboards section | Selecting a unit filters dashboard cards to that unit and collapses any manually expanded stack. |
| `/assets/site/[siteId]` (`components/ui/dashboard-tab-stack.tsx`) | Hover/click a collapsed equipment dashboard-card stack | For equipment with 2+ dashboards, hover fans the cards with a "Click to expand all tabs" hint; click expands them into a row. |
| `/assets/site/[siteId]` (`components/ui/dashboard-tab-stack.tsx`) | Chevron-left "Collapse dashboard tabs" icon on an expanded stack | Clicking re-collapses a manually expanded multi-card stack back into the fanned preview. |
| `/assets/site/[siteId]` (`components/ui/dashboard-tab-stack.tsx`) | Click the equipment name label inside a dashboard stack | Navigates to Equipment Home on the first dashboard's tab; stack's own expand state is unaffected. |
| `/assets/site/[siteId]` (`components/views/site-overview.tsx`) | Click an individual dashboard thumbnail card (stack or filtered list) | Navigates to Equipment Home for that equipment, selecting and opening that dashboard via the `openDashboard` query param. |
| `/assets/site/[siteId]` (`components/ai/feature4-insight-strips.tsx`) | AI Insight Strip footer on every dashboard thumbnail card | Card footer shows one of four fixed insight messages, chosen by the card's position in its stack/list. |
| `/assets/site/[siteId]` (`components/views/site-overview.tsx`) | Hover the docked handle of the bottom Dashboards panel when maximized | Hovering slides the panel up from the bottom edge to reveal the full dashboards list without a click. |
| `/assets/site/[siteId]` (`components/ai/feature3-health-summary.tsx`) | AI Health Summary card atop the right Site Information panel | Panel shows a green "Normal" status dot and narrative text mentioning Site 2000 and a damage threshold. |

## Unit / Plant Overview

| Location | Feature | Success Criteria |
|---|---|---|
| `/assets/plant/[siteId]/[unitId]` (`components/views/plant-overview.tsx`) | Maximize2/Minimize2 toggle on the Unit Overview Dashboard card | Click Maximize2: P&ID card fills the panel, dashboards list and Unit Context Panel both hide; Minimize2 restores them. |
| `/assets/plant/[siteId]/[unitId]` (`components/ai/feature5-pid-anomaly.tsx`) | Hover the "Valve Output 1" AI anomaly hotspot on the P&ID diagram | Pulsing amber marker shows a tooltip: flow rate 18% below expected, possible upstream blockage. |
| `/assets/plant/[siteId]/[unitId]` (`components/ai/feature5-pid-anomaly.tsx`) | Hover the "Vessel T-102" AI anomaly hotspot on the P&ID diagram | Pulsing amber marker shows a tooltip reporting a +14°C temperature deviation above operating norm. |
| `/assets/plant/[siteId]/[unitId]` (`components/views/plant-overview.tsx`) | "All Equipments" filter dropdown above the Dashboards section | Selecting an equipment filters dashboard cards to it and collapses any manually expanded stack. |
| `/assets/plant/[siteId]/[unitId]` (`components/ui/dashboard-tab-stack.tsx`) | Hover/click a collapsed equipment dashboard-card stack | For equipment with 2+ dashboards, hover fans the cards with a "Click to expand all tabs" hint; click expands them into a row. |
| `/assets/plant/[siteId]/[unitId]` (`components/ui/dashboard-tab-stack.tsx`) | Chevron-left "Collapse dashboard tabs" icon on an expanded stack | Clicking re-collapses a manually expanded multi-card stack back into the fanned preview. |
| `/assets/plant/[siteId]/[unitId]` (`components/ui/dashboard-tab-stack.tsx`) | Click the equipment name label inside a dashboard stack | Navigates to that equipment's page on its default tab; stack's own expand state is unaffected. |
| `/assets/plant/[siteId]/[unitId]` (`components/views/plant-overview.tsx`) | Click an individual dashboard thumbnail card (stack or filtered list) | Navigates to Equipment Home for that equipment, selecting and opening that dashboard via the `openDashboard` query param. |
| `/assets/plant/[siteId]/[unitId]` (`components/ai/feature4-insight-strips.tsx`) | AI Insight Strip footer on every dashboard thumbnail card | Card footer shows one of four fixed insight messages, chosen by the card's position in its stack/list. |
| `/assets/plant/[siteId]/[unitId]` (`components/views/plant-overview.tsx`) | Hover the docked handle of the bottom Dashboards panel when maximized | Hovering slides the panel up from the bottom edge to reveal the full dashboards list without a click. |
| `/assets/plant/[siteId]/[unitId]` (`components/asset/unit-context-panel.tsx`) | PanelLeftClose icon in the open Unit Context Panel header | Clicking collapses the unit info panel down to a narrow icon-only edge strip. |
| `/assets/plant/[siteId]/[unitId]` (`components/asset/unit-context-panel.tsx`) | ChevronLeft icon on the collapsed panel's edge strip | Clicking reopens the Unit Context Panel to full width, restoring name, AI summary, and documents. |
| `/assets/plant/[siteId]/[unitId]` (`components/ai/feature3-health-summary.tsx`) | AI Health Summary card atop the Unit Context Panel | Panel shows a green "Normal" status dot and fixed narrative text mentioning Plant 1 and Plant 2 equipment status. |

## Equipment Home Page

| Location | Feature | Success Criteria |
|---|---|---|
| `/assets/equipment/[siteId]/[unitId]/[equipmentId]` (`components/views/equipment-home.tsx`) | "Edit Dashboards" button navigates to the Dashboard module pre-scoped to this equipment | `/dashboard` loads with its equipment filter already set to this equipment, no manual selection needed. |
| `/assets/equipment/[siteId]/[unitId]/[equipmentId]` (`components/views/equipment-home.tsx`) | Click a dashboard card (Recent/Favorites/All row) opens its read-only preview popup and marks it Recent | Popup opens showing that dashboard's widgets; the card then appears atop the Recent row. |
| `/assets/equipment/[siteId]/[unitId]/[equipmentId]` (`components/views/equipment-home.tsx`) | Bookmark icon on a dashboard card toggles it into/out of the Favorites row | Icon fills amber and the card appears under Favorites; clicking again removes it. |
| `/assets/equipment/[siteId]/[unitId]/[equipmentId]` (`components/views/equipment-home.tsx`) | Amber "open elsewhere" count badge appears on a dashboard card via cross-tab signalling | Badge with tab count appears almost instantly when that dashboard's Full-Screen Viewer opens elsewhere; disappears on close (or within 15s if abrupt). |
| `/assets/equipment/[siteId]/[unitId]/[equipmentId]` (`components/views/equipment-home.tsx`) | Equipment Home auto-opens a dashboard popup when the URL includes `?openDashboard=<id>` | Loading the equipment page with that query param opens the matching dashboard's popup with no click. |
| `/assets/equipment/[siteId]/[unitId]/[equipmentId]` (`components/views/equipment-home.tsx`) | Tools tile "Data & Jobs" navigates to the Data & Jobs tool pre-filtered to this equipment | `/tools/data-sync?equipment=<id>` loads with the asset filter dropdown pre-set to this equipment's name. |
| `/assets/equipment/[siteId]/[unitId]/[equipmentId]` (`components/views/equipment-home.tsx`) | Tools tile "Documents" navigates to the Documents tool | `/tools/documents?equipment=<id>` loads (document filter defaults to "All" regardless). |
| `/assets/equipment/[siteId]/[unitId]/[equipmentId]` (`components/views/equipment-home.tsx`) | Tools tile "What-If Scenario" navigates to the What-If tool with equipment and scenario pre-selected | `/tools/what-if` opens with this equipment's scenario applied; tile is disabled when the equipment has no scenario. |
| `/assets/equipment/[siteId]/[unitId]/[equipmentId]` (`components/views/equipment-home.tsx`) | Tools tile "Alert Setting" navigates to the Alert Setting tool pre-filtered to this equipment | `/tools/alert-setting?equipment=<id>` loads with the equipment selector already set to this equipment. |
| `/assets/equipment/[siteId]/[unitId]/[equipmentId]` (`components/views/equipment-home.tsx`) | Popup body renders the selected dashboard's widgets read-only via the shared grid | Widgets render in a non-draggable, non-resizable layout matching the dashboard editor's arrangement. |
| `/assets/equipment/[siteId]/[unitId]/[equipmentId]` (`components/views/equipment-home.tsx`) | Hovering a widget reveals an Expand icon that opens a full-viewport widget lightbox | Lightbox shows the enlarged widget; closes via its X button, backdrop click, or Escape. |
| `/assets/equipment/[siteId]/[unitId]/[equipmentId]` (`components/views/equipment-home.tsx`) | Close the dashboard popup via the X button, backdrop click, or Escape key | Any of the three actions dismisses the popup overlay and returns to the page. |
| `/assets/equipment/[siteId]/[unitId]/[equipmentId]` (`components/views/equipment-home.tsx`) | "Open in new tab" launches the Full-Screen Viewer in a new browser tab | New tab opens at `/dashboards/<id>/full`; the popup stays open, unaffected, in the original tab. |
| `/assets/equipment/[siteId]/[unitId]/[equipmentId]` (`components/views/equipment-home.tsx`) | "Generate Report" creates a mock PDF report and saves it to Documents | Clicking shows a "Report saved to Documents" message and adds a new PDF entry to Documents. |
| `/assets/equipment/[siteId]/[unitId]/[equipmentId]` (`components/views/equipment-home.tsx`) | "Share" button generates a report, then opens a "Share Report" dialog | Dialog opens with a recipient field; clicking Cancel or Share both close it (no real send). |
| `/assets/equipment/[siteId]/[unitId]/[equipmentId]` (`components/views/equipment-home.tsx`) | Viewed Data panel toggles Live Data and/or completed What-If runs as widget overlays | Checking/unchecking a source changes which data renders on widgets; at least one source stays selected. |
| `/assets/equipment/[siteId]/[unitId]/[equipmentId]` (`components/views/equipment-home.tsx`) | "Run history" link (shown when a scenario exists) jumps to this equipment's What-If run history | Clicking opens `/tools/what-if` with the History tab active for this equipment and closes the popup. |
| `/assets/equipment/[siteId]/[unitId]/[equipmentId]` (`components/views/equipment-home.tsx`) | Viewed Data auto-selects a specific What-If run instead of Live Data via a pending compare request | After "compare on dashboard" from What-If, the next popup opened for that equipment shows only that run checked. |
| `/assets/equipment/[siteId]/[unitId]/[equipmentId]` (`components/views/equipment-home.tsx`) | "Open in N other tabs" text badge in the popup header signals cross-tab viewing | Badge text appears almost instantly in the popup header when the dashboard's Full-Screen Viewer opens elsewhere. |
| `/equipment-dashboard/[equipmentId]/[tag]/full` (`app/equipment-dashboard/[equipmentId]/[tag]/full/page.tsx`) | Legacy dashboard URL automatically redirects to the canonical Full-Screen Viewer route | Visiting the legacy URL replaces it with `/dashboards/<resolved-id>/full`, or `/dashboard` if unresolved. |

## Dashboard Popup (read-only preview overlay)

*This overlay is used from the Dashboard module's list views (with the full Comments/Publish/Edit/Share toolbar below); the Equipment Home Page opens the same underlying grid with a different toolbar (see previous section: Generate Report / Share Report / Viewed Data / Open in new tab).*

| Location | Feature | Success Criteria |
|---|---|---|
| `/dashboard` (`components/workspace/dashboard-popup.tsx`) | Clicking a dashboard card (or its menu's Open item) in the Dashboard grid opens the read-only popup | Popup overlay opens showing the clicked dashboard's name, owner, status badge, and widgets. |
| `/dashboard` (`components/workspace/dashboard-popup.tsx`) | `/dashboard?d=<id>` URL deep-link auto-opens the matching dashboard's read-only popup on load | Loading that URL opens the popup automatically, then the URL reverts to plain `/dashboard`. |
| `/dashboard` (`components/workspace/dashboard-popup.tsx`) | Close the popup via its X button or by clicking the dark backdrop | Either action dismisses the overlay. |
| `/dashboard` (`components/workspace/dashboard-popup.tsx`) | "Comments" button toggles a side panel to view and post comments on the dashboard | With comment access, panel opens and a typed comment posts; otherwise a "Request comment access" dialog opens. |
| `/dashboard` (`components/workspace/dashboard-popup.tsx`) | "Publish"/"Unpublish" button toggles the dashboard's lifecycle status (owner-only action) | Owner sees the Draft/Published badge flip with a success toast; non-owners get a "Request edit access" dialog. |
| `/dashboard` (`components/workspace/dashboard-popup.tsx`) | "Edit" button opens the dashboard editor for users holding edit permission | Permitted users land on `/dashboard/dashboard/<id>/edit`; others see a "Request edit access" dialog. |
| `/dashboard` (`components/workspace/dashboard-popup.tsx`) | "Share" button opens the Share dialog for users holding share permission | Permitted users see the Share dialog open; others see a "Request edit access" dialog instead. |
| `/dashboard` (`components/workspace/dashboard-popup.tsx`) | Popup body renders the dashboard's widgets read-only via the shared grid | Widgets render in the same non-editable layout as the dashboard editor, scoped to this dashboard. |
| `/dashboard` (`components/workspace/dashboard-popup.tsx`) | Hovering a widget reveals an Expand icon that opens a full-viewport widget lightbox | Lightbox shows the enlarged widget; closes via its X button or backdrop click. |

## Full-Screen Dashboard Viewer

| Location | Feature | Success Criteria |
|---|---|---|
| `/dashboards/[dashboardId]/full` (`app/dashboards/[dashboardId]/full/page.tsx`) | Chromeless full-screen page renders the dashboard's widgets read-only via the shared grid | Widgets fill the viewport edge-to-edge with no side navigation, in a non-editable layout. |
| `/dashboards/[dashboardId]/full` (`app/dashboards/[dashboardId]/full/page.tsx`) | Hovering a widget reveals an Expand icon that opens a full-viewport widget lightbox | Lightbox shows the enlarged widget; closes via its X button, backdrop click, or Escape. |
| `/dashboards/[dashboardId]/full` (`app/dashboards/[dashboardId]/full/page.tsx`) | "Print / PDF" button triggers the browser's native print dialog | Clicking opens the OS print dialog; the page header is hidden from the printed/PDF output. |
| `/dashboards/[dashboardId]/full` (`app/dashboards/[dashboardId]/full/page.tsx`) | "Open in Dashboard" link navigates to the general Dashboard module list | Clicking navigates the browser to `/dashboard` (root list, not scoped to this specific dashboard). |
| `/dashboards/[dashboardId]/full` (`app/dashboards/[dashboardId]/full/page.tsx`) | Opening this page registers a live cross-tab viewer session (JOIN/HEARTBEAT/LEAVE broadcasts) | Equipment Home's "open elsewhere" badge for this dashboard appears almost instantly; disappears on close (or within 15s if abrupt). |

## Dashboard Widget Catalog

*The shared rendering engine used by the Dashboard editor and every read-only viewer above.*

| Location | Feature | Success Criteria |
|---|---|---|
| Widget Library (`components/catalog-module-library.tsx`) | Parameters section lists all 13 Coker parameters, grouped by category | Sidebar's Parameters tab shows 13 named rows (Temperature…Crack) under Operational Inputs / Inspection / Analysis Outputs headers. |
| Widget Library (`components/catalog-module-library.tsx`) | Reference & Tools section lists the 5 non-parameter tool widgets | Reference & Tools tab shows Equipment Data, 3D Model, Sensor Location, Time Range, and Cycle Selector rows. |
| Widget Library (`components/catalog-module-library.tsx`) | Search box filters the active tab's list by parameter/widget name, key, or unit | Typing e.g. "temp" narrows the list to matching rows only; clearing the field restores the full list. |
| Widget Library (`components/catalog-module-library.tsx`) | Parameters / Reference & Tools tab switch changes which widget list is displayed | Clicking the inactive tab underlines it and swaps the visible list; each tab retains its own search filter. |
| Widget Library (`components/workspace/dashboard-editor.tsx`) | Dragging or clicking a Parameter row opens the 3-step widget creation popup | Dropping or clicking e.g. Temperature opens the config popup at Step 1 instead of adding a tile immediately. |
| Widget creation popup (`components/dashboard/widget-config-popup.tsx`) | Step 1 — choose one of the parameter's valid visual types | Card grid shows only that parameter's allowed visual types; selecting one highlights it and Next remains clickable. |
| Widget creation popup (`components/dashboard/widget-config-popup.tsx`) | Step 2 — configure visual-type options (aggregation, time range, group-by, top N, filter) | Clicking an option (e.g. Max) highlights it and is saved to the widget's config. |
| Widget creation popup (`components/dashboard/widget-config-popup.tsx`) | Step 3 — name the widget and confirm creation | Clicking "Add Widget" appends a tile sized for the visual type to the grid; a blank title falls back to the parameter name. |
| Widget Library (`components/workspace/dashboard-editor.tsx`) | Dragging or clicking a Reference & Tools row places the widget directly, with no popup | Dropping or clicking e.g. Equipment Data immediately adds a populated tile to the grid with no dialog shown. |
| Dashboard rendering (`components/dashboard/coker-template-view.tsx`) | KPI Card visual type — single labeled value tile (Temperature, Pressure, Coke Level, PSLF, etc.) | Tile shows a bold numeric value with unit and label, e.g. "Max Temperature Sensor 1 — 43.28 °C". |
| Dashboard rendering (`components/dashboard/coker-template-view.tsx`) | Time Series visual type — line chart of sensor/parameter values over a date window | Chart renders a dated axis and colored line(s); hovering a point shows a tooltip with its exact value. |
| Dashboard rendering (`components/dashboard/coker-template-view.tsx`) | Bar Chart visual type — sensor comparison or Fatigue Damage-by-elevation bars | Colored bars render per category with axis labels; hovering a bar shows a tooltip with its value. |
| Dashboard rendering (`components/dashboard/coker-template-view.tsx`) | Gauge visual type — current value against colored zone thresholds (Coke Level, Remaining Life) | Zone-colored bar renders with a tick marker at the current value and a numeric readout above it. |
| Dashboard rendering (`components/dashboard/coker-template-view.tsx`) | Area Chart visual type — cumulative Fatigue Damage trend across drum cycles | Filled gradient area chart renders 12 cycle points; hovering shows a tooltip with the damage % for that cycle. |
| Dashboard rendering (`components/dashboard/coker-template-view.tsx`) | Heatmap visual type — real shell inspection image (Bulging, Fatigue Damage) | Tile displays the actual inspection image scaled to fit, not a broken-image state. |
| Dashboard rendering (`components/dashboard/coker-template-view.tsx`) | Damage Table visual type — ranked top fatigue-damage locations | Table lists 5 rows with Damage %, Azimuth, Elevation, Direction, and Group columns populated from mock data. |
| Dashboard rendering (`components/dashboard/coker-template-view.tsx`) | Severity Table visual type — bulging severity ranked by PSLF / likelihood | Table lists 4 rows, each with a PSLF value and a colored LIKELY/POSSIBLE/UNLIKELY badge. |
| Dashboard rendering (`components/dashboard/coker-template-view.tsx`) | Ovality Chart visual type — polar cross-section of measured vs. nominal bore | Radar-style plot renders dashed "Nominal" and solid "Measured" rings with a legend; hovering shows the mm value. |
| Dashboard rendering (`components/dashboard/coker-template-view.tsx`) | Polar Plot visual type — directional Displacement values (N, NE, E … NW) | 8-point radar chart renders a filled displacement shape; hovering a vertex shows a tooltip with its mm value. |
| Dashboard rendering (`components/dashboard/coker-template-view.tsx`) | Crack Table visual type — crack/flaw list with Lr / Kr FAD values | Table lists 3 rows with Location, Cycle, Zone, Elevation, Lr, and Kr columns populated from mock data. |
| Dashboard rendering (`components/dashboard/coker-template-view.tsx`) | FAD Chart visual type — Failure Assessment Diagram (Lr vs. Kr envelope and points) | Line chart renders the FAD envelope curve plus red assessment-point markers for each crack row. |
| Dashboard rendering (`components/dashboard/coker-template-view.tsx`) | Unwrapped Map visual type — crack inspection shell map image | Tile displays the actual crack-inspection image with a "C1–C11 · shell" footnote label. |
| Dashboard rendering (`components/dashboard/coker-template-view.tsx`) | Equipment Data reference widget — fixed asset property table | Zebra-striped table lists 8 rows: Asset Name, Shell Diameter, Thickness, Height, Last Inspection, Cycles, Damage. |
| Dashboard rendering (`components/dashboard/coker-template-view.tsx`) | 3D Model reference widget — static coker drum shell illustration | Tile displays a scaled illustration image (static, not an interactive 3D viewer). |
| Dashboard rendering (`components/dashboard/coker-template-view.tsx`) | Time Range reference widget — displays the selected duration and date window | Tile shows "Duration: Last 7 days", a from/to date range, and a filled progress bar. |
| Dashboard rendering (`components/dashboard/coker-template-view.tsx`) | Cycle Selector reference widget — displays the current drum cycle and status | Tile shows a cycle number, its date/time window, and a green "Nominal" status dot. |
| Read-only grids (`components/dashboard/widget-focus-overlay.tsx`) | Hover-reveal expand button appears on read-only dashboard tiles only, not the editor | Hovering a tile in a read-only dashboard fades in a Maximize2 button bottom-right; it is absent in the editor. |
| Read-only grids (`components/dashboard/widget-focus-overlay.tsx`) | Clicking the expand button opens the widget full-size in a modal lightbox | A centered modal (up to 5xl width, 90vh height) opens showing the same widget content enlarged, with a title header. |
| Read-only grids (`components/dashboard/widget-focus-overlay.tsx`) | Dismiss the focus lightbox via header × button or backdrop click | Clicking the × or anywhere outside the modal card closes it; clicking inside the card leaves it open. |
| Dashboard rendering (`components/ai/feature6-ai-insight-overlay.tsx`) | AI Insight badge overlay on Damage / Re-Life / Date / ID KPI tiles | With AI Insight toggled on, a purple spark badge appears on each KPI tile; clicking it opens a popover with analysis text. |
| Dashboard rendering (`components/ai/feature6-ai-insight-overlay.tsx`) | AI anomaly markers overlaid on the Fatigue Trend line chart | With AI Insight on, two dashed flag markers appear on the chart; hovering each shows a tooltip describing the anomaly. |
| Dashboard rendering (`components/ai/feature6-ai-insight-overlay.tsx`) | AI threshold line overlaid on the Cycle Count bar chart | With AI Insight on, a dashed red "AI Threshold" line renders horizontally across the chart at a fixed level. |

## Dashboard Module — Navigation & Organization

| Location | Feature | Success Criteria |
|---|---|---|
| `/dashboard` (`components/workspace/folder-tree.tsx`) | Module rail "All dashboards" link | Click routes to `/dashboard` and highlights the row as active. |
| `/dashboard` (`components/workspace/folder-tree.tsx`) | Module rail "Shared with me" link; badge shows count of active incoming shares | Click routes to `/dashboard/shared`; badge number equals your non-revoked incoming shares. |
| `/dashboard` (`components/workspace/folder-tree.tsx`) | Module rail "Recent" link | Click routes to `/dashboard/recent`. |
| `/dashboard` (`components/workspace/folder-tree.tsx`) | Module rail "Trash" link; badge shows count of soft-deleted dashboards | Click routes to `/dashboard/trash`; badge appears once any dashboard is trashed. |
| `/dashboard` (`components/workspace/folder-tree.tsx`) | "+" button creates a root-level folder (server-persisted when signed in) | New "New folder" item appears in the tree already in inline-rename mode. |
| `/dashboard` (`components/workspace/folder-tree.tsx`) | Clicking a folder row navigates into it | URL becomes `/dashboard/folder/[id]`; grid shows only that folder's dashboards. |
| `/dashboard` (`components/workspace/folder-tree.tsx`) | Chevron expands/collapses a folder's children | Clicking it shows or hides nested subfolders beneath that row. |
| `/dashboard` (`components/workspace/folder-tree.tsx`) | Folder menu → Rename, inline edit committed on blur/Enter (server-persisted when signed in) | Typing a new name and pressing Enter updates the folder's label in the tree. |
| `/dashboard` (`components/workspace/folder-tree.tsx`) | Folder menu → New subfolder (server-persisted when signed in) | Parent auto-expands; a new child folder appears in rename mode. |
| `/dashboard` (`components/workspace/folder-tree.tsx`) | Folder menu → Delete folder, with a confirm dialog (server-persisted when signed in) | Confirming removes the folder/subfolders; their dashboards move to root, not deleted. |
| `/dashboard` (`components/workspace/folder-tree.tsx`) | Drag a folder onto another folder row to reparent it | Dropped folder nests under the target; dropping onto its own descendant is blocked. |
| `/dashboard` (`components/workspace/folder-tree.tsx`) | Drag a dashboard card onto a folder row, or onto "All dashboards" for root | Dashboard's folder updates immediately (server-persisted when signed in). |
| `/dashboard` (`components/workspace/folder-tree.tsx`) | Module rail search box filters virtual rows and folders by name | Typing hides non-matching rows; matched folders keep their ancestor chain visible. |
| `/dashboard` (`components/workspace/workspace-toolbar.tsx`) | Search box filters the active view's dashboards by name; applies on every view incl. Trash | Typing a substring narrows the grid; the "x" button clears the query. |
| `/dashboard` (`components/workspace/workspace-toolbar.tsx`) | Filters popover: equipment, status (draft/published), creator, contributor, changed-date range | Setting any filter narrows the grid; the Filters button shows an active-count badge. |
| `/dashboard` (`components/workspace/workspace-toolbar.tsx`) | Active filters render as removable chips, plus a "Clear all" link | Clicking a chip's x drops that filter; "Clear all" resets every filter at once. |
| `/dashboard` (`components/workspace/workspace-toolbar.tsx`) | Sort dropdown: Last change/Name/Created/Equipment, ascending or descending | Choosing a key/direction reorders the visible grid immediately. |
| `/dashboard` (`components/workspace/workspace-toolbar.tsx`) | "New dashboard" button opens the Create dialog; shown on All/Folder/Recent, hidden on Shared/Trash | Button is absent only when viewing Shared or Trash; click opens the dialog. |
| `/dashboard` (`components/workspace/create-dashboard-dialog.tsx`) | Create dialog: dashboard name field plus an equipment picker (all sites' equipment) | "Create & open editor" stays disabled until name is non-empty and equipment is chosen. |
| `/dashboard` (`components/workspace/create-dashboard-dialog.tsx`) | Submitting creates the dashboard (server-persisted when signed in) and opens the editor | New card appears in the list; browser navigates to `/dashboard/dashboard/[id]/edit`. |
| `/dashboard` (`components/workspace/create-dashboard-dialog.tsx`) | "Cancel" closes the dialog without creating anything | Dialog closes and no new dashboard card appears in the grid. |
| `/dashboard` (`app/dashboard/page.tsx`) | "All dashboards" view lists every non-deleted dashboard you own | Grid shows only dashboards where you're the owner; shared/foreign ones never appear. |
| `/dashboard` (`components/workspace/workspace-page.tsx`) | Empty state "No dashboards yet" with a "Create dashboard" button | With zero owned dashboards, the CTA shows and opens the Create dialog. |
| `/dashboard` (`components/workspace/workspace-page.tsx`) | `?d=<dashboardId>` URL param auto-opens that dashboard's popup viewer on load | Visiting `/dashboard?d=<id>` pops the viewer open and strips the param from the URL. |
| `/dashboard` (`components/workspace/workspace-page.tsx`) | Arriving at `/dashboard` with a pending equipment filter (set by another module) auto-applies it | Grid opens pre-filtered to that equipment; Filters button shows 1 active filter. |
| `/dashboard` (`components/workspace/dashboard-card.tsx`) | Click a card's thumbnail/title, or menu → Open, to view it | Opens a full-screen popup viewer over the grid (not the editor). |
| `/dashboard` (`components/workspace/dashboard-card.tsx`) | Menu → Edit navigates to the dashboard editor | Enabled only with edit permission; click routes to `/dashboard/dashboard/[id]/edit`. |
| `/dashboard` (`components/workspace/dashboard-card.tsx`) | Menu → Rename switches the card title to an inline text field | Enter/blur saves the new name (server-persisted when signed in); Escape cancels. |
| `/dashboard` (`components/workspace/dashboard-card.tsx`) | Menu → Duplicate clones the dashboard, even one only shared with you | A `"Copy of <name>"` draft owned by you appears in the same folder. |
| `/dashboard` (`components/workspace/dashboard-card.tsx`) | Menu → "Move to" submenu lists Root plus all your folders | Picking a folder moves the dashboard there (server-persisted when signed in). |
| `/dashboard` (`components/workspace/dashboard-card.tsx`) | Menu → "Publish to Asset Module" (owner-only) marks a draft published | Card's badge flips Draft→Published; dashboard becomes visible on its Equipment Home page. |
| `/dashboard` (`components/workspace/dashboard-card.tsx`) | Menu → Unpublish (owner-only) reverts a published dashboard to draft | Badge flips Published→Draft; dashboard no longer shows in the Asset Module. |
| `/dashboard` (`components/workspace/dashboard-card.tsx`) | Menu → "Move to trash" (owner-only) soft-deletes the dashboard | Card disappears from the current view and appears under Trash. |
| `/dashboard` (`components/workspace/dashboard-card.tsx`) | Thumbnail shows a Draft/Published status chip | Chip label/color matches lifecycle status and flips right after publish/unpublish. |
| `/dashboard/folder/[folderId]` (`components/workspace/workspace-page.tsx`) | Breadcrumb ("All dashboards" > parent folders) shown while viewing a folder | Clicking a crumb switches the grid to that level; the URL itself does not change. |
| `/dashboard/folder/[folderId]` (`app/dashboard/folder/[folderId]/page.tsx`) | Folder view lists only your dashboards placed directly in that folder | Opening a folder shows just its own dashboards, excluding subfolder contents. |
| `/dashboard/folder/[folderId]` (`components/workspace/workspace-page.tsx`) | Empty folder shows a "Create dashboard" CTA that targets this folder | Submitting the Create dialog from here places the new dashboard in this folder. |
| `/dashboard/shared` (`app/dashboard/shared/page.tsx`) | "Shared with me" lists dashboards others actively shared with you, each badged with your permission | Grid shows only non-revoked incoming shares; badge reads "Shared (view/comment/edit)". |
| `/dashboard/shared` (`components/workspace/dashboard-card.tsx`) | Shared-with-me cards never offer "Move to"; Publish/Unpublish/Move-to-trash stay disabled | On a shared card, Move-to is absent and Publish/Trash items are greyed out. |
| `/dashboard/recent` (`app/dashboard/recent/page.tsx`) | "Recent" lists dashboards opened via the popup viewer, most-recent-first, capped at 20 | Opening a dashboard puts it at the top of Recent; the list never exceeds 20 entries. |
| `/dashboard/trash` (`app/dashboard/trash/page.tsx`) | "Trash" lists your soft-deleted dashboards from the last 30 days | Only dashboards you own with `deletedAt` set within 30 days appear here. |
| `/dashboard/trash` (`components/workspace/dashboard-card.tsx`) | Menu → Restore brings a trashed dashboard back | Card leaves Trash and reappears in All Dashboards or its original folder. |
| `/dashboard/trash` (`components/workspace/dashboard-card.tsx`) | Menu → "Delete permanently", with a confirm dialog, erases it for good | Confirming removes the card immediately and irreversibly, including its shares/comments. |
| `/dashboard/trash` (`components/workspace/workspace-page.tsx`) | Empty-Trash copy states the 30-day auto-removal policy | With nothing trashed, the page reads "stay here for 30 days before being permanently removed." |
| `/dashboard/parameter-requests` (`app/dashboard/parameter-requests/page.tsx`) | Non-Product-Team users see an access notice instead of the queue | Signed in as another role, the page shows the notice plus a working "Back to Dashboard" link. |
| `/dashboard/parameter-requests` (`app/dashboard/parameter-requests/page.tsx`) | Product-Team queue lists submitted parameter requests (id, status, body, equipment) | Signed in as Product Team, every submitted request shows with a live total count. |
| `/dashboard/parameter-requests` (`app/dashboard/parameter-requests/page.tsx`) | "Acknowledge" button on a submitted request (client-side status change) | Clicking flips that request's status chip from submitted to acknowledged. |
| `/dashboard/parameter-requests` (`app/dashboard/parameter-requests/page.tsx`) | "Close" button on any non-closed request (client-side status change) | Clicking flips that request's status chip to closed and hides its action buttons. |

## Dashboard Module — Editor

| Location | Feature | Success Criteria |
|---|---|---|
| `/dashboard/dashboard/[dashboardId]/edit` (`components/workspace/dashboard-editor.tsx`) | Insufficient-permission gate blocks the editor UI | Users below edit permission see "Edit access required" screen with Back / "View only" buttons. |
| `/dashboard/dashboard/[dashboardId]/edit` (`lib/workspace/use-edit-lock.ts`) | Cross-tab edit lock auto-acquires on open | Header shows "Acquiring lock…" then "Editor lock held" after a 250ms probe finds no other tab holding it. |
| `/dashboard/dashboard/[dashboardId]/edit` (`components/workspace/dashboard-editor.tsx`) | Lock-denied toast when another tab is editing | Opening the editor in a 2nd tab (same browser) shows toast "This dashboard is being edited at the moment". |
| `/dashboard/dashboard/[dashboardId]/edit` (`components/workspace/dashboard-editor.tsx`) | Lock-denied full-screen block replaces the editor | Denied tab shows Lock icon, Back, and "Open read-only" instead of the grid. |
| `/dashboard/dashboard/[dashboardId]/edit` (`components/workspace/dashboard-editor.tsx`) | Inline dashboard title rename | Click pencil to edit; Enter/blur stages new name (dirty), Escape reverts; persisted only via Save. |
| `/dashboard/dashboard/[dashboardId]/edit` (`components/workspace/dashboard-editor.tsx`) | Save button persists widgets, context, and title | Fires concurrent PATCH `/api/workspace/dashboards/{id}` calls; toast "Dashboard saved"; disabled unless dirty. |
| `/dashboard/dashboard/[dashboardId]/edit` (`components/workspace/dashboard-editor.tsx`) | Back button discards unsaved edits | `router.back()` fires with no save call; in-progress widget/layout/title changes are lost. |
| `/dashboard/dashboard/[dashboardId]/edit` (`components/workspace/dashboard-editor.tsx`) | Unsaved-changes browser warning | Native "leave site?" confirm appears via `beforeunload` when dirty and the tab is closed/reloaded. |
| `/dashboard/dashboard/[dashboardId]/edit` (`components/workspace/dashboard-editor.tsx`) | Publish button (draft → published) | Owner: PATCH flips label to Published; non-owner editor gets 403 "Only the owner can change publish state". |
| `/dashboard/dashboard/[dashboardId]/edit` (`components/workspace/dashboard-editor.tsx`) | Unpublish button (published → draft) | Owner: PATCH flips label to Draft; same server-side owner-only 403 enforcement. |
| `/dashboard/dashboard/[dashboardId]/edit` (`components/workspace/dashboard-editor.tsx`) | Drag a Parameter item (Coker) onto the grid via HTML5 drag-and-drop | Drop opens the 3-step Widget Config popup at the drop cell; confirming inserts the widget there. |
| `/dashboard/dashboard/[dashboardId]/edit` (`components/workspace/dashboard-editor.tsx`) | Drag a Reference/Tool item (Coker) onto the grid | Widget is placed directly at the drop cell, no popup; grid marks unsaved (dirty). |
| `/dashboard/dashboard/[dashboardId]/edit` (`components/workspace/dashboard-editor.tsx`) | Drag a legacy module (non-Coker equipment) onto the grid | Widget placed directly at drop cell using its default library size; dirty. |
| `/dashboard/dashboard/[dashboardId]/edit` (`components/workspace/dashboard-editor.tsx`) | Reposition a placed widget by dragging within the grid | Tile visibly moves to the new x/y position; Save required to persist. |
| `/dashboard/dashboard/[dashboardId]/edit` (`components/workspace/dashboard-editor.tsx`) | Resize a placed widget via its drag handle | Tile visibly resizes bounded by its minW/minH; Save required to persist. |
| `/dashboard/dashboard/[dashboardId]/edit` (`components/workspace/dashboard-editor.tsx`) | Remove a widget via its hover trash icon | Widget disappears from the grid immediately; requires Save to persist removal. |
| `/dashboard/dashboard/[dashboardId]/edit` (`components/workspace/dashboard-context-bar.tsx`) | Context bar Duration select (Coker only: 7d/30d/custom) | Selecting a value updates local dashboard context and marks dirty; persisted on Save. |
| `/dashboard/dashboard/[dashboardId]/edit` (`components/workspace/dashboard-context-bar.tsx`) | Context bar Cycle ID input (Coker only) | Editing then blurring updates the cycle ID locally; persisted on Save. |
| `/dashboard/dashboard/[dashboardId]/edit` (`components/dashboard/widget-config-popup.tsx`) | Widget Config popup — 3-step create flow (visual type → configure → name) | "Add Widget" inserts the configured widget into the grid; Cancel/Back available at each step. |
| `/dashboard/dashboard/[dashboardId]/edit` (`components/module-library.tsx`) | Legacy Widget Library search box | Typing narrows the visible module list live by name match. |
| `/dashboard/dashboard/[dashboardId]/edit` (`components/module-library.tsx`) | Legacy Widget Library category tabs | Clicking a category (Asset Efficiency/Information/Event/Other) filters the module list to it. |
| `/dashboard/dashboard/[dashboardId]/edit` (`components/module-library.tsx`) | Legacy Widget Library click-to-add (no drag) | Clicking a module row appends it to the bottom of the grid instantly. |
| `/dashboard/dashboard/[dashboardId]/edit` (`components/catalog-module-library.tsx`) | Catalog (Coker) Widget Library search box | Typing filters parameters/reference items by display name, key, or unit live. |
| `/dashboard/dashboard/[dashboardId]/edit` (`components/catalog-module-library.tsx`) | Catalog Widget Library section tabs (Parameters / Reference & Tools) | Clicking a tab switches the listed items; parameters grouped under Operational/Inspection/Analysis headers. |
| `/dashboard/dashboard/[dashboardId]/edit` (`components/catalog-module-library.tsx`) | Catalog Widget Library click-to-add a Parameter (no drag) | Click opens the 3-step Widget Config popup; confirming appends the widget to the grid bottom. |
| `/dashboard/dashboard/[dashboardId]/edit` (`components/catalog-module-library.tsx`) | Catalog Widget Library click-to-add a Reference/Tool item (no drag) | Click appends the widget directly to the grid bottom at its default size. |

## Dashboard Module — Sharing

| Location | Feature | Success Criteria |
|---|---|---|
| Share dialog (`components/workspace/share-dialog.tsx`) | People / Link tabs switch sharing mode | Clicking a tab swaps the panel between named-user sharing and link management; defaults to People. |
| Share dialog (`components/workspace/share-dialog.tsx`) | "Add a person" search/typeahead by name or email | Typing shows up to 8 matching org members, excluding self, owner, and existing recipients. |
| Share dialog (`components/workspace/share-dialog.tsx`) | Select a candidate from the typeahead dropdown | Dropdown closes; user appears staged with avatar/name/email and an unstage (X) control. |
| Share dialog (`components/workspace/share-dialog.tsx`) | Permission selector (View/Comment/Edit) for the staged recipient | Clicking a pill highlights it and sets the permission included in the invite. |
| Share dialog (`components/workspace/share-dialog.tsx`) | Optional invite message (500-char cap) | Live character counter updates; text is included in the send request. |
| Share dialog (`components/workspace/share-dialog.tsx`) | "Notify me on first view" toggle | Switch sets local state sent as `notifyOnFirstView`; enables the first-view notification flow. |
| Share dialog (`components/workspace/share-dialog.tsx`) | "Send" button creates the share invite | POST `/api/workspace/shares` creates a DashboardShare + notification; owner succeeds, non-owner editor gets 403. |
| Share dialog (`components/workspace/share-dialog.tsx`) | Existing-share permission dropdown | PATCH `/api/workspace/shares/{id}` (owner-only) updates permission; row updates immediately. |
| Share dialog (`components/workspace/share-dialog.tsx`) | Existing-share revoke (X) button | PATCH `/api/workspace/shares/{id}` (owner-only) sets `revokedAt`; recipient disappears from "People with access". |
| Share dialog (`components/workspace/share-dialog.tsx`) | Link-tab permission selector for new links | Selecting View/Comment/Edit sets the permission applied to the next created link. |
| Share dialog (`components/workspace/share-dialog.tsx`) | "Create link" button | POST `/api/workspace/share-links` (owner-only) creates a ShareLink with a random token; appears under "Active links". |
| Share dialog (`components/workspace/share-dialog.tsx`) | Link URL field selects all text on click | Clicking the read-only input selects its full value for manual copying. |
| Share dialog (`components/workspace/share-dialog.tsx`) | Copy-to-clipboard button per link | `navigator.clipboard.writeText` copies the URL; button shows "Copied" + toast for 1.5s. |
| Share dialog (`components/workspace/share-dialog.tsx`) | "Regenerate" button rotates a link's token | POST `.../share-links/{id}/regenerate` (owner-only) replaces the token; old URL then 404s on resolve. |
| Share dialog (`components/workspace/share-dialog.tsx`) | "Revoke" button invalidates a link | PATCH `/api/workspace/share-links/{id}` (owner-only) sets `revokedAt`; link removed from Active list. |
| `app/api/workspace/shares/[shareId]/first-view/route.ts` | Recipient's first open of a shared dashboard is recorded | POST `.../first-view` sets `firstViewedAt`; if `notifyOnFirstView` was set, creates a `dashboard_first_view` notification. |

## Dashboard Module — Comments & Access Requests

| Location | Feature | Success Criteria |
|---|---|---|
| Comments panel (`components/workspace/comments-panel.tsx`) | View the comment thread | Lists each comment's author avatar/name, timestamp, body, oldest-first; shows "No comments yet" when empty. |
| Comments panel (`components/workspace/comments-panel.tsx`) | Post a new comment | POST `/api/workspace/dashboards/{id}/comments` creates a comment (needs ≥ comment access); no notification is created. |
| Comments panel (`components/workspace/comments-panel.tsx`) | Ctrl/Cmd+Enter submits the comment box | Pressing the shortcut while focused posts the comment same as clicking "Post". |
| Comments panel (`components/workspace/comments-panel.tsx`) | "Request comment access" button for view-only users | Replaces the composer below comment permission; click opens the Access Request dialog pre-set to "comment". |
| Access request dialog (`components/workspace/access-request-dialog.tsx`) | Dialog opens pre-labeled for the requested permission | Title/body read "Request comment access" or "Request edit access", naming the dashboard and owner. |
| Access request dialog (`components/workspace/access-request-dialog.tsx`) | Optional note textarea (500-char cap) | Live counter updates; text sent as the request message when present. |
| Access request dialog (`components/workspace/access-request-dialog.tsx`) | "Request" submit button | POST `/api/workspace/permission-requests` creates a pending request and notifies the owner; toast confirms; dialog closes. |
| Access request dialog (`components/workspace/access-request-dialog.tsx`) | Duplicate-pending-request guard | If a pending request for the same dashboard+permission exists, submit shows an info toast and skips the request. |
| Access request dialog (`components/workspace/access-request-dialog.tsx`) | "Cancel" button dismisses without submitting | Dialog closes immediately; no request is sent; note text resets when reopened. |

## Share Link Landing Page

| Location | Feature | Success Criteria |
|---|---|---|
| `/share/[token]` (`app/share/[token]/page.tsx`) | Visiting a share link resolves the token and dashboard | Signed-in: `GET /api/workspace/share-link/resolve`; signed-out: looked up against local seed links — a valid link shows the dashboard preview screen. |
| `/share/[token]` (`app/share/[token]/page.tsx`) | Loading state while resolving | Spinner + "Resolving link…" shows until the lookup completes. |
| `/share/[token]` (`app/share/[token]/page.tsx`) | "Link not available" guard for invalid/expired/revoked tokens | Shows "Link not available" with a "Go to Dashboard" button instead of a preview. |
| `/share/[token]` (`app/share/[token]/page.tsx`) | "Dashboard unavailable" guard when the linked dashboard was deleted | Shows "Dashboard unavailable" with a "Go to Dashboard" button instead of a preview. |
| `/share/[token]` (`app/share/[token]/page.tsx`) | "Not authorised" guard for non-org-member viewers | A signed-in user who isn't a seeded org member sees "Not authorised" instead of the dashboard. |
| `/share/[token]` (`app/share/[token]/page.tsx`) | "Open dashboard" button accepts the share | Authenticated: POST `/api/workspace/share-link/accept` creates a DashboardShare; signed-out: a local mock share is created — dashboard preview then renders. |
| `/share/[token]` (`app/share/[token]/page.tsx`) | Post-accept "Open editor" button (shown only when the link grants edit permission) | Click navigates to `/dashboard/dashboard/[dashboardId]/edit`. |
| `/share/[token]` (`app/share/[token]/page.tsx`) | Post-accept "Go to Dashboard" button | Click navigates to `/dashboard/shared`. |
| `/share/[token]` (`app/share/[token]/page.tsx`) | Post-accept dashboard preview renders the shared dashboard read-only | Widgets render via the shared read-only grid, matching the dashboard's saved layout. |

## Tools — What-If Scenario

| Location | Feature | Success Criteria |
|---|---|---|
| `/tools/what-if` (`components/views/whatif-tool-view.tsx`) | Equipment filter dropdown scopes scenario list to one equipment | Selecting an equipment filters the card grid to it; breadcrumb and "Active equipment" label show its name. |
| `/tools/what-if` (`components/views/whatif-tool-view.tsx`) | "Reset filter" button clears the equipment filter | Click restores "All equipment"; card grid shows scenarios for every equipment again. |
| `/tools/what-if` (`components/views/whatif-tool-view.tsx`) | Scenario search box filters cards by equipment or scenario name | Typing a query narrows the grid to matches; unmatched query shows a "no scenarios match" message. |
| `/tools/what-if` (`components/views/whatif-tool-view.tsx`) | Click a scenario card to open its detail panel | Detail panel opens on the Overview tab for that scenario, showing its description and stats. |
| `/tools/what-if` (`components/views/whatif-tool-view.tsx`) | Running indicator (spinner) on a scenario card | Card shows an animated spinner icon whenever that scenario has a session with status "running". |
| `/tools/what-if` (`components/views/whatif-tool-view.tsx`) | "Back to [equipment] scenarios" / "All scenarios" link | Click returns from scenario detail to the card grid, keeping the active equipment filter. |
| `/tools/what-if` (`components/views/whatif-tool-view.tsx`) | "Run Now" button in scenario detail header | Click switches directly to the Configure & Run tab. |
| `/tools/what-if` (`components/views/whatif-tool-view.tsx`) | Overview / Configure & Run / History tab bar | Clicking a tab swaps panel content; History tab label shows the live run count for that scenario. |
| `/tools/what-if` (`components/views/whatif-tool-view.tsx`) | Overview stats cards — Total Runs, Successful, Dashboards Available | Counts recompute from run history live; Total Runs increases by one after each new run. |
| `/tools/what-if` (`components/views/whatif-tool-view.tsx`) | Click a card in "Available Result Dashboards" (Overview tab) | Navigates to Equipment Home for that equipment with the selected dashboard opened automatically. |
| `/tools/what-if` (`components/views/whatif-tool-view.tsx`) | "Publish dashboards in Workspace" link (shown when none published yet) | Sets the equipment as the Dashboard-module filter and navigates to `/dashboard`. |
| `/tools/what-if` (`components/views/whatif-tool-view.tsx`) | Parameter input method selector — Full CSV / Per-parameter CSV / Type values / Mixed | Selecting a mode highlights it and shows/hides the matching upload or value-entry sections below. |
| `/tools/what-if` (`components/views/whatif-tool-view.tsx`) | Full equipment CSV dropzone (click-to-browse or drop) | Choosing a .csv file swaps the dropzone for a checkmark and the uploaded file's name. |
| `/tools/what-if` (`components/views/whatif-tool-view.tsx`) | Per-parameter CSV upload button on each parameter row | Selecting a file changes that row's button text from "Upload CSV…" to the chosen file name. |
| `/tools/what-if` (`components/views/whatif-tool-view.tsx`) | Scenario Name text field | Typed text is reflected in the field and becomes the run's name shown in History and Results. |
| `/tools/what-if` (`components/views/whatif-tool-view.tsx`) | Production Unit dropdown (Plant 1 / Plant 2) | Selecting an option updates the field's displayed value. |
| `/tools/what-if` (`components/views/whatif-tool-view.tsx`) | Calculation Method dropdown (IEC 12345-6-789 / API 579) | Selecting an option updates the field's displayed value. |
| `/tools/what-if` (`components/views/whatif-tool-view.tsx`) | "Re-compute pressure" checkbox | Clicking toggles the checkbox between checked and unchecked. |
| `/tools/what-if` (`components/views/whatif-tool-view.tsx`) | Editable parameter value inputs, one per scenario default parameter | Typing a new value updates the field and is carried into the run's saved parameter values shown in Results. |
| `/tools/what-if` (`components/views/whatif-tool-view.tsx`) | "Run What-If Scenarios" button starts the simulation | Plays a 5-step progress overlay (ingest → validate → run engine → compute datasets → finalize), then opens Results. |
| `/tools/what-if` (`components/views/whatif-tool-view.tsx`) | Independent concurrent runs across different scenarios | Starting scenario B's run while scenario A's is still "running" progresses both independently with no blocking. |
| `/tools/what-if` (`components/views/whatif-tool-view.tsx`) | "View Data" button in Results panel | Navigates to Equipment Home for the run's equipment with that run's data pre-selected over live data. |
| `/tools/what-if` (`components/views/whatif-tool-view.tsx`) | "Generate report (parameters)" button in Results panel | Adds a PDF entry to the Documents store; button changes to "Report saved to Documents". |
| `/tools/what-if` (`components/views/whatif-tool-view.tsx`) | "Discard" button in Results panel | Removes the run session; user returns to History tab and the run no longer appears. |
| `/tools/what-if` (`components/views/whatif-tool-view.tsx`) | "Save & Back" button in Results panel | Returns to the History tab; the run remains listed since it was saved when the run started. |
| `/tools/what-if` (`components/views/whatif-tool-view.tsx`) | Run Session Information & "Input parameters used" tables in Results panel | Displays that run's timing, user, status, job/token counts, and the exact parameter values submitted. |
| `/tools/what-if` (`components/views/whatif-tool-view.tsx`) | History status filter tabs — All / Success / Failed | Clicking a tab shows only runs of that status; selected tab is visually highlighted. |
| `/tools/what-if` (`components/views/whatif-tool-view.tsx`) | "Search runs…" box in History tab | Typing filters the run table to rows whose run name contains the query. |
| `/tools/what-if` (`components/views/whatif-tool-view.tsx`) | "View results" link on a successful run row in History | Click opens the Results panel pre-loaded with that past run's session data. |

## Tools — Documents

| Location | Feature | Success Criteria |
|---|---|---|
| `/tools/documents` (`components/views/documents-view.tsx`) | Grid/List view toggle switches document display layout | Clicking "List" renders documents as a table; clicking "Grid" renders them as cards. |
| `/tools/documents` (`components/views/documents-view.tsx`) | Category filter tabs: All / Uploaded / Shared | Selecting "Shared" shows only Shared-category documents (with a "Shared by" label); "All" shows everything. |
| `/tools/documents` (`components/views/documents-view.tsx`) | File type filter dropdown (All types/PDF/DOCX/XLSX) | Choosing "PDF" hides DOCX and XLSX documents from the grid/list view. |
| `/tools/documents` (`components/views/documents-view.tsx`) | Equipment/asset filter dropdown (site → plant → equipment tree) | Selecting an equipment shows only documents scoped to it and adds its name to the breadcrumb. |
| `/tools/documents` (`components/views/documents-view.tsx`) | Document name search box | Typing text hides documents whose name doesn't contain the query, case-insensitive, live. |
| `/tools/documents` (`components/views/documents-view.tsx`) | "Clear filters" link shown on empty results | With zero matches, clicking it resets category, type, asset filters and search text. |
| `/tools/documents` (`components/views/documents-view.tsx`) | Per-document Share button (grid card and list row) | Clicking the share icon opens a "Share Document" modal showing that document's name. |
| `/tools/documents` (`components/views/documents-view.tsx`) | Share modal "Share" send action | Entering an email and clicking Share shows a "Shared successfully! Sent to &lt;email&gt;" confirmation. |
| `/tools/documents` (`components/views/documents-view.tsx`) | What-If tool report generation tags documents in this view | A report generated from What-If appears under "Uploaded" with a What-If badge, counted in the header. |

## Tools — Data & Jobs

| Location | Feature | Success Criteria |
|---|---|---|
| `/tools/data-sync` (`components/views/data-sync.tsx`) | Equipment filter dropdown narrows FEA Jobs tab | Selecting "Coker 01" shows only its rows in the jobs table plus a "Filtered: Coker 01" badge. |
| `/tools/data-sync` (`components/views/data-sync.tsx`) | Equipment filter dropdown narrows Data Status tab | Selecting "HCU 01" shows only its panel; selecting an unsupported asset shows an "unavailable for this asset" notice. |
| `/tools/data-sync` (`components/views/data-sync.tsx`) | "Reset filter" button clears the equipment filter | Clicking it (visible only when filtered) returns the dropdown to "All equipment" and unfiltered content. |
| `/tools/data-sync` (`components/views/data-sync.tsx`) | Equipment pre-filter deep link from other tool pages | Opening Data & Jobs from an equipment's tool tile pre-selects that equipment in the filter dropdown. |
| `/tools/data-sync` (`components/views/data-sync.tsx`) | "Data Status" / "FEA Jobs" tab switch | Clicking "FEA Jobs" hides Data Status panels and shows the jobs table, and vice versa. |
| `/tools/data-sync` (`components/views/data-sync.tsx`) | Coker panel "Transfer log" button opens log Sheet | Clicking it slides in a panel listing timestamped pull/push entries with ok/warn styling. |
| `/tools/data-sync` (`components/views/data-sync.tsx`) | Coker panel "Open database" button | Clicking it opens the client's database console URL in a new browser tab. |
| `/tools/data-sync` (`components/views/data-sync.tsx`) | Sources table per-row "Open host" button | Clicking "Open host" in the sources table opens the console URL in a new tab. |
| `/tools/data-sync` (`components/views/data-sync.tsx`) | Coker panel "Configure" button opens connection-settings dialog | Dialog opens pre-filled with host/database/role fields; Cancel or Save both close it. |
| `/tools/data-sync` (`components/views/data-sync.tsx`) | Coker panel "Export" button opens export-format dialog | Dialog opens with JSON/CSV/XML radio choices, defaulting to JSON. |
| `/tools/data-sync` (`components/views/data-sync.tsx`) | Export dialog "Download sample" button | Clicking it downloads a file named `coker-01-output-sample.<ext>` matching the chosen format. |
| `/tools/data-sync` (`components/views/data-sync.tsx`) | Ingest channel tables show per-sensor health badges | Each row in the sensor channel tables renders a colored health badge from data. |
| `/tools/data-sync` (`components/views/data-sync.tsx`) | FEA jobs table State column shows status badge | A Failed-state job renders a red badge; Success jobs render green. |

## Tools — Alert Setting

| Location | Feature | Success Criteria |
|---|---|---|
| `/tools/alert-setting` (`components/views/alert-setting-view.tsx`) | Equipment select dropdown switches active equipment scope for alert rules | Selecting an equipment updates the "Active equipment" label and reloads that equipment's rule list. |
| `/tools/alert-setting` (`components/views/alert-setting-view.tsx`) | Deep-link `?equipment=` URL param (or in-app nav) pre-selects equipment on load | Opening `/tools/alert-setting?equipment=equipment-a` auto-selects Coker 01 without manual clicking. |
| `/tools/alert-setting` (`components/views/alert-setting-view.tsx`) | Full rule builder (tabs, rule list, Create alert) gated to Coker 01 only | Tabs, rule cards, and the Create alert button render only when Coker 01 is selected (other equipment show "coming soon"/unsupported cards). |
| `/tools/alert-setting` (`components/views/alert-setting-view.tsx`) | "Active rules (N)" tab: rules I own (any status) plus active rules assigned to me | Tab count matches number of rule cards shown; updates after create/delete/recover. |
| `/tools/alert-setting` (`components/views/alert-setting-view.tsx`) | "Deleted history (N)" tab lists soft-deleted rules visible to me | Tab count matches archived cards shown; reads "No deleted alerts." when empty. |
| `/tools/alert-setting` (`components/views/alert-setting-view.tsx`) | Status badge ("active"/"draft") on each rule card | Badge reads "active" for published rules, "draft" for owner-only unpublished ones. |
| `/tools/alert-setting` (`components/views/alert-setting-view.tsx`) | Pending delete-request inbox card for rule owners | Card lists requester + rule name per pending request; shown above tabs only to that rule's owner. |
| `/tools/alert-setting` (`components/views/alert-setting-view.tsx`) | "Reject" action on a pending delete request | Clicking Reject marks it rejected and removes it from the pending list; rule stays intact. |
| `/tools/alert-setting` (`components/views/alert-setting-view.tsx`) | "Accept & archive" action on a pending delete request | Clicking it soft-deletes the rule into Deleted history and clears the pending request. |
| `/tools/alert-setting` (`components/views/alert-setting-view.tsx`) | "Create alert" button opens the create sheet with a blank draft | Sheet opens with empty name, no parameters checked, AND combine, one-time schedule. |
| `/tools/alert-setting` (`components/views/alert-setting-view.tsx`) | Alert name text input | Typed text becomes the rule name; leaving it blank saves the rule as "Untitled alert". |
| `/tools/alert-setting` (`components/views/alert-setting-view.tsx`) | Parameter checklist selects which input/output parameters the rule watches | Checking a parameter adds its condition row; unchecking removes that row and its values. |
| `/tools/alert-setting` (`components/views/alert-setting-view.tsx`) | Predicate/operator dropdown per condition (14 kinds incl. between/outside/slope) | Selecting an operator (e.g. ">", "≥ & ≤", "Increase slope") updates that condition row. |
| `/tools/alert-setting` (`components/views/alert-setting-view.tsx`) | Threshold "A" input (primary bound) per condition | Blank/non-numeric A on a `<`/`≤`/`>`/`≥` condition blocks save with "Enter a numeric threshold." |
| `/tools/alert-setting` (`components/views/alert-setting-view.tsx`) | Threshold "B" input (secondary bound) for interval predicates | An invalid interval (e.g. lower 100 / upper 50 on "≥ & ≤") shows an error and blocks save. |
| `/tools/alert-setting` (`components/views/alert-setting-view.tsx`) | "Combine parameters with" AND/OR radio, applied across the whole rule | Toggling AND/OR is reflected on the saved card as "Combine: AND" or "Combine: OR". |
| `/tools/alert-setting` (`components/views/alert-setting-view.tsx`) | Schedule mode dropdown: One time only / Recurring / Specific dates | Switching modes swaps the date/time inputs shown and clears previously entered values. |
| `/tools/alert-setting` (`components/views/alert-setting-view.tsx`) | One-time schedule Date + Time pickers | Saved rule card shows `"One time · <date> at <time>"` matching the pickers. |
| `/tools/alert-setting` (`components/views/alert-setting-view.tsx`) | Recurring schedule: Frequency (Daily/Weekly/Monthly) + time-of-day + optional end date | Saved card shows e.g. "Daily at 06:00 until 2026-09-01" matching entered values. |
| `/tools/alert-setting` (`components/views/alert-setting-view.tsx`) | Specific-dates schedule: start/end date pickers plus optional start/end time | Saved rule card shows `"<start date> → <end date>"` summary matching entered values. |
| `/tools/alert-setting` (`components/views/alert-setting-view.tsx`) | Assignee on/off checkbox adds a person to the rule | Checking a user's box enables their access dropdown and includes them when the rule saves. |
| `/tools/alert-setting` (`components/views/alert-setting-view.tsx`) | Assignee access-level dropdown: Notify only / Comment on alert / Co-edit rule | Selected level is saved per assignee and shown on that assignee's badge on the card. |
| `/tools/alert-setting` (`components/views/alert-setting-view.tsx`) | "Can request delete" checkbox per assignee, role-gated | Checkbox shows for Notify only/Comment on alert; hidden entirely when Co-edit rule is selected. |
| `/tools/alert-setting` (`components/views/alert-setting-view.tsx`) | Inline validation error blocks invalid rule creation | Saving with a missing/invalid threshold shows a red error message; no rule is created. |
| `/tools/alert-setting` (`components/views/alert-setting-view.tsx`) | "Save alert" button, disabled until at least one parameter is selected | Button is greyed out at zero parameters checked; becomes clickable once one is checked. |
| `/tools/alert-setting` (`components/views/alert-setting-view.tsx`) | Submit status logic: any assignee checked → Active; none → Draft | Creating with ≥1 assignee yields an "active" badge; with none yields a "draft" badge. |
| `/tools/alert-setting` (`components/views/alert-setting-view.tsx`) | "Cancel" button (or closing the sheet) discards the draft | Clicking Cancel closes the sheet; no new rule is added to the list. |
| `/tools/alert-setting` (`components/views/alert-setting-view.tsx`) | "Edit" (pencil) button enters inline edit mode on a rule card | Visible only to the rule's owner or a co-edit-rule assignee; click reveals editable fields. |
| `/tools/alert-setting` (`components/views/alert-setting-view.tsx`) | Editable alert name field while editing | Changing the text and clicking Done renames the rule card. |
| `/tools/alert-setting` (`components/views/alert-setting-view.tsx`) | Owner-only Visibility radio: Draft ("only you") vs Active ("assignees see it") | Only the owner sees this control; toggling it and clicking Done changes the status badge. |
| `/tools/alert-setting` (`components/views/alert-setting-view.tsx`) | Editable Combine AND/OR and schedule mode/fields while editing | Changing values and clicking Done updates the card's Combine label and schedule summary text. |
| `/tools/alert-setting` (`components/views/alert-setting-view.tsx`) | Editable assignees grid while editing: add/remove assignees, change access/delete-flag | Checking a new assignee and clicking Done adds their badge to the saved card. |
| `/tools/alert-setting` (`components/views/alert-setting-view.tsx`) | Editable predicate/threshold (A/B) on existing condition rows while editing | Changing a threshold and clicking Done persists the new value shown on the card. |
| `/tools/alert-setting` (`components/views/alert-setting-view.tsx`) | "Done" button saves edits, revalidating conditions with the same rules as create | Invalid threshold shows inline error and blocks save; valid edit updates card and exits edit mode. |
| `/tools/alert-setting` (`components/views/alert-setting-view.tsx`) | "Cancel" button discards in-progress edits | Clicking Cancel exits edit mode and reverts all fields to last-saved values. |
| `/tools/alert-setting` (`components/views/alert-setting-view.tsx`) | "Test" button on a rule card sends a manual preview alert | Clicking Test never errors and is available on every visible rule card. |
| `/tools/alert-setting` (`components/views/alert-setting-view.tsx`) | Test delivers a preview operational-alert notification to owner + all assignees (deduped) | A notification titled "Equipment alert: <rule name>" appears for each recipient in Notifications. |
| `/tools/alert-setting` (`components/views/alert-setting-view.tsx`) | "Delete" button (owner only) directly soft-deletes the rule | Rule disappears from Active rules and immediately appears under Deleted history. |
| `/tools/alert-setting` (`components/views/alert-setting-view.tsx`) | "Request delete" button for a flagged, non-owner, non-co-edit assignee | Visible only when that assignee's "Can request delete" is on; click files a pending owner request. |
| `/tools/alert-setting` (`components/views/alert-setting-view.tsx`) | "Recover" button in Deleted history (owner only) | Rule disappears from Deleted history and reappears in Active rules with status "draft". |
| `/tools/alert-setting` (`components/views/alert-setting-view.tsx`) | Non-owner viewers of a deleted rule see read-only text, no recover action | Assignees viewing a deleted rule they don't own see "Owner can recover" with no button. |
| `/tools/alert-setting` (`components/views/alert-setting-view.tsx`) | All create/edit/delete/recover actions persist to this browser's localStorage | Reloading the page keeps created, edited, deleted, and recovered rules intact. |

## Comms — Notifications

| Location | Feature | Success Criteria |
|---|---|---|
| `/comms/alerts` (`app/comms/alerts/page.tsx`) | "Inbox" / "Archived" toggle, each labeled with a live count | Clicking Archived shows only archived items with their own count; Inbox shows non-archived items. |
| `/comms/alerts` (`app/comms/alerts/page.tsx`) | "All" / "Unread" toggle (Inbox only) | Selecting Unread hides read notifications; the count shown matches the unread badge. |
| `/comms/alerts` (`app/comms/alerts/page.tsx`) | "Mark all read" button (shown only when unread count > 0 in Inbox) | Click marks every inbox notification read and hides the button. |
| `/comms/alerts` (`app/comms/alerts/page.tsx`) | Click a notification row | Marks it read (if unread) and, if it has a resolvable destination, navigates the browser there. |
| `/comms/alerts` (`app/comms/alerts/page.tsx`) | "View"/"Equipment" button on a row (Eye icon) | Marks it read and navigates to its destination, independent of the row's own click handler. |
| `/comms/alerts` (`app/comms/alerts/page.tsx`) | Check-mark button on unread rows | Marks only that notification read without navigating away. |
| `/comms/alerts` (`app/comms/alerts/page.tsx`) | Archive button (Inbox rows) | Notification disappears from Inbox and appears under Archived. |
| `/comms/alerts` (`app/comms/alerts/page.tsx`) | Delete button (Inbox rows, with confirm prompt) | Confirming removes the notification permanently from the list. |
| `/comms/alerts` (`app/comms/alerts/page.tsx`) | Restore button (Archived rows) | Notification disappears from Archived and reappears in Inbox. |
| `/comms/alerts` (`app/comms/alerts/page.tsx`) | Delete-permanently button (Archived rows, with confirm prompt) | Confirming removes the notification permanently. |
| `/comms/alerts` (`app/comms/alerts/page.tsx`) | "Grant &lt;permission&gt;" button on a permission-request notification | Resolves the linked permission request as granted and updates its status. |
| `/comms/alerts` (`app/comms/alerts/page.tsx`) | "Deny" button on a permission-request notification | Resolves the linked permission request as denied. |
| `/comms/alerts` (`app/comms/alerts/page.tsx`) | Operational-alert rows render with a stronger amber/orange visual treatment | Notifications of category `operational_alert` are visually distinct (amber border/background, bold title) from other categories. |
