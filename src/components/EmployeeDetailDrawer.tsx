import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Save, User, Mail, Phone, MapPin, Briefcase, Calendar,
  DollarSign, FileText, Shield, Star, Upload, Clock,
  CreditCard, AlertTriangle, Lock, ChevronRight, BadgeCheck,
  ToggleLeft, ToggleRight, Check, AlertCircle, Award, ImagePlus, Trash2
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { maskCPF, maskPhone, maskCEP, unmask } from '../utils/masks'

const ALL_MODULES = [
  { code: 'agenda', label: 'Agenda', group: 'Operacional' },
  { code: 'service_orders', label: 'Ordens de Serviço', group: 'Operacional' },
  { code: 'rotas', label: 'Rotas', group: 'Operacional' },
  { code: 'catalogo', label: 'Catálogo de Serviços', group: 'Operacional' },
  { code: 'clientes', label: 'Clientes', group: 'Comercial' },
  { code: 'crm', label: 'CRM', group: 'Comercial' },
  { code: 'mensagens_crm', label: 'Mensagens CRM', group: 'Comercial' },
  { code: 'metas', label: 'Metas & Rankings', group: 'Comercial' },
  { code: 'financeiro', label: 'Financeiro', group: 'Financeiro' },
  { code: 'salarios', label: 'Gestão de Salários', group: 'Financeiro' },
  { code: 'compras', label: 'Compras', group: 'Financeiro' },
  { code: 'fornecedores', label: 'Fornecedores', group: 'Financeiro' },
  { code: 'estoque', label: 'Estoque', group: 'Estoque' },
  { code: 'documentos', label: 'Documentos', group: 'Documentos' },
  { code: 'relatorios', label: 'Relatórios', group: 'Documentos' },
  { code: 'templates', label: 'Templates', group: 'Documentos' },
  { code: 'dashboard', label: 'Dashboard CFO', group: 'Administração' },
  { code: 'automacoes', label: 'Automações', group: 'Administração' },
  { code: 'thomaz', label: 'Thomaz AI', group: 'Administração' },
  { code: 'pessoas', label: 'Gestão de Pessoas', group: 'Administração' },
  { code: 'auditoria', label: 'Auditoria', group: 'Administração' },
  { code: 'configuracoes', label: 'Configurações', group: 'Administração' },
  { code: 'gamificacao', label: 'Gamificação', group: 'Outros' },
  { code: 'email', label: 'Email Corporativo', group: 'Outros' },
  { code: 'biblioteca', label: 'Biblioteca Digital', group: 'Outros' },
]

type AccessLevel = 'none' | 'read' | 'full'

interface ModulePerm { can_view: boolean; can_create: boolean; can_edit: boolean; can_delete: boolean }

function applyLevel(l: AccessLevel): ModulePerm {
  if (l === 'none') return { can_view: false, can_create: false, can_edit: false, can_delete: false }
  if (l === 'read') return { can_view: true, can_create: false, can_edit: false, can_delete: false }
  return { can_view: true, can_create: true, can_edit: true, can_delete: false }
}

function getLevel(p: ModulePerm): AccessLevel {
  if (!p.can_view) return 'none'
  if (p.can_create || p.can_edit) return 'full'
  return 'read'
}

const CONTRACT_TYPES = [
  { value: 'clt', label: 'CLT' },
  { value: 'pj', label: 'PJ' },
  { value: 'estagiario', label: 'Estagiário' },
  { value: 'temporario', label: 'Temporário' },
]

const MEDALS = [
  { id: 'star', label: 'Estrela do Mês', icon: '⭐' },
  { id: 'performance', label: 'Alta Performance', icon: '🏆' },
  { id: 'punctuality', label: 'Pontualidade', icon: '⏰' },
  { id: 'quality', label: 'Qualidade', icon: '💎' },
  { id: 'teamwork', label: 'Trabalho em Equipe', icon: '🤝' },
  { id: 'innovation', label: 'Inovação', icon: '💡' },
]

interface PhotoDropZoneProps {
  currentUrl: string
  onUploaded: (url: string) => void
  employeeId: string | null
}

const PhotoDropZone: React.FC<PhotoDropZoneProps> = ({ currentUrl, onUploaded, employeeId }) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [preview, setPreview] = useState<string>(currentUrl)

  useEffect(() => { setPreview(currentUrl) }, [currentUrl])

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return
    if (file.size > 5 * 1024 * 1024) { alert('Imagem deve ter no máximo 5MB'); return }

    const localPreview = URL.createObjectURL(file)
    setPreview(localPreview)
    setUploading(true)

    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const filename = `${employeeId || `new-${Date.now()}`}-${Date.now()}.${ext}`

      const { error: upErr } = await supabase.storage
        .from('employee-photos')
        .upload(filename, file, { upsert: true, contentType: file.type })

      if (upErr) throw upErr

      const { data } = supabase.storage.from('employee-photos').getPublicUrl(filename)
      onUploaded(data.publicUrl)
    } catch (err: any) {
      setPreview(currentUrl)
      alert(err.message || 'Erro ao fazer upload')
    } finally {
      setUploading(false)
    }
  }, [employeeId, currentUrl, onUploaded])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    e.target.value = ''
  }

  const clearPhoto = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPreview('')
    onUploaded('')
  }

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
      {/* Avatar preview */}
      <div className="relative flex-shrink-0">
        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
          {preview ? (
            <img src={preview} alt="Foto" className="w-full h-full object-cover" />
          ) : (
            <User className="h-8 w-8 text-blue-400" />
          )}
        </div>
        {uploading && (
          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
            <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          </div>
        )}
        {preview && !uploading && (
          <button onClick={clearPhoto} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-md transition-colors" title="Remover foto">
            <Trash2 className="h-2.5 w-2.5 text-white" />
          </button>
        )}
      </div>

      {/* Drop zone */}
      <div
        className={`flex-1 border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all select-none ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-300 hover:bg-gray-100'}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        {uploading ? (
          <p className="text-sm text-blue-600 font-medium">Enviando foto...</p>
        ) : (
          <>
            <ImagePlus className={`h-6 w-6 mx-auto mb-1.5 ${dragOver ? 'text-blue-500' : 'text-gray-400'}`} />
            <p className={`text-sm font-medium ${dragOver ? 'text-blue-600' : 'text-gray-600'}`}>
              {dragOver ? 'Solte aqui' : 'Arraste ou clique para enviar'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WebP — máx. 5MB</p>
          </>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
    </div>
  )
}

interface EmployeeDrawerProps {
  employeeId: string | null
  onClose: () => void
  onSaved: () => void
}

export const EmployeeDetailDrawer: React.FC<EmployeeDrawerProps> = ({ employeeId, onClose, onSaved }) => {
  const [activeTab, setActiveTab] = useState<'personal' | 'contract' | 'permissions' | 'gamification'>('personal')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [loadingCEP, setLoadingCEP] = useState(false)
  const [linkedUserId, setLinkedUserId] = useState<string | null>(null)
  const [localPerms, setLocalPerms] = useState<Record<string, ModulePerm>>({})
  const [sensPerms, setSensPerms] = useState({ can_view_profit: false, can_apply_discount: false, can_adjust_stock: false })
  const [userIsActive, setUserIsActive] = useState(true)

  const defaultForm = {
    name: '', email: '', phone: '', role: '', department: '',
    cpf: '', rg: '', pis: '', birth_date: '', admission_date: '',
    address_street: '', address_number: '', address_complement: '',
    address_neighborhood: '', address_city: '', address_state: '', address_zip_code: '',
    salary: '', weekly_hours: '44', overtime_bank: '0', contract_type: 'clt',
    bank_name: '', bank_agency: '', bank_account: '', bank_account_type: 'checking', pix_key: '',
    emergency_contact_name: '', emergency_contact_phone: '',
    gamification_points: '0', gamification_medals: [] as string[],
    photo_url: '', active: true, notes: '',
  }

  const [form, setForm] = useState(defaultForm)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    if (employeeId) loadData()
    else { setForm(defaultForm); initDefaultPerms() }
  }, [employeeId])

  const initDefaultPerms = () => {
    const p: Record<string, ModulePerm> = {}
    ALL_MODULES.forEach(m => { p[m.code] = applyLevel('full') })
    setLocalPerms(p)
  }

  const loadData = async () => {
    if (!employeeId) return
    try {
      const { data: emp } = await supabase.from('employees').select('*').eq('id', employeeId).maybeSingle()
      if (emp) {
        setForm({
          name: emp.name || '', email: emp.email || '', phone: emp.phone || '',
          role: emp.role || '', department: emp.department || '',
          cpf: emp.cpf || '', rg: emp.rg || '', pis: emp.pis || '',
          birth_date: emp.birth_date || '', admission_date: emp.admission_date || '',
          address_street: emp.address_street || '', address_number: emp.address_number || '',
          address_complement: emp.address_complement || '', address_neighborhood: emp.address_neighborhood || '',
          address_city: emp.address_city || '', address_state: emp.address_state || '',
          address_zip_code: emp.address_zip_code || '',
          salary: emp.salary?.toString() || '', weekly_hours: emp.weekly_hours?.toString() || '44',
          overtime_bank: emp.overtime_bank?.toString() || '0', contract_type: emp.contract_type || 'clt',
          bank_name: emp.bank_name || '', bank_agency: emp.bank_agency || '',
          bank_account: emp.bank_account || '', bank_account_type: emp.bank_account_type || 'checking',
          pix_key: emp.pix_key || '', emergency_contact_name: emp.emergency_contact_name || '',
          emergency_contact_phone: emp.emergency_contact_phone || '',
          gamification_points: emp.gamification_points?.toString() || '0',
          gamification_medals: Array.isArray(emp.gamification_medals) ? emp.gamification_medals : [],
          photo_url: emp.photo_url || '', active: emp.active ?? true, notes: emp.notes || '',
        })
      }

      const { data: authAcc } = await supabase.from('auth_accounts').select('id, is_active').eq('email', emp?.email || '').maybeSingle()
      if (authAcc) {
        setLinkedUserId(authAcc.id)
        setUserIsActive(authAcc.is_active)
        const [{ data: perms }, { data: sens }] = await Promise.all([
          supabase.from('module_permissions').select('module_code,can_view,can_create,can_edit,can_delete').eq('user_id', authAcc.id),
          supabase.from('sensitive_permissions').select('*').eq('user_id', authAcc.id).maybeSingle()
        ])
        const p: Record<string, ModulePerm> = {}
        ALL_MODULES.forEach(m => {
          const found = perms?.find(x => x.module_code === m.code)
          p[m.code] = found ? { can_view: found.can_view, can_create: found.can_create, can_edit: found.can_edit, can_delete: found.can_delete } : applyLevel('full')
        })
        setLocalPerms(p)
        if (sens) setSensPerms({ can_view_profit: sens.can_view_profit, can_apply_discount: sens.can_apply_discount, can_adjust_stock: sens.can_adjust_stock })
      } else {
        initDefaultPerms()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchCEP = async (cep: string) => {
    const clean = unmask(cep)
    if (clean.length !== 8) return
    setLoadingCEP(true)
    try {
      const r = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
      const d = await r.json()
      if (!d.erro) {
        setForm(prev => ({ ...prev, address_street: d.logradouro || prev.address_street, address_neighborhood: d.bairro || prev.address_neighborhood, address_city: d.localidade || prev.address_city, address_state: d.uf || prev.address_state }))
      }
    } catch { } finally { setLoadingCEP(false) }
  }

  const overtimeValue = () => {
    const sal = parseFloat(form.salary) || 0
    const hours = parseFloat(form.weekly_hours) || 44
    const hourlyRate = sal / (hours * 4.33)
    return (hourlyRate * 1.5).toFixed(2)
  }

  const saveEmployee = async () => {
    if (!form.name) { showToast('Nome é obrigatório', 'error'); return }
    setSaving(true)
    try {
      const payload = {
        name: form.name, email: form.email, phone: unmask(form.phone),
        role: form.role, department: form.department,
        cpf: unmask(form.cpf), rg: form.rg, pis: form.pis,
        birth_date: form.birth_date || null, admission_date: form.admission_date || null,
        address_street: form.address_street, address_number: form.address_number,
        address_complement: form.address_complement, address_neighborhood: form.address_neighborhood,
        address_city: form.address_city, address_state: form.address_state, address_zip_code: unmask(form.address_zip_code),
        salary: parseFloat(form.salary) || 0, weekly_hours: parseFloat(form.weekly_hours) || 44,
        overtime_bank: parseFloat(form.overtime_bank) || 0, contract_type: form.contract_type,
        bank_name: form.bank_name, bank_agency: form.bank_agency, bank_account: form.bank_account,
        bank_account_type: form.bank_account_type, pix_key: form.pix_key,
        emergency_contact_name: form.emergency_contact_name, emergency_contact_phone: form.emergency_contact_phone,
        gamification_points: parseInt(form.gamification_points) || 0,
        gamification_medals: form.gamification_medals,
        photo_url: form.photo_url, active: form.active, notes: form.notes,
      }

      if (employeeId) {
        const { error } = await supabase.from('employees').update(payload).eq('id', employeeId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('employees').insert(payload)
        if (error) throw error
      }

      showToast('Funcionário salvo com sucesso!')
      onSaved()
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar', 'error')
    } finally {
      setSaving(false)
    }
  }

  const savePermissions = async () => {
    if (!linkedUserId) { showToast('Este funcionário não possui conta de sistema vinculada.', 'error'); return }
    setSaving(true)
    try {
      const rows = ALL_MODULES.map(m => ({ user_id: linkedUserId, module_code: m.code, ...localPerms[m.code] }))
      const [{ error: e1 }, { error: e2 }] = await Promise.all([
        supabase.from('module_permissions').upsert(rows, { onConflict: 'user_id,module_code' }),
        supabase.from('sensitive_permissions').upsert({ user_id: linkedUserId, ...sensPerms }, { onConflict: 'user_id' })
      ])
      if (e1) throw e1
      if (e2) throw e2
      showToast('Permissões salvas!')
    } catch (err: any) {
      showToast(err.message || 'Erro', 'error')
    } finally { setSaving(false) }
  }

  const setAllAccess = (level: AccessLevel) => {
    const p: Record<string, ModulePerm> = {}
    ALL_MODULES.forEach(m => { p[m.code] = applyLevel(level) })
    setLocalPerms(p)
  }

  const toggleMedal = (id: string) => {
    setForm(prev => ({
      ...prev,
      gamification_medals: prev.gamification_medals.includes(id)
        ? prev.gamification_medals.filter(m => m !== id)
        : [...prev.gamification_medals, id]
    }))
  }

  const groupedModules = ALL_MODULES.reduce<Record<string, typeof ALL_MODULES>>((acc, m) => {
    if (!acc[m.group]) acc[m.group] = []
    acc[m.group].push(m)
    return acc
  }, {})

  const f = (field: keyof typeof form, val: string | boolean | string[]) => setForm(prev => ({ ...prev, [field]: val }))

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1'

  const tabs = [
    { id: 'personal', label: 'Dados Pessoais', icon: User },
    { id: 'contract', label: 'Contrato & Financeiro', icon: DollarSign },
    { id: 'permissions', label: 'Permissões de Sistema', icon: Shield },
    { id: 'gamification', label: 'Gamificação & Arquivos', icon: Star },
  ] as const

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-end"
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Toast */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`absolute top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-xl text-sm font-medium ${toast.type === 'success' ? 'bg-white border border-green-200 text-green-700' : 'bg-white border border-red-200 text-red-700'}`}
              >
                {toast.type === 'success' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                {toast.message}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white flex-shrink-0">
            <div className="flex items-center gap-3">
              {form.photo_url ? (
                <img src={form.photo_url} alt={form.name} className="w-11 h-11 rounded-full object-cover border-2 border-gray-200" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                  {form.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div>
                <h2 className="font-semibold text-gray-900">{form.name || 'Novo Funcionário'}</h2>
                <p className="text-xs text-gray-500">{form.role || 'Cargo não definido'} {form.department && `· ${form.department}`}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={activeTab === 'permissions' ? savePermissions : saveEmployee}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-all"
              >
                {saving ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Save className="h-4 w-4" />}
                Salvar
              </button>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 bg-gray-50 flex-shrink-0 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">

            {/* TAB 1: Dados Pessoais */}
            {activeTab === 'personal' && (
              <div className="p-6 space-y-5">
                {/* Foto */}
                <PhotoDropZone
                  currentUrl={form.photo_url}
                  employeeId={employeeId}
                  onUploaded={url => f('photo_url', url)}
                />

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className={labelCls}>Nome Completo *</label>
                    <input type="text" value={form.name} onChange={e => f('name', e.target.value)} className={inputCls} placeholder="João da Silva" />
                  </div>
                  <div>
                    <label className={labelCls}>E-mail</label>
                    <input type="email" value={form.email} onChange={e => f('email', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Telefone</label>
                    <input type="tel" value={form.phone} onChange={e => f('phone', maskPhone(e.target.value))} className={inputCls} placeholder="(11) 99999-9999" />
                  </div>
                  <div>
                    <label className={labelCls}>Cargo</label>
                    <input type="text" value={form.role} onChange={e => f('role', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Departamento</label>
                    <input type="text" value={form.department} onChange={e => f('department', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>CPF</label>
                    <input type="text" value={form.cpf} onChange={e => f('cpf', maskCPF(e.target.value))} className={inputCls} placeholder="000.000.000-00" maxLength={14} />
                  </div>
                  <div>
                    <label className={labelCls}>RG</label>
                    <input type="text" value={form.rg} onChange={e => f('rg', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>PIS/PASEP</label>
                    <input type="text" value={form.pis} onChange={e => f('pis', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Data de Nascimento</label>
                    <input type="date" value={form.birth_date} onChange={e => f('birth_date', e.target.value)} className={inputCls} />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />Endereço</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>CEP</label>
                      <input
                        type="text" value={form.address_zip_code}
                        onChange={e => { const v = maskCEP(e.target.value); f('address_zip_code', v); fetchCEP(v) }}
                        className={inputCls} placeholder="00000-000" maxLength={9}
                      />
                      {loadingCEP && <p className="text-xs text-blue-500 mt-1">Buscando...</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Número</label>
                      <input type="text" value={form.address_number} onChange={e => f('address_number', e.target.value)} className={inputCls} />
                    </div>
                    <div className="col-span-2">
                      <label className={labelCls}>Logradouro</label>
                      <input type="text" value={form.address_street} onChange={e => f('address_street', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Bairro</label>
                      <input type="text" value={form.address_neighborhood} onChange={e => f('address_neighborhood', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Complemento</label>
                      <input type="text" value={form.address_complement} onChange={e => f('address_complement', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Cidade</label>
                      <input type="text" value={form.address_city} onChange={e => f('address_city', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>UF</label>
                      <input type="text" value={form.address_state} onChange={e => f('address_state', e.target.value)} className={inputCls} maxLength={2} />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5" />Contato de Emergência</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Nome</label>
                      <input type="text" value={form.emergency_contact_name} onChange={e => f('emergency_contact_name', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Telefone</label>
                      <input type="tel" value={form.emergency_contact_phone} onChange={e => f('emergency_contact_phone', maskPhone(e.target.value))} className={inputCls} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Status do Funcionário</p>
                    <p className="text-xs text-gray-500">Determina se aparece em listagens ativas</p>
                  </div>
                  <button
                    onClick={() => f('active', !form.active)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${form.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}
                  >
                    {form.active ? <><ToggleRight className="h-4 w-4" />Ativo</> : <><ToggleLeft className="h-4 w-4" />Inativo</>}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Contrato & Financeiro */}
            {activeTab === 'contract' && (
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Tipo de Contrato</label>
                    <select value={form.contract_type} onChange={e => f('contract_type', e.target.value)} className={inputCls}>
                      {CONTRACT_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Data de Admissão</label>
                    <input type="date" value={form.admission_date} onChange={e => f('admission_date', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Salário Base (R$)</label>
                    <input type="number" step="0.01" value={form.salary} onChange={e => f('salary', e.target.value)} className={inputCls} placeholder="0.00" />
                  </div>
                  <div>
                    <label className={labelCls}>Carga Horária Semanal (h)</label>
                    <input type="number" value={form.weekly_hours} onChange={e => f('weekly_hours', e.target.value)} className={inputCls} placeholder="44" />
                  </div>
                  <div>
                    <label className={labelCls}>Banco de Horas (h extras)</label>
                    <input type="number" step="0.5" value={form.overtime_bank} onChange={e => f('overtime_bank', e.target.value)} className={inputCls} />
                  </div>
                </div>

                {/* Overtime calculation */}
                {parseFloat(form.salary) > 0 && parseFloat(form.weekly_hours) > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />Cálculo Automático</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-amber-600 text-xs">Valor da Hora Normal</p>
                        <p className="font-semibold text-amber-800">R$ {(parseFloat(form.salary) / (parseFloat(form.weekly_hours) * 4.33)).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-amber-600 text-xs">Valor da Hora Extra (+50%)</p>
                        <p className="font-semibold text-amber-800">R$ {overtimeValue()}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-amber-600 text-xs">Total a Receber pelas Horas Extras</p>
                        <p className="font-bold text-amber-900 text-base">R$ {(parseFloat(form.overtime_bank) * parseFloat(overtimeValue())).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2"><CreditCard className="h-3.5 w-3.5" />Dados Bancários</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Banco</label>
                      <input type="text" value={form.bank_name} onChange={e => f('bank_name', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Tipo de Conta</label>
                      <select value={form.bank_account_type} onChange={e => f('bank_account_type', e.target.value)} className={inputCls}>
                        <option value="checking">Corrente</option>
                        <option value="savings">Poupança</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Agência</label>
                      <input type="text" value={form.bank_agency} onChange={e => f('bank_agency', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Conta</label>
                      <input type="text" value={form.bank_account} onChange={e => f('bank_account', e.target.value)} className={inputCls} />
                    </div>
                    <div className="col-span-2">
                      <label className={labelCls}>Chave PIX</label>
                      <input type="text" value={form.pix_key} onChange={e => f('pix_key', e.target.value)} className={inputCls} placeholder="CPF, e-mail, telefone ou chave aleatória" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Observações</label>
                  <textarea rows={3} value={form.notes} onChange={e => f('notes', e.target.value)} className={`${inputCls} resize-none`} />
                </div>
              </div>
            )}

            {/* TAB 3: Permissões de Sistema */}
            {activeTab === 'permissions' && (
              <div className="p-6 space-y-5">
                {!linkedUserId && (
                  <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600" />
                    <div>
                      <p className="font-semibold">Conta de sistema não vinculada</p>
                      <p className="text-xs mt-1 text-amber-700">Este funcionário não possui uma conta de acesso criada. As permissões serão aplicadas após o cadastro de usuário.</p>
                    </div>
                  </div>
                )}

                {linkedUserId && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${userIsActive ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                      <p className="text-sm text-gray-700 font-medium">Acesso ao sistema {userIsActive ? 'ativo' : 'inativo'}</p>
                    </div>
                    <span className="text-xs text-gray-500">ID: {linkedUserId.slice(0, 8)}...</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-800 flex items-center gap-2"><Shield className="h-4 w-4 text-blue-600" />Controle de Módulos</p>
                  <div className="flex gap-2">
                    {(['none', 'read', 'full'] as AccessLevel[]).map(l => (
                      <button key={l} onClick={() => setAllAccess(l)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-medium border transition-colors ${l === 'none' ? 'border-red-200 text-red-600 hover:bg-red-50' : l === 'read' ? 'border-amber-200 text-amber-700 hover:bg-amber-50' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'}`}
                      >
                        {l === 'none' ? 'Bloquear' : l === 'read' ? 'Leitura' : 'Total'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {Object.entries(groupedModules).map(([group, modules]) => (
                    <div key={group} className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                        <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">{group}</p>
                      </div>
                      <div className="p-3 grid grid-cols-1 gap-2">
                        {modules.map(mod => {
                          const p = localPerms[mod.code] || applyLevel('full')
                          const level = getLevel(p)
                          return (
                            <div key={mod.code} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-50">
                              <p className="text-sm text-gray-800">{mod.label}</p>
                              <div className="flex gap-1">
                                {(['none', 'read', 'full'] as AccessLevel[]).map(l => (
                                  <button key={l}
                                    onClick={() => setLocalPerms(prev => ({ ...prev, [mod.code]: applyLevel(l) }))}
                                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${level === l ? (l === 'none' ? 'bg-red-500 text-white' : l === 'read' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white') : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                  >
                                    {l === 'none' ? 'Sem' : l === 'read' ? 'Leitura' : 'Total'}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border border-gray-300 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-gray-600" />
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Permissões Sensíveis</p>
                  </div>
                  <div className="p-3 space-y-2">
                    {[
                      { key: 'can_view_profit' as const, label: 'Visualizar Lucro Real e Impostos' },
                      { key: 'can_apply_discount' as const, label: 'Aplicar Descontos em OS' },
                      { key: 'can_adjust_stock' as const, label: 'Ajustar Saldo de Estoque' },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-gray-50">
                        <p className="text-sm text-gray-800">{item.label}</p>
                        <button
                          onClick={() => setSensPerms(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                          className={`relative w-10 h-5 rounded-full transition-all ${sensPerms[item.key] ? 'bg-emerald-500' : 'bg-gray-300'}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${sensPerms[item.key] ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: Gamificação & Arquivos */}
            {activeTab === 'gamification' && (
              <div className="p-6 space-y-5">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-bold text-blue-800 flex items-center gap-2"><Award className="h-4 w-4" />Pontuação de Desempenho</p>
                      <p className="text-xs text-blue-600 mt-0.5">Baseado no histórico de produtividade</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-blue-700">{form.gamification_points}</p>
                      <p className="text-xs text-blue-500">pontos</p>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls + ' text-blue-700'}>Ajustar Pontos Manualmente</label>
                    <input
                      type="number" value={form.gamification_points}
                      onChange={e => f('gamification_points', e.target.value)}
                      className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2"><Star className="h-4 w-4 text-amber-500" />Medalhas Conquistadas</p>
                  <div className="grid grid-cols-2 gap-2">
                    {MEDALS.map(medal => {
                      const earned = form.gamification_medals.includes(medal.id)
                      return (
                        <button
                          key={medal.id}
                          onClick={() => toggleMedal(medal.id)}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${earned ? 'border-amber-400 bg-amber-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                        >
                          <span className="text-2xl">{medal.icon}</span>
                          <div>
                            <p className={`text-xs font-semibold ${earned ? 'text-amber-800' : 'text-gray-700'}`}>{medal.label}</p>
                            {earned && <p className="text-xs text-amber-600 mt-0.5">Conquistada</p>}
                          </div>
                          {earned && <Check className="h-4 w-4 text-amber-500 ml-auto flex-shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2"><FileText className="h-4 w-4 text-gray-500" />Repositório de Documentos</p>
                  <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 font-medium">Arraste arquivos ou clique para fazer upload</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG até 10MB</p>
                    <p className="text-xs text-gray-400 mt-2">Para upload de documentos, utilize a seção de documentos do funcionário nas configurações da empresa.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default EmployeeDetailDrawer
