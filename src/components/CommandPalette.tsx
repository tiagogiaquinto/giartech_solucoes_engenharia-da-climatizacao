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
  TrendingUp,
  BarChart2,
  Calendar,
  Zap,
  Target,
  ClipboardList,
  Home,
  MessageSquare,
  ShoppingCart,
  Award,
  BookOpen,
  Star
} from 'lucide-react'
import { supabase } from '../lib/supabase'

interface SearchResult {
  id: string
  type: 'service_order' | 'customer' | 'product' | 'employee' | 'action' | 'page' | 'finance' | 'nlp'
  title: string
  subtitle?: string
  icon: React.ReactNode
  link: string
  badge?: string
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

// Mapa de intenção NLP → link
const NLP_INTENTS: Array<{
  patterns: string[]
  result: Omit<SearchResult, 'id'>
}> = [
  {
    patterns: ['lucro', 'resultado', 'ontem', 'semana', 'mês', 'mes', 'financeiro', 'caixa', 'dinheiro'],
    result: { type: 'nlp', title: 'Ver Dashboard CFO', subtitle: 'Análise financeira completa', icon: <BarChart2 className="h-4 w-4" />, link: '/cfo-dashboard', badge: 'CFO' }
  },
  {
    patterns: ['pagar', 'pagamento', 'boleto', 'conta', 'despesa', 'lançamento'],
    result: { type: 'nlp', title: 'Novo Lançamento Financeiro', subtitle: 'Registrar saída ou entrada', icon: <DollarSign className="h-4 w-4" />, link: '/financial/new', badge: 'Financeiro' }
  },
  {
    patterns: ['nova os', 'nova ordem', 'abrir os', 'criar os', 'novo serviço'],
    result: { type: 'nlp', title: 'Nova Ordem de Serviço', subtitle: 'Criar OS rapidamente', icon: <Plus className="h-4 w-4" />, link: '/service-orders/create', badge: 'Ação' }
  },
  {
    patterns: ['agenda', 'agendamento', 'visita', 'compromisso', 'calendario', 'calendário'],
    result: { type: 'nlp', title: 'Ver Agenda', subtitle: 'Compromissos e visitas do dia', icon: <Calendar className="h-4 w-4" />, link: '/calendar', badge: 'Agenda' }
  },
  {
    patterns: ['meta', 'ranking', 'desempenho', 'performance', 'produtividade'],
    result: { type: 'nlp', title: 'Metas & Rankings', subtitle: 'Desempenho da equipe', icon: <Target className="h-4 w-4" />, link: '/goals-rankings', badge: 'Equipe' }
  },
  {
    patterns: ['estoque', 'material', 'produto', 'inventário', 'inventario'],
    result: { type: 'nlp', title: 'Controle de Estoque', subtitle: 'Materiais e inventário', icon: <Package className="h-4 w-4" />, link: '/inventory', badge: 'Estoque' }
  },
  {
    patterns: ['cliente', 'clientes', 'cadastro', 'contato'],
    result: { type: 'nlp', title: 'Gestão de Clientes', subtitle: 'Cadastros e histórico', icon: <Users className="h-4 w-4" />, link: '/client-management', badge: 'Clientes' }
  },
  {
    patterns: ['relatório', 'relatorio', 'semanal', 'report'],
    result: { type: 'nlp', title: 'Relatório Semanal', subtitle: 'Resumo automático com insight Thomaz AI', icon: <BarChart2 className="h-4 w-4" />, link: '/weekly-report', badge: 'Relatório' }
  },
  {
    patterns: ['compras', 'fornecedor', 'pedido de compra', 'cotação', 'cotacao'],
    result: { type: 'nlp', title: 'Departamento de Compras', subtitle: 'Pedidos e fornecedores', icon: <ShoppingCart className="h-4 w-4" />, link: '/purchasing', badge: 'Compras' }
  },
  {
    patterns: ['thomaz', 'ia', 'ai', 'inteligência', 'inteligencia', 'assistente'],
    result: { type: 'nlp', title: 'Thomaz AI', subtitle: 'Análise inteligente do negócio', icon: <Zap className="h-4 w-4" />, link: '/thomaz-dashboard', badge: 'IA' }
  },
  {
    patterns: ['kanban', 'painel', 'quadro', 'pipeline'],
    result: { type: 'nlp', title: 'Kanban de OS', subtitle: 'Visualizar ordens por status', icon: <ClipboardList className="h-4 w-4" />, link: '/service-orders-kanban', badge: 'OS' }
  },
  {
    patterns: ['funcionario', 'funcionário', 'colaborador', 'equipe', 'time', 'salario', 'salário'],
    result: { type: 'nlp', title: 'Gestão de Pessoas', subtitle: 'Funcionários, salários e controle', icon: <Users className="h-4 w-4" />, link: '/people-management', badge: 'RH' }
  },
  {
    patterns: ['gamificação', 'gamificacao', 'pontos', 'badge', 'recompensa'],
    result: { type: 'nlp', title: 'Gamificação', subtitle: 'Pontos, conquistas e rankings', icon: <Award className="h-4 w-4" />, link: '/gamification-hub', badge: 'Game' }
  },
  {
    patterns: ['documento', 'contrato', 'template', 'modelo'],
    result: { type: 'nlp', title: 'Centro de Documentos', subtitle: 'Contratos, PMOC, laudos', icon: <BookOpen className="h-4 w-4" />, link: '/documents', badge: 'Docs' }
  },
]

const QUICK_ACTIONS: SearchResult[] = [
  { id: 'new-os', type: 'action', title: 'Nova Ordem de Serviço', icon: <Plus className="h-4 w-4" />, link: '/service-orders/create' },
  { id: 'new-customer', type: 'action', title: 'Novo Cliente', icon: <Users className="h-4 w-4" />, link: '/customers/new' },
  { id: 'new-finance', type: 'action', title: 'Novo Lançamento Financeiro', icon: <DollarSign className="h-4 w-4" />, link: '/financial/new' },
  { id: 'dashboard', type: 'page', title: 'Dashboard', icon: <Home className="h-4 w-4" />, link: '/dashboard' },
  { id: 'cfo', type: 'page', title: 'Dashboard CFO', subtitle: 'Financeiro e margem', icon: <BarChart2 className="h-4 w-4" />, link: '/cfo-dashboard' },
  { id: 'service-orders', type: 'page', title: 'Ordens de Serviço', icon: <FileText className="h-4 w-4" />, link: '/service-orders' },
  { id: 'calendar', type: 'page', title: 'Agenda', icon: <Calendar className="h-4 w-4" />, link: '/calendar' },
  { id: 'customers', type: 'page', title: 'Clientes', icon: <Users className="h-4 w-4" />, link: '/client-management' },
  { id: 'inventory', type: 'page', title: 'Estoque', icon: <Package className="h-4 w-4" />, link: '/inventory' },
  { id: 'thomaz', type: 'page', title: 'Thomaz AI', icon: <Zap className="h-4 w-4" />, link: '/thomaz-dashboard' },
  { id: 'settings', type: 'page', title: 'Configurações', icon: <Settings className="h-4 w-4" />, link: '/settings' },
  { id: 'chat', type: 'page', title: 'Chat Interno', icon: <MessageSquare className="h-4 w-4" />, link: '/chat' },
  { id: 'weekly-report', type: 'page', title: 'Relatório Semanal', icon: <TrendingUp className="h-4 w-4" />, link: '/weekly-report' },
]

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      setQuery('')
      setSelectedIndex(0)
      setResults(QUICK_ACTIONS)
    }
  }, [isOpen])

  useEffect(() => {
    if (query.trim() === '') {
      setResults(QUICK_ACTIONS)
      return
    }
    performSearch(query)
  }, [query])

  const detectNLP = (q: string): SearchResult[] => {
    const lower = q.toLowerCase()
    const matched: SearchResult[] = []
    for (const intent of NLP_INTENTS) {
      if (intent.patterns.some(p => lower.includes(p))) {
        matched.push({ id: `nlp-${intent.result.title}`, ...intent.result })
      }
    }
    return matched
  }

  const performSearch = async (searchQuery: string) => {
    setLoading(true)
    const nlpResults = detectNLP(searchQuery)
    const dbResults: SearchResult[] = []

    try {
      const [ordersRes, customersRes, productsRes, employeesRes] = await Promise.all([
        supabase.from('service_orders').select('id, order_number, status').or(`order_number.ilike.%${searchQuery}%,status.ilike.%${searchQuery}%`).limit(4),
        supabase.from('customers').select('id, name, email').or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`).limit(4),
        supabase.from('service_catalog').select('id, name, category').ilike('name', `%${searchQuery}%`).limit(3),
        supabase.from('employees').select('id, name, role').eq('active', true).ilike('name', `%${searchQuery}%`).limit(3),
      ])

      ordersRes.data?.forEach(o => dbResults.push({
        id: o.id, type: 'service_order',
        title: `OS #${o.order_number}`, subtitle: o.status,
        icon: <FileText className="h-4 w-4" />, link: `/service-orders/${o.id}`
      }))
      customersRes.data?.forEach(c => dbResults.push({
        id: c.id, type: 'customer',
        title: c.name, subtitle: c.email,
        icon: <Users className="h-4 w-4" />, link: `/client-management?customer=${c.id}`
      }))
      productsRes.data?.forEach(p => dbResults.push({
        id: p.id, type: 'product',
        title: p.name, subtitle: p.category,
        icon: <Package className="h-4 w-4" />, link: `/service-catalog/${p.id}`
      }))
      employeesRes.data?.forEach(e => dbResults.push({
        id: e.id, type: 'employee',
        title: e.name, subtitle: e.role,
        icon: <Users className="h-4 w-4" />, link: `/employees/${e.id}`
      }))

      const filteredActions = QUICK_ACTIONS.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase())
      )

      const seen = new Set<string>()
      const all: SearchResult[] = []
      for (const r of [...nlpResults, ...filteredActions, ...dbResults]) {
        if (!seen.has(r.id)) { seen.add(r.id); all.push(r) }
      }
      setResults(all)
    } catch {
      setResults(nlpResults)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % Math.max(results.length, 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + results.length) % Math.max(results.length, 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[selectedIndex]) handleSelect(results[selectedIndex])
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  const handleSelect = (result: SearchResult) => {
    navigate(result.link)
    onClose()
  }

  const typeConfig: Record<string, { label: string; color: string }> = {
    service_order: { label: 'OS', color: 'text-blue-600 bg-blue-50' },
    customer:      { label: 'Cliente', color: 'text-emerald-600 bg-emerald-50' },
    product:       { label: 'Catálogo', color: 'text-teal-600 bg-teal-50' },
    employee:      { label: 'Equipe', color: 'text-amber-600 bg-amber-50' },
    action:        { label: 'Ação', color: 'text-red-600 bg-red-50' },
    page:          { label: 'Página', color: 'text-gray-600 bg-gray-100' },
    finance:       { label: 'Financeiro', color: 'text-green-700 bg-green-50' },
    nlp:           { label: 'Sugerido', color: 'text-blue-700 bg-blue-50' },
  }

  if (!isOpen) return null

  const showingNLP = query.trim() !== '' && results.some(r => r.type === 'nlp')
  const showingDefault = query.trim() === ''

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />

      <div className="fixed top-16 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Input */}
          <div className="flex items-center px-4 py-3.5 border-b border-gray-100">
            <Search className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar ou digitar um comando... ex: 'ver lucro de ontem', 'nova OS'"
              className="flex-1 outline-none text-gray-900 placeholder-gray-400 text-sm"
            />
            {loading && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin ml-2" />}
            {!loading && query && (
              <button onClick={() => setQuery('')} className="ml-2 text-gray-400 hover:text-gray-600 text-xs">limpar</button>
            )}
          </div>

          {/* NLP hint */}
          {showingNLP && (
            <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
              <Star className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-xs text-blue-600">Detectei sua intenção — mostrando resultados relevantes</span>
            </div>
          )}

          {/* Results */}
          <div className="max-h-[420px] overflow-y-auto">
            {results.length === 0 ? (
              <div className="p-10 text-center text-gray-400">
                <Search className="h-10 w-10 mx-auto mb-3 text-gray-200" />
                <p className="text-sm">Nenhum resultado. Tente "nova os", "clientes", "financeiro"...</p>
              </div>
            ) : (
              <div className="py-1.5">
                {showingDefault && (
                  <p className="px-4 pt-2 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Ações Rápidas</p>
                )}
                {results.map((result, index) => {
                  const cfg = typeConfig[result.type] ?? typeConfig.page
                  return (
                    <button
                      key={result.id}
                      onClick={() => handleSelect(result)}
                      className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors text-left ${
                        index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg flex-shrink-0 ${cfg.color}`}>
                        {result.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm truncate">{result.title}</div>
                        {result.subtitle && <div className="text-xs text-gray-400 truncate">{result.subtitle}</div>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {result.badge && (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cfg.color}`}>
                            {result.badge}
                          </span>
                        )}
                        {!result.badge && (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        )}
                        {index === selectedIndex && <ArrowRight className="h-3.5 w-3.5 text-blue-500" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
            <div className="flex items-center gap-3">
              <span>↑↓ navegar</span>
              <span>Enter abrir</span>
              <span>Esc fechar</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px]">Ctrl</kbd>
              <span>+</span>
              <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px]">K</kbd>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

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
    toggle: () => setIsOpen(prev => !prev),
  }
}
