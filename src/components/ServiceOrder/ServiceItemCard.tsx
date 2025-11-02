import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Trash2, Package, Users, DollarSign, Clock } from 'lucide-react'

interface MaterialItem {
  id: string
  material_id: string
  nome: string
  quantidade: number
  unidade_medida: string
  preco_compra_unitario: number
  preco_venda_unitario: number
  custo_total: number
  valor_total: number
}

interface LaborItem {
  id: string
  staff_id: string
  nome: string
  tempo_minutos: number
  custo_hora: number
  custo_total: number
}

interface ServiceItem {
  id: string
  descricao: string
  quantidade: number
  preco_unitario: number
  preco_total: number
  tempo_estimado_minutos: number
  materiais: MaterialItem[]
  funcionarios: LaborItem[]
  custo_materiais: number
  custo_mao_obra: number
  custo_total: number
  lucro: number
  margem_lucro: number
}

interface ServiceItemCardProps {
  item: ServiceItem
  index: number
  onUpdate: (id: string, updates: Partial<ServiceItem>) => void
  onDelete: (id: string) => void
  onAddMaterial: (itemId: string) => void
  onAddLabor: (itemId: string) => void
}

export const ServiceItemCard: React.FC<ServiceItemCardProps> = ({
  item,
  index,
  onUpdate,
  onDelete,
  onAddMaterial,
  onAddLabor
}) => {
  const [expanded, setExpanded] = useState(false)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const handleQuantityChange = (newQtd: number) => {
    const preco_total = item.preco_unitario * newQtd
    onUpdate(item.id, { quantidade: newQtd, preco_total })
  }

  const handlePriceChange = (newPrice: number) => {
    const preco_total = newPrice * item.quantidade
    const lucro = preco_total - item.custo_total
    const margem_lucro = item.custo_total > 0 ? ((lucro / preco_total) * 100) : 100
    onUpdate(item.id, { preco_unitario: newPrice, preco_total, lucro, margem_lucro })
  }

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:border-blue-300 transition-all">
      <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-lg font-bold">
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
                <input
                  type="number"
                  value={item.quantidade}
                  onChange={(e) => handleQuantityChange(parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0.01"
                  step="0.01"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600 mb-1 block">Preço Unit. (R$)</label>
                <input
                  type="number"
                  value={item.preco_unitario.toFixed(2)}
                  onChange={(e) => handlePriceChange(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600 mb-1 block">Total</label>
                <div className="w-full px-3 py-2 bg-green-50 border border-green-300 rounded-lg font-bold text-green-700">
                  {formatCurrency(item.preco_total)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-lg">
                <Clock className="h-4 w-4 text-blue-600" />
                <span>{item.tempo_estimado_minutos} min</span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 rounded-lg">
                <Package className="h-4 w-4 text-amber-600" />
                <span>{item.materiais.length} materiais</span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 rounded-lg">
                <Users className="h-4 w-4 text-purple-600" />
                <span>{item.funcionarios.length} funcionários</span>
              </div>

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
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
            >
              {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="p-4 bg-gray-50 border-t space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Escopo Detalhado</label>
            <textarea
              value={item.escopo_detalhado || ''}
              onChange={(e) => onUpdate(item.id, { escopo_detalhado: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Descreva o escopo detalhado do serviço..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs text-red-600 font-medium mb-1">Custo Total</p>
              <p className="text-lg font-bold text-red-700">{formatCurrency(item.custo_total)}</p>
              <div className="mt-2 text-xs text-gray-600 space-y-1">
                <p>Materiais: {formatCurrency(item.custo_materiais)}</p>
                <p>Mão de Obra: {formatCurrency(item.custo_mao_obra)}</p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-600 font-medium mb-1">Lucro</p>
              <p className="text-lg font-bold text-green-700">{formatCurrency(item.lucro)}</p>
              <p className="mt-2 text-xs text-gray-600">
                Margem: {item.margem_lucro.toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onAddMaterial(item.id)}
              className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
            >
              <Package className="h-4 w-4" />
              Adicionar Material
            </button>
            <button
              onClick={() => onAddLabor(item.id)}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
            >
              <Users className="h-4 w-4" />
              Adicionar Funcionário
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
