import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package, MapPin, Calendar, AlertTriangle, CheckCircle2,
  RefreshCw, X, Wrench, BarChart2, Thermometer, Wind, Zap,
  Settings, ShieldCheck, ShieldAlert, ShieldX, Loader2,
  MessageSquarePlus, Image as ImageIcon, Clock, BatteryMedium
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
  intervention_count: number
  last_intervention_date: string | null
  depreciation_percent: number
  remaining_life_years: number
  age_years: number
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  'Ar Condicionado': <Wind size={20} />,
  'Chiller': <Thermometer size={20} />,
  'Elétrico': <Zap size={20} />,
  'Mecânico': <Settings size={20} />,
}

type HealthLevel = 'ok' | 'attention' | 'critical'

const getHealth = (eq: Equipment): HealthLevel => {
  const highInterventions = eq.intervention_count >= 5
  if (eq.depreciation_percent >= 80 || highInterventions) return 'critical'
  if (eq.depreciation_percent >= 50) return 'attention'
  return 'ok'
}

const HEALTH_CONFIG: Record<HealthLevel, {
  label: string
  icon: React.ReactNode
  badge: string
  iconBg: string
  iconColor: string
  ring: string
  dot: string
  bar: string
}> = {
  ok: {
    label: 'Saúde OK',
    icon: <ShieldCheck size={14} />,
    badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    ring: 'ring-emerald-200',
    dot: 'bg-emerald-500',
    bar: 'bg-emerald-500',
  },
  attention: {
    label: 'Atenção',
    icon: <ShieldAlert size={14} />,
    badge: 'bg-amber-50 text-amber-700 border border-amber-200',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    ring: 'ring-amber-200',
    dot: 'bg-amber-500',
    bar: 'bg-amber-500',
  },
  critical: {
    label: 'Crítico',
    icon: <ShieldX size={14} />,
    badge: 'bg-red-50 text-red-700 border border-red-200',
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600',
    ring: 'ring-red-200',
    dot: 'bg-red-500',
    bar: 'bg-red-400',
  },
}

interface MaintenanceDrawerProps {
  equipment: Equipment | null
  onClose: () => void
  portalUser: any
  onSuccess: () => void
}

function MaintenanceDrawer({ equipment, onClose, portalUser, onSuccess }: MaintenanceDrawerProps) {
  const [submitting, setSubmitting] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'normal',
  })

  useEffect(() => {
    if (equipment) {
      setForm({
        title: `Manutenção: ${equipment.name}`,
        description: `Equipamento: ${equipment.name}\nTipo: ${equipment.equipment_type}\nLocalização: ${equipment.location}${equipment.floor_area ? ` — ${equipment.floor_area}` : ''}\nMarca/Modelo: ${[equipment.brand, equipment.model].filter(Boolean).join(' ') || '—'}\nNúmero de Série: ${equipment.serial_number || '—'}\n\nDescreva o problema aqui...`,
        priority: getHealth(equipment) === 'critical' ? 'urgente' : 'normal',
      })
      setPhotos([])
    }
  }, [equipment])

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setPhotos(prev => [...prev, ev.target?.result as string])
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!portalUser) return
    setSubmitting(true)
    try {
      await supabase.from('portal_service_requests').insert({
        portal_account_id: portalUser.account_id,
        customer_id: portalUser.linked_customer_id,
        title: form.title,
        description: form.description,
        priority: form.priority,
        photos,
      })
      onSuccess()
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {equipment && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          <motion.div
            key="drawer"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[92vh] flex flex-col"
          >
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-0.5">Solicitar Manutenção</p>
                <h3 className="font-bold text-gray-900 text-base leading-tight">{equipment.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{equipment.location}{equipment.floor_area ? ` — ${equipment.floor_area}` : ''}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Título <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Descrição do Problema <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    required
                    rows={5}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Prioridade</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { value: 'baixa', label: 'Baixa', cls: 'border-gray-200 text-gray-600' },
                      { value: 'normal', label: 'Normal', cls: 'border-blue-200 text-blue-600' },
                      { value: 'alta', label: 'Alta', cls: 'border-amber-200 text-amber-600' },
                      { value: 'urgente', label: 'Urgente', cls: 'border-red-200 text-red-600' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, priority: opt.value }))}
                        className={`py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                          form.priority === opt.value
                            ? `${opt.cls} bg-opacity-10 scale-105 shadow-sm`
                            : 'border-gray-100 text-gray-400'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Fotos (opcional)
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {photos.map((photo, i) => (
                      <div key={i} className="relative w-16 h-16">
                        <img src={photo} className="w-full h-full object-cover rounded-xl border border-gray-200" alt="" />
                        <button
                          type="button"
                          onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    {photos.length < 5 && (
                      <label className="w-16 h-16 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                        <ImageIcon size={16} className="text-gray-400" />
                        <span className="text-[10px] text-gray-400">Foto</span>
                        <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
                      </label>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-2 pb-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 border border-gray-200 text-gray-600 text-sm font-semibold rounded-2xl hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-2xl transition-colors"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <MessageSquarePlus size={16} />}
                    {submitting ? 'Enviando...' : 'Enviar Solicitação'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

interface DetailModalProps {
  equipment: Equipment | null
  onClose: () => void
  onRequestMaintenance: (eq: Equipment) => void
}

function DetailModal({ equipment, onClose, onRequestMaintenance }: DetailModalProps) {
  if (!equipment) return null
  const health = getHealth(equipment)
  const cfg = HEALTH_CONFIG[health]
  const remainingPct = Math.max(0, 100 - equipment.depreciation_percent)
  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('pt-BR') : '—'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl sm:rounded-t-2xl">
            <div>
              <h3 className="font-bold text-gray-900">{equipment.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{equipment.equipment_type}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
              <X size={18} className="text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            <div className={`p-4 rounded-2xl ${cfg.iconBg} ring-1 ${cfg.ring}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={cfg.iconColor}>{cfg.icon}</span>
                  <span className={`text-sm font-semibold ${cfg.iconColor}`}>{cfg.label}</span>
                </div>
                <span className="text-xs text-gray-500 font-medium">{remainingPct}% de vida restante</span>
              </div>
              <div className="h-3 bg-white/70 rounded-full overflow-hidden mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${remainingPct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full ${cfg.bar}`}
                />
              </div>
              <div className="flex justify-between text-[11px] text-gray-400">
                <span>Vida esgotada</span>
                <span>Equipamento novo</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Tipo', value: equipment.equipment_type || '—' },
                { label: 'Marca / Modelo', value: [equipment.brand, equipment.model].filter(Boolean).join(' ') || '—' },
                { label: 'Localização', value: equipment.location || '—' },
                { label: 'Área / Sala', value: equipment.floor_area || '—' },
                { label: 'Capacidade', value: equipment.capacity || '—' },
                { label: 'Nº de Série', value: equipment.serial_number || '—' },
                { label: 'Instalado em', value: formatDate(equipment.installed_at) },
                { label: 'Vida Útil', value: `${equipment.useful_life_years} anos` },
                { label: 'Idade', value: equipment.age_years > 0 ? `${equipment.age_years} anos` : 'Novo' },
                { label: 'Vida Restante', value: equipment.remaining_life_years > 0 ? `${equipment.remaining_life_years} anos` : 'Encerrada' },
                { label: 'Intervenções', value: String(equipment.intervention_count) },
                { label: 'Última Manutenção', value: formatDate(equipment.last_intervention_date) },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[11px] text-gray-400 mb-0.5">{item.label}</p>
                  <p className="text-sm font-semibold text-gray-800 leading-tight">{item.value}</p>
                </div>
              ))}
            </div>

            {equipment.notes && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-[11px] text-gray-400 mb-1">Observações</p>
                <p className="text-sm text-gray-700">{equipment.notes}</p>
              </div>
            )}

            <button
              onClick={() => { onClose(); onRequestMaintenance(equipment) }}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-2xl transition-colors"
            >
              <Wrench size={16} />
              Solicitar Manutenção
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function CustomerPortalInventory() {
  const { portalUser } = usePortal()
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const [maintenanceEquipment, setMaintenanceEquipment] = useState<Equipment | null>(null)
  const [filterLocation, setFilterLocation] = useState('')
  const [filterHealth, setFilterHealth] = useState<'' | HealthLevel>('')
  const [successMsg, setSuccessMsg] = useState(false)

  useEffect(() => {
    if (portalUser?.linked_customer_id) loadEquipment()
  }, [portalUser])

  const loadEquipment = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_customer_portal_equipment', {
        p_customer_id: portalUser!.linked_customer_id
      })
      if (!error) setEquipment(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = () => {
    setSuccessMsg(true)
    setTimeout(() => setSuccessMsg(false), 5000)
  }

  const locations = Array.from(new Set(equipment.map(e => e.location).filter(Boolean)))

  const filtered = equipment.filter(e => {
    if (filterLocation && e.location !== filterLocation) return false
    if (filterHealth && getHealth(e) !== filterHealth) return false
    return true
  })

  const stats = {
    total: equipment.length,
    ok: equipment.filter(e => getHealth(e) === 'ok').length,
    attention: equipment.filter(e => getHealth(e) === 'attention').length,
    critical: equipment.filter(e => getHealth(e) === 'critical').length,
  }

  const topByInterventions = [...equipment]
    .sort((a, b) => b.intervention_count - a.intervention_count)
    .slice(0, 5)

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('pt-BR') : '—'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ativos</h1>
          <p className="text-gray-400 text-sm mt-0.5">Patrimônio, depreciação e histórico de manutenções</p>
        </div>
        <button onClick={loadEquipment} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <RefreshCw size={18} className="text-gray-500" />
        </button>
      </div>

      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl"
          >
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold text-emerald-800 text-sm">Solicitação enviada!</p>
              <p className="text-xs text-emerald-600">Nossa equipe analisará em breve.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total de Ativos', value: stats.total, icon: Package, colorBg: 'bg-slate-100', colorIcon: 'text-slate-600', health: '' as const },
          { label: 'Saúde OK', value: stats.ok, icon: ShieldCheck, colorBg: 'bg-emerald-100', colorIcon: 'text-emerald-600', health: 'ok' as const },
          { label: 'Atenção', value: stats.attention, icon: ShieldAlert, colorBg: 'bg-amber-100', colorIcon: 'text-amber-600', health: 'attention' as const },
          { label: 'Crítico', value: stats.critical, icon: ShieldX, colorBg: 'bg-red-100', colorIcon: 'text-red-600', health: 'critical' as const },
        ].map((stat, i) => {
          const Icon = stat.icon
          const active = filterHealth === stat.health
          return (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setFilterHealth(filterHealth === stat.health ? '' : stat.health)}
              className={`text-left bg-white rounded-2xl p-4 shadow-sm border transition-all ${
                active ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl ${stat.colorBg} flex items-center justify-center mb-2.5`}>
                <Icon size={18} className={stat.colorIcon} />
              </div>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{stat.label}</p>
            </motion.button>
          )
        })}
      </div>

      {topByInterventions.length > 0 && topByInterventions[0].intervention_count > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={16} className="text-blue-500" />
            <h2 className="font-bold text-gray-800 text-sm">Mais Intervenções</h2>
          </div>
          <div className="space-y-3">
            {topByInterventions.filter(e => e.intervention_count > 0).map((e, i) => {
              const maxCount = topByInterventions[0].intervention_count || 1
              const pct = (e.intervention_count / maxCount) * 100
              return (
                <div key={e.id} className="flex items-center gap-3">
                  <span className="w-4 text-xs text-gray-300 font-bold text-right shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-700 truncate">{e.name}</span>
                      <span className="text-[11px] text-gray-400 ml-2 shrink-0">{e.intervention_count}x</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {locations.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterLocation('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              !filterLocation ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            Todos locais
          </button>
          {locations.map(loc => (
            <button
              key={loc}
              onClick={() => setFilterLocation(filterLocation === loc ? '' : loc)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                filterLocation === loc ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              <MapPin size={10} />
              {loc}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-blue-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 text-center py-16 text-gray-400">
          <Package size={40} className="mx-auto mb-3 opacity-20" />
          <p className="font-semibold text-sm">Nenhum equipamento encontrado</p>
          <p className="text-xs mt-1">Ajuste os filtros ou entre em contato.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((eq, i) => {
            const health = getHealth(eq)
            const cfg = HEALTH_CONFIG[health]
            const TypeIcon = TYPE_ICONS[eq.equipment_type]
            const remainingPct = Math.max(0, 100 - eq.depreciation_percent)

            return (
              <motion.div
                key={eq.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl ${cfg.iconBg} flex items-center justify-center shrink-0 ${cfg.iconColor} ring-1 ${cfg.ring}`}>
                        {TypeIcon || <Package size={20} />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-sm leading-tight">{eq.name}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {eq.equipment_type}{eq.model ? ` · ${eq.model}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold ${cfg.badge}`}>
                      {cfg.icon}
                      {cfg.label}
                    </span>
                  </div>

                  {eq.location && (
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-4">
                      <MapPin size={11} className="shrink-0" />
                      <span>{eq.location}{eq.floor_area ? ` — ${eq.floor_area}` : ''}</span>
                    </div>
                  )}

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <BatteryMedium size={12} className="text-gray-400" />
                        <span className="text-[11px] text-gray-500 font-medium">Vida útil restante</span>
                      </div>
                      <span className={`text-xs font-bold ${cfg.iconColor}`}>{remainingPct}%</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${remainingPct}%` }}
                        transition={{ duration: 0.7, delay: i * 0.04, ease: 'easeOut' }}
                        className={`h-full rounded-full ${cfg.bar}`}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] mt-1 text-gray-300">
                      <span>{eq.age_years > 0 ? `${eq.age_years} anos em uso` : 'Novo'}</span>
                      <span>{eq.remaining_life_years > 0 ? `${eq.remaining_life_years} anos restantes` : 'Vida útil encerrada'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-4 border-t border-gray-50 pt-3">
                    <Wrench size={11} className="shrink-0" />
                    <span>{eq.intervention_count} intervenções</span>
                    {eq.last_intervention_date && (
                      <>
                        <span className="text-gray-200">·</span>
                        <Clock size={11} />
                        <span>Última: {formatDate(eq.last_intervention_date)}</span>
                      </>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedEquipment(eq)}
                      className="flex-1 py-2 text-xs font-semibold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Ver detalhes
                    </button>
                    <button
                      onClick={() => setMaintenanceEquipment(eq)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
                    >
                      <Wrench size={12} />
                      Solicitar Manutenção
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <DetailModal
        equipment={selectedEquipment}
        onClose={() => setSelectedEquipment(null)}
        onRequestMaintenance={(eq) => setMaintenanceEquipment(eq)}
      />

      <MaintenanceDrawer
        equipment={maintenanceEquipment}
        onClose={() => setMaintenanceEquipment(null)}
        portalUser={portalUser}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
