import React, { useState, useRef } from 'react'
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Package, Plus, Search, ListFilter as Filter, TriangleAlert as AlertTriangle, TrendingUp, TrendingDown, ArrowRight, File as Edit, Trash2, Save, X, FileText, Download, Printer, Loader, CircleCheck as CheckCircle, Copy, ShoppingCart } from 'lucide-react'
import { useUser } from '../contexts/UserContext'
import { getInventoryItems, createInventoryItem, updateInventoryItem, deleteInventoryItem, type InventoryItem } from '../lib/supabase'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'


const Inventory = () => {
  const { isAdmin } = useUser()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [showGeneratingIndicator, setShowGeneratingIndicator] = useState(false)
  const [generatingProgress, setGeneratingProgress] = useState(0)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const inventoryRef = useRef<HTMLDivElement>(null)


  const [newItem, setNewItem] = useState<Omit<InventoryItem, 'id'>>({
    name: '',
    category: '',
    quantity: 0,
    min_stock: 0,
    unit: 'un',
    cost: 0,
    price: 0,
    supplier: '',
    description: '',
    sku: '',
    location: '',
    created_at: '',
    updated_at: ''
  })

  // Load inventory items from database
  useEffect(() => {
    loadInventoryItems()
  }, [])

  const loadInventoryItems = async () => {
    try {
      setLoading(true)
      const data = await getInventoryItems()
      setInventoryItems(data || [])
      setError(null)
    } catch (err) {
      console.error('Error loading inventory items:', err)
      setError('Erro ao carregar itens do estoque')
      setInventoryItems([])
    } finally {
      setLoading(false)
    }
  }
  // Get unique categories
  const categories = ['all', ...Array.from(new Set(inventoryItems.map(item => item.category)))]

  // Filter items
  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getStatusColor = (item: InventoryItem) => {
    const status = calculateStatus(item.quantity, item.min_stock)
    switch (status) {
      case 'in_stock': return 'bg-green-100 text-green-800'
      case 'low_stock': return 'bg-yellow-100 text-yellow-800'
      case 'out_of_stock': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (item: InventoryItem) => {
    const status = calculateStatus(item.quantity, item.min_stock)
    switch (status) {
      case 'in_stock': return 'Em Estoque'
      case 'low_stock': return 'Estoque Baixo'
      case 'out_of_stock': return 'Sem Estoque'
      default: return 'Desconhecido'
    }
  }

  const calculateStatus = (quantity: number, minStock: number) => {
    if (quantity === 0) return 'out_of_stock'
    if (quantity < minStock) return 'low_stock'
    return 'in_stock'
  }

  const stats = {
    total: inventoryItems.length,
    inStock: inventoryItems.filter(p => calculateStatus(p.quantity, p.min_stock) === 'in_stock').length,
    lowStock: inventoryItems.filter(p => calculateStatus(p.quantity, p.min_stock) === 'low_stock').length,
    outOfStock: inventoryItems.filter(p => calculateStatus(p.quantity, p.min_stock) === 'out_of_stock').length,
    totalValue: inventoryItems.reduce((acc, p) => acc + (p.quantity * p.price), 0)
  }

  const handleAddItem = async () => {
    // Validate required fields
    if (!newItem.name || !newItem.category || !newItem.supplier) {
      alert('Por favor, preencha todos os campos obrigatórios')
      return
    }
    
    try {
      const itemData = {
        name: newItem.name,
        category: newItem.category,
        quantity: newItem.quantity,
        min_stock: newItem.min_stock,
        price: newItem.price,
        supplier: newItem.supplier,
        description: newItem.description,
        sku: newItem.sku,
        location: newItem.location
      }
      
      const createdItem = await createInventoryItem(itemData)
      setInventoryItems([...inventoryItems, createdItem])

      // Reset form
      setNewItem({
        name: '',
        category: '',
        quantity: 0,
        min_stock: 0,
        price: 0,
        cost: 0,
        unit: 'un',
        supplier: '',
        description: '',
        sku: '',
        location: '',
        created_at: '',
        updated_at: ''
      })
      setShowAddModal(false)
      alert('Item adicionado com sucesso!')
    } catch (error: any) {
      console.error('Error creating item:', error)

      let errorMessage = 'Erro ao adicionar item'

      if (error?.message?.includes('duplicate key') || error?.message?.includes('already exists')) {
        errorMessage = 'Já existe um item com este código/SKU. Por favor, use um código diferente ou deixe em branco para gerar automaticamente.'
      } else if (error?.message) {
        errorMessage = `Erro: ${error.message}`
      }

      alert(errorMessage)
    }
  }

  const handleUpdateItem = async () => {
    if (!selectedItem) return
    
    try {
      const updates = {
        name: selectedItem.name,
        category: selectedItem.category,
        quantity: selectedItem.quantity,
        min_stock: selectedItem.min_stock,
        price: selectedItem.price,
        supplier: selectedItem.supplier,
        description: selectedItem.description,
        sku: selectedItem.sku,
        location: selectedItem.location
      }
      
      const updatedItem = await updateInventoryItem(selectedItem.id, updates)
      setInventoryItems(inventoryItems.map(item => 
        item.id === updatedItem.id ? updatedItem : item
      ))
      
      setShowEditModal(false)
      setSelectedItem(null)
      alert('Item atualizado com sucesso!')
    } catch (error) {
      console.error('Error updating item:', error)
      alert('Erro ao atualizar item')
    }
  }

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteInventoryItem(id)
      setInventoryItems(inventoryItems.filter(item => item.id !== id))
      setShowDeleteConfirm(null)
      setSelectedItem(null)
      alert('Item excluído com sucesso!')
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Erro ao excluir item')
    }
  }

  const handleDuplicateItem = (item: InventoryItem) => {
    // Copy all properties except id and created_at
    setNewItem({
      name: `${item.name} (Cópia)`,
      category: item.category,
      quantity: 0, // Reset quantity for new item
      min_stock: item.min_stock,
      unit: item.unit,
      cost: item.cost,
      price: item.price,
      supplier: item.supplier,
      description: item.description,
      sku: item.sku ? `${item.sku}-COPIA` : '',
      location: item.location,
      created_at: '',
      updated_at: ''
    })
    setShowAddModal(true)
  }

  // Generate inventory report
  const generateInventoryPDF = async () => {
    if (!inventoryRef.current) return
    
    setIsGeneratingPDF(true)
    setShowGeneratingIndicator(true)
    setGeneratingProgress(10)
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setGeneratingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 300)
      
      // Capture the content
      const canvas = await html2canvas(inventoryRef.current, {
        scale: 1,
        useCORS: true,
        logging: false
      })
      
      setGeneratingProgress(95)
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      
      // Add header
      pdf.setFillColor(59, 130, 246) // Blue
      pdf.rect(0, 0, pdf.internal.pageSize.width, 20, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(14)
      pdf.text('Relatório de Estoque - GiarTech', 10, 10)
      pdf.setFontSize(10)
      pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 10, 16)
      
      // Add image
      const imgWidth = pdf.internal.pageSize.width
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 25, imgWidth, imgHeight)
      
      // Save PDF
      pdf.save('relatorio-estoque.pdf')
      
      setGeneratingProgress(100)
      
      // Clear after a while
      setTimeout(() => {
        setIsGeneratingPDF(false)
        setShowGeneratingIndicator(false)
        setGeneratingProgress(0)
      }, 1000)
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      setIsGeneratingPDF(false)
      setShowGeneratingIndicator(false)
      alert('Error generating PDF. Please try again.')
    }
  }

  return (
    <div className="space-y-6" ref={inventoryRef}>
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
        <h1 className="text-2xl font-bold text-gray-900">Estoque</h1>
        <div className="flex gap-3">
          {stats.lowStock > 0 && (
            <button
              onClick={() => navigate('/purchasing')}
              className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:shadow-lg transition-all animate-pulse"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>{stats.lowStock} {stats.lowStock === 1 ? 'Item' : 'Itens'} Necessitando Compra</span>
              <ShoppingCart className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:shadow-lg transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Item</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total de Itens', value: stats.total, color: 'from-blue-500 to-cyan-500', icon: Package },
          { label: 'Em Estoque', value: stats.inStock, color: 'from-green-500 to-emerald-500', icon: TrendingUp },
          { label: 'Estoque Baixo', value: stats.lowStock, color: 'from-yellow-500 to-orange-500', icon: AlertTriangle },
          { label: 'Sem Estoque', value: stats.outOfStock, color: 'from-red-500 to-pink-500', icon: TrendingDown },
          { label: 'Valor Total', value: `R$ ${stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, color: 'from-purple-500 to-indigo-500', icon: Package, adminOnly: true }
        ].filter(stat => !stat.adminOnly || (stat.adminOnly && isAdmin)).map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-4 shadow-md border border-gray-100"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`w-10 h-10 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900">{stat.value}</h3>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters and Report Actions */}
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 md:items-center justify-between">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 flex-grow">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Buscar por nome, fornecedor ou SKU..."
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
          
          <div className="flex space-x-2">
            <button
              onClick={generateInventoryPDF}
              className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-1"
            >
              <FileText className="h-4 w-4" />
              <span>Relatório</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center space-x-1"
            >
              <Plus className="h-4 w-4" />
              <span>Novo Item</span>
            </button>
          </div>
        </div>
      </div>

      {/* Inventory List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Carregando estoque...</span>
        </div>
      ) : (
      <div className="space-y-4">
        {filteredItems.length > 0 ? (
          filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-xl transition-all duration-200"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    calculateStatus(item.quantity, item.min_stock) === 'in_stock' ? 'bg-green-100 text-green-600' :
                    calculateStatus(item.quantity, item.min_stock) === 'low_stock' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    <Package className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{item.category}</span>
                      {item.sku && (
                        <span className="text-xs text-gray-500">SKU: {item.sku}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item)}`}>
                    {getStatusText(item)}
                  </span>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => {
                        setSelectedItem(item)
                        setShowEditModal(true)
                      }}
                      className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDuplicateItem(item)}
                      className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                      title="Duplicar Item"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(item.id)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Quantidade</p>
                  <p className="text-lg font-bold text-gray-900">{item.quantity}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Estoque Mínimo</p>
                  <p className="text-sm text-gray-900">{item.min_stock}</p>
                </div>
                {isAdmin && (
                  <div>
                    <p className="text-xs text-gray-500">Preço Unitário</p>
                    <p className="text-sm text-green-600">R$ {item.price.toFixed(2)}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Fornecedor</p>
                  <p className="text-sm text-gray-900">{item.supplier}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Nível de Estoque</span>
                  <span>{item.quantity}/{item.min_stock} mín</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      item.quantity > item.min_stock ? 'bg-green-500' :
                      item.quantity > 0 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min((item.quantity / (item.min_stock * 2)) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {item.location && (
                <div className="mt-3 text-xs text-gray-500">
                  <span className="font-medium">Localização:</span> {item.location}
                </div>
              )}
            </motion.div>
          ))
        ) : (
          <div className="bg-white rounded-xl p-10 shadow-md border border-gray-100 text-center">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum item encontrado</h3>
            <p className="text-gray-600 mb-6">Não encontramos itens de estoque com os filtros selecionados.</p>
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

      {/* Add Item Modal */}
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
                <h2 className="text-xl font-bold text-gray-900">Novo Item de Estoque</h2>
                <button onClick={() => setShowAddModal(false)}>
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Package className="h-5 w-5 mr-2 text-blue-500" />
                    Informações Básicas
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome do Item
                      </label>
                      <input
                        type="text"
                        value={newItem.name}
                        onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nome completo do item"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categoria
                      </label>
                      <input
                        type="text"
                        value={newItem.category}
                        onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ex: Equipamentos, Peças, etc."
                        required
                        list="categories"
                      />
                      <datalist id="categories">
                        {categories.filter(c => c !== 'all').map(category => (
                          <option key={category} value={category} />
                        ))}
                      </datalist>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SKU / Código <span className="text-gray-400 text-xs">(opcional)</span>
                      </label>
                      <input
                        type="text"
                        value={newItem.sku}
                        onChange={(e) => setNewItem({...newItem, sku: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Deixe em branco para gerar automaticamente"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descrição
                      </label>
                      <textarea
                        value={newItem.description}
                        onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        placeholder="Descrição detalhada do item"
                      />
                    </div>
                  </div>
                </div>

                {/* Stock Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Package className="h-5 w-5 mr-2 text-blue-500" />
                    Informações de Estoque
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantidade Inicial
                      </label>
                      <input
                        type="number"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem({...newItem, quantity: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estoque Mínimo
                      </label>
                      <input
                        type="number"
                        value={newItem.min_stock}
                        onChange={(e) => setNewItem({...newItem, min_stock: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unidade de Medida
                      </label>
                      <select
                        value={newItem.unit || 'un'}
                        onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="un">Unidade (un)</option>
                        <option value="m">Metro (m)</option>
                        <option value="m2">Metro Quadrado (m²)</option>
                        <option value="m3">Metro Cúbico (m³)</option>
                        <option value="kg">Quilograma (kg)</option>
                        <option value="g">Grama (g)</option>
                        <option value="l">Litro (l)</option>
                        <option value="ml">Mililitro (ml)</option>
                        <option value="cx">Caixa (cx)</option>
                        <option value="pc">Peça (pc)</option>
                        <option value="par">Par</option>
                        <option value="rolo">Rolo</option>
                        <option value="pct">Pacote (pct)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor de Custo (R$)
                      </label>
                      <input
                        type="number"
                        value={newItem.cost}
                        onChange={(e) => setNewItem({...newItem, cost: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                        step="0.01"
                        placeholder="Preço de compra"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor de Venda (R$)
                      </label>
                      <input
                        type="number"
                        value={newItem.price}
                        onChange={(e) => setNewItem({...newItem, price: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                        step="0.01"
                        placeholder="Preço de venda"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fornecedor
                      </label>
                      <input
                        type="text"
                        value={newItem.supplier}
                        onChange={(e) => setNewItem({...newItem, supplier: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nome do fornecedor"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Localização
                      </label>
                      <input
                        type="text"
                        value={newItem.location}
                        onChange={(e) => setNewItem({...newItem, location: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ex: Prateleira A3"
                      />
                    </div>
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
                  onClick={handleAddItem}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg"
                >
                  <Save className="h-4 w-4 mr-2 inline" />
                  Salvar Item
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Item Modal */}
      <AnimatePresence>
        {showEditModal && selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white rounded-xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Editar Item</h2>
                <button onClick={() => setShowEditModal(false)}>
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Package className="h-5 w-5 mr-2 text-blue-500" />
                    Informações Básicas
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome do Item
                      </label>
                      <input
                        type="text"
                        value={selectedItem.name}
                        onChange={(e) => setSelectedItem({...selectedItem, name: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nome completo do item"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categoria
                      </label>
                      <input
                        type="text"
                        value={selectedItem.category}
                        onChange={(e) => setSelectedItem({...selectedItem, category: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ex: Equipamentos, Peças, etc."
                        required
                        list="edit-categories"
                      />
                      <datalist id="edit-categories">
                        {categories.filter(c => c !== 'all').map(category => (
                          <option key={category} value={category} />
                        ))}
                      </datalist>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SKU / Código <span className="text-gray-400 text-xs">(opcional)</span>
                      </label>
                      <input
                        type="text"
                        value={selectedItem.sku || ''}
                        onChange={(e) => setSelectedItem({...selectedItem, sku: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Código único do item"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descrição
                      </label>
                      <textarea
                        value={selectedItem.description || ''}
                        onChange={(e) => setSelectedItem({...selectedItem, description: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        placeholder="Descrição detalhada do item"
                      />
                    </div>
                  </div>
                </div>

                {/* Stock Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Package className="h-5 w-5 mr-2 text-blue-500" />
                    Informações de Estoque
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantidade
                      </label>
                      <input
                        type="number"
                        value={selectedItem.quantity}
                        onChange={(e) => setSelectedItem({...selectedItem, quantity: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estoque Mínimo
                      </label>
                      <input
                        type="number"
                        value={selectedItem.min_stock}
                        onChange={(e) => setSelectedItem({...selectedItem, min_stock: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Preço Unitário (R$)
                      </label>
                      <input
                        type="number"
                        value={selectedItem.price}
                        onChange={(e) => setSelectedItem({...selectedItem, price: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fornecedor
                      </label>
                      <input
                        type="text"
                        value={selectedItem.supplier}
                        onChange={(e) => setSelectedItem({...selectedItem, supplier: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nome do fornecedor"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Localização
                      </label>
                      <input
                        type="text"
                        value={selectedItem.location || ''}
                        onChange={(e) => setSelectedItem({...selectedItem, location: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ex: Prateleira A3"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateItem}
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
        {showDeleteConfirm !== null && (
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
                Tem certeza que deseja excluir este item do estoque? Esta ação não pode ser desfeita.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => showDeleteConfirm && handleDeleteItem(showDeleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Generating PDF Indicator */}
      <AnimatePresence>
        {showGeneratingIndicator && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80 z-50"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">Gerando Relatório</h3>
              {generatingProgress === 100 && (
                <button 
                  onClick={() => setShowGeneratingIndicator(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-3 mb-2">
              {generatingProgress < 100 ? (
                <Loader className="h-5 w-5 text-blue-500 animate-spin" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${generatingProgress}%` }}
                  ></div>
                </div>
              </div>
              <span className="text-sm font-medium text-gray-700">{generatingProgress}%</span>
            </div>
            
            <p className="text-xs text-gray-500">
              {generatingProgress < 100 
                ? 'Processando dados e gerando relatório...' 
                : 'Relatório gerado com sucesso!'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Inventory