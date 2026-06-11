'use client'

import { useState, useEffect, useCallback, useRef, Fragment } from 'react'
import Image from 'next/image'

/* ─── Types ─────────────────────────────────────────────── */
type Section = 'overview' | 'participants' | 'codes' | 'import' | 'analytics' | 'settings'
type CodeFilter = 'all' | 'used' | 'unused'

interface Stats {
  totalParticipants: number
  codesEntered: number
  validCodes: number
  usedCodes: number
  unusedCodes: number
  buyNowClicks: number
  totalEntries: number
  totalCodes: number
  campaignActive: boolean
}

interface ParticipantRow {
  id: string; ticketNumber: number; name: string; phone: string; email: string
  codesCount: number; entriesCount: number; regEntries: number; codeEntries: number
  isBlocked: boolean; blockLevel: number; createdAt: string
}

interface CodeRow {
  id: string; code: string; isUsed: boolean; status: string
  participantName: string | null; usedAt: string | null
}

interface AbuseRow {
  id: string; participantId: string; participantName: string; participantPhone: string
  failedAttempts: number; blockLevel: number; blockedUntil: string | null; updatedAt: string
}

interface AnalyticsDay {
  date: string; registrations: number; codesUsed: number; buyClicks: number
}

interface AnalyticsTotals {
  participants: number; codesImported: number; codesUsed: number
  entries: number; buyClicks: number; redemptionRate: number
}

interface PendingUserCode {
  id: string; code: string; submittedAt: string
}

/* ─── Helpers ────────────────────────────────────────────── */
const GOLD = '#cc9a52'
const PAGE_SIZE = 20

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

const StatCard = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <div className="bg-[#1a1a1a] border border-white/5 rounded-xl p-4">
    <p className="text-[#cc9a52] font-black text-2xl leading-none">{value}</p>
    <p className="text-gray-400 text-xs mt-1.5 font-medium">{label}</p>
    {sub && <p className="text-gray-600 text-[10px] mt-0.5">{sub}</p>}
  </div>
)

const Toggle = ({ label, desc, checked, onToggle, loading }: {
  label: string; desc: string; checked: boolean; onToggle: () => void; loading?: boolean
}) => (
  <div className="flex items-center justify-between gap-4 py-3 border-b border-white/5 last:border-0">
    <div>
      <p className="text-white text-sm font-semibold">{label}</p>
      <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
    </div>
    <button
      onClick={onToggle}
      disabled={loading}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
        checked ? 'bg-[#cc9a52]' : 'bg-[#333]'
      }`}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`} />
    </button>
  </div>
)

/* ─── Nav items ──────────────────────────────────────────── */
const NAV: { id: Section; label: string; icon: React.ReactNode }[] = [
  {
    id: 'overview', label: 'Overview',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  },
  {
    id: 'participants', label: 'Participants',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  {
    id: 'codes', label: 'Codes',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  },
  {
    id: 'import', label: 'Import',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  },
  {
    id: 'analytics', label: 'Analytics',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  },
  {
    id: 'settings', label: 'Settings',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  },
]

/* ─── Main Component ─────────────────────────────────────── */
export default function AdminPage() {
  /* auth */
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  /* nav */
  const [section, setSection] = useState<Section>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  /* overview */
  const [stats, setStats] = useState<Stats | null>(null)
  const [statsError, setStatsError] = useState(false)
  const [campaignLoading, setCampaignLoading] = useState(false)

  /* participants */
  const [participants, setParticipants] = useState<ParticipantRow[]>([])
  const [participantSearch, setParticipantSearch] = useState('')
  const [participantPage, setParticipantPage] = useState(1)
  const [participantTotal, setParticipantTotal] = useState(0)

  /* pending user codes (reject feature) */
  const [expandedParticipant, setExpandedParticipant] = useState<string | null>(null)
  const [pendingCodes, setPendingCodes] = useState<Record<string, PendingUserCode[]>>({})

  /* codes */
  const [codes, setCodes] = useState<CodeRow[]>([])
  const [codeFilter, setCodeFilter] = useState<CodeFilter>('all')
  const [codeSearch, setCodeSearch] = useState('')
  const [codePage, setCodePage] = useState(1)
  const [codeTotal, setCodeTotal] = useState(0)

  /* import */
  const [importFiles, setImportFiles] = useState<FileList | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResults, setImportResults] = useState<{ file: string; totalLines: number; inserted: number; skipped: number; invalid: number }[] | null>(null)
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /* analytics */
  const [analyticsData, setAnalyticsData] = useState<{ days: AnalyticsDay[]; totals: AnalyticsTotals } | null>(null)

  /* settings */
  const [abuseRecords, setAbuseRecords] = useState<AbuseRow[]>([])
  const [abuseLoading, setAbuseLoading] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(null)

  /* danger zone — temporary go-live wipe */
  const [wipeConfirm, setWipeConfirm] = useState('')
  const [wiping, setWiping] = useState(false)
  const [wipeMsg, setWipeMsg] = useState<{ ok: boolean; text: string } | null>(null)

  /* ── Load helpers ── */
  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats', { credentials: 'include' })
      if (!res.ok) { setStatsError(true); return }
      setStats(await res.json())
      setStatsError(false)
    } catch { setStatsError(true) }
  }, [])

  const loadParticipants = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/admin/participants?page=${participantPage}&search=${encodeURIComponent(participantSearch)}`,
        { credentials: 'include' }
      )
      if (!res.ok) return
      const data = await res.json()
      setParticipants(data.participants)
      setParticipantTotal(data.total)
    } catch {}
  }, [participantPage, participantSearch])

  const loadCodes = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(codePage), filter: codeFilter })
      if (codeSearch.trim()) params.set('search', codeSearch.trim())
      const res = await fetch(`/api/admin/codes?${params}`, { credentials: 'include' })
      if (!res.ok) return
      const data = await res.json()
      setCodes(data.codes)
      setCodeTotal(data.total)
    } catch {}
  }, [codePage, codeFilter, codeSearch])

  const loadAnalytics = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/analytics', { credentials: 'include' })
      if (!res.ok) return
      setAnalyticsData(await res.json())
    } catch {}
  }, [])

  const loadAbuse = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/abuse', { credentials: 'include' })
      if (!res.ok) return
      const data = await res.json()
      setAbuseRecords(data.records)
    } catch {}
  }, [])

  /* ── Session check ── */
  useEffect(() => {
    const session = document.cookie.match(/admin_session=([^;]+)/)?.[1]
    if (session) setAuthed(true)
  }, [])

  /* ── Load on section change ── */
  useEffect(() => {
    if (!authed) return
    if (section === 'overview') loadStats()
    if (section === 'participants') loadParticipants()
    if (section === 'codes') loadCodes()
    if (section === 'analytics') loadAnalytics()
    if (section === 'settings') { loadStats(); loadAbuse() }
  }, [authed, section]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (authed && section === 'participants') loadParticipants() }, [participantPage, participantSearch]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (authed && section === 'codes') loadCodes() }, [codePage, codeFilter, codeSearch]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Actions ── */
  const handleLogin = async () => {
    setLoginError(''); setLoginLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'include',
      })
      if (!res.ok) { setLoginError('Incorrect password'); return }
      setAuthed(true)
    } catch { setLoginError('Connection error') }
    finally { setLoginLoading(false) }
  }

  const logout = () => {
    document.cookie = 'admin_session=; path=/; max-age=0'
    setAuthed(false); setPassword('')
  }

  const handleToggleCampaign = async () => {
    if (!stats || !confirm(stats.campaignActive ? 'Deactivate campaign?' : 'Activate campaign?')) return
    setCampaignLoading(true)
    try {
      await fetch('/api/admin/toggle', { method: 'POST', credentials: 'include' })
      await loadStats()
    } finally { setCampaignLoading(false) }
  }

  const handleDeleteParticipant = async (id: string) => {
    if (!confirm('Delete this participant and all their entries?')) return
    await fetch(`/api/admin/participants/${id}`, { method: 'DELETE', credentials: 'include' })
    loadParticipants()
    loadStats()
  }

  const handleExpandParticipant = async (id: string) => {
    if (expandedParticipant === id) { setExpandedParticipant(null); return }
    setExpandedParticipant(id)
    if (pendingCodes[id]) return // already loaded
    const res = await fetch(`/api/admin/participants/${id}/pending-codes`, { credentials: 'include' })
    if (res.ok) {
      const data = await res.json()
      setPendingCodes(prev => ({ ...prev, [id]: data.codes }))
    }
  }

  const handleRejectCode = async (userCodeId: string, participantId: string) => {
    if (!confirm('Reject this code and remove its 10 entries?')) return
    const res = await fetch(`/api/admin/usercodes/${userCodeId}`, { method: 'DELETE', credentials: 'include' })
    if (res.ok) {
      setPendingCodes(prev => ({
        ...prev,
        [participantId]: (prev[participantId] ?? []).filter(c => c.id !== userCodeId),
      }))
      loadParticipants()
      loadStats()
    }
  }

  const handleResetAbuse = async (pid: string) => {
    if (!confirm('Reset abuse record for this participant?')) return
    setAbuseLoading(true)
    try {
      await fetch(`/api/admin/abuse?pid=${pid}`, { method: 'DELETE', credentials: 'include' })
      loadAbuse()
    } finally { setAbuseLoading(false) }
  }

  const handleResetAllAbuse = async () => {
    if (!confirm('Reset ALL abuse records?')) return
    setAbuseLoading(true)
    try {
      await fetch('/api/admin/abuse?all=true', { method: 'DELETE', credentials: 'include' })
      loadAbuse()
    } finally { setAbuseLoading(false) }
  }

  const handleWipeAll = async () => {
    if (wipeConfirm !== 'DELETE ALL') return
    if (!confirm('This permanently deletes ALL participants, entries, codes and analytics. This cannot be undone. Continue?')) return
    setWiping(true); setWipeMsg(null)
    try {
      const res = await fetch('/api/admin/wipe', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'DELETE ALL' }),
      })
      const data = await res.json()
      if (!res.ok) { setWipeMsg({ ok: false, text: data.error ?? 'Wipe failed' }); return }
      const d = data.deleted
      setWipeMsg({ ok: true, text: `Wiped: ${d.participants} participants, ${d.entries} entries, ${d.codes} codes, ${d.userCodes} user-codes, ${d.buyClicks} clicks. Ticket numbers reset.` })
      setWipeConfirm('')
      loadStats()
    } catch { setWipeMsg({ ok: false, text: 'Connection error' }) }
    finally { setWiping(false) }
  }

  const handleImport = async () => {
    if (!importFiles || importFiles.length === 0) return
    setImporting(true); setImportResults(null)
    const BATCH_SIZE = 10000
    const results: { file: string; totalLines: number; inserted: number; skipped: number; invalid: number }[] = []

    for (let f = 0; f < importFiles.length; f++) {
      const file = importFiles[f]
      const text = await file.text()
      const lines = text.split('\n')
      let inserted = 0, skipped = 0
      const validLines = lines.map(l => l.trim().toUpperCase()).filter(l => l.length > 0)
      let invalid = lines.length - validLines.length

      for (let i = 0; i < validLines.length; i += BATCH_SIZE) {
        const batch = validLines.slice(i, i + BATCH_SIZE)
        setImportProgress({ current: i + batch.length, total: validLines.length })
        try {
          const res = await fetch('/api/admin/codes/import', {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codes: batch }),
          })
          const data = await res.json()
          inserted += data.inserted ?? 0
          skipped += data.skipped ?? 0
          invalid += data.invalid ?? 0
        } catch { skipped += batch.length }
      }
      results.push({ file: file.name, totalLines: lines.length, inserted, skipped, invalid })
    }
    setImportResults(results); setImporting(false); setImportProgress(null)
  }

  const totalPages = (total: number) => Math.max(1, Math.ceil(total / PAGE_SIZE))

  /* ── Login screen ── */
  if (!authed) {
    return (
      <div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a0a0a] px-6"
        dir="ltr"
        style={{ fontFamily: 'var(--font-poppins), Poppins, sans-serif' }}
      >
        <Image src="/moussy_logo.png" alt="Moussy" width={100} height={50} className="mb-8 object-contain opacity-80" />
        <h1 className="text-[#cc9a52] font-black text-xl mb-8 tracking-widest uppercase">Admin</h1>
        <div className="w-full max-w-xs space-y-4">
          <input
            type="password" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Password"
            className="w-full bg-[#1a1a1a] border border-white/10 text-white px-5 py-3.5 rounded-xl outline-none focus:border-[#cc9a52]/60 transition-colors"
          />
          {loginError && <p className="text-red-400 text-xs text-center">{loginError}</p>}
          <button onClick={handleLogin} disabled={loginLoading}
            className="w-full bg-[#cc9a52] text-black font-black py-3.5 rounded-xl text-sm disabled:opacity-50 transition-all hover:bg-[#d4aa62]">
            {loginLoading ? '...' : 'Sign In'}
          </button>
        </div>
      </div>
    )
  }

  /* ── Admin shell ── */
  return (
    <div
      className="fixed inset-0 z-[9999] flex bg-[#0a0a0a] overflow-hidden"
      dir="ltr"
      style={{ fontFamily: 'var(--font-poppins), Poppins, sans-serif' }}
    >
      {/* ── Sidebar overlay (mobile) ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-10 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed lg:static top-0 bottom-0 left-0 z-20
        w-56 flex flex-col bg-[#111] border-r border-white/5
        transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
          <Image src="/moussy_logo.png" alt="Moussy" width={70} height={35} className="object-contain" />
          <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Admin</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => { setSection(item.id); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                section === item.id
                  ? 'bg-[#cc9a52]/15 text-[#cc9a52]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Campaign badge */}
        <div className="px-4 py-3 border-t border-white/5">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${stats?.campaignActive ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            <span className={`w-2 h-2 rounded-full ${stats?.campaignActive ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-xs font-semibold text-gray-400">
              Campaign {stats?.campaignActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="flex items-center justify-between px-4 lg:px-6 py-3.5 border-b border-white/5 bg-[#0d0d0d] shrink-0">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button onClick={() => setSidebarOpen(v => !v)} className="lg:hidden text-gray-400 hover:text-white p-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <h2 className="text-white font-semibold text-sm capitalize">{NAV.find(n => n.id === section)?.label}</h2>
          </div>
          <button onClick={logout} className="text-gray-400 hover:text-white text-xs border border-white/10 px-3 py-1.5 rounded-full transition-colors hover:border-white/30">
            Sign out
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">

          {/* ════════ OVERVIEW ════════ */}
          {section === 'overview' && (
            <div className="max-w-4xl space-y-6">
              {statsError ? (
                <p className="text-red-400 text-sm">Failed to load stats.</p>
              ) : !stats ? (
                <Spinner />
              ) : (
                <>
                  {/* Stats grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard label="Participants" value={stats.totalParticipants.toLocaleString()} />
                    <StatCard label="Total Entries" value={stats.totalEntries.toLocaleString()} />
                    <StatCard label="Codes Used" value={stats.codesEntered.toLocaleString()} sub={`of ${stats.totalCodes.toLocaleString()} imported`} />
                    <StatCard label="Buy Now Clicks" value={stats.buyNowClicks.toLocaleString()} />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <StatCard label="Valid Codes" value={stats.validCodes.toLocaleString()} />
                    <StatCard label="Unused Codes" value={stats.unusedCodes.toLocaleString()} />
                    <StatCard label="Redemption Rate"
                      value={stats.totalCodes > 0 ? `${Math.round((stats.codesEntered / stats.totalCodes) * 10000) / 100}%` : '0%'}
                    />
                  </div>

                  {/* Campaign controls */}
                  <div className="bg-[#1a1a1a] border border-white/5 rounded-xl p-5">
                    <h3 className="text-white font-semibold text-sm mb-4">Campaign Controls</h3>
                    <Toggle
                      label="Campaign Active"
                      desc="Allow new registrations and code submissions"
                      checked={stats.campaignActive}
                      onToggle={handleToggleCampaign}
                      loading={campaignLoading}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* ════════ PARTICIPANTS ════════ */}
          {section === 'participants' && (
            <div className="max-w-5xl space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text" value={participantSearch}
                  onChange={e => { setParticipantSearch(e.target.value); setParticipantPage(1) }}
                  placeholder="Search name, phone, email…"
                  className="flex-1 bg-[#1a1a1a] border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-[#cc9a52]/50 transition-colors placeholder:text-gray-600"
                />
                <button
                  onClick={() => window.open('/api/admin/participants/export', '_blank')}
                  className="flex items-center gap-2 border border-[#cc9a52]/40 text-[#cc9a52] px-4 py-2.5 rounded-xl text-sm font-medium hover:border-[#cc9a52]/70 transition-colors whitespace-nowrap"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Export CSV
                </button>
              </div>

              <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 bg-[#0d0d0d]">
                        <th className="text-gray-500 font-medium text-left px-4 py-3 text-xs">Ticket #</th>
                        <th className="text-gray-500 font-medium text-left px-4 py-3 text-xs">Name</th>
                        <th className="text-gray-500 font-medium text-left px-4 py-3 text-xs hidden md:table-cell">Phone</th>
                        <th className="text-gray-500 font-medium text-left px-4 py-3 text-xs hidden lg:table-cell">Email</th>
                        <th className="text-gray-500 font-medium text-center px-3 py-3 text-xs">Entries</th>
                        <th className="text-gray-500 font-medium text-center px-3 py-3 text-xs hidden sm:table-cell" title="Registration + Codes breakdown">Breakdown</th>
                        <th className="text-gray-500 font-medium text-center px-3 py-3 text-xs hidden lg:table-cell">Codes</th>
                        <th className="text-gray-500 font-medium text-left px-3 py-3 text-xs hidden xl:table-cell">Joined</th>
                        <th className="px-3 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {participants.length === 0 ? (
                        <tr><td colSpan={9} className="text-gray-600 text-center py-10 text-sm">No participants found</td></tr>
                      ) : participants.map(p => (
                        <Fragment key={p.id}>
                        <tr className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${p.isBlocked ? 'bg-red-500/[0.04]' : ''}`}>
                          <td className="px-4 py-3">
                            <span className="font-mono text-[#cc9a52] font-bold text-xs">
                              #{String(p.ticketNumber).padStart(5, '0')}
                            </span>
                            {p.isBlocked && (
                              <span className="ml-1.5 text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-bold uppercase">Blocked</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-white font-medium text-sm">{p.name}</p>
                            <p className="text-gray-500 text-xs md:hidden">{p.phone}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell font-mono">{p.phone}</td>
                          <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">{p.email}</td>
                          <td className="px-3 py-3 text-center text-[#cc9a52] font-bold text-sm">{p.entriesCount}</td>
                          <td className="px-3 py-3 text-center hidden sm:table-cell">
                            <span className="text-[10px] text-gray-500">
                              <span className="text-blue-400 font-semibold">{p.regEntries}</span>
                              <span className="text-gray-600 mx-0.5">+</span>
                              <span className="text-green-400 font-semibold">{p.codeEntries}</span>
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center text-gray-400 text-sm hidden lg:table-cell">{p.codesCount}</td>
                          <td className="px-3 py-3 text-gray-500 text-xs hidden xl:table-cell">{fmtDate(p.createdAt)}</td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleExpandParticipant(p.id)}
                                className="text-gray-600 hover:text-yellow-400 transition-colors p-1"
                                title="View pending codes"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: expandedParticipant === p.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"/></svg>
                              </button>
                              <button
                                onClick={() => handleDeleteParticipant(p.id)}
                                className="text-gray-600 hover:text-red-400 transition-colors p-1"
                                title="Delete participant"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expandedParticipant === p.id && (
                          <tr className="bg-black/20">
                            <td colSpan={9} className="px-6 py-3">
                              {!pendingCodes[p.id] ? (
                                <p className="text-gray-500 text-xs">Loading...</p>
                              ) : pendingCodes[p.id].length === 0 ? (
                                <p className="text-gray-500 text-xs">No pending unmatched codes.</p>
                              ) : (
                                <div className="space-y-1">
                                  <p className="text-yellow-400 text-xs font-bold mb-2">Pending unmatched codes — click ✕ to reject &amp; remove entries</p>
                                  <div className="flex flex-wrap gap-2">
                                    {pendingCodes[p.id].map(uc => (
                                      <div key={uc.id} className="flex items-center gap-1.5 bg-yellow-400/10 border border-yellow-400/30 rounded-lg px-3 py-1.5">
                                        <span className="text-white font-mono text-xs font-bold tracking-widest">{uc.code}</span>
                                        <button
                                          onClick={() => handleRejectCode(uc.id, p.id)}
                                          className="text-gray-500 hover:text-red-400 transition-colors ml-1"
                                          title="Reject this code"
                                        >
                                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <Pagination page={participantPage} total={participantTotal} pageSize={PAGE_SIZE}
                onPrev={() => setParticipantPage(p => Math.max(1, p - 1))}
                onNext={() => setParticipantPage(p => Math.min(totalPages(participantTotal), p + 1))}
              />
            </div>
          )}

          {/* ════════ CODES ════════ */}
          {section === 'codes' && (
            <div className="max-w-4xl space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text" value={codeSearch}
                  onChange={e => { setCodeSearch(e.target.value); setCodePage(1) }}
                  placeholder="Search code…"
                  className="flex-1 bg-[#1a1a1a] border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-[#cc9a52]/50 transition-colors placeholder:text-gray-600 font-mono"
                />
                <div className="flex gap-2">
                  {(['all', 'used', 'unused'] as CodeFilter[]).map(f => (
                    <button key={f} onClick={() => { setCodeFilter(f); setCodePage(1) }}
                      className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-semibold border transition-colors capitalize ${
                        codeFilter === f
                          ? 'bg-[#cc9a52] text-black border-[#cc9a52]'
                          : 'border-white/10 text-gray-400 hover:border-white/25'
                      }`}
                    >{f}</button>
                  ))}
                </div>
              </div>

              <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 bg-[#0d0d0d]">
                        <th className="text-gray-500 font-medium text-left px-4 py-3 text-xs">Code</th>
                        <th className="text-gray-500 font-medium text-center px-4 py-3 text-xs">Status</th>
                        <th className="text-gray-500 font-medium text-left px-4 py-3 text-xs hidden md:table-cell">Used by</th>
                        <th className="text-gray-500 font-medium text-left px-4 py-3 text-xs hidden lg:table-cell">Used at</th>
                      </tr>
                    </thead>
                    <tbody>
                      {codes.length === 0 ? (
                        <tr><td colSpan={4} className="text-gray-600 text-center py-10 text-sm">No codes found</td></tr>
                      ) : codes.map(c => (
                        <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3 font-mono text-white text-xs tracking-widest font-semibold">{c.code}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              c.status === 'APPROVED' ? 'bg-green-500/15 text-green-400' :
                              c.status === 'REJECTED' ? 'bg-red-500/15 text-red-400' :
                              c.isUsed ? 'bg-[#cc9a52]/15 text-[#cc9a52]' :
                              'bg-white/5 text-gray-500'
                            }`}>
                              {c.isUsed ? c.status : 'Unused'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">{c.participantName ?? '—'}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                            {c.usedAt ? fmtDateTime(c.usedAt) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <Pagination page={codePage} total={codeTotal} pageSize={PAGE_SIZE}
                onPrev={() => setCodePage(p => Math.max(1, p - 1))}
                onNext={() => setCodePage(p => Math.min(totalPages(codeTotal), p + 1))}
              />
            </div>
          )}

          {/* ════════ IMPORT ════════ */}
          {section === 'import' && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-[#111] border border-white/5 rounded-xl p-5">
                <h3 className="text-white font-semibold text-sm mb-1">Import Codes</h3>
                <p className="text-gray-500 text-xs mb-5 leading-relaxed">
                  Upload up to 5 <code className="text-[#cc9a52]">.txt</code> files — one code per line, up to 5 million lines each.
                  Duplicates are automatically skipped.
                </p>

                {/* Drop zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center cursor-pointer hover:border-[#cc9a52]/40 transition-colors mb-4"
                >
                  <svg className="w-8 h-8 text-gray-600 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  {importFiles && importFiles.length > 0 ? (
                    <div className="space-y-1">
                      {Array.from(importFiles).map((f, i) => (
                        <p key={i} className="text-[#cc9a52] text-xs font-medium">{f.name}</p>
                      ))}
                    </div>
                  ) : (
                    <>
                      <p className="text-gray-400 text-sm font-medium">Click to select files</p>
                      <p className="text-gray-600 text-xs mt-1">Up to 5 .txt files</p>
                    </>
                  )}
                  <input ref={fileInputRef} type="file" accept=".txt" multiple className="hidden"
                    onChange={e => {
                      const files = e.target.files
                      if (files && files.length > 5) { alert('Maximum 5 files allowed'); e.target.value = ''; return }
                      setImportFiles(files); setImportResults(null)
                    }}
                  />
                </div>

                {/* Progress */}
                {importProgress && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                      <span>Importing…</span>
                      <span>{importProgress.current.toLocaleString()} / {importProgress.total.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#cc9a52] rounded-full transition-all duration-200"
                        style={{ width: `${Math.round((importProgress.current / importProgress.total) * 100)}%` }} />
                    </div>
                  </div>
                )}

                <button onClick={handleImport} disabled={importing || !importFiles || importFiles.length === 0}
                  className="w-full bg-[#cc9a52] text-black font-bold py-3 rounded-xl text-sm disabled:opacity-40 hover:bg-[#d4aa62] transition-colors">
                  {importing ? 'Importing…' : 'Start Import'}
                </button>
              </div>

              {/* Results */}
              {importResults && (
                <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-white/5 flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    <p className="text-white font-semibold text-sm">Import Complete</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/5 bg-[#0d0d0d]">
                          <th className="text-gray-500 font-medium text-left px-4 py-2.5">File</th>
                          <th className="text-gray-500 font-medium text-right px-4 py-2.5">Lines</th>
                          <th className="text-green-500/70 font-medium text-right px-4 py-2.5">Inserted</th>
                          <th className="text-yellow-500/70 font-medium text-right px-4 py-2.5">Skipped</th>
                          <th className="text-red-500/70 font-medium text-right px-4 py-2.5">Invalid</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importResults.map((r, i) => (
                          <tr key={i} className="border-b border-white/5">
                            <td className="px-4 py-2.5 text-white font-medium truncate max-w-[160px]">{r.file}</td>
                            <td className="px-4 py-2.5 text-gray-400 text-right">{r.totalLines.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-green-400 font-bold text-right">{r.inserted.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-yellow-400 text-right">{r.skipped.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-red-400 text-right">{r.invalid.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════ ANALYTICS ════════ */}
          {section === 'analytics' && (
            <div className="max-w-4xl space-y-6">
              {!analyticsData ? <Spinner /> : (
                <>
                  {/* Totals */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <StatCard label="Total Participants" value={analyticsData.totals.participants.toLocaleString()} />
                    <StatCard label="Total Entries" value={analyticsData.totals.entries.toLocaleString()} />
                    <StatCard label="Codes Imported" value={analyticsData.totals.codesImported.toLocaleString()} />
                    <StatCard label="Codes Redeemed" value={analyticsData.totals.codesUsed.toLocaleString()} />
                    <StatCard label="Buy Now Clicks" value={analyticsData.totals.buyClicks.toLocaleString()} />
                    <StatCard label="Redemption Rate" value={`${analyticsData.totals.redemptionRate}%`} />
                  </div>

                  {/* Daily table — last 30 days with activity */}
                  <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/5">
                      <h3 className="text-white font-semibold text-sm">Last 30 Days</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-white/5 bg-[#0d0d0d]">
                            <th className="text-gray-500 font-medium text-left px-4 py-2.5">Date</th>
                            <th className="text-gray-500 font-medium text-right px-4 py-2.5">Registrations</th>
                            <th className="text-gray-500 font-medium text-right px-4 py-2.5">Codes Used</th>
                            <th className="text-gray-500 font-medium text-right px-4 py-2.5">Buy Clicks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyticsData.days.filter(d => d.registrations + d.codesUsed + d.buyClicks > 0).reverse().map(d => (
                            <tr key={d.date} className="border-b border-white/5 hover:bg-white/[0.02]">
                              <td className="px-4 py-2.5 text-gray-300 font-medium">{fmtDate(d.date + 'T00:00:00')}</td>
                              <td className="px-4 py-2.5 text-right text-[#cc9a52] font-bold">{d.registrations}</td>
                              <td className="px-4 py-2.5 text-right text-green-400">{d.codesUsed}</td>
                              <td className="px-4 py-2.5 text-right text-blue-400">{d.buyClicks}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ════════ SETTINGS ════════ */}
          {section === 'settings' && (
            <div className="max-w-2xl space-y-6">

              {/* Campaign controls */}
              {stats && (
                <div className="bg-[#111] border border-white/5 rounded-xl p-5">
                  <h3 className="text-white font-semibold text-sm mb-4">Campaign</h3>
                  <Toggle
                    label="Campaign Active"
                    desc="Allow new registrations and code submissions"
                    checked={stats.campaignActive}
                    onToggle={handleToggleCampaign}
                    loading={campaignLoading}
                  />
                </div>
              )}

              {/* Abuse records */}
              <div className="bg-[#111] border border-white/5 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-white font-semibold text-sm">Abuse Records</h3>
                    <p className="text-gray-500 text-xs mt-0.5">Participants with failed code attempts</p>
                  </div>
                  {abuseRecords.length > 0 && (
                    <button onClick={handleResetAllAbuse} disabled={abuseLoading}
                      className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                      Reset All
                    </button>
                  )}
                </div>

                {abuseRecords.length === 0 ? (
                  <p className="text-gray-600 text-sm py-4 text-center">No abuse records</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="text-gray-500 font-medium text-left pb-2.5">Participant</th>
                          <th className="text-gray-500 font-medium text-center pb-2.5">Fails</th>
                          <th className="text-gray-500 font-medium text-center pb-2.5">Block Lvl</th>
                          <th className="text-gray-500 font-medium text-left pb-2.5">Blocked Until</th>
                          <th className="pb-2.5 w-16"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {abuseRecords.map(r => (
                          <tr key={r.id} className="border-b border-white/5">
                            <td className="py-2.5">
                              <p className="text-white font-medium">{r.participantName}</p>
                              <p className="text-gray-500 font-mono">{r.participantPhone}</p>
                            </td>
                            <td className="py-2.5 text-center text-yellow-400 font-bold">{r.failedAttempts}</td>
                            <td className="py-2.5 text-center text-gray-300">{r.blockLevel}</td>
                            <td className="py-2.5 text-gray-400">
                              {r.blockedUntil
                                ? new Date(r.blockedUntil) > new Date()
                                  ? <span className="text-red-400">{fmtDateTime(r.blockedUntil)}</span>
                                  : <span className="text-gray-600">Expired</span>
                                : <span className="text-gray-600">—</span>
                              }
                            </td>
                            <td className="py-2.5 text-right">
                              <button onClick={() => handleResetAbuse(r.participantId)} disabled={abuseLoading}
                                className="text-[10px] text-gray-500 hover:text-[#cc9a52] transition-colors disabled:opacity-50">
                                Reset
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Change password */}
              <div className="bg-[#111] border border-white/5 rounded-xl p-5">
                <h3 className="text-white font-semibold text-sm mb-4">Change Admin Password</h3>
                <p className="text-gray-500 text-xs mb-4 leading-relaxed">
                  Updates the <code className="text-[#cc9a52]">ADMIN_PASSWORD</code> environment variable.
                  You will be signed out and need to re-login.
                </p>
                <div className="space-y-3">
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    placeholder="New password"
                    className="w-full bg-[#0d0d0d] border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-[#cc9a52]/50 transition-colors placeholder:text-gray-600"
                  />
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full bg-[#0d0d0d] border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-[#cc9a52]/50 transition-colors placeholder:text-gray-600"
                  />
                  {pwdMsg && (
                    <p className={`text-xs ${pwdMsg.ok ? 'text-green-400' : 'text-red-400'}`}>{pwdMsg.text}</p>
                  )}
                  <button
                    onClick={async () => {
                      if (!newPassword || newPassword !== confirmPassword) {
                        setPwdMsg({ ok: false, text: 'Passwords do not match' }); return
                      }
                      if (newPassword.length < 6) {
                        setPwdMsg({ ok: false, text: 'Password must be at least 6 characters' }); return
                      }
                      try {
                        const res = await fetch('/api/admin/change-password', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify({ newPassword }),
                        })
                        if (!res.ok) { setPwdMsg({ ok: false, text: 'Failed to update password' }); return }
                        setPwdMsg({ ok: true, text: 'Password updated. Signing out…' })
                        setTimeout(logout, 1500)
                      } catch { setPwdMsg({ ok: false, text: 'Connection error' }) }
                    }}
                    disabled={!newPassword || !confirmPassword}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-40"
                  >
                    Update Password
                  </button>
                </div>
              </div>

              {/* ── Danger Zone — TEMPORARY go-live wipe (remove after cleanup) ── */}
              <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <h3 className="text-red-400 font-semibold text-sm">Danger Zone — Wipe All Data</h3>
                </div>
                <p className="text-gray-400 text-xs mb-4 leading-relaxed">
                  Permanently deletes <strong className="text-red-300">all participants, entries, submitted codes, imported codes, and analytics</strong>, and resets ticket numbering to #00001.
                  Campaign settings are kept. <strong className="text-red-300">This cannot be undone.</strong> Type <code className="text-red-300">DELETE ALL</code> to enable the button.
                </p>
                <div className="space-y-3">
                  <input
                    type="text" value={wipeConfirm} onChange={e => setWipeConfirm(e.target.value)}
                    placeholder="Type DELETE ALL to confirm"
                    className="w-full bg-[#0d0d0d] border border-red-500/20 text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-red-500/60 transition-colors placeholder:text-gray-600 font-mono"
                  />
                  {wipeMsg && (
                    <p className={`text-xs ${wipeMsg.ok ? 'text-green-400' : 'text-red-400'}`}>{wipeMsg.text}</p>
                  )}
                  <button
                    onClick={handleWipeAll}
                    disabled={wipeConfirm !== 'DELETE ALL' || wiping}
                    className="w-full bg-red-600/90 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {wiping ? 'Wiping…' : 'Permanently Delete All Data'}
                  </button>
                </div>
              </div>

            </div>
          )}

        </main>
      </div>
    </div>
  )
}

/* ─── Small shared components ────────────────────────────── */
function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="w-6 h-6 border-2 border-[#cc9a52] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function Pagination({ page, total, pageSize, onPrev, onNext }: {
  page: number; total: number; pageSize: number; onPrev: () => void; onNext: () => void
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  return (
    <div className="flex items-center justify-between text-xs text-gray-500">
      <button onClick={onPrev} disabled={page === 1}
        className="flex items-center gap-1.5 disabled:opacity-30 hover:text-white transition-colors">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        Prev
      </button>
      <span className="text-gray-600">
        Page {page} of {pages} <span className="text-gray-700 ml-1">({total.toLocaleString()} total)</span>
      </span>
      <button onClick={onNext} disabled={page >= pages}
        className="flex items-center gap-1.5 disabled:opacity-30 hover:text-white transition-colors">
        Next
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>
  )
}
