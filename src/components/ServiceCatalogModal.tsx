import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Plus, Trash2, Package, Users, Clock, DollarSign, CircleAlert as AlertCircle, Info, TrendingUp, Calculator } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface MaterialItem {
  id: string
  material_id: string
  nome_material: string
  quantidade_padrao: number
  unidade_medida: string
  preco_compra_unitario: number
  preco_venda_unitario: number
  custo_total: number
  valor_total: number
  lucro: number
  obrigatorio: boolean
}

interface ServiceCatalogModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  serviceId?: string
  duplicateFromId?: string
}

const ServiceCatalogModal = ({ isOpen, onClose, onSave, serviceId, duplicateFromId }: ServiceCatalogModalProps) => {
  const [activeTab, setActiveTab] = useState<'dados' | 'materiais' | 'resumo'>('dados')
  const [loading, setLoading] = useState(false)
  const [showNewMaterialModal, setShowNewMaterialModal] = useState(false)

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    categoria: '',
    preco_base: 0,
    tempo_estimado_minutos: 0,
    observacoes: ''
  })

  const [newMaterialData, setNewMaterialData] = useState({
    name: '',
    sku: '',
    unit: 'UN',
    quantity: 0,
    unit_cost: 0,
    sale_price: 0,
    min_quantity: 0
  })

  const [materials, setMaterials] = useState<any[]>([])
  const [serviceMaterials, setServiceMaterials] = useState<MaterialItem[]>([])

  const [materialSearch, setMaterialSearch] = useState('')
  const [activeMaterialSearchId, setActiveMaterialSearchId] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadMaterials()
      if (serviceId) {
        loadServiceData(serviceId, false)
      } else if (duplicateFromId) {
        loadServiceData(duplicateFromId, true)
      } else {
        setFormData({
          nome: '',
          descricao: '',
          categoria: '',
          preco_base: 0,
          tempo_estimado_minutos: 0,
          observacoes: ''
        })
        setServiceMaterials([])
      }
    } else {
      setActiveMaterialSearchId(null)
      setMaterialSearch('')
    }
  }, [isOpen, serviceId, duplicateFromId])

  const loadMaterials = async () => {
    try {
      const { data } = await supabase
        .from('materials')
        .select('id, name, unit, quantity, unit_cost, sale_price, sku')
        .eq('active', true)
        .order('name')

      setMaterials(data || [])
    } catch (error) {
      console.error('Error loading materials:', error)
    }
  }

  const loadServiceData = async (idToLoad: string, isDuplicate: boolean) => {
    if (!idToLoad) return

    try {
      const { data: service } = await supabase
        .from('service_catalog')
        .select('*')
        .eq('id', idToLoad)
        .single()

      if (service) {
        setFormData({
          nome: isDuplicate ? `${service.name} (Cópia)` : (service.name || ''),
          descricao: service.description || '',
          categoria: service.category || '',
          preco_base: service.base_price || 0,
          tempo_estimado_minutos: service.estimated_duration || 0,
          observacoes: ''
        })
      }

      const { data: mats } = await supabase
        .from('service_catalog_materials')
        .select('*')
        .eq('service_catalog_id', idToLoad)

      if (mats) {
        setServiceMaterials(mats.map(m => ({
          id: isDuplicate ? `new-${Date.now()}-${Math.random()}` : m.id,
          material_id: m.material_id || '',
          nome_material: m.material_name || '',
          quantidade_padrao: m.quantity || 0,
          unidade_medida: m.material_unit || 'un',
          preco_compra_unitario: m.unit_cost_at_time || 0,
          preco_venda_unitario: m.unit_sale_price || 0,
          custo_total: m.total_cost || 0,
          valor_total: m.total_sale_price || 0,
          lucro: (m.total_sale_price || 0) - (m.total_cost || 0),
          obrigatorio: !m.is_optional
        })))
      }

    } catch (error) {
      console.error('Error loading service data:', error)
    }
  }

  const addMaterial = () => {
    setServiceMaterials([{
      id: `new-${Date.now()}`,
      material_id: '',
      nome_material: '',
      quantidade_padrao: 1,
      unidade_medida: 'UN',
      preco_compra_unitario: 0,
      preco_venda_unitario: 0,
      custo_total: 0,
      valor_total: 0,
      lucro: 0,
      obrigatorio: true
    }, ...serviceMaterials])
  }

  const updateMaterial = (id: string, updates: Partial<MaterialItem>) => {
    setServiceMaterials(serviceMaterials.map(m => {
      if (m.id === id) {
        const updated = { ...m, ...updates }

        const precoCompra = updated.preco_compra_unitario || 0
        const precoVenda = updated.preco_venda_unitario || 0

        updated.custo_total = updated.quantidade_padrao * precoCompra
        updated.valor_total = updated.quantidade_padrao * precoVenda
        updated.lucro = updated.valor_total - updated.custo_total

        return updated
      }
      return m
    }))
  }

  const selectMaterial = (id: string, materialId: string) => {
    const material = materials.find(m => m.id === materialId)
    if (!material) return

    updateMaterial(id, {
      material_id: materialId,
      nome_material: material.name,
      unidade_medida: material.unit || 'un',
      preco_compra_unitario: Number(material.unit_cost) || 0,
      preco_venda_unitario: Number(material.sale_price) || 0
    })
    setMaterialSearch('')
    setActiveMaterialSearchId(null)
  }

  const removeMaterial = (id: string) => {
    setServiceMaterials(serviceMaterials.filter(m => m.id !== id))
  }

  const handleCreateNewMaterial = async () => {
    try {
      if (!newMaterialData.name) {
        alert('Nome do material é obrigatório!')
        return
      }

      setLoading(true)

      const { data, error } = await supabase
        .from('materials')
        .insert([{
          name: newMaterialData.name,
          sku: newMaterialData.sku || null,
          unit: newMaterialData.unit,
          quantity: Number(newMaterialData.quantity),
          unit_cost: Number(newMaterialData.unit_cost),
          sale_price: Number(newMaterialData.sale_price),
          min_quantity: Number(newMaterialData.min_quantity),
          active: true
        }])
        .select()
        .single()

      if (error) throw error

      await loadMaterials()

      setNewMaterialData({
        name: '',
        sku: '',
        unit: 'UN',
        quantity: 0,
        unit_cost: 0,
        sale_price: 0,
        min_quantity: 0
      })

      setShowNewMaterialModal(false)
      alert('Material criado com sucesso!')
    } catch (error) {
      console.error('Error creating material:', error)
      alert('Erro ao criar material!')
    } finally {
      setLoading(false)
    }
  }

  const calculateTotals = () => {
    const custoMateriais = serviceMaterials.reduce((sum, m) => sum + m.custo_total, 0)
    const valorMateriais = serviceMaterials.reduce((sum, m) => sum + m.valor_total, 0)
    const custoTotal = custoMateriais
    const valorTotal = valorMateriais + formData.preco_base
    const lucroTotal = valorTotal - custoTotal
    const margemLucro = custoTotal > 0 ? (lucroTotal / custoTotal) * 100 : 0

    return {
      custoMateriais,
      valorMateriais,
      custoTotal,
      valorTotal,
      lucroTotal,
      margemLucro
    }
  }

  const handleSave = async () => {
    try {
      if (!formData.nome) {
        alert('Nome do serviço é obrigatório!')
        return
      }

      setLoading(true)

      const totals = calculateTotals()

      let serviceIdToUse = serviceId

      const serviceData = {
        name: formData.nome,
        description: formData.descricao,
        category: formData.categoria,
        base_price: formData.preco_base,
        estimated_duration: formData.tempo_estimado_minutos,
        active: true
      }

      if (serviceId) {
        await supabase
          .from('service_catalog')
          .update(serviceData)
          .eq('id', serviceId)
      } else {
        const { data, error } = await supabase
          .from('service_catalog')
          .insert([serviceData])
          .select()
          .single()

        if (error) throw error
        serviceIdToUse = data.id
      }

      const { error: deleteMaterialsError } = await supabase
        .from('service_catalog_materials')
        .delete()
        .eq('service_catalog_id', serviceIdToUse)

      if (deleteMaterialsError) {
        console.error('Error deleting materials:', deleteMaterialsError)
      }

      for (const mat of serviceMaterials) {
        const { error: insertMaterialError } = await supabase
          .from('service_catalog_materials')
          .insert([{
            service_catalog_id: serviceIdToUse,
            material_id: mat.material_id,
            material_name: mat.nome_material,
            quantity: mat.quantidade_padrao,
            material_unit: mat.unidade_medida,
            is_optional: !mat.obrigatorio,
            unit_cost_at_time: mat.preco_compra_unitario,
            unit_sale_price: mat.preco_venda_unitario
          }])

        if (insertMaterialError) {
          console.error('Error inserting material:', insertMaterialError)
          throw insertMaterialError
        }
      }

      onSave()
      onClose()
    } catch (error) {
      console.error('Error saving:', error)
      alert('Erro ao salvar serviço!')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const totals = calculateTotals()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div initial={{opacity: 0, scale: 0.95}} animate={{opacity: 1, scale: 1}}
        className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">

        <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-green-600 to-emerald-700 text-white">
          <div>
            <h2 className="text-2xl font-bold">{serviceId ? 'Editar Serviço' : 'Novo Serviço no Catálogo'}</h2>
            <p className="text-green-100 text-sm">Configure materiais, mão de obra e custos completos</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex border-b bg-gray-50">
          {[
            { id: 'dados', label: 'Dados Principais', icon: Info },
            { id: 'materiais', label: 'Materiais', icon: Package },
            { id: 'resumo', label: 'Resumo Financeiro', icon: Calculator }
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-6 py-4 font-medium text-sm flex items-center justify-center gap-2 border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-green-600 text-green-600 bg-white'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}>
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'dados' && (
              <motion.div key="dados" initial={{opacity: 0, x: -20}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: 20}} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Nome do Serviço *</label>
                    <input type="text" value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Ex: Instalação de Ar Condicionado Split 12k BTU" />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Descrição</label>
                    <textarea value={formData.descricao}
                      onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      rows={3}
                      placeholder="Descreva o serviço em detalhes..." />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Categoria</label>
                    <select value={formData.categoria}
                      onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500">
                      <option value="">Selecione...</option>
                      <option value="instalacao">Instalação</option>
                      <option value="manutencao">Manutenção</option>
                      <option value="reparo">Reparo</option>
                      <option value="limpeza">Limpeza</option>
                      <option value="vistoria">Vistoria</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Tempo Estimado (minutos)</label>
                    <input type="number" value={formData.tempo_estimado_minutos}
                      onChange={(e) => setFormData({...formData, tempo_estimado_minutos: Number(e.target.value)})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Preço Base do Serviço (R$)</label>
                    <input type="number" value={formData.preco_base} step="0.01"
                      onChange={(e) => setFormData({...formData, preco_base: Number(e.target.value)})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Valor da mão de obra" />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Observações</label>
                    <textarea value={formData.observacoes}
                      onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      rows={2}
                      placeholder="Observações internas sobre o serviço..." />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">Configure o serviço completo</p>
                    <p>Nas próximas abas, você pode adicionar materiais e mão de obra. <span className="font-medium">Ambos são opcionais</span> - você pode criar serviços sem materiais ou sem mão de obra, dependendo do tipo de serviço.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'materiais' && (
              <motion.div key="materiais" initial={{opacity: 0, x: -20}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: 20}} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Materiais Necessários <span className="text-sm text-gray-500 font-normal">(Opcional)</span></h3>
                    <p className="text-sm text-gray-600">Liste todos os materiais usados neste serviço. Ex: Consultoria, Vistoria, Laudo não precisam de materiais.</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowNewMaterialModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Criar Novo Material
                    </button>
                    <button onClick={addMaterial}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Adicionar do Estoque
                    </button>
                  </div>
                </div>

                {serviceMaterials.length === 0 && (
                  <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">Nenhum material adicionado</p>
                    <p className="text-sm">Materiais são opcionais para este serviço</p>
                    <p className="text-xs mt-1 text-gray-400">Clique em "Adicionar Material" se o serviço precisar de materiais</p>
                  </div>
                )}

                {serviceMaterials.map((material, index) => (
                  <div key={material.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          Material #{index + 1}
                          {material.nome_material && (
                            <span className="ml-2 text-green-600">- {material.nome_material}</span>
                          )}
                        </h4>
                        {material.material_id && !material.nome_material && (
                          <span className="text-xs text-gray-500">Material selecionado</span>
                        )}
                      </div>
                      <button onClick={() => removeMaterial(material.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-3">
                      <div className="md:col-span-3 relative">
                        <label className="block text-sm font-medium mb-1">🔍 Buscar Material do Estoque</label>
                        <input type="text" value={materialSearch}
                          onChange={(e) => setMaterialSearch(e.target.value)}
                          onFocus={() => setActiveMaterialSearchId(material.id)}
                          className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-green-500"
                          placeholder="Digite para buscar no estoque..." />

                        {materialSearch && activeMaterialSearchId === material.id && materials.filter(m =>
                          m.name.toLowerCase().includes(materialSearch.toLowerCase()) ||
                          (m.sku && m.sku.toLowerCase().includes(materialSearch.toLowerCase()))
                        ).length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {materials.filter(m =>
                              m.name.toLowerCase().includes(materialSearch.toLowerCase()) ||
                              (m.sku && m.sku.toLowerCase().includes(materialSearch.toLowerCase()))
                            ).map(mat => (
                              <button
                                key={mat.id}
                                type="button"
                                onClick={() => selectMaterial(material.id, mat.id)}
                                className="w-full px-4 py-3 text-left hover:bg-green-50 border-b last:border-0 transition-colors"
                              >
                                <div className="font-medium text-gray-900">{mat.name}</div>
                                <div className="text-sm text-gray-600 flex items-center justify-between">
                                  <span>
                                    {mat.sku && <span className="mr-2">Cód: {mat.sku}</span>}
                                    <span>Estoque: {mat.quantity} {mat.unit}</span>
                                  </span>
                                  <span className="font-semibold text-green-600">
                                    R$ {Number(mat.sale_price).toFixed(2)}/{mat.unit}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="relative">
                        <label className="block text-sm font-medium mb-1">Quantidade</label>
                        <input type="number" value={material.quantidade_padrao} min="0.01" step="0.01"
                          onChange={(e) => updateMaterial(material.id, {quantidade_padrao: Number(e.target.value)})}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500" />
                        {material.unidade_medida && (
                          <span className="absolute right-3 top-9 text-xs text-gray-500 font-semibold">
                            {material.unidade_medida}
                          </span>
                        )}
                      </div>

                      <div className="md:col-span-2 flex items-end">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={material.obrigatorio}
                            onChange={(e) => updateMaterial(material.id, {obrigatorio: e.target.checked})}
                            className="w-4 h-4" />
                          <span className="text-sm">Obrigatório</span>
                        </label>
                      </div>
                    </div>

                    {material.material_id && (
                      <div className="grid grid-cols-5 gap-3 text-xs bg-white rounded p-3 border">
                        <div>
                          <span className="text-gray-500">Custo Unit:</span>
                          <p className="font-bold text-orange-600">{formatCurrency(material.preco_compra_unitario)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Venda Unit:</span>
                          <p className="font-bold text-green-600">{formatCurrency(material.preco_venda_unitario)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Custo Total:</span>
                          <p className="font-bold text-orange-700">{formatCurrency(material.custo_total)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Valor Total:</span>
                          <p className="font-bold text-green-700">{formatCurrency(material.valor_total)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Lucro:</span>
                          <p className="font-bold text-blue-700">{formatCurrency(material.lucro)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-green-900">Total Materiais:</span>
                    <div className="text-right">
                      <p className="text-sm text-green-700">Custo: {formatCurrency(totals.custoMateriais)}</p>
                      <p className="text-lg font-bold text-green-900">Venda: {formatCurrency(totals.valorMateriais)}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'resumo' && (
              <motion.div key="resumo" initial={{opacity: 0, x: -20}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: 20}} className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Resumo Financeiro Completo</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                        <h4 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                          <Package className="h-5 w-5" />
                          Custos de Materiais
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-700">Quantidade de Itens:</span>
                            <span className="font-semibold">{serviceMaterials.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700">Custo Total:</span>
                            <span className="font-bold text-orange-700">{formatCurrency(totals.custoMateriais)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700">Valor de Venda:</span>
                            <span className="font-bold text-green-700">{formatCurrency(totals.valorMateriais)}</span>
                          </div>
                        </div>
                      </div>

                    </div>

                    <div className="space-y-4">
                      <div className="bg-gray-100 rounded-lg p-4 border border-gray-300">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Calculator className="h-5 w-5" />
                          Totais do Serviço
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span>Custo Total (Materiais):</span>
                            <span className="font-bold text-gray-900">{formatCurrency(totals.custoTotal)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Preço Base do Serviço:</span>
                            <span className="font-bold text-gray-900">{formatCurrency(formData.preco_base)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Valor dos Materiais:</span>
                            <span className="font-bold text-gray-900">{formatCurrency(totals.valorMateriais)}</span>
                          </div>
                          <div className="border-t pt-3 flex justify-between">
                            <span className="font-semibold">Preço Total Sugerido:</span>
                            <span className="font-bold text-xl text-green-600">{formatCurrency(totals.valorTotal)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-300">
                        <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          Análise de Lucro
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-green-800">Lucro Bruto:</span>
                            <span className="font-bold text-xl text-green-700">{formatCurrency(totals.lucroTotal)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-green-800">Margem de Lucro:</span>
                            <span className="font-bold text-2xl text-green-600">{totals.margemLucro.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-900">
                    <p className="font-medium mb-1">Atenção</p>
                    <p>Estes valores são calculados automaticamente e servirão como base para os orçamentos. Você poderá ajustar as quantidades em cada Ordem de Serviço.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-6 border-t bg-gray-50 flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={loading}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium flex items-center justify-center gap-2">
            {loading ? (
              <>Salvando...</>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Salvar Serviço no Catálogo
              </>
            )}
          </button>
        </div>
      </motion.div>

      {showNewMaterialModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-blue-600 text-white p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold">Criar Novo Material</h2>
                <p className="text-blue-100 text-sm">Adicione ao estoque e use neste serviço</p>
              </div>
              <button onClick={() => setShowNewMaterialModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Nome do Material *
                  </label>
                  <input
                    type="text"
                    value={newMaterialData.name}
                    onChange={(e) => setNewMaterialData({ ...newMaterialData, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Cabo de Rede Cat6"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    SKU / Código
                  </label>
                  <input
                    type="text"
                    value={newMaterialData.sku}
                    onChange={(e) => setNewMaterialData({ ...newMaterialData, sku: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: MAT-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Unidade de Medida
                  </label>
                  <select
                    value={newMaterialData.unit}
                    onChange={(e) => setNewMaterialData({ ...newMaterialData, unit: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="UN">Unidade (UN)</option>
                    <option value="MT">Metro (MT)</option>
                    <option value="M2">Metro Quadrado (M²)</option>
                    <option value="KG">Quilograma (KG)</option>
                    <option value="LT">Litro (LT)</option>
                    <option value="CX">Caixa (CX)</option>
                    <option value="PC">Peça (PC)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Quantidade Inicial
                  </label>
                  <input
                    type="number"
                    value={newMaterialData.quantity}
                    onChange={(e) => setNewMaterialData({ ...newMaterialData, quantity: Number(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Custo Unitário (R$)
                  </label>
                  <input
                    type="number"
                    value={newMaterialData.unit_cost}
                    onChange={(e) => setNewMaterialData({ ...newMaterialData, unit_cost: Number(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Preço de Venda (R$)
                  </label>
                  <input
                    type="number"
                    value={newMaterialData.sale_price}
                    onChange={(e) => setNewMaterialData({ ...newMaterialData, sale_price: Number(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Estoque Mínimo
                  </label>
                  <input
                    type="number"
                    value={newMaterialData.min_quantity}
                    onChange={(e) => setNewMaterialData({ ...newMaterialData, min_quantity: Number(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">Material no Estoque</p>
                    <p>Este material será adicionado ao seu estoque e ficará disponível para uso em serviços e ordens de serviço.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowNewMaterialModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateNewMaterial}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>Criando...</>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    Criar e Salvar no Estoque
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default ServiceCatalogModal
