"use client"

/**
 * Documents Tool View
 * Full-featured document library: seed from userDocuments, add What-If reports,
 * filter by category / asset / file type, share, download.
 */

import { useState, useEffect, useRef, useMemo } from "react"
import { useAppStore } from "@/lib/store"
import { sites, userDocuments } from "@/lib/data"
import type { UserDocument, DocumentCategory } from "@/lib/data"
import { cn } from "@/lib/utils"
import {
  File, FileText, FileSpreadsheet, Link,
  Upload, Users, BookOpen, Search, SlidersHorizontal,
  Share2, Download, X, Check, ChevronRight,
  MoreHorizontal, ExternalLink, Info, Tag,
} from "lucide-react"

/* ═══════════════════════════════════════════════════════════════════════════
   SEED — populate savedDocuments once from static data.ts list
   ═══════════════════════════════════════════════════════════════════════════ */

function useSeedDocuments() {
  const { savedDocuments, addDocument } = useAppStore()
  const seeded = useRef(false)
  useEffect(() => {
    if (seeded.current) return
    seeded.current = true
    const existingIds = new Set(savedDocuments.map((d) => d.id))
    ;[...userDocuments]
      .reverse()
      .filter((d) => !existingIds.has(d.id))
      .forEach((d) => addDocument(d))
  }, [savedDocuments, addDocument])
}

/* ═══════════════════════════════════════════════════════════════════════════
   FILE TYPE META
   ═══════════════════════════════════════════════════════════════════════════ */

const FILE_META: Record<string, { icon: React.ReactNode; badge: string; color: string }> = {
  pdf:  {
    icon:  <File className="w-9 h-9 text-rose-500" />,
    badge: "bg-rose-500/10 text-rose-600",
    color: "text-rose-500",
  },
  docx: {
    icon:  <FileText className="w-9 h-9 text-blue-500" />,
    badge: "bg-blue-500/10 text-blue-600",
    color: "text-blue-500",
  },
  xlsx: {
    icon:  <FileSpreadsheet className="w-9 h-9 text-emerald-500" />,
    badge: "bg-emerald-500/10 text-emerald-600",
    color: "text-emerald-500",
  },
  link: {
    icon:  <Link className="w-9 h-9 text-purple-500" />,
    badge: "bg-purple-500/10 text-purple-600",
    color: "text-purple-500",
  },
}
const fileMeta = (type: string) => FILE_META[type] ?? FILE_META.link

/* ═══════════════════════════════════════════════════════════════════════════
   SHARE MODAL
   ═══════════════════════════════════════════════════════════════════════════ */

function ShareModal({ doc, onClose }: { doc: UserDocument; onClose: () => void }) {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [message, setMessage] = useState("")

  const handleSend = () => {
    if (!email.trim()) return
    setSent(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-[480px] p-6">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-secondary transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <h3 className="font-semibold text-foreground text-base mb-1">Share Document</h3>
        <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
          <FileText className="w-3 h-3" /> {doc.name}
        </p>

        {sent ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Check className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="font-medium text-foreground">Shared successfully!</p>
            <p className="text-xs text-muted-foreground">Sent to <strong>{email}</strong></p>
            <button onClick={onClose} className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Recipient email or colleague name
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full h-10 px-3 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Message (optional)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a note…"
                rows={3}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={onClose}
                className="flex-1 py-2 border border-border rounded-lg text-sm text-foreground hover:bg-secondary transition-colors">
                Cancel
              </button>
              <button onClick={handleSend} disabled={!email.trim()}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
                <Share2 className="w-4 h-4 inline mr-1.5" />
                Share
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   DOCUMENT CARD
   ═══════════════════════════════════════════════════════════════════════════ */

function isWhatIfParameterReport(name: string) {
  return name.startsWith("[What-If Report]")
}

function isWhatIfVisualReport(name: string) {
  return name.startsWith("[What-If Visual Report]")
}

function isWhatIfDocument(name: string) {
  return isWhatIfParameterReport(name) || isWhatIfVisualReport(name)
}

function DocumentCard({
  doc,
  onShare,
}: {
  doc: UserDocument
  onShare: (doc: UserDocument) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const meta = fileMeta(doc.fileType)
  const isParamReport = isWhatIfParameterReport(doc.name)
  const isVisualReport = isWhatIfVisualReport(doc.name)
  const isWhatIfReport = isParamReport || isVisualReport

  // Find equipment name
  const equipName = useMemo(() => {
    if (!doc.equipmentId) return null
    for (const site of sites) {
      for (const plant of site.plants) {
        const eq = plant.equipment.find((e) => e.id === doc.equipmentId)
        if (eq) return eq.name
      }
    }
    return null
  }, [doc.equipmentId])

  return (
    <div className="group relative bg-card border border-border rounded-2xl p-4 hover:border-primary/30 hover:shadow-md transition-all flex flex-col">
      {isParamReport && (
        <div className="absolute top-3 right-3">
          <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-bold uppercase rounded tracking-wide">
            What-If · Parameters
          </span>
        </div>
      )}
      {isVisualReport && (
        <div className="absolute top-3 right-3">
          <span className="px-2 py-0.5 bg-violet-500/15 text-violet-700 dark:text-violet-300 text-[9px] font-bold uppercase rounded tracking-wide">
            What-If · Visual
          </span>
        </div>
      )}

      {/* Icon */}
      <div className="mb-3">{meta.icon}</div>

      {/* Name */}
      <div className="text-sm font-medium text-foreground line-clamp-2 leading-snug mb-2 flex-1 group-hover:text-primary transition-colors pr-12">
        {isParamReport
          ? doc.name.replace("[What-If Report] ", "")
          : isVisualReport
            ? doc.name.replace("[What-If Visual Report] ", "")
            : doc.name}
      </div>

      {/* Meta tags */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-bold uppercase", meta.badge)}>
          {doc.fileType}
        </span>
        <span className="text-[10px] text-muted-foreground">{doc.size}</span>
        {equipName && (
          <span className="text-[10px] px-1.5 py-0.5 bg-secondary rounded text-muted-foreground flex items-center gap-0.5">
            <Tag className="w-2.5 h-2.5" />{equipName}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] text-muted-foreground">{doc.date}</div>
          {doc.sharedBy ? (
            <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <Users className="w-2.5 h-2.5" /> {doc.sharedBy}
            </div>
          ) : (
            <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <Upload className="w-2.5 h-2.5" /> Uploaded
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            title="Download"
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            title="Share"
            onClick={() => onShare(doc)}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   DOCUMENT LIST ROW (for table view)
   ═══════════════════════════════════════════════════════════════════════════ */

function DocumentRow({
  doc,
  onShare,
}: {
  doc: UserDocument
  onShare: (doc: UserDocument) => void
}) {
  const meta = fileMeta(doc.fileType)
  const isParamReport = isWhatIfParameterReport(doc.name)
  const isVisualReport = isWhatIfVisualReport(doc.name)
  const displayName = isParamReport
    ? doc.name.replace("[What-If Report] ", "")
    : isVisualReport
      ? doc.name.replace("[What-If Visual Report] ", "")
      : doc.name

  const equipName = useMemo(() => {
    if (!doc.equipmentId) return null
    for (const site of sites) {
      for (const plant of site.plants) {
        const eq = plant.equipment.find((e) => e.id === doc.equipmentId)
        if (eq) return eq.name
      }
    }
    return null
  }, [doc.equipmentId])

  return (
    <tr className="hover:bg-secondary/20 transition-colors group">
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <div className={cn("flex-shrink-0", meta.color)}>{
            doc.fileType === "pdf"  ? <File className="w-5 h-5" /> :
            doc.fileType === "docx" ? <FileText className="w-5 h-5" /> :
            doc.fileType === "xlsx" ? <FileSpreadsheet className="w-5 h-5" /> :
            <Link className="w-5 h-5" />
          }</div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground truncate max-w-xs group-hover:text-primary transition-colors">
              {displayName}
            </div>
            {isParamReport && (
              <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-bold uppercase">
                What-If · Parameters
              </span>
            )}
            {isVisualReport && (
              <span className="text-[10px] px-1.5 py-0.5 bg-violet-500/15 text-violet-700 dark:text-violet-300 rounded font-bold uppercase">
                What-If · Visual
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="px-5 py-3">
        <span className={cn("text-[10px] px-2 py-0.5 rounded font-bold uppercase", meta.badge)}>{doc.fileType}</span>
      </td>
      <td className="px-5 py-3 text-sm text-muted-foreground">
        {doc.category === "Shared" ? (
          <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Shared by {doc.sharedBy}</div>
        ) : (
          <div className="flex items-center gap-1.5"><Upload className="w-3.5 h-3.5" /> Uploaded</div>
        )}
      </td>
      <td className="px-5 py-3 text-sm text-muted-foreground">{equipName ?? "—"}</td>
      <td className="px-5 py-3 text-sm text-muted-foreground">{doc.size}</td>
      <td className="px-5 py-3 text-sm text-muted-foreground font-mono text-xs">{doc.date}</td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-1">
          <button title="Download" className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
            <Download className="w-4 h-4" />
          </button>
          <button title="Share" onClick={() => onShare(doc)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   ROOT EXPORT
   ═══════════════════════════════════════════════════════════════════════════ */

export function DocumentsView() {
  useSeedDocuments()

  const { savedDocuments, setCurrentView, setViewMode } = useAppStore()
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | "All">("All")
  const [typeFilter, setTypeFilter] = useState<string>("All")
  const [assetFilter, setAssetFilter] = useState<string>("All")
  const [docSearch, setDocSearch] = useState("")
  const [viewLayout, setViewLayout] = useState<"grid" | "list">("grid")
  const [shareTarget, setShareTarget] = useState<UserDocument | null>(null)

  // Asset filter options
  const assetOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [{ value: "All", label: "All Assets" }]
    for (const site of sites) {
      opts.push({ value: `site-${site.id}`, label: site.name })
      for (const plant of site.plants) {
        opts.push({ value: `plant-${plant.id}`, label: `  ${plant.name}` })
        for (const eq of plant.equipment) {
          opts.push({ value: `equip-${eq.id}`, label: `    ${eq.name}` })
        }
      }
    }
    return opts
  }, [])

  const filtered = useMemo(() => {
    return savedDocuments.filter((doc) => {
      if (categoryFilter !== "All" && doc.category !== categoryFilter) return false
      if (typeFilter !== "All" && doc.fileType !== typeFilter) return false
      if (assetFilter !== "All") {
        if (assetFilter.startsWith("site-") && doc.siteId !== assetFilter.slice(5)) return false
        if (assetFilter.startsWith("plant-") && doc.plantId !== assetFilter.slice(6)) return false
        if (assetFilter.startsWith("equip-") && doc.equipmentId !== assetFilter.slice(6)) return false
      }
      if (docSearch && !doc.name.toLowerCase().includes(docSearch.toLowerCase())) return false
      return true
    })
  }, [savedDocuments, categoryFilter, typeFilter, assetFilter, docSearch])

  const whatIfCount = savedDocuments.filter((d) => isWhatIfDocument(d.name)).length

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-border bg-card flex-shrink-0 text-xs text-muted-foreground">
        <button onClick={() => { setCurrentView("data-sync"); setViewMode("view") }} className="hover:text-foreground transition-colors">
          Tools
        </button>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">Documents</span>
      </div>

      {/* Header + stats */}
      <div className="px-6 pt-6 pb-4 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">Documents</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {savedDocuments.length} documents · {whatIfCount} What-If report{whatIfCount !== 1 ? "s" : ""}
            </p>
          </div>
          {/* Layout toggle */}
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
            {(["grid", "list"] as const).map((l) => (
              <button key={l} onClick={() => setViewLayout(l)}
                className={cn("px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors",
                  viewLayout === l ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                {l === "grid" ? "Grid" : "List"}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mt-4">
          {/* Category tabs */}
          <div className="flex items-center bg-secondary rounded-lg p-0.5 gap-0.5">
            {(["All", "Uploaded", "Shared"] as const).map((cat) => (
              <button key={cat} onClick={() => setCategoryFilter(cat)}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  categoryFilter === cat ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                {cat === "Uploaded" && <Upload className="w-3 h-3" />}
                {cat === "Shared"   && <Users className="w-3 h-3" />}
                {cat === "All"      && <BookOpen className="w-3 h-3" />}
                {cat}
              </button>
            ))}
          </div>

          {/* File type filter */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
              className="h-8 px-2 bg-secondary border border-border rounded-lg text-xs text-foreground">
              <option value="All">All types</option>
              <option value="pdf">PDF</option>
              <option value="docx">DOCX</option>
              <option value="xlsx">XLSX</option>
            </select>
          </div>

          {/* Asset filter */}
          <select value={assetFilter} onChange={(e) => setAssetFilter(e.target.value)}
            className="h-8 px-2 bg-secondary border border-border rounded-lg text-xs text-foreground">
            {assetOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Search */}
          <div className="relative ml-auto">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input type="text" placeholder="Search documents…" value={docSearch} onChange={(e) => setDocSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-secondary border border-border rounded-lg text-xs focus:outline-none focus:border-primary/50 w-48" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
            <FileText className="w-10 h-10 opacity-40" />
            <p className="text-sm">No documents match your filters.</p>
            <button onClick={() => { setCategoryFilter("All"); setTypeFilter("All"); setAssetFilter("All"); setDocSearch("") }}
              className="text-xs text-primary hover:underline">
              Clear filters
            </button>
          </div>
        ) : viewLayout === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-6">
            {filtered.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} onShare={setShareTarget} />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card border-b border-border z-10">
                <tr>
                  {["Name", "Type", "Category", "Asset", "Size", "Date", "Actions"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((doc) => (
                  <DocumentRow key={doc.id} doc={doc} onShare={setShareTarget} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Share modal */}
      {shareTarget && <ShareModal doc={shareTarget} onClose={() => setShareTarget(null)} />}
    </div>
  )
}
