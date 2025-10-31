import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Plus, Search, ListFilter as Filter, CreditCard as Edit, Trash2, Save, X, Phone, Mail, MapPin, Building, User, Calendar, FileText, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Clock, Shield, DollarSign, Eye, ChevronDown, ChevronUp, ClipboardList, Package, ArrowRight } from 'lucide-react'
import { useUser } from '../contexts/UserContext'
import { useNavigate } from 'react-router-dom'
import {
  getClients,
  createDbClient,
  updateClient,
  deleteClient,
  getContractsByClient,
  createContract,
  updateContract,
  deleteContract,
  supabase,
  type Client,
  type Contract
} from '../lib/supabase'
import CustomerModal from '../components/CustomerModal'

const ClientManagement = () => {
  const { isAdmin } = useUser()
  const navigate = useNavigate()
  const [clients, setClients] = useState<Client[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [serviceOrders, setServiceOrders] = useState<any[]>([])
  const [equipments, setEquipments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [editingCustomerId, setEditingCustomerId] = useState<string | undefined>(undefined)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showContractModal, setShowContractModal] = useState(false)
  const [editingContract, setEditingContract] = useState<Contract | null>(null)
  const [expandedClients, setExpandedClients] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    client_type: 'PF' as 'PF' | 'PJ',
    document: ''
  })

  const [newContract, setNewContract] = useState({
    title: '',
    contract_type: 'maintenance' as 'maintenance' | 'support' | 'service',
    start_date: '',
    end_date: '',
    frequency: 'monthly' as 'monthly' | 'quarterly' | 'biannual' | 'annual',
    value: 0,
    sla_response_time: 4,
    sla_resolution_time: 24,
    sla_availability: 99.0,
    next_service_date: '',
    terms_and_conditions: '',
    notes: ''
  })

  // Load clients from database
  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      setLoading(true)
      const data = await getClients()
      setClients(data || [])
      setError(null)
    } catch (err) {
      console.error('Error loading clients:', err)
      setError('Erro ao carregar clientes')
      // Fallback to sample data if database fails
      setClients([
        {
          id: '1',
          name: 'João Silva',
          email: 'joao@email.com',
          phone: '(11) 99999-1234',
          address: 'Rua das Flores, 123 - São Paulo, SP',
          client_type: 'PF',
          document: '123.456.789-00',
          created_at: '2023-12-15T08:00:00',
          updated_at: '2023-12-15T08:00:00'
        },
        {
          id: '2',
          name: 'Empresa ABC Ltda',
          email: 'contato@empresaabc.com',
          phone: '(11) 98888-5678',
          address: 'Av. Paulista, 1000 - São Paulo, SP',
          client_type: 'PJ',
          document: '12.345.678/0001-90',
          created_at: '2023-12-14T08:00:00',
          updated_at: '2023-12-14T08:00:00'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const loadClientContracts = async (clientId: string) => {
    try {
      const data = await getContractsByClient(clientId)
      return data || []
    } catch (err) {
      console.error('Error loading client contracts:', err)
      return []
    }
  }

  const loadClientServiceOrders = async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from('service_orders')
        .select('*')
        .eq('customer_id', clientId)
        .order('opened_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error loading service orders:', err)
      return []
    }
  }

  const loadClientEquipments = async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from('customer_equipment')
        .select('*')
        .eq('customer_id', clientId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error loading equipments:', err)
      return []
    }
  }

  // Filter clients
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || client.client_type === selectedType
    return matchesSearch && matchesType
  })

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedClients = filteredClients.slice(startIndex, endIndex)

  // Calculate clients with active contracts
  const clientsWithContracts = clients.filter(client =>
    contracts.some(contract => contract.customer_id === client.id && contract.status === 'active')
  ).length

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedType])

  const handleAddClient = async () => {

    try {
      const clientData = {
        name: newClient.name,
        email: newClient.email || undefined,
        phone: newClient.phone,
        address: newClient.address,
        client_type: newClient.client_type,
        document: newClient.document || undefined
      }
      
      const createdClient = await createDbClient(clientData)
      setClients([...clients, createdClient])
      
      // Reset form
      setNewClient({
        name: '',
        email: '',
        phone: '',
        address: '',
        client_type: 'PF',
        document: ''
      })
      setShowAddModal(false)
      alert('Cliente adicionado com sucesso!')
    } catch (error) {
      console.error('Error creating client:', error)
      alert('Erro ao adicionar cliente')
    }
  }

  const handleUpdateClient = async () => {
    if (!editingClient) return

    try {
      const updates = {
        name: editingClient.name,
        email: editingClient.email,
        phone: editingClient.phone,
        address: editingClient.address,
        client_type: editingClient.client_type,
        document: editingClient.document
      }
      
      const updatedClient = await updateClient(editingClient.id, updates)
      setClients(clients.map(client => 
        client.id === updatedClient.id ? updatedClient : client
      ))
      
      setEditingClient(null)
      alert('Cliente atualizado com sucesso!')
    } catch (error) {
      console.error('Error updating client:', error)
      alert('Erro ao atualizar cliente')
    }
  }

  const handleDeleteClient = async (id: string) => {
    try {
      await deleteClient(id)
      setClients(clients.filter(client => client.id !== id))
      setShowDeleteConfirm(null)
      alert('Cliente excluído com sucesso!')
    } catch (error) {
      console.error('Error deleting client:', error)
      alert('Erro ao excluir cliente')
    }
  }

  const handleCreateContract = async () => {
    if (!selectedClient) {
      alert('Por favor, selecione um cliente')
      return
    }

    try {
      const contractData = {
        client_id: selectedClient.id,
        contract_number: `CONT-${new Date().getFullYear()}-${String(contracts.length + 1).padStart(3, '0')}`,
        title: newContract.title,
        start_date: newContract.start_date,
        end_date: newContract.end_date,
        contract_type: newContract.contract_type,
        frequency: newContract.frequency,
        value: newContract.value,
        status: 'active' as const,
        sla_response_time: newContract.sla_response_time,
        sla_resolution_time: newContract.sla_resolution_time,
        sla_availability: newContract.sla_availability,
        next_service_date: newContract.next_service_date,
        terms_and_conditions: newContract.terms_and_conditions,
        notes: newContract.notes
      }
      
      const createdContract = await createContract(contractData)
      setContracts([...contracts, createdContract])
      
      // Reset form
      setNewContract({
        title: '',
        contract_type: 'maintenance',
        start_date: '',
        end_date: '',
        frequency: 'monthly',
        value: 0,
        sla_response_time: 4,
        sla_resolution_time: 24,
        sla_availability: 99.0,
        next_service_date: '',
        terms_and_conditions: '',
        notes: ''
      })
      setShowContractModal(false)
      setSelectedClient(null)
      alert('Contrato criado com sucesso!')
    } catch (error) {
      console.error('Error creating contract:', error)
      alert('Erro ao criar contrato')
    }
  }

  const handleUpdateContract = async () => {
    if (!editingContract) return

    try {
      const updates = {
        title: editingContract.title,
        start_date: editingContract.start_date,
        end_date: editingContract.end_date,
        contract_type: editingContract.contract_type,
        frequency: editingContract.frequency,
        value: editingContract.value,
        status: editingContract.status,
        sla_response_time: editingContract.sla_response_time,
        sla_resolution_time: editingContract.sla_resolution_time,
        sla_availability: editingContract.sla_availability,
        next_service_date: editingContract.next_service_date,
        terms_and_conditions: editingContract.terms_and_conditions,
        notes: editingContract.notes
      }
      
      const updatedContract = await updateContract(editingContract.id, updates)
      setContracts(contracts.map(contract => 
        contract.id === updatedContract.id ? updatedContract : contract
      ))
      
      setEditingContract(null)
      alert('Contrato atualizado com sucesso!')
    } catch (error) {
      console.error('Error updating contract:', error)
      alert('Erro ao atualizar contrato')
    }
  }

  const handleDeleteContract = async (id: string) => {
    try {
      await deleteContract(id)
      setContracts(contracts.filter(contract => contract.id !== id))
      alert('Contrato excluído com sucesso!')
    } catch (error) {
      console.error('Error deleting contract:', error)
      alert('Erro ao excluir contrato')
    }
  }

  const toggleClientExpansion = async (clientId: string) => {
    if (expandedClients.includes(clientId)) {
      setExpandedClients(expandedClients.filter(id => id !== clientId))
    } else {
      setExpandedClients([...expandedClients, clientId])
      // Load data for this client
      const [clientContracts, clientServiceOrders, clientEquipments] = await Promise.all([
        loadClientContracts(clientId),
        loadClientServiceOrders(clientId),
        loadClientEquipments(clientId)
      ])

      setContracts(prev => [
        ...prev.filter(c => c.client_id !== clientId),
        ...clientContracts
      ])
      setServiceOrders(prev => [
        ...prev.filter((so: any) => so.customer_id !== clientId),
        ...clientServiceOrders
      ])
      setEquipments(prev => [
        ...prev.filter((eq: any) => eq.customer_id !== clientId),
        ...clientEquipments
      ])
    }
  }

  const getServiceOrderStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getServiceOrderStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente'
      case 'in_progress': return 'Em Andamento'
      case 'completed': return 'Concluída'
      case 'cancelled': return 'Cancelada'
      default: return status
    }
  }

  const getContractStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'expired': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      case 'suspended': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getContractStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo'
      case 'expired': return 'Expirado'
      case 'cancelled': return 'Cancelado'
      case 'suspended': return 'Suspenso'
      default: return 'Desconhecido'
    }
  }

  const getContractTypeText = (type: string) => {
    switch (type) {
      case 'maintenance': return 'Manutenção'
      case 'support': return 'Suporte'
      case 'service': return 'Serviço'
      default: return type
    }
  }

  const getFrequencyText = (frequency?: string) => {
    switch (frequency) {
      case 'monthly': return 'Mensal'
      case 'quarterly': return 'Trimestral'
      case 'biannual': return 'Semestral'
      case 'annual': return 'Anual'
      default: return 'Não definida'
    }
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestão de Clientes</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:shadow-lg transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Cliente</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-4 shadow-md border border-gray-100"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-900">{clients.length}</h3>
          <p className="text-sm text-gray-600">Total de Clientes</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-4 shadow-md border border-gray-100"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-900">{clients.filter(c => c.client_type === 'PF').length}</h3>
          <p className="text-sm text-gray-600">Pessoa Física</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-4 shadow-md border border-gray-100"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Building className="h-5 w-5 text-white" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-900">{clients.filter(c => c.client_type === 'PJ').length}</h3>
          <p className="text-sm text-gray-600">Pessoa Jurídica</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-4 shadow-md border border-gray-100"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-900">{clientsWithContracts}</h3>
          <p className="text-sm text-gray-600">Clientes com Contrato</p>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar por nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os Tipos</option>
              <option value="PF">Pessoa Física</option>
              <option value="PJ">Pessoa Jurídica</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clients List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Carregando clientes...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedClients.length > 0 ? (
            paginatedClients.map((client, index) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      client.client_type === 'PF' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {client.client_type === 'PF' ? <User className="h-6 w-6" /> : <Building className="h-6 w-6" />}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          client.client_type === 'PF' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {client.client_type}
                        </span>
                        {client.document && (
                          <span className="text-xs text-gray-500">{client.document}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleClientExpansion(client.id)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {expandedClients.includes(client.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{client.phone}</span>
                  </div>
                  {client.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{client.email}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 md:col-span-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{client.address}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingClient(client)
                      setEditingCustomerId(client.id)
                    }}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-2"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(client.id)}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center space-x-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Excluir</span>
                  </button>
                </div>
                
                {/* Contracts Section */}
                <AnimatePresence>
                  {expandedClients.includes(client.id) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                          <FileText className="h-5 w-5 mr-2 text-blue-500" />
                          Contratos
                        </h3>
                        <button
                          onClick={() => {
                            setSelectedClient(client)
                            setShowContractModal(true)
                          }}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-1 text-sm"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Novo Contrato</span>
                        </button>
                      </div>
                      
                      {contracts.filter(c => c.customer_id === client.id).length > 0 ? (
                        <div className="space-y-3">
                          {contracts.filter(c => c.customer_id === client.id).map((contract) => (
                            <div key={contract.id} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h4 className="font-medium text-gray-900">{contract.title}</h4>
                                  <p className="text-sm text-gray-600">{contract.contract_number}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getContractStatusColor(contract.status)}`}>
                                  {getContractStatusText(contract.status)}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 text-sm">
                                <div>
                                  <span className="text-gray-500">Tipo:</span>
                                  <p className="font-medium">{getContractTypeText(contract.contract_type)}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Frequência:</span>
                                  <p className="font-medium">{getFrequencyText(contract.frequency)}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Valor:</span>
                                  <p className="font-medium text-green-600">R$ {contract.value.toFixed(2)}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Vigência:</span>
                                  <p className="font-medium">
                                    {new Date(contract.start_date).toLocaleDateString('pt-BR')} - {new Date(contract.end_date).toLocaleDateString('pt-BR')}
                                  </p>
                                </div>
                                {contract.next_service_date && (
                                  <div>
                                    <span className="text-gray-500">Próximo Serviço:</span>
                                    <p className="font-medium">{new Date(contract.next_service_date).toLocaleDateString('pt-BR')}</p>
                                  </div>
                                )}
                                {contract.sla_response_time && (
                                  <div>
                                    <span className="text-gray-500">SLA Resposta:</span>
                                    <p className="font-medium">{contract.sla_response_time}h</p>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => setEditingContract(contract)}
                                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-1 text-sm"
                                >
                                  <Edit className="h-3 w-3" />
                                  <span>Editar</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteContract(contract.id)}
                                  className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center space-x-1 text-sm"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  <span>Excluir</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
                          <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-600 text-sm">Nenhum contrato cadastrado</p>
                          <button
                            onClick={() => {
                              setSelectedClient(client)
                              setShowContractModal(true)
                            }}
                            className="mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                          >
                            Criar Primeiro Contrato
                          </button>
                        </div>
                      )}

                      {/* Service Orders Section */}
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-3">
                          <ClipboardList className="h-5 w-5 mr-2 text-green-500" />
                          Histórico de Serviços
                        </h3>

                        {serviceOrders.filter((so: any) => so.customer_id === client.id).length > 0 ? (
                          <div className="space-y-2">
                            {serviceOrders.filter((so: any) => so.customer_id === client.id).slice(0, 5).map((order: any) => (
                              <div
                                key={order.id}
                                className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors cursor-pointer"
                                onClick={() => navigate(`/ordens-servico/${order.id}`)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium text-gray-900">{order.order_number}</span>
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getServiceOrderStatusColor(order.status)}`}>
                                        {getServiceOrderStatusText(order.status)}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600 line-clamp-1">{order.description || 'Sem descrição'}</p>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {order.opened_at ? new Date(order.opened_at).toLocaleDateString('pt-BR') : 'N/A'}
                                      </span>
                                      {order.total_value && (
                                        <span className="flex items-center gap-1">
                                          <DollarSign className="h-3 w-3" />
                                          R$ {order.total_value.toFixed(2)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <ArrowRight className="h-4 w-4 text-gray-400" />
                                </div>
                              </div>
                            ))}
                            {serviceOrders.filter((so: any) => so.customer_id === client.id).length > 5 && (
                              <button
                                onClick={() => navigate('/ordens-servico')}
                                className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                              >
                                Ver todas as {serviceOrders.filter((so: any) => so.customer_id === client.id).length} ordens de serviço
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-4 bg-gray-50 rounded-lg border border-gray-200">
                            <ClipboardList className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-600 text-sm">Nenhuma ordem de serviço realizada</p>
                          </div>
                        )}
                      </div>

                      {/* Equipments Section */}
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-3">
                          <Package className="h-5 w-5 mr-2 text-purple-500" />
                          Equipamentos
                        </h3>

                        {equipments.filter((eq: any) => eq.customer_id === client.id).length > 0 ? (
                          <div className="space-y-2">
                            {equipments.filter((eq: any) => eq.customer_id === client.id).map((equipment: any) => (
                              <div key={equipment.id} className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-gray-900">{equipment.equipment_name || 'Equipamento'}</h4>
                                    <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-600">
                                      {equipment.brand && (
                                        <div>
                                          <span className="text-gray-500">Marca:</span> {equipment.brand}
                                        </div>
                                      )}
                                      {equipment.model && (
                                        <div>
                                          <span className="text-gray-500">Modelo:</span> {equipment.model}
                                        </div>
                                      )}
                                      {equipment.serial_number && (
                                        <div>
                                          <span className="text-gray-500">Série:</span> {equipment.serial_number}
                                        </div>
                                      )}
                                      {equipment.installation_date && (
                                        <div>
                                          <span className="text-gray-500">Instalado em:</span> {new Date(equipment.installation_date).toLocaleDateString('pt-BR')}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 bg-gray-50 rounded-lg border border-gray-200">
                            <Package className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-600 text-sm">Nenhum equipamento cadastrado</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          ) : (
            <div className="bg-white rounded-xl p-10 shadow-md border border-gray-100 text-center">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum cliente encontrado</h3>
              <p className="text-gray-600 mb-6">Não encontramos clientes com os filtros selecionados.</p>
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedType('all')
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Limpar filtros
              </button>
            </div>
          )}

          {/* Pagination Controls */}
          {filteredClients.length > 0 && totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Anterior
              </button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg ${
                      currentPage === page
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Próxima
              </button>

              <span className="ml-4 text-sm text-gray-600">
                Mostrando {startIndex + 1}-{Math.min(endIndex, filteredClients.length)} de {filteredClients.length} clientes
              </span>
            </div>
          )}
        </div>
      )}

      {/* Customer Modal - New and Edit */}
      <CustomerModal
        isOpen={showAddModal || editingClient !== null}
        onClose={() => {
          setShowAddModal(false)
          setEditingClient(null)
          setEditingCustomerId(undefined)
        }}
        onSave={() => {
          loadClients()
          setShowAddModal(false)
          setEditingClient(null)
          setEditingCustomerId(undefined)
        }}
        customerId={editingCustomerId}
      />

      {/* Add Client Modal OLD - REMOVIDO */}
      <AnimatePresence>
        {false && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white rounded-xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Novo Cliente</h2>
                <button onClick={() => setShowAddModal(false)}>
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={newClient.name}
                    onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nome do cliente"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Cliente
                  </label>
                  <select
                    value={newClient.client_type}
                    onChange={(e) => setNewClient({...newClient, client_type: e.target.value as 'PF' | 'PJ'})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="PF">Pessoa Física</option>
                    <option value="PJ">Pessoa Jurídica</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {newClient.client_type === 'PF' ? 'CPF' : 'CNPJ'}
                  </label>
                  <input
                    type="text"
                    value={newClient.document}
                    onChange={(e) => setNewClient({...newClient, document: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={newClient.client_type === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={newClient.phone}
                    onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Endereço
                  </label>
                  <textarea
                    value={newClient.address}
                    onChange={(e) => setNewClient({...newClient, address: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Endereço completo"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddClient}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg"
                >
                  <Save className="h-4 w-4 mr-2 inline" />
                  Salvar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Client Modal OLD - REMOVIDO */}
      <AnimatePresence>
        {false && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingClient(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white rounded-xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Editar Cliente</h2>
                <button onClick={() => setEditingClient(null)}>
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={editingClient.name}
                    onChange={(e) => setEditingClient({...editingClient, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Cliente
                  </label>
                  <select
                    value={editingClient.client_type}
                    onChange={(e) => setEditingClient({...editingClient, client_type: e.target.value as 'PF' | 'PJ'})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="PF">Pessoa Física</option>
                    <option value="PJ">Pessoa Jurídica</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {editingClient.client_type === 'PF' ? 'CPF' : 'CNPJ'}
                  </label>
                  <input
                    type="text"
                    value={editingClient.document || ''}
                    onChange={(e) => setEditingClient({...editingClient, document: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={editingClient.phone}
                    onChange={(e) => setEditingClient({...editingClient, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editingClient.email || ''}
                    onChange={(e) => setEditingClient({...editingClient, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Endereço
                  </label>
                  <textarea
                    value={editingClient.address}
                    onChange={(e) => setEditingClient({...editingClient, address: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setEditingClient(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateClient}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg"
                >
                  <Save className="h-4 w-4 mr-2 inline" />
                  Salvar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white rounded-xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center space-x-4 mb-4 text-red-600">
                <AlertTriangle className="h-8 w-8" />
                <h3 className="text-xl font-bold">Confirmar Exclusão</h3>
              </div>
              
              <p className="text-gray-700 mb-6">
                Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteClient(showDeleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Contract Modal */}
      <AnimatePresence>
        {showContractModal && selectedClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowContractModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white rounded-xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Novo Contrato</h2>
                <button onClick={() => setShowContractModal(false)}>
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Client Info */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Cliente Selecionado</h3>
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      selectedClient.client_type === 'PF' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {selectedClient.client_type === 'PF' ? <User className="h-5 w-5" /> : <Building className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{selectedClient.name}</p>
                      <p className="text-sm text-gray-600">{selectedClient.client_type} - {selectedClient.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Contract Basic Info */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Informações do Contrato</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Título do Contrato
                      </label>
                      <input
                        type="text"
                        value={newContract.title}
                        onChange={(e) => setNewContract({...newContract, title: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ex: Contrato de Manutenção Preventiva"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Contrato
                      </label>
                      <select
                        value={newContract.contract_type}
                        onChange={(e) => setNewContract({...newContract, contract_type: e.target.value as any})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="maintenance">Manutenção</option>
                        <option value="support">Suporte</option>
                        <option value="service">Serviço</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Frequência
                      </label>
                      <select
                        value={newContract.frequency}
                        onChange={(e) => setNewContract({...newContract, frequency: e.target.value as any})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="monthly">Mensal</option>
                        <option value="quarterly">Trimestral</option>
                        <option value="biannual">Semestral</option>
                        <option value="annual">Anual</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data de Início
                      </label>
                      <input
                        type="date"
                        value={newContract.start_date}
                        onChange={(e) => setNewContract({...newContract, start_date: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data de Término
                      </label>
                      <input
                        type="date"
                        value={newContract.end_date}
                        onChange={(e) => setNewContract({...newContract, end_date: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor do Contrato (R$)
                      </label>
                      <input
                        type="number"
                        value={newContract.value}
                        onChange={(e) => setNewContract({...newContract, value: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Próximo Serviço
                      </label>
                      <input
                        type="date"
                        value={newContract.next_service_date}
                        onChange={(e) => setNewContract({...newContract, next_service_date: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* SLA Configuration */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-blue-500" />
                    Configuração de SLA
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tempo de Resposta (horas)
                      </label>
                      <input
                        type="number"
                        value={newContract.sla_response_time}
                        onChange={(e) => setNewContract({...newContract, sla_response_time: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tempo de Resolução (horas)
                      </label>
                      <input
                        type="number"
                        value={newContract.sla_resolution_time}
                        onChange={(e) => setNewContract({...newContract, sla_resolution_time: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Disponibilidade (%)
                      </label>
                      <input
                        type="number"
                        value={newContract.sla_availability}
                        onChange={(e) => setNewContract({...newContract, sla_availability: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>
                  </div>
                </div>

                {/* Terms and Notes */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Termos e Observações</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Termos e Condições
                      </label>
                      <textarea
                        value={newContract.terms_and_conditions}
                        onChange={(e) => setNewContract({...newContract, terms_and_conditions: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={4}
                        placeholder="Descreva os termos e condições do contrato..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Observações
                      </label>
                      <textarea
                        value={newContract.notes}
                        onChange={(e) => setNewContract({...newContract, notes: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        placeholder="Observações adicionais..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowContractModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateContract}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg"
                >
                  <Save className="h-4 w-4 mr-2 inline" />
                  Criar Contrato
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Contract Modal */}
      <AnimatePresence>
        {editingContract && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingContract(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white rounded-xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Editar Contrato</h2>
                <button onClick={() => setEditingContract(null)}>
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Contract Basic Info */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Informações do Contrato</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Título do Contrato
                      </label>
                      <input
                        type="text"
                        value={editingContract.title}
                        onChange={(e) => setEditingContract({...editingContract, title: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Contrato
                      </label>
                      <select
                        value={editingContract.contract_type}
                        onChange={(e) => setEditingContract({...editingContract, contract_type: e.target.value as any})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="maintenance">Manutenção</option>
                        <option value="support">Suporte</option>
                        <option value="service">Serviço</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={editingContract.status}
                        onChange={(e) => setEditingContract({...editingContract, status: e.target.value as any})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="active">Ativo</option>
                        <option value="suspended">Suspenso</option>
                        <option value="cancelled">Cancelado</option>
                        <option value="expired">Expirado</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Frequência
                      </label>
                      <select
                        value={editingContract.frequency}
                        onChange={(e) => setEditingContract({...editingContract, frequency: e.target.value as any})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="monthly">Mensal</option>
                        <option value="quarterly">Trimestral</option>
                        <option value="biannual">Semestral</option>
                        <option value="annual">Anual</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor do Contrato (R$)
                      </label>
                      <input
                        type="number"
                        value={editingContract.value}
                        onChange={(e) => setEditingContract({...editingContract, value: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                {/* SLA Configuration */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-blue-500" />
                    Configuração de SLA
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tempo de Resposta (horas)
                      </label>
                      <input
                        type="number"
                        value={editingContract.sla_response_time || 0}
                        onChange={(e) => setEditingContract({...editingContract, sla_response_time: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tempo de Resolução (horas)
                      </label>
                      <input
                        type="number"
                        value={editingContract.sla_resolution_time || 0}
                        onChange={(e) => setEditingContract({...editingContract, sla_resolution_time: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Disponibilidade (%)
                      </label>
                      <input
                        type="number"
                        value={editingContract.sla_availability || 0}
                        onChange={(e) => setEditingContract({...editingContract, sla_availability: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>
                  </div>
                </div>

                {/* Terms and Notes */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Termos e Observações</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Termos e Condições
                      </label>
                      <textarea
                        value={editingContract.terms_and_conditions || ''}
                        onChange={(e) => setEditingContract({...editingContract, terms_and_conditions: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={4}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Observações
                      </label>
                      <textarea
                        value={editingContract.notes || ''}
                        onChange={(e) => setEditingContract({...editingContract, notes: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setEditingContract(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateContract}
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

export default ClientManagement