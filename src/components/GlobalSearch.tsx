/**
 * Global Search Component (Cmd+K / Ctrl+K)
 *
 * Busca unificada em todas entidades do sistema
 * Quick actions para ações rápidas
 * Atalhos de teclado
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  Search,
  FileText,
  Users,
  Package,
  DollarSign,
  UserCircle,
  Plus,
  Command,
  X,
  Loader2
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

interface SearchResult {
  id: string
  type: 'os' | 'cliente' | 'funcionario' | 'material' | 'financeiro' | 'action'
  title: string
  subtitle?: string
  url: string
  icon: React.ReactNode
  badge?: string
}

interface GlobalSearchProps {
  isOpen: boolean
  onClose: () => void
}

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()

  // Quick Actions (sempre visíveis quando query vazia)
  const quickActions: SearchResult[] = [
    {
      id: 'new-os',
      type: 'action',
      title: 'Nova Ordem de Serviço',
      subtitle: 'Criar OS rapidamente',
      url: '/service-orders/create',
      icon: <Plus className="w-5 h-5 text-blue-600" />,
      badge: 'Ctrl+N'
    },
    {
      id: 'new-cliente',
      type: 'action',
      title: 'Novo Cliente',
      subtitle: 'Cadastrar cliente',
      url: '/clients/new',
      icon: <Plus className="w-5 h-5 text-green-600" />
    },
    {
      id: 'new-lancamento',
      type: 'action',
      title: 'Novo Lançamento',
      subtitle: 'Adicionar receita/despesa',
      url: '/financial/new',
      icon: <Plus className="w-5 h-5 text-purple-600" />
    }
  ]

  // Buscar em todas as entidades
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults(quickActions)
      return
    }

    setLoading(true)
    try {
      const searchResults: SearchResult[] = []
      const lowerQuery = searchQuery.toLowerCase()

      // 1. Buscar Ordens de Serviço
      const { data: oss } = await supabase
        .from('service_orders')
        .select('id, order_number, client_name, status')
        .or(`order_number.ilike.%${searchQuery}%,client_name.ilike.%${searchQuery}%`)
        .limit(3)

      oss?.forEach(os => {
        searchResults.push({
          id: os.id,
          type: 'os',
          title: `OS #${os.order_number}`,
          subtitle: os.client_name,
          url: `/service-orders/${os.id}`,
          icon: <FileText className="w-5 h-5 text-blue-600" />,
          badge: os.status
        })
      })

      // 2. Buscar Clientes
      const { data: clientes } = await supabase
        .from('customers')
        .select('id, name, document, phone')
        .or(`name.ilike.%${searchQuery}%,document.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
        .limit(3)

      clientes?.forEach(cliente => {
        searchResults.push({
          id: cliente.id,
          type: 'cliente',
          title: cliente.name,
          subtitle: cliente.document || cliente.phone,
          url: `/clients/${cliente.id}`,
          icon: <Users className="w-5 h-5 text-green-600" />
        })
      })

      // 3. Buscar Funcionários
      const { data: funcionarios } = await supabase
        .from('employees')
        .select('id, name, role, phone')
        .or(`name.ilike.%${searchQuery}%,role.ilike.%${searchQuery}%`)
        .limit(3)

      funcionarios?.forEach(func => {
        searchResults.push({
          id: func.id,
          type: 'funcionario',
          title: func.name,
          subtitle: func.role || func.phone,
          url: `/employees/${func.id}`,
          icon: <UserCircle className="w-5 h-5 text-purple-600" />
        })
      })

      // 4. Buscar Materiais/Estoque
      const { data: materiais } = await supabase
        .from('inventory_items')
        .select('id, name, sku, current_stock')
        .or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`)
        .limit(3)

      materiais?.forEach(mat => {
        searchResults.push({
          id: mat.id,
          type: 'material',
          title: mat.name,
          subtitle: `SKU: ${mat.sku} | Estoque: ${mat.current_stock}`,
          url: `/inventory/${mat.id}`,
          icon: <Package className="w-5 h-5 text-orange-600" />
        })
      })

      // 5. Buscar Lançamentos Financeiros
      const { data: lancamentos } = await supabase
        .from('finance_entries')
        .select('id, description, amount, type, due_date')
        .ilike('description', `%${searchQuery}%`)
        .order('due_date', { ascending: false })
        .limit(3)

      lancamentos?.forEach(lanc => {
        searchResults.push({
          id: lanc.id,
          type: 'financeiro',
          title: lanc.description,
          subtitle: `R$ ${lanc.amount.toFixed(2)} - ${new Date(lanc.due_date).toLocaleDateString()}`,
          url: `/financial/${lanc.id}`,
          icon: <DollarSign className="w-5 h-5 text-emerald-600" />,
          badge: lanc.type === 'receita' ? 'Receita' : 'Despesa'
        })
      })

      setResults(searchResults.length > 0 ? searchResults : [
        {
          id: 'no-results',
          type: 'action',
          title: 'Nenhum resultado encontrado',
          subtitle: `Nada encontrado para "${searchQuery}"`,
          url: '#',
          icon: <Search className="w-5 h-5 text-gray-400" />
        }
      ])
    } catch (error) {
      console.error('Erro na busca:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      performSearch(query)
    }, 300)

    return () => clearTimeout(timeout)
  }, [query, performSearch])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (results[selectedIndex]) {
          navigate(results[selectedIndex].url)
          onClose()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, selectedIndex, navigate, onClose])

  // Reset quando abre
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setResults(quickActions)
      setSelectedIndex(0)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Search Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar OSs, clientes, funcionários, materiais..."
            className="flex-1 text-lg bg-transparent border-none outline-none"
            autoFocus
          />
          {loading && <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />}
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Digite para buscar...</p>
            </div>
          ) : (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => {
                    if (result.url !== '#') {
                      navigate(result.url)
                      onClose()
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                    index === selectedIndex ? 'bg-blue-50' : ''
                  }`}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    {result.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900">{result.title}</div>
                    {result.subtitle && (
                      <div className="text-sm text-gray-500">{result.subtitle}</div>
                    )}
                  </div>

                  {/* Badge */}
                  {result.badge && (
                    <div className="flex-shrink-0 text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                      {result.badge}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer with hint */}
        <div className="px-4 py-2 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-300 font-mono">↑↓</kbd>
              <span>Navegar</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-300 font-mono">Enter</kbd>
              <span>Selecionar</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-300 font-mono">Esc</kbd>
              <span>Fechar</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Command className="w-3 h-3" />
            <span>+K para abrir</span>
          </div>
        </div>
      </div>
    </div>
  )
}
