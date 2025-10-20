import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { 
  FileText, 
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  Clock,
  DollarSign
} from 'lucide-react'
import { useUser } from '../contexts/UserContext'

const ServiceCatalogDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAdmin } = useUser()

  // Sample data - in a real app, you would fetch this from your API
  const service = {
    id: Number(id),
    name: 'Instalação de Ar Condicionado Split',
    category: 'Instalação',
    description: 'Instalação completa de ar condicionado split incluindo suporte, tubulação e testes. O serviço inclui a fixação da unidade externa, passagem da tubulação, conexão elétrica e testes de funcionamento.',
    materials: [
      { id: 1, name: 'Suporte para Ar Condicionado', quantity: 1, price: 50.00 },
      { id: 2, name: 'Tubulação de Cobre 3m', quantity: 1, price: 80.00 },
      { id: 3, name: 'Cabo PP 3x2.5mm 5m', quantity: 1, price: 20.00 }
    ],
    price: 350.00,
    estimatedTime: '3 horas',
    instructions: [
      'Verifique se o local de instalação está adequado',
      'Instale o suporte da unidade externa',
      'Fixe a unidade interna na parede',
      'Conecte a tubulação entre as unidades',
      'Faça a conexão elétrica',
      'Teste o funcionamento do equipamento'
    ]
  }

  const totalMaterialsCost = service.materials.reduce((acc, material) => acc + material.price, 0)
  const laborCost = service.price - totalMaterialsCost

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
          <h1 className="text-2xl font-bold text-gray-900">{service.name}</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            {service.category}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => navigate(`/service-catalog/${id}/edit`)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
        >
          <Edit className="h-4 w-4" />
          <span>Editar</span>
        </button>
        
        <button
          onClick={() => navigate('/service-orders/create', { state: { serviceId: id } })}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
        >
          <FileText className="h-4 w-4" />
          <span>Criar OS</span>
        </button>
        
        {isAdmin && (
          <button
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center space-x-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>Excluir</span>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">{service.name}</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>{service.estimatedTime}</span>
                </div>
                {isAdmin && (
                  <div className="flex items-center space-x-1 text-sm font-medium text-green-600">
                    <DollarSign className="h-4 w-4" />
                    <span>R$ {service.price.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <FileText className="h-4 w-4 mr-2 text-purple-500" />
              Descrição
            </h3>
            <p className="text-sm text-gray-700">{service.description}</p>
          </div>

          {/* Materials */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <Package className="h-4 w-4 mr-2 text-purple-500" />
              Materiais Necessários
            </h3>
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Material
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantidade
                    </th>
                    {isAdmin && (
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {service.materials.map((material) => (
                    <tr key={material.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {material.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {material.quantity}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          R$ {material.price.toFixed(2)}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                {isAdmin && (
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                        Custo de Materiais:
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                        R$ {totalMaterialsCost.toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                        Mão de Obra:
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                        R$ {laborCost.toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                        Valor Total:
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 text-right">
                        R$ {service.price.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Instructions */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <FileText className="h-4 w-4 mr-2 text-purple-500" />
              Instruções de Execução
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <ol className="list-decimal pl-5 space-y-2">
                {service.instructions.map((instruction, index) => (
                  <li key={index} className="text-sm text-gray-700">{instruction}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServiceCatalogDetail