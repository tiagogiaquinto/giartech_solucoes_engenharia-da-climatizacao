import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Clock, FileText, Users, Package, User, DollarSign, Calendar, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

interface SearchResult {
  id: string
  title: string
  subtitle: string
  type: 'os' | 'customer' | 'product' | 'employee' | 'finance' | 'agenda'
  url: string
  icon: React.ReactNode
  metadata?: string
}

interface GlobalSearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  // Carregar buscas recentes do localStorage
  useEffect(() => {
    const recent = localStorage.getItem('recentSearches')
    if (recent) {
      setRecentSearches(JSON.parse(recent))
    }
  }, [])

  // Focar input quando abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Buscar quando query mudar (debounce)
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const timer = setTimeout(() => {
      performSearch(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault()
        handleSelectResult(results[selectedIndex])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, selectedIndex])

  const performSearch = async (searchQuery: string) => {
    setLoading(true)
    const searchResults: SearchResult[] = []

    try {
      const searchTerm = `%${searchQuery}%`

      // Buscar OSs
      const { data: orders } = await supabase
        .from('service_orders')
        .select('id, order_number, title, client_name, status')
        .or(`order_number.ilike.${searchTerm},title.ilike.${searchTerm},client_name.ilike.${searchTerm}`)
        .limit(5)

      orders?.forEach(order => {
        searchResults.push({
          id: order.id,
          title: `OS ${order.order_number || order.id}`,
          subtitle: order.title || order.client_name || 'Sem título',
          type: 'os',
          url: `/service-orders/${order.id}`,
          icon: <FileText className="h-5 w-5 text-blue-600" />,
          metadata: order.status
        })
      })

      // Buscar Clientes
      const { data: customers } = await supabase
        .from('customers')
        .select('id, nome_razao, nome_fantasia, email, telefone')
        .or(`nome_razao.ilike.${searchTerm},nome_fantasia.ilike.${searchTerm},email.ilike.${searchTerm}`)
        .limit(5)

      customers?.forEach(customer => {
        searchResults.push({
          id: customer.id,
          title: customer.nome_fantasia || customer.nome_razao,
          subtitle: customer.email || customer.telefone || 'Cliente',
          type: 'customer',
          url: `/clientes/${customer.id}`,
          icon: <Users className="h-5 w-5 text-green-600" />
        })
      })

      // Buscar Produtos/Materiais
      const { data: materials } = await supabase
        .from('inventory_items')
        .select('id, name, sku, category')
        .or(`name.ilike.${searchTerm},sku.ilike.${searchTerm}`)
        .limit(5)

      materials?.forEach(material => {
        searchResults.push({
          id: material.id,
          title: material.name,
          subtitle: `SKU: ${material.sku || 'N/A'} | ${material.category || 'Produto'}`,
          type: 'product',
          url: `/inventory/${material.id}`,
          icon: <Package className="h-5 w-5 text-purple-600" />
        })
      })

      // Buscar Funcionários
      const { data: employees } = await supabase
        .from('employees')
        .select('id, nome_completo, cargo, telefone')
        .ilike('nome_completo', searchTerm)
        .limit(5)

      employees?.forEach(employee => {
        searchResults.push({
          id: employee.id,
          title: employee.nome_completo,
          subtitle: employee.cargo || 'Funcionário',
          type: 'employee',
          url: `/employees/${employee.id}`,
          icon: <User className="h-5 w-5 text-orange-600" />,
          metadata: employee.telefone
        })
      })

      // Buscar Lançamentos Financeiros
      const { data: finances } = await supabase
        .from('finance_entries')
        .select('id, descricao, valor, tipo, status')
        .ilike('descricao', searchTerm)
        .limit(5)

      finances?.forEach(finance => {
        searchResults.push({
          id: finance.id,
          title: finance.descricao,
          subtitle: `R$ ${finance.valor.toFixed(2)} - ${finance.tipo}`,
          type: 'finance',
          url: `/financeiro`,
          icon: <DollarSign className="h-5 w-5 text-emerald-600" />,
          metadata: finance.status
        })
      })

      // Buscar Eventos da Agenda
      const { data: events } = await supabase
        .from('agenda_events')
        .select('id, title, start_date, event_type')
        .ilike('title', searchTerm)
        .limit(5)

      events?.forEach(event => {
        searchResults.push({
          id: event.id,
          title: event.title,
          subtitle: new Date(event.start_date).toLocaleDateString('pt-BR'),
          type: 'agenda',
          url: `/agenda`,
          icon: <Calendar className="h-5 w-5 text-indigo-600" />,
          metadata: event.event_type
        })
      })

      setResults(searchResults)
      setSelectedIndex(0)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectResult = (result: SearchResult) => {
    // Salvar busca recente
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))

    // Navegar
    navigate(result.url)
    onClose()
  }

  const handleRecentSearch = (search: string) => {
    setQuery(search)
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('recentSearches')
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="flex min-h-screen items-start justify-center p-4 pt-[10vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Header com Input */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-200">
              <Search className="h-5 w-5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar OSs, clientes, produtos..."
                className="flex-1 text-lg outline-none"
              />
              {loading && (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
              )}
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Resultados ou Buscas Recentes */}
            <div className="max-h-[60vh] overflow-y-auto">
              {!query.trim() && recentSearches.length > 0 ? (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>Buscas Recentes</span>
                    </div>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Limpar
                    </button>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleRecentSearch(search)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              ) : results.length > 0 ? (
                <div className="p-2">
                  {results.map((result, index) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelectResult(result)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        index === selectedIndex
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex-shrink-0">{result.icon}</div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {result.title}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {result.subtitle}
                        </div>
                      </div>
                      {result.metadata && (
                        <div className="flex-shrink-0 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                          {result.metadata}
                        </div>
                      )}
                      <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              ) : query.trim() ? (
                <div className="p-12 text-center text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhum resultado encontrado</p>
                  <p className="text-sm mt-1">Tente buscar por outro termo</p>
                </div>
              ) : (
                <div className="p-12 text-center text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Digite para buscar</p>
                  <p className="text-sm mt-1">OSs, clientes, produtos, funcionários...</p>
                </div>
              )}
            </div>

            {/* Footer com atalhos */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded">↑↓</kbd>
                  Navegar
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded">Enter</kbd>
                  Abrir
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded">Esc</kbd>
                  Fechar
                </span>
              </div>
              <span>{results.length} resultado(s)</span>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  )
}
