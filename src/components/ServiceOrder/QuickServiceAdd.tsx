import React, { useState, useRef, useEffect } from 'react'
import { Plus, Search, Package, Loader2, Zap } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface ServiceItem {
  id: string
  service_catalog_id?: string
  descricao: string
  escopo_detalhado?: string
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
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [searching, setSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = async () => {
    const term = searchTerm.trim()
    setHasSearched(true)
    setSearching(true)
    setShowDropdown(true)

    try {
      let query = supabase
        .from('service_catalog')
        .select(`
          id, name, description, category, base_price, estimated_time_minutes, active,
          service_catalog_materials(
            id, material_id, quantity, material_name, material_unit,
            unit_cost_at_time, unit_sale_price
          )
        `)
        .eq('active', true)
        .order('name')
        .limit(20)

      if (term) {
        query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%,category.ilike.%${term}%`)
      }

      const { data, error } = await query
      if (error) throw error

      setSearchResults((data || []).map(normalizeItem))
    } catch (err) {
      console.error('Erro na busca:', err)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const normalizeItem = (item: any) => ({
    id: item.id,
    nome: item.name,
    descricao: item.description,
    categoria: item.category,
    preco_base: item.base_price,
    tempo_estimado_minutos: item.estimated_time_minutes,
    materiais: (item.service_catalog_materials || []).map((m: any) => ({
      material_id: m.material_id,
      quantidade: parseFloat(m.quantity || 1),
      nome: m.material_name || '',
      unidade_medida: m.material_unit || 'un',
      preco_compra: parseFloat(m.unit_cost_at_time || 0),
      preco_venda: parseFloat(m.unit_sale_price || m.unit_cost_at_time || 0)
    }))
  })

  const enrichCatalogItem = (item: any) => item

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  const handleSelectService = (catalogService: any) => {
    const materiais = (catalogService.materiais || []).map((m: any) => {
      const qtd = parseFloat(m.quantidade || 1)
      const precoCompra = parseFloat(m.preco_compra || 0)
      const precoVenda = parseFloat(m.preco_venda || m.preco_compra || 0)
      return {
        id: `mat-${Date.now()}-${Math.random()}`,
        material_id: m.material_id,
        nome: m.nome || '',
        quantidade: qtd,
        unidade_medida: m.unidade_medida || 'un',
        preco_compra_unitario: precoCompra,
        preco_venda_unitario: precoVenda,
        preco_compra: precoCompra * qtd,
        preco_venda: precoVenda * qtd,
        custo_total: precoCompra * qtd,
        valor_total: precoVenda * qtd,
        lucro: (precoVenda - precoCompra) * qtd
      }
    })

    const precoBase = parseFloat(catalogService.preco_base || 0)
    const custoMateriais = materiais.reduce((s: number, m: any) => s + m.custo_total, 0)
    const lucro = precoBase - custoMateriais
    const margemLucro = precoBase > 0 ? (lucro / precoBase) * 100 : 100

    const newService: ServiceItem = {
      id: `service-${Date.now()}`,
      service_catalog_id: catalogService.id,
      descricao: catalogService.nome || '',
      escopo_detalhado: catalogService.descricao || '',
      quantidade: 1,
      preco_unitario: precoBase,
      preco_total: precoBase,
      tempo_estimado_minutos: catalogService.tempo_estimado_minutos || 60,
      materiais,
      funcionarios: [],
      custo_materiais: custoMateriais,
      custo_mao_obra: 0,
      custo_total: custoMateriais,
      lucro,
      margem_lucro: margemLucro
    }

    onAddService(newService)
    setSearchTerm('')
    setSearchResults([])
    setShowDropdown(false)
    setHasSearched(false)
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 shadow-sm border-2 border-blue-200">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Zap className="h-5 w-5 text-blue-600" />
        Adicionar Serviço do Catálogo
      </h2>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (hasSearched && searchResults.length > 0) setShowDropdown(true)
            }}
            className="w-full px-4 py-3 pr-4 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            placeholder="Nome ou categoria do serviço..."
          />

          {showDropdown && (
            <div
              ref={dropdownRef}
              className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-xl max-h-80 overflow-y-auto"
            >
              {searching ? (
                <div className="flex items-center justify-center gap-2 p-6 text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Buscando serviços...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">
                  Nenhum serviço encontrado para "{searchTerm}"
                </div>
              ) : (
                searchResults.map(service => (
                  <button
                    key={service.id}
                    onClick={() => handleSelectService(service)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-b-0 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{service.nome}</p>
                        {service.descricao && (
                          <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{service.descricao}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          {service.categoria && (
                            <span className="bg-gray-100 px-2 py-0.5 rounded">{service.categoria}</span>
                          )}
                          {service.tempo_estimado_minutos > 0 && (
                            <span>{service.tempo_estimado_minutos} min</span>
                          )}
                          {service.materiais?.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              {service.materiais.length} mat.
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-green-600 text-sm">
                          R$ {parseFloat(service.preco_base || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleSearch}
          disabled={searching}
          className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium disabled:opacity-50"
        >
          {searching ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Search className="h-5 w-5" />
          )}
          Buscar
        </button>

        <button
          onClick={onAddCustomService}
          className="px-4 py-3 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap flex items-center gap-2 font-medium"
        >
          <Plus className="h-5 w-5" />
          Customizado
        </button>
      </div>

      <p className="mt-3 text-xs text-blue-600">
        Digite o nome do serviço e clique em Buscar ou pressione Enter para pesquisar no catálogo
      </p>
    </div>
  )
}
