import React, { useState } from 'react'
import { Plus, Zap, Package } from 'lucide-react'

interface ServiceItem {
  id: string
  descricao: string
  quantidade: number
  preco_unitario: number
  preco_total: number
  tempo_estimado_minutos: number
  materiais: any[]
  funcionarios: any[]
  custo_materiais: number
  custo_mao_obra: number
  custo_total: number
  lucro: number
  margem_lucro: number
}

interface QuickServiceAddProps {
  serviceCatalog: any[]
  onAddService: (service: ServiceItem) => void
  onAddCustomService: () => void
}

export const QuickServiceAdd: React.FC<QuickServiceAddProps> = ({
  serviceCatalog,
  onAddService,
  onAddCustomService
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  const filteredServices = serviceCatalog.filter(s =>
    s.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelectService = (catalogService: any) => {
    const newService: ServiceItem = {
      id: `service-${Date.now()}`,
      descricao: catalogService.nome || '',
      quantidade: 1,
      preco_unitario: parseFloat(catalogService.preco_base || 0),
      preco_total: parseFloat(catalogService.preco_base || 0),
      tempo_estimado_minutos: catalogService.tempo_estimado_minutos || 60,
      materiais: catalogService.materiais?.map((m: any) => ({
        id: `mat-${Date.now()}-${Math.random()}`,
        material_id: m.material_id,
        nome: m.material_nome || m.nome || '',
        quantidade: m.quantidade || 1,
        unidade_medida: m.unidade_medida || 'un',
        preco_compra_unitario: parseFloat(m.preco_compra || 0),
        preco_venda_unitario: parseFloat(m.preco_venda || m.preco_compra || 0),
        preco_compra: parseFloat(m.preco_compra || 0) * (m.quantidade || 1),
        preco_venda: parseFloat(m.preco_venda || m.preco_compra || 0) * (m.quantidade || 1),
        custo_total: parseFloat(m.preco_compra || 0) * (m.quantidade || 1),
        valor_total: parseFloat(m.preco_venda || m.preco_compra || 0) * (m.quantidade || 1),
        lucro: (parseFloat(m.preco_venda || m.preco_compra || 0) - parseFloat(m.preco_compra || 0)) * (m.quantidade || 1)
      })) || [],
      funcionarios: [],
      custo_materiais: 0,
      custo_mao_obra: 0,
      custo_total: 0,
      lucro: parseFloat(catalogService.preco_base || 0),
      margem_lucro: 100
    }

    const custoMateriais = newService.materiais.reduce((sum, m) => sum + m.custo_total, 0)
    newService.custo_materiais = custoMateriais
    newService.custo_total = custoMateriais
    newService.lucro = newService.preco_total - newService.custo_total
    newService.margem_lucro = newService.custo_total > 0
      ? ((newService.lucro / newService.preco_total) * 100)
      : 100

    onAddService(newService)
    setSearchTerm('')
    setShowDropdown(false)
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm border-2 border-blue-200">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Zap className="h-5 w-5 text-blue-600" />
        Adicionar Serviço Rápido
      </h2>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setShowDropdown(true)
            }}
            onFocus={() => setShowDropdown(true)}
            className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            placeholder="Buscar serviço do catálogo..."
          />

          {showDropdown && filteredServices.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-white border rounded-lg shadow-xl max-h-80 overflow-y-auto">
              {filteredServices.slice(0, 10).map(service => (
                <button
                  key={service.id}
                  onClick={() => handleSelectService(service)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-b-0 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{service.nome}</p>
                      {service.descricao && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{service.descricao}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        {service.tempo_estimado_minutos && (
                          <span>{service.tempo_estimado_minutos} min</span>
                        )}
                        {service.materiais && service.materiais.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {service.materiais.length} materiais
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        R$ {parseFloat(service.preco_base || 0).toFixed(2)}
                      </p>
                      {service.custo_total > 0 && (
                        <p className="text-xs text-gray-500">
                          Custo: R$ {parseFloat(service.custo_total || 0).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onAddCustomService}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap flex items-center gap-2 font-medium"
        >
          <Plus className="h-5 w-5" />
          Serviço Customizado
        </button>
      </div>

      <div className="mt-3 text-sm text-blue-700 bg-blue-100 rounded-lg p-3">
        💡 <strong>Dica:</strong> Selecione um serviço do catálogo para adicionar automaticamente com materiais pré-configurados
      </div>
    </div>
  )
}
