import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Lock, User, Shield, Eye, EyeOff, Check, AlertCircle, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Props {
  onClose: () => void
  onSaved: () => void
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  technician: 'Técnico',
  sales: 'Vendas',
  financial: 'Financeiro',
  viewer: 'Visualizador',
}

function generatePassword(length = 10): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

const CreateAccountModal: React.FC<Props> = ({ onClose, onSaved }) => {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: generatePassword(),
    role: 'viewer',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState(false)
  const [createdPassword, setCreatedPassword] = useState('')

  const set = (field: keyof typeof form, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSave = async () => {
    setError(null)
    if (!form.email.trim()) { setError('E-mail obrigatório'); return }
    if (!form.password.trim() || form.password.length < 6) { setError('Senha deve ter ao menos 6 caracteres'); return }

    setSaving(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-admin-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          password: form.password,
          full_name: form.full_name.trim(),
          role: form.role,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao criar usuário')

      setCreatedPassword(form.password)
      setCreated(true)
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta')
    } finally {
      setSaving(false)
    }
  }

  if (created) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center"
          >
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-7 w-7 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Conta criada com sucesso!</h3>
            <p className="text-sm text-gray-500 mb-5">Compartilhe as credenciais abaixo com o usuário.</p>

            <div className="bg-gray-50 rounded-xl p-4 text-left space-y-3 mb-5 border border-gray-200">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">E-mail</p>
                <p className="text-sm font-medium text-gray-800 font-mono">{form.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Senha temporária</p>
                <p className="text-sm font-medium text-gray-800 font-mono bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-200">{createdPassword}</p>
              </div>
            </div>

            <p className="text-xs text-gray-400 mb-5">O usuário poderá alterar a senha nas configurações do perfil após o primeiro acesso.</p>

            <button
              onClick={onSaved}
              className="w-full py-2.5 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              Concluir
            </button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Nova Conta de Acesso</h2>
                <p className="text-xs text-gray-500">Crie um acesso com senha temporária</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-200">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={form.full_name}
                  onChange={e => set('full_name', e.target.value)}
                  placeholder="Ex: Daiani Allini"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                E-mail <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="email@exemplo.com"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Senha temporária <span className="text-red-500">*</span>
                <span className="ml-1 text-xs text-gray-400 font-normal">(usuário altera no perfil)</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  className="w-full pl-9 pr-20 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <button
                    type="button"
                    onClick={() => set('password', generatePassword())}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Gerar nova senha"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5 text-gray-400" /> : <Eye className="h-3.5 w-3.5 text-gray-400" />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">Compartilhe esta senha com o usuário para o primeiro acesso</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nível de acesso</label>
              <select
                value={form.role}
                onChange={e => set('role', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {Object.entries(ROLE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 p-6 pt-0">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 text-sm rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <><Check className="h-4 w-4" />Criar Conta</>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default CreateAccountModal
