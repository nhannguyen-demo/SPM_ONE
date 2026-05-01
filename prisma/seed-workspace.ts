/**
 * Promotes `WORKSPACE_SEED` (same deterministic ids as the former client-only
 * Zustand slice) into PostgreSQL so `/api/workspace/bootstrap` returns real data.
 *
 * Requires: users + asset hierarchy seeded first (`prisma/seed.ts`).
 */
import { Prisma, $Enums } from "../lib/generated/prisma"
import { prisma } from "../lib/prisma"
import { WORKSPACE_SEED } from "../lib/workspace/seed"

function dt(iso: string): Date {
  return new Date(iso)
}

export async function seedWorkspaceFromMock(): Promise<void> {
  const eqCount = await prisma.equipment.count()
  if (eqCount === 0) {
    throw new Error(
      "seedWorkspaceFromMock: no Equipment rows. Run asset hierarchy seed first (sites/units/equipment from lib/data.ts)."
    )
  }

  const {
    folders,
    dashboards,
    shares,
    shareLinks,
    comments,
    permissionRequests,
    notifications,
  } = WORKSPACE_SEED

  for (const f of folders) {
    await prisma.workspaceFolder.upsert({
      where: { id: f.id },
      create: {
        id: f.id,
        ownerUserId: f.ownerUserId,
        parentFolderId: f.parentFolderId,
        name: f.name,
        createdAt: dt(f.createdAt),
        updatedAt: dt(f.updatedAt),
      },
      update: {
        ownerUserId: f.ownerUserId,
        parentFolderId: f.parentFolderId,
        name: f.name,
        updatedAt: dt(f.updatedAt),
      },
    })
  }

  for (const d of dashboards) {
    const widgetsJson = d.widgets as unknown as Prisma.InputJsonValue
    const ctx =
      d.dashboardContext === null || d.dashboardContext === undefined
        ? Prisma.JsonNull
        : (d.dashboardContext as unknown as Prisma.InputJsonValue)

    await prisma.dashboard.upsert({
      where: { id: d.id },
      create: {
        id: d.id,
        equipmentId: d.equipmentId,
        name: d.name,
        lifecycleStatus: d.lifecycleStatus,
        ownerUserId: d.ownerUserId,
        contributorUserIds: d.contributorUserIds,
        folderId: d.folderId,
        sourceDashboardId: d.sourceDashboardId,
        widgets: widgetsJson,
        thumbnailUrl: d.thumbnailUrl,
        knowledgePackVersion: d.knowledgePackVersion ?? null,
        dashboardContext: ctx,
        lastChangeAt: dt(d.lastChangeAt),
        lastChangeByUserId: d.lastChangeByUserId,
        publishedAt: d.publishedAt ? dt(d.publishedAt) : null,
        deletedAt: d.deletedAt ? dt(d.deletedAt) : null,
        createdAt: dt(d.createdAt),
        updatedAt: dt(d.updatedAt),
      },
      update: {
        equipmentId: d.equipmentId,
        name: d.name,
        lifecycleStatus: d.lifecycleStatus,
        contributorUserIds: d.contributorUserIds,
        folderId: d.folderId,
        sourceDashboardId: d.sourceDashboardId,
        widgets: widgetsJson,
        thumbnailUrl: d.thumbnailUrl,
        knowledgePackVersion: d.knowledgePackVersion ?? null,
        dashboardContext: ctx,
        lastChangeAt: dt(d.lastChangeAt),
        lastChangeByUserId: d.lastChangeByUserId,
        publishedAt: d.publishedAt ? dt(d.publishedAt) : null,
        deletedAt: d.deletedAt ? dt(d.deletedAt) : null,
        updatedAt: dt(d.updatedAt),
      },
    })
  }

  for (const sh of shares) {
    await prisma.dashboardShare.upsert({
      where: { id: sh.id },
      create: {
        id: sh.id,
        dashboardId: sh.dashboardId,
        sharedByUserId: sh.sharedByUserId,
        sharedWithUserId: sh.sharedWithUserId,
        permission: sh.permission as $Enums.SharePermission,
        message: sh.message,
        notifyOnFirstView: sh.notifyOnFirstView,
        firstViewedAt: sh.firstViewedAt ? dt(sh.firstViewedAt) : null,
        revokedAt: sh.revokedAt ? dt(sh.revokedAt) : null,
        createdAt: dt(sh.createdAt),
        updatedAt: dt(sh.updatedAt),
      },
      update: {
        permission: sh.permission as $Enums.SharePermission,
        message: sh.message,
        notifyOnFirstView: sh.notifyOnFirstView,
        firstViewedAt: sh.firstViewedAt ? dt(sh.firstViewedAt) : null,
        revokedAt: sh.revokedAt ? dt(sh.revokedAt) : null,
        updatedAt: dt(sh.updatedAt),
      },
    })
  }

  for (const link of shareLinks) {
    await prisma.shareLink.upsert({
      where: { id: link.id },
      create: {
        id: link.id,
        dashboardId: link.dashboardId,
        createdByUserId: link.createdByUserId,
        token: link.token,
        permission: link.permission as $Enums.SharePermission,
        revokedAt: link.revokedAt ? dt(link.revokedAt) : null,
        createdAt: dt(link.createdAt),
        updatedAt: dt(link.updatedAt),
      },
      update: {
        permission: link.permission as $Enums.SharePermission,
        revokedAt: link.revokedAt ? dt(link.revokedAt) : null,
        updatedAt: dt(link.updatedAt),
      },
    })
  }

  for (const c of comments) {
    await prisma.dashboardComment.upsert({
      where: { id: c.id },
      create: {
        id: c.id,
        dashboardId: c.dashboardId,
        authorUserId: c.authorUserId,
        body: c.body,
        createdAt: dt(c.createdAt),
        updatedAt: dt(c.updatedAt),
      },
      update: {
        body: c.body,
        updatedAt: dt(c.updatedAt),
      },
    })
  }

  for (const r of permissionRequests) {
    await prisma.permissionRequest.upsert({
      where: { id: r.id },
      create: {
        id: r.id,
        dashboardId: r.dashboardId,
        requestedByUserId: r.requestedByUserId,
        requestedToUserId: r.requestedToUserId,
        requestedPermission: r.requestedPermission as $Enums.PermissionRequestLevel,
        status: r.status as $Enums.PermissionRequestStatus,
        message: r.message,
        resolvedAt: r.resolvedAt ? dt(r.resolvedAt) : null,
        createdAt: dt(r.createdAt),
        updatedAt: dt(r.updatedAt),
      },
      update: {
        requestedPermission: r.requestedPermission as $Enums.PermissionRequestLevel,
        status: r.status as $Enums.PermissionRequestStatus,
        message: r.message,
        resolvedAt: r.resolvedAt ? dt(r.resolvedAt) : null,
        updatedAt: dt(r.updatedAt),
      },
    })
  }

  for (const n of notifications) {
    await prisma.notification.upsert({
      where: { id: n.id },
      create: {
        id: n.id,
        userId: n.userId,
        category: n.category as $Enums.NotificationCategory,
        dashboardId: n.dashboardId,
        relatedShareId: n.relatedShareId,
        relatedRequestId: n.relatedRequestId,
        actorUserId: n.actorUserId,
        title: n.title,
        body: n.body,
        readAt: n.readAt ? dt(n.readAt) : null,
        createdAt: dt(n.createdAt),
        updatedAt: dt(n.updatedAt),
      },
      update: {
        category: n.category as $Enums.NotificationCategory,
        dashboardId: n.dashboardId,
        relatedShareId: n.relatedShareId,
        relatedRequestId: n.relatedRequestId,
        actorUserId: n.actorUserId,
        title: n.title,
        body: n.body,
        readAt: n.readAt ? dt(n.readAt) : null,
        updatedAt: dt(n.updatedAt),
      },
    })
  }

  console.info(
    `Seeded workspace: ${folders.length} folders, ${dashboards.length} dashboards, ${shares.length} shares, ${shareLinks.length} share links, ${comments.length} comments, ${permissionRequests.length} permission requests, ${notifications.length} notifications`
  )
}
