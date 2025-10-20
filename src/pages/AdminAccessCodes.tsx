import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Key, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  X, 
  RefreshCw,
  Shield,
  User,
  Calendar,
  Clock,
  Edit,
  Save
} from 'lucide-react'
import { useUser } from '../contexts/UserContext'

interface AccessCode {
  id: string
  code: string
  role: 'admin' | 'technician' | 'external'
  createdAt: string
  expiresAt: string
  createdBy: string
  isUsed: boolean
  usedBy?: string
  usedAt?: string
  isUniversal?: boolean
}

const AdminAccessCodes = () => {
  const { isAdmin } = useUser()
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([
    {
      id: '1',
      code: '0000',
      role: 'admin',
      createdAt: '2024-01-15T10:00:00',
      expiresAt: '2099-12-31T23:59:59',
      createdBy: 'Admin Demo',
      isUsed: true,
      usedBy: 'Admin Demo',
      usedAt: '2024-01-15T10:05:00',
      isUniversal: true
    },
    {
      id: '2',
      code: '234567',
      role: 'technician',
      createdAt: '2024-01-16T11:30:00',
      expiresAt: '2024-12-31T23:59:59',
      createdBy: 'Admin Demo',
      isUsed: true,
      usedBy: 'Carlos Técnico',
      usedAt: '2024-01-16T14:20:00'
    },
    {
      id: '3',
      code: '345678',
      role: 'technician',
      createdAt: '2024-01-17T09:15:00',
      expiresAt: '2024-12-31T23:59:59',
      createdBy: 'Admin Demo',
      isUsed: true,
      usedBy: 'Ana Técnica',
      usedAt: '2024-01-17T10:45:00'
    },
    {
      id: '4',
      code: '456789',
      role: 'external',
      createdAt: '2024-01-18T14:30:00',
      expiresAt: '2024-12-31T23:59:59',
      createdBy: 'Admin Demo',
      isUsed: true,
      usedBy: 'João Externo',
      usedAt: '2024-01-19T08:10:00'
    },
    {
      id: '5',
      code: '567890',
      role: 'technician',
      createdAt: '2024-01-20T16:45:00',
      expiresAt: '2024-12-31T23:59:59',
      createdBy: 'Admin Demo',
      isUsed: false
    }
  ])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCode, setEditingCode] = useState<AccessCode | null>(null)
  const [newCode, setNewCode] = useState({
    role: 'technician' as 'admin' | 'technician' | 'external',
    expiresAt: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
  })
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')

  // Filtrar códigos
  const filteredCodes = accessCodes.filter(code => {
    if (filter === 'all') return true
    if (filter === 'used') return code.isUsed
    if (filter === 'unused') return !code.isUsed
    if (filter === 'admin' || filter === 'technician' || filter === 'external') return code.role === filter
    return true
  })

  // Gerar código aleatório
  const generateRandomCode = () => {
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString()
    return randomCode
  }

  // Criar novo código
  const handleCreateCode = () => {
    const newAccessCode: AccessCode = {
      id: Date.now().toString(),
      code: generateRandomCode(),
      role: newCode.role,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(newCode.expiresAt + 'T23:59:59').toISOString(),
      createdBy: 'Admin Demo',
      isUsed: false
    }
    
    setAccessCodes([...accessCodes, newAccessCode])
    setShowCreateModal(false)
    setCopiedId(newAccessCode.id)
    
    // Limpar o status de copiado após 3 segundos
    setTimeout(() => {
      if (copiedId === newAccessCode.id) {
        setCopiedId(null)
      }
    }, 3000)
  }

  // Editar código universal
  const handleEditUniversalCode = () => {
    if (editingCode) {
      setAccessCodes(accessCodes.map(code => 
        code.id === editingCode.id ? editingCode : code
      ))
      setShowEditModal(false)
      setEditingCode(null)
    }
  }

  // Copiar código para a área de transferência
  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id)
      
      // Limpar o status de copiado após 3 segundos
      setTimeout(() => {
        if (copiedId === id) {
          setCopiedId(null)
        }
      }, 3000)
    })
  }

  // Excluir código
  const deleteCode = (id: string) => {
    const codeToDelete = accessCodes.find(code => code.id === id)
    
    if (codeToDelete?.isUniversal) {
      alert('O código universal não pode ser excluído.')
      return
    }
    
    if (confirm('Tem certeza que deseja excluir este código de acesso?')) {
      setAccessCodes(accessCodes.filter(code => code.id !== id))
    }
  }

  // Regenerar código
  const regenerateCode = (id: string) => {
    const codeToRegenerate = accessCodes.find(code => code.id === id)
    
    if (codeToRegenerate?.isUniversal) {
      setEditingCode(codeToRegenerate)
      setShowEditModal(true)
      return
    }
    
    setAccessCodes(accessCodes.map(code => 
      code.id === id ? { ...code, code: generateRandomCode(), isUsed: false, usedBy: undefined, usedAt: undefined } : code
    ))
  }

  // Formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Verificar se o código está expirado
  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date()
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <Shield className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h2>
        <p className="text-gray-600 text-center">
          Esta área é restrita a administradores do sistema.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Códigos de Acesso</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:shadow-lg transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Código</span>
        </button>
      </div>

      {/* Universal Code Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 shadow-md border border-blue-200"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Key className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Código Universal</h3>
              <p className="text-sm text-gray-600">
                Código de acesso principal para administradores
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const universalCode = accessCodes.find(code => code.isUniversal)
              if (universalCode) {
                setEditingCode(universalCode)
                setShowEditModal(true)
              }
            }}
            className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-1 text-sm"
          >
            <Edit className="h-3 w-3" />
            <span>Alterar</span>
          </button>
        </div>

        <div className="bg-white rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="h-5 w-5 text-purple-600" />
            <div>
              <div className="flex items-center">
                <span className="font-mono font-bold text-lg text-gray-900 mr-2">
                  {accessCodes.find(code => code.isUniversal)?.code || '0000'}
                </span>
                <button
                  onClick={() => {
                    const universalCode = accessCodes.find(code => code.isUniversal)
                    if (universalCode) {
                      copyToClipboard(universalCode.code, universalCode.id)
                    }
                  }}
                  className={`p-1 rounded-md transition-colors ${
                    copiedId === accessCodes.find(code => code.isUniversal)?.id
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                  title="Copiar código"
                >
                  {copiedId === accessCodes.find(code => code.isUniversal)?.id ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-sm text-gray-600">
                Acesso administrativo com permissões completas
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
            Universal
          </span>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('unused')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'unused'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Não Utilizados
          </button>
          <button
            onClick={() => setFilter('used')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'used'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Utilizados
          </button>
          <button
            onClick={() => setFilter('admin')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'admin'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Administradores
          </button>
          <button
            onClick={() => setFilter('technician')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'technician'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Técnicos
          </button>
          <button
            onClick={() => setFilter('external')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'external'
                ? 'bg-orange-100 text-orange-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Externos
          </button>
        </div>
      </div>

      {/* Access Codes List */}
      <div className="space-y-4">
        {filteredCodes.filter(code => !code.isUniversal).length > 0 ? (
          filteredCodes.filter(code => !code.isUniversal).map((code, index) => (
            <motion.div
              key={code.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-white rounded-xl p-6 shadow-md border ${
                code.isUsed 
                  ? isExpired(code.expiresAt) 
                    ? 'border-red-200' 
                    : 'border-yellow-200'
                  : isExpired(code.expiresAt)
                    ? 'border-red-200'
                    : 'border-green-200'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    code.role === 'admin' 
                      ? 'bg-purple-100' 
                      : code.role === 'technician'
                        ? 'bg-blue-100'
                        : 'bg-orange-100'
                  }`}>
                    <Key className={`h-6 w-6 ${
                      code.role === 'admin' 
                        ? 'text-purple-600' 
                        : code.role === 'technician'
                          ? 'text-blue-600'
                          : 'text-orange-600'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center">
                      <h3 className="text-lg font-semibold text-gray-900 mr-2">
                        {code.code}
                      </h3>
                      <button
                        onClick={() => copyToClipboard(code.code, code.id)}
                        className={`p-1 rounded-md transition-colors ${
                          copiedId === code.id
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                        title="Copiar código"
                      >
                        {copiedId === code.id ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-600">
                      {code.role === 'admin' 
                        ? 'Administrador' 
                        : code.role === 'technician'
                          ? 'Técnico'
                          : 'Funcionário Externo'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {code.isUsed ? (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                      Utilizado
                    </span>
                  ) : isExpired(code.expiresAt) ? (
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                      Expirado
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      Disponível
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="flex items-center text-sm text-gray-600 mb-1">
                    <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                    <span>Criado em:</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(code.createdAt)}
                  </p>
                </div>
                <div>
                  <div className="flex items-center text-sm text-gray-600 mb-1">
                    <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                    <span>Expira em:</span>
                  </div>
                  <p className={`text-sm font-medium ${
                    isExpired(code.expiresAt) ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {formatDate(code.expiresAt)}
                  </p>
                </div>
                {code.isUsed && code.usedBy && code.usedAt && (
                  <>
                    <div>
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <User className="h-4 w-4 mr-1 text-gray-400" />
                        <span>Utilizado por:</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {code.usedBy}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <Clock className="h-4 w-4 mr-1 text-gray-400" />
                        <span>Utilizado em:</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(code.usedAt)}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex space-x-2">
                {!code.isUsed && (
                  <button
                    onClick={() => regenerateCode(code.id)}
                    className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-1 text-sm"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Regenerar</span>
                  </button>
                )}
                <button
                  onClick={() => deleteCode(code.id)}
                  className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center space-x-1 text-sm"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Excluir</span>
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="bg-white rounded-xl p-10 shadow-md border border-gray-100 text-center">
            <Key className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum código encontrado</h3>
            <p className="text-gray-600 mb-6">Não encontramos códigos de acesso com os filtros selecionados.</p>
            <button
              onClick={() => setFilter('all')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {/* Create Code Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white rounded-xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Novo Código de Acesso</h2>
                <button onClick={() => setShowCreateModal(false)}>
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Acesso
                  </label>
                  <select
                    value={newCode.role}
                    onChange={(e) => setNewCode({...newCode, role: e.target.value as any})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="admin">Administrador</option>
                    <option value="technician">Técnico</option>
                    <option value="external">Funcionário Externo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Expiração
                  </label>
                  <input
                    type="date"
                    value={newCode.expiresAt}
                    onChange={(e) => setNewCode({...newCode, expiresAt: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center text-blue-700 mb-2">
                    <Shield className="h-5 w-5 mr-2" />
                    <h3 className="font-medium">Informações de Segurança</h3>
                  </div>
                  <p className="text-sm text-blue-600">
                    O código será gerado automaticamente e poderá ser copiado após a criação.
                    Compartilhe-o de forma segura com o usuário.
                  </p>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateCode}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg"
                >
                  Gerar Código
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Universal Code Modal */}
      <AnimatePresence>
        {showEditModal && editingCode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowEditModal(false)
                setEditingCode(null)
              }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white rounded-xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Alterar Código Universal</h2>
                <button onClick={() => {
                  setShowEditModal(false)
                  setEditingCode(null)
                }}>
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Novo Código Universal
                  </label>
                  <input
                    type="text"
                    value={editingCode.code}
                    onChange={(e) => setEditingCode({...editingCode, code: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Digite o novo código"
                    maxLength={6}
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    O código universal deve ter no máximo 6 dígitos
                  </p>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center text-yellow-700 mb-2">
                    <Shield className="h-5 w-5 mr-2" />
                    <h3 className="font-medium">Atenção</h3>
                  </div>
                  <p className="text-sm text-yellow-600">
                    Alterar o código universal afetará o acesso de todos os administradores.
                    Certifique-se de comunicar o novo código a todos os usuários relevantes.
                  </p>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingCode(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEditUniversalCode}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg"
                >
                  <Save className="h-4 w-4 mr-2 inline" />
                  Salvar Alterações
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AdminAccessCodes