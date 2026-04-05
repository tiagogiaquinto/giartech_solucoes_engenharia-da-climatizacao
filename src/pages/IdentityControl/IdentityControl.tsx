import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Shield, Search, RefreshCw, Filter,
  AlertCircle, CheckCircle, Crown, UserCog, Building2, Wrench,
  Eye
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../contexts/UserContext'
import { useImpersonation } from '../../contexts/ImpersonationContext'
import { AnyProfile, StaffProfile, PortalProfile } from './types'
import { ProfileCard } from './ProfileCard'
import { ProfileEditDrawer } from './ProfileEditDrawer'

type FilterType = 'todos' | 'staff' | 'cliente' | 'parceiro'

const FILTER_OPTIONS: { id: FilterType; label: string; icon: React.ElementType }[] = [
  { id: 'todos',    label: 'Todos',      icon: Users },
  { id: 'staff',    label: 'Equipe',     icon: UserCog },
  { id: 'cliente',  label: 'Clientes',   icon: Building2 },
  { id: 'parceiro', label: 'Parceiros',  icon: Wrench },
]

const IdentityControl: React.FC = () => {
  const { user, isSuperAdmin } = useUser()
  const { startImpersonation, loading: impersonating, error: impersonationError, session: impSession } = useImpersonation()
  const [allProfiles, setAllProfiles] = useState<AnyProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('todos')
  const [search, setSearch] = useState('')
  const [editTarget, setEditTarget] = useState<AnyProfile | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null)

  const isAdmin = isSuperAdmin || (user as any)?.role === 'admin'

  useEffect(() => { loadProfiles() }, [])

  useEffect(() => {
    if (impersonationError) {
      showToast('error', impersonationError)
      setImpersonatingId(null)
    }
  }, [impersonationError])

  const loadProfiles = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('admin_get_all_profiles')
      if (error) throw error
      const staff: StaffProfile[] = (data?.staff || []).map((p: any) => ({ ...p, type: 'staff' }))
      const portal: PortalProfile[] = (data?.portal || []).map((p: any) => ({ ...p }))
      setAllProfiles([...staff, ...portal])
    } catch {
      showToast('error', 'Erro ao carregar perfis.')
    }
    setLoading(false)
  }

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }

  const handleToggleActive = async (profile: AnyProfile) => {
    const newVal = !profile.is_active
    const targetType = profile.type === 'staff' ? 'staff' : 'portal'
    try {
      const { error } = await supabase.rpc('admin_toggle_profile_active', {
        p_target_id:   profile.id,
        p_target_type: targetType,
        p_is_active:   newVal,
      })
      if (error) throw error
      showToast('success', `Perfil ${newVal ? 'ativado' : 'desativado'}.`)
      loadProfiles()
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

  const stats = useMemo(() => ({
    total:     allProfiles.length,
    staff:     allProfiles.filter(p => p.type === 'staff').length,
    clientes:  allProfiles.filter(p => p.type === 'cliente').length,
    parceiros: allProfiles.filter(p => p.type === 'parceiro').length,
    ativos:    allProfiles.filter(p => p.is_active).length,
  }), [allProfiles])

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="text-center">
          <Shield size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-white font-semibold text-xl mb-2">Acesso Restrito</h2>
          <p className="text-gray-400">Apenas Administradores têm acesso ao Centro de Controle.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6" style={{ background: '#080f1f' }}>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
            <Crown size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Centro de Controle de Identidades</h1>
            <p className="text-gray-400 text-sm">Gestão 360° — edição, permissões e impersonation de perfis</p>
          </div>
        </div>

        {/* Impersonation hint */}
        <div className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl w-fit"
          style={{ background: 'rgba(180,83,9,0.15)', border: '1px solid rgba(251,191,36,0.2)' }}>
          <Eye size={13} className="text-amber-400 flex-shrink-0" />
          <p className="text-amber-300/80 text-xs">
            Use <span className="font-semibold text-amber-300">Visualizar como</span> nos cards de Clientes e Parceiros
            para abrir o portal deles em uma nova aba sem precisar da senha.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {[
          { label: 'Total',     value: stats.total,     color: '#60a5fa' },
          { label: 'Equipe',    value: stats.staff,     color: '#34d399' },
          { label: 'Clientes',  value: stats.clientes,  color: '#67e8f9' },
          { label: 'Parceiros', value: stats.parceiros, color: '#c4b5fd' },
          { label: 'Ativos',    value: stats.ativos,    color: '#4ade80' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 text-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,130,246,0.12)' }}>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-3 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail ou função..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}
          />
        </div>

        <div className="flex gap-1 p-1 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,130,246,0.12)' }}>
          {FILTER_OPTIONS.map(opt => {
            const Icon = opt.icon
            const active = filter === opt.id
            return (
              <button key={opt.id} onClick={() => setFilter(opt.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: active ? 'rgba(29,78,216,0.6)' : 'transparent',
                  color: active ? '#93c5fd' : '#6b7280',
                  border: active ? '1px solid rgba(59,130,246,0.4)' : '1px solid transparent',
                }}>
                <Icon size={12} />
                {opt.label}
              </button>
            )
          })}
        </div>

        <button onClick={loadProfiles} disabled={loading}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(59,130,246,0.2)', color: '#6b7280' }}>
          <motion.div animate={loading ? { rotate: 360 } : {}}
            transition={loading ? { repeat: Infinity, duration: 0.8, ease: 'linear' } : {}}>
            <RefreshCw size={15} />
          </motion.div>
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl h-52 animate-pulse"
              style={{ background: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-500">
          <Filter size={36} className="mb-3 opacity-40" />
          <p className="text-sm">Nenhum perfil encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p, i) => (
            <ProfileCard
              key={p.id}
              profile={p}
              index={i}
              onEdit={setEditTarget}
              onToggleActive={handleToggleActive}
              onImpersonate={handleImpersonate}
              impersonating={impersonatingId === p.id}
            />
          ))}
        </div>
      )}

      {/* Edit Drawer */}
      <AnimatePresence>
        {editTarget && (
          <ProfileEditDrawer
            profile={editTarget}
            onClose={() => setEditTarget(null)}
            onSaved={() => { loadProfiles(); setEditTarget(null) }}
          />
        )}
      </AnimatePresence>

      {/* Global Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-sm font-medium whitespace-nowrap"
            style={{
              background: toast.type === 'success' ? 'rgba(5,46,22,0.96)' : 'rgba(69,10,10,0.96)',
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
