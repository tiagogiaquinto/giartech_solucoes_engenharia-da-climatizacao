import React, { useState, useEffect } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import LoadingScreen from './components/LoadingScreen'
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
import Inventory from './pages/Inventory'
import InventoryDetail from './pages/InventoryDetail'
import InventoryCreate from './pages/InventoryCreate'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import UserManagement from './pages/UserManagement'
import ServiceCatalog from './pages/ServiceCatalog'
import ServiceCatalogDetail from './pages/ServiceCatalogDetail'
import ServiceCatalogCreate from './pages/ServiceCatalogCreate'
import Tutorial from './components/Tutorial'
import { UserProvider, useUser } from './contexts/UserContext'
import FinancialIntegration from './pages/FinancialIntegration'
import ClientManagement from './pages/ClientManagement'
import VisualCustomization from './pages/VisualCustomization'
import MonitoringConfig from './pages/MonitoringConfig'
import Calendar from './pages/Calendar'
import Projects from './pages/Projects'
import Profile from './pages/Profile'
import CFODashboard from './pages/CFODashboard'
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
import WhatsAppCRM from './pages/WhatsAppCRM'
import WhatsAppCRMNew from './pages/WhatsAppCRM_NEW'
import ThomazMetrics from './pages/ThomazMetrics'
import FinancialManagement from './pages/FinancialManagement'
import FinancialAnalysis from './pages/FinancialAnalysis'
import BankAccounts from './pages/BankAccounts'
import EmployeeManagement from './pages/EmployeeManagement'
import UserInvitations from './pages/UserInvitations'
import AccessManagement from './pages/AccessManagement'
import FinancialCategories from './pages/FinancialCategories'
import AuditLogs from './pages/AuditLogs'
import CRMLeads from './pages/CRMLeads'
import Contracts from './pages/Contracts'
import ContractTemplates from './pages/ContractTemplates'
import DocumentTemplates from './pages/DocumentTemplates'
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
import { AIChatbot } from './components/AIChatbot'
import ThomazSuperChat from './components/ThomazSuperChat'
import { GiartechAssistant } from './components/GiartechAssistant'
import ThomazChat from './pages/ThomazChat'
import ReportsAdvanced from './pages/ReportsAdvanced'
import Automations from './pages/Automations'
import CreditScoring from './pages/CreditScoring'
import FinanceiroConsolidado from './pages/FinanceiroConsolidado'
import ExecutivoConsolidado from './pages/ExecutivoConsolidado'
import RelatoriosConsolidado from './pages/RelatoriosConsolidado'
import CustomerRFM from './pages/CustomerRFM'

// Protected route component - DESABILITADO para acesso livre
// const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
//   const { user } = useUser();
//   const location = useLocation();

//   if (!user) {
//     return <Navigate to="/login" state={{ from: location }} replace />;
//   }

//   return <>{children}</>;
// };

// Componente que sempre permite acesso
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
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

  // Verificar atualizações do sistema
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const response = await fetch('/version.json?t=' + Date.now())
        const serverVersion = await response.json()
        const localVersion = localStorage.getItem('app_version')

        if (localVersion && localVersion !== serverVersion.version) {
          console.log('Nova versão disponível:', serverVersion.version)
          if (confirm(`Nova versão ${serverVersion.version} disponível!\n\n${serverVersion.description}\n\nDeseja atualizar agora?`)) {
            localStorage.setItem('app_version', serverVersion.version)
            window.location.reload()
          }
        } else if (!localVersion) {
          localStorage.setItem('app_version', serverVersion.version)
        }
      } catch (error) {
        console.error('Erro ao verificar atualizações:', error)
      }
    }

    checkForUpdates()
    const interval = setInterval(checkForUpdates, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

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
    <UserProvider>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={<Login />} />
          <Route path="/pricing" element={<PricingPlans />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <WebLayout>
                <CFODashboard />
              </WebLayout>
            </ProtectedRoute>
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
                <ServiceOrderView />
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
          
          <Route path="/users" element={
            <ProtectedRoute>
              <WebLayout>
                <UserManagement />
              </WebLayout>
            </ProtectedRoute>
          } />
          
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

          <Route path="/whatsapp-crm" element={
            <ProtectedRoute>
              <WebLayout>
                <WhatsAppCRMNew />
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

          <Route path="/reports-advanced" element={
            <ProtectedRoute>
              <WebLayout>
                <ReportsAdvanced />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/automacoes" element={
            <ProtectedRoute>
              <WebLayout>
                <Automations />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/automations" element={
            <ProtectedRoute>
              <WebLayout>
                <Automations />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/financeiro" element={
            <ProtectedRoute>
              <WebLayout>
                <FinanceiroConsolidado />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/executivo" element={
            <ProtectedRoute>
              <WebLayout>
                <ExecutivoConsolidado />
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
          <Route path="/customer-rfm" element={
            <ProtectedRoute>
              <WebLayout>
                <CustomerRFM />
              </WebLayout>
            </ProtectedRoute>
          } />
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
                <AccessManagement />
              </WebLayout>
            </ProtectedRoute>
          } />

          <Route path="/funcionarios" element={
            <ProtectedRoute>
              <WebLayout>
                <EmployeeManagement />
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

          <Route path="/crm-leads" element={
            <ProtectedRoute>
              <WebLayout>
                <CRMLeads />
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

          <Route path="/document-templates" element={
            <ProtectedRoute>
              <WebLayout>
                <DocumentTemplates />
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

          <Route path="/homepage" element={<Homepage />} />
          <Route path="/home" element={<Home />} />
          <Route path="/sobre" element={<About />} />
          <Route path="/servicos" element={<Services />} />
          <Route path="/contato" element={<Contact />} />
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
      </AnimatePresence>

      {/* Thomaz Super Chat - Assistente Inteligente */}
      <ThomazSuperChat />

      {/* Assistente Giartech - Inteligência Corporativa */}
      <GiartechAssistant />

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
    </UserProvider>
  )
}

export default App