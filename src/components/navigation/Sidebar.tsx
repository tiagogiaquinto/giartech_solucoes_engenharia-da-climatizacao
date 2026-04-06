import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BarChart3,
  Calendar,
  DollarSign,
  Users,
  Package,
  ClipboardList,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  PieChart,
  MessageCircle,
  MessageSquare,
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
  Award,
  Heart,
  Megaphone,
  BarChart2,
  Smartphone,
  Box,
  Wind,
  LayoutGrid,
  Fingerprint,
  Bell
} from 'lucide-react'
import { useUser } from '../../contexts/UserContext'
import { supabase } from '../../lib/supabase'
import { Crown } from 'lucide-react'

interface SidebarProps {
  onCollapse?: (collapsed: boolean) => void
}

interface MenuItem {
  id: string
  path: string
  icon: React.ElementType
  label: string
  description: string
  moduleCode?: string
  superAdminOnly?: boolean
}

const DEFAULT_MENU_ITEMS: MenuItem[] = [
  { id: 'inicio', path: '/', icon: BarChart3, label: 'Dashboard CFO', description: '20+ KPIs executivos em tempo real para decisões estratégicas', moduleCode: 'dashboard' },
  { id: 'agenda', path: '/calendar', icon: Calendar, label: 'Agenda', description: 'Compromissos e eventos', moduleCode: 'agenda' },
  { id: 'cadastro-clientes-parceiros', path: '/cadastro-clientes-parceiros', icon: UserCog, label: 'Clientes e Parceiros', description: 'Cadastro de clientes PF/PJ e parceiros comerciais', moduleCode: 'clientes' },
  { id: 'clients', path: '/client-management', icon: Users, label: 'Clientes (legado)', description: 'Gestão de clientes PF/PJ', moduleCode: 'clientes' },
  { id: 'crm-professional', path: '/crm-professional', icon: Target, label: 'CRM Profissional', description: 'Pipeline de vendas e pós-venda completo', moduleCode: 'crm' },
  { id: 'crm-templates', path: '/crm-templates', icon: MessageSquare, label: 'Mensagens do CRM', description: 'Configure mensagens personalizadas para WhatsApp, Email e SMS', moduleCode: 'mensagens_crm' },
  { id: 'gamification', path: '/gamification', icon: Trophy, label: 'Gamificação', description: 'Clientes, parceiros, rankings, badges e gerenciamento', moduleCode: 'gamificacao' },
  { id: 'customer-rfm', path: '/customer-rfm', icon: BarChart2, label: 'Análise RFM', description: 'Segmentação de clientes por recência, frequência e valor', moduleCode: 'clientes' },
  { id: 'pos-venda', path: '/pos-venda', icon: Heart, label: 'Pós-Venda', description: 'Acompanhamento pós-atendimento e fidelização', moduleCode: 'crm' },
  { id: 'whatsapp-crm', path: '/whatsapp-crm', icon: Smartphone, label: 'WhatsApp CRM', description: 'Gestão de conversas e contatos no WhatsApp', moduleCode: 'crm' },
  { id: 'materials', path: '/materials', icon: Box, label: 'Materiais', description: 'Cadastro e preços de materiais', moduleCode: 'estoque' },
  { id: 'executive-dashboard', path: '/executive-dashboard', icon: TrendingUp, label: 'Dashboard Executivo', description: 'Visão executiva completa com DRE e análises', moduleCode: 'dashboard' },
  { id: 'fornecedores', path: '/suppliers', icon: Building2, label: 'Fornecedores', description: 'Gestão de fornecedores', moduleCode: 'fornecedores' },
  { id: 'compras', path: '/purchasing', icon: ShoppingCart, label: 'Compras', description: 'Pedidos e alertas de estoque', moduleCode: 'compras' },
  { id: 'service-orders', path: '/service-orders', icon: ClipboardList, label: 'Ordens de Serviço', description: 'Gestão de OS', moduleCode: 'service_orders' },
  { id: 'rotas', path: '/rotas', icon: Navigation, label: 'Rotas', description: 'Rastreamento e gestão de rotas', moduleCode: 'rotas' },
  { id: 'financeiro', path: '/financeiro', icon: DollarSign, label: 'Financeiro', description: 'Centro financeiro completo', moduleCode: 'financeiro' },
  { id: 'salarios', path: '/salary-management', icon: DollarSign, label: 'Gestão de Salários', description: 'Controle de pagamentos de salários', moduleCode: 'salarios' },
  { id: 'metas-rankings', path: '/goals-rankings', icon: Trophy, label: 'Metas & Rankings', description: 'Metas individuais, supermetas, bônus, rankings', moduleCode: 'metas' },
  { id: 'giartech-docs', path: '/giartech-docs', icon: FileText, label: 'Giartech Docs', description: 'Repositório, modelos, contratos e configurações de documentos', moduleCode: 'documentos' },
  { id: 'relatorios', path: '/relatorios', icon: FileText, label: 'Relatórios', description: 'Dashboards interativos, PDFs e análises', moduleCode: 'relatorios' },
  { id: 'weekly-report', path: '/weekly-report', icon: BarChart2, label: 'Relatório Semanal', description: 'Resumo automático semanal com insight do Thomaz AI', moduleCode: 'relatorios' },
  { id: 'catalogo', path: '/service-catalog', icon: Wrench, label: 'Catálogo de Serviços', description: 'Serviços disponíveis', moduleCode: 'catalogo' },
  { id: 'inventory', path: '/inventory', icon: Package, label: 'Estoque', description: 'Controle de materiais', moduleCode: 'estoque' },
  { id: 'equipments', path: '/equipments', icon: Wind, label: 'Equipamentos HVAC', description: 'Climatização, refrigeração — manutenção e garantia', moduleCode: 'estoque' },
  { id: 'task-board', path: '/task-board', icon: LayoutGrid, label: 'Central de Tarefas', description: 'Quadro Kanban de tarefas administrativas', moduleCode: 'projetos' },

  { id: 'thomaz', path: '/thomaz', icon: Brain, label: 'Thomaz AI', description: 'Consultor Empresarial', moduleCode: 'thomaz' },
  { id: 'email', path: '/email/inbox', icon: Mail, label: 'Email Corporativo', description: 'Enviar e receber emails', moduleCode: 'email' },
  { id: 'library', path: '/digital-library', icon: Library, label: 'Biblioteca Digital', description: 'Documentos e arquivos', moduleCode: 'biblioteca' },
  { id: 'staff', path: '/staff', icon: Users, label: 'Hub de Equipe', description: 'Funcionários, permissões e engajamento', moduleCode: 'pessoas', superAdminOnly: true },
  { id: 'audit', path: '/audit-logs', icon: Shield, label: 'Auditoria', description: 'Rastreamento de operações', moduleCode: 'auditoria' },
  { id: 'chat-interno', path: '/chat-interno', icon: MessageCircle, label: 'Chat Corporativo', description: 'Mensagens internas entre funcionarios', moduleCode: 'chat' },
  { id: 'identity-control', path: '/identity-control', icon: Fingerprint, label: 'Hub IAM', description: 'Perfis, permissões, acessos ao portal e gestão de dispositivos', moduleCode: 'configuracoes', superAdminOnly: true },
  { id: 'portal-clientes', path: '/portal/login', icon: Building2, label: 'Portal Cliente/Parceiro', description: 'Acesso externo para clientes e parceiros', moduleCode: 'portal' },
  { id: 'settings', path: '/settings', icon: Settings, label: 'Configurações', description: 'Configurações gerais', moduleCode: 'configuracoes' },
  { id: 'notification-rules', path: '/settings/notification-rules', icon: Bell, label: 'Regras de Alertas', description: 'Configure tipos, prioridades e destinatários dos alertas', moduleCode: 'configuracoes' },
]

const Sidebar: React.FC<SidebarProps> = ({ onCollapse }) => {
  const location = useLocation()
  const { user, logout, isSuperAdmin, hasModuleAccess } = useUser()
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
      animate={{ width: isCollapsed ? '72px' : '272px' }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      style={{ background: 'var(--sidebar-bg)' }}
      className="fixed left-0 top-0 text-white h-screen flex flex-col shadow-2xl z-50 border-r"
      // border color via CSS var
    >
      {/* Brand Header */}
      <div className="px-4 py-4 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2.5 min-w-0"
            >
              {/* Giartech 3-bar logo mark */}
              <svg width="32" height="26" viewBox="0 0 32 26" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                <rect x="0"  y="14" width="7" height="12" rx="2" transform="rotate(-35 4 18)"  fill="#ff8149" />
                <rect x="10" y="8"  width="7" height="16" rx="2" transform="rotate(-35 14 14)" fill="#00d1ff" />
                <rect x="20" y="2"  width="7" height="20" rx="2" transform="rotate(-35 24 10)" fill="#0062f6" />
              </svg>
              <div className="min-w-0">
                <h1 className="text-[17px] font-bold tracking-tight leading-none text-white" style={{ fontFamily: 'Questrial, Inter, sans-serif' }}>
                  Giartech
                </h1>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--sidebar-text-muted)' }}>Soluções</p>
              </div>
            </motion.div>
          )}
          {isCollapsed && (
            <div className="mx-auto">
              <svg width="28" height="22" viewBox="0 0 32 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0"  y="14" width="7" height="12" rx="2" transform="rotate(-35 4 18)"  fill="#ff8149" />
                <rect x="10" y="8"  width="7" height="16" rx="2" transform="rotate(-35 14 14)" fill="#00d1ff" />
                <rect x="20" y="2"  width="7" height="20" rx="2" transform="rotate(-35 24 10)" fill="#0062f6" />
              </svg>
            </div>
          )}
          <button
            onClick={toggleCollapse}
            className="p-1.5 rounded-lg transition-colors flex-shrink-0"
            style={{ color: 'var(--sidebar-text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--sidebar-hover-bg)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Edit Mode Toggle */}
      {!isCollapsed && (
        <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`text-xs px-3 py-1 rounded-md transition-colors ${
                isEditMode
                  ? 'text-white'
                  : 'text-white/40 hover:text-white/60'
              }`}
              style={isEditMode ? { background: 'var(--brand-blue, #0062f6)' } : { background: 'rgba(255,255,255,0.06)' }}
            >
              {isEditMode ? 'Salvar Ordem' : 'Editar Menu'}
            </button>
            {isEditMode && (
              <button
                onClick={resetMenuOrder}
                className="text-xs px-2 py-1 rounded-md text-white/40 hover:text-white/60 flex items-center gap-1 transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)' }}
                title="Restaurar ordem padrão"
              >
                <RotateCcw className="h-3 w-3" />
                Restaurar
              </button>
            )}
          </div>
          {isEditMode && (
            <p className="text-[10px] mt-1.5" style={{ color: 'var(--sidebar-text-muted)' }}>Arraste os itens para reordenar</p>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
        {menuItems.filter(item => {
          if (item.superAdminOnly) return isSuperAdmin
          if (!item.moduleCode) return true
          if (isSuperAdmin) return true
          if (!user) return false
          return hasModuleAccess(item.moduleCode, 'view')
        }).map((item) => {
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
              className={`flex items-center gap-3 px-2.5 py-2 rounded-lg transition-all group relative ${
                isEditMode ? 'cursor-move' : 'cursor-pointer'
              } ${draggedItem === item.id ? 'opacity-50' : ''}`}
              style={active
                ? { background: 'var(--sidebar-active-bg)', color: '#fff' }
                : { color: 'var(--sidebar-text)' }
              }
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-hover-bg)' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
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
      <div className="px-3 py-3 border-t" style={{ borderColor: 'var(--sidebar-border)' }}>
        {!isCollapsed ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #0062f6 0%, #00d1ff 100%)' }}>
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate leading-tight">{user?.name || 'Usuário'}</p>
                <p className="text-[10px] truncate" style={{ color: 'var(--sidebar-text-muted)' }}>{user?.email || 'user@example.com'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors text-sm"
              style={{ color: '#ff8149' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,129,73,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            className="w-full p-2 rounded-lg transition-colors"
            style={{ color: '#ff8149' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,129,73,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            title="Sair"
          >
            <LogOut className="h-4 w-4 mx-auto" />
          </button>
        )}
      </div>
    </motion.aside>
  )
}

export default Sidebar
