import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Search, RefreshCw, Filter,
  AlertCircle, CheckCircle, Crown, UserCog, Building2, Wrench,
  Eye, Lock, Globe
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../contexts/UserContext'
import { useImpersonation } from '../../contexts/ImpersonationContext'
import { AnyProfile, StaffProfile, PortalProfile } from './types'
import { ProfileCard } from './ProfileCard'
import { ProfileEditDrawer } from './ProfileEditDrawer'
import { IAMStatsBar } from './IAMStatsBar'
import { PendingApprovals } from './PendingApprovals'
import { DeviceSessionsDrawer } from './DeviceSessionsDrawer'
import { CreatePortalAccessPanel } from './CreatePortalAccessPanel'

type FilterType = 'todos' | 'staff' | 'cliente' | 'parceiro'
type MainTab = 'profiles' | 'portal'

interface IAMStats {
  online_count: number
  pending_approvals: number
  recent_logins_24h: number
  total_staff: number
  total_portal: number
}

const FILTER_OPTIONS: { id: FilterType; label: string; icon: React.ElementType }[] = [
  { id: 'todos',    label: 'Todos',     icon: Users },
  { id: 'staff',    label: 'Equipe',    icon: UserCog },
  { id: 'cliente',  label: 'Clientes',  icon: Building2 },
  { id: 'parceiro', label: 'Parceiros', icon: Wrench },
]

const IdentityControl: React.FC = () => {
  const { user, isSuperAdmin } = useUser()
  const { startImpersonation, error: impersonationError } = useImpersonation()

  const [activeTab, setActiveTab] = useState<MainTab>('profiles')
  const [allProfiles, setAllProfiles] = useState<AnyProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [iamStats, setIamStats] = useState<IAMStats | null>(null)
  const [filter, setFilter] = useState<FilterType>('todos')
  const [search, setSearch] = useState('')
  const [editTarget, setEditTarget] = useState<AnyProfile | null>(null)
  const [devicesTarget, setDevicesTarget] = useState<AnyProfile | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null)

  const isAdmin = isSuperAdmin || (user as any)?.role === 'admin' || (user as any)?.role === 'manager'

  const loadAll = useCallback(async () => {
    setLoading(true)
    setStatsLoading(true)
    try {
      const [profilesRes, statsRes] = await Promise.all([
        supabase.rpc('admin_get_all_profiles'),
        supabase.rpc('iam_get_dashboard_stats'),
      ])
      if (!profilesRes.error) {
        const staff: StaffProfile[] = (profilesRes.data?.staff || []).map((p: any) => ({ ...p, type: 'staff' }))
        const portal: PortalProfile[] = (profilesRes.data?.portal || []).map((p: any) => ({ ...p }))
        setAllProfiles([...staff, ...portal])
      }
      if (!statsRes.error && statsRes.data) {
        setIamStats(statsRes.data as IAMStats)
      }
    } catch {
      showToast('error', 'Erro ao carregar dados.')
    }
    setLoading(false)
    setStatsLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  useEffect(() => {
    if (impersonationError) {
      showToast('error', impersonationError)
      setImpersonatingId(null)
    }
  }, [impersonationError])

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }

  const handleToggleActive = async (profile: AnyProfile) => {
    const newVal = !profile.is_active
    try {
      const { error } = await supabase.rpc('admin_toggle_profile_active', {
        p_target_id:   profile.id,
        p_target_type: profile.type === 'staff' ? 'staff' : 'portal',
        p_is_active:   newVal,
      })
      if (error) throw error
      showToast('success', `Perfil ${newVal ? 'ativado' : 'desativado'}.`)
      loadAll()
    } catch {
      showToast('error', 'Erro ao atualizar status.')
    }
  }

  const handleImpersonate = async (profile: AnyProfile) => {
    setImpersonatingId(profile.id)
    await startImpersonation(profile.id)
    setImpersonatingId(null)
  }

  const filtered = useMemo(() => {
    let list = allProfiles
    if (filter !== 'todos') list = list.filter(p => p.type === filter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.full_name?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.role?.toLowerCase().includes(q)
      )
    }
    return list
  }, [allProfiles, filter, search])

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="text-center">
          <Lock size={44} className="text-red-400/60 mx-auto mb-4" />
          <h2 className="text-white font-semibold text-xl mb-2">Acesso Restrito</h2>
          <p className="text-gray-400 text-sm">Apenas Administradores têm acesso ao Hub de Identidades.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6" style={{ background: '#06080f' }}>

      {/* ── Page Header ── */}
      <div className="mb-7">
        <div className="flex items-start gap-4 mb-4">
          <div
            className="w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)', boxShadow: '0 4px 20px rgba(14,165,233,0.25)' }}
          >
            <Crown size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight leading-tight">
              Hub de Identidade e Acesso
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Gestão 360° — perfis, permissões, acessos ao portal, dispositivos e impersonation
            </p>
          </div>
          <div className="ml-auto">
            <button
              onClick={loadAll}
              disabled={loading}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(59,130,246,0.2)', color: '#6b7280' }}
            >
              <motion.div
                animate={loading ? { rotate: 360 } : {}}
                transition={loading ? { repeat: Infinity, duration: 0.8, ease: 'linear' } : {}}
              >
                <RefreshCw size={14} />
              </motion.div>
            </button>
          </div>
        </div>

        {/* Impersonation tip */}
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl w-fit"
          style={{ background: 'rgba(180,83,9,0.12)', border: '1px solid rgba(251,191,36,0.18)' }}>
          <Eye size={12} className="text-amber-400 flex-shrink-0" />
          <p className="text-amber-300/70 text-xs">
            Use <span className="font-semibold text-amber-300">Visualizar como</span> nos cards de Clientes e Parceiros para testar permissões em tempo real.
          </p>
        </div>
      </div>

      {/* ── Activity Stats Bar ── */}
      <IAMStatsBar stats={iamStats} loading={statsLoading} />

      {/* ── Pending Approvals ── */}
      <PendingApprovals onApproved={loadAll} />

      {/* ── Main Tabs ── */}
      <div className="flex gap-1 p-1 rounded-2xl mb-6 w-fit"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,130,246,0.12)' }}>
        {([
          { id: 'profiles' as const, label: 'Perfis & Identidades', icon: Users, desc: 'Equipe, clientes e parceiros' },
          { id: 'portal'   as const, label: 'Acessos ao Portal',    icon: Globe, desc: 'Criar e gerenciar logins externos' },
        ]).map(tab => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: active ? 'rgba(29,78,216,0.55)' : 'transparent',
                color: active ? '#93c5fd' : '#6b7280',
                border: active ? '1px solid rgba(59,130,246,0.4)' : '1px solid transparent',
              }}>
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">

        {/* ── TAB: Profiles ── */}
        {activeTab === 'profiles' && (
          <motion.div
            key="profiles"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {/* Search + Filter controls */}
            <div className="flex flex-col md:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3.5 top-3 text-gray-500" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por nome, e-mail ou função..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white outline-none transition-all focus:ring-1 focus:ring-blue-500/40"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(59,130,246,0.18)' }}
                />
              </div>

              <div className="flex gap-1 p-1 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,130,246,0.1)' }}>
                {FILTER_OPTIONS.map(opt => {
                  const Icon = opt.icon
                  const active = filter === opt.id
                  return (
                    <button key={opt.id} onClick={() => setFilter(opt.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
                      style={{
                        background: active ? 'rgba(29,78,216,0.55)' : 'transparent',
                        color: active ? '#93c5fd' : '#6b7280',
                        border: active ? '1px solid rgba(59,130,246,0.4)' : '1px solid transparent',
                      }}>
                      <Icon size={11} />
                      {opt.label}
                      {opt.id !== 'todos' && (
                        <span className="ml-0.5" style={{ color: active ? '#93c5fd60' : '#374151' }}>
                          ({allProfiles.filter(p => p.type === opt.id).length})
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Profile Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded-2xl h-56 animate-pulse"
                    style={{ background: 'rgba(255,255,255,0.03)' }} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-gray-600">
                <Filter size={36} className="mb-3 opacity-30" />
                <p className="text-sm">Nenhum perfil encontrado.</p>
              </div>
            ) : (
              <motion.div layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((p, i) => (
                  <ProfileCard
                    key={p.id}
                    profile={p}
                    index={i}
                    onEdit={setEditTarget}
                    onToggleActive={handleToggleActive}
                    onImpersonate={handleImpersonate}
                    onDevices={setDevicesTarget}
                    impersonating={impersonatingId === p.id}
                  />
                ))}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── TAB: Portal Access ── */}
        {activeTab === 'portal' && (
          <motion.div
            key="portal"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(59,130,246,0.12)' }}
          >
            <CreatePortalAccessPanel onCreated={loadAll} />
          </motion.div>
        )}

      </AnimatePresence>

      {/* ── Edit Drawer ── */}
      <AnimatePresence>
        {editTarget && (
          <ProfileEditDrawer
            profile={editTarget}
            onClose={() => setEditTarget(null)}
            onSaved={() => { loadAll(); setEditTarget(null) }}
          />
        )}
      </AnimatePresence>

      {/* ── Device Sessions Drawer ── */}
      <AnimatePresence>
        {devicesTarget && (
          <DeviceSessionsDrawer
            profile={devicesTarget}
            onClose={() => setDevicesTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Global Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-sm font-medium whitespace-nowrap"
            style={{
              background: toast.type === 'success' ? 'rgba(5,46,22,0.97)' : 'rgba(69,10,10,0.97)',
              border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
              color: toast.type === 'success' ? '#86efac' : '#fca5a5',
              backdropFilter: 'blur(16px)',
            }}>
            {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default IdentityControl
