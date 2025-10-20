import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Save, Package, Barcode, DollarSign, Building, Calendar, FileText, Hash } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface InventoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  inventoryId?: string
}

const InventoryModal = ({ isOpen, onClose, onSave, inventoryId }: InventoryModalProps) => {
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: '',
    description: '',
    unit_measure: 'un' as string,
    quantity: '',
    min_quantity: '',
    max_quantity: '',
    unit_price: '',
    total_value: '',
    supplier: '',
    location: '',
    purchase_date: '',
    expiration_date: '',
    notes: '',
    active: true
  })

  useEffect(() => {
    if (inventoryId) {
      loadInventoryData()
    } else {
      resetForm()
    }
  }, [inventoryId, isOpen])

  const loadInventoryData = async () => {
    if (!inventoryId) return

    try {
      const { data: inventory } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', inventoryId)
        .maybeSingle()

      if (inventory) {
        setFormData({
          name: inventory.name || '',
          code: inventory.code || '',
          category: inventory.category || '',
          description: inventory.description || '',
          unit_measure: inventory.unit_measure || 'un',
          quantity: inventory.quantity?.toString() || '',
          min_quantity: inventory.min_quantity?.toString() || '',
          max_quantity: inventory.max_quantity?.toString() || '',
          unit_price: inventory.unit_price?.toString() || '',
          total_value: inventory.total_value?.toString() || '',
          supplier: inventory.supplier || '',
          location: inventory.location || '',
          purchase_date: inventory.purchase_date || '',
          expiration_date: inventory.expiration_date || '',
          notes: inventory.notes || '',
          active: inventory.active ?? true
        })
      }
    } catch (error) {
      console.error('Error loading inventory:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      category: '',
      description: '',
      unit_measure: 'un',
      quantity: '',
      min_quantity: '',
      max_quantity: '',
      unit_price: '',
      total_value: '',
      supplier: '',
      location: '',
      purchase_date: '',
      expiration_date: '',
      notes: '',
      active: true
    })
  }

  const calculateTotalValue = (quantity: string, unitPrice: string) => {
    const qty = parseFloat(quantity) || 0
    const price = parseFloat(unitPrice) || 0
    return (qty * price).toFixed(2)
  }

  const handleQuantityChange = (value: string) => {
    const newFormData = { ...formData, quantity: value }
    newFormData.total_value = calculateTotalValue(value, formData.unit_price)
    setFormData(newFormData)
  }

  const handleUnitPriceChange = (value: string) => {
    const newFormData = { ...formData, unit_price: value }
    newFormData.total_value = calculateTotalValue(formData.quantity, value)
    setFormData(newFormData)
  }

  const handleSave = async () => {
    try {
      if (!formData.name) {
        alert('Nome é obrigatório!')
        return
      }

      setLoading(true)

      const dataToSave = {
        name: formData.name,
        code: formData.code || null,
        category: formData.category || null,
        description: formData.description || null,
        unit_measure: formData.unit_measure || 'un',
        quantity: formData.quantity ? parseFloat(formData.quantity) : 0,
        min_quantity: formData.min_quantity ? parseFloat(formData.min_quantity) : null,
        max_quantity: formData.max_quantity ? parseFloat(formData.max_quantity) : null,
        unit_price: formData.unit_price ? parseFloat(formData.unit_price) : null,
        total_value: formData.total_value ? parseFloat(formData.total_value) : null,
        supplier: formData.supplier || null,
        location: formData.location || null,
        purchase_date: formData.purchase_date || null,
        expiration_date: formData.expiration_date || null,
        notes: formData.notes || null,
        active: formData.active
      }

      if (inventoryId) {
        const { error } = await supabase
          .from('inventory')
          .update(dataToSave)
          .eq('id', inventoryId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('inventory')
          .insert([dataToSave])
        if (error) throw error
      }

      onSave()
      onClose()
    } catch (error) {
      console.error('Error saving inventory:', error)
      alert('Erro ao salvar item do estoque!')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{opacity: 0, scale: 0.95}}
        animate={{opacity: 1, scale: 1}}
        className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div>
            <h2 className="text-2xl font-bold">{inventoryId ? 'Editar Item' : 'Novo Item'}</h2>
            <p className="text-blue-100 text-sm">Gestão de estoque e inventário</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-500" />
                  Nome do Item *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nome do produto ou material"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <Barcode className="h-4 w-4 text-gray-500" />
                  Código / SKU
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Código de identificação"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-500" />
                  Categoria
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione...</option>
                  <option value="Materiais">Materiais</option>
                  <option value="Equipamentos">Equipamentos</option>
                  <option value="Ferramentas">Ferramentas</option>
                  <option value="Peças">Peças</option>
                  <option value="Consumíveis">Consumíveis</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Descrição detalhada do item"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <Hash className="h-4 w-4 text-gray-500" />
                  Unidade de Medida
                </label>
                <select
                  value={formData.unit_measure}
                  onChange={(e) => setFormData({...formData, unit_measure: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="un">Unidade (un)</option>
                  <option value="cx">Caixa (cx)</option>
                  <option value="kg">Quilograma (kg)</option>
                  <option value="g">Grama (g)</option>
                  <option value="t">Tonelada (t)</option>
                  <option value="m">Metro (m)</option>
                  <option value="cm">Centímetro (cm)</option>
                  <option value="m2">Metro Quadrado (m²)</option>
                  <option value="m3">Metro Cúbico (m³)</option>
                  <option value="l">Litro (l)</option>
                  <option value="ml">Mililitro (ml)</option>
                  <option value="pc">Peça (pc)</option>
                  <option value="par">Par</option>
                  <option value="kit">Kit</option>
                  <option value="rolo">Rolo</option>
                  <option value="saco">Saco</option>
                  <option value="fardo">Fardo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <Hash className="h-4 w-4 text-gray-500" />
                  Quantidade
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formData.min_quantity && parseFloat(formData.quantity) < parseFloat(formData.min_quantity)
                        ? 'border-red-300 bg-red-50'
                        : ''
                    }`}
                    placeholder="0"
                  />
                  {formData.min_quantity && parseFloat(formData.quantity) < parseFloat(formData.min_quantity) && (
                    <span className="absolute -top-6 right-0 text-xs text-red-600 font-medium">
                      ⚠️ Estoque baixo!
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <Hash className="h-4 w-4 text-gray-500" />
                  Quantidade Mínima
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.min_quantity}
                  onChange={(e) => setFormData({...formData, min_quantity: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Estoque mínimo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <Hash className="h-4 w-4 text-gray-500" />
                  Quantidade Máxima
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.max_quantity}
                  onChange={(e) => setFormData({...formData, max_quantity: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Estoque máximo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  Preço Unitário
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.unit_price}
                  onChange={(e) => handleUnitPriceChange(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 15.90"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  Valor Total
                </label>
                <input
                  type="text"
                  value={formData.total_value ? `R$ ${parseFloat(formData.total_value).toFixed(2)}` : ''}
                  readOnly
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-700 font-medium"
                  placeholder="Calculado automaticamente"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  Fornecedor
                </label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Fornecedor ABC, Distribuidora XYZ"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-500" />
                  Localização
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Prateleira A3, Almoxarifado"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  Data de Compra
                </label>
                <input
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  Data de Validade
                </label>
                <input
                  type="date"
                  value={formData.expiration_date}
                  onChange={(e) => setFormData({...formData, expiration_date: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  Observações
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Informações adicionais"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({...formData, active: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">Item Ativo</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium flex items-center justify-center gap-2"
          >
            {loading ? (
              <>Salvando...</>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Salvar Item
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default InventoryModal
