import React, { useState } from 'react'
import {
  ChevronDown, ChevronUp, Trash2, Package, Users, DollarSign,
  Clock, Minus, Plus, AlertTriangle, SlidersHorizontal, X, Check, Info,
  UserPlus, Receipt
} from 'lucide-react'
import { InlineMaterialSearch, MaterialItem } from './InlineMaterialSearch'

interface LaborItem {
  id: string
  staff_id: string
  nome: string
  tempo_minutos: number
  custo_hora: number
  custo_total: number
}

interface ExtraCost {
  id: string
  descricao: string
  valor: number
}

interface StaffMember {
  id: string
  name: string
  custo_hora: number
}

interface ServiceItem {
  id: string
  descricao: string
  escopo_detalhado?: string
  quantidade: number
  preco_unitario: number
  preco_total: number
  tempo_estimado_minutos: number
  materiais: MaterialItem[]
  funcionarios: LaborItem[]
  custos_extras?: ExtraCost[]
  custo_materiais: number
  custo_mao_obra: number
  custo_total: number
  lucro: number
  margem_lucro: number
}

interface ServiceItemCardProps {
  item: ServiceItem
  index: number
  staff: StaffMember[]
  onUpdate: (id: string, updates: Partial<ServiceItem>) => void
  onDelete: (id: string) => void
  onAddMaterial: (itemId: string) => void
  onAddLabor: (itemId: string) => void
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

export const ServiceItemCard: React.FC<ServiceItemCardProps> = ({
  item,
  index,
  staff,
  onUpdate,
  onDelete
}) => {
  const [expanded, setExpanded] = useState(false)
  const [priceText, setPriceText] = useState('')
  const [editingPrice, setEditingPrice] = useState(false)
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null)
  const [matEdit, setMatEdit] = useState<{
    preco_negociado: string
    tipo_uso: 'consumo' | 'locacao'
    observacoes_tecnicas: string
    quantidade: string
  } | null>(null)

  const [showLaborForm, setShowLaborForm] = useState(false)
  const [laborForm, setLaborForm] = useState({ staff_id: '', tempo_minutos: '60' })

  const [showExtraCostForm, setShowExtraCostForm] = useState(false)
  const [extraCostForm, setExtraCostForm] = useState({ descricao: '', valor: '' })

  const recalcCosts = (
    materiais: MaterialItem[],
    funcionarios: LaborItem[],
    custos_extras: ExtraCost[]
  ) => {
    const custoMateriais = materiais.reduce((s, m) => s + (m.custo_total || 0), 0)
    const custoMaoObra = funcionarios.reduce((s, f) => s + (f.custo_total || 0), 0)
    const custoExtras = custos_extras.reduce((s, c) => s + (c.valor || 0), 0)
    const custoTotal = custoMateriais + custoMaoObra + custoExtras
    const lucro = item.preco_total - custoTotal
    const margem_lucro = item.preco_total > 0 ? (lucro / item.preco_total) * 100 : 0
    return { custoMateriais, custoMaoObra, custoTotal, lucro, margem_lucro }
  }

  const handleQuantityChange = (delta: number) => {
    const newQtd = Math.max(1, item.quantidade + delta)
    onUpdate(item.id, { quantidade: newQtd, preco_total: item.preco_unitario * newQtd })
  }

  const handleQuantityInput = (value: string) => {
    const newQtd = Math.max(1, parseInt(value.replace(/\D/g, ''), 10) || 1)
    onUpdate(item.id, { quantidade: newQtd, preco_total: item.preco_unitario * newQtd })
  }

  const handlePriceBlur = () => {
    const newPrice = parseFloat(priceText.replace(/[^\d,]/g, '').replace(',', '.')) || item.preco_unitario
    const preco_total = newPrice * item.quantidade
    const custos = recalcCosts(item.materiais, item.funcionarios, item.custos_extras || [])
    const lucro = preco_total - custos.custoTotal
    const margem_lucro = preco_total > 0 ? (lucro / preco_total) * 100 : 100
    onUpdate(item.id, { preco_unitario: newPrice, preco_total, lucro, margem_lucro })
    setEditingPrice(false)
  }

  const handlePriceFocus = () => {
    setPriceText(item.preco_unitario > 0 ? item.preco_unitario.toFixed(2).replace('.', ',') : '')
    setEditingPrice(true)
  }

  // ── Materials ────────────────────────────────────────────────────────────────

  const handleMaterialAdded = (_serviceItemId: string, material: MaterialItem) => {
    const newMaterials = [...(item.materiais || []), material]
    const custos = recalcCosts(newMaterials, item.funcionarios, item.custos_extras || [])
    onUpdate(item.id, { materiais: newMaterials, ...custos })
  }

  const handleRemoveMaterial = (materialId: string) => {
    const newMaterials = item.materiais.filter(m => m.id !== materialId)
    const custos = recalcCosts(newMaterials, item.funcionarios, item.custos_extras || [])
    onUpdate(item.id, { materiais: newMaterials, ...custos })
    if (editingMaterialId === materialId) setEditingMaterialId(null)
  }

  const openMatEdit = (mat: MaterialItem) => {
    setEditingMaterialId(mat.id)
    setMatEdit({
      preco_negociado: mat.preco_negociado != null ? String(mat.preco_negociado) : '',
      tipo_uso: mat.tipo_uso || 'consumo',
      observacoes_tecnicas: mat.observacoes_tecnicas || '',
      quantidade: String(mat.quantidade)
    })
  }

  const saveMatEdit = (mat: MaterialItem) => {
    if (!matEdit) return
    const qtd = parseFloat(matEdit.quantidade) || mat.quantidade
    const precoNeg = matEdit.preco_negociado !== '' ? parseFloat(matEdit.preco_negociado) : null
    const precoUnit = precoNeg ?? mat.preco_compra_unitario
    const precoVenda = precoNeg ? precoNeg * 1.3 : mat.preco_venda_unitario
    const updatedMat: MaterialItem = {
      ...mat,
      quantidade: qtd,
      preco_negociado: precoNeg,
      preco_compra_unitario: precoUnit,
      preco_venda_unitario: precoVenda,
      preco_compra: precoUnit * qtd,
      preco_venda: precoVenda * qtd,
      custo_total: precoUnit * qtd,
      valor_total: precoVenda * qtd,
      lucro: (precoVenda - precoUnit) * qtd,
      tipo_uso: matEdit.tipo_uso,
      observacoes_tecnicas: matEdit.observacoes_tecnicas,
      alerta_estoque: mat.alerta_estoque && qtd > mat.quantidade_estoque
    }
    const newMaterials = item.materiais.map(m => m.id === mat.id ? updatedMat : m)
    const custos = recalcCosts(newMaterials, item.funcionarios, item.custos_extras || [])
    onUpdate(item.id, { materiais: newMaterials, ...custos })
    setEditingMaterialId(null)
    setMatEdit(null)
  }

  // ── Labor ────────────────────────────────────────────────────────────────────

  const handleAddLabor = () => {
    const member = staff.find(s => s.id === laborForm.staff_id)
    if (!member) return
    const minutos = parseInt(laborForm.tempo_minutos) || 60
    const custoHora = member.custo_hora || 0
    const custoTotal = (minutos / 60) * custoHora
    const newLabor: LaborItem = {
      id: `labor-${Date.now()}`,
      staff_id: member.id,
      nome: member.name,
      tempo_minutos: minutos,
      custo_hora: custoHora,
      custo_total: custoTotal
    }
    const newFuncionarios = [...(item.funcionarios || []), newLabor]
    const custos = recalcCosts(item.materiais, newFuncionarios, item.custos_extras || [])
    onUpdate(item.id, { funcionarios: newFuncionarios, ...custos })
    setLaborForm({ staff_id: '', tempo_minutos: '60' })
    setShowLaborForm(false)
  }

  const handleUpdateLabor = (laborId: string, minutos: number) => {
    const newFuncionarios = item.funcionarios.map(f => {
      if (f.id !== laborId) return f
      const custoTotal = (minutos / 60) * f.custo_hora
      return { ...f, tempo_minutos: minutos, custo_total: custoTotal }
    })
    const custos = recalcCosts(item.materiais, newFuncionarios, item.custos_extras || [])
    onUpdate(item.id, { funcionarios: newFuncionarios, ...custos })
  }

  const handleRemoveLabor = (laborId: string) => {
    const newFuncionarios = item.funcionarios.filter(f => f.id !== laborId)
    const custos = recalcCosts(item.materiais, newFuncionarios, item.custos_extras || [])
    onUpdate(item.id, { funcionarios: newFuncionarios, ...custos })
  }

  // ── Extra Costs ──────────────────────────────────────────────────────────────

  const handleAddExtraCost = () => {
    const valor = parseFloat(extraCostForm.valor.replace(',', '.')) || 0
    if (!extraCostForm.descricao || valor <= 0) return
    const newExtra: ExtraCost = {
      id: `extra-${Date.now()}`,
      descricao: extraCostForm.descricao,
      valor
    }
    const newExtras = [...(item.custos_extras || []), newExtra]
    const custos = recalcCosts(item.materiais, item.funcionarios, newExtras)
    onUpdate(item.id, { custos_extras: newExtras, ...custos })
    setExtraCostForm({ descricao: '', valor: '' })
    setShowExtraCostForm(false)
  }

  const handleRemoveExtraCost = (extraId: string) => {
    const newExtras = (item.custos_extras || []).filter(e => e.id !== extraId)
    const custos = recalcCosts(item.materiais, item.funcionarios, newExtras)
    onUpdate(item.id, { custos_extras: newExtras, ...custos })
  }

  const hasStockAlerts = item.materiais?.some(m => m.alerta_estoque)
  const custosExtras = item.custos_extras || []

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:border-blue-300 transition-all">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-lg font-bold shrink-0">
            {index + 1}
          </div>

          <div className="flex-1 space-y-3">
            <input
              type="text"
              value={item.descricao}
              onChange={(e) => onUpdate(item.id, { descricao: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg font-medium focus:ring-2 focus:ring-blue-500"
              placeholder="Descrição do serviço"
            />

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Quantidade</label>
                <div className="flex items-center border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                  <button type="button" onClick={() => handleQuantityChange(-1)}
                    className="px-2 py-2 bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600 shrink-0">
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="text" inputMode="numeric"
                    value={item.quantidade}
                    onChange={(e) => handleQuantityInput(e.target.value)}
                    className="w-full px-2 py-2 text-center font-medium focus:outline-none"
                  />
                  <button type="button" onClick={() => handleQuantityChange(1)}
                    className="px-2 py-2 bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600 shrink-0">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-600 mb-1 block">Preço Unit. (R$)</label>
                <input
                  type="text" inputMode="decimal"
                  value={editingPrice ? priceText : item.preco_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  onFocus={handlePriceFocus}
                  onChange={(e) => setPriceText(e.target.value)}
                  onBlur={handlePriceBlur}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600 mb-1 block">Total</label>
                <div className="w-full px-3 py-2 bg-green-50 border border-green-300 rounded-lg font-bold text-green-700">
                  {fmt(item.preco_total)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-lg">
                <Clock className="h-4 w-4 text-blue-600" />
                <span>{item.tempo_estimado_minutos} min</span>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${hasStockAlerts ? 'bg-amber-100' : 'bg-amber-50'}`}>
                <Package className={`h-4 w-4 ${hasStockAlerts ? 'text-amber-600' : 'text-amber-500'}`} />
                <span>{item.materiais.length} mat.</span>
                {hasStockAlerts && <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />}
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg">
                <Users className="h-4 w-4 text-slate-600" />
                <span>{item.funcionarios.length} func.</span>
              </div>
              {custosExtras.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 rounded-lg">
                  <Receipt className="h-4 w-4 text-orange-600" />
                  <span>{custosExtras.length} extras</span>
                </div>
              )}
              <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ml-auto ${
                item.margem_lucro < 20 ? 'bg-red-100' :
                item.margem_lucro < 40 ? 'bg-yellow-100' : 'bg-green-100'
              }`}>
                <DollarSign className={`h-4 w-4 ${
                  item.margem_lucro < 20 ? 'text-red-600' :
                  item.margem_lucro < 40 ? 'text-yellow-600' : 'text-green-600'
                }`} />
                <span className="font-semibold">{item.margem_lucro.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button onClick={() => setExpanded(!expanded)}
              className="p-2 hover:bg-blue-100 rounded-lg transition-colors">
              {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
            <button onClick={() => onDelete(item.id)}
              className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors">
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Expanded Body ───────────────────────────────────────────────────── */}
      {expanded && (
        <div className="p-4 bg-gray-50 border-t space-y-5">
          <div>
            <label className="text-sm font-medium mb-2 block">Escopo Detalhado</label>
            <textarea
              value={item.escopo_detalhado || ''}
              onChange={(e) => onUpdate(item.id, { escopo_detalhado: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Descreva o escopo detalhado do serviço..."
            />
          </div>

          {/* Cost summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs text-red-600 font-medium mb-1">Custo Total</p>
              <p className="text-lg font-bold text-red-700">{fmt(item.custo_total)}</p>
              <div className="mt-2 text-xs text-gray-600 space-y-0.5">
                <p>Materiais: {fmt(item.custo_materiais)}</p>
                <p>Mão de Obra: {fmt(item.custo_mao_obra)}</p>
                {custosExtras.length > 0 && (
                  <p>Extras: {fmt(custosExtras.reduce((s, e) => s + e.valor, 0))}</p>
                )}
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-600 font-medium mb-1">Lucro</p>
              <p className="text-lg font-bold text-green-700">{fmt(item.lucro)}</p>
              <p className="mt-2 text-xs text-gray-600">Margem: {item.margem_lucro.toFixed(1)}%</p>
            </div>
          </div>

          {/* ── Materials ─────────────────────────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-amber-500" />
              <h4 className="text-sm font-semibold text-gray-800">
                Materiais ({item.materiais.length})
              </h4>
              {hasStockAlerts && (
                <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  <AlertTriangle className="h-3 w-3" /> Alerta de estoque
                </span>
              )}
            </div>

            {item.materiais.length > 0 && (
              <div className="space-y-2">
                {item.materiais.map(mat => (
                  <div key={mat.id}>
                    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${
                      mat.alerta_estoque ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'
                    }`}>
                      <Package className={`h-4 w-4 shrink-0 ${mat.alerta_estoque ? 'text-amber-500' : 'text-gray-400'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-900 truncate">{mat.nome}</span>
                          <span className={`px-1.5 py-0.5 text-xs rounded-full font-medium ${
                            (mat.tipo_uso || 'consumo') === 'consumo' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {(mat.tipo_uso || 'consumo') === 'consumo' ? 'Consumo' : 'Locação'}
                          </span>
                          {mat.preco_negociado != null && (
                            <span className="px-1.5 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700 font-medium">Negociado</span>
                          )}
                          {mat.alerta_estoque && (
                            <span className="flex items-center gap-0.5 text-xs text-amber-700">
                              <AlertTriangle className="h-3 w-3" /> Estoque insuf.
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {mat.quantidade} {mat.unidade_medida} × {fmt(mat.preco_negociado ?? mat.preco_compra_unitario)} = {fmt(mat.custo_total)}
                        </div>
                        {mat.observacoes_tecnicas && (
                          <div className="text-xs text-gray-400 mt-0.5 italic truncate">{mat.observacoes_tecnicas}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => editingMaterialId === mat.id ? setEditingMaterialId(null) : openMatEdit(mat)}
                          className="p-1.5 hover:bg-amber-100 text-amber-600 rounded-lg transition-colors" title="Customizar">
                          <SlidersHorizontal className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleRemoveMaterial(mat.id)}
                          className="p-1.5 hover:bg-red-100 text-red-500 rounded-lg transition-colors" title="Remover">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {editingMaterialId === mat.id && matEdit && (
                      <div className="ml-4 mt-1 p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                          <SlidersHorizontal className="h-3.5 w-3.5 text-amber-600" />
                          <span className="text-xs font-semibold text-amber-800">Customizar: {mat.nome}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Quantidade ({mat.unidade_medida})</label>
                            <input type="number" step="0.01" min="0.01"
                              value={matEdit.quantidade}
                              onChange={e => setMatEdit(m => m ? { ...m, quantidade: e.target.value } : m)}
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 bg-white"
                            />
                            <p className="text-xs text-gray-400 mt-0.5">Estoque: {mat.quantidade_estoque} {mat.unidade_medida}</p>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo de Uso</label>
                            <div className="flex gap-2">
                              {(['consumo', 'locacao'] as const).map(t => (
                                <button key={t}
                                  onClick={() => setMatEdit(m => m ? { ...m, tipo_uso: t } : m)}
                                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border-2 transition-all ${
                                    matEdit.tipo_uso === t
                                      ? t === 'consumo' ? 'border-green-500 bg-green-50 text-green-800' : 'border-blue-500 bg-blue-50 text-blue-800'
                                      : 'border-gray-200 bg-white text-gray-600'
                                  }`}>
                                  {t === 'consumo' ? 'Consumo' : 'Locação'}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">
                            Valor Negociado
                            <span className="font-normal text-gray-400 ml-1">(padrão: {fmt(mat.preco_compra_unitario)})</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">R$</span>
                            <input type="number" step="0.01" min="0"
                              placeholder={mat.preco_compra_unitario.toFixed(2)}
                              value={matEdit.preco_negociado}
                              onChange={e => setMatEdit(m => m ? { ...m, preco_negociado: e.target.value } : m)}
                              className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-400"
                            />
                          </div>
                          {matEdit.preco_negociado !== '' && parseFloat(matEdit.preco_negociado) !== mat.preco_compra_unitario && (
                            <p className="text-xs text-blue-600 mt-0.5 flex items-center gap-1">
                              <Info className="h-3 w-3" /> Preço negociado apenas para esta OS.
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Observações Técnicas</label>
                          <textarea
                            value={matEdit.observacoes_tecnicas}
                            onChange={e => setMatEdit(m => m ? { ...m, observacoes_tecnicas: e.target.value } : m)}
                            placeholder="Instruções de uso, cuidados especiais..."
                            rows={2}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-amber-400 resize-none"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => { setEditingMaterialId(null); setMatEdit(null) }}
                            className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
                            Cancelar
                          </button>
                          <button onClick={() => saveMatEdit(mat)}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition-colors">
                            <Check className="h-3.5 w-3.5" /> Salvar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <InlineMaterialSearch
              serviceItemId={item.id}
              existingMaterials={item.materiais}
              onMaterialAdded={handleMaterialAdded}
            />
          </div>

          {/* ── Employees ─────────────────────────────────────────────────── */}
          <div className="border-t border-gray-200 pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-600" />
              <h4 className="text-sm font-semibold text-gray-800">
                Funcionários ({item.funcionarios.length})
              </h4>
            </div>

            {item.funcionarios.length > 0 && (
              <div className="space-y-2">
                {item.funcionarios.map(f => (
                  <div key={f.id} className="flex items-center gap-3 px-3 py-2.5 bg-white border border-gray-200 rounded-lg">
                    <div className="p-1.5 bg-slate-100 rounded-lg shrink-0">
                      <Users className="h-4 w-4 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{f.nome}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-gray-500">{fmt(f.custo_hora)}/h</span>
                        <span className="text-xs text-gray-400">•</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateLabor(f.id, Math.max(15, f.tempo_minutos - 15))}
                            className="p-0.5 hover:bg-gray-100 rounded transition-colors">
                            <Minus className="h-3 w-3 text-gray-500" />
                          </button>
                          <span className="text-xs font-medium text-gray-700 min-w-[48px] text-center">
                            {f.tempo_minutos} min
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateLabor(f.id, f.tempo_minutos + 15)}
                            className="p-0.5 hover:bg-gray-100 rounded transition-colors">
                            <Plus className="h-3 w-3 text-gray-500" />
                          </button>
                        </div>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs font-semibold text-slate-700">{fmt(f.custo_total)}</span>
                      </div>
                    </div>
                    <button onClick={() => handleRemoveLabor(f.id)}
                      className="p-1.5 hover:bg-red-100 text-red-500 rounded-lg transition-colors shrink-0">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!showLaborForm ? (
              <button
                type="button"
                onClick={() => setShowLaborForm(true)}
                className="w-full px-4 py-2 border-2 border-dashed border-slate-300 text-slate-600 rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <UserPlus className="h-4 w-4" />
                Adicionar Funcionário
              </button>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <UserPlus className="h-3.5 w-3.5" /> Adicionar Funcionário
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Funcionário</label>
                    <select
                      value={laborForm.staff_id}
                      onChange={e => setLaborForm(f => ({ ...f, staff_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-400 bg-white"
                    >
                      <option value="">Selecione...</option>
                      {staff.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} — {fmt(s.custo_hora)}/h
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Tempo (minutos)</label>
                    <input
                      type="number" min="15" step="15"
                      value={laborForm.tempo_minutos}
                      onChange={e => setLaborForm(f => ({ ...f, tempo_minutos: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                </div>
                {laborForm.staff_id && (
                  <p className="text-xs text-slate-600">
                    Custo estimado: {fmt(
                      ((parseInt(laborForm.tempo_minutos) || 0) / 60) *
                      (staff.find(s => s.id === laborForm.staff_id)?.custo_hora || 0)
                    )}
                  </p>
                )}
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowLaborForm(false)}
                    className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
                    Cancelar
                  </button>
                  <button type="button" onClick={handleAddLabor}
                    disabled={!laborForm.staff_id}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-700 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <Check className="h-3.5 w-3.5" /> Adicionar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Extra Costs ───────────────────────────────────────────────── */}
          <div className="border-t border-gray-200 pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-orange-500" />
              <h4 className="text-sm font-semibold text-gray-800">
                Custos Extras ({custosExtras.length})
              </h4>
            </div>

            {custosExtras.length > 0 && (
              <div className="space-y-2">
                {custosExtras.map(extra => (
                  <div key={extra.id} className="flex items-center gap-3 px-3 py-2.5 bg-white border border-orange-100 rounded-lg">
                    <div className="p-1.5 bg-orange-100 rounded-lg shrink-0">
                      <Receipt className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{extra.descricao}</p>
                      <p className="text-xs font-semibold text-orange-700 mt-0.5">{fmt(extra.valor)}</p>
                    </div>
                    <button onClick={() => handleRemoveExtraCost(extra.id)}
                      className="p-1.5 hover:bg-red-100 text-red-500 rounded-lg transition-colors shrink-0">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!showExtraCostForm ? (
              <button
                type="button"
                onClick={() => setShowExtraCostForm(true)}
                className="w-full px-4 py-2 border-2 border-dashed border-orange-300 text-orange-600 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Plus className="h-4 w-4" />
                Adicionar Custo Extra
              </button>
            ) : (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg space-y-3">
                <p className="text-xs font-semibold text-orange-700 flex items-center gap-1.5">
                  <Receipt className="h-3.5 w-3.5" /> Novo Custo Extra
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Descrição</label>
                    <input
                      type="text"
                      value={extraCostForm.descricao}
                      onChange={e => setExtraCostForm(f => ({ ...f, descricao: e.target.value }))}
                      placeholder="Ex: Deslocamento, Aluguel de equipamento..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Valor (R$)</label>
                    <input
                      type="text" inputMode="decimal"
                      value={extraCostForm.valor}
                      onChange={e => setExtraCostForm(f => ({ ...f, valor: e.target.value }))}
                      placeholder="0,00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 bg-white"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowExtraCostForm(false)}
                    className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
                    Cancelar
                  </button>
                  <button type="button" onClick={handleAddExtraCost}
                    disabled={!extraCostForm.descricao || !extraCostForm.valor}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-orange-600 text-white text-xs font-semibold rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <Check className="h-3.5 w-3.5" /> Adicionar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
