import React, { useState } from 'react'
import { AlertTriangle, Package, ShoppingCart, CheckCircle2, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface StockItem {
  material_id: string | null
  material_name: string
  quantity_needed: number
  quantity_in_stock: number
  quantity_to_buy: number
  unit: string
  is_shortage: boolean
}

interface StockCheckPanelProps {
  serviceOrderId: string | null
  serviceItems: any[]
  onRequisitionCreated?: (count: number) => void
}

export const StockCheckPanel: React.FC<StockCheckPanelProps> = ({
  serviceOrderId,
  serviceItems,
  onRequisitionCreated
}) => {
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [checked, setChecked] = useState(false)
  const [checking, setChecking] = useState(false)
  const [creating, setCreating] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const [created, setCreated] = useState(false)

  const hasMaterials = serviceItems.some(item => item.materiais && item.materiais.length > 0)

  const checkStock = async () => {
    if (!serviceOrderId) return
    setChecking(true)
    try {
      const { data, error } = await supabase.rpc('fn_check_os_stock', {
        p_service_order_id: serviceOrderId
      })
      if (error) throw error
      setStockItems(data || [])
      setChecked(true)
    } catch (err) {
      console.error('Erro ao checar estoque:', err)
    } finally {
      setChecking(false)
    }
  }

  const createPurchaseRequisitions = async () => {
    if (!serviceOrderId) return
    const shortages = stockItems.filter(i => i.is_shortage)
    if (shortages.length === 0) return

    setCreating(true)
    try {
      await supabase.from('os_stock_requisitions').insert(
        shortages.map(item => ({
          service_order_id: serviceOrderId,
          material_id: item.material_id || null,
          material_name: item.material_name,
          quantity_needed: item.quantity_needed,
          quantity_in_stock: item.quantity_in_stock,
          quantity_to_buy: item.quantity_to_buy,
          unit: item.unit,
          status: 'pendente'
        }))
      )
      setCreated(true)
      onRequisitionCreated?.(shortages.length)
    } catch (err) {
      console.error('Erro ao criar requisições:', err)
    } finally {
      setCreating(false)
    }
  }

  if (!hasMaterials) return null

  const shortages = stockItems.filter(i => i.is_shortage)
  const okItems = stockItems.filter(i => !i.is_shortage)

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            !checked ? 'bg-blue-50' : shortages.length > 0 ? 'bg-amber-50' : 'bg-green-50'
          }`}>
            <Package className={`h-5 w-5 ${
              !checked ? 'text-blue-500' : shortages.length > 0 ? 'text-amber-500' : 'text-green-500'
            }`} />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-800 text-sm">Verificação de Estoque</p>
            <p className="text-xs text-gray-500">
              {!checked
                ? 'Checar disponibilidade dos materiais'
                : shortages.length > 0
                ? `${shortages.length} item(ns) em falta — requisição pendente`
                : 'Todos os materiais disponíveis em estoque'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {checked && shortages.length > 0 && !created && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
              {shortages.length} em falta
            </span>
          )}
          {created && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Requisição criada
            </span>
          )}
          {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t space-y-3">
          {!checked ? (
            <div className="pt-3 flex justify-center">
              <button
                type="button"
                onClick={checkStock}
                disabled={checking || !serviceOrderId}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium"
              >
                {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                {checking ? 'Verificando...' : 'Verificar Estoque Agora'}
              </button>
            </div>
          ) : (
            <div className="pt-3 space-y-3">
              {shortages.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-semibold text-amber-700">Itens em Falta</span>
                  </div>
                  <div className="space-y-1.5">
                    {shortages.map((item, i) => (
                      <div key={i} className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        <span className="text-sm text-gray-700 font-medium">{item.material_name}</span>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-gray-500">Precisam: <strong className="text-gray-700">{item.quantity_needed} {item.unit}</strong></span>
                          <span className="text-gray-500">Estoque: <strong className="text-red-600">{item.quantity_in_stock} {item.unit}</strong></span>
                          <span className="bg-amber-200 text-amber-800 px-2 py-0.5 rounded font-medium">
                            Comprar: {item.quantity_to_buy} {item.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {okItems.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-semibold text-green-700">Disponível em Estoque</span>
                  </div>
                  <div className="space-y-1.5">
                    {okItems.map((item, i) => (
                      <div key={i} className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                        <span className="text-sm text-gray-700 font-medium">{item.material_name}</span>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>Precisa: <strong>{item.quantity_needed} {item.unit}</strong></span>
                          <span className="text-green-600">Estoque: <strong>{item.quantity_in_stock} {item.unit}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {shortages.length > 0 && !created && (
                <button
                  type="button"
                  onClick={createPurchaseRequisitions}
                  disabled={creating}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors text-sm font-medium"
                >
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                  {creating ? 'Criando...' : `Criar Requisição de Compra (${shortages.length} iten${shortages.length > 1 ? 's' : ''})`}
                </button>
              )}

              {stockItems.length === 0 && (
                <p className="text-center text-sm text-gray-500 py-2">
                  Nenhum material vinculado ao estoque encontrado.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
