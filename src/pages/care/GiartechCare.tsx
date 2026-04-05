import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, CheckCircle, Calendar, User, Wrench, AlertTriangle,
  Loader2, MessageCircle, Phone, MapPin, Clock, QrCode,
  FileText, ChevronRight, ExternalLink, RefreshCw, Wind,
  ShieldCheck, ShieldAlert, ShieldX, Activity, Star,
  Zap, Info, Package
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../contexts/UserContext'

interface ServiceOrder {
  os_id: string
  order_number: string
  title: string
  status: string
  created_at: string
  completed_at: string | null
  scheduled_at: string | null
  technician: string | null
  total_value: number | null
  track_token: string | null
}

interface AssetData {
  found: boolean
  asset_id?: string
  asset_name?: string
  model?: string
  brand?: string
  serial_number?: string
  location?: string
  asset_health?: string
  qr_code_token?: string
  last_maintenance?: string
  last_service_date?: string
  next_maintenance?: string
  last_technician?: string
  pmoc_active?: boolean
  customer_name?: string
  customer_id?: string
  warranty_expiry?: string
  warranty_days_left?: number | null
  warranty_active?: boolean
  service_orders?: ServiceOrder[]
}

const WHATSAPP_NUMBER = '5511555525600'
const COMPANY_NAME = 'GiarTech Soluções'
const BASE_URL = typeof window !== 'undefined' ? window.location.origin : ''

function formatDate(d?: string | null) {
  if (!d) return 'Não registrado'
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function formatShortDate(d?: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function daysSince(d?: string | null) {
  if (!d) return null
  return Math.floor((Date.now() - new Date(d + 'T00:00:00').getTime()) / 86400000)
}

function statusBadge(s: string) {
  const map: Record<string, { label: string; cls: string }> = {
    concluido:    { label: 'Concluído',    cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    concluded:    { label: 'Concluído',    cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    completed:    { label: 'Concluído',    cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    em_andamento: { label: 'Em Andamento', cls: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    aberto:       { label: 'Aberto',       cls: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    cancelado:    { label: 'Cancelado',    cls: 'bg-red-500/20 text-red-300 border-red-500/30' },
    pausado:      { label: 'Pausado',      cls: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  }
  return map[s] ?? { label: s, cls: 'bg-white/10 text-white/60 border-white/20' }
}

function WarrantyCounter({ daysLeft, active }: { daysLeft: number | null | undefined; active?: boolean }) {
  if (daysLeft === null || daysLeft === undefined) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
        <ShieldX className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-xs text-slate-400">Sem garantia registrada</span>
      </div>
    )
  }
  if (!active) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20">
        <ShieldX className="w-3.5 h-3.5 text-red-400" />
        <span className="text-xs text-red-400 font-semibold">Garantia expirada há {Math.abs(daysLeft)} dias</span>
      </div>
    )
  }
  const color = daysLeft <= 30 ? 'amber' : 'emerald'
  const Icon = daysLeft <= 30 ? ShieldAlert : ShieldCheck
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-${color}-500/10 border border-${color}-500/20`}>
      <Icon className={`w-3.5 h-3.5 text-${color}-400`} />
      <span className={`text-xs text-${color}-400 font-semibold`}>
        {daysLeft <= 30
          ? `Garantia vencendo em ${daysLeft} dias`
          : `Garantia ativa — ${daysLeft} dias restantes`}
      </span>
    </div>
  )
}

function QRDisplay({ value, size = 140 }: { value: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!ref.current || !value) return
    import('qrcode').then(QRCode => {
      QRCode.toCanvas(ref.current!, value, {
        width: size, margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' },
      })
    })
  }, [value, size])
  return <canvas ref={ref} className="rounded-xl shadow-xl" />
}

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-white/10 p-4 ${className}`}
      style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)' }}>
      {children}
    </div>
  )
}

export default function GiartechCare() {
  const { qr_code_id } = useParams<{ qr_code_id: string }>()
  const navigate = useNavigate()
  const { user, profile } = useUser()

  const [asset, setAsset] = useState<AssetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'qr'>('info')

  const isTechnician = profile?.role === 'technician' || profile?.user_type === 'tecnico'
  const isStaff = !!user && !isTechnician && profile?.role !== 'viewer'
  const isLoggedIn = !!user

  const load = useCallback(async (silent = false) => {
    if (!qr_code_id) { setLoading(false); return }
    if (!silent) setLoading(true)
    else setRefreshing(true)
    const { data } = await supabase.rpc('get_care_asset_by_token', { p_token: qr_code_id })
    setAsset(data as AssetData ?? { found: false })
    if (!silent) setLoading(false)
    else setRefreshing(false)
  }, [qr_code_id])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!asset?.asset_id) return
    const channel = supabase
      .channel(`care-os:${asset.asset_id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'service_orders', filter: `customer_equipment_id=eq.${asset.asset_id}` },
        () => load(true)
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [asset?.asset_id, load])

  function openWhatsApp() {
    const msg = encodeURIComponent(
      `Olá! Preciso de suporte para o equipamento *${asset?.asset_name || 'sem nome'}*`
      + (asset?.model ? ` (${asset.model})` : '')
      + (asset?.location ? ` — Local: ${asset.location}` : '')
      + `\nToken: ${qr_code_id}`
    )
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank')
  }

  function requestService() {
    if (isLoggedIn) {
      navigate('/ordens-servico/criar', { state: { equipment_id: asset?.asset_id, customer_id: asset?.customer_id } })
    } else {
      openWhatsApp()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #020617 0%, #0f172a 60%, #020a18 100%)' }}>
        <div className="text-center space-y-4">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
            <Loader2 className="h-10 w-10 text-blue-400 mx-auto" />
          </motion.div>
          <p className="text-slate-400 text-sm">Carregando identidade do equipamento...</p>
        </div>
      </div>
    )
  }

  if (!asset || !asset.found) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #020617 0%, #0f172a 60%, #020a18 100%)' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="max-w-sm w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <AlertTriangle className="h-10 w-10 text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">QR Code não encontrado</h1>
            <p className="text-slate-400 text-sm mt-2">
              Este código não corresponde a nenhum equipamento registrado.
              Entre em contato com a {COMPANY_NAME}.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button onClick={openWhatsApp}
              className="w-full flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white font-semibold py-3.5 px-6 rounded-2xl transition-colors shadow-lg">
              <MessageCircle className="h-5 w-5" />
              Falar com a {COMPANY_NAME}
            </button>
          </div>
          <p className="text-slate-600 text-xs">
            Propriedade de <span className="text-slate-500 font-semibold">{COMPANY_NAME}</span>
          </p>
        </motion.div>
      </div>
    )
  }

  const healthConf = {
    good:     { label: 'Operacional',         dot: 'bg-emerald-400', glow: '#10b981', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: <CheckCircle className="w-5 h-5" /> },
    warning:  { label: 'Verificação Indicada', dot: 'bg-amber-400',   glow: '#f59e0b', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',     icon: <AlertTriangle className="w-5 h-5" /> },
    critical: { label: 'Atenção Necessária',   dot: 'bg-red-400',     glow: '#ef4444', badge: 'bg-red-500/20 text-red-300 border-red-500/30',           icon: <Zap className="w-5 h-5" /> },
  }
  const h = healthConf[(asset.asset_health as keyof typeof healthConf) ?? 'good'] ?? healthConf.good
  const daysSinceMaint = daysSince(asset.last_maintenance || asset.last_service_date)
  const completedOS = (asset.service_orders ?? []).filter(o => ['concluido','concluded','completed'].includes(o.status))
  const openOS = (asset.service_orders ?? []).filter(o => !['concluido','concluded','completed','cancelado'].includes(o.status))

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg, #020617 0%, #0c1a33 50%, #020a18 100%)' }}>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10"
          style={{ background: `radial-gradient(circle, ${h.glow} 0%, transparent 70%)` }} />
        <div className="absolute bottom-32 left-0 w-64 h-64 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 flex-1 flex flex-col max-w-lg mx-auto w-full pb-32">

        <div className="px-5 pt-10 pb-5 text-center">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 text-xs font-bold px-4 py-1.5 rounded-full mb-5"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' }}>
              <Shield className="h-3.5 w-3.5" />
              {COMPANY_NAME}
            </div>
            <h1 className="text-2xl font-bold text-white">Identidade Digital</h1>
            <p className="text-slate-400 text-sm mt-1">do Equipamento</p>
          </motion.div>
        </div>

        <div className="px-4 space-y-4">

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="rounded-3xl p-5 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)',
                border: '1px solid rgba(255,255,255,0.12)',
                backdropFilter: 'blur(20px)',
                boxShadow: `0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.1)`
              }}>

              <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-15"
                style={{ background: `radial-gradient(circle, ${h.glow} 0%, transparent 70%)`, transform: 'translate(30%, -30%)' }} />

              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${h.glow}30 0%, ${h.glow}15 100%)`,
                    border: `1px solid ${h.glow}40`,
                    boxShadow: `0 0 20px ${h.glow}20`
                  }}>
                  <Wind className="h-7 w-7" style={{ color: h.glow }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full mb-2 border ${h.badge}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${h.dot} animate-pulse`} />
                    {h.label}
                  </div>
                  <h2 className="text-lg font-bold text-white leading-tight">{asset.asset_name}</h2>
                  {(asset.brand || asset.model) && (
                    <p className="text-sm text-slate-400 mt-0.5">
                      {[asset.brand, asset.model].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>

                <button onClick={() => load(true)}
                  className="p-2 rounded-xl hover:bg-white/10 transition text-slate-400"
                  title="Atualizar">
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {asset.customer_name && (
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs text-slate-400">Propriedade de </span>
                  <span className="text-xs text-white font-semibold">{asset.customer_name}</span>
                </div>
              )}

              {asset.location && (
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs text-slate-300">{asset.location}</span>
                </div>
              )}

              <WarrantyCounter daysLeft={asset.warranty_days_left} active={asset.warranty_active} />

              {openOS.length > 0 && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <Activity className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                  <span className="text-xs text-blue-300 font-semibold">
                    {openOS.length} OS em andamento
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {([
                { id: 'info',    label: 'Informações', icon: Info },
                { id: 'history', label: 'Histórico',   icon: FileText },
                { id: 'qr',      label: 'QR Code',     icon: QrCode },
              ] as const).map(tab => {
                const Icon = tab.icon
                const active = activeTab === tab.id
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      active ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'
                    }`}>
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </motion.div>

          <AnimatePresence mode="wait">

            {activeTab === 'info' && (
              <motion.div key="info" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="space-y-3">

                <GlassCard>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Manutenção</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.2)' }}>
                        <Calendar className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Última manutenção</p>
                        <p className="text-sm text-white font-semibold">{formatDate(asset.last_maintenance || asset.last_service_date)}</p>
                        {daysSinceMaint !== null && (
                          <p className={`text-xs font-medium ${daysSinceMaint > 180 ? 'text-red-400' : daysSinceMaint > 90 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            há {daysSinceMaint} dias
                          </p>
                        )}
                      </div>
                    </div>

                    {asset.next_maintenance && (
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.2)' }}>
                          <Clock className="h-4 w-4 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Próxima manutenção</p>
                          <p className="text-sm text-white font-semibold">{formatDate(asset.next_maintenance)}</p>
                        </div>
                      </div>
                    )}

                    {asset.last_technician && (
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.2)' }}>
                          <User className="h-4 w-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Último técnico</p>
                          <p className="text-sm text-white font-semibold">{asset.last_technician}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </GlassCard>

                {asset.serial_number && (
                  <GlassCard>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.15)' }}>
                        <Wrench className="h-4 w-4 text-slate-300" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Número de série</p>
                        <p className="text-sm text-white font-mono font-semibold">{asset.serial_number}</p>
                      </div>
                    </div>
                  </GlassCard>
                )}

                {asset.pmoc_active && (
                  <GlassCard className="border-emerald-500/20" style={{ background: 'rgba(16,185,129,0.06)' } as React.CSSProperties}>
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                      <div>
                        <p className="text-emerald-300 font-semibold text-sm">PMOC Ativo</p>
                        <p className="text-emerald-500 text-xs mt-0.5">Plano de Manutenção Preventiva em vigor</p>
                      </div>
                    </div>
                  </GlassCard>
                )}

                {isTechnician && (
                  <GlassCard className="border-amber-500/20" style={{ background: 'rgba(245,158,11,0.06)' } as React.CSSProperties}>
                    <p className="text-xs font-bold text-amber-400 uppercase tracking-wide mb-2 flex items-center gap-2">
                      <Star className="w-3.5 h-3.5" />
                      Notas Técnicas Internas
                    </p>
                    <p className="text-xs text-slate-400">
                      Acesse a OS completa para visualizar notas técnicas, fotos de manutenções anteriores e histórico detalhado.
                    </p>
                    <button
                      onClick={() => navigate(`/ordens-servico?equipment=${asset.asset_id}`)}
                      className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold text-amber-300 border border-amber-500/30 hover:bg-amber-500/10 transition">
                      <ChevronRight className="w-3.5 h-3.5" />
                      Ver OSs deste equipamento
                    </button>
                  </GlassCard>
                )}
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="space-y-3">

                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Ordens de Serviço ({(asset.service_orders ?? []).length})
                  </p>
                  {isStaff && (
                    <button onClick={requestService}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-300 border border-blue-500/30 hover:bg-blue-500/10 transition">
                      <Package className="w-3 h-3" />
                      Nova OS
                    </button>
                  )}
                </div>

                {(asset.service_orders ?? []).length === 0 ? (
                  <GlassCard>
                    <div className="text-center py-6">
                      <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm">Nenhuma OS registrada ainda</p>
                    </div>
                  </GlassCard>
                ) : (
                  <div className="space-y-2">
                    {(asset.service_orders ?? []).map(os => {
                      const badge = statusBadge(os.status)
                      return (
                        <motion.div key={os.os_id} layout>
                          <GlassCard>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="text-xs font-mono text-slate-400">{os.order_number}</span>
                                  <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.cls}`}>
                                    {badge.label}
                                  </span>
                                </div>
                                <p className="text-sm text-white font-semibold leading-tight">{os.title}</p>
                                <div className="flex flex-wrap gap-3 mt-1.5">
                                  {os.technician && (
                                    <span className="flex items-center gap-1 text-xs text-slate-500">
                                      <User className="w-3 h-3" />
                                      {os.technician}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1 text-xs text-slate-500">
                                    <Calendar className="w-3 h-3" />
                                    {formatShortDate(os.completed_at || os.created_at)}
                                  </span>
                                </div>
                              </div>
                              {os.track_token && (
                                <a href={`${BASE_URL}/track/${os.track_token}`} target="_blank" rel="noopener noreferrer"
                                  className="flex-shrink-0 p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition">
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          </GlassCard>
                        </motion.div>
                      )
                    })}
                  </div>
                )}

                {completedOS.length > 0 && (
                  <GlassCard>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-white font-semibold">{completedOS.length} manutenções realizadas</p>
                        <p className="text-xs text-slate-500 mt-0.5">Histórico completo de serviços {COMPANY_NAME}</p>
                      </div>
                    </div>
                  </GlassCard>
                )}
              </motion.div>
            )}

            {activeTab === 'qr' && (
              <motion.div key="qr" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="space-y-4">
                <GlassCard>
                  <div className="flex flex-col items-center text-center gap-4">
                    <QRDisplay value={`${BASE_URL}/care/${asset.qr_code_token}`} size={160} />
                    <div>
                      <p className="text-sm text-white font-semibold">{asset.asset_name}</p>
                      <p className="text-xs text-slate-500 mt-1 font-mono break-all">
                        {BASE_URL}/care/{asset.qr_code_token}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500">
                      Este código QR é permanente e aponta sempre para este equipamento, mesmo que os dados do cliente sejam atualizados.
                    </p>
                  </div>
                </GlassCard>
              </motion.div>
            )}

          </AnimatePresence>

          <div className="pb-4 text-center pt-2">
            <p className="text-slate-600 text-xs">
              Equipamento monitorado por <span className="text-slate-500 font-semibold">{COMPANY_NAME}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 p-4"
        style={{ background: 'linear-gradient(to top, rgba(2,6,23,1) 0%, rgba(2,6,23,0.95) 60%, transparent 100%)' }}>
        <div className="max-w-lg mx-auto space-y-2">
          <motion.button
            onClick={requestService}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            className="w-full flex items-center justify-center gap-3 text-white font-bold py-4 px-6 rounded-2xl text-base transition-all shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: '0 8px 30px rgba(16,185,129,0.35)'
            }}>
            <MessageCircle className="h-5 w-5" />
            Solicitar Manutenção
          </motion.button>
          <div className="flex items-center justify-center gap-2">
            <Phone className="h-3 w-3 text-slate-600" />
            <p className="text-slate-600 text-xs">Atendimento via WhatsApp · Resposta imediata</p>
          </div>
        </div>
      </div>
    </div>
  )
}
