import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ChartBar as BarChart3,
  Calendar,
  DollarSign,
  Users,
  Package,
  ClipboardList,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChartPie as PieChart,
  MessageCircle,
  Wrench,
  FolderKanban,
  Library,
  UserCog,
  Key,
  Palette,
  CreditCard,
  TrendingUp,
  Target,
  GripVertical,
  RotateCcw,
  Shield,
  Building2,
  ShoppingCart,
  FileText,
  Brain,
  Navigation,
  Activity,
  Mail,
  Trophy,
  Star,
  Award
} from 'lucide-react'
import { useUser } from '../../contexts/UserContext'
import { supabase } from '../../lib/supabase'

interface SidebarProps {
  onCollapse?: (collapsed: boolean) => void
}

interface MenuItem {
  id: string
  path: string
  icon: React.ElementType
  label: string
  description: string
}

const DEFAULT_MENU_ITEMS: MenuItem[] = [
  { id: 'inicio', path: '/', icon: BarChart3, label: 'Dashboard CFO', description: '20+ KPIs executivos em tempo real para decisões estratégicas' },
  { id: 'agenda', path: '/calendar', icon: Calendar, label: 'Agenda', description: 'Compromissos e eventos' },
  { id: 'clients', path: '/client-management', icon: Users, label: 'Clientes', description: 'Gestão de clientes PF/PJ' },
  { id: 'rfm', path: '/customer-rfm', icon: Target, label: 'Análise RFM', description: 'Segmentação inteligente de clientes por Recência, Frequência e Valor' },
  { id: 'customer-gamification', path: '/customer-gamification', icon: Star, label: 'Gamificação de Clientes', description: 'Sistema de pontos, níveis, badges e benefícios para fidelização de clientes' },
  { id: 'customer-gamification-manager', path: '/customer-gamification-manager', icon: Settings, label: 'Gerenciar Gamificação', description: 'Controle quais clientes participam e quais OSs geram pontos' },
  { id: 'fornecedores', path: '/suppliers', icon: Building2, label: 'Fornecedores', description: 'Gestão de fornecedores' },
  { id: 'compras', path: '/purchasing', icon: ShoppingCart, label: 'Compras', description: 'Pedidos e alertas de estoque' },
  { id: 'google-ads', path: '/google-ads-tracking', icon: Target, label: 'Google Ads Premium', description: 'Rastreamento em tempo real de cliques, conversões e ROI das suas campanhas' },
  { id: 'service-orders', path: '/service-orders', icon: ClipboardList, label: 'Ordens de Serviço', description: 'Gestão de OS' },
  { id: 'rotas', path: '/rotas', icon: Navigation, label: 'Rotas', description: 'Rastreamento e gestão de rotas' },
  { id: 'financeiro', path: '/financeiro', icon: DollarSign, label: 'Financeiro', description: 'Centro financeiro completo com dashboard, movimentações, análises, contas e categorias' },
  { id: 'salarios', path: '/salary-management', icon: DollarSign, label: 'Gestão de Salários', description: 'Controle de pagamentos de salários com suporte a parcelas e histórico completo' },
  { id: 'metas-rankings', path: '/goals-rankings', icon: Trophy, label: 'Metas & Rankings', description: 'Sistema de metas individuais, supermetas, bônus, rankings e gamificação da equipe' },
  { id: 'executivo', path: '/executivo', icon: TrendingUp, label: 'Consolidado Executivo', description: 'Visão consolidada com Credit Scoring, Metas & Targets e análises estratégicas' },
  { id: 'relatorios', path: '/relatorios', icon: FileText, label: 'Relatórios', description: 'Todos os relatórios: dashboards interativos, PDFs profissionais e análises customizadas' },
  { id: 'catalogo', path: '/service-catalog', icon: Wrench, label: 'Catálogo de Serviços', description: 'Serviços disponíveis' },
  { id: 'inventory', path: '/inventory', icon: Package, label: 'Estoque', description: 'Controle de materiais' },
  { id: 'automacoes', path: '/automacoes', icon: Activity, label: 'Automações', description: 'Workflows e automações' },
  { id: 'whatsapp-crm', path: '/whatsapp-crm', icon: MessageCircle, label: 'WhatsApp CRM', description: 'Gestão de conversas' },
  { id: 'thomaz', path: '/thomaz', icon: Brain, label: 'Thomaz AI', description: 'Consultor Empresarial' },
  { id: 'thomaz-metrics', path: '/thomaz-metrics', icon: Brain, label: 'Métricas Thomaz', description: 'Performance da IA' },
  { id: 'email', path: '/email/inbox', icon: Mail, label: 'Email Corporativo', description: 'Enviar e receber emails' },
  { id: 'library', path: '/digital-library', icon: Library, label: 'Biblioteca Digital', description: 'Documentos e arquivos' },
  { id: 'people', path: '/people', icon: Users, label: 'Gestão de Pessoas', description: 'Funcionários, usuários e acessos unificados' },
  { id: 'audit', path: '/audit-logs', icon: Shield, label: 'Auditoria', description: 'Rastreamento de operações' },
  { id: 'document-templates', path: '/document-templates', icon: FileText, label: 'Templates de Documentos', description: 'Gerenciar templates de OS, contratos e propostas' },
  { id: 'settings', path: '/settings', icon: Settings, label: 'Configurações', description: 'Configurações gerais' }
]

const Sidebar: React.FC<SidebarProps> = ({ onCollapse }) => {
  const location = useLocation()
  const { user, logout } = useUser()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [menuItems, setMenuItems] = useState<MenuItem[]>(DEFAULT_MENU_ITEMS)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [stockAlerts, setStockAlerts] = useState(0)
  const [agendaAlerts, setAgendaAlerts] = useState({
    total: 0,
    meeting: 0,
    pagar: 0,
    cobrar: 0,
    operational: 0,
    other: 0
  })

  useEffect(() => {
    loadMenuOrder().catch(err => {
      console.error('Failed to load menu order:', err)
    })
    loadStockAlerts()
    loadAgendaAlerts()

    const interval = setInterval(() => {
      loadStockAlerts()
      loadAgendaAlerts()
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const getUserId = () => {
    return user?.email || 'default_user'
  }

  const loadStockAlerts = async () => {
    try {
      const { data, error } = await supabase.rpc('get_critical_stock_count')
      if (!error && data !== null) {
        setStockAlerts(data)
      }
    } catch (error) {
      console.error('Error loading stock alerts:', error)
    }
  }

  const loadAgendaAlerts = async () => {
    try {
      const { data, error } = await supabase.rpc('get_urgent_events_by_type')
      if (!error && data !== null) {
        setAgendaAlerts(data)
      }
    } catch (error) {
      console.error('Error loading agenda alerts:', error)
    }
  }

  const loadMenuOrder = async () => {
    try {
      const userId = getUserId()
      const { data, error } = await supabase
        .from('user_menu_order')
        .select('menu_items')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        console.warn('Error loading menu order, using defaults:', error)
        return
      }

      if (data && data.menu_items && Array.isArray(data.menu_items)) {
        const orderedIds = data.menu_items as string[]
        const orderedItems = orderedIds
          .map(id => DEFAULT_MENU_ITEMS.find(item => item.id === id))
          .filter((item): item is MenuItem => item !== undefined)

        const missingItems = DEFAULT_MENU_ITEMS.filter(
          item => !orderedIds.includes(item.id)
        )

        setMenuItems([...orderedItems, ...missingItems])
      }
    } catch (error) {
      console.error('Error loading menu order, using defaults:', error)
    }
  }

  const saveMenuOrder = async (items: MenuItem[]) => {
    try {
      const userId = getUserId()
      const menuIds = items.map(item => item.id)

      const { error } = await supabase
        .from('user_menu_order')
        .upsert({
          user_id: userId,
          menu_items: menuIds,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (error) throw error
    } catch (error) {
      console.error('Error saving menu order:', error)
    }
  }

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    if (!isEditMode) return
    setDraggedItem(itemId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (!isEditMode) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    if (!isEditMode || !draggedItem) return
    e.preventDefault()

    const draggedIndex = menuItems.findIndex(item => item.id === draggedItem)
    const targetIndex = menuItems.findIndex(item => item.id === targetId)

    if (draggedIndex === -1 || targetIndex === -1) return

    const newItems = [...menuItems]
    const [removed] = newItems.splice(draggedIndex, 1)
    newItems.splice(targetIndex, 0, removed)

    setMenuItems(newItems)
    saveMenuOrder(newItems)
    setDraggedItem(null)
  }

  const resetMenuOrder = () => {
    setMenuItems(DEFAULT_MENU_ITEMS)
    saveMenuOrder(DEFAULT_MENU_ITEMS)
  }

  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    onCollapse?.(newState)
  }

  const isActive = (path: string) => {
    return location.pathname === path
  }

  return (
    <motion.aside
      initial={{ x: 0 }}
      animate={{ width: isCollapsed ? '80px' : '280px' }}
      transition={{ duration: 0.3 }}
      className="fixed left-0 top-0 bg-gradient-to-b from-gray-900 to-gray-800 text-white h-screen flex flex-col shadow-2xl z-50"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-blue-400" />
              <div>
                <h1 className="text-xl font-bold">GiarTech</h1>
                <p className="text-xs text-gray-400">Sistema Integrado</p>
              </div>
            </motion.div>
          )}
          <button
            onClick={toggleCollapse}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Edit Mode Toggle */}
      {!isCollapsed && (
        <div className="px-4 py-2 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`text-xs px-3 py-1 rounded transition-colors ${
                isEditMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {isEditMode ? 'Salvar Ordem' : 'Editar Menu'}
            </button>
            {isEditMode && (
              <button
                onClick={resetMenuOrder}
                className="text-xs px-3 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 flex items-center gap-1"
                title="Restaurar ordem padrão"
              >
                <RotateCcw className="h-3 w-3" />
                Restaurar
              </button>
            )}
          </div>
          {isEditMode && (
            <p className="text-xs text-gray-400 mt-2">Arraste os itens para reordenar</p>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)

          return (
            <Link
              key={item.id}
              to={item.path}
              draggable={isEditMode}
              onDragStart={(e) => handleDragStart(e, item.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative ${
                active
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'hover:bg-gray-700 text-gray-300'
              } ${isEditMode ? 'cursor-move' : 'cursor-pointer'} ${
                draggedItem === item.id ? 'opacity-50' : ''
              }`}
              title={isCollapsed ? item.label : ''}
            >
              {isEditMode && !isCollapsed && (
                <GripVertical className="h-4 w-4 text-gray-400" />
              )}
              <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-medium truncate">{item.label}</p>
                    {item.id === 'compras' && stockAlerts > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                        {stockAlerts}
                      </span>
                    )}
                    {item.id === 'agenda' && agendaAlerts.total > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {agendaAlerts.meeting > 0 && (
                          <span className="bg-blue-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full animate-pulse" title="Reuniões/Pessoal">
                            {agendaAlerts.meeting}
                          </span>
                        )}
                        {agendaAlerts.pagar > 0 && (
                          <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full animate-pulse" title="Pagamentos">
                            {agendaAlerts.pagar}
                          </span>
                        )}
                        {agendaAlerts.cobrar > 0 && (
                          <span className="bg-green-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full animate-pulse" title="Cobranças">
                            {agendaAlerts.cobrar}
                          </span>
                        )}
                        {agendaAlerts.operational > 0 && (
                          <span className="bg-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full animate-pulse" title="Operacional">
                            {agendaAlerts.operational}
                          </span>
                        )}
                        {agendaAlerts.other > 0 && (
                          <span className="bg-purple-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full animate-pulse" title="Outros">
                            {agendaAlerts.other}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-xs opacity-75 truncate">{item.description}</p>
                </div>
              )}
              {item.id === 'compras' && stockAlerts > 0 && isCollapsed && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full animate-pulse min-w-[20px] text-center">
                  {stockAlerts}
                </span>
              )}
              {item.id === 'agenda' && agendaAlerts.total > 0 && isCollapsed && (
                <div className="absolute -top-1 -right-1 flex flex-col gap-0.5">
                  {agendaAlerts.meeting > 0 && (
                    <span className="bg-blue-500 text-white text-[10px] font-bold px-1 py-0.5 rounded-full animate-pulse min-w-[16px] text-center" title="Reuniões">
                      {agendaAlerts.meeting}
                    </span>
                  )}
                  {agendaAlerts.pagar > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1 py-0.5 rounded-full animate-pulse min-w-[16px] text-center" title="Pagar">
                      {agendaAlerts.pagar}
                    </span>
                  )}
                  {agendaAlerts.cobrar > 0 && (
                    <span className="bg-green-500 text-white text-[10px] font-bold px-1 py-0.5 rounded-full animate-pulse min-w-[16px] text-center" title="Cobrar">
                      {agendaAlerts.cobrar}
                    </span>
                  )}
                  {agendaAlerts.operational > 0 && (
                    <span className="bg-orange-500 text-white text-[10px] font-bold px-1 py-0.5 rounded-full animate-pulse min-w-[16px] text-center" title="Operacional">
                      {agendaAlerts.operational}
                    </span>
                  )}
                  {agendaAlerts.other > 0 && (
                    <span className="bg-purple-500 text-white text-[10px] font-bold px-1 py-0.5 rounded-full animate-pulse min-w-[16px] text-center" title="Outros">
                      {agendaAlerts.other}
                    </span>
                  )}
                </div>
              )}
              {active && !isCollapsed && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute right-0 top-0 bottom-0 w-1 bg-white rounded-l"
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-700">
        {!isCollapsed ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3 px-3 py-2 bg-gray-800 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                {user?.name?.[0] || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user?.name || 'Usuário'}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email || 'user@example.com'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Sair</span>
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            className="w-full p-2 text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
            title="Sair"
          >
            <LogOut className="h-5 w-5 mx-auto" />
          </button>
        )}
      </div>
    </motion.aside>
  )
}

export default Sidebar
