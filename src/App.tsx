import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { UserProvider } from './contexts/UserContext'
import { PortalProvider } from './contexts/PortalContext'
import WebLayout from './components/layouts/WebLayout'
import LoadingScreen from './components/LoadingScreen'
import Home from './pages/Home'
import LoginPage from './pages/LoginPage'
import TechnicianPortal from './pages/TechnicianPortal'
import { ThomazConfigPanel } from './components/thomaz/ThomazConfigPanel'

// Dashboard
const Dashboard = lazy(() => import('./pages/Dashboard'))
const DepartmentalDashboard = lazy(() => import('./pages/DepartmentalDashboard'))
const ExecutiveDashboard = lazy(() => import('./pages/ExecutiveDashboard'))
const CFODashboard = lazy(() => import('./pages/CFODashboard'))

// Agenda
const AgendaHub = lazy(() => import('./pages/AgendaHub'))
const Calendar = lazy(() => import('./pages/Calendar'))
const TaskBoard = lazy(() => import('./pages/TaskBoard/TaskBoard'))
const CommandCenter = lazy(() => import('./pages/CommandCenter/CommandCenter'))

// Clientes
const ClientesHub = lazy(() => import('./pages/ClientesHub'))
const ClientManagement = lazy(() => import('./pages/ClientManagement'))
const Customer360 = lazy(() => import('./pages/Customer360'))
const CustomerRFM = lazy(() => import('./pages/CustomerRFM'))
const CustomerCredits = lazy(() => import('./pages/CustomerCredits'))
const CustomerReferrals = lazy(() => import('./pages/CustomerReferrals'))
const CustomerGamification = lazy(() => import('./pages/CustomerGamification'))
const CustomerGamificationManager = lazy(() => import('./pages/CustomerGamificationManager'))
const CadastroClientesParceiros = lazy(() => import('./pages/CadastroClientesParceiros'))

// CRM
const CRMHub = lazy(() => import('./pages/CRMHub'))
const CRMProfessional = lazy(() => import('./pages/CRMProfessional'))
const CRMLeads = lazy(() => import('./pages/CRMLeads'))
const CRMEsteiraIntegrada = lazy(() => import('./pages/CRMEsteiraIntegrada'))
const CRMMessageTemplates = lazy(() => import('./pages/CRMMessageTemplates'))
const WhatsAppCRM = lazy(() => import('./pages/WhatsAppCRM'))
const PosVenda = lazy(() => import('./pages/PosVenda'))
const CreditScoring = lazy(() => import('./pages/CreditScoring'))

// Gamificação
const GamificationHub = lazy(() => import('./pages/GamificationHub'))
const GoalsAndRankings = lazy(() => import('./pages/GoalsAndRankings'))
const PartnerGamification = lazy(() => import('./pages/PartnerGamification'))

// Ordens de Serviço
const ServiceOrders = lazy(() => import('./pages/ServiceOrders'))
const ServiceOrderCreate = lazy(() => import('./pages/ServiceOrderCreate'))
const ServiceOrderDetails = lazy(() => import('./pages/ServiceOrderDetails'))
const ServiceOrderView = lazy(() => import('./pages/ServiceOrderView'))
const ServiceOrdersKanban = lazy(() => import('./pages/ServiceOrdersKanban'))
const OSDistribution = lazy(() => import('./pages/OSDistribution'))

// Catálogo / Serviços
const ServiceCatalog = lazy(() => import('./pages/ServiceCatalog'))
const ServiceCatalogCreate = lazy(() => import('./pages/ServiceCatalogCreate'))
const ServiceCatalogDetail = lazy(() => import('./pages/ServiceCatalogDetail'))
const Services = lazy(() => import('./pages/Services'))
const Materials = lazy(() => import('./pages/Materials'))

// Financeiro
const FinancialManagement = lazy(() => import('./pages/FinancialManagement'))
const FinancialAnalysis = lazy(() => import('./pages/FinancialAnalysis'))
const FinancialCategories = lazy(() => import('./pages/FinancialCategories'))
const FinancialIntegration = lazy(() => import('./pages/FinancialIntegration'))
const FinanceiroConsolidado = lazy(() => import('./pages/FinanceiroConsolidado'))
const BankAccounts = lazy(() => import('./pages/BankAccounts'))
const Invoices = lazy(() => import('./pages/Invoices'))
const BudgetManagement = lazy(() => import('./pages/BudgetManagement'))
const SalaryManagement = lazy(() => import('./pages/SalaryManagement'))

// Compras
const ComprasHub = lazy(() => import('./pages/ComprasHub'))
const Purchasing = lazy(() => import('./pages/Purchasing'))
const Suppliers = lazy(() => import('./pages/Suppliers'))

// Estoque
const EstoqueHub = lazy(() => import('./pages/EstoqueHub'))
const Inventory = lazy(() => import('./pages/Inventory'))
const InventoryCreate = lazy(() => import('./pages/InventoryCreate'))
const InventoryDetail = lazy(() => import('./pages/InventoryDetail'))
const Equipments = lazy(() => import('./pages/Equipments'))

// Relatórios
const RelatoriosHub = lazy(() => import('./pages/RelatoriosHub'))
const Reports = lazy(() => import('./pages/Reports'))
const ReportsAdvanced = lazy(() => import('./pages/ReportsAdvanced'))
const RelatoriosConsolidado = lazy(() => import('./pages/RelatoriosConsolidado'))
const WeeklyReport = lazy(() => import('./pages/WeeklyReport'))

// Documentos
const GiartechDocs = lazy(() => import('./pages/GiartechDocs'))
const DocumentCenter = lazy(() => import('./pages/DocumentCenter'))
const Documents = lazy(() => import('./pages/Documents'))
const ContractTemplates = lazy(() => import('./pages/ContractTemplates'))
const DigitalLibrary = lazy(() => import('./pages/DigitalLibrary'))

// Thomaz AI
const ThomazHub = lazy(() => import('./pages/ThomazHub'))
const ThomazChat = lazy(() => import('./pages/ThomazChat'))
const ThomazDashboard = lazy(() => import('./pages/ThomazDashboard'))
const ThomazMetrics = lazy(() => import('./pages/ThomazMetrics'))

// Equipe
const StaffHub = lazy(() => import('./pages/StaffHub'))
const StaffManagement = lazy(() => import('./pages/StaffManagement'))
const PeopleManagement = lazy(() => import('./pages/PeopleManagement'))
const TeamManagement = lazy(() => import('./pages/TeamManagement'))
const EmployeeManagement = lazy(() => import('./pages/EmployeeManagement'))
const UserAccessManagement = lazy(() => import('./pages/UserAccessManagement'))
const UserInvitations = lazy(() => import('./pages/UserInvitations'))
const TechnicianPerformance = lazy(() => import('./pages/TechnicianPerformance'))

// Chat
const InternalChat = lazy(() => import('./pages/InternalChat'))
const Chat = lazy(() => import('./pages/Chat'))

// IAM / Acesso
const IdentityControl = lazy(() => import('./pages/IdentityControl/IdentityControl'))
const PortalAccessManager = lazy(() => import('./pages/PortalAccessManager'))
const AdminAccessCodes = lazy(() => import('./pages/AdminAccessCodes'))

// Rastreamento / QR
const RouteTracking = lazy(() => import('./pages/RouteTracking'))
const QRCodeManager = lazy(() => import('./pages/QRCodeManager'))

// Configurações
const Settings = lazy(() => import('./pages/Settings'))
const CompanySettings = lazy(() => import('./pages/CompanySettings'))
const AIProvidersSettings = lazy(() => import('./pages/AIProvidersSettings'))
const VisualCustomization = lazy(() => import('./pages/VisualCustomization'))
const NotificationRules = lazy(() => import('./pages/NotificationRules'))
const MonitoringConfig = lazy(() => import('./pages/MonitoringConfig'))
const Profile = lazy(() => import('./pages/Profile'))

// Auditoria
const AuditLogs = lazy(() => import('./pages/AuditLogs'))
const AuditDashboard = lazy(() => import('./pages/AuditDashboard'))

// Misc
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const PricingPlans = lazy(() => import('./pages/PricingPlans'))
const Projects = lazy(() => import('./pages/Projects'))
const AccessDenied403 = lazy(() => import('./pages/AccessDenied403'))

// Portal externo
const PortalLogin = lazy(() => import('./pages/portal/PortalLogin'))
const PortalLayout = lazy(() => import('./pages/portal/PortalLayout'))
const PortalDashboardRouter = lazy(() => import('./pages/portal/PortalDashboardRouter'))
const CustomerPortalHistory = lazy(() => import('./pages/portal/CustomerPortalHistory'))
const CustomerPortalAddresses = lazy(() => import('./pages/portal/CustomerPortalAddresses'))
const CustomerPortalInventory = lazy(() => import('./pages/portal/CustomerPortalInventory'))
const CustomerPortalDocuments = lazy(() => import('./pages/portal/CustomerPortalDocuments'))
const CustomerServiceRequest = lazy(() => import('./pages/portal/CustomerServiceRequest'))
const CustomerPortalBudgets = lazy(() => import('./pages/portal/CustomerPortalBudgets'))
const PartnerPortalHistory = lazy(() => import('./pages/portal/PartnerPortalHistory'))

// Mobile
const MobileRoutes = lazy(() => import('./pages/mobile/MobileRoutes'))

// OS Track (público)
const OSTrackPage = lazy(() => import('./pages/track/OSTrackPage'))

// GiartechCare
const GiartechCare = lazy(() => import('./pages/care/GiartechCare'))

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* === AUTENTICAÇÃO === */}
            <Route path="/login" element={<LoginPage />} />

            {/* === PORTAL TÉCNICO === */}
            <Route path="/tecnico" element={<TechnicianPortal />} />

            {/* === RASTREAMENTO PÚBLICO DE OS === */}
            <Route path="/track/:token" element={<OSTrackPage />} />

            {/* === PORTAL CLIENTE/PARCEIRO === */}
            <Route path="/portal/login" element={<PortalProvider><PortalLogin /></PortalProvider>} />
            <Route path="/portal" element={<PortalProvider><PortalLayout /></PortalProvider>}>
              <Route path="dashboard" element={<PortalDashboardRouter />} />
              <Route path="historico" element={<CustomerPortalHistory />} />
              <Route path="enderecos" element={<CustomerPortalAddresses />} />
              <Route path="inventario" element={<CustomerPortalInventory />} />
              <Route path="documentos" element={<CustomerPortalDocuments />} />
              <Route path="solicitar" element={<CustomerServiceRequest />} />
              <Route path="orcamentos" element={<CustomerPortalBudgets />} />
              <Route path="historico-parceiro" element={<PartnerPortalHistory />} />
            </Route>

            {/* === MOBILE === */}
            <Route path="/mobile/*" element={<MobileRoutes />} />

            {/* === SISTEMA WEB PRINCIPAL === */}
            <Route element={<WebLayout />}>
              {/* Home / Dashboard */}
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/departmental-dashboard" element={<DepartmentalDashboard />} />
              <Route path="/executive-dashboard" element={<ExecutiveDashboard />} />
              <Route path="/cfo-dashboard" element={<CFODashboard />} />

              {/* Agenda */}
              <Route path="/agenda-hub" element={<AgendaHub />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/task-board" element={<TaskBoard />} />
              <Route path="/command-center" element={<CommandCenter />} />

              {/* Clientes */}
              <Route path="/clientes-hub" element={<ClientesHub />} />
              <Route path="/client-management" element={<ClientManagement />} />
              <Route path="/customer-360/:id" element={<Customer360 />} />
              <Route path="/customer-rfm" element={<CustomerRFM />} />
              <Route path="/customer-credits" element={<CustomerCredits />} />
              <Route path="/customer-referrals" element={<CustomerReferrals />} />
              <Route path="/customer-gamification" element={<CustomerGamification />} />
              <Route path="/customer-gamification-manager" element={<CustomerGamificationManager />} />
              <Route path="/cadastro-clientes-parceiros" element={<CadastroClientesParceiros />} />

              {/* CRM */}
              <Route path="/crm-hub" element={<CRMHub />} />
              <Route path="/crm" element={<CRMProfessional />} />
              <Route path="/crm-leads" element={<CRMLeads />} />
              <Route path="/crm-esteira" element={<CRMEsteiraIntegrada />} />
              <Route path="/crm-templates" element={<CRMMessageTemplates />} />
              <Route path="/whatsapp-crm" element={<WhatsAppCRM />} />
              <Route path="/pos-venda" element={<PosVenda />} />
              <Route path="/credit-scoring" element={<CreditScoring />} />

              {/* Gamificação */}
              <Route path="/gamification" element={<GamificationHub />} />
              <Route path="/goals-rankings" element={<GoalsAndRankings />} />
              <Route path="/partner-gamification" element={<PartnerGamification />} />

              {/* Ordens de Serviço */}
              <Route path="/service-orders" element={<ServiceOrders />} />
              <Route path="/service-orders/create" element={<ServiceOrderCreate />} />
              <Route path="/service-orders/:id" element={<ServiceOrderDetails />} />
              <Route path="/service-orders/:id/view" element={<ServiceOrderView />} />
              <Route path="/service-orders-kanban" element={<ServiceOrdersKanban />} />
              <Route path="/os-distribution" element={<OSDistribution />} />

              {/* Catálogo / Serviços */}
              <Route path="/service-catalog" element={<ServiceCatalog />} />
              <Route path="/service-catalog/create" element={<ServiceCatalogCreate />} />
              <Route path="/service-catalog/:id" element={<ServiceCatalogDetail />} />
              <Route path="/services" element={<Services />} />
              <Route path="/materials" element={<Materials />} />

              {/* Financeiro */}
              <Route path="/financial" element={<FinancialManagement />} />
              <Route path="/financial-analysis" element={<FinancialAnalysis />} />
              <Route path="/financial-categories" element={<FinancialCategories />} />
              <Route path="/financial-integration" element={<FinancialIntegration />} />
              <Route path="/financeiro" element={<FinanceiroConsolidado />} />
              <Route path="/bank-accounts" element={<BankAccounts />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/budget-management" element={<BudgetManagement />} />
              <Route path="/salary-management" element={<SalaryManagement />} />

              {/* Compras */}
              <Route path="/compras-hub" element={<ComprasHub />} />
              <Route path="/purchasing" element={<Purchasing />} />
              <Route path="/suppliers" element={<Suppliers />} />

              {/* Estoque */}
              <Route path="/estoque-hub" element={<EstoqueHub />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/inventory/create" element={<InventoryCreate />} />
              <Route path="/inventory/:id" element={<InventoryDetail />} />
              <Route path="/equipments" element={<Equipments />} />

              {/* Relatórios */}
              <Route path="/relatorios-hub" element={<RelatoriosHub />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/reports-advanced" element={<ReportsAdvanced />} />
              <Route path="/relatorios-consolidado" element={<RelatoriosConsolidado />} />
              <Route path="/weekly-report" element={<WeeklyReport />} />

              {/* Documentos */}
              <Route path="/giartech-docs" element={<GiartechDocs />} />
              <Route path="/document-center" element={<DocumentCenter />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/contracts" element={<ContractTemplates />} />
              <Route path="/digital-library" element={<DigitalLibrary />} />

              {/* Thomaz AI */}
              <Route path="/thomaz-hub" element={<ThomazHub />} />
              <Route path="/thomaz-chat" element={<ThomazChat />} />
              <Route path="/thomaz-dashboard" element={<ThomazDashboard />} />
              <Route path="/thomaz-metrics" element={<ThomazMetrics />} />
              <Route path="/thomaz/config" element={
                <div className="min-h-screen bg-gray-100 py-10 px-4">
                  <div className="max-w-3xl mx-auto">
                    <ThomazConfigPanel />
                  </div>
                </div>
              } />

              {/* Equipe */}
              <Route path="/staff" element={<StaffHub />} />
              <Route path="/staff-management" element={<StaffManagement />} />
              <Route path="/people-management" element={<PeopleManagement />} />
              <Route path="/team-management" element={<TeamManagement />} />
              <Route path="/employee-management" element={<EmployeeManagement />} />
              <Route path="/user-access-management" element={<UserAccessManagement />} />
              <Route path="/user-invitations" element={<UserInvitations />} />
              <Route path="/technician-performance" element={<TechnicianPerformance />} />

              {/* Chat */}
              <Route path="/chat-interno" element={<InternalChat />} />
              <Route path="/chat" element={<Chat />} />

              {/* IAM / Acesso */}
              <Route path="/identity-control" element={<IdentityControl />} />
              <Route path="/portal-access-manager" element={<PortalAccessManager />} />
              <Route path="/admin-access-codes" element={<AdminAccessCodes />} />

              {/* Rastreamento / QR */}
              <Route path="/rotas" element={<RouteTracking />} />
              <Route path="/qr-codes" element={<QRCodeManager />} />

              {/* Configurações */}
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/notification-rules" element={<NotificationRules />} />
              <Route path="/company-settings" element={<CompanySettings />} />
              <Route path="/ai-providers" element={<AIProvidersSettings />} />
              <Route path="/visual-customization" element={<VisualCustomization />} />
              <Route path="/monitoring-config" element={<MonitoringConfig />} />
              <Route path="/profile" element={<Profile />} />

              {/* Auditoria */}
              <Route path="/audit-logs" element={<AuditLogs />} />
              <Route path="/audit-dashboard" element={<AuditDashboard />} />

              {/* Care */}
              <Route path="/giartech-care" element={<GiartechCare />} />

              {/* Misc */}
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/pricing" element={<PricingPlans />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/403" element={<AccessDenied403 />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </UserProvider>
  )
}

export default App
