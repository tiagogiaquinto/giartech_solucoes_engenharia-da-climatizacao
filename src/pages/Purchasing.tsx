import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ShoppingCart, Plus, Package, AlertTriangle, TrendingUp, DollarSign, Clock, FileText, Search, Filter, Download, CheckCircle, XCircle, Eye, RefreshCw, Truck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import PurchaseScheduleModal from '../components/PurchaseScheduleModal'
import RentalScheduleModal from '../components/RentalScheduleModal'

interface PurchaseOrder {
  id: string
  order_number: string
  supplier_name: string
  status: string
  priority: string
  order_date: string
  expected_delivery_date?: string
  final_amount: number
  created_at: string
}

interface LowStockItem {
  inventory_id: string
  item_name: string
  current_stock: number
  min_stock: number
  max_stock: number
  unit_price: number
  supplier: string
  category: string
  location: string
  last_purchase_date: string
  recommended_order_qty: number
  urgency: string
  estimated_cost: number
  days_until_stockout: number
}

const Purchasing = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTab, setSelectedTab] = useState<'orders' | 'alerts' | 'schedules' | 'quotes'>('alerts')
  const [showPurchaseScheduleModal, setShowPurchaseScheduleModal] = useState(false)
  const [showRentalScheduleModal, setShowRentalScheduleModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadPurchaseOrders(),
        loadLowStockItems()
      ])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPurchaseOrders = async () => {
    const { data } = await supabase
      .from('purchase_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    setPurchaseOrders(data || [])
  }

  const loadLowStockItems = async () => {
    try {
      const { data, error } = await supabase.rpc('get_items_needing_purchase')

      if (error) throw error
      setLowStockItems(data || [])
    } catch (error) {
      console.error('Error loading low stock items:', error)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      ordered: 'bg-purple-100 text-purple-800',
      partial: 'bg-orange-100 text-orange-800',
      received: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      draft: 'Rascunho',
      pending: 'Pendente',
      approved: 'Aprovado',
      ordered: 'Pedido Feito',
      partial: 'Parcial',
      received: 'Recebido',
      cancelled: 'Cancelado'
    }
    return texts[status] || status
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'text-gray-500',
      normal: 'text-blue-500',
      high: 'text-orange-500',
      urgent: 'text-red-500'
    }
    return colors[priority] || 'text-gray-500'
  }

  const getUrgencyColor = (urgency: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-600 text-white',
      urgent: 'bg-orange-500 text-white',
      normal: 'bg-yellow-500 text-white',
      low: 'bg-blue-500 text-white'
    }
    return colors[urgency] || 'bg-gray-500 text-white'
  }

  const getUrgencyText = (urgency: string) => {
    const texts: Record<string, string> = {
      critical: 'CRÍTICO',
      urgent: 'URGENTE',
      normal: 'NORMAL',
      low: 'BAIXA'
    }
    return texts[urgency] || urgency
  }

  const filteredOrders = purchaseOrders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const stats = {
    totalOrders: purchaseOrders.length,
    pendingOrders: purchaseOrders.filter(o => o.status === 'pending' || o.status === 'approved').length,
    criticalItems: lowStockItems.filter(i => i.urgency === 'critical').length,
    totalAlerts: lowStockItems.length,
    pendingValue: purchaseOrders
      .filter(o => o.status === 'pending' || o.status === 'approved')
      .reduce((sum, o) => sum + (o.final_amount || 0), 0)
  }

  const handleCreatePurchaseOrder = async (item: LowStockItem) => {
    try {
      // Gerar número do pedido
      let orderNumber = `PO${Date.now()}`
      try {
        const { data: poNumberData, error: rpcError } = await supabase.rpc('generate_purchase_order_number')
        if (!rpcError && poNumberData) {
          orderNumber = poNumberData
        }
      } catch (rpcErr) {
        console.warn('Erro ao gerar número do pedido, usando timestamp:', rpcErr)
      }

      const supplierName = item.supplier || 'A Definir'
      const unitPrice = item.unit_price || (item.estimated_cost / item.recommended_order_qty)

      // Criar pedido de compra
      const { data: po, error: poError } = await supabase
        .from('purchase_orders')
        .insert([{
          order_number: orderNumber,
          supplier_name: supplierName,
          status: 'draft',
          priority: item.urgency === 'critical' ? 'urgent' : item.urgency === 'urgent' ? 'high' : 'normal',
          order_date: new Date().toISOString().split('T')[0],
          notes: `Pedido automático - ${item.item_name}\nCategoria: ${item.category || 'N/A'}\nLocalização: ${item.location || 'N/A'}\nEstoque Atual: ${item.current_stock}\nEstoque Mínimo: ${item.min_stock}\nDias até ruptura: ${item.days_until_stockout || 'N/A'}`
        }])
        .select()
        .single()

      if (poError) {
        console.error('Erro ao criar pedido:', poError)
        throw new Error(poError.message)
      }

      if (!po) {
        throw new Error('Pedido criado mas sem retorno de dados')
      }

      // Adicionar item ao pedido
      const { error: itemError } = await supabase
        .from('purchase_order_items')
        .insert([{
          purchase_order_id: po.id,
          inventory_id: item.inventory_id,
          item_name: item.item_name,
          quantity: item.recommended_order_qty,
          unit_price: unitPrice,
          urgency_level: item.urgency
        }])

      if (itemError) {
        console.error('Erro ao adicionar item:', itemError)
        throw new Error(itemError.message)
      }

      alert(`✅ Pedido ${orderNumber} criado com sucesso!\n\nFornecedor: ${supplierName}\nQuantidade: ${item.recommended_order_qty}\nValor: R$ ${item.estimated_cost.toFixed(2)}`)
      await loadData()
    } catch (error: any) {
      console.error('Error creating purchase order:', error)
      alert(`❌ Erro ao criar pedido de compra: ${error.message || 'Erro desconhecido'}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="h-8 w-8 text-blue-600" />
            Departamento de Compras
          </h1>
          <p className="text-gray-600 mt-1">Gestão completa de pedidos e alertas de estoque</p>
        </div>
        <button
          onClick={() => alert('Modal de novo pedido em desenvolvimento')}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:shadow-lg transition-all"
        >
          <Plus className="h-5 w-5" />
          Novo Pedido
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-4 shadow-md border border-gray-100"
        >
          <FileText className="h-8 w-8 text-blue-500 mb-2" />
          <h3 className="text-2xl font-bold text-gray-900">{stats.totalOrders}</h3>
          <p className="text-sm text-gray-600">Total de Pedidos</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-4 shadow-md border border-gray-100"
        >
          <Clock className="h-8 w-8 text-yellow-500 mb-2" />
          <h3 className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</h3>
          <p className="text-sm text-gray-600">Pedidos Pendentes</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-4 shadow-md border border-gray-100"
        >
          <AlertTriangle className="h-8 w-8 text-red-500 animate-pulse mb-2" />
          <h3 className="text-2xl font-bold text-red-600">{stats.criticalItems}</h3>
          <p className="text-sm text-gray-600">Itens Críticos</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-4 shadow-md border border-gray-100"
        >
          <Package className="h-8 w-8 text-orange-500 mb-2" />
          <h3 className="text-2xl font-bold text-gray-900">{stats.totalAlerts}</h3>
          <p className="text-sm text-gray-600">Total de Alertas</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-4 shadow-md border border-gray-100"
        >
          <DollarSign className="h-8 w-8 text-green-500 mb-2" />
          <h3 className="text-2xl font-bold text-gray-900">
            R$ {stats.pendingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-sm text-gray-600">Valor Pendente</p>
        </motion.div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="flex border-b">
          <button
            onClick={() => setSelectedTab('alerts')}
            className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 transition-colors ${
              selectedTab === 'alerts'
                ? 'bg-red-50 text-red-600 border-b-2 border-red-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Alertas de Estoque ({stats.totalAlerts})</span>
          </button>
          <button
            onClick={() => setSelectedTab('orders')}
            className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 transition-colors ${
              selectedTab === 'orders'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="font-medium">Pedidos de Compra</span>
          </button>
          <button
            onClick={() => setSelectedTab('schedules')}
            className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 transition-colors ${
              selectedTab === 'schedules'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Clock className="h-5 w-5" />
            <span className="font-medium">Programação</span>
          </button>
          <button
            onClick={() => setSelectedTab('quotes')}
            className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 transition-colors ${
              selectedTab === 'quotes'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FileText className="h-5 w-5" />
            <span className="font-medium">Cotações</span>
          </button>
        </div>

        <div className="p-6">
          {selectedTab === 'alerts' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600 animate-pulse" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900">
                    {stats.criticalItems} {stats.criticalItems === 1 ? 'Item Crítico' : 'Itens Críticos'} Necessitando Atenção Imediata
                  </h3>
                  <p className="text-sm text-red-700">
                    Clique em "Criar Pedido" para gerar automaticamente um pedido de compra
                  </p>
                </div>
              </div>

              {lowStockItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Urgência</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fornecedor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estoque</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qtd. Recomendada</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preço Unit.</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {lowStockItems.map((item) => (
                        <tr key={item.inventory_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getUrgencyColor(item.urgency)}`}>
                              {getUrgencyText(item.urgency)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium text-gray-900">{item.item_name}</div>
                              <div className="text-xs text-gray-500">{item.category || 'Sem categoria'} • {item.location || 'Sem local'}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">{item.supplier || 'A definir'}</div>
                              {item.last_purchase_date && (
                                <div className="text-xs text-gray-500">
                                  Última compra: {new Date(item.last_purchase_date).toLocaleDateString('pt-BR')}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <div><span className="font-semibold text-red-600">{item.current_stock}</span> <span className="text-gray-500">/ {item.min_stock}</span></div>
                              {item.days_until_stockout !== null && item.days_until_stockout < 30 && (
                                <div className="text-xs text-orange-600 font-medium">
                                  ⚠️ {item.days_until_stockout} dias
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            {item.recommended_order_qty}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            R$ {(item.unit_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-green-600">
                            R$ {item.estimated_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleCreatePurchaseOrder(item)}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2 ml-auto"
                            >
                              <ShoppingCart className="h-4 w-4" />
                              Criar Pedido
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Tudo Certo!</h3>
                  <p className="text-gray-600">Nenhum item necessitando compra no momento</p>
                </div>
              )}
            </div>
          )}

          {selectedTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por número ou fornecedor..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos os Status</option>
                  <option value="draft">Rascunho</option>
                  <option value="pending">Pendente</option>
                  <option value="approved">Aprovado</option>
                  <option value="ordered">Pedido Feito</option>
                  <option value="received">Recebido</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>

              {filteredOrders.length > 0 ? (
                <div className="space-y-3">
                  {filteredOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{order.order_number}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              {getStatusText(order.status)}
                            </span>
                            <span className={`text-sm font-medium ${getPriorityColor(order.priority)}`}>
                              {order.priority === 'urgent' && '🔴 URGENTE'}
                              {order.priority === 'high' && '🟠 ALTA'}
                              {order.priority === 'normal' && '🔵 NORMAL'}
                              {order.priority === 'low' && '⚪ BAIXA'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>Fornecedor: <span className="font-medium text-gray-900">{order.supplier_name}</span></div>
                            <div className="flex gap-4">
                              <span>Data: {new Date(order.order_date).toLocaleDateString('pt-BR')}</span>
                              {order.expected_delivery_date && (
                                <span>Entrega Prevista: {new Date(order.expected_delivery_date).toLocaleDateString('pt-BR')}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            R$ {order.final_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                          <button className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            Ver Detalhes
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum pedido encontrado</h3>
                  <p className="text-gray-600">Crie seu primeiro pedido de compra</p>
                </div>
              )}
            </div>
          )}

          {selectedTab === 'schedules' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 border-2 border-blue-200">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-blue-600 p-3 rounded-lg">
                      <RefreshCw className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Programação de Compra</h3>
                      <p className="text-sm text-gray-600">Compras recorrentes automáticas</p>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-6">
                    Configure compras automáticas de materiais com base em períodos fixos. O sistema gerará pedidos automaticamente e criará eventos na agenda.
                  </p>
                  <button
                    onClick={() => setShowPurchaseScheduleModal(true)}
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <Plus className="h-5 w-5" />
                    Nova Programação de Compra
                  </button>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-8 border-2 border-purple-200">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-purple-600 p-3 rounded-lg">
                      <Truck className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Programação de Locação</h3>
                      <p className="text-sm text-gray-600">Locações e faturamentos recorrentes</p>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-6">
                    Configure locações de equipamentos com faturamento automático. O sistema pode gerar receitas financeiras automaticamente na agenda.
                  </p>
                  <button
                    onClick={() => setShowRentalScheduleModal(true)}
                    className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <Plus className="h-5 w-5" />
                    Nova Programação de Locação
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Programações Ativas</h3>
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p>Nenhuma programação cadastrada ainda</p>
                  <p className="text-sm">Crie sua primeira programação usando os botões acima</p>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'quotes' && (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cotações de Fornecedores</h3>
              <p className="text-gray-600">Compare preços e condições de diferentes fornecedores</p>
              <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                Nova Cotação
              </button>
            </div>
          )}
        </div>
      </div>

      <PurchaseScheduleModal
        isOpen={showPurchaseScheduleModal}
        onClose={() => setShowPurchaseScheduleModal(false)}
        onSave={() => {
          setShowPurchaseScheduleModal(false)
          loadData()
        }}
      />

      <RentalScheduleModal
        isOpen={showRentalScheduleModal}
        onClose={() => setShowRentalScheduleModal(false)}
        onSave={() => {
          setShowRentalScheduleModal(false)
          loadData()
        }}
      />
    </div>
  )
}

export default Purchasing
