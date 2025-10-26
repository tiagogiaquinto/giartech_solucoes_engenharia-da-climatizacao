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
  GripVertical,
  RotateCcw,
  Shield,
  Building2,
  ShoppingCart,
  FileText,
  Navigation,
  Activity,
  Mail
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
  { id: 'inicio', path: '/', icon: BarChart3, label: 'Início', description: 'Página inicial do sistema' },
  { id: 'agenda', path: '/calendar', icon: Calendar, label: 'Agenda', description: 'Compromissos e eventos' },
  { id: 'clients', path: '/client-management', icon: Users, label: 'Clientes', description: 'Gestão de clientes PF/PJ' },
  { id: 'fornecedores', path: '/suppliers', icon: Building2, label: 'Fornecedores', description: 'Gestão de fornecedores' },
  { id: 'compras', path: '/purchasing', icon: ShoppingCart, label: 'Compras', description: 'Pedidos e alertas de estoque' },
  { id: 'service-orders', path: '/service-orders', icon: ClipboardList, label: 'Ordens de Serviço', description: 'Gestão de OS' },
  { id: 'rotas', path: '/rotas', icon: Navigation, label: 'Rotas', description: 'Rastreamento e gestão de rotas' },
  { id: 'financial', path: '/financial', icon: DollarSign, label: 'Integração Financeira', description: 'Dashboard financeiro integrado' },
  { id: 'gestao-financeira', path: '/financial-management', icon: TrendingUp, label: 'Gestão Financeira', description: 'Receitas, despesas e DRE' },
  { id: 'analise-financeira', path: '/financial-analysis', icon: Activity, label: 'Análise Financeira', description: 'EBITDA, ROI, Margens e Gráficos' },
  { id: 'categorias-financeiras', path: '/financial-categories', icon: FolderKanban, label: 'Categorias Financeiras', description: 'Categorias e subcategorias' },
  { id: 'contas-bancarias', path: '/bank-accounts', icon: CreditCard, label: 'Contas Bancárias', description: 'Gerenciar contas e saldos' },
  { id: 'catalogo', path: '/service-catalog', icon: Wrench, label: 'Catálogo de Serviços', description: 'Serviços disponíveis' },
  { id: 'inventory', path: '/inventory', icon: Package, label: 'Estoque', description: 'Controle de materiais' },
  { id: 'reports', path: '/reports', icon: PieChart, label: 'Relatórios', description: 'Análises e dashboards' },
  { id: 'whatsapp-crm', path: '/whatsapp-crm', icon: MessageCircle, label: 'WhatsApp CRM', description: 'Gestão de conversas' },
  { id: 'email', path: '/email/inbox', icon: Mail, label: 'Email Corporativo', description: 'Enviar e receber emails' },
  { id: 'library', path: '/digital-library', icon: Library, label: 'Biblioteca Digital', description: 'Documentos e arquivos' },
  { id: 'funcionarios', path: '/funcionarios', icon: UserCog, label: 'Funcionários', description: 'Gestão de funcionários' },
  { id: 'users', path: '/users', icon: Users, label: 'Usuários', description: 'Gerenciar usuários' },
  { id: 'access', path: '/access-management', icon: Key, label: 'Gestão de Acessos', description: 'Controle de permissões' },
  { id: 'audit', path: '/audit-logs', icon: Shield, label: 'Auditoria', description: 'Rastreamento de operações' },
  { id: 'document-templates', path: '/document-templates', icon: FileText, label: 'Templates de Documentos', description: 'Gerenciar templates de OS, contratos e propostas' },
  { id: 'customization', path: '/visual-customization', icon: Palette, label: 'Personalização', description: 'Customizar interface' },
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

  useEffect(() => {
    loadMenuOrder().catch(err => {
      console.error('Failed to load menu order:', err)
    })
    loadStockAlerts()

    const interval = setInterval(loadStockAlerts, 60000)
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
      className="fixed left-0 top-0 bg-gradient-to-b from-gray-900 to-gray-800 text-white h-screen flex flex-col shadow-2xl z-40"
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
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{item.label}</p>
                    {item.id === 'compras' && stockAlerts > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                        {stockAlerts}
                      </span>
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
