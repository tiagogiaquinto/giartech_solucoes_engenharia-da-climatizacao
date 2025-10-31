import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Package, Plus, CreditCard as Edit, Trash2, Search, CircleAlert as AlertCircle, DollarSign, CircleCheck as CheckCircle, Circle as XCircle, Box, TrendingUp, ShoppingCart, Percent } from 'lucide-react'
import { supabase } from '../lib/supabase'

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

const Materials = () => {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)

  const [formData, setFormData] = useState({
    sku: '',
    nome: '',
    descricao: '',
    preco_compra: 0,
    preco_venda: 0,
    quantidade_estoque: 0,
    estoque_minimo: 0,
    unidade_medida: 'UN',
    active: true
  })

  useEffect(() => {
    loadMaterials()
  }, [])

  const loadMaterials = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('nome')

      if (error) throw error
      setMaterials(data || [])
    } catch (error) {
      console.error('Error loading materials:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      if (!formData.sku || !formData.nome) {
        alert('SKU e Nome são obrigatórios!')
        return
      }

      if (editingMaterial) {
        const { error } = await supabase
          .from('materials')
          .update(formData)
          .eq('id', editingMaterial.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('materials')
          .insert([formData])
        if (error) throw error
      }

      setShowModal(false)
      setEditingMaterial(null)
      resetForm()
      loadMaterials()
    } catch (error) {
      console.error('Error saving material:', error)
      alert('Erro ao salvar material!')
    }
  }

  const handleEdit = (material: Material) => {
    setEditingMaterial(material)
    setFormData({
      sku: material.sku,
      nome: material.nome,
      descricao: material.descricao || '',
      preco_compra: Number(material.preco_compra),
      preco_venda: Number(material.preco_venda),
      quantidade_estoque: material.quantidade_estoque,
      estoque_minimo: material.estoque_minimo,
      unidade_medida: material.unidade_medida,
      active: material.active
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este material?')) return

    try {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadMaterials()
    } catch (error) {
      console.error('Error deleting material:', error)
      alert('Erro ao excluir material!')
    }
  }

  const resetForm = () => {
    setFormData({
      sku: '',
      nome: '',
      descricao: '',
      preco_compra: 0,
      preco_venda: 0,
      quantidade_estoque: 0,
      estoque_minimo: 0,
      unidade_medida: 'UN',
      active: true
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getStockStatus = (quantity: number, minimum: number) => {
    if (quantity === 0) return { color: 'red', icon: XCircle, label: 'SEM ESTOQUE' }
    if (quantity <= minimum) return { color: 'yellow', icon: AlertCircle, label: 'BAIXO' }
    return { color: 'green', icon: CheckCircle, label: 'OK' }
  }

  const calculateMargin = (compra: number, venda: number) => {
    if (compra === 0) return 0
    return ((venda - compra) / compra) * 100
  }

  const filteredMaterials = materials.filter(material =>
    material.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: materials.length,
    valorInvestido: materials.reduce((sum, m) => sum + (Number(m.preco_compra) * m.quantidade_estoque), 0),
    valorVenda: materials.reduce((sum, m) => sum + (Number(m.preco_venda) * m.quantidade_estoque), 0),
    lucroEstimado: 0,
    semEstoque: materials.filter(m => m.quantidade_estoque === 0).length,
    estoqueAbaixo: materials.filter(m => m.quantidade_estoque > 0 && m.quantidade_estoque <= m.estoque_minimo).length
  }

  stats.lucroEstimado = stats.valorVenda - stats.valorInvestido

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
            <Package className="h-8 w-8 text-blue-600" />
            Gestão de Materiais e Estoque
          </h1>
          <p className="text-gray-600 mt-1">Controle completo com precificação e margem de lucro</p>
        </div>
        <button
          onClick={() => {
            setEditingMaterial(null)
            resetForm()
            setShowModal(true)
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Material
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Box className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total de Itens</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Investido</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.valorInvestido)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Valor de Venda</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.valorVenda)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Lucro Estimado</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.lucroEstimado)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Alertas</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.semEstoque + stats.estoqueAbaixo}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compra</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Venda</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Margem</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estoque</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Investido</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMaterials.map((material) => {
                const status = getStockStatus(material.quantidade_estoque, material.estoque_minimo)
                const StatusIcon = status.icon
                const valorInvestido = Number(material.preco_compra) * material.quantidade_estoque
                const margem = Number(material.margem_lucro) || calculateMargin(Number(material.preco_compra), Number(material.preco_venda))

                return (
                  <motion.tr
                    key={material.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono font-semibold text-gray-900">{material.sku}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{material.nome}</p>
                        {material.descricao && (
                          <p className="text-xs text-gray-500">{material.descricao}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm text-orange-600 font-semibold">{formatCurrency(Number(material.preco_compra))}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm text-green-600 font-semibold">{formatCurrency(Number(material.preco_venda))}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Percent className="h-3 w-3 text-purple-600" />
                        <span className={`text-sm font-bold ${margem >= 30 ? 'text-green-600' : margem >= 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {margem.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {material.quantidade_estoque} {material.unidade_medida}
                      </span>
                      <p className="text-xs text-gray-500">Mín: {material.estoque_minimo}</p>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-${status.color}-100 text-${status.color}-700`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(valorInvestido)}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(material)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(material.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>

          {filteredMaterials.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum material encontrado</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingMaterial ? 'Editar Material' : 'Novo Material'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingMaterial(null)
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="MAT-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidade *</label>
                  <select
                    value={formData.unidade_medida}
                    onChange={(e) => setFormData({ ...formData, unidade_medida: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="UN">Unidade (UN)</option>
                    <option value="KG">Quilograma (KG)</option>
                    <option value="MT">Metro (MT)</option>
                    <option value="LT">Litro (LT)</option>
                    <option value="CX">Caixa (CX)</option>
                    <option value="PC">Peça (PC)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Material *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Filtro de Ar 12k BTU"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Descrição detalhada do material..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <label className="block text-sm font-medium text-orange-700 mb-1">Preço de Compra (Custo) *</label>
                  <input
                    type="number"
                    value={formData.preco_compra || ''}
                    onChange={(e) => setFormData({ ...formData, preco_compra: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                  />
                  <p className="text-xs text-orange-600 mt-1">Valor que você paga ao fornecedor</p>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <label className="block text-sm font-medium text-green-700 mb-1">Preço de Venda *</label>
                  <input
                    type="number"
                    value={formData.preco_venda || ''}
                    onChange={(e) => setFormData({ ...formData, preco_venda: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                  />
                  <p className="text-xs text-green-600 mt-1">Valor que você cobra do cliente</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade em Estoque *</label>
                  <input
                    type="number"
                    value={formData.quantidade_estoque || ''}
                    onChange={(e) => setFormData({ ...formData, quantidade_estoque: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estoque Mínimo *</label>
                  <input
                    type="number"
                    value={formData.estoque_minimo || ''}
                    onChange={(e) => setFormData({ ...formData, estoque_minimo: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    placeholder="0"
                  />
                </div>
              </div>

              {formData.preco_compra > 0 && formData.preco_venda > 0 && (
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-purple-700 mb-1">Margem de Lucro</p>
                      <p className="text-3xl font-bold text-purple-900">
                        {calculateMargin(formData.preco_compra, formData.preco_venda).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-700 mb-1">Lucro Unitário</p>
                      <p className="text-3xl font-bold text-purple-900">
                        {formatCurrency(formData.preco_venda - formData.preco_compra)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-700 mb-1">Investido Total</p>
                      <p className="text-3xl font-bold text-purple-900">
                        {formatCurrency(formData.preco_compra * formData.quantidade_estoque)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="ativo" className="text-sm font-medium text-gray-700">
                  Material ativo
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingMaterial(null)
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

export default Materials
