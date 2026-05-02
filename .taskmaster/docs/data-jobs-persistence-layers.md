# Data & Jobs — persistence rollout (reference)

**Tag:** `data-jobs-may2026` · **Task 6** · Canonical domain: `domain.ontology.yaml` (May 2 2026 entities).

UI route and `Tool.key` stay **`/tools/data-sync`** and **`data_sync`** until a deliberate rename program.

## Layer order (recommended)

1. **Ontology ↔ Prisma** — Add models aligned with `ClientSensorDatabaseSource`, `SensorIngestHealthSnapshot`, `EquipmentAnalysisOutputDescriptor`, `DataTransferLogEntry`; document secret handling (no plaintext credentials in API responses; vault or env-per-tenant). Plan **per-sensor channel** ingest state (or time-series) separately from equipment-level `SensorIngestHealthSnapshot` roll-ups — cadence differs (minutes vs multi-month laser campaigns).
2. **Migrations + seed** — Optional demo rows for Coker 01 to replace `lib/data-jobs-mock.ts` in dev.
3. **Ingest worker / queue** — Read-only client credentials, rotation, pull scheduling, watermarking; write `DataTransferLogEntry` + latest `SensorIngestHealthSnapshot`.
4. **REST (or tRPC)** — `/api/data-jobs/*` scoped by `equipmentId`; server authz consistent with asset tree / workspace rules.
5. **Export + outbound API** — File export endpoints; later partner webhook or pull API for output bundles.
6. **Next.js client** — Replace static fixtures in `DataSyncView` with SWR/React Query + loading/error states.
7. **Observability** — Metrics: pull latency, error rate, channel health ratio; alerts on sustained failure.
8. **E2E smoke** — Filter by equipment, open transfer log sheet, export sample (when export is no longer client-only blob).

## Out of scope (current mock)

- No Prisma tables required for the May 2026 UI mock (`lib/data-jobs-mock.ts`).
- **Task 5** in `tasks.json` tracks the deferred epic.
