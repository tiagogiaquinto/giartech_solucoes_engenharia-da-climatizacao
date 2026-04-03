import React, { useState, useEffect } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import LoadingScreen from './components/LoadingScreen'
import UpdateBanner from './components/UpdateBanner'
import { autoInitialize } from './utils/thomazInitializer'
import GlobalSearch from './components/GlobalSearch'
import { useGlobalSearch } from './hooks/useGlobalSearch'
import { CommandPalette, useCommandPalette } from './components/CommandPalette'
import { MobileBottomNav } from './components/MobileBottomNav'
import { registerServiceWorker, isMobile } from './utils/pwa'
import WebLayout from './components/layouts/WebLayout'
import GlobalSearchModal from './components/GlobalSearchModal'
import OfflineIndicator from './components/OfflineIndicator'
import Dashboard from './pages/Dashboard'
import ServiceOrders from './pages/ServiceOrders'
import ServiceOrderCreate from './pages/ServiceOrderCreate'
import ServiceOrderView from './pages/ServiceOrderView'
import ServiceOrderDetails from './pages/ServiceOrderDetails'
import TechnicianMobileView from './pages/TechnicianMobileView'
import Inventory from './pages/Inventory'
import InventoryDetail from './pages/InventoryDetail'
import InventoryCreate from './pages/InventoryCreate'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import ServiceCatalog from './pages/ServiceCatalog'
import ServiceCatalogDetail from './pages/ServiceCatalogDetail'
import ServiceCatalogCreate from './pages/ServiceCatalogCreate'
import Tutorial from './components/Tutorial'
import { UserProvider, useUser } from './contexts/UserContext'
import { AuthProvider } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import UserAccessManagement from './pages/UserAccessManagement'
import PortalAccessManager from './pages/PortalAccessManager'
import AuditDashboard from './pages/AuditDashboard'
import FinancialIntegration from './pages/FinancialIntegration'
import ClientManagement from './pages/ClientManagement'
import VisualCustomization from './pages/VisualCustomization'
import MonitoringConfig from './pages/MonitoringConfig'
import Calendar from './pages/Calendar'
import Projects from './pages/Projects'
import Profile from './pages/Profile'
import CFODashboard from './pages/CFODashboard'
import WeeklyReport from './pages/WeeklyReport'
import ServiceOrdersKanban from './pages/ServiceOrdersKanban'
import Homepage from './pages/Homepage'
import Home from './pages/Home'
import About from './pages/About'
import Services from './pages/Services'
import Contact from './pages/Contact'
import PremiumModal from './components/PremiumModal'
import PremiumBanner from './components/PremiumBanner'
import EnterpriseFeatureModal from './components/EnterpriseFeatureModal'
import Login from './pages/Login'
import AdminAccessCodes from './pages/AdminAccessCodes'
import PricingPlans from './pages/PricingPlans'
import AccessRestrictionModal from './components/AccessRestrictionModal'
import DepartmentalDashboard from './pages/DepartmentalDashboard'
import DigitalLibrary from './pages/DigitalLibrary'
import Chat from './components/Chat'
import ThomazMetrics from './pages/ThomazMetrics'
import FinancialManagement from './pages/FinancialManagement'
import FinancialAnalysis from './pages/FinancialAnalysis'
import BankAccounts from './pages/BankAccounts'
import PeopleManagement from './pages/PeopleManagement'
import UserInvitations from './pages/UserInvitations'
import FinancialCategories from './pages/FinancialCategories'
import AuditLogs from './pages/AuditLogs'
import CRMLeads from './pages/CRMLeads'
import CRMProfessional from './pages/CRMProfessional'
import CRMEsteiraIntegrada from './pages/CRMEsteiraIntegrada'
import CRMMessageTemplates from './pages/CRMMessageTemplates'
import Contracts from './pages/Contracts'
import ContractTemplates from './pages/ContractTemplates'
import Invoices from './pages/Invoices'
import CompanySettings from './pages/CompanySettings'
import Equipments from './pages/Equipments'
import Suppliers from './pages/Suppliers'
import Purchasing from './pages/Purchasing'
import RouteTracking from './pages/RouteTracking'
import Documents from './pages/Documents'
import EmailSettings from './pages/EmailSettings'
import EmailInbox from './pages/EmailInbox'
import EmailCompose from './pages/EmailCompose'
import ThomazChat from './pages/ThomazChat'
import ReportsAdvanced from './pages/ReportsAdvanced'

import CreditScoring from './pages/CreditScoring'
import FinanceiroConsolidado from './pages/FinanceiroConsolidado'
import RelatoriosConsolidado from './pages/RelatoriosConsolidado'
import CustomerReferrals from './pages/CustomerReferrals'
import CustomerCredits from './pages/CustomerCredits'
import CustomerGamification from './pages/CustomerGamification'
import CustomerGamificationManager from './pages/CustomerGamificationManager'
import PartnerGamification from './pages/PartnerGamification'
import GamificationHub from './pages/GamificationHub'
import TechnicianPerformance from './pages/TechnicianPerformance'
import MobileLayout from './components/layouts/MobileLayout'
import MobileHome from './pages/mobile/MobileHome'
import MobileOrders from './pages/mobile/MobileOrders'
import MobileAgenda from './pages/mobile/MobileAgenda'
import MobileLibrary from './pages/mobile/MobileLibrary'
import MobileRoutes from './pages/mobile/MobileRoutes'
import MobilePurchases from './pages/mobile/MobilePurchases'
import MobileOSExecution from './pages/mobile/MobileOSExecution'
import SalaryManagement from './pages/SalaryManagement'
import MobileLogin from './pages/mobile/MobileLogin'
import OSDistribution from './pages/OSDistribution'
import GoalsAndRankings from './pages/GoalsAndRankings'
import BudgetManagement from './pages/BudgetManagement'
import DocumentCenter from './pages/DocumentCenter'
import ThomazDashboard from './pages/ThomazDashboard'
import AIProvidersSettings from './pages/AIProvidersSettings'
import Customer360 from './pages/Customer360'
import TeamManagement from './pages/TeamManagement'
import StaffHub from './pages/StaffHub'
import InternalChat from './pages/InternalChat'
import PortalLogin from './pages/portal/PortalLogin'
import PortalLayout from './pages/portal/PortalLayout'
import PortalDashboardRouter from './pages/portal/PortalDashboardRouter'
import CustomerPortalDocuments from './pages/portal/CustomerPortalDocuments'
import CustomerPortalInventory from './pages/portal/CustomerPortalInventory'
import CustomerServiceRequest from './pages/portal/CustomerServiceRequest'
import CustomerPortalHistory from './pages/portal/CustomerPortalHistory'
import CustomerPortalAddresses from './pages/portal/CustomerPortalAddresses'
import CustomerPortalBudgets from './pages/portal/CustomerPortalBudgets'
import PartnerPortalDashboard from './pages/portal/PartnerPortalDashboard'
import PartnerPortalHistory from './pages/portal/PartnerPortalHistory'
import { PortalProvider } from './contexts/PortalContext'
import TechnicianLayout from './components/technician/TechnicianLayout'
import TechnicianRoteiro from './pages/technician/TechnicianRoteiro'
import TechnicianChat from './pages/technician/TechnicianChat'
import TechnicianAgenda from './pages/technician/TechnicianAgenda'
import TechnicianPerfil from './pages/technician/TechnicianPerfil'
import TechnicianOSPage from './pages/technician/TechnicianOSPage'
import TechnicianHistorico from './pages/technician/TechnicianHistorico'
import CustomerRFM from './pages/CustomerRFM'
import PosVenda from './pages/PosVenda'
import ExecutiveDashboard from './pages/ExecutiveDashboard'
import Materials from './pages/Materials'
import WhatsAppCRM from './pages/WhatsAppCRM'
import StaffManagement from './pages/StaffManagement'
import CadastroClientesParceiros from './pages/CadastroClientesParceiros'
import GiartechCare from './pages/care/GiartechCare'
import OSTrackPage from './pages/track/OSTrackPage'
import QRCodeManager from './pages/QRCodeManager'
import { NotificationHubProvider } from './contexts/NotificationHubContext'
import { GiartechNotificationHub } from './components/GiartechNotificationHub'
import { useThomazInterrupt } from './hooks/useThomazInterrupt'
import { useDailyAutomations } from './hooks/useDailyAutomations'
import TaskBoard from './pages/TaskBoard/TaskBoard'
import { ThomazOrchestrator } from './components/ThomazOrchestrator'

const ProtectedRoute = ({ children, moduleCode }: { children: React.ReactNode; moduleCode?: string }) => {
  const { user, isLoading, hasModuleAccess, isSuperAdmin } = useUser()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (moduleCode && !isSuperAdmin && !hasModuleAccess(moduleCode, 'view')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Acesso Restrito</h2>
          <p className="text-gray-500">Você não tem permissão para acessar este módulo.</p>
          <p className="text-gray-400 text-sm mt-1">Contate o administrador do sistema.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
};

const MobileProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useUser()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/mobile/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

const TechnicianRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, isLoading } = useUser()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (profile?.role !== 'technician' && profile?.user_type !== 'tecnico') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

const StaffRoute = ({ children, moduleCode }: { children: React.ReactNode; moduleCode?: string }) => {
  const { user, profile, isLoading, hasModuleAccess, isSuperAdmin } = useUser()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (profile?.role === 'technician' || profile?.user_type === 'tecnico') {
    return <Navigate to="/tecnico" replace />
  }

  if (profile?.role === 'viewer') {
    return <Navigate to="/portal/dashboard" replace />
  }

  if (moduleCode && !isSuperAdmin && !hasModuleAccess(moduleCode, 'view')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Acesso Restrito</h2>
          <p className="text-gray-500">Você não tem permissão para acessar este módulo.</p>
          <p className="text-gray-400 text-sm mt-1">Contate o administrador do sistema.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

const RoleBasedHome = () => {
  const { user, profile, isLoading } = useUser()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (profile?.role === 'technician' || profile?.user_type === 'tecnico') {
    return <Navigate to="/tecnico" replace />
  }

  if (profile?.role === 'viewer') {
    return <Navigate to="/portal/dashboard" replace />
  }

  return <Navigate to="/dashboard" replace />
};

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [showTutorial, setShowTutorial] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false)
  const [showAccessRestrictionModal, setShowAccessRestrictionModal] = useState(false)
  const [premiumFeature, setPremiumFeature] = useState('')
  const [enterpriseFeature, setEnterpriseFeature] = useState('')
  const [restrictedAccess] = useState<'admin' | 'premium' | 'enterprise'>('admin')
  const [showPremiumBanner, setShowPremiumBanner] = useState(false)
  const [thomazInitialized, setThomazInitialized] = useState(false)
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isSearchOpen, closeSearch } = useGlobalSearch()
  const commandPalette = useCommandPalette()
  const [showGlobalSearch, setShowGlobalSearch] = useState(false)

  useEffect(() => {
    // Registrar Service Worker para PWA
    registerServiceWorker()
  }, [])

  // Atalho global Cmd+K para busca
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowGlobalSearch(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    // Inicializar ThomazAI primeiro
    const initializeThomazAI = async () => {
      try {
        console.log('🤖 Inicializando ThomazAI...')
        const result = await autoInitialize()

        if (result.success) {
          console.log('✅ ThomazAI inicializado com sucesso!')
          console.log(`📚 ${result.metrics.totalDocuments} documentos | ${result.metrics.totalChunks} chunks`)
          setThomazInitialized(true)
        } else {
          console.warn('⚠️ ThomazAI iniciado com avisos:', result.errors)
          setThomazInitialized(true) // Continuar mesmo com avisos
        }
      } catch (error) {
        console.error('❌ Erro ao inicializar ThomazAI:', error)
        setThomazInitialized(true) // Continuar mesmo com erro
      }
    }

    initializeThomazAI()

    // Simular carregamento inicial
    const timer = setTimeout(() => {
      setIsLoading(false)
      // Verificar se é primeira utilização
      const isFirstTime = !localStorage.getItem('os_system_tutorial_completed')
      if (isFirstTime) {
        setShowTutorial(true)
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  // Verificação de versão gerenciada pelo hook useAppUpdate via Supabase Realtime

  // Notificações desabilitadas - podem ser habilitadas nas configurações
  // useEffect(() => {
  //   if ('Notification' in window && Notification.permission === 'default') {
  //     Notification.requestPermission()
  //   }
  // }, [])

  const handlePremiumFeature = (feature: string) => {
    setPremiumFeature(feature)
    setShowPremiumModal(true)
    setShowPremiumBanner(true)
    
    // Auto-hide banner after 10 seconds
    setTimeout(() => {
      setShowPremiumBanner(false)
    }, 10000)
  }
  
  const handleEnterpriseFeature = (feature: string) => {
    setEnterpriseFeature(feature)
    setShowEnterpriseModal(true)
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <AuthProvider>
      <UserProvider>
        <PortalProvider>
        <NotificationHubProvider>
        <ThomazInterruptActivator />
        <GiartechNotificationHub />
        <ThomazOrchestrator />
        <UpdateBanner />
        <Routes location={location}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/mobile/login" element={<MobileLogin />} />
          <Route path="/pricing" element={<PricingPlans />} />
          
          <Route path="/" element={
            <RoleBasedHome />
          } />

          <Route path="/dashboard" element={
            <StaffRoute>
              <WebLayout>
                <CFODashboard />
              </WebLayout>
            </StaffRoute>
          } />

          <Route path="/home" element={
            <ProtectedRoute>
              <WebLayout>
                <Home />
              </WebLayout>
            </ProtectedRoute>
          } />


          <Route path="/ordens-servico-kanban" element={
            <ProtectedRoute>
              <WebLayout>
                <ServiceOrdersKanban />
              </WebLayout>
            </ProtectedRoute>
          } />
          <Route path="/service-orders-kanban" element={
            <ProtectedRoute>
              <WebLayout>
                <ServiceOrdersKanban />
              </WebLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/departmental-dashboard" element={
            <ProtectedRoute>
              <WebLayout>
                <DepartmentalDashboard />
              </WebLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/service-orders" element={
            <ProtectedRoute>
              <WebLayout>
                <ServiceOrders />
              </WebLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/service-orders/create" element={
            <ProtectedRoute>
              <WebLayout>
                <ServiceOrderCreate />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/service-orders/:id/view" element={
            <ProtectedRoute>
              <WebLayout>
                <ServiceOrderDetails />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/service-orders/:id/mobile" element={
            <ProtectedRoute>
              <TechnicianMobileView />
            </ProtectedRoute>
          } />

          {/* Mobile App Routes */}
          <Route path="/mobile" element={
            <MobileProtectedRoute>
              <MobileLayout />
            </MobileProtectedRoute>
          }>
            <Route index element={<MobileHome />} />
            <Route path="agenda" element={<MobileAgenda />} />
            <Route path="orders" element={<MobileOrders />} />
            <Route path="orders/:id/execute" element={<MobileOSExecution />} />
            <Route path="purchases" element={<MobilePurchases />} />
            <Route path="library" element={<MobileLibrary />} />
            <Route path="routes" element={<MobileRoutes />} />
            <Route path="chat" element={<InternalChat />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Technician Mobile Routes — accessible only by role=technician */}
          <Route path="/tecnico" element={
            <TechnicianRoute>
              <TechnicianLayout>
                <TechnicianRoteiro />
              </TechnicianLayout>
            </TechnicianRoute>
          } />
          <Route path="/tecnico/chat" element={
            <TechnicianRoute>
              <TechnicianLayout>
                <TechnicianChat />
              </TechnicianLayout>
            </TechnicianRoute>
          } />
          <Route path="/tecnico/agenda" element={
            <TechnicianRoute>
              <TechnicianLayout>
                <TechnicianAgenda />
              </TechnicianLayout>
            </TechnicianRoute>
          } />
          <Route path="/tecnico/perfil" element={
            <TechnicianRoute>
              <TechnicianLayout>
                <TechnicianPerfil />
              </TechnicianLayout>
            </TechnicianRoute>
          } />
          <Route path="/tecnico/historico" element={
            <TechnicianRoute>
              <TechnicianLayout>
                <TechnicianHistorico />
              </TechnicianLayout>
            </TechnicianRoute>
          } />
          <Route path="/tecnico/os/:id" element={
            <TechnicianRoute>
              <TechnicianLayout>
                <TechnicianOSPage />
              </TechnicianLayout>
            </TechnicianRoute>
          } />

          {/* OS Distribution Page */}
          <Route path="/os-distribution" element={
            <ProtectedRoute>
              <WebLayout>
                <OSDistribution />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/service-orders/:id/edit" element={
            <ProtectedRoute>
              <WebLayout>
                <ServiceOrderCreate />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/service-orders/:id" element={
            <ProtectedRoute>
              <WebLayout>
                <ServiceOrderCreate />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/inventory" element={
            <ProtectedRoute>
              <WebLayout>
                <Inventory />
              </WebLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/inventory/:id" element={
            <ProtectedRoute>
              <WebLayout>
                <InventoryDetail />
              </WebLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/inventory/create" element={
            <ProtectedRoute>
              <WebLayout>
                <InventoryCreate />
              </WebLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/reports" element={
            <ProtectedRoute>
              <WebLayout>
                <Reports />
              </WebLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute>
              <WebLayout>
                <Settings />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/team-management" element={<Navigate to="/staff" replace />} />

          <Route path="/staff" element={
            <ProtectedRoute>
              <WebLayout>
                <StaffHub />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/ai-providers" element={
            <ProtectedRoute>
              <WebLayout>
                <AIProvidersSettings />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/people" element={<Navigate to="/staff" replace />} />
          <Route path="/users" element={<Navigate to="/staff" replace />} />
          
          <Route path="/service-catalog" element={
            <ProtectedRoute>
              <WebLayout>
                <ServiceCatalog />
              </WebLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/financial" element={
            <ProtectedRoute>
              <WebLayout>
                <FinancialIntegration />
              </WebLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/client-management" element={
            <ProtectedRoute>
              <WebLayout>
                <ClientManagement />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/cadastro-clientes-parceiros" element={
            <StaffRoute moduleCode="clientes">
              <WebLayout>
                <CadastroClientesParceiros />
              </WebLayout>
            </StaffRoute>
          } />

          <Route path="/clientes/:id/360" element={
            <ProtectedRoute>
              <WebLayout>
                <Customer360 />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/visual-customization" element={
            <ProtectedRoute>
              <WebLayout>
                <VisualCustomization onPremiumFeature={handlePremiumFeature} />
              </WebLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/monitoring" element={
            <ProtectedRoute>
              <WebLayout>
                <MonitoringConfig 
                  onPremiumFeature={handlePremiumFeature}
                  onEnterpriseFeature={handleEnterpriseFeature}
                />
              </WebLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/calendar" element={
            <ProtectedRoute>
              <WebLayout>
                <Calendar onPremiumFeature={handlePremiumFeature} />
              </WebLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/projects" element={
            <ProtectedRoute>
              <WebLayout>
                <Projects
                  onPremiumFeature={handlePremiumFeature}
                  onEnterpriseFeature={handleEnterpriseFeature}
                />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/task-board" element={
            <ProtectedRoute>
              <WebLayout>
                <TaskBoard />
              </WebLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <WebLayout>
                <Profile />
              </WebLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/access-codes" element={
            <ProtectedRoute>
              <WebLayout>
                <AdminAccessCodes />
              </WebLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/digital-library" element={
            <ProtectedRoute>
              <WebLayout>
                <DigitalLibrary />
              </WebLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/chat" element={
            <ProtectedRoute>
              <WebLayout>
                <Chat />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/thomaz-metrics" element={
            <ProtectedRoute>
              <WebLayout>
                <ThomazMetrics />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/thomaz-ultra" element={
            <ProtectedRoute>
              <WebLayout>
                <ThomazDashboard />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/thomaz" element={
            <ProtectedRoute>
              <ThomazChat />
            </ProtectedRoute>
          } />

          <Route path="/financial-management" element={
            <ProtectedRoute>
              <WebLayout>
                <FinancialManagement />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/salary-management" element={
            <ProtectedRoute>
              <WebLayout>
                <SalaryManagement />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/goals-rankings" element={
            <ProtectedRoute>
              <WebLayout>
                <GoalsAndRankings />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/budgets" element={
            <ProtectedRoute>
              <WebLayout>
                <BudgetManagement />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/documents" element={
            <ProtectedRoute>
              <WebLayout>
                <DocumentCenter />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/financial-analysis" element={
            <ProtectedRoute>
              <WebLayout>
                <FinancialAnalysis />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/cfo-dashboard" element={
            <ProtectedRoute>
              <WebLayout>
                <CFODashboard />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/weekly-report" element={
            <ProtectedRoute>
              <WebLayout>
                <WeeklyReport />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/reports-advanced" element={
            <ProtectedRoute>
              <WebLayout>
                <ReportsAdvanced />
              </WebLayout>
            </ProtectedRoute>
          } />


          <Route path="/financeiro" element={
            <ProtectedRoute moduleCode="financeiro">
              <WebLayout>
                <FinanceiroConsolidado />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/relatorios" element={
            <ProtectedRoute>
              <WebLayout>
                <RelatoriosConsolidado />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/credit-scoring" element={
            <ProtectedRoute>
              <WebLayout>
                <CreditScoring />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/customer-referrals" element={
            <ProtectedRoute>
              <WebLayout>
                <CustomerReferrals />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/customer-credits" element={
            <ProtectedRoute>
              <WebLayout>
                <CustomerCredits />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/customer-gamification" element={
            <ProtectedRoute>
              <WebLayout>
                <CustomerGamification />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/customer-gamification-manager" element={
            <ProtectedRoute>
              <WebLayout>
                <CustomerGamificationManager />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/partner-gamification" element={
            <ProtectedRoute>
              <WebLayout>
                <PartnerGamification />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/gamification" element={
            <ProtectedRoute>
              <WebLayout>
                <GamificationHub />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/qr-codes" element={
            <ProtectedRoute>
              <WebLayout>
                <QRCodeManager />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/technician-performance" element={
            <ProtectedRoute>
              <WebLayout>
                <TechnicianPerformance />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/financial-categories" element={
            <ProtectedRoute>
              <WebLayout>
                <FinancialCategories />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/email/settings" element={
            <ProtectedRoute>
              <WebLayout>
                <EmailSettings />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/email/compose" element={
            <ProtectedRoute>
              <EmailCompose />
            </ProtectedRoute>
          } />

          <Route path="/email/inbox" element={
            <ProtectedRoute>
              <EmailInbox />
            </ProtectedRoute>
          } />

          <Route path="/audit-logs" element={
            <ProtectedRoute>
              <WebLayout>
                <AuditLogs />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/bank-accounts" element={
            <ProtectedRoute>
              <WebLayout>
                <BankAccounts />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/access-management" element={
            <ProtectedRoute>
              <WebLayout>
                <UserAccessManagement />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/audit-dashboard" element={
            <ProtectedRoute>
              <WebLayout>
                <AuditDashboard />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/user-management" element={
            <ProtectedRoute>
              <WebLayout>
                <UserAccessManagement />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/portal-access" element={
            <ProtectedRoute>
              <WebLayout>
                <PortalAccessManager />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/funcionarios" element={
            <ProtectedRoute>
              <WebLayout>
                <PeopleManagement />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/employees" element={
            <ProtectedRoute>
              <WebLayout>
                <PeopleManagement />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/convites-usuarios" element={
            <ProtectedRoute>
              <WebLayout>
                <UserInvitations />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/user-invitations" element={
            <ProtectedRoute>
              <WebLayout>
                <UserInvitations />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/crm-leads" element={
            <ProtectedRoute>
              <WebLayout>
                <CRMLeads />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/crm-esteira" element={
            <ProtectedRoute>
              <WebLayout>
                <CRMEsteiraIntegrada />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/crm-professional" element={
            <ProtectedRoute>
              <WebLayout>
                <CRMEsteiraIntegrada />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/crm-templates" element={
            <ProtectedRoute>
              <WebLayout>
                <CRMMessageTemplates />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/contracts" element={
            <ProtectedRoute>
              <WebLayout>
                <Contracts />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/contract-templates" element={
            <ProtectedRoute>
              <WebLayout>
                <ContractTemplates />
              </WebLayout>
            </ProtectedRoute>
          } />


          <Route path="/invoices" element={
            <ProtectedRoute>
              <WebLayout>
                <Invoices />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/company-settings" element={
            <ProtectedRoute>
              <WebLayout>
                <CompanySettings />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/equipments" element={
            <ProtectedRoute>
              <WebLayout>
                <Equipments />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/suppliers" element={
            <ProtectedRoute>
              <WebLayout>
                <Suppliers />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/purchasing" element={
            <ProtectedRoute>
              <WebLayout>
                <Purchasing />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/rotas" element={
            <ProtectedRoute>
              <WebLayout>
                <RouteTracking />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/documentos" element={
            <ProtectedRoute>
              <WebLayout>
                <Documents />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/customer-rfm" element={
            <ProtectedRoute>
              <WebLayout>
                <CustomerRFM />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/pos-venda" element={
            <ProtectedRoute>
              <WebLayout>
                <PosVenda />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/executive-dashboard" element={
            <ProtectedRoute>
              <WebLayout>
                <ExecutiveDashboard />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/materials" element={
            <ProtectedRoute>
              <WebLayout>
                <Materials />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/whatsapp-crm" element={
            <ProtectedRoute>
              <WebLayout>
                <WhatsAppCRM />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/staff-management" element={
            <ProtectedRoute>
              <WebLayout>
                <StaffManagement />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/homepage" element={<Homepage />} />
          <Route path="/home" element={<Home />} />
          <Route path="/sobre" element={<About />} />
          <Route path="/servicos" element={<Services />} />
          <Route path="/contato" element={<Contact />} />

          <Route path="/chat-interno" element={
            <ProtectedRoute>
              <WebLayout>
                <InternalChat />
              </WebLayout>
            </ProtectedRoute>
          } />

          {/* Rota pública Giartech Care — acesso via QR Code sem login */}
          <Route path="/care/:qr_code_id" element={<GiartechCare />} />

          {/* Rota pública Track & Trace — cliente acompanha OS via QR Code sem login */}
          <Route path="/track/:token" element={<OSTrackPage />} />

          <Route path="/portal/login" element={<PortalLogin />} />

          <Route path="/portal/*" element={
            <PortalLayout>
              <Routes>
                <Route path="dashboard" element={<PortalDashboardRouter />} />
                <Route path="historico" element={<CustomerPortalHistory />} />
                <Route path="enderecos" element={<CustomerPortalAddresses />} />
                <Route path="inventario" element={<CustomerPortalInventory />} />
                <Route path="documentos" element={<CustomerPortalDocuments />} />
                <Route path="solicitar" element={<CustomerServiceRequest />} />
                <Route path="orcamentos" element={<CustomerPortalBudgets />} />
                <Route path="indicacoes" element={<PartnerPortalDashboard />} />
                <Route path="historico-parceiro" element={<PartnerPortalHistory />} />
                <Route path="*" element={<PortalDashboardRouter />} />
              </Routes>
            </PortalLayout>
          } />
        </Routes>

        {/* Tutorial Interativo */}
        <Tutorial
          isOpen={showTutorial}
          onComplete={() => {
            setShowTutorial(false)
            localStorage.setItem('os_system_tutorial_completed', 'true')
          }}
        />

        {/* Modal Premium */}
        <PremiumModal
          isOpen={showPremiumModal}
          feature={premiumFeature}
          onClose={() => setShowPremiumModal(false)}
        />

        {/* Modal Enterprise */}
        <EnterpriseFeatureModal
          isOpen={showEnterpriseModal}
          feature={enterpriseFeature}
          onClose={() => setShowEnterpriseModal(false)}
        />

        {/* Modal Restrição de Acesso */}
        <AccessRestrictionModal
          isOpen={showAccessRestrictionModal}
          onClose={() => setShowAccessRestrictionModal(false)}
          requiredRole={restrictedAccess}
        />

        {/* Banner Premium */}
        {showPremiumBanner && (
          <PremiumBanner feature={premiumFeature} />
        )}

      {/* Busca Global (Cmd+K) */}
      <GlobalSearch isOpen={isSearchOpen} onClose={closeSearch} />

      {/* Nova Busca Global Avançada (Cmd+K) */}
      <GlobalSearchModal
        isOpen={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
      />

      {/* Command Palette (Ctrl/Cmd + K) */}
      <CommandPalette
        isOpen={commandPalette.isOpen}
        onClose={commandPalette.close}
      />

      {/* Mobile Bottom Navigation */}
      {/* Offline Indicator */}
      <OfflineIndicator />
      {isMobile() && <MobileBottomNav />}
      </NotificationHubProvider>
        </PortalProvider>
      </UserProvider>
    </AuthProvider>
  )
}

function ThomazInterruptActivator() {
  useThomazInterrupt()
  useDailyAutomations()
  return null
}

export default App