import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Package, AlertTriangle, Volume2, ExternalLink, Save } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface ServiceOrderMaterialsManagerProps {
  serviceOrderId: string
  onUpdate?: () => void
}

interface Material {
  id?: string
  service_order_id: string
  material_id?: string
  material_name: string
  material_code?: string
  material_unit?: string
  quantity: number
  unit_cost_at_time?: number
  unit_sale_price?: number
  total_cost?: number
  total_sale_price?: number
  from_inventory?: boolean
  save_to_inventory?: boolean
  notes?: string
}

interface InventoryItem {
  id: string
  name: string
  quantity: number
  min_quantity: number
  unit: string
  unit_cost: number
  sale_price: number
  supplier?: string
  sku?: string
}

const ServiceOrderMaterialsManager = ({ serviceOrderId, onUpdate }: ServiceOrderMaterialsManagerProps) => {
  const [materials, setMaterials] = useState<Material[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showLowStockAlert, setShowLowStockAlert] = useState(false)
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const [newMaterial, setNewMaterial] = useState<Partial<Material>>({
    service_order_id: serviceOrderId,
    material_id: '',
    material_name: '',
    material_code: '',
    material_unit: 'un',
    quantity: 1,
    unit_cost_at_time: 0,
    unit_sale_price: 0,
    from_inventory: false,
    save_to_inventory: false,
    notes: ''
  })

  useEffect(() => {
    loadData()
    checkLowStock()

    const interval = setInterval(checkLowStock, 30000)
    return () => clearInterval(interval)
  }, [serviceOrderId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [materialsData, inventoryData] = await Promise.all([
        loadMaterials(),
        loadInventory()
      ])
      setMaterials(materialsData)
      setInventory(inventoryData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMaterials = async () => {
    const { data } = await supabase
      .from('service_order_materials')
      .select('*')
      .eq('service_order_id', serviceOrderId)
      .order('created_at', { ascending: false })
    return data || []
  }

  const loadInventory = async () => {
    const { data } = await supabase
      .from('materials')
      .select('id, name, quantity, min_quantity, unit, unit_cost, sale_price, supplier, sku')
      .eq('active', true)
      .order('name')
    return data || []
  }

  const checkLowStock = async () => {
    try {
      const { data } = await supabase
        .from('materials')
        .select('id, name, quantity, min_quantity, unit, unit_cost, sale_price')
        .eq('active', true)

      if (data) {
        const lowStock = data.filter(item => item.quantity <= item.min_quantity)

        if (lowStock.length > 0) {
          setLowStockItems(lowStock as InventoryItem[])
          setShowLowStockAlert(true)
          playAlertSound()
        } else {
          setLowStockItems([])
          setShowLowStockAlert(false)
        }
      }
    } catch (error) {
      console.error('Error checking low stock:', error)
    }
  }

  const playAlertSound = () => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi78OScSwkTUKnh77NeHAU7k9vywn0pBSh+zPDZjT0JFWGz6+yoVBMJRZ7h8btoIQUqgM3y2Ik2CBlouvDjnE0JElCp4O+3YhsGOZPa8r99KQUnfszw2Y09CRVhs+vsnFQTCUSe4PG7aSEEKoDN8tmJNggZaLrw45xNCRJQqeDvt2IbBjmT2vK/fSkFJ37M8NmNPQkVYbPr7JxUEwlEnuDxu2khBCqAzfLZiTYIGWi68OOcTQkSUKng77diGwY5k9ryv30pBSd+zPDZjT0JFWGz6+ycVBMJRJ7g8btpIQQqgM3y2Yk2CBlouvDjnE0JElCp4O+3YhsGOZPa8r99KQUnfsyw2Y09CRVhs+vsnFQTCUSe4PG7aSEEKoDN8tmJNggZaLrw45xNCRJQqeDvt2IbBjmT2vK/fSkFJ37MsNmNPQkVYbPr7JxUEwlEnuDxu2khBCqAzfLZiTYIGWi68OOcTQkSUKng77diGwY5k9ryv30pBSd+zLDZjT0JFWGz6+ycVBMJRJ7g8btpIQQqgM3y2Yk2CBlouvDjnE0JElCp4O+3YhsGOZPa8r99KQUnfsyw2Y09CRVhs+vsnFQTCUSe4PG7aSEEKoDN8tmJNggZaLrw45xNCRJQqeDvt2IbBjmT2vK/fSkFJ37MsNmNPQkVYbPr7JxUEwlEnuDxu2khBCqAzfLZiTYIGWi68OOcTQkSUKng77diGwY5k9ryv30pBSd+zLDZjT0JFWGz6+ycVBMJRJ7g8btoIQQq')
        audioRef.current.volume = 0.3
      }
      audioRef.current.play().catch(e => console.log('Audio play failed:', e))
    } catch (error) {
      console.log('Error playing sound:', error)
    }
  }

  const handleInventorySelect = (materialId: string) => {
    const selected = inventory.find(item => item.id === materialId)
    if (selected) {
      const isLowStock = selected.quantity <= selected.min_quantity

      setNewMaterial({
        ...newMaterial,
        material_id: materialId,
        material_name: selected.name,
        material_code: selected.sku || '',
        material_unit: selected.unit,
        unit_cost_at_time: selected.unit_cost,
        unit_sale_price: selected.sale_price,
        from_inventory: true
      })

      if (isLowStock) {
        setShowLowStockAlert(true)
        playAlertSound()
      }
    }
  }

  const handleAddMaterial = async () => {
    try {
      if (!newMaterial.material_name || !newMaterial.quantity) {
        alert('Preencha o nome e quantidade do item!')
        return
      }

      const quantity = Number(newMaterial.quantity)
      const unitSalePrice = Number(newMaterial.unit_sale_price) || 0
      const unitCost = Number(newMaterial.unit_cost_at_time) || 0

      const materialData = {
        service_order_id: serviceOrderId,
        material_id: newMaterial.material_id || null,
        material_name: newMaterial.material_name,
        material_code: newMaterial.material_code || null,
        material_unit: newMaterial.material_unit || 'un',
        quantity: quantity,
        unit_cost_at_time: unitCost,
        unit_sale_price: unitSalePrice,
        total_cost: quantity * unitCost,
        total_sale_price: quantity * unitSalePrice,
        from_inventory: newMaterial.from_inventory || false,
        save_to_inventory: newMaterial.save_to_inventory || false,
        notes: newMaterial.notes || null
      }

      const { data, error } = await supabase
        .from('service_order_materials')
        .insert([materialData])
        .select()
        .single()

      if (error) throw error

      if (newMaterial.from_inventory && newMaterial.material_id) {
        const selectedItem = inventory.find(i => i.id === newMaterial.material_id)
        if (selectedItem) {
          const newQuantity = selectedItem.quantity - quantity
          await supabase
            .from('materials')
            .update({ quantity: Math.max(0, newQuantity) })
            .eq('id', newMaterial.material_id)
        }
      } else if (newMaterial.save_to_inventory && !newMaterial.material_id) {
        const newInventoryItem = {
          name: newMaterial.material_name,
          description: newMaterial.notes || '',
          unit: newMaterial.material_unit || 'un',
          quantity: 0,
          min_quantity: 1,
          unit_cost: unitCost,
          sale_price: unitSalePrice,
          sku: newMaterial.material_code || null,
          active: true
        }

        await supabase
          .from('materials')
          .insert([newInventoryItem])
      }

      setMaterials([data, ...materials])
      setNewMaterial({
        service_order_id: serviceOrderId,
        material_id: '',
        material_name: '',
        material_code: '',
        material_unit: 'un',
        quantity: 1,
        unit_cost_at_time: 0,
        unit_sale_price: 0,
        from_inventory: false,
        save_to_inventory: false,
        notes: ''
      })

      setSearchTerm('')
      await loadInventory()
      await checkLowStock()
      onUpdate?.()
      alert('Item adicionado com sucesso!')
    } catch (error) {
      console.error('Error adding material:', error)
      alert('Erro ao adicionar item: ' + (error as Error).message)
    }
  }

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm('Deseja realmente excluir este item?')) return

    try {
      const material = materials.find(m => m.id === id)

      const { error } = await supabase
        .from('service_order_materials')
        .delete()
        .eq('id', id)

      if (error) throw error

      if (material?.from_inventory && material.material_id) {
        const inventoryItem = inventory.find(i => i.id === material.material_id)
        if (inventoryItem) {
          await supabase
            .from('materials')
            .update({ quantity: inventoryItem.quantity + (material.quantity || 0) })
            .eq('id', material.material_id)
        }
      }

      setMaterials(materials.filter(m => m.id !== id))
      await loadInventory()
      onUpdate?.()
      alert('Item removido com sucesso!')
    } catch (error) {
      console.error('Error deleting material:', error)
      alert('Erro ao excluir item')
    }
  }

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) return { text: 'SEM ESTOQUE', color: 'bg-red-600 text-white', urgency: 'critical' }
    if (item.quantity < item.min_quantity * 0.5) return { text: 'CRÍTICO', color: 'bg-red-500 text-white', urgency: 'urgent' }
    if (item.quantity < item.min_quantity) return { text: 'BAIXO', color: 'bg-yellow-500 text-white', urgency: 'warning' }
    return { text: 'OK', color: 'bg-green-500 text-white', urgency: 'ok' }
  }

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const totalMaterialCost = materials.reduce((sum, m) => sum + ((m.total_cost) || 0), 0)
  const totalMaterialSale = materials.reduce((sum, m) => sum + ((m.total_sale_price) || 0), 0)

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {showLowStockAlert && lowStockItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-50 border-2 border-red-500 rounded-lg p-4 shadow-lg"
          >
            <div className="flex items-start gap-3">
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="flex-shrink-0"
              >
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </motion.div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-900 flex items-center gap-2">
                  <Volume2 className="h-5 w-5 animate-pulse" />
                  ALERTA: {lowStockItems.length} {lowStockItems.length === 1 ? 'Item' : 'Itens'} com Estoque Baixo/Zerado
                </h3>
                <div className="mt-2 space-y-1">
                  {lowStockItems.slice(0, 3).map((item: any) => (
                    <div key={item.id} className="text-sm text-red-800">
                      • <strong>{item.name}</strong>: {item.quantity} {item.unit} {item.quantity === 0 && '(SEM ESTOQUE!)'}
                    </div>
                  ))}
                  {lowStockItems.length > 3 && (
                    <div className="text-sm text-red-700 font-medium">
                      + {lowStockItems.length - 3} mais itens...
                    </div>
                  )}
                </div>
              </div>
              <a
                href="/materials"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Ver Estoque
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-600" />
          Adicionar do Estoque
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔍 Buscar e Selecionar do Estoque
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Digite o nome ou código do item para buscar no estoque..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            />

            {searchTerm && filteredInventory.length > 0 && (
              <div className="mt-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-lg">
                {filteredInventory.map(item => {
                  const status = getStockStatus(item)
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        handleInventorySelect(item.id)
                        setSearchTerm('')
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-0 transition-colors flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-600">
                          {item.sku && <span className="mr-3">Código: {item.sku}</span>}
                          <span className="mr-3">Estoque: {item.quantity} {item.unit}</span>
                          <span className="font-semibold text-blue-600">R$ {item.sale_price.toFixed(2)}/{item.unit}</span>
                        </div>
                      </div>
                      {status.urgency !== 'ok' && (
                        <span className={`ml-3 px-2 py-1 text-xs font-bold rounded ${status.color}`}>
                          {status.text}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {searchTerm && filteredInventory.length === 0 && (
              <div className="mt-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                Nenhum item encontrado no estoque. Você pode adicionar manualmente abaixo.
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Item *
              </label>
              <input
                type="text"
                value={newMaterial.material_name || ''}
                onChange={(e) => setNewMaterial({ ...newMaterial, material_name: e.target.value })}
                placeholder="Digite o nome"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantidade *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={newMaterial.quantity || 0}
                onChange={(e) => setNewMaterial({ ...newMaterial, quantity: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preço Venda Unit.
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={newMaterial.unit_sale_price || 0}
                onChange={(e) => setNewMaterial({ ...newMaterial, unit_sale_price: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Venda
              </label>
              <input
                type="text"
                value={`R$ ${((newMaterial.quantity || 0) * (newMaterial.unit_sale_price || 0)).toFixed(2)}`}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-semibold"
              />
            </div>
          </div>

          {!newMaterial.from_inventory && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <input
                type="checkbox"
                id="save_to_inventory"
                checked={newMaterial.save_to_inventory || false}
                onChange={(e) => setNewMaterial({ ...newMaterial, save_to_inventory: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="save_to_inventory" className="text-sm text-gray-700 flex items-center gap-2">
                <Save className="h-4 w-4 text-blue-600" />
                Salvar este item no estoque para uso futuro
              </label>
            </div>
          )}

          <button
            onClick={handleAddMaterial}
            disabled={!newMaterial.material_name}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            <Plus className="h-5 w-5" />
            Adicionar Item
          </button>
        </div>
      </div>

      {materials.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Qtd</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Preço Unit.</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Venda</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Origem</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {materials.map(material => (
                <tr key={material.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{material.material_name}</div>
                    {material.material_code && <div className="text-xs text-gray-500">Código: {material.material_code}</div>}
                    {material.notes && <div className="text-xs text-gray-500">{material.notes}</div>}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-900">{material.quantity} {material.material_unit}</td>
                  <td className="px-6 py-4 text-right text-sm text-gray-900">R$ {(material.unit_sale_price || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 text-right text-sm font-semibold text-blue-600">
                    R$ {(material.total_sale_price || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${material.from_inventory ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {material.from_inventory ? 'Estoque' : 'Manual'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => material.id && handleDeleteMaterial(material.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Excluir material"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2">
              <tr>
                <td colSpan={3} className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">
                  Total Custo Materiais:
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                  R$ {totalMaterialCost.toFixed(2)}
                </td>
                <td colSpan={2}></td>
              </tr>
              <tr>
                <td colSpan={3} className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                  Total Venda Materiais:
                </td>
                <td className="px-6 py-4 text-right text-sm font-bold text-blue-600">
                  R$ {totalMaterialSale.toFixed(2)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {materials.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>Nenhum item adicionado ainda</p>
        </div>
      )}
    </div>
  )
}

export default ServiceOrderMaterialsManager
