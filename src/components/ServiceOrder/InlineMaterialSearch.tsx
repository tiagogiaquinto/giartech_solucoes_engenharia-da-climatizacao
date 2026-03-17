import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Search, Package, AlertTriangle, Plus, ChevronDown, ChevronUp,
  SlidersHorizontal, X, Check, ShoppingCart, Info
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useDebounce } from '../../hooks/useDebounce'

export interface MaterialItem {
  id: string
  material_id: string
  nome: string
  quantidade: number
  unidade_medida: string
  preco_compra_unitario: number
  preco_venda_unitario: number
  preco_compra: number
  preco_venda: number
  custo_total: number
  valor_total: number
  lucro: number
  tipo_uso: 'consumo' | 'locacao'
  observacoes_tecnicas: string
  preco_negociado: number | null
  quantidade_estoque: number
  alerta_estoque: boolean
  from_inventory: boolean
}

interface InventoryResult {
  id: string
  name: string
  sku?: string
  quantity: number
  min_quantity: number
  unit: string
  unit_cost: number
  sale_price: number
}

interface InlineMaterialSearchProps {
  serviceItemId: string
  existingMaterials: MaterialItem[]
  onMaterialAdded: (serviceItemId: string, material: MaterialItem) => void
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

export const InlineMaterialSearch: React.FC<InlineMaterialSearchProps> = ({
  serviceItemId,
  existingMaterials,
  onMaterialAdded
}) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<InventoryResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryResult | null>(null)
  const [showCustomize, setShowCustomize] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [customize, setCustomize] = useState({
    quantidade: 1,
    preco_negociado: null as number | null,
    tipo_uso: 'consumo' as 'consumo' | 'locacao',
    observacoes_tecnicas: ''
  })

  const debouncedQuery = useDebounce(query, 280)

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([])
      setShowResults(false)
      return
    }
    setSearching(true)
    try {
      const { data } = await supabase
        .from('materials')
        .select('id, name, sku, quantity, min_quantity, unit, unit_cost, sale_price')
        .ilike('name', `%${q}%`)
        .eq('active', true)
        .order('name')
        .limit(12)

      const { data: invData } = await supabase
        .from('inventory')
        .select('id, name, sku, quantity, min_quantity, unit, unit_cost, sale_price')
        .ilike('name', `%${q}%`)
        .limit(8)

      const combined: InventoryResult[] = []
      const seen = new Set<string>()

      for (const item of [...(data || []), ...(invData || [])]) {
        if (!seen.has(item.id)) {
          seen.add(item.id)
          combined.push({
            id: item.id,
            name: item.name,
            sku: item.sku,
            quantity: parseFloat(item.quantity || 0),
            min_quantity: parseFloat(item.min_quantity || 0),
            unit: item.unit || 'un',
            unit_cost: parseFloat(item.unit_cost || 0),
            sale_price: parseFloat(item.sale_price || item.unit_cost || 0)
          })
        }
      }
      setResults(combined)
      setShowResults(combined.length > 0)
    } catch (e) {
      console.error('Material search error:', e)
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    search(debouncedQuery)
  }, [debouncedQuery, search])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const openCustomize = (item: InventoryResult) => {
    setSelectedItem(item)
    setShowResults(false)
    setCustomize({
      quantidade: 1,
      preco_negociado: null,
      tipo_uso: 'consumo',
      observacoes_tecnicas: ''
    })
    setShowCustomize(true)
    setQuery(item.name)
  }

  const isStockInsufficient = (item: InventoryResult, qty: number) =>
    item.quantity < qty

  const confirmAdd = () => {
    if (!selectedItem) return
    const qty = customize.quantidade
    const precoUnitario = customize.preco_negociado ?? selectedItem.unit_cost
    const precoVenda = customize.preco_negociado
      ? customize.preco_negociado * 1.3
      : selectedItem.sale_price

    const material: MaterialItem = {
      id: `mat-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      material_id: selectedItem.id,
      nome: selectedItem.name,
      quantidade: qty,
      unidade_medida: selectedItem.unit,
      preco_compra_unitario: precoUnitario,
      preco_venda_unitario: precoVenda,
      preco_compra: precoUnitario * qty,
      preco_venda: precoVenda * qty,
      custo_total: precoUnitario * qty,
      valor_total: precoVenda * qty,
      lucro: (precoVenda - precoUnitario) * qty,
      tipo_uso: customize.tipo_uso,
      observacoes_tecnicas: customize.observacoes_tecnicas,
      preco_negociado: customize.preco_negociado,
      quantidade_estoque: selectedItem.quantity,
      alerta_estoque: isStockInsufficient(selectedItem, qty),
      from_inventory: true
    }

    onMaterialAdded(serviceItemId, material)
    setQuery('')
    setSelectedItem(null)
    setShowCustomize(false)
    setShowResults(false)
    setCustomize({ quantidade: 1, preco_negociado: null, tipo_uso: 'consumo', observacoes_tecnicas: '' })
  }

  const cancelCustomize = () => {
    setShowCustomize(false)
    setSelectedItem(null)
    setQuery('')
  }

  const stockStatus = selectedItem
    ? isStockInsufficient(selectedItem, customize.quantidade)
    : false

  return (
    <div ref={containerRef} className="space-y-3">
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setShowCustomize(false); setSelectedItem(null) }}
            onFocus={() => { if (results.length > 0) setShowResults(true) }}
            placeholder="Buscar material no estoque..."
            className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          )}
          {query && !searching && (
            <button
              onClick={() => { setQuery(''); setResults([]); setShowResults(false); setShowCustomize(false) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {showResults && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
            {results.map(item => {
              const lowStock = item.quantity <= item.min_quantity
              const noStock = item.quantity <= 0
              return (
                <button
                  key={item.id}
                  onClick={() => openCustomize(item)}
                  className="w-full px-4 py-3 text-left hover:bg-amber-50 transition-colors border-b border-gray-50 last:border-0 group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400 shrink-0" />
                        <span className="font-medium text-gray-900 text-sm truncate">{item.name}</span>
                        {item.sku && <span className="text-xs text-gray-400 font-mono shrink-0">{item.sku}</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs">
                        <span className={`font-medium ${noStock ? 'text-red-600' : lowStock ? 'text-amber-600' : 'text-green-600'}`}>
                          {noStock ? 'Sem estoque' : `${item.quantity} ${item.unit}`}
                        </span>
                        <span className="text-gray-400">{fmt(item.unit_cost)}/un</span>
                        {(lowStock || noStock) && (
                          <span className="flex items-center gap-1 text-amber-600">
                            <AlertTriangle className="h-3 w-3" />
                            {noStock ? 'Estoque zerado' : 'Estoque baixo'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <SlidersHorizontal className="h-4 w-4 text-amber-500 group-hover:text-amber-600" />
                      <Plus className="h-4 w-4 text-blue-500 group-hover:text-blue-600" />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {showCustomize && selectedItem && (
        <div className={`rounded-xl border-2 p-4 space-y-4 ${stockStatus ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-semibold text-gray-800">Customizar Material</span>
              <span className="text-sm font-medium text-gray-600">— {selectedItem.name}</span>
            </div>
            <button onClick={cancelCustomize} className="p-1 hover:bg-gray-200 rounded transition-colors">
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          {stockStatus && (
            <div className="flex items-start gap-2 bg-amber-100 border border-amber-300 rounded-lg px-3 py-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800">
                <span className="font-semibold">Estoque insuficiente:</span> disponivel {selectedItem.quantity} {selectedItem.unit}, solicitado {customize.quantidade} {selectedItem.unit}.
                A insercao e permitida — uma Ordem de Compra sera gerada automaticamente.
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Quantidade <span className="text-gray-400 font-normal">({selectedItem.unit})</span>
              </label>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
                <button
                  onClick={() => setCustomize(c => ({ ...c, quantidade: Math.max(0.1, +(c.quantidade - 1).toFixed(2)) }))}
                  className="px-2.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-bold transition-colors"
                >-</button>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={customize.quantidade}
                  onChange={e => setCustomize(c => ({ ...c, quantidade: parseFloat(e.target.value) || 1 }))}
                  className={`flex-1 px-2 py-2 text-center text-sm font-medium focus:outline-none ${stockStatus ? 'text-amber-700' : ''}`}
                />
                <button
                  onClick={() => setCustomize(c => ({ ...c, quantidade: +(c.quantidade + 1).toFixed(2) }))}
                  className="px-2.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-bold transition-colors"
                >+</button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Estoque: {selectedItem.quantity} {selectedItem.unit}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Tipo de Uso
              </label>
              <div className="flex gap-2">
                {(['consumo', 'locacao'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setCustomize(c => ({ ...c, tipo_uso: t }))}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg border-2 transition-all capitalize ${
                      customize.tipo_uso === t
                        ? t === 'consumo'
                          ? 'border-green-500 bg-green-50 text-green-800'
                          : 'border-blue-500 bg-blue-50 text-blue-800'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {t === 'consumo' ? 'Consumo' : 'Locacao'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Valor Unitario Negociado
              <span className="font-normal text-gray-400 ml-1">(padrao: {fmt(selectedItem.unit_cost)})</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder={selectedItem.unit_cost.toFixed(2)}
                value={customize.preco_negociado ?? ''}
                onChange={e => setCustomize(c => ({
                  ...c,
                  preco_negociado: e.target.value === '' ? null : parseFloat(e.target.value)
                }))}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
            </div>
            {customize.preco_negociado !== null && customize.preco_negociado !== selectedItem.unit_cost && (
              <div className="flex items-center gap-1 mt-1">
                <Info className="h-3 w-3 text-blue-500" />
                <p className="text-xs text-blue-600">
                  Preco negociado — nao altera o catalogo global.
                  {customize.preco_negociado < selectedItem.unit_cost
                    ? ` Desconto de ${fmt(selectedItem.unit_cost - customize.preco_negociado)}/un.`
                    : ` Acrescimo de ${fmt(customize.preco_negociado - selectedItem.unit_cost)}/un.`}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Observacoes Tecnicas
            </label>
            <textarea
              value={customize.observacoes_tecnicas}
              onChange={e => setCustomize(c => ({ ...c, observacoes_tecnicas: e.target.value }))}
              placeholder="Ex: Aplicar apos limpeza do evaporador. Verificar vazamentos antes..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              Total previsto:{' '}
              <span className="font-semibold text-gray-800">
                {fmt((customize.preco_negociado ?? selectedItem.unit_cost) * customize.quantidade)}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={cancelCustomize}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmAdd}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition-colors"
              >
                <Check className="h-3.5 w-3.5" />
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
