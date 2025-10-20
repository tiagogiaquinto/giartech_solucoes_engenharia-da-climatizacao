import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Package, DollarSign, TrendingUp, Calculator } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Material {
  id: string
  name: string
  unit: string
  unit_cost: number
  sale_price: number
  total_quantity_purchased: number
  total_cost_purchased: number
}

interface ServiceMaterial {
  id?: string
  material_id: string
  material_name?: string
  material_unit?: string
  quantity: number
  unit_cost_at_time: number
  unit_sale_price: number
  total_cost?: number
  total_sale_price?: number
  notes?: string
}

interface Props {
  serviceCatalogId?: string
  materials: ServiceMaterial[]
  onChange: (materials: ServiceMaterial[]) => void
}

const ServiceCatalogMaterialsManager: React.FC<Props> = ({
  serviceCatalogId,
  materials,
  onChange
}) => {
  const [availableMaterials, setAvailableMaterials] = useState<Material[]>([])
  const [showFractionCalculator, setShowFractionCalculator] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMaterials()
  }, [])

  const loadMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('active', true)
        .order('name')

      if (error) throw error
      setAvailableMaterials(data || [])
    } catch (error) {
      console.error('Error loading materials:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateUnitCostFromTotal = (totalCost: number, totalQuantity: number): number => {
    if (totalQuantity === 0) return 0
    return Number((totalCost / totalQuantity).toFixed(4))
  }

  const handleAddMaterial = () => {
    const newMaterial: ServiceMaterial = {
      material_id: '',
      quantity: 1,
      unit_cost_at_time: 0,
      unit_sale_price: 0,
      notes: ''
    }
    onChange([...materials, newMaterial])
  }

  const handleMaterialSelect = (index: number, materialId: string) => {
    const selected = availableMaterials.find(m => m.id === materialId)
    if (!selected) return

    const updatedMaterials = [...materials]

    const unitCost = selected.total_quantity_purchased > 0
      ? calculateUnitCostFromTotal(selected.total_cost_purchased, selected.total_quantity_purchased)
      : selected.unit_cost

    updatedMaterials[index] = {
      ...updatedMaterials[index],
      material_id: materialId,
      material_name: selected.name,
      material_unit: selected.unit,
      unit_cost_at_time: unitCost,
      unit_sale_price: selected.sale_price || 0
    }

    onChange(updatedMaterials)
  }

  const handleMaterialChange = (index: number, field: keyof ServiceMaterial, value: any) => {
    const updatedMaterials = [...materials]
    updatedMaterials[index] = {
      ...updatedMaterials[index],
      [field]: value
    }
    onChange(updatedMaterials)
  }

  const handleRemoveMaterial = (index: number) => {
    const updatedMaterials = materials.filter((_, i) => i !== index)
    onChange(updatedMaterials)
  }

  const calculateTotals = (material: ServiceMaterial) => {
    const totalCost = material.quantity * material.unit_cost_at_time
    const totalSale = material.quantity * material.unit_sale_price
    const profit = totalSale - totalCost
    const profitMargin = totalCost > 0 ? ((profit / totalCost) * 100) : 0

    return { totalCost, totalSale, profit, profitMargin }
  }

  const calculateGrandTotals = () => {
    return materials.reduce((acc, material) => {
      const { totalCost, totalSale, profit } = calculateTotals(material)
      return {
        totalCost: acc.totalCost + totalCost,
        totalSale: acc.totalSale + totalSale,
        profit: acc.profit + profit
      }
    }, { totalCost: 0, totalSale: 0, profit: 0 })
  }

  const grandTotals = calculateGrandTotals()
  const grandProfitMargin = grandTotals.totalCost > 0
    ? ((grandTotals.profit / grandTotals.totalCost) * 100)
    : 0

  if (loading) {
    return <div className="text-center py-8">Carregando materiais...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Package className="h-5 w-5 mr-2 text-blue-500" />
          Materiais e Precificação
        </h3>
        <button
          type="button"
          onClick={handleAddMaterial}
          className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Adicionar Material</span>
        </button>
      </div>

      {materials.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">Nenhum material adicionado</p>
          <p className="text-sm text-gray-400 mb-4">
            Adicione materiais com custos e preços de venda para calcular a margem de lucro
          </p>
          <button
            type="button"
            onClick={handleAddMaterial}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="h-4 w-4 inline mr-2" />
            Adicionar Primeiro Material
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {materials.map((material, index) => {
              const { totalCost, totalSale, profit, profitMargin } = calculateTotals(material)
              const selectedMaterial = availableMaterials.find(m => m.id === material.material_id)

              return (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-lg p-4 space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-5">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Material
                      </label>
                      <select
                        value={material.material_id}
                        onChange={(e) => handleMaterialSelect(index, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Selecione um material</option>
                        {availableMaterials.map((mat) => (
                          <option key={mat.id} value={mat.id}>
                            {mat.name} ({mat.unit})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantidade
                      </label>
                      <input
                        type="number"
                        value={material.quantity}
                        onChange={(e) => handleMaterialChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                        step="0.01"
                        required
                      />
                      {material.material_unit && (
                        <span className="text-xs text-gray-500 mt-1 block">{material.material_unit}</span>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Custo Unit.
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="number"
                          value={material.unit_cost_at_time}
                          onChange={(e) => handleMaterialChange(index, 'unit_cost_at_time', parseFloat(e.target.value) || 0)}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                      {selectedMaterial && selectedMaterial.total_quantity_purchased > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowFractionCalculator(showFractionCalculator === index ? null : index)}
                          className="text-xs text-blue-600 hover:text-blue-700 mt-1 flex items-center"
                        >
                          <Calculator className="h-3 w-3 mr-1" />
                          Calcular fracionamento
                        </button>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Preço Venda Unit.
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="number"
                          value={material.unit_sale_price}
                          onChange={(e) => handleMaterialChange(index, 'unit_sale_price', parseFloat(e.target.value) || 0)}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                    </div>

                    <div className="md:col-span-1 flex items-end justify-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveMaterial(index)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remover material"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {showFractionCalculator === index && selectedMaterial && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
                        <Calculator className="h-4 w-4 mr-2" />
                        Calculadora de Fracionamento
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Valor total pago:</span>
                          <p className="font-medium text-gray-900">
                            R$ {selectedMaterial.total_cost_purchased.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Quantidade total:</span>
                          <p className="font-medium text-gray-900">
                            {selectedMaterial.total_quantity_purchased} {selectedMaterial.unit}
                          </p>
                        </div>
                        <div className="col-span-2 mt-2 pt-2 border-t border-blue-200">
                          <span className="text-gray-600">Custo por {selectedMaterial.unit}:</span>
                          <p className="font-bold text-blue-700 text-lg">
                            R$ {calculateUnitCostFromTotal(
                              selectedMaterial.total_cost_purchased,
                              selectedMaterial.total_quantity_purchased
                            ).toFixed(4)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="md:col-span-12">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observações (opcional)
                    </label>
                    <input
                      type="text"
                      value={material.notes || ''}
                      onChange={(e) => handleMaterialChange(index, 'notes', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Incluir 10% para perdas"
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-4 p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-xs text-gray-600">Custo Total</span>
                      <p className="font-semibold text-gray-900">R$ {totalCost.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-600">Venda Total</span>
                      <p className="font-semibold text-green-600">R$ {totalSale.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-600">Lucro</span>
                      <p className={`font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        R$ {profit.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-600 flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Margem
                      </span>
                      <p className={`font-semibold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {profitMargin.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Calculator className="h-5 w-5 mr-2 text-blue-600" />
              Resumo Financeiro dos Materiais
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-sm text-gray-600">Custo Total</span>
                <p className="text-lg font-bold text-gray-900">
                  R$ {grandTotals.totalCost.toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Venda Total</span>
                <p className="text-lg font-bold text-green-600">
                  R$ {grandTotals.totalSale.toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Lucro Total</span>
                <p className={`text-lg font-bold ${grandTotals.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {grandTotals.profit.toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Margem Média
                </span>
                <p className={`text-lg font-bold ${grandProfitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {grandProfitMargin.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ServiceCatalogMaterialsManager
