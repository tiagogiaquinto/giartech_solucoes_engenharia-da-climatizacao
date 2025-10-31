import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { 
  Package, 
  ArrowLeft,
  Edit,
  Trash2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  Plus,
  Minus,
  BarChart3
} from 'lucide-react'
import { useUser } from '../contexts/UserContext'

const InventoryDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAdmin } = useUser()
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [adjustQuantity, setAdjustQuantity] = useState(0)
  const [adjustReason, setAdjustReason] = useState('')
  const [selectedTab, setSelectedTab] = useState('details')

  // Sample data - in a real app, you would fetch this from your API
  const item = {
    id: Number(id),
    name: 'Ar Condicionado Split 12.000 BTUs',
    category: 'Equipamentos',
    quantity: 5,
    minStock: 2,
    price: 1800.00,
    supplier: 'Fornecedor A',
    lastUpdate: '2023-12-15',
    status: 'in_stock',
    description: 'Ar condicionado split 12.000 BTUs, 220V, com controle remoto e instalação básica incluída.',
    sku: 'AC-12000-220',
    location: 'Prateleira A3',
    history: [
      { date: '2023-12-15', type: 'entrada', quantity: 10, user: 'Admin', notes: 'Compra inicial' },
      { date: '2023-12-16', type: 'saida', quantity: 2, user: 'Carlos Técnico', notes: 'OS-2023-001' },
      { date: '2023-12-17', type: 'saida', quantity: 3, user: 'Ana Técnica', notes: 'OS-2023-002' }
    ]
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'bg-green-100 text-green-800'
      case 'low_stock': return 'bg-yellow-100 text-yellow-800'
      case 'out_of_stock': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_stock': return 'Em Estoque'
      case 'low_stock': return 'Estoque Baixo'
      case 'out_of_stock': return 'Sem Estoque'
      default: return 'Desconhecido'
    }
  }

  const getHistoryTypeColor = (type: string) => {
    switch (type) {
      case 'entrada': return 'text-green-600'
      case 'saida': return 'text-red-600'
      case 'ajuste': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  const handleAdjustStock = () => {
    if (adjustQuantity === 0) return
    
    // In a real app, you would send this to your API
    console.log('Adjusting stock by:', adjustQuantity, 'Reason:', adjustReason)
    
    setShowAdjustModal(false)
    setAdjustQuantity(0)
    setAdjustReason('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/inventory')}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
            {getStatusText(item.status)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setShowAdjustModal(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
        >
          <TrendingUp className="h-4 w-4" />
          <span>Ajustar Estoque</span>
        </button>
        
        <button
          onClick={() => navigate(`/inventory/${id}/edit`)}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
        >
          <Edit className="h-4 w-4" />
          <span>Editar</span>
        </button>
        
        {isAdmin && (
          <button
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center space-x-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>Excluir</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setSelectedTab('details')}
            className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 transition-colors ${
              selectedTab === 'details'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Package className="h-5 w-5" />
            <span className="font-medium">Detalhes</span>
          </button>
          
          <button
            onClick={() => setSelectedTab('history')}
            className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 transition-colors ${
              selectedTab === 'history'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="h-5 w-5" />
            <span className="font-medium">Histórico</span>
          </button>
          
          {isAdmin && (
            <button
              onClick={() => setSelectedTab('analytics')}
              className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 transition-colors ${
                selectedTab === 'analytics'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="h-5 w-5" />
              <span className="font-medium">Análise</span>
            </button>
          )}
        </div>

        <div className="p-6">
          {/* Details Tab */}
          {selectedTab === 'details' && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <Package className="h-4 w-4 mr-2 text-blue-500" />
                  Informações Básicas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Categoria</p>
                    <p className="text-sm font-medium text-gray-900">{item.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">SKU</p>
                    <p className="text-sm font-medium text-gray-900">{item.sku}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Fornecedor</p>
                    <p className="text-sm font-medium text-gray-900">{item.supplier}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Localização</p>
                    <p className="text-sm font-medium text-gray-900">{item.location}</p>
                  </div>
                </div>
              </div>

              {/* Stock Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2 text-blue-500" />
                  Informações de Estoque
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Quantidade Atual</p>
                      <p className="text-2xl font-bold text-gray-900">{item.quantity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Estoque Mínimo</p>
                      <p className="text-lg font-medium text-gray-900">{item.minStock}</p>
                    </div>
                    {isAdmin && (
                      <div>
                        <p className="text-xs text-gray-500">Valor Unitário</p>
                        <p className="text-lg font-medium text-green-600">R$ {item.price.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Nível de Estoque</span>
                      <span>{item.quantity}/{item.minStock} mín</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          item.quantity > item.minStock ? 'bg-green-500' :
                          item.quantity > 0 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min((item.quantity / (item.minStock * 2)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  {item.quantity <= item.minStock && (
                    <div className="mt-4 flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">Alerta de Estoque Baixo</p>
                        <p className="text-xs text-yellow-700">
                          Este item está {item.quantity === 0 ? 'sem estoque' : 'com estoque abaixo do mínimo recomendado'}. 
                          Considere fazer uma nova compra.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <Package className="h-4 w-4 mr-2 text-blue-500" />
                  Descrição
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700">{item.description}</p>
                </div>
              </div>
            </div>
          )}

          {/* History Tab */}
          {selectedTab === 'history' && (
            <div className="space-y-6">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                <Clock className="h-4 w-4 mr-2 text-blue-500" />
                Histórico de Movimentações
              </h3>
              
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                
                <div className="space-y-6">
                  {item.history.map((entry, index) => (
                    <div key={index} className="relative pl-10">
                      {/* Timeline dot */}
                      <div className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        entry.type === 'entrada' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {entry.type === 'entrada' ? 
                          <Plus className="h-4 w-4 text-green-600" /> : 
                          <Minus className="h-4 w-4 text-red-600" />
                        }
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className={`font-medium ${getHistoryTypeColor(entry.type)}`}>
                            {entry.type === 'entrada' ? 'Entrada' : 'Saída'} de {entry.quantity} unidades
                          </h4>
                          <span className="text-sm text-gray-500">{new Date(entry.date).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Realizado por: {entry.user}</p>
                        {entry.notes && <p className="text-sm text-gray-700">Observação: {entry.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {selectedTab === 'analytics' && isAdmin && (
            <div className="space-y-6">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                <BarChart3 className="h-4 w-4 mr-2 text-blue-500" />
                Análise de Consumo
              </h3>
              
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-700 mb-2">Análise de consumo em desenvolvimento</p>
                <p className="text-sm text-gray-500">
                  Em breve você poderá visualizar gráficos de consumo, previsões de estoque e muito mais.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAdjustModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white rounded-xl p-6 w-full max-w-md shadow-2xl"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Ajustar Estoque
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantidade Atual
                </label>
                <input
                  type="text"
                  value={item.quantity}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ajuste
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setAdjustQuantity(prev => prev - 1)}
                    className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                  <input
                    type="number"
                    value={adjustQuantity}
                    onChange={(e) => setAdjustQuantity(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                  />
                  <button
                    type="button"
                    onClick={() => setAdjustQuantity(prev => prev + 1)}
                    className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {adjustQuantity > 0 ? 'Entrada' : adjustQuantity < 0 ? 'Saída' : 'Sem alteração'} de {Math.abs(adjustQuantity)} unidades
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nova Quantidade
                </label>
                <input
                  type="text"
                  value={item.quantity + adjustQuantity}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-bold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo do Ajuste
                </label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Descreva o motivo deste ajuste..."
                  required
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAdjustModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdjustStock}
                disabled={adjustQuantity === 0 || !adjustReason}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar Ajuste
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default InventoryDetail