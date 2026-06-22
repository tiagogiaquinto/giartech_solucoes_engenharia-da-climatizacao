import React, { useState, useEffect, lazy, Suspense } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
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
import { UserProvider, useUser } from './contexts/UserContext'
import { AuthProvider } from './contexts/AuthContext'
import PremiumModal from './components/PremiumModal'
import PremiumBanner from './components/PremiumBanner'
import EnterpriseFeatureModal from './components/EnterpriseFeatureModal'
import AccessRestrictionModal from './components/AccessRestrictionModal'
import { PortalProvider } from './contexts/PortalContext'
import { NotificationHubProvider } from './contexts/NotificationHubContext'
import { GiartechNotificationHub } from './components/GiartechNotificationHub'
import { useThomazInterrupt } from './hooks/useThomazInterrupt'
import { useDailyAutomations } from './hooks/useDailyAutomations'
import { ThomazOrchestrator } from './components/ThomazOrchestrator'
import { ImpersonationProvider } from './contexts/ImpersonationContext'
import { ImpersonationBar } from './components/ImpersonationBar'
import MobileLayout from './components/layouts/MobileLayout'
import TechnicianLayout from './components/technician/TechnicianLayout'

// Lazy-loaded pages
const Dashboard = lazy(() => import('./pages/Dashboard'))
const ServiceOrders = lazy(() => import('./pages/ServiceOrders'))
const ServiceOrderCreate = lazy(() => import('./pages/ServiceOrderCreate'))
const ServiceOrderView = lazy(() => import('./pages/ServiceOrderView'))
const ServiceOrderDetails = lazy(() => import('./pages/ServiceOrderDetails'))
const TechnicianMobileView = lazy(() => import('./pages/TechnicianMobileView'))
const Inventory = lazy(() => import('./pages/Inventory'))
const InventoryDetail = lazy(() => import('./pages/InventoryDetail'))
const InventoryCreate = lazy(() => import('./pages/InventoryCreate'))
const Reports = lazy(() => import('./pages/Reports'))
const Settings = lazy(() => import('./pages/Settings'))
const ServiceCatalog = lazy(() => import('./pages/ServiceCatalog'))
const ServiceCatalogDetail = lazy(() => import('./pages/ServiceCatalogDetail'))
const ServiceCatalogCreate = lazy(() => import('./pages/ServiceCatalogCreate'))
const Tutorial = lazy(() => import('./components/Tutorial'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const UserAccessManagement = lazy(() => import('./pages/UserAccessManagement'))
const PortalAccessManager = lazy(() => import('./pages/PortalAccessManager'))
const AuditDashboard = lazy(() => import('./pages/AuditDashboard'))
const FinancialIntegration = lazy(() => import('./pages/FinancialIntegration'))
const ClientManagement = lazy(() => import('./pages/ClientManagement'))
const VisualCustomization = lazy(() => import('./pages/VisualCustomization'))
const MonitoringConfig = lazy(() => import('./pages/MonitoringConfig'))
const Calendar = lazy(() => import('./pages/Calendar'))
const Projects = lazy(() => import('./pages/Projects'))
const Profile = lazy(() => import('./pages/Profile'))
const CFODashboard = lazy(() => import('./pages/CFODashboard'))
const WeeklyReport = lazy(() => import('./pages/WeeklyReport'))
const ServiceOrdersKanban = lazy(() => import('./pages/ServiceOrdersKanban'))
const Homepage = lazy(() => import('./pages/Homepage'))
const Home = lazy(() => import('./pages/Home'))
const About = lazy(() => import('./pages/About'))
const Services = lazy(() => import('./pages/Services'))
const Contact = lazy(() => import('./pages/Contact'))
const Login = lazy(() => import('./pages/Login'))
const AdminAccessCodes = lazy(() => import('./pages/AdminAccessCodes'))
const PricingPlans = lazy(() => import('./pages/PricingPlans'))
const DepartmentalDashboard = lazy(() => import('./pages/DepartmentalDashboard'))
const DigitalLibrary = lazy(() => import('./pages/DigitalLibrary'))
const Chat = lazy(() => import('./components/Chat'))
const ThomazMetrics = lazy(() => import('./pages/ThomazMetrics'))
const FinancialManagement = lazy(() => import('./pages/FinancialManagement'))
const FinancialAnalysis = lazy(() => import('./pages/FinancialAnalysis'))
const BankAccounts = lazy(() => import('./pages/BankAccounts'))
const PeopleManagement = lazy(() => import('./pages/PeopleManagement'))
const UserInvitations = lazy(() => import('./pages/UserInvitations'))
const FinancialCategories = lazy(() => import('./pages/FinancialCategories'))
const AuditLogs = lazy(() => import('./pages/AuditLogs'))
const CRMLeads = lazy(() => import('./pages/CRMLeads'))
const CRMProfessional = lazy(() => import('./pages/CRMProfessional'))
const CRMEsteiraIntegrada = lazy(() => import('./pages/CRMEsteiraIntegrada'))
const CRMMessageTemplates = lazy(() => import('./pages/CRMMessageTemplates'))
const Contracts = lazy(() => import('./pages/Contracts'))
const ContractTemplates = lazy(() => import('./pages/ContractTemplates'))
const Invoices = lazy(() => import('./pages/Invoices'))
const CompanySettings = lazy(() => import('./pages/CompanySettings'))
const Equipments = lazy(() => import('./pages/Equipments'))
const Suppliers = lazy(() => import('./pages/Suppliers'))
const Purchasing = lazy(() => import('./pages/Purchasing'))
const RouteTracking = lazy(() => import('./pages/RouteTracking'))
const Documents = lazy(() => import('./pages/Documents'))
const EmailSettings = lazy(() => import('./pages/EmailSettings'))
const EmailInbox = lazy(() => import('./pages/EmailInbox'))
const EmailCompose = lazy(() => import('./pages/EmailCompose'))
const ThomazChat = lazy(() => import('./pages/ThomazChat'))
const ReportsAdvanced = lazy(() => import('./pages/ReportsAdvanced'))
const CreditScoring = lazy(() => import('./pages/CreditScoring'))
const FinanceiroConsolidado = lazy(() => import('./pages/FinanceiroConsolidado'))
const RelatoriosConsolidado = lazy(() => import('./pages/RelatoriosConsolidado'))
const CustomerReferrals = lazy(() => import('./pages/CustomerReferrals'))
const CustomerCredits = lazy(() => import('./pages/CustomerCredits'))
const CustomerGamification = lazy(() => import('./pages/CustomerGamification'))
const CustomerGamificationManager = lazy(() => import('./pages/CustomerGamificationManager'))
const PartnerGamification = lazy(() => import('./pages/PartnerGamification'))
const GamificationHub = lazy(() => import('./pages/GamificationHub'))
const TechnicianPerformance = lazy(() => import('./pages/TechnicianPerformance'))
const MobileHome = lazy(() => import('./pages/mobile/MobileHome'))
const MobileOrders = lazy(() => import('./pages/mobile/MobileOrders'))
const MobileAgenda = lazy(() => import('./pages/mobile/MobileAgenda'))
const MobileLibrary = lazy(() => import('./pages/mobile/MobileLibrary'))
const MobileRoutes = lazy(() => import('./pages/mobile/MobileRoutes'))
const MobilePurchases = lazy(() => import('./pages/mobile/MobilePurchases'))
const MobileOSExecution = lazy(() => import('./pages/mobile/MobileOSExecution'))
const SalaryManagement = lazy(() => import('./pages/SalaryManagement'))
const MobileLogin = lazy(() => import('./pages/mobile/MobileLogin'))
const OSDistribution = lazy(() => import('./pages/OSDistribution'))
const GoalsAndRankings = lazy(() => import('./pages/GoalsAndRankings'))
const BudgetManagement = lazy(() => import('./pages/BudgetManagement'))
const DocumentCenter = lazy(() => import('./pages/DocumentCenter'))
const GiartechDocs = lazy(() => import('./pages/GiartechDocs'))
const ThomazDashboard = lazy(() => import('./pages/ThomazDashboard'))
const AIProvidersSettings = lazy(() => import('./pages/AIProvidersSettings'))
const Customer360 = lazy(() => import('./pages/Customer360'))
const TeamManagement = lazy(() => import('./pages/TeamManagement'))
const StaffHub = lazy(() => import('./pages/StaffHub'))
const InternalChat = lazy(() => import('./pages/InternalChat'))
const CommandCenter = lazy(() => import('./pages/CommandCenter/CommandCenter'))
const PortalLogin = lazy(() => import('./pages/portal/PortalLogin'))
const PortalLayout = lazy(() => import('./pages/portal/PortalLayout'))
const PortalDashboardRouter = lazy(() => import('./pages/portal/PortalDashboardRouter'))
const CustomerPortalDocuments = lazy(() => import('./pages/portal/CustomerPortalDocuments'))
const CustomerPortalInventory = lazy(() => import('./pages/portal/CustomerPortalInventory'))
const CustomerServiceRequest = lazy(() => import('./pages/portal/CustomerServiceRequest'))
const CustomerPortalHistory = lazy(() => import('./pages/portal/CustomerPortalHistory'))
const CustomerPortalAddresses = lazy(() => import('./pages/portal/CustomerPortalAddresses'))
const CustomerPortalBudgets = lazy(() => import('./pages/portal/CustomerPortalBudgets'))
const PartnerPortalDashboard = lazy(() => import('./pages/portal/PartnerPortalDashboard'))
const PartnerPortalHistory = lazy(() => import('./pages/portal/PartnerPortalHistory'))
const TechnicianRoteiro = lazy(() => import('./pages/technician/TechnicianRoteiro'))
const TechnicianChat = lazy(() => import('./pages/technician/TechnicianChat'))
const TechnicianAgenda = lazy(() => import('./pages/technician/TechnicianAgenda'))
const TechnicianPerfil = lazy(() => import('./pages/technician/TechnicianPerfil'))
const TechnicianOSPage = lazy(() => import('./pages/technician/TechnicianOSPage'))
const TechnicianHistorico = lazy(() => import('./pages/technician/TechnicianHistorico'))
const CustomerRFM = lazy(() => import('./pages/CustomerRFM'))
const PosVenda = lazy(() => import('./pages/PosVenda'))
const ExecutiveDashboard = lazy(() => import('./pages/ExecutiveDashboard'))
const Materials = lazy(() => import('./pages/Materials'))
const WhatsAppCRM = lazy(() => import('./pages/WhatsAppCRM'))
const StaffManagement = lazy(() => import('./pages/StaffManagement'))
const CadastroClientesParceiros = lazy(() => import('./pages/CadastroClientesParceiros'))
const GiartechCare = lazy(() => import('./pages/care/GiartechCare'))
const OSTrackPage = lazy(() => import('./pages/track/OSTrackPage'))
const QRCodeManager = lazy(() => import('./pages/QRCodeManager'))
const TaskBoard = lazy(() => import('./pages/TaskBoard/TaskBoard'))
const IdentityControl = lazy(() => import('./pages/IdentityControl/IdentityControl'))
const AccessDenied403 = lazy(() => import('./pages/AccessDenied403'))
const NotificationRules = lazy(() => import('./pages/NotificationRules'))

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
  </div>
)

const ProtectedRoute = ({ children, moduleCode }: { children: React.ReactNode; moduleCode?: string }) => {
  const { user, isLoading, hasModuleAccess, isSuperAdmin } = useUser()
  const location = useLocation()

  if (isLoading) {
    return <PageLoader />
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (moduleCode && !isSuperAdmin && !hasModuleAccess(moduleCode, 'view')) {
    return <Navigate to="/access-denied" replace state={{ attemptedRoute: location.pathname, moduleCode }} />
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
    return <Navigate to="/login" state={{ from: location }} replace />
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
    return <PageLoader />
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
    return <Navigate to="/access-denied" replace state={{ attemptedRoute: location.pathname, moduleCode }} />
  }

  return <>{children}</>
}

const RoleBasedHome = () => {
  const { user, profile, isLoading } = useUser()
  const location = useLocation()

  if (isLoading) {
    return <PageLoader />
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
    registerServiceWorker()
  }, [])

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
          setThomazInitialized(true)
        }
      } catch (error) {
        console.error('❌ Erro ao inicializar ThomazAI:', error)
        setThomazInitialized(true)
      }
    }

    initializeThomazAI()

    const timer = setTimeout(() => {
      setIsLoading(false)
      const isFirstTime = !localStorage.getItem('os_system_tutorial_completed')
      if (isFirstTime) {
        setShowTutorial(true)
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  const handlePremiumFeature = (feature: string) => {
    setPremiumFeature(feature)
    setShowPremiumModal(true)
    setShowPremiumBanner(true)

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
      <ImpersonationProvider>
        <PortalProvider>
        <NotificationHubProvider>
        <ThomazInterruptActivator />
        <GiartechNotificationHub />
        <ThomazOrchestrator />
        <UpdateBanner />
        <Suspense fallback={<PageLoader />}>
        <Routes location={location}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/mobile/login" element={<MobileLogin />} />
            <Route path="/access-denied" element={<AccessDenied403 />} />
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
          <Route path="/tecnico/ordens" element={
            <TechnicianRoute>
              <TechnicianLayout>
                <TechnicianHistorico />
              </TechnicianLayout>
            </TechnicianRoute>
          } />
          <Route path="/tecnico/roteiro" element={
            <TechnicianRoute>
              <TechnicianLayout>
                <TechnicianRoteiro />
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

          <Route path="/settings/notification-rules" element={
            <ProtectedRoute>
              <WebLayout>
                <NotificationRules />
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
            <ProtectedRoute moduleCode="projetos">
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

          <Route path="/giartech-docs" element={
            <ProtectedRoute>
              <WebLayout>
                <GiartechDocs />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/documents" element={<Navigate to="/giartech-docs" replace />} />

          <Route path="/contract-templates" element={<Navigate to="/giartech-docs" replace />} />

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

          <Route path="/access-management" element={<Navigate to="/identity-control" replace />} />

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

          <Route path="/portal-access" element={<Navigate to="/identity-control" replace />} />

          <Route path="/identity-control" element={
            <ProtectedRoute>
              <WebLayout>
                <IdentityControl />
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

          <Route path="/command-center" element={
            <ProtectedRoute>
              <WebLayout>
                <CommandCenter />
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
        </Suspense>

        {/* Tutorial Interativo */}
        <Suspense fallback={null}>
          <Tutorial
            isOpen={showTutorial}
            onComplete={() => {
              setShowTutorial(false)
              localStorage.setItem('os_system_tutorial_completed', 'true')
            }}
          />
        </Suspense>

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
      <ImpersonationBar />
      <OfflineIndicator />
      {isMobile() && <MobileBottomNav />}
      </NotificationHubProvider>
        </PortalProvider>
      </ImpersonationProvider>
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
