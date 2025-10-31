import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Building2, Plus, CreditCard as Edit, Trash2, Search, Phone, Mail, MapPin, Globe, CircleCheck as CheckCircle, Circle as XCircle, Loader as Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { fetchCnpjData, fetchCepData, formatCnpj, formatCep } from '../utils/externalApis'

interface Supplier {
  id: string
  name: string
  cnpj?: string
  email?: string
  phone?: string
  address?: string
  contact_person?: string
  payment_terms?: string
  active: boolean
  notes?: string
  created_at: string
  updated_at?: string
}

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [searchingCnpj, setSearchingCnpj] = useState(false)
  const [searchingCep, setSearchingCep] = useState(false)
  const [cnpjError, setCnpjError] = useState('')
  const [cepError, setCepError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    address: '',
    contact_person: '',
    payment_terms: '',
    active: true,
    notes: ''
  })

  useEffect(() => {
    loadSuppliers()
  }, [])

  const loadSuppliers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name')

      if (error) throw error
      setSuppliers(data || [])
    } catch (error) {
      console.error('Error loading suppliers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      if (!formData.name) {
        alert('Nome é obrigatório!')
        return
      }

      const dataToSave = {
        name: formData.name,
        cnpj: formData.cnpj || null,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        contact_person: formData.contact_person || null,
        payment_terms: formData.payment_terms || null,
        notes: formData.notes || null,
        active: formData.active
      }

      if (editingSupplier) {
        const { error } = await supabase
          .from('suppliers')
          .update(dataToSave)
          .eq('id', editingSupplier.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('suppliers')
          .insert([dataToSave])
        if (error) throw error
      }

      setShowModal(false)
      setEditingSupplier(null)
      resetForm()
      loadSuppliers()
    } catch (error) {
      console.error('Error saving supplier:', error)
      alert('Erro ao salvar fornecedor!')
    }
  }

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setFormData({
      name: supplier.name,
      cnpj: supplier.cnpj || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      contact_person: supplier.contact_person || '',
      payment_terms: supplier.payment_terms || '',
      active: supplier.active,
      notes: supplier.notes || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este fornecedor?')) return

    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadSuppliers()
    } catch (error) {
      console.error('Error deleting supplier:', error)
      alert('Erro ao excluir fornecedor!')
    }
  }

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({ active: !currentStatus })
        .eq('id', id)

      if (error) throw error
      loadSuppliers()
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      cnpj: '',
      email: '',
      phone: '',
      address: '',
      contact_person: '',
      payment_terms: '',
      active: true,
      notes: ''
    })
    setCnpjError('')
    setCepError('')
  }

  const handleCnpjSearch = async () => {
    if (!formData.cnpj) {
      setCnpjError('Digite um CNPJ')
      return
    }

    const cnpjClean = formData.cnpj.replace(/\D/g, '')
    if (cnpjClean.length !== 14) {
      setCnpjError('CNPJ deve ter 14 dígitos')
      return
    }

    setSearchingCnpj(true)
    setCnpjError('')

    try {
      const data = await fetchCnpjData(formData.cnpj)

      if (data) {
        setFormData(prev => ({
          ...prev,
          name: data.nome_fantasia || data.razao_social || prev.name,
          email: data.email || prev.email,
          phone: data.telefone || prev.phone,
          address: data.logradouro ? `${data.logradouro}, ${data.numero || 'S/N'}` : prev.address
        }))
      }
    } catch (error) {
      setCnpjError(error instanceof Error ? error.message : 'Erro ao buscar CNPJ')
    } finally {
      setSearchingCnpj(false)
    }
  }

  const handleCepSearch = async () => {
    if (!formData.address) {
      setCepError('Digite um CEP')
      return
    }

    const cepClean = formData.address.replace(/\D/g, '')
    if (cepClean.length !== 8) {
      setCepError('CEP deve ter 8 dígitos')
      return
    }

    setSearchingCep(true)
    setCepError('')

    try {
      const data = await fetchCepData(formData.address)

      if (data) {
        setFormData(prev => ({
          ...prev,
          address: data.logradouro || prev.address
        }))
      }
    } catch (error) {
      setCepError(error instanceof Error ? error.message : 'Erro ao buscar CEP')
    } finally {
      setSearchingCep(false)
    }
  }

  const handleCnpjChange = (value: string) => {
    const formatted = formatCnpj(value)
    setFormData({ ...formData, cnpj: formatted })
    setCnpjError('')
  }

  const handleCepChange = (value: string) => {
    const formatted = formatCep(value)
    setFormData({ ...formData, address: formatted })
    setCepError('')
  }

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.cnpj?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && supplier.active) ||
      (filterStatus === 'inactive' && !supplier.active)

    return matchesSearch && matchesStatus
  })

  const stats = {
    total: suppliers.length,
    active: suppliers.filter(s => s.active).length,
    inactive: suppliers.filter(s => !s.active).length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            Gestão de Fornecedores
          </h1>
          <p className="text-gray-600 mt-1">Gerencie seus fornecedores e parceiros</p>
        </div>
        <button
          onClick={() => {
            setEditingSupplier(null)
            resetForm()
            setShowModal(true)
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Fornecedor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gray-100 rounded-lg">
              <XCircle className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Inativos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar fornecedores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((supplier) => (
            <motion.div
              key={supplier.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-6 rounded-xl border-2 transition-all ${
                supplier.active
                  ? 'bg-white border-gray-200 hover:border-blue-300'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg text-gray-900 truncate">{supplier.name}</h3>
                  {supplier.name && (
                    <p className="text-sm text-gray-600 truncate">{supplier.name}</p>
                  )}
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ml-2 ${
                  supplier.active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {supplier.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              <div className="space-y-2 mb-4 text-sm">
                {supplier.cnpj && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Building2 className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{supplier.cnpj}</span>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{supplier.email}</span>
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-3 w-3 flex-shrink-0" />
                    <span>{supplier.phone}</span>
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{supplier.address}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(supplier)}
                  className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </button>
                <button
                  onClick={() => toggleStatus(supplier.id, supplier.active)}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    supplier.active
                      ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                  }`}
                  title={supplier.active ? 'Desativar' : 'Ativar'}
                >
                  {supplier.active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => handleDelete(supplier.id)}
                  className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredSuppliers.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Nenhum fornecedor encontrado</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-3xl w-full my-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingSupplier(null)
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Fantasia *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Materiais Premium Ltda"
                  />
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.cnpj}
                      onChange={(e) => handleCnpjChange(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleCnpjSearch()
                        }
                      }}
                      className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        cnpjError ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="00.000.000/0000-00"
                      maxLength={18}
                    />
                    <button
                      type="button"
                      onClick={handleCnpjSearch}
                      disabled={searchingCnpj || !formData.cnpj}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                      title="Buscar CNPJ"
                    >
                      {searchingCnpj ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Search className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {cnpjError && (
                    <p className="mt-1 text-sm text-red-600">{cnpjError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="contato@fornecedor.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="(00) 0000-0000"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Contato</label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nome do responsável"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Condições de Pagamento</label>
                  <input
                    type="text"
                    value={formData.payment_terms}
                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: 30 dias, À vista, etc"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Informações adicionais..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="ativo" className="text-sm font-medium text-gray-700">
                  Fornecedor ativo
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingSupplier(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Salvar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default Suppliers
