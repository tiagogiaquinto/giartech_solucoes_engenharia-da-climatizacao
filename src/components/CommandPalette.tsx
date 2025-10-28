import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  FileText,
  Users,
  Package,
  DollarSign,
  Settings,
  Plus,
  ArrowRight,
  Clock,
  TrendingUp
} from 'lucide-react'
import { supabase } from '../lib/supabase'

interface SearchResult {
  id: string
  type: 'service_order' | 'customer' | 'product' | 'employee' | 'action' | 'page'
  title: string
  subtitle?: string
  icon: React.ReactNode
  link: string
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  // Quick actions (sempre visíveis)
  const quickActions: SearchResult[] = [
    {
      id: 'new-os',
      type: 'action',
      title: 'Nova Ordem de Serviço',
      icon: <Plus className="h-4 w-4" />,
      link: '/service-orders/create'
    },
    {
      id: 'new-customer',
      type: 'action',
      title: 'Novo Cliente',
      icon: <Users className="h-4 w-4" />,
      link: '/customers/new'
    },
    {
      id: 'new-finance',
      type: 'action',
      title: 'Novo Lançamento Financeiro',
      icon: <DollarSign className="h-4 w-4" />,
      link: '/financial/new'
    },
    {
      id: 'dashboard',
      type: 'page',
      title: 'Dashboard',
      icon: <TrendingUp className="h-4 w-4" />,
      link: '/dashboard'
    },
    {
      id: 'service-orders',
      type: 'page',
      title: 'Ordens de Serviço',
      icon: <FileText className="h-4 w-4" />,
      link: '/service-orders'
    },
    {
      id: 'customers',
      type: 'page',
      title: 'Clientes',
      icon: <Users className="h-4 w-4" />,
      link: '/client-management'
    },
    {
      id: 'inventory',
      type: 'page',
      title: 'Estoque',
      icon: <Package className="h-4 w-4" />,
      link: '/inventory'
    },
    {
      id: 'settings',
      type: 'page',
      title: 'Configurações',
      icon: <Settings className="h-4 w-4" />,
      link: '/settings'
    }
  ]

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  useEffect(() => {
    if (query.trim() === '') {
      setResults(quickActions)
      return
    }

    performSearch(query)
  }, [query])

  const performSearch = async (searchQuery: string) => {
    setLoading(true)
    const searchResults: SearchResult[] = []

    try {
      const lowerQuery = searchQuery.toLowerCase()

      // Buscar OSs
      const { data: orders } = await supabase
        .from('service_orders')
        .select('id, order_number, status')
        .or(`order_number.ilike.%${searchQuery}%,status.ilike.%${searchQuery}%`)
        .limit(5)

      orders?.forEach(order => {
        searchResults.push({
          id: order.id,
          type: 'service_order',
          title: `OS #${order.order_number}`,
          subtitle: order.status,
          icon: <FileText className="h-4 w-4" />,
          link: `/service-orders/${order.id}`
        })
      })

      // Buscar Clientes
      const { data: customers } = await supabase
        .from('customers')
        .select('id, name, email')
        .or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(5)

      customers?.forEach(customer => {
        searchResults.push({
          id: customer.id,
          type: 'customer',
          title: customer.name,
          subtitle: customer.email,
          icon: <Users className="h-4 w-4" />,
          link: `/client-management?customer=${customer.id}`
        })
      })

      // Buscar Produtos/Serviços
      const { data: products } = await supabase
        .from('service_catalog')
        .select('id, name, category')
        .ilike('name', `%${searchQuery}%`)
        .limit(5)

      products?.forEach(product => {
        searchResults.push({
          id: product.id,
          type: 'product',
          title: product.name,
          subtitle: product.category,
          icon: <Package className="h-4 w-4" />,
          link: `/service-catalog/${product.id}`
        })
      })

      // Buscar Funcionários
      const { data: employees } = await supabase
        .from('employees')
        .select('id, name, role')
        .ilike('name', `%${searchQuery}%`)
        .limit(5)

      employees?.forEach(employee => {
        searchResults.push({
          id: employee.id,
          type: 'employee',
          title: employee.name,
          subtitle: employee.role,
          icon: <Users className="h-4 w-4" />,
          link: `/employees/${employee.id}`
        })
      })

      // Adicionar ações rápidas que correspondem à busca
      const filteredActions = quickActions.filter(action =>
        action.title.toLowerCase().includes(lowerQuery)
      )

      setResults([...filteredActions, ...searchResults])
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  const handleSelect = (result: SearchResult) => {
    navigate(result.link)
    onClose()
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'service_order':
        return 'Ordem de Serviço'
      case 'customer':
        return 'Cliente'
      case 'product':
        return 'Produto/Serviço'
      case 'employee':
        return 'Funcionário'
      case 'action':
        return 'Ação Rápida'
      case 'page':
        return 'Página'
      default:
        return ''
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'service_order':
        return 'text-blue-600 bg-blue-50'
      case 'customer':
        return 'text-green-600 bg-green-50'
      case 'product':
        return 'text-purple-600 bg-purple-50'
      case 'employee':
        return 'text-orange-600 bg-orange-50'
      case 'action':
        return 'text-red-600 bg-red-50'
      case 'page':
        return 'text-gray-600 bg-gray-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Command Palette */}
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 w-full max-w-2xl z-50">
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center px-4 py-3 border-b border-gray-200">
            <Search className="h-5 w-5 text-gray-400 mr-3" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar em tudo... (↑↓ para navegar, Enter para selecionar, Esc para fechar)"
              className="flex-1 outline-none text-gray-900 placeholder-gray-400"
            />
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            )}
          </div>

          {/* Results */}
          <div className="max-h-[500px] overflow-y-auto">
            {results.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhum resultado encontrado</p>
                <p className="text-sm mt-1">Tente buscar por nome, número ou categoria</p>
              </div>
            ) : (
              <div className="py-2">
                {/* Group by type */}
                {query === '' && (
                  <div className="px-3 py-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Ações Rápidas
                    </h3>
                  </div>
                )}

                {results.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={() => handleSelect(result)}
                    className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                      index === selectedIndex ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${getTypeColor(result.type)}`}>
                      {result.icon}
                    </div>

                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900">{result.title}</div>
                      {result.subtitle && (
                        <div className="text-sm text-gray-500">{result.subtitle}</div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(result.type)}`}>
                        {getTypeLabel(result.type)}
                      </span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span>↑↓ Navegar</span>
              <span>Enter Selecionar</span>
              <span>Esc Fechar</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded">Ctrl</kbd>
              <span>+</span>
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded">K</kbd>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Hook para abrir o Command Palette
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev)
  }
}
