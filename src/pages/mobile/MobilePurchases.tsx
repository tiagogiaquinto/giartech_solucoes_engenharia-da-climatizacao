import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart,
  Package,
  Wrench,
  Plus,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
  Search,
  DollarSign
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../contexts/UserContext'
import { useToast } from '../../hooks/useToast'

const MobilePurchases = () => {
  const navigate = useNavigate()
  const { user } = useUser()
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<'new' | 'materials' | 'tools' | 'history'>('new')
  const [requests, setRequests] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [tools, setTools] = useState<any[]>([])
  const [vehicleInventory, setVehicleInventory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Nova solicitação
  const [requestType, setRequestType] = useState<'materials' | 'tools' | 'both'>('materials')
  const [urgency, setUrgency] = useState<'normal' | 'high' | 'urgent'>('normal')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedItems, setSelectedItems] = useState<any[]>([])
  const [showItemPicker, setShowItemPicker] = useState(false)

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    if (!user?.employee_id) return

    try {
      setLoading(true)

      // Buscar solicitações do técnico
      const { data: requestsData } = await supabase
        .from('purchase_requests')
        .select(`
          *,
          purchase_request_items (*)
        `)
        .eq('requester_id', user.employee_id)
        .order('created_at', { ascending: false })

      // Buscar materiais disponíveis
      const { data: materialsData } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('active', true)
        .order('name')

      // Buscar ferramentas especiais
      const { data: toolsData } = await supabase
        .from('special_tools_catalog')
        .select('*')
        .eq('active', true)
        .order('name')

      // Buscar inventário do veículo
      const { data: inventoryData } = await supabase
        .from('technician_vehicle_inventory')
        .select(`
          *,
          inventory_items (name, unit, sku)
        `)
        .eq('employee_id', user.employee_id)

      setRequests(requestsData || [])
      setMaterials(materialsData || [])
      setTools(toolsData || [])
      setVehicleInventory(inventoryData || [])

    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const addItemToRequest = (item: any, type: 'material' | 'tool') => {
    const newItem = {
      id: Math.random().toString(),
      type,
      item_id: item.id,
      name: item.name,
      quantity: 1,
      unit: item.unit || 'un',
      estimated_price: type === 'material' ? item.purchase_price : item.is_rental ? item.rental_price_daily : item.purchase_price,
      urgency_reason: ''
    }
    setSelectedItems([...selectedItems, newItem])
    setShowItemPicker(false)
  }

  const removeItem = (id: string) => {
    setSelectedItems(selectedItems.filter(item => item.id !== id))
  }

  const updateItemQuantity = (id: string, quantity: number) => {
    setSelectedItems(selectedItems.map(item =>
      item.id === id ? { ...item, quantity } : item
    ))
  }

  const submitRequest = async () => {
    if (selectedItems.length === 0) {
      showToast('Adicione ao menos um item', 'error')
      return
    }

    try {
      const items = selectedItems.map(item => ({
        item_type: item.type,
        material_id: item.type === 'material' ? item.item_id : null,
        tool_id: item.type === 'tool' ? item.item_id : null,
        custom_description: item.name,
        quantity: item.quantity,
        unit: item.unit,
        estimated_unit_price: item.estimated_price,
        urgency_reason: item.urgency_reason
      }))

      const { data, error } = await supabase.rpc('create_purchase_request_mobile', {
        p_requester_id: user.employee_id,
        p_request_type: requestType,
        p_urgency: urgency,
        p_reason: reason,
        p_notes: notes,
        p_items: items
      })

      if (error) throw error

      showToast('Solicitação enviada com sucesso!', 'success')

      // Limpar formulário
      setSelectedItems([])
      setReason('')
      setNotes('')
      setUrgency('normal')
      setActiveTab('history')
      loadData()

    } catch (err: any) {
      console.error('Error submitting request:', err)
      showToast(err.message || 'Erro ao enviar solicitação', 'error')
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500',
      approved: 'bg-blue-500',
      in_purchase: 'bg-purple-500',
      purchased: 'bg-green-500',
      delivered: 'bg-green-600',
      cancelled: 'bg-red-500'
    }
    return colors[status] || 'bg-gray-500'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      approved: 'Aprovada',
      in_purchase: 'Em Compra',
      purchased: 'Comprada',
      delivered: 'Entregue',
      cancelled: 'Cancelada'
    }
    return labels[status] || status
  }

  const getStatusIcon = (status: string) => {
    if (status === 'delivered') return <CheckCircle className="w-5 h-5" />
    if (status === 'cancelled') return <XCircle className="w-5 h-5" />
    if (status === 'pending') return <Clock className="w-5 h-5" />
    return <AlertCircle className="w-5 h-5" />
  }

  const filteredMaterials = materials.filter(m =>
    m.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredTools = tools.filter(t =>
    t.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Carregando compras...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Solicitações de Compra</h1>
        <ShoppingCart className="w-6 h-6 text-blue-600" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setActiveTab('new')}
          className={`flex-shrink-0 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
            activeTab === 'new'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-white text-gray-600 border-2 border-gray-200'
          }`}
        >
          <Plus className="w-4 h-4 inline mr-1" />
          Nova Solicitação
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`flex-shrink-0 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
            activeTab === 'materials'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-white text-gray-600 border-2 border-gray-200'
          }`}
        >
          <Package className="w-4 h-4 inline mr-1" />
          Meu Estoque
        </button>
        <button
          onClick={() => setActiveTab('tools')}
          className={`flex-shrink-0 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
            activeTab === 'tools'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-white text-gray-600 border-2 border-gray-200'
          }`}
        >
          <Wrench className="w-4 h-4 inline mr-1" />
          Ferramentas
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-shrink-0 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
            activeTab === 'history'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-white text-gray-600 border-2 border-gray-200'
          }`}
        >
          <Clock className="w-4 h-4 inline mr-1" />
          Histórico ({requests.length})
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {/* Nova Solicitação */}
        {activeTab === 'new' && (
          <motion.div
            key="new"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="bg-white rounded-2xl p-5 shadow-lg">
              <h3 className="font-bold text-gray-900 mb-4">Criar Nova Solicitação</h3>

              {/* Tipo */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  O que você precisa?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['materials', 'tools', 'both'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setRequestType(type as any)}
                      className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                        requestType === type
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {type === 'materials' && <Package className="w-4 h-4 inline mr-1" />}
                      {type === 'tools' && <Wrench className="w-4 h-4 inline mr-1" />}
                      {type === 'both' && <ShoppingCart className="w-4 h-4 inline mr-1" />}
                      {type === 'materials' ? 'Materiais' : type === 'tools' ? 'Ferramentas' : 'Ambos'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Urgência */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Urgência
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-700' },
                    { value: 'high', label: 'Alta', color: 'bg-orange-100 text-orange-700' },
                    { value: 'urgent', label: 'Urgente', color: 'bg-red-100 text-red-700' }
                  ].map((u) => (
                    <button
                      key={u.value}
                      onClick={() => setUrgency(u.value as any)}
                      className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                        urgency === u.value
                          ? u.color
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Motivo */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo da solicitação
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex: Material em falta, ferramenta necessária para obra..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Observações */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Informações adicionais..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Itens Selecionados */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Itens ({selectedItems.length})
                  </label>
                  <button
                    onClick={() => setShowItemPicker(true)}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm font-semibold"
                  >
                    <Plus className="w-4 h-4 inline mr-1" />
                    Adicionar
                  </button>
                </div>

                {selectedItems.length === 0 ? (
                  <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Nenhum item adicionado</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedItems.map(item => (
                      <div key={item.id} className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-500">{item.type === 'material' ? '📦 Material' : '🔧 Ferramenta'}</p>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItemQuantity(item.id, parseFloat(e.target.value) || 1)}
                            min="1"
                            step="0.01"
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                          />
                          <span className="text-sm text-gray-600">{item.unit}</span>
                          {item.estimated_price && (
                            <span className="ml-auto text-sm font-semibold text-green-600">
                              R$ {(item.quantity * item.estimated_price).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="bg-blue-50 rounded-xl p-3 flex items-center justify-between">
                      <span className="font-semibold text-blue-900">Total Estimado</span>
                      <span className="text-xl font-bold text-blue-600">
                        R$ {selectedItems.reduce((sum, item) => sum + (item.quantity * (item.estimated_price || 0)), 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Enviar */}
              <button
                onClick={submitRequest}
                disabled={selectedItems.length === 0}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-2xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Enviar Solicitação
              </button>
            </div>
          </motion.div>
        )}

        {/* Meu Estoque */}
        {activeTab === 'materials' && (
          <motion.div
            key="materials"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-3"
          >
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl p-5">
              <h3 className="font-bold text-blue-900 mb-2">Inventário do Veículo</h3>
              <p className="text-sm text-blue-700">Materiais disponíveis no seu carro</p>
            </div>

            {vehicleInventory.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
                <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Estoque vazio</h3>
                <p className="text-gray-600">Configure seu inventário no sistema</p>
              </div>
            ) : (
              vehicleInventory.map(inv => {
                const percentage = (inv.current_quantity / inv.max_quantity) * 100
                const isLow = inv.current_quantity <= inv.min_quantity

                return (
                  <div key={inv.id} className="bg-white rounded-2xl p-5 shadow-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">{inv.inventory_items?.name}</p>
                        <p className="text-sm text-gray-500">{inv.inventory_items?.sku}</p>
                      </div>
                      {isLow && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold">
                          🔴 Baixo
                        </span>
                      )}
                    </div>

                    <div className="mb-2">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Quantidade</span>
                        <span>
                          {inv.current_quantity} / {inv.max_quantity} {inv.unit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            isLow ? 'bg-red-500' : percentage > 50 ? 'bg-green-500' : 'bg-yellow-500'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    {inv.location_in_vehicle && (
                      <p className="text-xs text-gray-500 mt-2">
                        📍 {inv.location_in_vehicle}
                      </p>
                    )}
                  </div>
                )
              })
            )}
          </motion.div>
        )}

        {/* Ferramentas */}
        {activeTab === 'tools' && (
          <motion.div
            key="tools"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-3"
          >
            <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl p-5">
              <h3 className="font-bold text-orange-900 mb-2">Ferramentas Especiais</h3>
              <p className="text-sm text-orange-700">Disponíveis para locação/compra</p>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar ferramentas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-orange-500"
              />
            </div>

            {filteredTools.map(tool => (
              <div key={tool.id} className="bg-white rounded-2xl p-5 shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                    🔧
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{tool.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{tool.description}</p>

                    <div className="flex items-center gap-4 mt-3">
                      {tool.is_rental && (
                        <div className="text-sm">
                          <span className="text-gray-500">Diária:</span>
                          <span className="font-bold text-green-600 ml-1">
                            R$ {tool.rental_price_daily?.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {tool.available > 0 ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">
                          ✅ {tool.available} disponível(is)
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">
                          ❌ Indisponível
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Histórico */}
        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-3"
          >
            {requests.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
                <Clock className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhuma solicitação</h3>
                <p className="text-gray-600">Suas solicitações aparecerão aqui</p>
              </div>
            ) : (
              requests.map(request => (
                <div key={request.id} className="bg-white rounded-2xl p-5 shadow-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-gray-900">{request.request_number}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1 ${
                          getStatusColor(request.status)
                        }`}>
                          {getStatusIcon(request.status)}
                          {getStatusLabel(request.status)}
                        </span>
                      </div>
                      {request.reason && (
                        <p className="text-sm text-gray-600">{request.reason}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Itens:</span>
                      <span className="font-semibold">{request.purchase_request_items?.length || 0}</span>
                    </div>
                    {request.estimated_total && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Valor estimado:</span>
                        <span className="font-bold text-green-600">
                          R$ {request.estimated_total.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Data:</span>
                      <span>{new Date(request.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>

                  {request.approval_notes && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                      <p className="text-sm text-blue-900">
                        <span className="font-semibold">Observação:</span> {request.approval_notes}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Item Picker Modal */}
      {showItemPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="bg-white rounded-t-3xl w-full max-h-[80vh] overflow-hidden flex flex-col"
          >
            <div className="p-5 border-b">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Adicionar Item</h3>
                <button
                  onClick={() => setShowItemPicker(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setRequestType('materials')}
                  className={`flex-1 px-4 py-2 rounded-xl font-semibold text-sm ${
                    requestType === 'materials'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Materiais
                </button>
                <button
                  onClick={() => setRequestType('tools')}
                  className={`flex-1 px-4 py-2 rounded-xl font-semibold text-sm ${
                    requestType === 'tools'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Ferramentas
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-2">
              {requestType === 'materials' ? (
                filteredMaterials.map(material => (
                  <button
                    key={material.id}
                    onClick={() => addItemToRequest(material, 'material')}
                    className="w-full bg-gray-50 hover:bg-blue-50 rounded-xl p-4 text-left transition-colors"
                  >
                    <p className="font-semibold text-gray-900">{material.name}</p>
                    <p className="text-sm text-gray-500">{material.sku}</p>
                    {material.purchase_price && (
                      <p className="text-sm text-green-600 font-semibold mt-1">
                        R$ {material.purchase_price.toFixed(2)} / {material.unit}
                      </p>
                    )}
                  </button>
                ))
              ) : (
                filteredTools.map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => addItemToRequest(tool, 'tool')}
                    className="w-full bg-gray-50 hover:bg-orange-50 rounded-xl p-4 text-left transition-colors"
                  >
                    <p className="font-semibold text-gray-900">{tool.name}</p>
                    <p className="text-sm text-gray-500">{tool.description}</p>
                    {tool.is_rental && (
                      <p className="text-sm text-green-600 font-semibold mt-1">
                        R$ {tool.rental_price_daily?.toFixed(2)} / dia
                      </p>
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default MobilePurchases
