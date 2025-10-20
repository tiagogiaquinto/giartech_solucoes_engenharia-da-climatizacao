import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Save, Package, DollarSign, Clock, FileText, Search, X } from 'lucide-react'
import { getServiceOrderItems, createServiceOrderItem, updateServiceOrderItem, deleteServiceOrderItem, type ServiceOrderItem } from '../lib/database-services'
import { supabase } from '../lib/supabase'

interface ServiceOrderItemsManagerProps {
  serviceOrderId: string
  onUpdate?: () => void
}

interface ServiceCatalog {
  id: string
  name: string
  base_price: number
  estimated_duration: number
}

const ServiceOrderItemsManager = ({ serviceOrderId, onUpdate }: ServiceOrderItemsManagerProps) => {
  const [items, setItems] = useState<ServiceOrderItem[]>([])
  const [catalog, setCatalog] = useState<ServiceCatalog[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [serviceSearch, setServiceSearch] = useState('')
  const [showSaveToCatalogModal, setShowSaveToCatalogModal] = useState(false)
  const [catalogFormData, setCatalogFormData] = useState({
    name: '',
    description: '',
    category: '',
    base_price: 0,
    estimated_duration: 0,
    notes: ''
  })

  const [newItem, setNewItem] = useState<Partial<ServiceOrderItem>>({
    service_order_id: serviceOrderId,
    service_catalog_id: '',
    quantity: 1,
    unit_price: 0,
    total_price: 0,
    estimated_duration: 0,
    notes: '',
    difficulty_level: 1,
    difficulty_multiplier: 1.0,
    base_unit_price: 0
  })

  const getDifficultyMultiplier = (level: number): number => {
    switch (level) {
      case 1: return 1.0  // +0%
      case 2: return 1.2  // +20%
      case 3: return 1.5  // +50%
      default: return 1.0
    }
  }

  const getDifficultyLabel = (level: number): string => {
    switch (level) {
      case 1: return 'Fácil (+0%)'
      case 2: return 'Médio (+20%)'
      case 3: return 'Difícil (+50%)'
      default: return 'Fácil'
    }
  }

  const getDifficultyColor = (level: number): string => {
    switch (level) {
      case 1: return 'bg-green-100 text-green-800'
      case 2: return 'bg-yellow-100 text-yellow-800'
      case 3: return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  useEffect(() => {
    loadData()
  }, [serviceOrderId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [itemsData, catalogData] = await Promise.all([
        getServiceOrderItems(serviceOrderId),
        loadServiceCatalog()
      ])
      setItems(itemsData)
      setCatalog(catalogData)
    } catch (error) {
      console.error('Error loading items:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadServiceCatalog = async () => {
    const { data } = await supabase
      .from('service_catalog')
      .select('id, name, base_price, estimated_duration')
      .eq('active', true)
      .order('name')
    return data || []
  }

  const handleServiceSelect = (catalogId: string) => {
    const selected = catalog.find(s => s.id === catalogId)
    if (selected) {
      const quantity = newItem.quantity || 1
      const difficultyLevel = newItem.difficulty_level || 1
      const multiplier = getDifficultyMultiplier(difficultyLevel)
      const adjustedPrice = selected.base_price * multiplier

      setNewItem({
        ...newItem,
        service_catalog_id: catalogId,
        base_unit_price: selected.base_price,
        unit_price: adjustedPrice,
        total_price: adjustedPrice * quantity,
        estimated_duration: selected.estimated_duration,
        difficulty_multiplier: multiplier
      })
      setServiceSearch('')
    }
  }

  const filteredCatalog = catalog.filter(service =>
    service.name.toLowerCase().includes(serviceSearch.toLowerCase())
  )

  const handleDifficultyChange = (level: number) => {
    const basePrice = newItem.base_unit_price || 0
    const quantity = newItem.quantity || 1
    const multiplier = getDifficultyMultiplier(level)
    const adjustedPrice = basePrice * multiplier

    setNewItem({
      ...newItem,
      difficulty_level: level,
      difficulty_multiplier: multiplier,
      unit_price: adjustedPrice,
      total_price: adjustedPrice * quantity
    })
  }

  const handleQuantityChange = (quantity: number) => {
    const unitPrice = newItem.unit_price || 0
    setNewItem({
      ...newItem,
      quantity,
      total_price: unitPrice * quantity
    })
  }

  const handleUnitPriceChange = (unitPrice: number) => {
    const quantity = newItem.quantity || 1
    setNewItem({
      ...newItem,
      unit_price: unitPrice,
      total_price: unitPrice * quantity
    })
  }

  const handleAddItem = async () => {
    if (!newItem.service_catalog_id && !newItem.unit_price) {
      alert('Selecione um serviço do catálogo ou informe um valor manualmente')
      return
    }

    try {
      const itemToSave = {
        ...newItem,
        service_catalog_id: newItem.service_catalog_id || null
      }
      await createServiceOrderItem(itemToSave as ServiceOrderItem)
      setNewItem({
        service_order_id: serviceOrderId,
        service_catalog_id: '',
        quantity: 1,
        unit_price: 0,
        total_price: 0,
        estimated_duration: 0,
        notes: '',
        difficulty_level: 1,
        difficulty_multiplier: 1.0,
        base_unit_price: 0
      })
      await loadData()
      onUpdate?.()
      alert('Serviço adicionado com sucesso!')
    } catch (error) {
      console.error('Error adding item:', error)
      alert('Erro ao adicionar serviço. Verifique os dados.')
    }
  }

  const handleSaveToCatalog = async () => {
    if (!catalogFormData.name || !catalogFormData.base_price) {
      alert('Preencha o nome do serviço e o preço base')
      return
    }

    try {
      const { data, error } = await supabase
        .from('service_catalog')
        .insert([{
          name: catalogFormData.name,
          description: catalogFormData.description,
          category: catalogFormData.category,
          base_price: catalogFormData.base_price,
          estimated_duration: catalogFormData.estimated_duration || 60,
          active: true
        }])
        .select()

      if (error) throw error

      if (data && data[0]) {
        setNewItem({
          ...newItem,
          service_catalog_id: data[0].id,
          base_unit_price: catalogFormData.base_price
        })
        await loadServiceCatalog()
        setCatalog(await loadServiceCatalog())
      }

      setShowSaveToCatalogModal(false)
      setCatalogFormData({
        name: '',
        description: '',
        category: '',
        base_price: 0,
        estimated_duration: 0,
        notes: ''
      })
      alert('Serviço salvo no catálogo com sucesso!')
    } catch (error) {
      console.error('Error saving to catalog:', error)
      alert('Erro ao salvar no catálogo')
    }
  }

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteServiceOrderItem(id)
      await loadData()
      onUpdate?.()
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }

  const totalValue = items.reduce((sum, item) => sum + (item.total_price || 0), 0)
  const totalDuration = items.reduce((sum, item) => sum + ((item.estimated_duration || 0) * item.quantity), 0)

  if (loading) {
    return <div className="text-center py-8">Carregando itens...</div>
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-600" />
          Serviços da Ordem
        </h3>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <DollarSign className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Preço Editável</p>
              <p>
                O preço unitário pode ser editado manualmente. O sistema calcula automaticamente baseado no catálogo e dificuldade, mas você pode ajustar conforme a negociação.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2 relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔍 Buscar Serviço
              </label>
              <input
                type="text"
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                placeholder="Digite para buscar serviço..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

              {serviceSearch && filteredCatalog.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {filteredCatalog.map(service => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => handleServiceSelect(service.id)}
                      className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-0 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{service.name}</div>
                      <div className="text-sm text-gray-600 flex items-center justify-between mt-1">
                        <span className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {service.estimated_duration} min
                        </span>
                        <span className="font-semibold text-blue-600">
                          R$ {service.base_price.toFixed(2)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {serviceSearch && filteredCatalog.length === 0 && (
                <div className="absolute z-10 w-full mt-1 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                  Nenhum serviço encontrado
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantidade
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={newItem.quantity || 1}
                onChange={(e) => handleQuantityChange(parseFloat(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grau de Dificuldade
              </label>
              <select
                value={newItem.difficulty_level || 1}
                onChange={(e) => handleDifficultyChange(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>Nível 1 - Fácil (+0%)</option>
                <option value={2}>Nível 2 - Médio (+20%)</option>
                <option value={3}>Nível 3 - Difícil (+50%)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                O percentual será aplicado ao preço base do serviço
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preço Unitário (R$)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={newItem.unit_price || 0}
                onChange={(e) => handleUnitPriceChange(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Editável manualmente
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total
              </label>
              <div className="px-4 py-2 bg-blue-50 border border-blue-300 rounded-lg text-blue-900 font-bold text-lg">
                R$ {(newItem.total_price || 0).toFixed(2)}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              value={newItem.notes || ''}
              onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Observações sobre este item"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleAddItem}
              disabled={!newItem.service_catalog_id && !newItem.unit_price}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              {newItem.service_catalog_id ? 'Adicionar Serviço do Catálogo' : 'Adicionar Serviço Manual'}
            </button>

            {!newItem.service_catalog_id && newItem.unit_price > 0 && (
              <button
                onClick={() => {
                  setCatalogFormData({
                    name: '',
                    description: '',
                    category: '',
                    base_price: newItem.base_unit_price || newItem.unit_price || 0,
                    estimated_duration: newItem.estimated_duration || 60,
                    notes: newItem.notes || ''
                  })
                  setShowSaveToCatalogModal(true)
                }}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 transition-colors"
              >
                <Save className="h-5 w-5" />
                Salvar no Catálogo
              </button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSaveToCatalogModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSaveToCatalogModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
            >
              <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Save className="h-6 w-6" />
                  <div>
                    <h2 className="text-xl font-bold">Adicionar ao Catálogo de Serviços</h2>
                    <p className="text-green-100 text-sm">Configure o serviço para reutilizar em futuras ordens</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSaveToCatalogModal(false)}
                  className="p-2 hover:bg-green-800 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">
                        Nome do Serviço *
                      </label>
                      <input
                        type="text"
                        value={catalogFormData.name}
                        onChange={(e) => setCatalogFormData({...catalogFormData, name: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Ex: Instalação de Ar Condicionado Split 12.000 BTUs"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">
                        Descrição
                      </label>
                      <textarea
                        value={catalogFormData.description}
                        onChange={(e) => setCatalogFormData({...catalogFormData, description: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        rows={3}
                        placeholder="Descreva os detalhes do serviço..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Categoria
                      </label>
                      <select
                        value={catalogFormData.category}
                        onChange={(e) => setCatalogFormData({...catalogFormData, category: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">Selecione uma categoria</option>
                        <option value="Instalação">Instalação</option>
                        <option value="Manutenção">Manutenção</option>
                        <option value="Reparo">Reparo</option>
                        <option value="Preventiva">Preventiva</option>
                        <option value="Corretiva">Corretiva</option>
                        <option value="Inspeção">Inspeção</option>
                        <option value="Limpeza">Limpeza</option>
                        <option value="Revisão">Revisão</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        Tempo Estimado (minutos)
                      </label>
                      <input
                        type="number"
                        value={catalogFormData.estimated_duration}
                        onChange={(e) => setCatalogFormData({...catalogFormData, estimated_duration: Number(e.target.value)})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="60"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        Preço Base
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={catalogFormData.base_price}
                        onChange={(e) => setCatalogFormData({...catalogFormData, base_price: Number(e.target.value)})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        Dificuldade
                      </label>
                      <div className="text-sm px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                        {getDifficultyLabel(newItem.difficulty_level || 1)}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">
                        Observações
                      </label>
                      <textarea
                        value={catalogFormData.notes}
                        onChange={(e) => setCatalogFormData({...catalogFormData, notes: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        rows={2}
                        placeholder="Observações internas sobre o serviço..."
                      />
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Package className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-900 mb-1">Resumo do Serviço</p>
                        <div className="space-y-1 text-blue-800">
                          <p><strong>Preço Base:</strong> R$ {catalogFormData.base_price.toFixed(2)}</p>
                          <p><strong>Tempo Estimado:</strong> {catalogFormData.estimated_duration} minutos ({(catalogFormData.estimated_duration / 60).toFixed(1)}h)</p>
                          <p><strong>Multiplicador:</strong> {getDifficultyMultiplier(newItem.difficulty_level || 1)}x</p>
                          <p className="text-green-700 font-semibold"><strong>Preço Final:</strong> R$ {(catalogFormData.base_price * getDifficultyMultiplier(newItem.difficulty_level || 1)).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
                <button
                  onClick={() => setShowSaveToCatalogModal(false)}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveToCatalog}
                  disabled={!catalogFormData.name}
                  className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all font-medium flex items-center gap-2 shadow-lg"
                >
                  <Save className="h-4 w-4" />
                  Salvar no Catálogo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {items.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Serviço
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dificuldade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preço Unit.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duração
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <AnimatePresence>
                  {items.map((item: any) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.service_catalog?.name || 'Serviço Personalizado'}
                        </div>
                        {item.notes && (
                          <div className="text-xs text-gray-500 mt-1">{item.notes}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(item.difficulty_level || 1)}`}>
                          {getDifficultyLabel(item.difficulty_level || 1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          R$ {(item.unit_price || 0).toFixed(2)}
                        </div>
                        {item.base_unit_price && item.base_unit_price !== item.unit_price && (
                          <div className="text-xs text-gray-500">
                            Base: R$ {item.base_unit_price.toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        R$ {(item.total_price || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.estimated_duration || 0} min
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex gap-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>Duração Total: <strong>{totalDuration} min</strong></span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Package className="h-4 w-4" />
                  <span>Itens: <strong>{items.length}</strong></span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-lg font-bold text-gray-900">
                <DollarSign className="h-5 w-5" />
                <span>R$ {totalValue.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ServiceOrderItemsManager
