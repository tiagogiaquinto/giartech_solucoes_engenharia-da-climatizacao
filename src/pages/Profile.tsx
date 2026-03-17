import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Lock, Eye, EyeOff, Check, AlertCircle, Shield } from 'lucide-react'
import { useUser } from '../contexts/UserContext'
import { supabase } from '../lib/supabase'

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrador',
  manager: 'Gerente',
  technician: 'Técnico',
  sales: 'Vendas',
  financial: 'Financeiro',
  viewer: 'Visualizador',
}

const Profile = () => {
  const { user, profile } = useUser()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleChangePassword = async () => {
    setPasswordMsg(null)
    if (!newPassword || newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'A nova senha deve ter ao menos 6 caracteres' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'As senhas não coincidem' })
      return
    }

    setSaving(true)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      })
      if (signInError) throw new Error('Senha atual incorreta')

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) throw updateError

      await supabase.from('auth_accounts').update({
        must_change_password: false,
        temp_password: null,
        password_changed_at: new Date().toISOString(),
      }).eq('id', user?.id)

      setPasswordMsg({ type: 'success', text: 'Senha alterada com sucesso!' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Erro ao alterar senha' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
      >
        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="Perfil"
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-2xl shadow-md">
                {(user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">{user?.name || user?.email}</h1>
            <p className="text-sm text-gray-500 truncate">{user?.email}</p>
            <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100">
              <Shield className="h-3 w-3" />
              {ROLE_LABELS[profile?.role || ''] || profile?.role || 'Usuário'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Personal Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
      >
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User className="h-4 w-4 text-gray-400" /> Informações da Conta
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-400">Nome</p>
              <p className="text-sm font-medium text-gray-800 truncate">{user?.name || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-400">E-mail</p>
              <p className="text-sm font-medium text-gray-800 truncate">{user?.email || '—'}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Change Password */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
      >
        <h2 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <Lock className="h-4 w-4 text-gray-400" /> Alterar Senha
        </h2>
        <p className="text-xs text-gray-400 mb-5">Se recebeu uma senha temporária, altere aqui para uma senha de sua escolha.</p>

        {passwordMsg && (
          <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl border mb-4 ${
            passwordMsg.type === 'success'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {passwordMsg.type === 'success'
              ? <Check className="h-4 w-4 flex-shrink-0" />
              : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
            {passwordMsg.text}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha atual</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Digite sua senha atual"
                className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded"
              >
                {showCurrent ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nova senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowNew(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded"
              >
                {showNew ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmar nova senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className={`w-full pl-9 pr-10 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  confirmPassword && newPassword !== confirmPassword
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded"
              >
                {showConfirm ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1">As senhas não coincidem</p>
            )}
          </div>

          <button
            onClick={handleChangePassword}
            disabled={saving || !currentPassword || !newPassword || !confirmPassword}
            className="w-full py-2.5 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <><Check className="h-4 w-4" />Salvar nova senha</>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default Profile
