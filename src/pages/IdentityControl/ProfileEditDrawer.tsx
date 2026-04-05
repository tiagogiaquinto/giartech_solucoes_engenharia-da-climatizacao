import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, User, DollarSign, Shield, History, Save, Eye, EyeOff,
  CheckCircle, AlertCircle, RefreshCw, ChevronDown, MapPin
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { AnyProfile, StaffProfile, AuditEntry, ROLE_LABELS, MODULE_LIST } from './types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Props {
  profile: AnyProfile | null
  onClose: () => void
  onSaved: () => void
}

type Tab = 'dados' | 'endereco' | 'financeiro' | 'permissoes' | 'historico'

export const ProfileEditDrawer: React.FC<Props> = ({ profile, onClose, onSaved }) => {
  const [tab, setTab] = useState<Tab>('dados')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])
  const [loadingAudit, setLoadingAudit] = useState(false)
  const [showResetPwd, setShowResetPwd] = useState(false)
  const [newPwd, setNewPwd] = useState('')
  const [showPwd, setShowPwd] = useState(false)

  const [form, setForm] = useState({
    full_name:    '',
    email:        '',
    phone:        '',
    department:   '',
    role:         '',
    salary:       '',
    hourly_rate:  '',
    work_hours:   '',
    custo_hora:   '',
  })

  const [address, setAddress] = useState({
    cep:          '',
    street:       '',
    number:       '',
    complement:   '',
    neighborhood: '',
    city:         '',
    state:        '',
  })

  const [permissions, setPermissions] = useState<Record<string, {
    can_view: boolean; can_create: boolean; can_edit: boolean; can_delete: boolean
  }>>({})

  const isStaff = profile?.type === 'staff'

  useEffect(() => {
    if (!profile) return
    setTab('dados')
    setShowResetPwd(false)
    setNewPwd('')
    setForm({
      full_name:   profile.full_name || '',
      email:       profile.email || '',
      phone:       profile.phone || '',
      department:  (profile as StaffProfile).department || '',
      role:        profile.role || '',
      salary:      String((profile as StaffProfile).salary || ''),
      hourly_rate: String((profile as StaffProfile).hourly_rate || ''),
      work_hours:  String((profile as StaffProfile).work_hours || ''),
      custo_hora:  String((profile as StaffProfile).custo_hora || ''),
    })
    loadPermissions()
    loadAddress()
  }, [profile])

  useEffect(() => {
    if (tab === 'historico' && profile) loadAudit()
  }, [tab])

  const loadAddress = async () => {
    if (!profile) return
    try {
      if (isStaff) {
        const { data } = await supabase
          .from('employees')
          .select('address_cep, address_street, address_number, address_complement, address_neighborhood, address_city, address_state')
          .eq('auth_account_id', profile.id)
          .maybeSingle()
        if (data) setAddress({
          cep:          data.address_cep         || '',
          street:       data.address_street      || '',
          number:       data.address_number      || '',
          complement:   data.address_complement  || '',
          neighborhood: data.address_neighborhood|| '',
          city:         data.address_city        || '',
          state:        data.address_state       || '',
        })
      } else {
        const { data } = await supabase
          .from('customers')
          .select('cep, logradouro, numero, complemento, bairro, cidade, estado')
          .eq('id', (profile as any).customer_id)
          .maybeSingle()
        if (data) setAddress({
          cep:          data.cep          || '',
          street:       data.logradouro   || '',
          number:       data.numero       || '',
          complement:   data.complemento  || '',
          neighborhood: data.bairro       || '',
          city:         data.cidade       || '',
          state:        data.estado       || '',
        })
      }
    } catch { /* ignore */ }
  }

  const loadPermissions = async () => {
    if (!profile || !isStaff) return
    const { data } = await supabase
      .from('module_permissions')
      .select('*')
      .eq('user_id', profile.id)
    const map: typeof permissions = {}
    MODULE_LIST.forEach(m => {
      const found = data?.find(d => d.module_code === m.code)
      map[m.code] = {
        can_view:   found?.can_view   ?? true,
        can_create: found?.can_create ?? false,
        can_edit:   found?.can_edit   ?? false,
        can_delete: found?.can_delete ?? false,
      }
    })
    setPermissions(map)
  }

  const loadAudit = async () => {
    if (!profile) return
    setLoadingAudit(true)
    try {
      const { data } = await supabase.rpc('admin_get_profile_audit', { p_target_id: profile.id })
      setAuditLog(Array.isArray(data) ? data : [])
    } catch { /* ignore */ }
    setLoadingAudit(false)
  }

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  const saveProfile = async () => {
    if (!profile) return
    setSaving(true)
    try {
      if (isStaff) {
        const { error } = await supabase.rpc('admin_update_staff_profile', {
          p_target_id:   profile.id,
          p_full_name:   form.full_name   || null,
          p_phone:       form.phone       || null,
          p_department:  form.department  || null,
          p_role:        form.role        || null,
          p_salary:      form.salary      ? parseFloat(form.salary)      : null,
          p_hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : null,
          p_work_hours:  form.work_hours  ? parseFloat(form.work_hours)  : null,
          p_custo_hora:  form.custo_hora  ? parseFloat(form.custo_hora)  : null,
        })
        if (error) throw error
      } else {
        const { error } = await supabase.rpc('admin_update_portal_profile', {
          p_target_id: profile.id,
          p_full_name: form.full_name || null,
          p_phone:     form.phone     || null,
          p_role:      form.role      || null,
          p_email:     form.email !== profile.email ? form.email : null,
        })
        if (error) {
          if (error.message?.includes('EMAIL_DUPLICATE'))
            throw new Error('Este e-mail já está em uso por outro perfil.')
          throw error
        }
      }
      showToast('success', 'Perfil atualizado com sucesso.')
      onSaved()
    } catch (e: any) {
      showToast('error', e.message || 'Erro ao salvar.')
    }
    setSaving(false)
  }

  const saveAddress = async () => {
    if (!profile) return
    setSaving(true)
    try {
      if (isStaff) {
        await supabase.from('employees').update({
          address_cep:          address.cep,
          address_street:       address.street,
          address_number:       address.number,
          address_complement:   address.complement,
          address_neighborhood: address.neighborhood,
          address_city:         address.city,
          address_state:        address.state,
          updated_at:           new Date().toISOString(),
        }).eq('auth_account_id', profile.id)
      } else {
        await supabase.from('customers').update({
          cep:         address.cep,
          logradouro:  address.street,
          numero:      address.number,
          complemento: address.complement,
          bairro:      address.neighborhood,
          cidade:      address.city,
          estado:      address.state,
          updated_at:  new Date().toISOString(),
        }).eq('id', (profile as any).customer_id)
      }
      showToast('success', 'Endereço salvo com sucesso.')
    } catch {
      showToast('error', 'Erro ao salvar endereço.')
    }
    setSaving(false)
  }

  const fetchCep = async () => {
    const raw = address.cep.replace(/\D/g, '')
    if (raw.length !== 8) return
    try {
      const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`)
      const d = await res.json()
      if (!d.erro) setAddress(a => ({
        ...a,
        street:       d.logradouro || a.street,
        neighborhood: d.bairro     || a.neighborhood,
        city:         d.localidade || a.city,
        state:        d.uf         || a.state,
      }))
    } catch { /* ignore */ }
  }

  const savePermissions = async () => {
    if (!profile) return
    setSaving(true)
    try {
      const modules = MODULE_LIST.map(m => ({ module_code: m.code, ...permissions[m.code] }))
      const { error } = await supabase.rpc('admin_update_module_permissions', {
        p_user_id: profile.id,
        p_modules: modules,
      })
      if (error) throw error
      showToast('success', 'Permissões atualizadas.')
    } catch (e: any) {
      showToast('error', e.message || 'Erro ao salvar permissões.')
    }
    setSaving(false)
  }

  const handleResetPassword = async () => {
    if (!profile || !newPwd.trim()) return
    setSaving(true)
    try {
      const { error } = await supabase.rpc('admin_reset_portal_password', {
        p_portal_account_id: profile.id,
        p_new_password:      newPwd,
      })
      if (error) throw error
      showToast('success', 'Senha resetada com sucesso.')
      setNewPwd('')
      setShowResetPwd(false)
    } catch (e: any) {
      showToast('error', e.message || 'Erro ao resetar senha.')
    }
    setSaving(false)
  }

  if (!profile) return null

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'dados',      label: 'Cadastro',   icon: User },
    { id: 'endereco',   label: 'Endereço',   icon: MapPin },
    { id: 'financeiro', label: isStaff ? 'Financeiro' : 'Acesso', icon: DollarSign },
    { id: 'permissoes', label: 'Permissões', icon: Shield },
    { id: 'historico',  label: 'Histórico',  icon: History },
  ]

  const needsFooterSave = tab === 'dados' || tab === 'financeiro'
  const needsAddressSave = tab === 'endereco'

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-xl flex flex-col"
        style={{
          background: 'linear-gradient(160deg, rgba(8,15,31,0.99) 0%, rgba(12,22,46,0.99) 100%)',
          borderLeft: '1px solid rgba(59,130,246,0.2)',
          backdropFilter: 'blur(24px)',
          boxShadow: '-8px 0 56px rgba(0,0,0,0.7)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(59,130,246,0.12)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}
            >
              {profile.full_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <h2 className="text-white font-semibold text-base leading-tight">{profile.full_name || '—'}</h2>
              <p className="text-blue-400/70 text-xs">{ROLE_LABELS[profile.role] || profile.role} · {profile.email}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 px-3 pt-3 overflow-x-auto"
          style={{ borderBottom: '1px solid rgba(59,130,246,0.1)' }}>
          {tabs.map(t => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-all whitespace-nowrap flex-shrink-0"
                style={{
                  color:        active ? '#60a5fa'              : '#6b7280',
                  background:   active ? 'rgba(59,130,246,0.1)' : 'transparent',
                  borderBottom: active ? '2px solid #3b82f6'    : '2px solid transparent',
                }}>
                <Icon size={12} />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* ── Tab: Dados Cadastrais ── */}
          {tab === 'dados' && (
            <div className="space-y-4">
              <Field label="Nome Completo" value={form.full_name}
                onChange={v => setForm(f => ({ ...f, full_name: v }))} />
              <Field label="E-mail" value={form.email} type="email"
                onChange={v => setForm(f => ({ ...f, email: v }))} />
              <Field label="Telefone / WhatsApp" value={form.phone}
                onChange={v => setForm(f => ({ ...f, phone: v }))} />
              {isStaff && (
                <Field label="Departamento" value={form.department}
                  onChange={v => setForm(f => ({ ...f, department: v }))} />
              )}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Papel / Função</label>
                <div className="relative">
                  <select
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full appearance-none rounded-xl px-3 py-2.5 text-sm text-white pr-8 outline-none"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(59,130,246,0.25)',
                    }}>
                    {isStaff ? (
                      <>
                        <option value="super_admin">Super Admin</option>
                        <option value="admin">Administrador</option>
                        <option value="manager">Gerente</option>
                        <option value="technician">Técnico</option>
                        <option value="sales">Comercial</option>
                        <option value="financial">Financeiro</option>
                        <option value="viewer">Visualizador</option>
                      </>
                    ) : (
                      <>
                        <option value="cliente">Cliente</option>
                        <option value="parceiro">Parceiro</option>
                      </>
                    )}
                  </select>
                  <ChevronDown size={13} className="absolute right-2.5 top-3 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {!isStaff && (
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(59,130,246,0.1)' }}>
                  <button
                    onClick={() => setShowResetPwd(!showResetPwd)}
                    className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors">
                    <RefreshCw size={13} />
                    Redefinir senha do portal
                  </button>
                  <AnimatePresence>
                    {showResetPwd && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 space-y-2 overflow-hidden">
                        <div className="relative">
                          <input
                            type={showPwd ? 'text' : 'password'}
                            value={newPwd}
                            onChange={e => setNewPwd(e.target.value)}
                            placeholder="Nova senha"
                            className="w-full rounded-xl px-3 py-2.5 text-sm text-white pr-10 outline-none"
                            style={{
                              background: 'rgba(255,255,255,0.06)',
                              border: '1px solid rgba(59,130,246,0.25)',
                            }} />
                          <button onClick={() => setShowPwd(!showPwd)}
                            className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white transition-colors">
                            {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                        <button
                          onClick={handleResetPassword}
                          disabled={!newPwd.trim() || saving}
                          className="w-full py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all hover:brightness-110"
                          style={{ background: 'linear-gradient(135deg, #d97706, #b45309)' }}>
                          Confirmar nova senha
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Endereço ── */}
          {tab === 'endereco' && (
            <div className="space-y-4">
              <SectionTitle>Endereço</SectionTitle>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Field label="CEP" value={address.cep}
                    onChange={v => setAddress(a => ({ ...a, cep: v }))} />
                </div>
                <button
                  onClick={fetchCep}
                  className="mt-5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all hover:brightness-110 flex-shrink-0"
                  style={{
                    background: 'rgba(29,78,216,0.5)',
                    border: '1px solid rgba(59,130,246,0.3)',
                    color: '#93c5fd',
                  }}>
                  Buscar
                </button>
              </div>
              <Field label="Logradouro" value={address.street}
                onChange={v => setAddress(a => ({ ...a, street: v }))} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Número" value={address.number}
                  onChange={v => setAddress(a => ({ ...a, number: v }))} />
                <Field label="Complemento" value={address.complement}
                  onChange={v => setAddress(a => ({ ...a, complement: v }))} />
              </div>
              <Field label="Bairro" value={address.neighborhood}
                onChange={v => setAddress(a => ({ ...a, neighborhood: v }))} />
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Field label="Cidade" value={address.city}
                    onChange={v => setAddress(a => ({ ...a, city: v }))} />
                </div>
                <Field label="UF" value={address.state}
                  onChange={v => setAddress(a => ({ ...a, state: v.toUpperCase().slice(0, 2) }))} />
              </div>
              {!isStaff && !(profile as any).customer_id && (
                <div className="rounded-xl p-3 text-xs text-amber-400/80"
                  style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  Este perfil de portal não possui cliente vinculado. O endereço não pode ser salvo.
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Financeiro ── */}
          {tab === 'financeiro' && (
            <div className="space-y-4">
              {isStaff ? (
                <>
                  <SectionTitle>Remuneração</SectionTitle>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Salário (R$)" value={form.salary} type="number"
                      onChange={v => setForm(f => ({ ...f, salary: v }))} />
                    <Field label="Custo/Hora (R$)" value={form.custo_hora} type="number"
                      onChange={v => setForm(f => ({ ...f, custo_hora: v }))} />
                    <Field label="Hora Extra (R$)" value={form.hourly_rate} type="number"
                      onChange={v => setForm(f => ({ ...f, hourly_rate: v }))} />
                    <Field label="Horas/Dia" value={form.work_hours} type="number"
                      onChange={v => setForm(f => ({ ...f, work_hours: v }))} />
                  </div>
                </>
              ) : (
                <div className="rounded-xl p-4 text-sm text-gray-400 text-center"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,130,246,0.1)' }}>
                  Dados financeiros de portais são gerenciados nas abas de clientes e parceiros.
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Permissões ── */}
          {tab === 'permissoes' && (
            <div className="space-y-3">
              <SectionTitle>Controle de Módulos</SectionTitle>
              {isStaff ? (
                <div className="space-y-2">
                  {MODULE_LIST.map(m => {
                    const p = permissions[m.code] || { can_view: false, can_create: false, can_edit: false, can_delete: false }
                    return (
                      <div key={m.code} className="rounded-xl p-3"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,130,246,0.1)' }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-200">{m.label}</span>
                          <PermissionToggle label="Ver" value={p.can_view}
                            onChange={v => setPermissions(prev => ({ ...prev, [m.code]: { ...p, can_view: v } }))} />
                        </div>
                        <div className="flex gap-2">
                          {(['can_create', 'can_edit', 'can_delete'] as const).map(key => (
                            <PermissionToggle key={key}
                              label={{ can_create: 'Criar', can_edit: 'Editar', can_delete: 'Excluir' }[key]}
                              value={p[key]} small
                              onChange={v => setPermissions(prev => ({ ...prev, [m.code]: { ...p, [key]: v } }))} />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                  <button onClick={savePermissions} disabled={saving}
                    className="w-full mt-2 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2 transition-all hover:brightness-110"
                    style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
                    <Save size={15} />
                    Salvar Permissões
                  </button>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">Contas de portal não possuem permissões de módulo configuráveis aqui.</p>
              )}
            </div>
          )}

          {/* ── Tab: Histórico ── */}
          {tab === 'historico' && (
            <div className="space-y-3">
              <SectionTitle>Auditoria de Alterações</SectionTitle>
              {loadingAudit ? (
                <div className="text-center py-8 text-gray-500 text-sm flex items-center justify-center gap-2">
                  <RefreshCw size={14} className="animate-spin" />
                  Carregando histórico...
                </div>
              ) : auditLog.length === 0 ? (
                <div className="text-center py-12 text-gray-600 text-sm">
                  Nenhuma alteração registrada ainda.
                </div>
              ) : (
                auditLog.map(entry => (
                  <div key={entry.id} className="rounded-xl p-3.5"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,130,246,0.1)' }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-blue-300 uppercase tracking-wide">{entry.field_name}</span>
                      <span className="text-gray-600 text-xs">
                        {format(new Date(entry.changed_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    {entry.old_value && (
                      <p className="text-gray-600 line-through text-xs mb-0.5">{entry.old_value}</p>
                    )}
                    <p className="text-gray-300 text-xs">{entry.new_value || '—'}</p>
                    <p className="text-gray-600 text-xs mt-1.5">por {entry.changed_by_email}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer save button */}
        {(needsFooterSave || needsAddressSave) && (
          <div className="px-6 py-4" style={{ borderTop: '1px solid rgba(59,130,246,0.12)' }}>
            <button
              onClick={needsAddressSave ? saveAddress : saveProfile}
              disabled={saving}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%)' }}>
              {saving ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}>
                  <RefreshCw size={15} />
                </motion.div>
              ) : (
                <Save size={15} />
              )}
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        )}
      </motion.div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-[60] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium"
            style={{
              background:  toast.type === 'success' ? 'rgba(5,46,22,0.96)'  : 'rgba(69,10,10,0.96)',
              border:      `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
              color:       toast.type === 'success' ? '#86efac'             : '#fca5a5',
              backdropFilter: 'blur(16px)',
            }}>
            {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

const Field: React.FC<{
  label: string
  value: string
  type?: string
  onChange: (v: string) => void
}> = ({ label, value, type = 'text', onChange }) => (
  <div>
    <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none transition-all focus:ring-1 focus:ring-blue-500/60"
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(59,130,246,0.22)',
      }}
    />
  </div>
)

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-xs font-bold uppercase tracking-widest text-blue-400/80 mb-3">{children}</h3>
)

const PermissionToggle: React.FC<{
  label: string
  value: boolean
  onChange: (v: boolean) => void
  small?: boolean
}> = ({ label, value, onChange }) => (
  <button
    onClick={() => onChange(!value)}
    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all"
    style={{
      background: value ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.04)',
      border:     `1px solid ${value ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
      color:      value ? '#93c5fd' : '#6b7280',
    }}>
    <div className={`w-1.5 h-1.5 rounded-full ${value ? 'bg-blue-400' : 'bg-gray-600'}`} />
    {label}
  </button>
)
