import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FileText, Plus, Search, ListFilter as Filter, Package, ArrowRight, Clock, CreditCard as Edit, Trash2, Eye, Save, X, DollarSign, TriangleAlert as AlertTriangle, Copy } from 'lucide-react'
import { useUser } from '../contexts/UserContext'
import {
  getServiceCatalog,
  createServiceCatalogItem,
  updateServiceCatalogItem,
  deleteServiceCatalogItem,
  type ServiceCatalogItem
} from '../lib/supabase'
import ServiceCatalogModal from '../components/ServiceCatalogModal'

const ServiceCatalog = () => {
  const { isAdmin } = useUser()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [services, setServices] = useState<ServiceCatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingService, setEditingService] = useState<ServiceCatalogItem | null>(null)
  const [editingServiceId, setEditingServiceId] = useState<string | undefined>(undefined)
  const [duplicateServiceId, setDuplicateServiceId] = useState<string | undefined>(undefined)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const [newService, setNewService] = useState({
    name: '',
    category: '',
    description: '',
    estimated_time: '',
    base_price: 0,
    materials: [] as Array<{ name: string; quantity: number }>,
    instructions: [] as string[]
  })

  // Load services from database
  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    try {
      setLoading(true)
      const data = await getServiceCatalog()
      setServices(data || [])
      setError(null)
    } catch (err) {
      console.error('Error loading services:', err)
      setError('Erro ao carregar catálogo de serviços')
    } finally {
      setLoading(false)
    }
  }

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(services.map(item => item.category)))]

  // Filter services
  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleAddService = async () => {
    if (!newService.name || !newService.category) {
      alert('Por favor, preencha todos os campos obrigatórios')
      return
    }

    try {
      const serviceData = {
        name: newService.name,
        category: newService.category,
        description: newService.description,
        estimated_time: newService.estimated_time,
        base_price: newService.base_price,
        materials: newService.materials,
        instructions: newService.instructions,
        is_active: true
      }
      
      const createdService = await createServiceCatalogItem(serviceData)
      setServices([...services, createdService])
      
      // Reset form
      setNewService({
        name: '',
        category: '',
        description: '',
        estimated_time: '',
        base_price: 0,
        materials: [],
        instructions: []
      })
      setShowAddModal(false)
      alert('Serviço adicionado com sucesso!')
    } catch (error) {
      console.error('Error creating service:', error)
      alert('Erro ao adicionar serviço')
    }
  }

  const handleUpdateService = async () => {
    if (!editingService) return

    try {
      const updates = {
        name: editingService.name,
        category: editingService.category,
        description: editingService.description,
        estimated_time: editingService.estimated_time,
        base_price: editingService.base_price,
        materials: editingService.materials,
        instructions: editingService.instructions,
        is_active: editingService.is_active
      }
      
      const updatedService = await updateServiceCatalogItem(editingService.id, updates)
      setServices(services.map(service => 
        service.id === updatedService.id ? updatedService : service
      ))
      
      setEditingService(null)
      alert('Serviço atualizado com sucesso!')
    } catch (error) {
      console.error('Error updating service:', error)
      alert('Erro ao atualizar serviço')
    }
  }

  const handleDeleteService = async (id: string) => {
    try {
      await deleteServiceCatalogItem(id)
      setServices(services.filter(service => service.id !== id))
      setShowDeleteConfirm(null)
      alert('Serviço excluído com sucesso!')
    } catch (error) {
      console.error('Error deleting service:', error)
      alert('Erro ao excluir serviço')
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

      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Catálogo de Serviços</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:shadow-lg transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Serviço</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar por nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'Todas as Categorias' : category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Services List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Carregando serviços...</span>
        </div>
      ) : (
      <div className="space-y-4">
        {filteredServices.length > 0 ? (
          filteredServices.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-xl transition-all duration-200 cursor-pointer"
              onClick={() => setEditingService(service)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                    <p className="text-sm text-gray-600">{service.category}</p>
                  </div>
                </div>
                {isAdmin && (
                  <div className="text-lg font-bold text-green-600">
                    R$ {service.base_price.toFixed(2)}
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-700 mb-4 line-clamp-2">{service.description || 'Sem descrição'}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <Package className="h-4 w-4 text-gray-400" />
                    <span>{service.materials?.length || 0} materiais</span>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{service.estimated_time || 'Não definido'}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingService(service)
                      setEditingServiceId(service.id)
                    }}
                    className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                    title="Editar serviço"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDuplicateServiceId(service.id)
                    }}
                    className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                    title="Duplicar serviço"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowDeleteConfirm(service.id)
                    }}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                    title="Excluir serviço"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="bg-white rounded-xl p-10 shadow-md border border-gray-100 text-center">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum serviço encontrado</h3>
            <p className="text-gray-600 mb-6">Não encontramos serviços com os filtros selecionados.</p>
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('all')
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>
      )}

      {/* Add Service Modal */}
      <AnimatePresence>
        {showAddModal && (
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
              className="relative bg-white rounded-xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Novo Serviço</h2>
                <button onClick={() => setShowAddModal(false)}>
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome do Serviço
                    </label>
                    <input
                      type="text"
                      value={newService.name}
                      onChange={(e) => setNewService({...newService, name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nome do serviço"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoria
                    </label>
                    <input
                      type="text"
                      value={newService.category}
                      onChange={(e) => setNewService({...newService, category: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Instalação, Manutenção"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tempo Estimado
                    </label>
                    <input
                      type="text"
                      value={newService.estimated_time}
                      onChange={(e) => setNewService({...newService, estimated_time: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: 2 horas"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço Base (R$)
                    </label>
                    <input
                      type="number"
                      value={newService.base_price}
                      onChange={(e) => setNewService({...newService, base_price: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição
                    </label>
                    <textarea
                      value={newService.description}
                      onChange={(e) => setNewService({...newService, description: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Descrição detalhada do serviço"
                    />
                  </div>
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
                  onClick={handleAddService}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg"
                >
                  <Save className="h-4 w-4 mr-2 inline" />
                  Salvar Serviço
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Service Modal */}
      <AnimatePresence>
        {editingService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingService(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white rounded-xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Editar Serviço</h2>
                <button onClick={() => setEditingService(null)}>
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome do Serviço
                    </label>
                    <input
                      type="text"
                      value={editingService.name}
                      onChange={(e) => setEditingService({...editingService, name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoria
                    </label>
                    <input
                      type="text"
                      value={editingService.category}
                      onChange={(e) => setEditingService({...editingService, category: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tempo Estimado
                    </label>
                    <input
                      type="text"
                      value={editingService.estimated_time || ''}
                      onChange={(e) => setEditingService({...editingService, estimated_time: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço Base (R$)
                    </label>
                    <input
                      type="number"
                      value={editingService.base_price}
                      onChange={(e) => setEditingService({...editingService, base_price: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição
                    </label>
                    <textarea
                      value={editingService.description || ''}
                      onChange={(e) => setEditingService({...editingService, description: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Materials */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Materiais Necessários</h3>
                  {editingService.materials && editingService.materials.length > 0 ? (
                    <div className="space-y-2">
                      {editingService.materials.map((material, index) => (
                        <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                          <Package className="h-4 w-4 text-gray-400" />
                          <span className="flex-1 text-sm">{material.name}</span>
                          <span className="text-sm text-gray-600">Qtd: {material.quantity}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Nenhum material definido</p>
                  )}
                </div>

                {/* Instructions */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Instruções</h3>
                  {editingService.instructions && editingService.instructions.length > 0 ? (
                    <ol className="list-decimal list-inside space-y-1">
                      {editingService.instructions.map((instruction, index) => (
                        <li key={index} className="text-sm text-gray-700">{instruction}</li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-sm text-gray-500">Nenhuma instrução definida</p>
                  )}
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setEditingService(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateService}
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
                Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteService(showDeleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Completo de Catálogo de Serviços */}
      <ServiceCatalogModal
        isOpen={showAddModal || editingService !== null || duplicateServiceId !== undefined}
        onClose={() => {
          setShowAddModal(false)
          setEditingService(null)
          setEditingServiceId(undefined)
          setDuplicateServiceId(undefined)
        }}
        onSave={() => {
          loadServices()
          setShowAddModal(false)
          setEditingService(null)
          setEditingServiceId(undefined)
          setDuplicateServiceId(undefined)
        }}
        serviceId={editingServiceId}
        duplicateFromId={duplicateServiceId}
      />
    </div>
  )
}

export default ServiceCatalog