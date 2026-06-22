import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Package, Plus, Search, Filter, AlertTriangle, TrendingUp, TrendingDown,
  Edit, Trash2, Save, X, FileText, Loader, CheckCircle, Copy, ShoppingCart,
  DollarSign, Percent, Box, BarChart2, AlertCircle, LayoutGrid, List,
  ArrowUpRight, RefreshCw
} from 'lucide-react'
import { useUser } from '../contexts/UserContext'
import { getInventoryItems, createInventoryItem, updateInventoryItem, deleteInventoryItem, type InventoryItem } from '../lib/supabase'
import { supabase } from '../lib/supabase'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

interface Material {
  id: string
  sku: string
  nome: string
  descricao?: string
  preco_compra: number
  preco_venda: number
  preco_unitario: number
  margem_lucro: number
  quantidade_estoque: number
  estoque_minimo: number
  unidade_medida: string
  active: boolean
  created_at: string
}

type Tab = 'estoque' | 'materiais'
type ViewMode = 'cards' | 'table'

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const calcStatus = (qty: number, min: number) => {
  if (qty === 0) return 'out'
  if (qty < min) return 'low'
  return 'ok'
}

const statusMeta = {
  ok:  { label: 'Em Estoque',    bg: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500' },
  low: { label: 'Estoque Baixo', bg: 'bg-amber-100 text-amber-700',    bar: 'bg-amber-500' },
  out: { label: 'Sem Estoque',   bg: 'bg-red-100 text-red-700',        bar: 'bg-red-500' },
}

export default function EstoqueHub() {
  const { isAdmin } = useUser()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('estoque')
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // ── Estoque state ────────────────────────────────────────────────────────────
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [invLoading, setInvLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [pdfProgress, setPdfProgress] = useState(0)
  const inventoryRef = useRef<HTMLDivElement>(null)

  const blankItem: Omit<InventoryItem, 'id'> = {
    name: '', category: '', quantity: 0, min_stock: 0, unit: 'un',
    cost: 0, price: 0, supplier: '', description: '', sku: '', location: '',
    created_at: '', updated_at: ''
  }
  const [newItem, setNewItem] = useState<Omit<InventoryItem, 'id'>>(blankItem)

  // ── Materiais state ──────────────────────────────────────────────────────────
  const [materials, setMaterials] = useState<Material[]>([])
  const [matLoading, setMatLoading] = useState(true)
  const [showMatModal, setShowMatModal] = useState(false)
  const [editingMat, setEditingMat] = useState<Material | null>(null)
  const [matForm, setMatForm] = useState({
    sku: '', nome: '', descricao: '', preco_compra: 0, preco_venda: 0,
    quantidade_estoque: 0, estoque_minimo: 0, unidade_medida: 'UN', active: true
  })

  // ── Load data ────────────────────────────────────────────────────────────────
  useEffect(() => { loadInventory() }, [])
  useEffect(() => { loadMaterials() }, [])

  const loadInventory = async () => {
    setInvLoading(true)
    try {
      const data = await getInventoryItems()
      setInventoryItems(data || [])
    } catch (e) { console.error(e) }
    finally { setInvLoading(false) }
  }

  const loadMaterials = async () => {
    setMatLoading(true)
    try {
      const { data, error } = await supabase.from('materials').select('*').order('nome')
      if (error) throw error
      setMaterials(data || [])
    } catch (e) { console.error(e) }
    finally { setMatLoading(false) }
  }

  // ── Computed ─────────────────────────────────────────────────────────────────
  const invCategories = ['all', ...Array.from(new Set(inventoryItems.map(i => i.category)))]

  const filteredInv = inventoryItems.filter(item => {
    const q = searchTerm.toLowerCase()
    const matchSearch = item.name.toLowerCase().includes(q) ||
      item.supplier.toLowerCase().includes(q) ||
      (item.sku && item.sku.toLowerCase().includes(q))
    const matchCat = selectedCategory === 'all' || item.category === selectedCategory
    return matchSearch && matchCat
  })

  const filteredMat = materials.filter(m =>
    m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const invStats = {
    total: inventoryItems.length,
    ok: inventoryItems.filter(i => calcStatus(i.quantity, i.min_stock) === 'ok').length,
    low: inventoryItems.filter(i => calcStatus(i.quantity, i.min_stock) === 'low').length,
    out: inventoryItems.filter(i => calcStatus(i.quantity, i.min_stock) === 'out').length,
    value: inventoryItems.reduce((a, i) => a + i.quantity * i.price, 0),
  }

  const matStats = {
    total: materials.length,
    invested: materials.reduce((s, m) => s + Number(m.preco_compra) * m.quantidade_estoque, 0),
    saleValue: materials.reduce((s, m) => s + Number(m.preco_venda) * m.quantidade_estoque, 0),
    alerts: materials.filter(m => m.quantidade_estoque <= m.estoque_minimo).length,
  }

  // ── Inventory CRUD ───────────────────────────────────────────────────────────
  const handleAddItem = async () => {
    if (!newItem.name || !newItem.category || !newItem.supplier) {
      alert('Preencha nome, categoria e fornecedor')
      return
    }
    try {
      const created = await createInventoryItem({
        name: newItem.name, category: newItem.category, quantity: newItem.quantity,
        min_stock: newItem.min_stock, price: newItem.price, supplier: newItem.supplier,
        description: newItem.description, sku: newItem.sku, location: newItem.location
      })
      setInventoryItems(prev => [...prev, created])
      setNewItem(blankItem)
      setShowAddModal(false)
    } catch (e: any) {
      alert(e?.message?.includes('duplicate key')
        ? 'SKU já existe. Use outro código.'
        : `Erro: ${e?.message}`)
    }
  }

  const handleUpdateItem = async () => {
    if (!selectedItem) return
    try {
      const updated = await updateInventoryItem(selectedItem.id, {
        name: selectedItem.name, category: selectedItem.category,
        quantity: selectedItem.quantity, min_stock: selectedItem.min_stock,
        price: selectedItem.price, supplier: selectedItem.supplier,
        description: selectedItem.description, sku: selectedItem.sku, location: selectedItem.location
      })
      setInventoryItems(prev => prev.map(i => i.id === updated.id ? updated : i))
      setShowEditModal(false)
      setSelectedItem(null)
    } catch { alert('Erro ao atualizar item') }
  }

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteInventoryItem(id)
      setInventoryItems(prev => prev.filter(i => i.id !== id))
      setDeleteConfirmId(null)
    } catch { alert('Erro ao excluir item') }
  }

  const handleDuplicateItem = (item: InventoryItem) => {
    setNewItem({ ...item, name: `${item.name} (Cópia)`, quantity: 0, sku: item.sku ? `${item.sku}-COPIA` : '', created_at: '', updated_at: '' })
    setShowAddModal(true)
  }

  const generatePDF = async () => {
    if (!inventoryRef.current) return
    setIsGeneratingPDF(true)
    setPdfProgress(10)
    try {
      const interval = setInterval(() => setPdfProgress(p => p < 90 ? p + 10 : p), 300)
      const canvas = await html2canvas(inventoryRef.current, { scale: 1, useCORS: true, logging: false })
      clearInterval(interval)
      setPdfProgress(95)
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      pdf.setFillColor(59, 130, 246)
      pdf.rect(0, 0, pdf.internal.pageSize.width, 20, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(14)
      pdf.text('Relatório de Estoque - GiarTech', 10, 10)
      pdf.setFontSize(10)
      pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 10, 16)
      const iw = pdf.internal.pageSize.width
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 25, iw, (canvas.height * iw) / canvas.width)
      pdf.save('relatorio-estoque.pdf')
      setPdfProgress(100)
      setTimeout(() => { setIsGeneratingPDF(false); setPdfProgress(0) }, 1200)
    } catch { setIsGeneratingPDF(false); setPdfProgress(0) }
  }

  // ── Materials CRUD ───────────────────────────────────────────────────────────
  const resetMatForm = () => setMatForm({ sku: '', nome: '', descricao: '', preco_compra: 0, preco_venda: 0, quantidade_estoque: 0, estoque_minimo: 0, unidade_medida: 'UN', active: true })

  const handleSaveMat = async () => {
    if (!matForm.sku || !matForm.nome) { alert('SKU e Nome são obrigatórios'); return }
    try {
      if (editingMat) {
        const { error } = await supabase.from('materials').update(matForm).eq('id', editingMat.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('materials').insert([matForm])
        if (error) throw error
      }
      setShowMatModal(false)
      setEditingMat(null)
      resetMatForm()
      loadMaterials()
    } catch (e) { console.error(e); alert('Erro ao salvar material') }
  }

  const handleDeleteMat = async (id: string) => {
    if (!confirm('Excluir este material?')) return
    try {
      const { error } = await supabase.from('materials').delete().eq('id', id)
      if (error) throw error
      loadMaterials()
    } catch { alert('Erro ao excluir material') }
  }

  const calcMargin = (buy: number, sell: number) => buy === 0 ? 0 : ((sell - buy) / buy) * 100

  // ── Render helpers ───────────────────────────────────────────────────────────
  const TabButton = ({ tab, label, count, icon: Icon }: { tab: Tab; label: string; count: number; icon: React.ElementType }) => (
    <button
      onClick={() => { setActiveTab(tab); setSearchTerm(''); setSelectedCategory('all') }}
      className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
        activeTab === tab
          ? 'bg-white text-blue-700 shadow-md'
          : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
        activeTab === tab ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
      }`}>{count}</span>
    </button>
  )

  const StockBar = ({ qty, min }: { qty: number; min: number }) => {
    const st = calcStatus(qty, min)
    const pct = min === 0 ? 100 : Math.min((qty / (min * 2)) * 100, 100)
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Nível</span><span>{qty}/{min} mín</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${statusMeta[st].bar}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 min-h-screen" ref={inventoryRef}>
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-600" />
            Estoque & Materiais
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Controle unificado de itens, insumos e precificação</p>
        </div>
        <div className="flex items-center gap-2">
          {invStats.low > 0 && (
            <button
              onClick={() => navigate('/purchasing')}
              className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors animate-pulse"
            >
              <AlertTriangle className="h-4 w-4" />
              {invStats.low} item{invStats.low !== 1 ? 's' : ''} em alerta
              <ShoppingCart className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => {
              if (activeTab === 'estoque') { setNewItem(blankItem); setShowAddModal(true) }
              else { setEditingMat(null); resetMatForm(); setShowMatModal(true) }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            {activeTab === 'estoque' ? 'Novo Item' : 'Novo Material'}
          </button>
        </div>
      </div>

      {/* ── Tab Switcher ────────────────────────────────────────────────────── */}
      <div className="bg-gray-100 p-1.5 rounded-2xl flex gap-1 w-fit">
        <TabButton tab="estoque" label="Estoque Operacional" count={invStats.total} icon={Package} />
        <TabButton tab="materiais" label="Materiais & Preços" count={matStats.total} icon={BarChart2} />
      </div>

      {/* ── Stats Row ───────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeTab === 'estoque' ? (
          <motion.div key="inv-stats" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {[
              { label: 'Total de Itens', value: invStats.total, icon: Box, color: 'bg-blue-50 text-blue-600' },
              { label: 'Em Estoque', value: invStats.ok, icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600' },
              { label: 'Estoque Baixo', value: invStats.low, icon: AlertCircle, color: 'bg-amber-50 text-amber-600' },
              { label: 'Sem Estoque', value: invStats.out, icon: TrendingDown, color: 'bg-red-50 text-red-600' },
              ...(isAdmin ? [{ label: 'Valor Total', value: fmtCurrency(invStats.value), icon: DollarSign, color: 'bg-purple-50 text-purple-600' }] : [])
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-gray-900 truncate">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div key="mat-stats" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total de Materiais', value: matStats.total, icon: Box, color: 'bg-blue-50 text-blue-600' },
              { label: 'Custo Total', value: fmtCurrency(matStats.invested), icon: ShoppingCart, color: 'bg-orange-50 text-orange-600' },
              { label: 'Valor de Venda', value: fmtCurrency(matStats.saleValue), icon: DollarSign, color: 'bg-emerald-50 text-emerald-600' },
              { label: 'Lucro Potencial', value: fmtCurrency(matStats.saleValue - matStats.invested), icon: TrendingUp, color: 'bg-purple-50 text-purple-600' },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-gray-900 truncate">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={activeTab === 'estoque' ? 'Buscar por nome, fornecedor ou SKU...' : 'Buscar por nome ou SKU...'}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
          />
        </div>
        {activeTab === 'estoque' && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
            >
              {invCategories.map(c => <option key={c} value={c}>{c === 'all' ? 'Todas as categorias' : c}</option>)}
            </select>
          </div>
        )}
        <div className="flex items-center gap-2 ml-auto">
          {activeTab === 'estoque' && (
            <button onClick={generatePDF} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600">
              <FileText className="h-4 w-4" />
              Relatório
            </button>
          )}
          <button onClick={() => activeTab === 'estoque' ? loadInventory() : loadMaterials()} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600">
            <RefreshCw className="h-4 w-4" />
          </button>
          <div className="flex border border-gray-200 rounded-xl overflow-hidden">
            <button onClick={() => setViewMode('cards')} className={`p-2 ${viewMode === 'cards' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-500'}`}>
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button onClick={() => setViewMode('table')} className={`p-2 ${viewMode === 'table' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-500'}`}>
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeTab === 'estoque' ? (
          <motion.div key="estoque" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {invLoading ? (
              <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                Carregando estoque...
              </div>
            ) : filteredInv.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                <Package className="h-14 w-14 text-gray-200 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-700 mb-1">Nenhum item encontrado</h3>
                <p className="text-sm text-gray-500 mb-4">Tente ajustar os filtros de busca.</p>
                <button onClick={() => { setSearchTerm(''); setSelectedCategory('all') }} className="text-sm text-blue-600 hover:underline">Limpar filtros</button>
              </div>
            ) : viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredInv.map((item, i) => {
                  const st = calcStatus(item.quantity, item.min_stock)
                  return (
                    <motion.div key={item.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${statusMeta[st].bg}`}>
                            <Package className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                            <p className="text-xs text-gray-500">{item.category}{item.sku ? ` · ${item.sku}` : ''}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${statusMeta[st].bg}`}>{statusMeta[st].label}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                        <div><p className="text-xs text-gray-400">Quantidade</p><p className="font-bold text-gray-900">{item.quantity} {item.unit}</p></div>
                        <div><p className="text-xs text-gray-400">Fornecedor</p><p className="font-medium text-gray-700 truncate">{item.supplier || '—'}</p></div>
                        {isAdmin && <div><p className="text-xs text-gray-400">Preço</p><p className="font-medium text-emerald-600">{fmtCurrency(item.price)}</p></div>}
                        {item.location && <div><p className="text-xs text-gray-400">Localização</p><p className="font-medium text-gray-700">{item.location}</p></div>}
                      </div>

                      <StockBar qty={item.quantity} min={item.min_stock} />

                      <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-gray-50">
                        <button onClick={() => { setSelectedItem(item); setShowEditModal(true) }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                          <Edit className="h-3.5 w-3.5" />Editar
                        </button>
                        <button onClick={() => handleDuplicateItem(item)}
                          className="flex items-center justify-center p-1.5 text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setDeleteConfirmId(item.id)}
                          className="flex items-center justify-center p-1.5 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Item', 'Categoria', 'Qtd', 'Mín', isAdmin ? 'Preço' : null, 'Fornecedor', 'Status', 'Ações'].filter(Boolean).map(h => (
                        <th key={h!} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredInv.map(item => {
                      const st = calcStatus(item.quantity, item.min_stock)
                      return (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                            {item.sku && <p className="text-xs text-gray-400">{item.sku}</p>}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.category}</td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{item.min_stock}</td>
                          {isAdmin && <td className="px-4 py-3 text-sm font-medium text-emerald-600">{fmtCurrency(item.price)}</td>}
                          <td className="px-4 py-3 text-sm text-gray-600">{item.supplier}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusMeta[st].bg}`}>{statusMeta[st].label}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button onClick={() => { setSelectedItem(item); setShowEditModal(true) }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit className="h-3.5 w-3.5" /></button>
                              <button onClick={() => handleDuplicateItem(item)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"><Copy className="h-3.5 w-3.5" /></button>
                              <button onClick={() => setDeleteConfirmId(item.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="materiais" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {matLoading ? (
              <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                Carregando materiais...
              </div>
            ) : filteredMat.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                <Package className="h-14 w-14 text-gray-200 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-700 mb-1">Nenhum material encontrado</h3>
                <p className="text-sm text-gray-500">Adicione materiais para controlar preços e margens.</p>
              </div>
            ) : viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredMat.map((mat, i) => {
                  const st = mat.quantidade_estoque === 0 ? 'out' : mat.quantidade_estoque <= mat.estoque_minimo ? 'low' : 'ok'
                  const margin = calcMargin(Number(mat.preco_compra), Number(mat.preco_venda))
                  return (
                    <motion.div key={mat.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                      <div className="flex items-start justify-between mb-4">
                        <div className="min-w-0">
                          <span className="text-xs font-mono font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{mat.sku}</span>
                          <h3 className="font-semibold text-gray-900 mt-1 truncate">{mat.nome}</h3>
                          {mat.descricao && <p className="text-xs text-gray-400 truncate">{mat.descricao}</p>}
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${statusMeta[st].bg}`}>{statusMeta[st].label}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="text-center p-2 bg-orange-50 rounded-xl">
                          <p className="text-xs text-orange-500 mb-0.5">Custo</p>
                          <p className="text-sm font-bold text-orange-700">{fmtCurrency(Number(mat.preco_compra))}</p>
                        </div>
                        <div className="text-center p-2 bg-emerald-50 rounded-xl">
                          <p className="text-xs text-emerald-500 mb-0.5">Venda</p>
                          <p className="text-sm font-bold text-emerald-700">{fmtCurrency(Number(mat.preco_venda))}</p>
                        </div>
                        <div className={`text-center p-2 rounded-xl ${margin >= 30 ? 'bg-green-50' : margin >= 15 ? 'bg-yellow-50' : 'bg-red-50'}`}>
                          <p className="text-xs text-gray-500 mb-0.5">Margem</p>
                          <p className={`text-sm font-bold ${margin >= 30 ? 'text-green-700' : margin >= 15 ? 'text-yellow-700' : 'text-red-700'}`}>{margin.toFixed(1)}%</p>
                        </div>
                      </div>

                      <StockBar qty={mat.quantidade_estoque} min={mat.estoque_minimo} />

                      <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-gray-50">
                        <button onClick={() => { setEditingMat(mat); setMatForm({ sku: mat.sku, nome: mat.nome, descricao: mat.descricao || '', preco_compra: Number(mat.preco_compra), preco_venda: Number(mat.preco_venda), quantidade_estoque: mat.quantidade_estoque, estoque_minimo: mat.estoque_minimo, unidade_medida: mat.unidade_medida, active: mat.active }); setShowMatModal(true) }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                          <Edit className="h-3.5 w-3.5" />Editar
                        </button>
                        <button onClick={() => handleDeleteMat(mat.id)} className="flex items-center justify-center p-1.5 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['SKU', 'Material', 'Custo', 'Venda', 'Margem', 'Estoque', 'Status', 'Investido', 'Ações'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredMat.map(mat => {
                      const st = mat.quantidade_estoque === 0 ? 'out' : mat.quantidade_estoque <= mat.estoque_minimo ? 'low' : 'ok'
                      const margin = Number(mat.margem_lucro) || calcMargin(Number(mat.preco_compra), Number(mat.preco_venda))
                      return (
                        <tr key={mat.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3"><span className="font-mono text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{mat.sku}</span></td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900 text-sm">{mat.nome}</p>
                            {mat.descricao && <p className="text-xs text-gray-400">{mat.descricao}</p>}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-orange-600">{fmtCurrency(Number(mat.preco_compra))}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-emerald-600">{fmtCurrency(Number(mat.preco_venda))}</td>
                          <td className="px-4 py-3">
                            <span className={`flex items-center gap-0.5 text-sm font-bold ${margin >= 30 ? 'text-green-600' : margin >= 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                              <Percent className="h-3 w-3" />{margin.toFixed(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-semibold text-gray-900">{mat.quantidade_estoque} {mat.unidade_medida}</p>
                            <p className="text-xs text-gray-400">Mín: {mat.estoque_minimo}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusMeta[st].bg}`}>{statusMeta[st].label}</span>
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-700">{fmtCurrency(Number(mat.preco_compra) * mat.quantidade_estoque)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button onClick={() => { setEditingMat(mat); setMatForm({ sku: mat.sku, nome: mat.nome, descricao: mat.descricao || '', preco_compra: Number(mat.preco_compra), preco_venda: Number(mat.preco_venda), quantidade_estoque: mat.quantidade_estoque, estoque_minimo: mat.estoque_minimo, unidade_medida: mat.unidade_medida, active: mat.active }); setShowMatModal(true) }}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit className="h-3.5 w-3.5" /></button>
                              <button onClick={() => handleDeleteMat(mat.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Inventory Add/Edit Modal ─────────────────────────────────────────── */}
      {[{ show: showAddModal, onClose: () => setShowAddModal(false), title: 'Novo Item de Estoque', data: newItem, setData: setNewItem, onSave: handleAddItem },
        { show: showEditModal && !!selectedItem, onClose: () => { setShowEditModal(false); setSelectedItem(null) }, title: 'Editar Item', data: selectedItem || blankItem, setData: (v: any) => setSelectedItem(v), onSave: handleUpdateItem }
      ].map(({ show, onClose, title, data, setData, onSave }, mi) => (
        <AnimatePresence key={mi}>
          {show && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 12 }}
                className="relative bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                  <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="h-5 w-5 text-gray-400" /></button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
                      <input value={data.name} onChange={e => setData({ ...data, name: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none" placeholder="Nome do item" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Categoria *</label>
                      <input value={data.category} onChange={e => setData({ ...data, category: e.target.value })} list={`cats-${mi}`} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none" placeholder="Categoria" />
                      <datalist id={`cats-${mi}`}>{invCategories.filter(c => c !== 'all').map(c => <option key={c} value={c} />)}</datalist>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">SKU</label>
                      <input value={data.sku || ''} onChange={e => setData({ ...data, sku: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none font-mono" placeholder="Opcional" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Quantidade</label>
                      <input type="number" value={data.quantity} onChange={e => setData({ ...data, quantity: parseFloat(e.target.value) || 0 })} min="0" step="0.01" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Estoque Mínimo</label>
                      <input type="number" value={data.min_stock} onChange={e => setData({ ...data, min_stock: parseFloat(e.target.value) || 0 })} min="0" step="0.01" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Unidade</label>
                      <select value={(data as any).unit || 'un'} onChange={e => setData({ ...data, unit: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none">
                        {['un','m','m2','kg','l','cx','pc','par','rolo','pct'].map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Custo (R$)</label>
                      <input type="number" value={(data as any).cost || 0} onChange={e => setData({ ...data, cost: parseFloat(e.target.value) || 0 })} min="0" step="0.01" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Preço de Venda (R$)</label>
                      <input type="number" value={data.price} onChange={e => setData({ ...data, price: parseFloat(e.target.value) || 0 })} min="0" step="0.01" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Fornecedor *</label>
                      <input value={data.supplier} onChange={e => setData({ ...data, supplier: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none" placeholder="Nome do fornecedor" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Localização</label>
                      <input value={data.location || ''} onChange={e => setData({ ...data, location: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none" placeholder="Ex: Prateleira A3" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Descrição</label>
                      <textarea value={data.description || ''} onChange={e => setData({ ...data, description: e.target.value })} rows={2} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none resize-none" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={onClose} className="flex-1 py-2.5 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600">Cancelar</button>
                  <button onClick={onSave} className="flex-1 py-2.5 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2">
                    <Save className="h-4 w-4" />Salvar
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      ))}

      {/* ── Material Add/Edit Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showMatModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowMatModal(false); setEditingMat(null) }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="relative bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">{editingMat ? 'Editar Material' : 'Novo Material'}</h2>
                <button onClick={() => { setShowMatModal(false); setEditingMat(null) }} className="p-2 hover:bg-gray-100 rounded-xl"><X className="h-5 w-5 text-gray-400" /></button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">SKU *</label>
                    <input value={matForm.sku} onChange={e => setMatForm({ ...matForm, sku: e.target.value.toUpperCase() })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none font-mono" placeholder="MAT-001" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Unidade</label>
                    <select value={matForm.unidade_medida} onChange={e => setMatForm({ ...matForm, unidade_medida: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none">
                      {['UN','KG','MT','LT','CX','PC'].map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
                    <input value={matForm.nome} onChange={e => setMatForm({ ...matForm, nome: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none" placeholder="Filtro de Ar 12k BTU" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Descrição</label>
                    <textarea value={matForm.descricao} onChange={e => setMatForm({ ...matForm, descricao: e.target.value })} rows={2} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none resize-none" />
                  </div>
                  <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                    <label className="block text-xs font-medium text-orange-600 mb-1">Preço de Compra (Custo)</label>
                    <input type="number" value={matForm.preco_compra || ''} onChange={e => setMatForm({ ...matForm, preco_compra: Number(e.target.value) })} step="0.01" min="0" className="w-full px-3 py-2 text-sm border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none" placeholder="0,00" />
                  </div>
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <label className="block text-xs font-medium text-emerald-600 mb-1">Preço de Venda</label>
                    <input type="number" value={matForm.preco_venda || ''} onChange={e => setMatForm({ ...matForm, preco_venda: Number(e.target.value) })} step="0.01" min="0" className="w-full px-3 py-2 text-sm border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-400 outline-none" placeholder="0,00" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Qtd em Estoque</label>
                    <input type="number" value={matForm.quantidade_estoque || ''} onChange={e => setMatForm({ ...matForm, quantidade_estoque: Number(e.target.value) })} min="0" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Estoque Mínimo</label>
                    <input type="number" value={matForm.estoque_minimo || ''} onChange={e => setMatForm({ ...matForm, estoque_minimo: Number(e.target.value) })} min="0" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none" />
                  </div>
                </div>
                {matForm.preco_compra > 0 && matForm.preco_venda > 0 && (
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-2xl p-4">
                    <p className="text-xs font-semibold text-purple-600 mb-3 uppercase tracking-wide">Análise de Margem</p>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-xl font-bold text-purple-700">{calcMargin(matForm.preco_compra, matForm.preco_venda).toFixed(1)}%</p>
                        <p className="text-xs text-gray-500">Margem</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-emerald-700">{fmtCurrency(matForm.preco_venda - matForm.preco_compra)}</p>
                        <p className="text-xs text-gray-500">Lucro unit.</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-blue-700">{fmtCurrency(matForm.preco_compra * matForm.quantidade_estoque)}</p>
                        <p className="text-xs text-gray-500">Investido total</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => { setShowMatModal(false); setEditingMat(null) }} className="flex-1 py-2.5 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600">Cancelar</button>
                <button onClick={handleSaveMat} className="flex-1 py-2.5 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2">
                  <Save className="h-4 w-4" />Salvar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirm ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteConfirmId(null)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center gap-3 mb-3 text-red-600">
                <AlertTriangle className="h-7 w-7" />
                <h3 className="text-lg font-bold">Confirmar Exclusão</h3>
              </div>
              <p className="text-sm text-gray-600 mb-5">Esta ação não pode ser desfeita.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-2.5 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600">Cancelar</button>
                <button onClick={() => deleteConfirmId && handleDeleteItem(deleteConfirmId)} className="flex-1 py-2.5 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium">Excluir</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── PDF Progress ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isGeneratingPDF && (
          <motion.div initial={{ opacity: 0, y: 48 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 48 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-72 z-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-800">Gerando Relatório</span>
              {pdfProgress === 100 && <CheckCircle className="h-4 w-4 text-emerald-500" />}
            </div>
            <div className="flex items-center gap-3">
              {pdfProgress < 100 ? <Loader className="h-4 w-4 text-blue-500 animate-spin flex-shrink-0" /> : null}
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pdfProgress}%` }} />
              </div>
              <span className="text-xs font-medium text-gray-500">{pdfProgress}%</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
