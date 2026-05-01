-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('integrity_engineer', 'process_engineer', 'admin', 'product_team');

-- CreateEnum
CREATE TYPE "EquipmentType" AS ENUM ('vessel', 'reactor', 'pump', 'smr', 'other');

-- CreateEnum
CREATE TYPE "DashboardLifecycle" AS ENUM ('created', 'published');

-- CreateEnum
CREATE TYPE "SharePermission" AS ENUM ('view', 'comment', 'edit');

-- CreateEnum
CREATE TYPE "PermissionRequestStatus" AS ENUM ('pending', 'granted', 'denied', 'cancelled');

-- CreateEnum
CREATE TYPE "PermissionRequestLevel" AS ENUM ('comment', 'edit');

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('dashboard_shared_with_you', 'dashboard_first_view', 'permission_request_received', 'permission_request_resolved', 'edit_lock_blocked');

-- CreateEnum
CREATE TYPE "ParamRequestStatus" AS ENUM ('submitted', 'acknowledged', 'closed');

-- CreateEnum
CREATE TYPE "AppModuleKey" AS ENUM ('home', 'assets', 'workspace', 'insights', 'comms', 'settings');

-- CreateEnum
CREATE TYPE "WhatIfRunStatus" AS ENUM ('queued', 'running', 'success', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "WhatIfRunSource" AS ENUM ('tool', 'dashboard');

-- CreateEnum
CREATE TYPE "WhatIfParameterInputMode" AS ENUM ('full_csv', 'per_parameter_csv', 'typed', 'mixed');

-- CreateEnum
CREATE TYPE "WhatIfRunInputSourceType" AS ENUM ('typed', 'full_csv', 'per_parameter_csv', 'mixed');

-- CreateEnum
CREATE TYPE "WhatIfRunResultStatus" AS ENUM ('pass', 'warning', 'fail');

-- CreateEnum
CREATE TYPE "UserDocumentFileType" AS ENUM ('pdf', 'docx', 'xlsx', 'link');

-- CreateEnum
CREATE TYPE "UserDocumentCategory" AS ENUM ('uploaded', 'shared');

-- CreateEnum
CREATE TYPE "UserDocumentSubType" AS ENUM ('general', 'whatif_parameter_report', 'whatif_visual_report');

-- CreateEnum
CREATE TYPE "ChangeLogType" AS ENUM ('dashboard', 'operation');

-- CreateEnum
CREATE TYPE "SyncJobStatus" AS ENUM ('queued', 'running', 'success', 'failed', 'cancelled');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "initials" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'integrity_engineer',
    "passwordHash" TEXT,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "EquipmentType" NOT NULL DEFAULT 'other',
    "isPlaceholder" BOOLEAN NOT NULL DEFAULT false,
    "hasWhatIfTool" BOOLEAN NOT NULL DEFAULT false,
    "equipmentTypeKey" TEXT NOT NULL DEFAULT 'other',
    "parameterAddonJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceFolder" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "parentFolderId" TEXT,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dashboard" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lifecycleStatus" "DashboardLifecycle" NOT NULL DEFAULT 'created',
    "ownerUserId" TEXT NOT NULL,
    "contributorUserIds" TEXT[],
    "folderId" TEXT,
    "sourceDashboardId" TEXT,
    "widgets" JSONB NOT NULL,
    "thumbnailUrl" TEXT,
    "knowledgePackVersion" TEXT,
    "dashboardContext" JSONB,
    "lastChangeAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangeByUserId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dashboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardShare" (
    "id" TEXT NOT NULL,
    "dashboardId" TEXT NOT NULL,
    "sharedByUserId" TEXT NOT NULL,
    "sharedWithUserId" TEXT NOT NULL,
    "permission" "SharePermission" NOT NULL,
    "message" VARCHAR(500),
    "notifyOnFirstView" BOOLEAN NOT NULL DEFAULT false,
    "firstViewedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareLink" (
    "id" TEXT NOT NULL,
    "dashboardId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "permission" "SharePermission" NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardComment" (
    "id" TEXT NOT NULL,
    "dashboardId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PermissionRequest" (
    "id" TEXT NOT NULL,
    "dashboardId" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "requestedToUserId" TEXT NOT NULL,
    "requestedPermission" "PermissionRequestLevel" NOT NULL,
    "status" "PermissionRequestStatus" NOT NULL,
    "message" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PermissionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "dashboardId" TEXT,
    "relatedShareId" TEXT,
    "relatedRequestId" TEXT,
    "actorUserId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogParameterRequest" (
    "id" TEXT NOT NULL,
    "requesterUserId" TEXT NOT NULL,
    "equipmentId" TEXT,
    "body" TEXT NOT NULL,
    "categoryHint" TEXT,
    "status" "ParamRequestStatus" NOT NULL DEFAULT 'submitted',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogParameterRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppModule" (
    "id" TEXT NOT NULL,
    "key" "AppModuleKey" NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tool" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "supportsEquipmentFilter" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatIfScenario" (
    "id" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatIfScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatIfScenarioParameter" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT,
    "defaultValue" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatIfScenarioParameter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatIfRunSession" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "requestedById" TEXT,
    "runName" TEXT NOT NULL,
    "status" "WhatIfRunStatus" NOT NULL,
    "progressStep" INTEGER NOT NULL,
    "source" "WhatIfRunSource" NOT NULL,
    "parameterInputMode" "WhatIfParameterInputMode" NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatIfRunSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatIfRunInput" (
    "id" TEXT NOT NULL,
    "runSessionId" TEXT NOT NULL,
    "parameterId" TEXT,
    "parameterNameSnapshot" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sourceType" "WhatIfRunInputSourceType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatIfRunInput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatIfRunResult" (
    "id" TEXT NOT NULL,
    "runSessionId" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "status" "WhatIfRunResultStatus" NOT NULL,
    "included" BOOLEAN NOT NULL DEFAULT true,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatIfRunResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDocument" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileType" "UserDocumentFileType" NOT NULL,
    "category" "UserDocumentCategory" NOT NULL,
    "subType" "UserDocumentSubType" NOT NULL DEFAULT 'general',
    "siteId" TEXT,
    "plantId" TEXT,
    "equipmentId" TEXT,
    "sourceRunSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeLogEntry" (
    "id" TEXT NOT NULL,
    "type" "ChangeLogType" NOT NULL,
    "action" TEXT NOT NULL,
    "locationLabel" TEXT NOT NULL,
    "userId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChangeLogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataSyncStatus" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "totalFiles" INTEGER NOT NULL,
    "loadedFiles" INTEGER NOT NULL,
    "errorFiles" INTEGER NOT NULL,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataSyncStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncJob" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "userId" TEXT,
    "description" TEXT NOT NULL,
    "status" "SyncJobStatus" NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "elapsedSeconds" INTEGER,
    "tokenCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Unit_siteId_idx" ON "Unit"("siteId");

-- CreateIndex
CREATE INDEX "Equipment_unitId_idx" ON "Equipment"("unitId");

-- CreateIndex
CREATE INDEX "WorkspaceFolder_ownerUserId_idx" ON "WorkspaceFolder"("ownerUserId");

-- CreateIndex
CREATE INDEX "WorkspaceFolder_parentFolderId_idx" ON "WorkspaceFolder"("parentFolderId");

-- CreateIndex
CREATE INDEX "Dashboard_equipmentId_idx" ON "Dashboard"("equipmentId");

-- CreateIndex
CREATE INDEX "Dashboard_ownerUserId_idx" ON "Dashboard"("ownerUserId");

-- CreateIndex
CREATE INDEX "Dashboard_folderId_idx" ON "Dashboard"("folderId");

-- CreateIndex
CREATE INDEX "Dashboard_deletedAt_idx" ON "Dashboard"("deletedAt");

-- CreateIndex
CREATE INDEX "DashboardShare_dashboardId_idx" ON "DashboardShare"("dashboardId");

-- CreateIndex
CREATE INDEX "DashboardShare_sharedWithUserId_idx" ON "DashboardShare"("sharedWithUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ShareLink_token_key" ON "ShareLink"("token");

-- CreateIndex
CREATE INDEX "DashboardComment_dashboardId_idx" ON "DashboardComment"("dashboardId");

-- CreateIndex
CREATE INDEX "PermissionRequest_dashboardId_idx" ON "PermissionRequest"("dashboardId");

-- CreateIndex
CREATE INDEX "PermissionRequest_requestedToUserId_idx" ON "PermissionRequest"("requestedToUserId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_readAt_idx" ON "Notification"("readAt");

-- CreateIndex
CREATE INDEX "CatalogParameterRequest_status_idx" ON "CatalogParameterRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AppModule_key_key" ON "AppModule"("key");

-- CreateIndex
CREATE INDEX "Tool_moduleId_idx" ON "Tool"("moduleId");

-- CreateIndex
CREATE INDEX "WhatIfRunSession_equipmentId_idx" ON "WhatIfRunSession"("equipmentId");

-- CreateIndex
CREATE INDEX "WhatIfRunSession_requestedById_idx" ON "WhatIfRunSession"("requestedById");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceFolder" ADD CONSTRAINT "WorkspaceFolder_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceFolder" ADD CONSTRAINT "WorkspaceFolder_parentFolderId_fkey" FOREIGN KEY ("parentFolderId") REFERENCES "WorkspaceFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dashboard" ADD CONSTRAINT "Dashboard_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dashboard" ADD CONSTRAINT "Dashboard_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dashboard" ADD CONSTRAINT "Dashboard_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "WorkspaceFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dashboard" ADD CONSTRAINT "Dashboard_sourceDashboardId_fkey" FOREIGN KEY ("sourceDashboardId") REFERENCES "Dashboard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardShare" ADD CONSTRAINT "DashboardShare_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "Dashboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "Dashboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardComment" ADD CONSTRAINT "DashboardComment_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "Dashboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermissionRequest" ADD CONSTRAINT "PermissionRequest_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "Dashboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogParameterRequest" ADD CONSTRAINT "CatalogParameterRequest_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tool" ADD CONSTRAINT "Tool_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "AppModule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatIfScenario" ADD CONSTRAINT "WhatIfScenario_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatIfScenario" ADD CONSTRAINT "WhatIfScenario_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatIfScenarioParameter" ADD CONSTRAINT "WhatIfScenarioParameter_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "WhatIfScenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatIfRunSession" ADD CONSTRAINT "WhatIfRunSession_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "WhatIfScenario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatIfRunSession" ADD CONSTRAINT "WhatIfRunSession_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatIfRunSession" ADD CONSTRAINT "WhatIfRunSession_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatIfRunInput" ADD CONSTRAINT "WhatIfRunInput_runSessionId_fkey" FOREIGN KEY ("runSessionId") REFERENCES "WhatIfRunSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatIfRunInput" ADD CONSTRAINT "WhatIfRunInput_parameterId_fkey" FOREIGN KEY ("parameterId") REFERENCES "WhatIfScenarioParameter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatIfRunResult" ADD CONSTRAINT "WhatIfRunResult_runSessionId_fkey" FOREIGN KEY ("runSessionId") REFERENCES "WhatIfRunSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDocument" ADD CONSTRAINT "UserDocument_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDocument" ADD CONSTRAINT "UserDocument_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDocument" ADD CONSTRAINT "UserDocument_sourceRunSessionId_fkey" FOREIGN KEY ("sourceRunSessionId") REFERENCES "WhatIfRunSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeLogEntry" ADD CONSTRAINT "ChangeLogEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataSyncStatus" ADD CONSTRAINT "DataSyncStatus_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncJob" ADD CONSTRAINT "SyncJob_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncJob" ADD CONSTRAINT "SyncJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
