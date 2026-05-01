/**
 * Seeds org users from `lib/workspace/identity.ts`, the asset hierarchy from
 * `lib/data.ts` (sites/units/equipment), and the Workspace bundle from
 * `WORKSPACE_SEED` (`lib/workspace/seed.ts`) into PostgreSQL.
 *
 * Passwords are never committed. Set `SEED_DEFAULT_PASSWORD` and/or per-user
 * `SEED_PASSWORD_*` vars in `.env` (see `.env.example`).
 */
import "dotenv/config"
import { hashSync } from "bcryptjs"
import { sites } from "../lib/data"
import { prisma } from "../lib/prisma"
import type { EquipmentType, UserRole } from "../lib/generated/prisma"
import { ORG_USERS } from "../lib/workspace/identity"
import { seedWorkspaceFromMock } from "./seed-workspace"

const BCRYPT_ROUNDS = 12

/** e.g. user-nhan → SEED_PASSWORD_NHAN, user-pm → SEED_PASSWORD_PM */
function perUserEnvKey(userId: string): string {
  const tail = userId.startsWith("user-") ? userId.slice("user-".length) : userId
  return `SEED_PASSWORD_${tail.replace(/-/g, "_").toUpperCase()}`
}

function resolvePlainPassword(userId: string): string {
  const specificKey = perUserEnvKey(userId)
  const specific = process.env[specificKey]?.trim()
  if (specific) return specific

  const fallback = process.env.SEED_DEFAULT_PASSWORD?.trim()
  if (fallback) return fallback

  throw new Error(
    [
      `No password for ${userId}. Set SEED_DEFAULT_PASSWORD in .env,`,
      `or set ${specificKey} for this user.`,
      "See .env.example.",
    ].join(" "),
  )
}

function mapEquipmentEnum(key?: string): EquipmentType {
  if (key === "smr") return "smr"
  return "other"
}

async function seedAssetHierarchy(): Promise<void> {
  for (const site of sites) {
    await prisma.site.upsert({
      where: { id: site.id },
      create: { id: site.id, name: site.name },
      update: { name: site.name },
    })
    for (const unit of site.units) {
      await prisma.unit.upsert({
        where: { id: unit.id },
        create: { id: unit.id, siteId: site.id, name: unit.name },
        update: { name: unit.name, siteId: site.id },
      })
      for (const eq of unit.equipment) {
        await prisma.equipment.upsert({
          where: { id: eq.id },
          create: {
            id: eq.id,
            unitId: unit.id,
            name: eq.name,
            type: mapEquipmentEnum(eq.equipmentTypeKey),
            isPlaceholder: eq.isPlaceholder ?? false,
            equipmentTypeKey: eq.equipmentTypeKey ?? "other",
            hasWhatIfTool: false,
          },
          update: {
            name: eq.name,
            isPlaceholder: eq.isPlaceholder ?? false,
            equipmentTypeKey: eq.equipmentTypeKey ?? "other",
            type: mapEquipmentEnum(eq.equipmentTypeKey),
          },
        })
      }
    }
  }
  console.info(`Seeded ${sites.length} site(s) and equipment from lib/data.ts`)
}

async function main(): Promise<void> {
  for (const u of ORG_USERS) {
    const plain = resolvePlainPassword(u.id)
    const passwordHash = hashSync(plain, BCRYPT_ROUNDS)

    await prisma.user.upsert({
      where: { id: u.id },
      create: {
        id: u.id,
        name: u.name,
        email: u.email.trim().toLowerCase(),
        initials: u.initials,
        role: u.role as UserRole,
        passwordHash,
      },
      update: {
        name: u.name,
        email: u.email.trim().toLowerCase(),
        initials: u.initials,
        role: u.role as UserRole,
        passwordHash,
      },
    })

    console.info(`Seeded user ${u.id} (${u.email})`)
  }

  await seedAssetHierarchy()

  await seedWorkspaceFromMock()

  console.info(`Done. Seeded ${ORG_USERS.length} users.`)
}

main()
  .catch((e: unknown) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
