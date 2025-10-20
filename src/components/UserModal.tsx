import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Save, User, Mail, Phone, Shield, Building, Key, FileText } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface UserModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  userId?: string
}

const UserModal = ({ isOpen, onClose, onSave, userId }: UserModalProps) => {
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'user' as 'admin' | 'manager' | 'user' | 'viewer',
    department: '',
    position: '',
    permissions: [] as string[],
    notes: '',
    active: true
  })

  useEffect(() => {
    if (userId) {
      loadUserData()
    } else {
      resetForm()
    }
  }, [userId, isOpen])

  const loadUserData = async () => {
    if (!userId) return

    try {
      const { data: user } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (user) {
        setFormData({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          role: user.role || 'user',
          department: user.department || '',
          position: user.position || '',
          permissions: user.permissions || [],
          notes: user.notes || '',
          active: user.active ?? true
        })
      }
    } catch (error) {
      console.error('Error loading user:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'user',
      department: '',
      position: '',
      permissions: [],
      notes: '',
      active: true
    })
  }

  const handleSave = async () => {
    try {
      if (!formData.name || !formData.email) {
        alert('Nome e Email são obrigatórios!')
        return
      }

      setLoading(true)

      const dataToSave = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        role: formData.role,
        department: formData.department || null,
        position: formData.position || null,
        permissions: formData.permissions,
        notes: formData.notes || null,
        active: formData.active
      }

      if (userId) {
        const { error } = await supabase
          .from('user_profiles')
          .update(dataToSave)
          .eq('id', userId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('user_profiles')
          .insert([dataToSave])
        if (error) throw error
      }

      onSave()
      onClose()
    } catch (error) {
      console.error('Error saving user:', error)
      alert('Erro ao salvar usuário!')
    } finally {
      setLoading(false)
    }
  }

  const togglePermission = (permission: string) => {
    if (formData.permissions.includes(permission)) {
      setFormData({
        ...formData,
        permissions: formData.permissions.filter(p => p !== permission)
      })
    } else {
      setFormData({
        ...formData,
        permissions: [...formData.permissions, permission]
      })
    }
  }

  const availablePermissions = [
    { id: 'clientes', label: 'Gestão de Clientes' },
    { id: 'fornecedores', label: 'Gestão de Fornecedores' },
    { id: 'funcionarios', label: 'Gestão de Funcionários' },
    { id: 'estoque', label: 'Gestão de Estoque' },
    { id: 'financeiro', label: 'Gestão Financeira' },
    { id: 'ordens_servico', label: 'Ordens de Serviço' },
    { id: 'relatorios', label: 'Relatórios' },
    { id: 'configuracoes', label: 'Configurações do Sistema' }
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{opacity: 0, scale: 0.95}}
        animate={{opacity: 1, scale: 1}}
        className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div>
            <h2 className="text-2xl font-bold">{userId ? 'Editar Usuário' : 'Novo Usuário'}</h2>
            <p className="text-blue-100 text-sm">Gerenciamento de usuários e permissões</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nome completo do usuário"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-500" />
                  Nível de Acesso
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="viewer">Visualizador</option>
                  <option value="user">Usuário</option>
                  <option value="manager">Gerente</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  Departamento
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Operacional, Administrativo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <Key className="h-4 w-4 text-gray-500" />
                  Cargo
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({...formData, position: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Técnico, Supervisor"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-500" />
                Permissões de Acesso
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg">
                {availablePermissions.map(permission => (
                  <label key={permission.id} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(permission.id)}
                      onChange={() => togglePermission(permission.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm">{permission.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                Observações
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Informações adicionais sobre o usuário"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({...formData, active: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium">Usuário Ativo</span>
              </label>
            </div>

            {formData.role === 'admin' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Atenção:</strong> Usuários com nível de acesso "Administrador" têm permissão total no sistema, incluindo acesso a todas as funcionalidades e configurações sensíveis.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium flex items-center justify-center gap-2"
          >
            {loading ? (
              <>Salvando...</>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Salvar Usuário
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default UserModal
