import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, CreditCard as Edit, Trash2, Eye, FolderPlus, TrendingUp, TrendingDown, Tag, Folder, ChevronRight, Search, DollarSign } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface FinancialCategory {
  id: string
  name: string
  type: 'receita' | 'despesa'
  color: string
  icon: string
  parent_id: string | null
  active: boolean
  created_at: string
  updated_at: string
  subcategories?: FinancialCategory[]
}

const FinancialCategories = () => {
  const [categories, setCategories] = useState<FinancialCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<FinancialCategory | null>(null)
  const [viewingCategory, setViewingCategory] = useState<FinancialCategory | null>(null)
  const [filterType, setFilterType] = useState<'all' | 'receita' | 'despesa'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const [formData, setFormData] = useState({
    name: '',
    type: 'receita' as 'receita' | 'despesa',
    color: '#10b981',
    icon: 'tag',
    parent_id: null as string | null,
    active: true
  })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('financial_categories')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error

      const categoriesMap = new Map<string, FinancialCategory>()
      data?.forEach(cat => {
        categoriesMap.set(cat.id, { ...cat, subcategories: [] })
      })

      const rootCategories: FinancialCategory[] = []
      categoriesMap.forEach(cat => {
        if (cat.parent_id) {
          const parent = categoriesMap.get(cat.parent_id)
          if (parent) {
            parent.subcategories = parent.subcategories || []
            parent.subcategories.push(cat)
          }
        } else {
          rootCategories.push(cat)
        }
      })

      setCategories(rootCategories)
    } catch (error) {
      console.error('Error loading categories:', error)
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
        type: formData.type,
        color: formData.color,
        icon: formData.icon,
        parent_id: formData.parent_id || null,
        active: formData.active
      }

      if (editingCategory) {
        const { error } = await supabase
          .from('financial_categories')
          .update({
            ...dataToSave,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCategory.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('financial_categories')
          .insert([dataToSave])

        if (error) throw error
      }

      loadCategories()
      closeModal()
    } catch (error) {
      console.error('Error saving category:', error)
      alert('Erro ao salvar categoria!')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return

    try {
      const { error } = await supabase
        .from('financial_categories')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Erro ao excluir categoria! Verifique se não existem lançamentos vinculados.')
    }
  }

  const openModal = (category?: FinancialCategory, parentId?: string) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        name: category.name,
        type: category.type,
        color: category.color,
        icon: category.icon,
        parent_id: category.parent_id,
        active: category.active
      })
    } else {
      setEditingCategory(null)
      setFormData({
        name: '',
        type: 'receita',
        color: '#10b981',
        icon: 'tag',
        parent_id: parentId || null,
        active: true
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingCategory(null)
    setViewingCategory(null)
  }

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const filteredCategories = categories.filter(cat => {
    const matchesType = filterType === 'all' || cat.type === filterType
    const matchesSearch = cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesType && matchesSearch
  })

  const colors = [
    { value: '#10b981', label: 'Verde' },
    { value: '#3b82f6', label: 'Azul' },
    { value: '#ef4444', label: 'Vermelho' },
    { value: '#f59e0b', label: 'Laranja' },
    { value: '#8b5cf6', label: 'Roxo' },
    { value: '#ec4899', label: 'Rosa' },
    { value: '#06b6d4', label: 'Ciano' },
    { value: '#6366f1', label: 'Índigo' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Folder className="h-8 w-8 text-blue-600" />
            Categorias de Lançamento
          </h1>
          <p className="text-gray-600 mt-1">Gerencie categorias e subcategorias de receitas e despesas</p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nova Categoria
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar categorias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilterType('receita')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                filterType === 'receita'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              Receitas
            </button>
            <button
              onClick={() => setFilterType('despesa')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                filterType === 'despesa'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <TrendingDown className="h-4 w-4" />
              Despesas
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCategories.map((category) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    {category.type === 'receita' ? (
                      <TrendingUp className="h-6 w-6" style={{ color: category.color }} />
                    ) : (
                      <TrendingDown className="h-6 w-6" style={{ color: category.color }} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{category.name}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          category.type === 'receita'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {category.type === 'receita' ? 'Receita' : 'Despesa'}
                      </span>
                      {category.subcategories && category.subcategories.length > 0 && (
                        <span className="text-xs text-gray-500">
                          {category.subcategories.length} subcategorias
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setViewingCategory(category)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Visualizar"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => openModal(category)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {category.subcategories && category.subcategories.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => toggleExpanded(category.id)}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <ChevronRight
                      className={`h-4 w-4 transition-transform ${
                        expandedCategories.has(category.id) ? 'rotate-90' : ''
                      }`}
                    />
                    Ver subcategorias
                  </button>

                  {expandedCategories.has(category.id) && (
                    <div className="mt-2 space-y-2">
                      {category.subcategories.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-700">{sub.name}</span>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => openModal(sub)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Editar"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDelete(sub.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Excluir"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => openModal(undefined, category.id)}
                className="mt-3 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <FolderPlus className="h-4 w-4" />
                Adicionar Subcategoria
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg">
          <Folder className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma categoria encontrada</h3>
          <p className="text-gray-600 mb-4">Crie sua primeira categoria de lançamento</p>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Categoria
          </button>
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <h2 className="text-2xl font-bold">
                  {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  {formData.parent_id
                    ? 'Criando subcategoria'
                    : 'Categoria principal de lançamentos'}
                </p>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Categoria <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Serviços Prestados"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'receita' })}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        formData.type === 'receita'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="font-medium text-gray-900">Receita</p>
                      <p className="text-xs text-gray-600">Entrada de dinheiro</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'despesa' })}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        formData.type === 'despesa'
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <TrendingDown className="h-8 w-8 text-red-600 mx-auto mb-2" />
                      <p className="font-medium text-gray-900">Despesa</p>
                      <p className="text-xs text-gray-600">Saída de dinheiro</p>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cor
                  </label>
                  <div className="grid grid-cols-8 gap-2">
                    {colors.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: color.value })}
                        className={`w-10 h-10 rounded-lg transition-all ${
                          formData.color === color.value
                            ? 'ring-2 ring-offset-2 ring-blue-500 scale-110'
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="active" className="text-sm text-gray-700">
                    Categoria ativa
                  </label>
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex gap-3 justify-end">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <DollarSign className="h-4 w-4" />
                  Salvar Categoria
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingCategory && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl w-full max-w-2xl"
            >
              <div
                className="p-6 border-b text-white"
                style={{ background: `linear-gradient(135deg, ${viewingCategory.color} 0%, ${viewingCategory.color}dd 100%)` }}
              >
                <div className="flex items-center gap-4">
                  {viewingCategory.type === 'receita' ? (
                    <TrendingUp className="h-12 w-12" />
                  ) : (
                    <TrendingDown className="h-12 w-12" />
                  )}
                  <div>
                    <h2 className="text-2xl font-bold">{viewingCategory.name}</h2>
                    <p className="text-white/80 text-sm">
                      {viewingCategory.type === 'receita' ? 'Categoria de Receita' : 'Categoria de Despesa'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Tipo</p>
                    <p className="font-medium capitalize">{viewingCategory.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      viewingCategory.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {viewingCategory.active ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Cor</p>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: viewingCategory.color }}
                      />
                      <span className="font-mono text-sm">{viewingCategory.color}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Subcategorias</p>
                    <p className="font-medium">
                      {viewingCategory.subcategories?.length || 0}
                    </p>
                  </div>
                </div>

                {viewingCategory.subcategories && viewingCategory.subcategories.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Subcategorias:</p>
                    <div className="space-y-2">
                      {viewingCategory.subcategories.map((sub) => (
                        <div key={sub.id} className="p-3 bg-gray-50 rounded-lg flex items-center gap-2">
                          <Tag className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium">{sub.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t bg-gray-50 flex gap-3 justify-end">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Fechar
                </button>
                <button
                  onClick={() => {
                    openModal(viewingCategory)
                    setViewingCategory(null)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default FinancialCategories
