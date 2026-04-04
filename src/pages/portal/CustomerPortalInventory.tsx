import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package, MapPin, Calendar, AlertTriangle, CheckCircle2,
  RefreshCw, X, Wrench, Thermometer, Wind, Zap, Settings,
  ShieldCheck, ShieldAlert, ShieldX, Clock, ChevronRight,
  QrCode, Camera, FileText, Image as ImageIcon, Bell,
  ArrowLeft, CheckCircle, XCircle, PauseCircle,
  Activity, Layers
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { usePortal } from '../../contexts/PortalContext'

interface Equipment {
  id: string
  name: string
  equipment_type: string
  model: string
  brand: string
  serial_number: string
  location: string
  floor_area: string
  installed_at: string | null
  useful_life_years: number
  capacity: string
  notes: string
  is_active: boolean
  qr_code: string | null
  intervention_count: number
  last_intervention_date: string | null
  depreciation_percent: number
  remaining_life_years: number
  age_years: number
}

interface OSEntry {
  os_id: string
  order_number: string
  title: string
  status: string
  created_at: string
  scheduled_at: string | null
  completed_at: string | null
  technician_name: string
  total_value: number
  warranty_end_date: string | null
  warranty_status: string
  relatorio_tecnico: string
  has_photos: boolean
}

interface Photo {
  photo_id: string
  os_id: string
  order_number: string
  photo_url: string
  photo_type: string
  description: string
  taken_at: string
}

type HealthLevel = 'ok' | 'attention' | 'critical'
type DetailTab = 'timeline' | 'photos' | 'qrcode'

const getHealth = (eq: Equipment): HealthLevel => {
  if (eq.depreciation_percent >= 80 || eq.intervention_count >= 5) return 'critical'
  if (eq.depreciation_percent >= 50) return 'attention'
  return 'ok'
}

const needsPreventiveMaintenance = (eq: Equipment): boolean => {
  if (!eq.last_intervention_date) return true
  const months = (Date.now() - new Date(eq.last_intervention_date).getTime()) / (1000 * 60 * 60 * 24 * 30)
  return months >= 6
}

const HEALTH_CONFIG: Record<HealthLevel, {
  label: string; bg: string; border: string; badge: string; icon: React.ReactNode; dot: string
}> = {
  ok:        { label: 'Operacional', bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 size={14} />, dot: 'bg-emerald-400' },
  attention: { label: 'Atencao',    bg: 'bg-amber-50',   border: 'border-amber-200',   badge: 'bg-amber-100 text-amber-700',    icon: <AlertTriangle size={14} />, dot: 'bg-amber-400'   },
  critical:  { label: 'Critico',    bg: 'bg-red-50',     border: 'border-red-200',     badge: 'bg-red-100 text-red-700',        icon: <ShieldX size={14} />,       dot: 'bg-red-400'     },
}

const WARRANTY_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  vigente:      { label: 'Em Garantia',    color: 'bg-emerald-100 text-emerald-700', icon: <ShieldCheck size={12} /> },
  vencendo:     { label: 'Vencendo',       color: 'bg-amber-100 text-amber-700',     icon: <ShieldAlert size={12} /> },
  vencida:      { label: 'Garantia Venc.', color: 'bg-red-100 text-red-700',         icon: <ShieldX size={12} />     },
  sem_garantia: { label: 'Sem Garantia',   color: 'bg-gray-100 text-gray-500',       icon: <ShieldX size={12} />     },
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  aberto:       { label: 'Aberto',       color: 'bg-blue-100 text-blue-700',       icon: <Clock size={12} />        },
  em_andamento: { label: 'Em Andamento', color: 'bg-amber-100 text-amber-700',     icon: <Activity size={12} />     },
  concluido:    { label: 'Concluido',    color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle size={12} />  },
  cancelado:    { label: 'Cancelado',    color: 'bg-red-100 text-red-700',         icon: <XCircle size={12} />      },
  pausado:      { label: 'Pausado',      color: 'bg-gray-100 text-gray-600',       icon: <PauseCircle size={12} /> },
  aguardando:   { label: 'Aguardando',   color: 'bg-gray-100 text-gray-600',       icon: <Clock size={12} />        },
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  'Ar Condicionado': <Wind size={22} />,
  'Chiller':         <Thermometer size={22} />,
  'Eletrico':        <Zap size={22} />,
  'Mecanico':        <Settings size={22} />,
}

function DeprecBar({ pct }: { pct: number }) {
  const clipped = Math.min(pct, 100)
  const color = clipped >= 80 ? 'bg-red-500' : clipped >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${clipped}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  )
}

function QRCodeDisplay({ value, size = 160 }: { value: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!canvasRef.current || !value) return
    import('qrcode').then(QRCode => {
      QRCode.toCanvas(canvasRef.current!, value, {
        width: size, margin: 2,
        color: { dark: '#1e293b', light: '#ffffff' },
      })
    }).catch(() => {})
  }, [value, size])
  return <canvas ref={canvasRef} className="rounded-lg" />
}

function EquipmentDetailDrawer({
  equipment, customerId, onClose,
}: {
  equipment: Equipment; customerId: string; onClose: () => void
}) {
  const [tab, setTab] = useState<DetailTab>('timeline')
  const [timeline, setTimeline] = useState<OSEntry[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loadingTimeline, setLoadingTimeline] = useState(false)
  const [loadingPhotos, setLoadingPhotos] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [requestSent, setRequestSent] = useState(false)
  const [sendingRequest, setSendingRequest] = useState(false)
  const health = getHealth(equipment)
  const needsMaint = needsPreventiveMaintenance(equipment)

  useEffect(() => { loadTimeline() }, [equipment.id])
  useEffect(() => { if (tab === 'photos' && photos.length === 0) loadPhotos() }, [tab])

  const loadTimeline = async () => {
    setLoadingTimeline(true)
    try {
      const { data } = await supabase.rpc('get_equipment_service_timeline', {
        p_equipment_id: equipment.id, p_customer_id: customerId,
      })
      setTimeline(data || [])
    } finally { setLoadingTimeline(false) }
  }

  const loadPhotos = async () => {
    setLoadingPhotos(true)
    try {
      const { data } = await supabase.rpc('get_equipment_photos', {
        p_equipment_id: equipment.id, p_customer_id: customerId,
      })
      setPhotos(data || [])
    } finally { setLoadingPhotos(false) }
  }

  const handleRequestMaintenance = async () => {
    setSendingRequest(true)
    try {
      await supabase.from('portal_service_requests').insert({
        customer_id: customerId,
        title: `Manutencao Preventiva - ${equipment.name}`,
        description: `Solicitacao de manutencao preventiva para: ${equipment.name} (${equipment.brand} ${equipment.model}) em ${equipment.location}.`,
        priority: 'normal',
        status: 'pendente',
      })
      setRequestSent(true)
    } catch (err) { console.error(err) }
    finally { setSendingRequest(false) }
  }

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('pt-BR') : '—'
  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
  const hCfg = HEALTH_CONFIG[health]
  const TypeIconNode = TYPE_ICON[equipment.equipment_type] || <Package size={22} />

  return (
    <>
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <img src={lightbox} alt="" className="max-w-full max-h-full rounded-xl object-contain" />
            <button className="absolute top-4 right-4 p-2 bg-white/10 rounded-full" onClick={() => setLightbox(null)}>
              <X size={20} className="text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/40"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-xl bg-white shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className={`px-6 py-5 ${hCfg.bg} border-b ${hCfg.border}`}>
          <div className="flex items-center gap-3 mb-4">
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/60 transition-colors">
              <ArrowLeft size={18} className="text-gray-700" />
            </button>
            <span className="text-xs text-gray-500 font-medium">Detalhe do Equipamento</span>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/80 rounded-2xl flex items-center justify-center shadow-sm text-gray-600 shrink-0">
              {TypeIconNode}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-900 text-lg leading-tight">{equipment.name}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{equipment.brand} {equipment.model}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${hCfg.badge}`}>
                  {hCfg.icon} {hCfg.label}
                </span>
                {equipment.location && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin size={11} /> {equipment.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          {needsMaint && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-start gap-3 bg-amber-500 rounded-xl px-4 py-3 text-white"
            >
              <Bell size={16} className="shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold">Manutencao Preventiva Necessaria</p>
                <p className="text-xs text-amber-100 mt-0.5">Este equipamento esta ha mais de 6 meses sem servico preventivo.</p>
              </div>
              {!requestSent ? (
                <button
                  onClick={handleRequestMaintenance} disabled={sendingRequest}
                  className="shrink-0 px-3 py-1.5 bg-white text-amber-700 text-xs font-bold rounded-lg hover:bg-amber-50 transition-colors disabled:opacity-60"
                >
                  {sendingRequest ? '...' : 'Solicitar'}
                </button>
              ) : (
                <span className="shrink-0 px-3 py-1.5 bg-white/20 text-white text-xs font-bold rounded-lg">Enviado!</span>
              )}
            </motion.div>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50/50">
          {[
            { label: 'Intervencoes', value: String(equipment.intervention_count) },
            { label: 'Depreciacao',  value: `${Math.round(equipment.depreciation_percent)}%` },
            { label: 'Idade',        value: equipment.age_years > 0 ? `${equipment.age_years.toFixed(1)}a` : '—' },
          ].map(s => (
            <div key={s.label} className="py-3 text-center">
              <p className="text-lg font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Depreciation bar */}
        <div className="px-6 py-3 border-b border-gray-100">
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>Vida util restante: {equipment.remaining_life_years.toFixed(1)} anos</span>
            <span>{Math.round(equipment.depreciation_percent)}% consumido</span>
          </div>
          <DeprecBar pct={equipment.depreciation_percent} />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {([
            { id: 'timeline', label: 'Historico', icon: <Activity size={14} /> },
            { id: 'photos',   label: 'Fotos',     icon: <Camera size={14} />   },
            { id: 'qrcode',   label: 'QR Code',   icon: <QrCode size={14} />   },
          ] as { id: DetailTab; label: string; icon: React.ReactNode }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors border-b-2 ${
                tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'timeline' && (
            <div className="p-4">
              {loadingTimeline ? (
                <div className="flex justify-center py-12"><RefreshCw size={22} className="animate-spin text-blue-500" /></div>
              ) : timeline.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Layers size={36} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhum historico de servico encontrado</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
                  <div className="space-y-4">
                    {timeline.map((os, i) => {
                      const stCfg = STATUS_CONFIG[os.status] || STATUS_CONFIG.aberto
                      const wCfg  = WARRANTY_CONFIG[os.warranty_status] || WARRANTY_CONFIG.sem_garantia
                      return (
                        <motion.div
                          key={os.os_id}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="relative pl-10"
                        >
                          <div className="absolute left-2.5 top-3 w-3 h-3 rounded-full border-2 border-white bg-blue-500 shadow-sm" />
                          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <span className="font-mono text-xs text-gray-400">OS {os.order_number}</span>
                                <p className="font-semibold text-gray-900 text-sm mt-0.5">{os.title}</p>
                              </div>
                              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${stCfg.color}`}>
                                {stCfg.icon} {stCfg.label}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                              {os.technician_name && (
                                <span className="flex items-center gap-1"><Wrench size={11} /> {os.technician_name}</span>
                              )}
                              <span className="flex items-center gap-1"><Calendar size={11} /> {formatDate(os.created_at)}</span>
                              {os.completed_at && (
                                <span className="flex items-center gap-1"><CheckCircle2 size={11} /> Concl. {formatDate(os.completed_at)}</span>
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${wCfg.color}`}>
                                {wCfg.icon} {wCfg.label}
                                {os.warranty_end_date && ` ate ${formatDate(os.warranty_end_date)}`}
                              </span>
                              {os.total_value > 0 && (
                                <span className="text-xs font-semibold text-gray-700">{formatCurrency(os.total_value)}</span>
                              )}
                            </div>
                            {os.relatorio_tecnico && (
                              <div className="mt-2 pt-2 border-t border-gray-50">
                                <p className="text-xs text-gray-400 font-medium mb-1 flex items-center gap-1">
                                  <FileText size={10} /> Relatorio Tecnico
                                </p>
                                <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{os.relatorio_tecnico}</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'photos' && (
            <div className="p-4">
              {loadingPhotos ? (
                <div className="flex justify-center py-12"><RefreshCw size={22} className="animate-spin text-blue-500" /></div>
              ) : photos.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <ImageIcon size={36} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhuma foto registrada</p>
                </div>
              ) : (
                <>
                  {(['before', 'after', 'during', 'completed', 'issue'] as const).map(type => {
                    const group = photos.filter(p => p.photo_type === type)
                    if (!group.length) return null
                    const labels: Record<string, string> = {
                      before: 'Antes', after: 'Depois', during: 'Durante',
                      completed: 'Concluido', issue: 'Problema Encontrado',
                    }
                    return (
                      <div key={type} className="mb-6">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{labels[type]}</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {group.map(p => (
                            <button
                              key={p.photo_id}
                              onClick={() => setLightbox(p.photo_url)}
                              className="aspect-square rounded-xl overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity"
                            >
                              <img
                                src={p.photo_url} alt={p.description}
                                className="w-full h-full object-cover"
                                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          )}

          {tab === 'qrcode' && (
            <div className="p-6 flex flex-col items-center gap-6">
              <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col items-center gap-4">
                {equipment.qr_code ? (
                  <QRCodeDisplay value={equipment.qr_code} size={160} />
                ) : (
                  <div className="w-40 h-40 bg-gray-100 rounded-xl flex items-center justify-center">
                    <QrCode size={40} className="text-gray-300" />
                  </div>
                )}
                <div className="text-center">
                  <p className="font-bold text-gray-900">{equipment.name}</p>
                  <p className="text-sm text-gray-400 font-mono mt-1">{equipment.qr_code || '—'}</p>
                </div>
              </div>

              <div className="w-full bg-blue-50 rounded-2xl p-4 text-sm text-blue-700">
                <p className="font-semibold flex items-center gap-2 mb-2">
                  <QrCode size={15} /> Como usar o QR Code
                </p>
                <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside">
                  <li>Imprima e cole na carcaca do equipamento</li>
                  <li>Escaneie para acessar o historico completo</li>
                  <li>O tecnico pode escanear na chegada para registrar o atendimento</li>
                </ul>
              </div>

              <div className="w-full bg-gray-50 rounded-2xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Especificacoes</p>
                <div className="space-y-2">
                  {[
                    { label: 'Tipo',         value: equipment.equipment_type },
                    { label: 'Marca',        value: equipment.brand          },
                    { label: 'Modelo',       value: equipment.model          },
                    { label: 'No. Serie',    value: equipment.serial_number  },
                    { label: 'Capacidade',   value: equipment.capacity       },
                    { label: 'Instalado em', value: equipment.installed_at ? new Date(equipment.installed_at).toLocaleDateString('pt-BR') : '' },
                    { label: 'Vida util',    value: `${equipment.useful_life_years} anos` },
                  ].filter(r => r.value).map(row => (
                    <div key={row.label} className="flex justify-between text-xs">
                      <span className="text-gray-400">{row.label}</span>
                      <span className="text-gray-700 font-medium">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  )
}

export default function CustomerPortalInventory() {
  const { portalUser } = usePortal()
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Equipment | null>(null)
  const [filterLocation, setFilterLocation] = useState('')
  const [filterHealth, setFilterHealth] = useState<'' | HealthLevel>('')
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const loadEquipment = useCallback(async () => {
    if (!portalUser?.linked_customer_id) return
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_customer_portal_equipment', {
        p_customer_id: portalUser.linked_customer_id,
      })
      if (!error) setEquipment(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [portalUser?.linked_customer_id])

  useEffect(() => {
    if (!portalUser?.linked_customer_id) return
    loadEquipment()
    const ch = supabase
      .channel(`portal-inventory-${portalUser.linked_customer_id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_orders' }, loadEquipment)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portal_equipment_inventory' }, loadEquipment)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'os_milestones' }, loadEquipment)
      .subscribe()
    channelRef.current = ch
    return () => { ch.unsubscribe() }
  }, [portalUser?.linked_customer_id, loadEquipment])

  const locations = Array.from(new Set(equipment.map(e => e.location).filter(Boolean)))

  const filtered = equipment.filter(e => {
    if (filterLocation && e.location !== filterLocation) return false
    if (filterHealth && getHealth(e) !== filterHealth) return false
    return true
  })

  const stats = {
    total:     equipment.length,
    ok:        equipment.filter(e => getHealth(e) === 'ok').length,
    attention: equipment.filter(e => getHealth(e) === 'attention').length,
    alerts:    equipment.filter(needsPreventiveMaintenance).length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus Equipamentos</h1>
          <p className="text-gray-500 text-sm">Gestao completa do seu patrimonio</p>
        </div>
        <button onClick={loadEquipment} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <RefreshCw size={18} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {!loading && equipment.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total de Ativos',  value: stats.total,     icon: <Package size={18} />,       bg: 'bg-blue-50',    text: 'text-blue-600'    },
            { label: 'Operacionais',     value: stats.ok,        icon: <CheckCircle2 size={18} />,  bg: 'bg-emerald-50', text: 'text-emerald-600' },
            { label: 'Em Atencao',       value: stats.attention, icon: <AlertTriangle size={18} />, bg: 'bg-amber-50',   text: 'text-amber-600'   },
            { label: 'Alertas Prevent.', value: stats.alerts,    icon: <Bell size={18} />,          bg: 'bg-red-50',     text: 'text-red-600'     },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
            >
              <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-2`}>
                <span className={s.text}>{s.icon}</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && equipment.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <select
            value={filterLocation}
            onChange={e => setFilterLocation(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os locais</option>
            {locations.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select
            value={filterHealth}
            onChange={e => setFilterHealth(e.target.value as '' | HealthLevel)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os status</option>
            <option value="ok">Operacional</option>
            <option value="attention">Atencao</option>
            <option value="critical">Critico</option>
          </select>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-pulse">
              <div className="flex gap-3 mb-4">
                <div className="w-11 h-11 bg-gray-100 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Package size={48} className="mx-auto mb-3 opacity-20" />
          <p className="font-medium">Nenhum equipamento encontrado</p>
          <p className="text-sm mt-1">Ajuste os filtros ou aguarde o cadastro pelo administrador</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((eq, i) => {
            const h = getHealth(eq)
            const cfg = HEALTH_CONFIG[h]
            const hasMaintAlert = needsPreventiveMaintenance(eq)
            const IconNode = TYPE_ICON[eq.equipment_type] || <Package size={20} />
            return (
              <motion.div
                key={eq.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelected(eq)}
                className={`bg-white rounded-2xl p-5 shadow-sm border cursor-pointer hover:shadow-md transition-all group ${cfg.border}`}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-11 h-11 ${cfg.bg} rounded-xl flex items-center justify-center shrink-0 text-gray-600`}>
                    {IconNode}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{eq.name}</p>
                    <p className="text-xs text-gray-400 truncate">{eq.brand} {eq.model}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors mt-0.5 shrink-0" />
                </div>

                <div className="space-y-2.5">
                  {eq.location && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <MapPin size={12} /> {eq.location}
                    </div>
                  )}
                  {eq.last_intervention_date && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Calendar size={12} /> Ultima manutencao: {new Date(eq.last_intervention_date).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Vida util</span>
                      <span>{Math.round(eq.depreciation_percent)}%</span>
                    </div>
                    <DeprecBar pct={eq.depreciation_percent} />
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.badge}`}>
                      {cfg.icon} {cfg.label}
                    </span>
                    {eq.intervention_count > 0 && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                        <Wrench size={10} /> {eq.intervention_count} servico{eq.intervention_count !== 1 ? 's' : ''}
                      </span>
                    )}
                    {hasMaintAlert && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 font-medium">
                        <Bell size={10} /> Prev. necessaria
                      </span>
                    )}
                    {eq.qr_code && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">
                        <QrCode size={10} /> QR
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {selected && portalUser?.linked_customer_id && (
          <EquipmentDetailDrawer
            key={selected.id}
            equipment={selected}
            customerId={portalUser.linked_customer_id}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
