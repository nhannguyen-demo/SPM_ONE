import { sites } from "@/lib/data"
import type { DocumentCategory, UserDocument } from "@/lib/data"

export type DocumentFilterInput = {
  categoryFilter: DocumentCategory | "All"
  assetFilter: string
  docSearch: string
  typeFilter?: string
}

export type AssetOption = { value: string; label: string }

export function buildAssetOptions(): AssetOption[] {
  const options: AssetOption[] = [{ value: "All", label: "All Assets" }]
  for (const site of sites) {
    options.push({ value: `site-${site.id}`, label: site.name })
    for (const plant of site.plants) {
      options.push({ value: `plant-${plant.id}`, label: `  ${plant.name}` })
      for (const equipment of plant.equipment) {
        options.push({ value: `equip-${equipment.id}`, label: `    ${equipment.name}` })
      }
    }
  }
  return options
}

export function filterDocuments(docs: UserDocument[], filters: DocumentFilterInput): UserDocument[] {
  const { categoryFilter, assetFilter, docSearch, typeFilter } = filters

  return docs.filter((doc) => {
    if (categoryFilter !== "All" && doc.category !== categoryFilter) return false
    if (typeFilter && typeFilter !== "All" && doc.fileType !== typeFilter) return false

    if (assetFilter !== "All") {
      if (assetFilter.startsWith("site-") && doc.siteId !== assetFilter.slice(5)) return false
      if (assetFilter.startsWith("plant-") && doc.plantId !== assetFilter.slice(6)) return false
      if (assetFilter.startsWith("equip-") && doc.equipmentId !== assetFilter.slice(6)) return false
    }

    if (docSearch && !doc.name.toLowerCase().includes(docSearch.toLowerCase())) return false
    return true
  })
}
