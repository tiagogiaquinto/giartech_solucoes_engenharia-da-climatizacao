import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, Plus, Save, X, Search, DollarSign, Hash } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface InventoryItem {
  id: string
  name: string
  code?: string
  unit_measure: string
  unit_price?: number
  quantity?: number
}

interface MaterialData {
  material_id?: string
  material_name: string
  material_code?: string
  material_unit: string
  quantity: number
  unit_cost_at_time: number
  unit_sale_price: number
  from_inventory: boolean
  save_to_inventory: boolean
  notes?: string
}

interface MaterialSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (material: MaterialData) => void
  existingMaterials?: string[]
}

const MaterialSelector = ({ isOpen, onClose, onSelect, existingMaterials = [] }: MaterialSelectorProps) => {
  const [mode, setMode] = useState<'inventory' | 'manual'>('inventory')
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)

  const [manualForm, setManualForm] = useState({
    material_name: '',
    material_code: '',
    material_unit: 'un',
    quantity: 1,
    unit_cost_at_time: 0,
    unit_sale_price: 0,
    save_to_inventory: false,
    notes: ''
  })

  useEffect(() => {
    if (isOpen && mode === 'inventory') {
      loadInventory()
    }
  }, [isOpen, mode])

  const loadInventory = async () => {
    try {
      setLoading(true)
      const { data } = await supabase
        .from('inventory')
        .select('id, name, code, unit_measure, unit_price, quantity')
        .eq('active', true)
        .order('name')

      setInventoryItems(data || [])
    } catch (error) {
      console.error('Error loading inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInventorySelect = (item: InventoryItem) => {
    const materialData: MaterialData = {
      material_id: item.id,
      material_name: item.name,
      material_code: item.code,
      material_unit: item.unit_measure,
      quantity: 1,
      unit_cost_at_time: item.unit_price || 0,
      unit_sale_price: item.unit_price ? item.unit_price * 1.3 : 0,
      from_inventory: true,
      save_to_inventory: false
    }
    onSelect(materialData)
    onClose()
  }

  const handleManualSubmit = () => {
    if (!manualForm.material_name) {
      alert('Nome do material é obrigatório!')
      return
    }

    const materialData: MaterialData = {
      material_name: manualForm.material_name,
      material_code: manualForm.material_code,
      material_unit: manualForm.material_unit,
      quantity: manualForm.quantity,
      unit_cost_at_time: manualForm.unit_cost_at_time,
      unit_sale_price: manualForm.unit_sale_price,
      from_inventory: false,
      save_to_inventory: manualForm.save_to_inventory,
      notes: manualForm.notes
    }

    onSelect(materialData)
    onClose()

    setManualForm({
      material_name: '',
      material_code: '',
      material_unit: 'un',
      quantity: 1,
      unit_cost_at_time: 0,
      unit_sale_price: 0,
      save_to_inventory: false,
      notes: ''
    })
  }

  const filteredInventory = inventoryItems.filter(item =>
    !existingMaterials.includes(item.id) &&
    (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     item.code?.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{opacity: 0, scale: 0.95}}
        animate={{opacity: 1, scale: 1}}
        className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div>
            <h2 className="text-2xl font-bold">Adicionar Material</h2>
            <p className="text-blue-100 text-sm">Selecione do estoque ou insira manualmente</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex border-b bg-gray-50">
          <button
            onClick={() => setMode('inventory')}
            className={`flex-1 px-6 py-4 font-medium text-sm flex items-center justify-center gap-2 border-b-2 transition-all ${
              mode === 'inventory'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Package className="h-4 w-4" />
            Do Estoque
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 px-6 py-4 font-medium text-sm flex items-center justify-center gap-2 border-b-2 transition-all ${
              mode === 'manual'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Plus className="h-4 w-4" />
            Manual
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {mode === 'inventory' ? (
              <motion.div
                key="inventory"
                initial={{opacity: 0, x: -20}}
                animate={{opacity: 1, x: 0}}
                exit={{opacity: 0, x: 20}}
              >
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Buscar material..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p>Carregando materiais...</p>
                  </div>
                ) : filteredInventory.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Nenhum material encontrado</p>
                    <p className="text-sm">Tente ajustar a busca ou adicione manualmente</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredInventory.map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleInventorySelect(item)}
                        className="w-full p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all text-left"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{item.name}</div>
                            {item.code && (
                              <div className="text-sm text-gray-500">Código: {item.code}</div>
                            )}
                            <div className="text-sm text-gray-500 mt-1">
                              Unidade: {item.unit_measure} |
                              Estoque: {item.quantity || 0} |
                              Preço: R$ {item.unit_price?.toFixed(2) || '0,00'}
                            </div>
                          </div>
                          <Plus className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="manual"
                initial={{opacity: 0, x: -20}}
                animate={{opacity: 1, x: 0}}
                exit={{opacity: 0, x: 20}}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-500" />
                    Nome do Material *
                  </label>
                  <input
                    type="text"
                    value={manualForm.material_name}
                    onChange={(e) => setManualForm({...manualForm, material_name: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Gás R-410A"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Código</label>
                    <input
                      type="text"
                      value={manualForm.material_code}
                      onChange={(e) => setManualForm({...manualForm, material_code: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Opcional"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      <Hash className="h-4 w-4 text-gray-500" />
                      Unidade
                    </label>
                    <select
                      value={manualForm.material_unit}
                      onChange={(e) => setManualForm({...manualForm, material_unit: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="un">Unidade (un)</option>
                      <option value="kg">Quilograma (kg)</option>
                      <option value="m">Metro (m)</option>
                      <option value="m2">Metro Quadrado (m²)</option>
                      <option value="l">Litro (l)</option>
                      <option value="cx">Caixa (cx)</option>
                      <option value="pc">Peça (pc)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Quantidade</label>
                    <input
                      type="number"
                      step="0.01"
                      value={manualForm.quantity}
                      onChange={(e) => setManualForm({...manualForm, quantity: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      Custo Unitário
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={manualForm.unit_cost_at_time}
                      onChange={(e) => setManualForm({...manualForm, unit_cost_at_time: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="R$ 0,00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      Preço de Venda
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={manualForm.unit_sale_price}
                      onChange={(e) => setManualForm({...manualForm, unit_sale_price: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="R$ 0,00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Observações</label>
                  <textarea
                    value={manualForm.notes}
                    onChange={(e) => setManualForm({...manualForm, notes: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Informações adicionais (opcional)"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={manualForm.save_to_inventory}
                      onChange={(e) => setManualForm({...manualForm, save_to_inventory: e.target.checked})}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-blue-900 flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Salvar no Estoque
                      </div>
                      <p className="text-sm text-blue-700 mt-1">
                        Este material será automaticamente adicionado ao estoque para uso futuro
                      </p>
                    </div>
                  </label>
                </div>

                <button
                  onClick={handleManualSubmit}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Adicionar Material
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

export default MaterialSelector
