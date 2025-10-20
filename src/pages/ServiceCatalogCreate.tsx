import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  FileText, 
  ArrowLeft,
  Save,
  Package,
  Plus,
  Trash2,
  Clock,
  DollarSign
} from 'lucide-react'

const ServiceCatalogCreate = () => {
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    estimatedTime: '',
    price: 0,
    materials: [] as Array<{id: number, name: string, quantity: number, price: number}>,
    instructions: [''] as string[]
  })

  const categories = ['Instalação', 'Manutenção', 'Reparo', 'Limpeza', 'Consultoria']

  // Sample materials from inventory for selection
  const inventoryItems = [
    { id: 1, name: 'Suporte para Ar Condicionado', price: 50.00 },
    { id: 2, name: 'Tubulação de Cobre 3m', price: 80.00 },
    { id: 3, name: 'Cabo PP 3x2.5mm 5m', price: 20.00 },
    { id: 4, name: 'Produto de Limpeza', price: 25.00 },
    { id: 5, name: 'Filtro de Ar', price: 35.00 },
    { id: 6, name: 'Gás Refrigerante R410A', price: 120.00 },
    { id: 7, name: 'Vedante', price: 15.00 },
    { id: 8, name: 'Compressor 9000 BTUs', price: 350.00 },
    { id: 9, name: 'Compressor 12000 BTUs', price: 450.00 },
    { id: 10, name: 'Controle Remoto Universal', price: 45.00 }
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    if (name === 'price') {
      setFormData({
        ...formData,
        [name]: parseFloat(value) || 0
      })
    } else {
      setFormData({
        ...formData,
        [name]: value
      })
    }
  }

  const handleAddMaterial = () => {
    setFormData({
      ...formData,
      materials: [
        ...formData.materials,
        { id: Date.now(), name: '', quantity: 1, price: 0 }
      ]
    })
  }

  const handleMaterialChange = (index: number, field: string, value: any) => {
    const updatedMaterials = [...formData.materials]
    
    if (field === 'name') {
      // If selecting from inventory
      if (typeof value === 'object') {
        updatedMaterials[index] = {
          ...updatedMaterials[index],
          id: value.id,
          name: value.name,
          price: value.price
        }
      } else {
        updatedMaterials[index] = {
          ...updatedMaterials[index],
          [field]: value
        }
      }
    } else if (field === 'quantity' || field === 'price') {
      updatedMaterials[index] = {
        ...updatedMaterials[index],
        [field]: parseFloat(value) || 0
      }
    } else {
      updatedMaterials[index] = {
        ...updatedMaterials[index],
        [field]: value
      }
    }
    
    setFormData({
      ...formData,
      materials: updatedMaterials
    })
  }

  const handleRemoveMaterial = (index: number) => {
    const updatedMaterials = [...formData.materials]
    updatedMaterials.splice(index, 1)
    
    setFormData({
      ...formData,
      materials: updatedMaterials
    })
  }

  const handleAddInstruction = () => {
    setFormData({
      ...formData,
      instructions: [...formData.instructions, '']
    })
  }

  const handleInstructionChange = (index: number, value: string) => {
    const updatedInstructions = [...formData.instructions]
    updatedInstructions[index] = value
    
    setFormData({
      ...formData,
      instructions: updatedInstructions
    })
  }

  const handleRemoveInstruction = (index: number) => {
    const updatedInstructions = [...formData.instructions]
    updatedInstructions.splice(index, 1)
    
    setFormData({
      ...formData,
      instructions: updatedInstructions
    })
  }

  const calculateTotalMaterialsCost = () => {
    return formData.materials.reduce((acc, material) => acc + (material.quantity * material.price), 0)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
    
    // In a real app, you would send this data to your backend
    // For now, we'll just navigate back to the list
    navigate('/service-catalog')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/service-catalog')}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Novo Serviço</h1>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-purple-500" />
            Informações Básicas
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Serviço
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nome do serviço"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Selecione uma categoria</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tempo Estimado
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  name="estimatedTime"
                  value={formData.estimatedTime}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 2 horas"
                  required
                />
              </div>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Descrição detalhada do serviço"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preço (R$)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Materials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Package className="h-5 w-5 mr-2 text-purple-500" />
              Materiais Necessários
            </h2>
            <button 
              type="button"
              onClick={handleAddMaterial}
              className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg flex items-center space-x-1 hover:bg-purple-200 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Adicionar</span>
            </button>
          </div>
          
          {formData.materials.length > 0 ? (
            <div className="space-y-4">
              {formData.materials.map((material, index) => (
                <div 
                  key={index}
                  className="p-4 border border-gray-100 rounded-lg"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-5">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Material
                      </label>
                      <select
                        value={material.name}
                        onChange={(e) => {
                          const selectedItem = inventoryItems.find(item => item.name === e.target.value)
                          if (selectedItem) {
                            handleMaterialChange(index, 'name', selectedItem)
                          } else {
                            handleMaterialChange(index, 'name', e.target.value)
                          }
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Selecione um material</option>
                        {inventoryItems.map(item => (
                          <option key={item.id} value={item.name}>{item.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Quantidade
                      </label>
                      <input
                        type="number"
                        value={material.quantity}
                        onChange={(e) => handleMaterialChange(index, 'quantity', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                        required
                      />
                    </div>
                    
                    <div className="md:col-span-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Preço Unitário (R$)
                      </label>
                      <input
                        type="number"
                        value={material.price}
                        onChange={(e) => handleMaterialChange(index, 'price', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    
                    <div className="md:col-span-1 flex items-end justify-end h-full">
                      <button
                        type="button"
                        onClick={() => handleRemoveMaterial(index)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">Custo Total de Materiais:</span>
                <span className="font-bold text-green-600">R$ {calculateTotalMaterialsCost().toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
              <Package className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Nenhum material adicionado</p>
              <p className="text-sm text-gray-400 mb-4">Adicione os materiais necessários para este serviço</p>
              <button
                type="button"
                onClick={handleAddMaterial}
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2 inline" />
                Adicionar Material
              </button>
            </div>
          )}
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-purple-500" />
              Instruções de Execução
            </h2>
            <button 
              type="button"
              onClick={handleAddInstruction}
              className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg flex items-center space-x-1 hover:bg-purple-200 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Adicionar</span>
            </button>
          </div>
          
          {formData.instructions.length > 0 ? (
            <div className="space-y-4">
              {formData.instructions.map((instruction, index) => (
                <div 
                  key={index}
                  className="flex items-center space-x-3"
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-medium">
                    {index + 1}
                  </div>
                  <input
                    type="text"
                    value={instruction}
                    onChange={(e) => handleInstructionChange(index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Passo ${index + 1}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveInstruction(index)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
              <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Nenhuma instrução adicionada</p>
              <p className="text-sm text-gray-400 mb-4">Adicione instruções passo a passo para a execução do serviço</p>
              <button
                type="button"
                onClick={handleAddInstruction}
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2 inline" />
                Adicionar Instrução
              </button>
            </div>
          )}
        </motion.div>

        {/* Submit Button */}
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => navigate('/service-catalog')}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex-1"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all flex-1 flex items-center justify-center"
          >
            <Save className="h-5 w-5 mr-2" />
            Salvar Serviço
          </button>
        </div>
      </form>
    </div>
  )
}

export default ServiceCatalogCreate