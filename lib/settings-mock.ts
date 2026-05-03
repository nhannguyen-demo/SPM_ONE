/** In-app Settings rows (rail + `/settings` page). No persistence. */
export const SETTINGS_MOCK_ROWS = [
  { key: "appearance", label: "Appearance", hint: "Theme & density" },
  { key: "locale", label: "Language & region", hint: "Locale, time zone, formats" },
  { key: "workspace", label: "Workspace defaults", hint: "Dashboard module defaults" },
  { key: "tools", label: "Tools & exports", hint: "What-If / Data & Jobs preferences" },
  { key: "privacy", label: "Privacy", hint: "Telemetry opt-in" },
  { key: "about", label: "About", hint: "Build & environment" },
] as const

export type SettingsMockRowKey = (typeof SETTINGS_MOCK_ROWS)[number]["key"]
