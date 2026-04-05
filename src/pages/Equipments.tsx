import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wind, Plus, Search, FileEdit as Edit, Trash2, X, Save,
  AlertTriangle, Calendar, Thermometer, Zap, MapPin, Clock,
  CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp,
  FileText, Settings, Wrench,
  QrCode, Copy, ExternalLink, Link2, CheckCircle2, Loader2,
  RefreshCw, Scan, User, Package
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useUser } from '../contexts/UserContext'
import { format, differenceInDays, isPast } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/* ─────────────────────────── shared types ─────────────────────────── */

interface Customer {
  id: string
  name: string
}

interface Equipment {
  id: string
  name: string
  type: string
  brand: string
  model: string
  serial_number?: string
  status?: string
  location?: string
  notes?: string
  customer_id?: string
  capacity_btus?: number
  refrigerant_gas?: string
  installation_date?: string
  last_maintenance_date?: string
  next_maintenance_date?: string
  warranty_expiry?: string
  voltage?: string
  phases?: string
  compressor_current?: number
  efficiency_rating?: string
  purchase_price?: number
  installation_cost?: number
  maintenance_interval_months?: number
  created_at: string
  updated_at: string
  customers?: { name: string }
}

interface EquipmentWithQR extends Equipment {
  qr_code_token?: string
  qr_code_linked_at?: string
  qr_code_linked_by?: string
  asset_health?: string
  customer_name?: string
}

/* ─────────────────────────── constants ─────────────────────────────── */

const EQUIPMENT_TYPES = [
  { value: 'split', label: 'Split' },
  { value: 'multi_split', label: 'Multi-Split' },
  { value: 'cassete', label: 'Cassete' },
  { value: 'piso_teto', label: 'Piso-Teto' },
  { value: 'janela', label: 'Janela' },
  { value: 'portatil', label: 'Portátil' },
  { value: 'vrf', label: 'VRF / VRV' },
  { value: 'chiller', label: 'Chiller' },
  { value: 'fancoil', label: 'Fan Coil' },
  { value: 'ar_condicionado', label: 'Ar-Condicionado (Geral)' },
  { value: 'refrigeracao', label: 'Refrigeração' },
  { value: 'eletrica', label: 'Elétrica' },
  { value: 'hidraulica', label: 'Hidráulica' },
  { value: 'outros', label: 'Outros' },
]

const GAS_TYPES = ['R-22', 'R-410A', 'R-32', 'R-134a', 'R-407C', 'R-404A', 'R-600a', 'R-290']
const BTU_OPTIONS = [7000, 9000, 12000, 18000, 24000, 30000, 36000, 48000, 60000]
const EFFICIENCY_RATINGS = ['A+++', 'A++', 'A+', 'A', 'B', 'C', 'D', 'E']
const VOLTAGE_OPTIONS = ['110V', '127V', '220V', '380V']

const BASE_URL = window.location.origin

/* ─────────────────────────── helpers ─────────────────────────────── */

function getMaintenanceStatus(nextDate?: string) {
  if (!nextDate) return { label: 'Sem agendamento', color: 'text-gray-500', bg: 'bg-gray-100', Icon: AlertCircle }
  const next = new Date(nextDate)
  const today = new Date()
  const daysUntil = differenceInDays(next, today)
  if (isPast(next)) return { label: `Atrasada (${Math.abs(daysUntil)}d)`, color: 'text-red-700', bg: 'bg-red-100', Icon: XCircle }
  if (daysUntil <= 15) return { label: `Em ${daysUntil}d`, color: 'text-orange-700', bg: 'bg-orange-100', Icon: AlertTriangle }
  if (daysUntil <= 30) return { label: `Em ${daysUntil}d`, color: 'text-yellow-700', bg: 'bg-yellow-100', Icon: AlertCircle }
  return { label: format(next, 'dd/MM/yyyy', { locale: ptBR }), color: 'text-green-700', bg: 'bg-green-100', Icon: CheckCircle }
}

function getWarrantyStatus(expiryDate?: string) {
  if (!expiryDate) return null
  const expiry = new Date(expiryDate)
  const today = new Date()
  if (isPast(expiry)) return { label: 'Vencida', color: 'text-red-600', bg: 'bg-red-50' }
  const daysLeft = differenceInDays(expiry, today)
  if (daysLeft <= 30) return { label: `${daysLeft}d restantes`, color: 'text-orange-600', bg: 'bg-orange-50' }
  return { label: format(expiry, 'dd/MM/yyyy', { locale: ptBR }), color: 'text-green-600', bg: 'bg-green-50' }
}

function typeLabel(type: string) {
  return EQUIPMENT_TYPES.find(t => t.value === type)?.label || type
}

function healthDot(health?: string) {
  if (health === 'critical') return 'bg-red-400'
  if (health === 'warning') return 'bg-yellow-400'
  return 'bg-emerald-400'
}

function formatLinkedDate(dt?: string) {
  if (!dt) return ''
  return new Date(dt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* ─────────────────────────── form defaults ─────────────────────────── */

const emptyForm = {
  name: '',
  type: 'split',
  brand: '',
  model: '',
  serial_number: '',
  status: 'ativo',
  location: '',
  notes: '',
  customer_id: '',
  capacity_btus: '' as string | number,
  refrigerant_gas: 'R-410A',
  installation_date: '',
  last_maintenance_date: '',
  next_maintenance_date: '',
  warranty_expiry: '',
  voltage: '220V',
  phases: '1',
  compressor_current: '' as string | number,
  efficiency_rating: 'A',
  purchase_price: '' as string | number,
  installation_cost: '' as string | number,
  maintenance_interval_months: 3,
}

type FormData = typeof emptyForm
type FormTab = 'geral' | 'tecnico' | 'manutencao' | 'financeiro'
type PageTab = 'equipamentos' | 'qrcodes'

/* ═══════════════════════════ main component ══════════════════════════ */

const Equipments = () => {
  const { isAdmin } = useUser()

  /* ── page-level tab ── */
  const [pageTab, setPageTab] = useState<PageTab>('equipamentos')

  /* ── equipments list state ── */
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [maintenanceFilter, setMaintenanceFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null)
  const [formData, setFormData] = useState<FormData>(emptyForm)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formTab, setFormTab] = useState<FormTab>('geral')

  /* ── QR codes state ── */
  const [qrEquipments, setQrEquipments] = useState<EquipmentWithQR[]>([])
  const [qrLoading, setQrLoading] = useState(false)
  const [qrSearch, setQrSearch] = useState('')
  const [qrFilter, setQrFilter] = useState<'all' | 'linked' | 'unlinked'>('all')
  const [linking, setLinking] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [qrToast, setQrToast] = useState<string | null>(null)

  /* ─── load data ─── */

  useEffect(() => {
    loadEquipments()
    loadCustomers()
  }, [])

  useEffect(() => {
    if (pageTab === 'qrcodes' && qrEquipments.length === 0) {
      loadQrEquipments()
    }
  }, [pageTab])

  const loadEquipments = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('equipments')
        .select('*, customers(name)')
        .order('name', { ascending: true })
      if (error) throw error
      setEquipments(data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const loadCustomers = async () => {
    try {
      const { data } = await supabase.from('customers').select('id, name').order('name')
      setCustomers(data || [])
    } catch (e) {
      console.error(e)
    }
  }

  const loadQrEquipments = useCallback(async () => {
    setQrLoading(true)
    const { data } = await supabase
      .from('customer_equipment')
      .select(`
        id, name, model, brand, serial_number, location,
        qr_code_token, qr_code_linked_at, qr_code_linked_by,
        asset_health, customer_id,
        customers!inner(name)
      `)
      .order('name', { ascending: true })

    setQrEquipments(
      (data || []).map((e: any) => ({
        ...e,
        customer_name: e.customers?.name,
      }))
    )
    setQrLoading(false)
  }, [])

  /* ─── equipment CRUD ─── */

  const handleSave = async () => {
    if (!formData.name || !formData.brand || !formData.model) return
    setSaving(true)
    try {
      const payload = {
        ...formData,
        capacity_btus: formData.capacity_btus !== '' ? Number(formData.capacity_btus) : null,
        compressor_current: formData.compressor_current !== '' ? Number(formData.compressor_current) : null,
        purchase_price: formData.purchase_price !== '' ? Number(formData.purchase_price) : null,
        installation_cost: formData.installation_cost !== '' ? Number(formData.installation_cost) : null,
        customer_id: formData.customer_id || null,
        installation_date: formData.installation_date || null,
        last_maintenance_date: formData.last_maintenance_date || null,
        next_maintenance_date: formData.next_maintenance_date || null,
        warranty_expiry: formData.warranty_expiry || null,
      }
      if (editingEquipment) {
        const { error } = await supabase.from('equipments').update(payload).eq('id', editingEquipment.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('equipments').insert([payload])
        if (error) throw error
      }
      await loadEquipments()
      handleCloseModal()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Confirmar exclusão deste equipamento?')) return
    try {
      const { error } = await supabase.from('equipments').delete().eq('id', id)
      if (error) throw error
      await loadEquipments()
    } catch (e) {
      console.error(e)
    }
  }

  const handleEdit = (eq: Equipment) => {
    setEditingEquipment(eq)
    setFormData({
      name: eq.name,
      type: eq.type,
      brand: eq.brand,
      model: eq.model,
      serial_number: eq.serial_number || '',
      status: eq.status || 'ativo',
      location: eq.location || '',
      notes: eq.notes || '',
      customer_id: eq.customer_id || '',
      capacity_btus: eq.capacity_btus ?? '',
      refrigerant_gas: eq.refrigerant_gas || 'R-410A',
      installation_date: eq.installation_date || '',
      last_maintenance_date: eq.last_maintenance_date || '',
      next_maintenance_date: eq.next_maintenance_date || '',
      warranty_expiry: eq.warranty_expiry || '',
      voltage: eq.voltage || '220V',
      phases: eq.phases || '1',
      compressor_current: eq.compressor_current ?? '',
      efficiency_rating: eq.efficiency_rating || 'A',
      purchase_price: eq.purchase_price ?? '',
      installation_cost: eq.installation_cost ?? '',
      maintenance_interval_months: eq.maintenance_interval_months ?? 3,
    })
    setShowModal(true)
    setFormTab('geral')
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingEquipment(null)
    setFormData(emptyForm)
    setFormTab('geral')
  }

  const setField = (key: keyof FormData, val: string | number) =>
    setFormData(prev => ({ ...prev, [key]: val }))

  /* ─── QR helpers ─── */

  function showQrToast(msg: string) {
    setQrToast(msg)
    setTimeout(() => setQrToast(null), 2500)
  }

  async function copyQrLink(token: string, id: string) {
    await navigator.clipboard.writeText(`${BASE_URL}/care/${token}`)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
    showQrToast('Link copiado!')
  }

  async function generateAndLink(eq: EquipmentWithQR) {
    const token = crypto.randomUUID()
    setLinking(eq.id)
    const { data, error } = await supabase.rpc('link_qr_code_to_equipment', {
      p_equipment_id: eq.id,
      p_qr_token: token,
      p_technician_name: null,
      p_os_id: null,
    })
    if (!error && (data as any)?.success) {
      showQrToast(`QR Code gerado para ${eq.name}!`)
      await loadQrEquipments()
    } else {
      showQrToast((data as any)?.error || 'Erro ao gerar QR Code')
    }
    setLinking(null)
  }

  async function unlinkQR(eq: EquipmentWithQR) {
    if (!confirm(`Remover QR Code de ${eq.name}? O link atual deixará de funcionar.`)) return
    await supabase
      .from('customer_equipment')
      .update({ qr_code_token: null, qr_code_linked_at: null, qr_code_linked_by: null })
      .eq('id', eq.id)
    showQrToast('QR Code removido')
    await loadQrEquipments()
  }

  /* ─── derived values ─── */

  const today = new Date()
  const overdueCount = equipments.filter(e => e.next_maintenance_date && isPast(new Date(e.next_maintenance_date))).length
  const dueSoonCount = equipments.filter(e => {
    if (!e.next_maintenance_date) return false
    const d = new Date(e.next_maintenance_date)
    return !isPast(d) && differenceInDays(d, today) <= 30
  }).length
  const activeCount = equipments.filter(e => e.status === 'ativo').length

  const filtered = equipments.filter(eq => {
    const q = searchTerm.toLowerCase()
    const matchSearch = !q || [eq.name, eq.brand, eq.model, eq.serial_number, eq.location, eq.customers?.name].some(v => v?.toLowerCase().includes(q))
    const matchType = typeFilter === 'all' || eq.type === typeFilter
    const matchStatus = statusFilter === 'all' || eq.status === statusFilter
    const matchMaint = maintenanceFilter === 'all' || (() => {
      if (!eq.next_maintenance_date) return maintenanceFilter === 'sem'
      const d = new Date(eq.next_maintenance_date)
      const days = differenceInDays(d, today)
      if (maintenanceFilter === 'atrasado') return isPast(d)
      if (maintenanceFilter === 'proximo') return !isPast(d) && days <= 30
      return true
    })()
    return matchSearch && matchType && matchStatus && matchMaint
  })

  const linkedCount = qrEquipments.filter(e => !!e.qr_code_token).length

  const filteredQr = qrEquipments.filter(e => {
    const q = qrSearch.toLowerCase()
    const matchSearch = !q
      || e.name.toLowerCase().includes(q)
      || (e.customer_name || '').toLowerCase().includes(q)
      || (e.model || '').toLowerCase().includes(q)
      || (e.brand || '').toLowerCase().includes(q)
    const matchFilter =
      qrFilter === 'all' ||
      (qrFilter === 'linked' && !!e.qr_code_token) ||
      (qrFilter === 'unlinked' && !e.qr_code_token)
    return matchSearch && matchFilter
  })

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm'
  const labelCls = 'block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide'

  if (loading && pageTab === 'equipamentos') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* ── Page Header ── */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wind className="w-7 h-7 text-sky-600" />
            Equipamentos HVAC
          </h1>
          <p className="text-gray-500 text-sm mt-1">Climatização, refrigeração — manutenção e garantia</p>
        </div>
        {pageTab === 'equipamentos' && (
          <button
            onClick={() => { setShowModal(true); setFormTab('geral') }}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Novo Equipamento
          </button>
        )}
      </div>

      {/* ── Page Tabs ── */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6 w-fit">
        {([
          { id: 'equipamentos' as PageTab, label: 'Equipamentos', icon: Wind },
          { id: 'qrcodes'     as PageTab, label: 'QR Codes Care', icon: QrCode },
        ]).map(tab => {
          const Icon = tab.icon
          const active = pageTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setPageTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">

        {/* ══════════════════ TAB: Equipamentos ══════════════════ */}
        {pageTab === 'equipamentos' && (
          <motion.div
            key="equipamentos"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {([
                { label: 'Total', value: equipments.length, color: 'bg-sky-50 border-sky-200', num: 'text-sky-700', Icon: Wind },
                { label: 'Ativos', value: activeCount, color: 'bg-green-50 border-green-200', num: 'text-green-700', Icon: CheckCircle },
                { label: 'Manutenção Vencida', value: overdueCount, color: 'bg-red-50 border-red-200', num: 'text-red-700', Icon: XCircle },
                { label: 'Próximos 30 dias', value: dueSoonCount, color: 'bg-orange-50 border-orange-200', num: 'text-orange-700', Icon: AlertTriangle },
              ]).map(({ label, value, color, num, Icon }) => (
                <div key={label} className={`rounded-xl border p-4 ${color}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
                      <p className={`text-3xl font-bold mt-1 ${num}`}>{value}</p>
                    </div>
                    <Icon className={`w-8 h-8 ${num}`} />
                  </div>
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, marca, modelo, cliente..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500">
                  <option value="all">Todos os Tipos</option>
                  {EQUIPMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500">
                  <option value="all">Todos os Status</option>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                  <option value="manutencao">Em Manutenção</option>
                </select>
                <select value={maintenanceFilter} onChange={e => setMaintenanceFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500">
                  <option value="all">Todas Manutenções</option>
                  <option value="atrasado">Atrasadas</option>
                  <option value="proximo">Próximas 30d</option>
                  <option value="sem">Sem agendamento</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Equipamento', 'Cliente', 'Capacidade / Gás', 'Localização', 'Próx. Manutenção', 'Garantia', 'Status', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map(eq => {
                      const maint = getMaintenanceStatus(eq.next_maintenance_date)
                      const warranty = getWarrantyStatus(eq.warranty_expiry)
                      const isExpanded = expandedId === eq.id

                      return (
                        <React.Fragment key={eq.id}>
                          <tr
                            className="hover:bg-sky-50/40 transition-colors cursor-pointer"
                            onClick={() => setExpandedId(isExpanded ? null : eq.id)}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                                  <Wind className="w-5 h-5 text-sky-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{eq.name}</p>
                                  <p className="text-xs text-gray-500">{eq.brand} {eq.model}</p>
                                  {eq.serial_number && <p className="text-xs text-gray-400">S/N: {eq.serial_number}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {eq.customers?.name
                                ? <span className="text-gray-700">{eq.customers.name}</span>
                                : <span className="text-gray-400 italic">—</span>
                              }
                            </td>
                            <td className="px-4 py-3">
                              <div className="space-y-1">
                                {eq.capacity_btus && (
                                  <span className="inline-flex items-center gap-1 text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-medium">
                                    <Thermometer className="w-3 h-3" />
                                    {eq.capacity_btus.toLocaleString()} BTUs
                                  </span>
                                )}
                                {eq.refrigerant_gas && (
                                  <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                    {eq.refrigerant_gas}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {eq.location
                                ? <div className="flex items-center gap-1 text-gray-600"><MapPin className="w-3 h-3" />{eq.location}</div>
                                : <span className="text-gray-400">—</span>
                              }
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${maint.bg} ${maint.color}`}>
                                <maint.Icon className="w-3 h-3" />
                                {maint.label}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {warranty
                                ? <span className={`inline-flex text-xs font-medium px-2 py-1 rounded-full ${warranty.bg} ${warranty.color}`}>{warranty.label}</span>
                                : <span className="text-gray-400 text-xs">—</span>
                              }
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex text-xs font-semibold px-2 py-1 rounded-full ${
                                eq.status === 'ativo' ? 'bg-green-100 text-green-700'
                                : eq.status === 'manutencao' ? 'bg-orange-100 text-orange-700'
                                : 'bg-gray-100 text-gray-500'
                              }`}>
                                {eq.status === 'ativo' ? 'Ativo' : eq.status === 'manutencao' ? 'Manutenção' : 'Inativo'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                <button onClick={() => handleEdit(eq)} className="p-1.5 text-sky-600 hover:bg-sky-100 rounded-lg transition-colors">
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(eq.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <button className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                              </div>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr>
                              <td colSpan={8} className="px-4 pb-4 bg-sky-50/30">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3">
                                  {([
                                    { label: 'Tipo', value: typeLabel(eq.type), Icon: Wind },
                                    { label: 'Tensão', value: eq.voltage ? `${eq.voltage} / ${eq.phases}F` : null, Icon: Zap },
                                    { label: 'Corrente Compressor', value: eq.compressor_current ? `${eq.compressor_current} A` : null, Icon: Settings },
                                    { label: 'Eficiência', value: eq.efficiency_rating, Icon: Thermometer },
                                    { label: 'Data de Instalação', value: eq.installation_date ? format(new Date(eq.installation_date), 'dd/MM/yyyy') : null, Icon: Calendar },
                                    { label: 'Última Manutenção', value: eq.last_maintenance_date ? format(new Date(eq.last_maintenance_date), 'dd/MM/yyyy') : null, Icon: Wrench },
                                    { label: 'Intervalo Manutenção', value: eq.maintenance_interval_months ? `${eq.maintenance_interval_months} meses` : null, Icon: Clock },
                                    { label: 'Observações', value: eq.notes, Icon: FileText },
                                  ] as const).map(({ label, value, Icon }) => value ? (
                                    <div key={label} className="bg-white rounded-lg p-3 border border-sky-100">
                                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                                        <Icon className="w-3.5 h-3.5" />
                                        {label}
                                      </div>
                                      <p className="text-sm font-medium text-gray-800">{value}</p>
                                    </div>
                                  ) : null)}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })}

                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-16 text-center">
                          <Wind className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                          <p className="text-gray-500 font-medium">Nenhum equipamento encontrado</p>
                          <p className="text-gray-400 text-sm mt-1">Ajuste os filtros ou cadastre um novo equipamento.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════════════ TAB: QR Codes Care ══════════════════ */}
        {pageTab === 'qrcodes' && (
          <motion.div
            key="qrcodes"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* Toast */}
            {qrToast && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="fixed top-4 right-4 z-50 bg-slate-800 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg"
              >
                {qrToast}
              </motion.div>
            )}

            {/* Header row */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                    <QrCode className="h-4 w-4 text-white" />
                  </div>
                  Gerenciamento de QR Codes
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  Vincule adesivos QR Code aos equipamentos para o portal Giartech Care.
                </p>
              </div>
              <button
                onClick={loadQrEquipments}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl px-3 py-2 transition"
              >
                <RefreshCw className={`h-4 w-4 ${qrLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total de Equipamentos', value: qrEquipments.length, color: 'bg-slate-100 text-slate-700' },
                { label: 'Com QR Code', value: linkedCount, color: 'bg-teal-50 text-teal-700' },
                { label: 'Sem QR Code', value: qrEquipments.length - linkedCount, color: 'bg-amber-50 text-amber-700' },
              ].map(stat => (
                <div key={stat.label} className={`rounded-2xl p-4 ${stat.color}`}>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs font-medium opacity-80 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={qrSearch}
                  onChange={e => setQrSearch(e.target.value)}
                  placeholder="Buscar por equipamento, cliente ou modelo..."
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition"
                />
              </div>
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                {(['all', 'linked', 'unlinked'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setQrFilter(f)}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition ${
                      qrFilter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {f === 'all' ? 'Todos' : f === 'linked' ? 'Com QR' : 'Sem QR'}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            {qrLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
              </div>
            ) : filteredQr.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <Package className="h-12 w-12 text-gray-200 mx-auto" />
                <p className="text-gray-400 text-sm">Nenhum equipamento encontrado.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredQr.map(eq => (
                  <motion.div
                    key={eq.id}
                    layout
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                  >
                    <div className="flex items-center gap-4 p-4">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${healthDot(eq.asset_health)}`} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-800">{eq.name}</p>
                          {eq.qr_code_token && (
                            <span className="text-[10px] bg-teal-100 text-teal-700 font-bold px-2 py-0.5 rounded-full">
                              QR Ativo
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          {eq.customer_name && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <User className="h-3 w-3" />
                              {eq.customer_name}
                            </span>
                          )}
                          {(eq.brand || eq.model) && (
                            <span className="text-xs text-gray-400">
                              {[eq.brand, eq.model].filter(Boolean).join(' · ')}
                            </span>
                          )}
                          {eq.qr_code_linked_at && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Clock className="h-3 w-3" />
                              {formatLinkedDate(eq.qr_code_linked_at)}
                              {eq.qr_code_linked_by && ` · ${eq.qr_code_linked_by}`}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {eq.qr_code_token ? (
                          <>
                            <button
                              onClick={() => copyQrLink(eq.qr_code_token!, eq.id)}
                              className="flex items-center gap-1.5 text-xs font-semibold bg-teal-50 hover:bg-teal-100 text-teal-700 px-3 py-1.5 rounded-lg transition"
                              title="Copiar link"
                            >
                              {copiedId === eq.id ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                              {copiedId === eq.id ? 'Copiado!' : 'Copiar Link'}
                            </button>
                            <a
                              href={`${BASE_URL}/care/${eq.qr_code_token}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-gray-600 transition p-1.5 rounded-lg hover:bg-gray-50"
                              title="Abrir portal"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                            <button
                              onClick={() => unlinkQR(eq)}
                              className="text-gray-300 hover:text-red-400 transition p-1.5 rounded-lg hover:bg-red-50"
                              title="Remover QR Code"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => generateAndLink(eq)}
                            disabled={linking === eq.id}
                            className="flex items-center gap-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg transition"
                          >
                            {linking === eq.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <Scan className="h-3.5 w-3.5" />
                            }
                            Gerar QR Code
                          </button>
                        )}
                      </div>
                    </div>

                    {eq.qr_code_token && (
                      <div className="px-4 pb-3">
                        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                          <Link2 className="h-3 w-3 text-gray-400 shrink-0" />
                          <span className="text-[11px] text-gray-500 font-mono truncate flex-1">
                            {BASE_URL}/care/{eq.qr_code_token}
                          </span>
                          <ChevronDown className="h-3 w-3 text-gray-300 shrink-0" />
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {/* How-to tip */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                  <QrCode className="h-4 w-4 text-blue-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-blue-800">Como funciona a adesivagem</p>
                  <ol className="text-xs text-blue-700 space-y-0.5 list-decimal list-inside">
                    <li>Gere um QR Code para o equipamento (ou use o ID do adesivo físico)</li>
                    <li>Copie o link e gere o QR Code em qualquer gerador online</li>
                    <li>Imprima o adesivo e cole na máquina ao finalizar a OS</li>
                    <li>O cliente escaneia e acessa o portal Giartech Care com histórico completo</li>
                  </ol>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* ══════════════════ Equipment Form Modal ══════════════════ */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <Wind className="w-5 h-5" />
                  <h2 className="text-lg font-bold">{editingEquipment ? 'Editar Equipamento' : 'Novo Equipamento'}</h2>
                </div>
                <button onClick={handleCloseModal} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex border-b border-gray-100">
                {(['geral', 'tecnico', 'manutencao', 'financeiro'] as FormTab[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setFormTab(tab)}
                    className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 capitalize ${
                      formTab === tab
                        ? 'border-sky-600 text-sky-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab === 'manutencao' ? 'Manutenção' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {formTab === 'geral' && (
                  <div className="space-y-4">
                    <div>
                      <label className={labelCls}>Nome do Equipamento *</label>
                      <input value={formData.name} onChange={e => setField('name', e.target.value)} className={inputCls} placeholder="Ex: Split Sala de Reuniões" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Tipo *</label>
                        <select value={formData.type} onChange={e => setField('type', e.target.value)} className={inputCls}>
                          {EQUIPMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Status</label>
                        <select value={formData.status} onChange={e => setField('status', e.target.value)} className={inputCls}>
                          <option value="ativo">Ativo</option>
                          <option value="inativo">Inativo</option>
                          <option value="manutencao">Em Manutenção</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Marca *</label>
                        <input value={formData.brand} onChange={e => setField('brand', e.target.value)} className={inputCls} placeholder="Ex: Daikin, Mitsubishi..." />
                      </div>
                      <div>
                        <label className={labelCls}>Modelo *</label>
                        <input value={formData.model} onChange={e => setField('model', e.target.value)} className={inputCls} placeholder="Ex: FTXS12JVMA" />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Número de Série</label>
                      <input value={formData.serial_number} onChange={e => setField('serial_number', e.target.value)} className={inputCls} placeholder="S/N do equipamento" />
                    </div>
                    <div>
                      <label className={labelCls}>Cliente</label>
                      <select value={formData.customer_id} onChange={e => setField('customer_id', e.target.value)} className={inputCls}>
                        <option value="">Sem cliente vinculado</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Localização / Ambiente</label>
                      <input value={formData.location} onChange={e => setField('location', e.target.value)} className={inputCls} placeholder="Ex: Sala 3, 2° andar" />
                    </div>
                    <div>
                      <label className={labelCls}>Observações</label>
                      <textarea value={formData.notes as string} onChange={e => setField('notes', e.target.value)} rows={3} className={inputCls} placeholder="Informações adicionais..." />
                    </div>
                  </div>
                )}

                {formTab === 'tecnico' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Capacidade (BTUs)</label>
                        <select value={formData.capacity_btus as string} onChange={e => setField('capacity_btus', e.target.value)} className={inputCls}>
                          <option value="">Selecionar...</option>
                          {BTU_OPTIONS.map(b => <option key={b} value={b}>{b.toLocaleString()} BTUs</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Gás Refrigerante</label>
                        <select value={formData.refrigerant_gas} onChange={e => setField('refrigerant_gas', e.target.value)} className={inputCls}>
                          {GAS_TYPES.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Tensão</label>
                        <select value={formData.voltage} onChange={e => setField('voltage', e.target.value)} className={inputCls}>
                          {VOLTAGE_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Fases</label>
                        <select value={formData.phases} onChange={e => setField('phases', e.target.value)} className={inputCls}>
                          <option value="1">Monofásico (1F)</option>
                          <option value="2">Bifásico (2F)</option>
                          <option value="3">Trifásico (3F)</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Corrente Compressor (A)</label>
                        <input type="number" step="0.1" value={formData.compressor_current as string} onChange={e => setField('compressor_current', e.target.value)} className={inputCls} placeholder="Ex: 4.5" />
                      </div>
                      <div>
                        <label className={labelCls}>Classificação Eficiência</label>
                        <select value={formData.efficiency_rating} onChange={e => setField('efficiency_rating', e.target.value)} className={inputCls}>
                          {EFFICIENCY_RATINGS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {formTab === 'manutencao' && (
                  <div className="space-y-4">
                    <div>
                      <label className={labelCls}>Data de Instalação</label>
                      <input type="date" value={formData.installation_date} onChange={e => setField('installation_date', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Última Manutenção</label>
                      <input type="date" value={formData.last_maintenance_date} onChange={e => setField('last_maintenance_date', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Próxima Manutenção</label>
                      <input type="date" value={formData.next_maintenance_date} onChange={e => setField('next_maintenance_date', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Intervalo de Manutenção (meses)</label>
                      <select value={formData.maintenance_interval_months} onChange={e => setField('maintenance_interval_months', Number(e.target.value))} className={inputCls}>
                        {[1, 2, 3, 4, 6, 12].map(m => <option key={m} value={m}>{m} {m === 1 ? 'mês' : 'meses'}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Vencimento da Garantia</label>
                      <input type="date" value={formData.warranty_expiry} onChange={e => setField('warranty_expiry', e.target.value)} className={inputCls} />
                    </div>
                  </div>
                )}

                {formTab === 'financeiro' && (
                  <div className="space-y-4">
                    <div>
                      <label className={labelCls}>Valor de Compra (R$)</label>
                      <input type="number" step="0.01" value={formData.purchase_price as string} onChange={e => setField('purchase_price', e.target.value)} className={inputCls} placeholder="0,00" />
                    </div>
                    <div>
                      <label className={labelCls}>Custo de Instalação (R$)</label>
                      <input type="number" step="0.01" value={formData.installation_cost as string} onChange={e => setField('installation_cost', e.target.value)} className={inputCls} placeholder="0,00" />
                    </div>
                    {(Number(formData.purchase_price) > 0 || Number(formData.installation_cost) > 0) && (
                      <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
                        <p className="text-xs text-sky-600 font-semibold uppercase mb-2">Custo Total</p>
                        <p className="text-2xl font-bold text-sky-700">
                          R$ {(Number(formData.purchase_price || 0) + Number(formData.installation_cost || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-100 flex gap-3 bg-gray-50 rounded-b-2xl">
                <button onClick={handleCloseModal} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium">
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !formData.name || !formData.brand || !formData.model}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  {saving
                    ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    : <Save className="w-4 h-4" />
                  }
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Equipments
