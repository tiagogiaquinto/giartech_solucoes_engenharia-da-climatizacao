import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, User, DollarSign, Shield, History, Save, Eye, EyeOff,
  CheckCircle, AlertCircle, RefreshCw, ChevronDown
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { AnyProfile, StaffProfile, PortalProfile, AuditEntry, ROLE_LABELS, MODULE_LIST } from './types'
import { format } from 'date-fns'

interface Props {
  profile: AnyProfile | null
  onClose: () => void
  onSaved: () => void
}

type Tab = 'dados' | 'financeiro' | 'permissoes' | 'historico'

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
    full_name: '',
    email: '',
    phone: '',
    department: '',
    role: '',
    salary: '',
    hourly_rate: '',
    work_hours: '',
    custo_hora: '',
  })

  const [permissions, setPermissions] = useState<Record<string, { can_view: boolean; can_create: boolean; can_edit: boolean; can_delete: boolean }>>({})

  const isStaff = profile?.type === 'staff'

  useEffect(() => {
    if (!profile) return
    setTab('dados')
    setForm({
      full_name:    profile.full_name || '',
      email:        profile.email || '',
      phone:        profile.phone || '',
      department:   (profile as StaffProfile).department || '',
      role:         profile.role || '',
      salary:       String((profile as StaffProfile).salary || ''),
      hourly_rate:  String((profile as StaffProfile).hourly_rate || ''),
      work_hours:   String((profile as StaffProfile).work_hours || ''),
      custo_hora:   String((profile as StaffProfile).custo_hora || ''),
    })
    loadPermissions()
  }, [profile])

  useEffect(() => {
    if (tab === 'historico' && profile) {
      loadAudit()
    }
  }, [tab])

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
        can_view:   found?.can_view ?? true,
        can_create: found?.can_create ?? false,
        can_edit:   found?.can_edit ?? false,
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
          p_target_id:  profile.id,
          p_full_name:  form.full_name || null,
          p_phone:      form.phone || null,
          p_department: form.department || null,
          p_role:       form.role || null,
          p_salary:     form.salary ? parseFloat(form.salary) : null,
          p_hourly_rate:form.hourly_rate ? parseFloat(form.hourly_rate) : null,
          p_work_hours: form.work_hours ? parseFloat(form.work_hours) : null,
          p_custo_hora: form.custo_hora ? parseFloat(form.custo_hora) : null,
        })
        if (error) throw error
      } else {
        const { error } = await supabase.rpc('admin_update_portal_profile', {
          p_target_id: profile.id,
          p_full_name: form.full_name || null,
          p_phone:     form.phone || null,
          p_role:      form.role || null,
          p_email:     form.email !== profile.email ? form.email : null,
        })
        if (error) {
          if (error.message?.includes('EMAIL_DUPLICATE')) throw new Error('Este e-mail já está em uso por outro perfil.')
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

  const savePermissions = async () => {
    if (!profile) return
    setSaving(true)
    try {
      const modules = MODULE_LIST.map(m => ({
        module_code: m.code,
        ...permissions[m.code],
      }))
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
        p_new_password: newPwd,
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
    { id: 'dados',      label: 'Cadastro',    icon: User },
    { id: 'financeiro', label: isStaff ? 'Financeiro' : 'Acesso', icon: DollarSign },
    { id: 'permissoes', label: 'Permissões', icon: Shield },
    { id: 'historico',  label: 'Histórico',  icon: History },
  ]

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-xl flex flex-col"
        style={{
          background: 'linear-gradient(160deg, rgba(10,18,38,0.98) 0%, rgba(15,25,50,0.98) 100%)',
          borderLeft: '1px solid rgba(59,130,246,0.25)',
          backdropFilter: 'blur(20px)',
          boxShadow: '-8px 0 48px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid rgba(59,130,246,0.15)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
              {profile.full_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <h2 className="text-white font-semibold text-base leading-tight">{profile.full_name || '—'}</h2>
              <p className="text-blue-400 text-xs">{profile.email}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-4"
          style={{ borderBottom: '1px solid rgba(59,130,246,0.1)' }}>
          {tabs.map(t => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-all"
                style={{
                  color: active ? '#60a5fa' : '#6b7280',
                  background: active ? 'rgba(59,130,246,0.12)' : 'transparent',
                  borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent',
                }}>
                <Icon size={13} />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === 'dados' && (
            <div className="space-y-4">
              <Field label="Nome Completo" value={form.full_name}
                onChange={v => setForm(f => ({ ...f, full_name: v }))} />
              <Field label="E-mail" value={form.email} type="email"
                onChange={v => setForm(f => ({ ...f, email: v }))} />
              <Field label="Telefone" value={form.phone}
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
                    className="w-full appearance-none rounded-lg px-3 py-2.5 text-sm text-white pr-8"
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
                  <ChevronDown size={14} className="absolute right-2.5 top-3 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {!isStaff && (
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(59,130,246,0.1)' }}>
                  <button
                    onClick={() => setShowResetPwd(!showResetPwd)}
                    className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors">
                    <RefreshCw size={14} />
                    Resetar Senha do Portal
                  </button>
                  <AnimatePresence>
                    {showResetPwd && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} className="mt-3 space-y-2 overflow-hidden">
                        <div className="relative">
                          <input
                            type={showPwd ? 'text' : 'password'}
                            value={newPwd}
                            onChange={e => setNewPwd(e.target.value)}
                            placeholder="Nova senha"
                            className="w-full rounded-lg px-3 py-2.5 text-sm text-white pr-10"
                            style={{
                              background: 'rgba(255,255,255,0.06)',
                              border: '1px solid rgba(59,130,246,0.25)',
                            }} />
                          <button onClick={() => setShowPwd(!showPwd)}
                            className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white">
                            {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                        <button
                          onClick={handleResetPassword}
                          disabled={!newPwd.trim() || saving}
                          className="w-full py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-all"
                          style={{ background: 'linear-gradient(135deg, #d97706, #b45309)' }}>
                          Confirmar Reset
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}

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
                <div className="rounded-xl p-4 text-center"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,130,246,0.1)' }}>
                  <p className="text-gray-400 text-sm">
                    Dados financeiros de portais são gerenciados na aba de clientes/parceiros.
                  </p>
                </div>
              )}
            </div>
          )}

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
                          <PermissionToggle
                            label="Ver"
                            value={p.can_view}
                            onChange={v => setPermissions(prev => ({ ...prev, [m.code]: { ...p, can_view: v } }))}
                          />
                        </div>
                        <div className="flex gap-3">
                          {(['can_create', 'can_edit', 'can_delete'] as const).map(key => (
                            <PermissionToggle
                              key={key}
                              label={{ can_create: 'Criar', can_edit: 'Editar', can_delete: 'Excluir' }[key]}
                              value={p[key]}
                              small
                              onChange={v => setPermissions(prev => ({ ...prev, [m.code]: { ...p, [key]: v } }))}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                  <button onClick={savePermissions} disabled={saving}
                    className="w-full mt-2 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                    style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
                    <Save size={15} />
                    Salvar Permissões
                  </button>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">Contas de portal não possuem permissões de módulo.</p>
              )}
            </div>
          )}

          {tab === 'historico' && (
            <div className="space-y-3">
              <SectionTitle>Auditoria de Alterações</SectionTitle>
              {loadingAudit ? (
                <div className="text-center py-8 text-gray-500 text-sm">Carregando histórico...</div>
              ) : auditLog.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">Nenhuma alteração registrada.</div>
              ) : (
                auditLog.map(entry => (
                  <div key={entry.id} className="rounded-xl p-3 text-xs"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,130,246,0.1)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-blue-300 uppercase tracking-wide">{entry.field_name}</span>
                      <span className="text-gray-500">
                        {format(new Date(entry.changed_at), 'dd/MM/yy HH:mm')}
                      </span>
                    </div>
                    {entry.old_value && (
                      <p className="text-gray-500 line-through text-xs">{entry.old_value}</p>
                    )}
                    <p className="text-gray-300">{entry.new_value || '—'}</p>
                    <p className="text-gray-600 mt-1">por {entry.changed_by_email}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {(tab === 'dados' || tab === 'financeiro') && (
          <div className="px-6 py-4" style={{ borderTop: '1px solid rgba(59,130,246,0.15)' }}>
            <button onClick={saveProfile} disabled={saving}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
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
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed bottom-6 right-6 z-[60] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium"
            style={{
              background: toast.type === 'success' ? 'rgba(5,46,22,0.95)' : 'rgba(69,10,10,0.95)',
              border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
              color: toast.type === 'success' ? '#86efac' : '#fca5a5',
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
      className="w-full rounded-lg px-3 py-2.5 text-sm text-white outline-none transition-all focus:ring-1 focus:ring-blue-500"
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(59,130,246,0.25)',
      }}
    />
  </div>
)

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-3">{children}</h3>
)

const PermissionToggle: React.FC<{
  label: string
  value: boolean
  onChange: (v: boolean) => void
  small?: boolean
}> = ({ label, value, onChange, small }) => (
  <button
    onClick={() => onChange(!value)}
    className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all ${small ? 'text-xs' : 'text-xs'}`}
    style={{
      background: value ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${value ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
      color: value ? '#93c5fd' : '#6b7280',
    }}>
    <div className={`w-1.5 h-1.5 rounded-full ${value ? 'bg-blue-400' : 'bg-gray-600'}`} />
    {label}
  </button>
)
