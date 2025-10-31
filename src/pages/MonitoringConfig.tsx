import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, 
  Plus, 
  X, 
  Save, 
  Eye, 
  EyeOff, 
  BarChart3, 
  Package, 
  ClipboardList, 
  Users, 
  DollarSign, 
  Clock, 
  Truck, 
  AlertTriangle, 
  Lock, 
  Database, 
  Bell, 
  Wifi, 
  Shield as ShieldIcon, 
  Zap, 
  Server,
  Info,
  HelpCircle,
  Settings,
  ChevronRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useUser } from '../contexts/UserContext'
import PreviewModal from '../components/PreviewModal'

interface MonitoringConfigProps {
  onPremiumFeature?: (feature: string) => void
  onEnterpriseFeature?: (feature: string) => void
}

interface MonitoringArea {
  id: string
  name: string
  description: string
  icon: any
  enabled: boolean
  metrics: string[]
  color: string
  requiresPremium?: boolean
  requiresEnterprise?: boolean
}

interface EnterpriseConfig {
  id: string
  name: string
  description: string
  icon: any
  settings: EnterpriseConfigSetting[]
  requiresEnterprise: boolean
}

interface EnterpriseConfigSetting {
  id: string
  name: string
  description: string
  type: 'toggle' | 'select' | 'input' | 'range'
  value: any
  options?: string[]
  min?: number
  max?: number
  step?: number
}

const MonitoringConfig: React.FC<MonitoringConfigProps> = ({ 
  onPremiumFeature, 
  onEnterpriseFeature 
}) => {
  const { isPremium, isEnterprise } = useUser()
  
  const [areas, setAreas] = useState<MonitoringArea[]>([
    {
      id: 'inventory',
      name: 'Estoque de Materiais',
      description: 'Controle de produtos, quantidades e movimentações',
      icon: Package,
      enabled: true,
      metrics: ['Quantidade em estoque', 'Produtos em falta', 'Valor total', 'Rotatividade'],
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'orders',
      name: 'Ordens de Serviço',
      description: 'Gestão de pedidos e acompanhamento de status',
      icon: ClipboardList,
      enabled: true,
      metrics: ['Ordens abertas', 'Ordens concluídas', 'Tempo médio', 'Satisfação'],
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'team',
      name: 'Desempenho da Equipe',
      description: 'Produtividade e performance dos colaboradores',
      icon: Users,
      enabled: false,
      metrics: ['Tarefas concluídas', 'Horas trabalhadas', 'Eficiência', 'Avaliações'],
      color: 'from-purple-500 to-pink-500',
      requiresPremium: true
    },
    {
      id: 'financial',
      name: 'Financeiro',
      description: 'Receitas, despesas e indicadores financeiros',
      icon: DollarSign,
      enabled: false,
      metrics: ['Receita mensal', 'Despesas', 'Lucro líquido', 'Fluxo de caixa'],
      color: 'from-orange-500 to-red-500',
      requiresPremium: true
    },
    {
      id: 'delivery',
      name: 'Entregas',
      description: 'Acompanhamento de entregas e logística',
      icon: Truck,
      enabled: true,
      metrics: ['Entregas no prazo', 'Atrasos', 'Distância percorrida', 'Custos'],
      color: 'from-indigo-500 to-purple-500'
    },
    {
      id: 'quality',
      name: 'Qualidade',
      description: 'Controle de qualidade e não conformidades',
      icon: AlertTriangle,
      enabled: false,
      metrics: ['Não conformidades', 'Reclamações', 'Índice de qualidade', 'Melhorias'],
      color: 'from-yellow-500 to-orange-500',
      requiresEnterprise: true
    }
  ])

  const [enterpriseConfigs, setEnterpriseConfigs] = useState<EnterpriseConfig[]>([
    {
      id: 'realtime',
      name: 'Monitoramento em Tempo Real',
      description: 'Configurações para monitoramento em tempo real',
      icon: Zap,
      requiresEnterprise: true,
      settings: [
        {
          id: 'interval',
          name: 'Intervalo de Atualização',
          description: 'Frequência de atualização dos dados em tempo real',
          type: 'select',
          value: '5s',
          options: ['1s', '5s', '10s', '30s', '1m']
        },
        {
          id: 'alerts',
          name: 'Alertas Automáticos',
          description: 'Enviar alertas automáticos quando métricas ultrapassarem limites',
          type: 'toggle',
          value: true
        },
        {
          id: 'threshold',
          name: 'Limite de Alerta',
          description: 'Percentual de desvio para disparar alertas',
          type: 'range',
          value: 15,
          min: 5,
          max: 50,
          step: 5
        }
      ]
    },
    {
      id: 'security',
      name: 'Segurança Avançada',
      description: 'Configurações de segurança para monitoramento',
      icon: ShieldIcon,
      requiresEnterprise: true,
      settings: [
        {
          id: 'encryption',
          name: 'Criptografia de Dados',
          description: 'Criptografar dados sensíveis de monitoramento',
          type: 'toggle',
          value: true
        },
        {
          id: 'access',
          name: 'Controle de Acesso',
          description: 'Nível de permissão para visualizar dados de monitoramento',
          type: 'select',
          value: 'admin',
          options: ['admin', 'manager', 'all']
        },
        {
          id: 'audit',
          name: 'Trilha de Auditoria',
          description: 'Manter logs de acesso aos dados de monitoramento',
          type: 'toggle',
          value: true
        }
      ]
    },
    {
      id: 'notifications',
      name: 'Notificações',
      description: 'Configurações de notificações de monitoramento',
      icon: Bell,
      requiresEnterprise: true,
      settings: [
        {
          id: 'channels',
          name: 'Canais de Notificação',
          description: 'Canais para envio de notificações',
          type: 'select',
          value: 'all',
          options: ['email', 'push', 'sms', 'all']
        },
        {
          id: 'frequency',
          name: 'Frequência de Resumos',
          description: 'Frequência de envio de resumos de monitoramento',
          type: 'select',
          value: 'daily',
          options: ['hourly', 'daily', 'weekly']
        },
        {
          id: 'quiet',
          name: 'Período de Silêncio',
          description: 'Horário em que notificações não serão enviadas',
          type: 'input',
          value: '22:00 - 08:00'
        }
      ]
    },
    {
      id: 'integration',
      name: 'Integrações',
      description: 'Configurações de integração com sistemas externos',
      icon: Server,
      requiresEnterprise: true,
      settings: [
        {
          id: 'api',
          name: 'API Externa',
          description: 'Integrar com API externa para monitoramento',
          type: 'toggle',
          value: false
        },
        {
          id: 'endpoint',
          name: 'Endpoint da API',
          description: 'URL do endpoint da API externa',
          type: 'input',
          value: 'https://api.example.com/monitoring'
        },
        {
          id: 'format',
          name: 'Formato de Dados',
          description: 'Formato dos dados enviados para API externa',
          type: 'select',
          value: 'json',
          options: ['json', 'xml', 'csv']
        }
      ]
    },
    {
      id: 'storage',
      name: 'Armazenamento de Dados',
      description: 'Configurações de armazenamento de dados de monitoramento',
      icon: Database,
      requiresEnterprise: true,
      settings: [
        {
          id: 'retention',
          name: 'Período de Retenção',
          description: 'Tempo de retenção dos dados de monitoramento',
          type: 'select',
          value: '90d',
          options: ['30d', '90d', '180d', '365d', 'unlimited']
        },
        {
          id: 'compression',
          name: 'Compressão de Dados',
          description: 'Comprimir dados históricos para economizar espaço',
          type: 'toggle',
          value: true
        },
        {
          id: 'backup',
          name: 'Backup Automático',
          description: 'Frequência de backup dos dados de monitoramento',
          type: 'select',
          value: 'daily',
          options: ['daily', 'weekly', 'monthly']
        }
      ]
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [activeEnterpriseTab, setActiveEnterpriseTab] = useState<string>(enterpriseConfigs[0]?.id || '')
  const [newArea, setNewArea] = useState({
    name: '',
    description: '',
    metrics: ['']
  })
  const [previewConfig, setPreviewConfig] = useState<MonitoringArea | null>(null)
  const [expandedSections, setExpandedSections] = useState<string[]>(['areas', 'enterprise'])
  const [showHelp, setShowHelp] = useState(false)

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section) 
        : [...prev, section]
    )
  }

  const toggleArea = (id: string) => {
    const area = areas.find(a => a.id === id)
    
    if (area?.requiresPremium && !isPremium) {
      onPremiumFeature && onPremiumFeature('Monitoramento Avançado')
      return
    }
    
    if (area?.requiresEnterprise && !isEnterprise) {
      onEnterpriseFeature && onEnterpriseFeature('Monitoramento Enterprise')
      return
    }
    
    setAreas(areas.map(area => 
      area.id === id ? { ...area, enabled: !area.enabled } : area
    ))

    // Provide visual feedback
    const element = document.getElementById(`area-${id}`)
    if (element) {
      element.classList.add('bg-blue-50')
      setTimeout(() => {
        element.classList.remove('bg-blue-50')
      }, 300)
    }
  }

  const handleSaveConfig = () => {
    console.log('Configurações salvas:', areas.filter(area => area.enabled))
    
    // Visual feedback
    const saveButton = document.getElementById('save-config-button')
    if (saveButton) {
      const originalText = saveButton.innerText
      saveButton.innerText = 'Salvo!'
      saveButton.classList.add('bg-green-500')
      saveButton.classList.remove('from-green-500', 'to-emerald-500')
      
      setTimeout(() => {
        saveButton.innerText = originalText
        saveButton.classList.remove('bg-green-500')
        saveButton.classList.add('bg-gradient-to-r', 'from-green-500', 'to-emerald-500')
      }, 2000)
    }
    
    alert('Configurações de monitoramento salvas com sucesso!')
  }

  const addMetric = () => {
    setNewArea(prev => ({
      ...prev,
      metrics: [...prev.metrics, '']
    }))
  }

  const updateMetric = (index: number, value: string) => {
    setNewArea(prev => ({
      ...prev,
      metrics: prev.metrics.map((metric, i) => i === index ? value : metric)
    }))
  }

  const removeMetric = (index: number) => {
    setNewArea(prev => ({
      ...prev,
      metrics: prev.metrics.filter((_, i) => i !== index)
    }))
  }

  const handleCreateArea = () => {
    if (!isPremium) {
      onPremiumFeature && onPremiumFeature('Áreas de Monitoramento Personalizadas')
      setShowAddModal(false)
      return
    }
    
    if (newArea.name.trim()) {
      const area: MonitoringArea = {
        id: Date.now().toString(),
        name: newArea.name,
        description: newArea.description,
        icon: BarChart3,
        enabled: true,
        metrics: newArea.metrics.filter(m => m.trim()),
        color: 'from-gray-500 to-gray-600'
      }
      
      setAreas([...areas, area])
      setNewArea({ name: '', description: '', metrics: [''] })
      setShowAddModal(false)
      
      // Visual feedback
      setTimeout(() => {
        const element = document.getElementById(`area-${area.id}`)
        if (element) {
          element.classList.add('bg-green-50')
          setTimeout(() => {
            element.classList.remove('bg-green-50')
          }, 1000)
        }
      }, 100)
    }
  }

  const handleUpdateEnterpriseSetting = (configId: string, settingId: string, value: any) => {
    if (!isEnterprise) {
      onEnterpriseFeature && onEnterpriseFeature('Configurações Enterprise')
      return
    }
    
    setEnterpriseConfigs(prev => 
      prev.map(config => 
        config.id === configId 
          ? {
              ...config,
              settings: config.settings.map(setting => 
                setting.id === settingId 
                  ? { ...setting, value } 
                  : setting
              )
            }
          : config
      )
    )
    
    // Visual feedback
    const element = document.getElementById(`setting-${configId}-${settingId}`)
    if (element) {
      element.classList.add('bg-blue-50')
      setTimeout(() => {
        element.classList.remove('bg-blue-50')
      }, 300)
    }
  }

  const handlePreviewConfig = (area: MonitoringArea) => {
    setPreviewConfig(area)
    setShowPreviewModal(true)
  }

  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-3 shadow-lg border border-gray-100"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-base font-bold text-gray-900 mb-1">
              Configuração de Monitoramento
            </h1>
            <p className="text-xs text-gray-600">
              Configure quais áreas você deseja monitorar nas análises
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="bg-blue-100 text-blue-700 px-2 py-1.5 rounded-lg flex items-center space-x-1 hover:bg-blue-200 transition-all text-xs"
            >
              <HelpCircle className="h-3 w-3" />
              <span>Ajuda</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-1.5 rounded-lg flex items-center space-x-1 hover:shadow-lg transition-all text-xs"
            >
              <Plus className="h-3 w-3" />
              <span>Nova Área</span>
            </button>
            <button
              id="save-config-button"
              onClick={handleSaveConfig}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1.5 rounded-lg flex items-center space-x-1 hover:shadow-lg transition-all text-xs"
            >
              <Save className="h-3 w-3" />
              <span>Salvar</span>
            </button>
          </div>
        </div>
        
        {/* Free Plan Limitation Notice */}
        {!isPremium && (
          <div className="mt-3 p-2 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-xs text-blue-700 flex items-center">
              <Settings className="h-3 w-3 mr-1" />
              Plano Básico: Limitado a 3 áreas de monitoramento. Faça upgrade para monitoramento avançado.
            </p>
          </div>
        )}
      </motion.div>

      {/* Help Panel */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-blue-50 rounded-xl p-3 shadow-md border border-blue-100"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-blue-800 flex items-center">
                <Info className="h-4 w-4 mr-1" />
                Como configurar o monitoramento
              </h2>
              <button
                onClick={() => setShowHelp(false)}
                className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-2">
              <div className="bg-white rounded-lg p-2 border border-blue-200">
                <h3 className="font-medium text-blue-800 mb-1 text-xs">Áreas de Monitoramento</h3>
                <p className="text-xs text-blue-700">
                  Ative ou desative áreas específicas para monitoramento. Cada área contém métricas 
                  relevantes que serão exibidas nos dashboards e relatórios.
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-2 border border-blue-200">
                <h3 className="font-medium text-blue-800 mb-1 text-xs">Configurações Enterprise</h3>
                <p className="text-xs text-blue-700">
                  Configure opções avançadas como monitoramento em tempo real, segurança, 
                  notificações e integrações. Disponível apenas para planos Enterprise.
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-2 border border-blue-200">
                <h3 className="font-medium text-blue-800 mb-1 text-xs">Dicas de Uso</h3>
                <ul className="text-xs text-blue-700 space-y-1 list-disc pl-4">
                  <li>Clique no ícone de olho para ativar/desativar uma área</li>
                  <li>Use o botão "Nova Área" para criar áreas personalizadas</li>
                  <li>Clique em "Salvar" após fazer alterações</li>
                  <li>Use o botão de visualização para ver detalhes de cada área</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Monitoring Areas Section */}
      <div className="bg-white rounded-xl p-3 shadow-lg border border-gray-100">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('areas')}
        >
          <h2 className="text-sm font-semibold text-gray-900 flex items-center">
            <Settings className="h-4 w-4 mr-1 text-blue-500" />
            Áreas de Monitoramento
          </h2>
          {expandedSections.includes('areas') ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </div>
        
        <AnimatePresence>
          {expandedSections.includes('areas') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {areas.map((area) => (
                  <motion.div
                    id={`area-${area.id}`}
                    key={area.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-white rounded-lg p-3 border border-gray-100 transition-all duration-200 ${
                      area.enabled ? 'ring-1 ring-blue-200' : 'opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-8 h-8 bg-gradient-to-r ${area.color} rounded-lg flex items-center justify-center`}>
                        <area.icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex items-center space-x-1">
                        {(area.requiresPremium && !isPremium) || (area.requiresEnterprise && !isEnterprise) ? (
                          <div className="p-1.5 bg-gray-100 text-gray-400 rounded-lg">
                            <Lock className="h-3.5 w-3.5" />
                          </div>
                        ) : (
                          <button
                            onClick={() => toggleArea(area.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              area.enabled 
                                ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                            aria-label={area.enabled ? "Desativar área" : "Ativar área"}
                          >
                            {area.enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          </button>
                        )}
                        
                        <button
                          onClick={() => handlePreviewConfig(area)}
                          className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                          aria-label="Visualizar detalhes"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-sm font-semibold text-gray-900 mb-1">{area.name}</h3>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{area.description}</p>

                    <div className="space-y-1">
                      <h4 className="text-xs font-medium text-gray-700">Métricas:</h4>
                      <div className="space-y-0.5">
                        {area.metrics.slice(0, 2).map((metric, metricIndex) => (
                          <div key={metricIndex} className="flex items-center text-xs text-gray-600">
                            <div className="w-1 h-1 bg-blue-500 rounded-full mr-1.5"></div>
                            {metric}
                          </div>
                        ))}
                        {area.metrics.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{area.metrics.length - 2} mais
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        area.enabled 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {area.enabled ? 'Ativo' : 'Inativo'}
                      </div>
                      
                      {(area.requiresPremium || area.requiresEnterprise) && (
                        <div className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 flex items-center">
                          <Lock className="h-2.5 w-2.5 mr-0.5" />
                          {area.requiresEnterprise ? 'Enterprise' : 'Premium'}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Enterprise Configuration Section */}
      <div className="bg-white rounded-xl p-3 shadow-lg border border-gray-100">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('enterprise')}
        >
          <h2 className="text-sm font-semibold text-gray-900 flex items-center">
            <Shield className="h-4 w-4 mr-1 text-purple-500" />
            Configurações Enterprise
          </h2>
          {expandedSections.includes('enterprise') ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </div>
        
        <AnimatePresence>
          {expandedSections.includes('enterprise') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3"
            >
              {isEnterprise ? (
                <>
                  {/* Tabs */}
                  <div className="border-b border-gray-200 mb-3 overflow-x-auto hide-scrollbar">
                    <div className="flex">
                      {enterpriseConfigs.map(config => (
                        <button
                          key={config.id}
                          onClick={() => setActiveEnterpriseTab(config.id)}
                          className={`flex items-center space-x-1 px-3 py-1.5 border-b-2 whitespace-nowrap text-xs ${
                            activeEnterpriseTab === config.id
                              ? 'border-purple-500 text-purple-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <config.icon className="h-3 w-3" />
                          <span>{config.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Active Tab Content */}
                  {enterpriseConfigs.map(config => (
                    <div key={config.id} className={activeEnterpriseTab === config.id ? 'block' : 'hidden'}>
                      <div className="mb-3">
                        <h3 className="text-sm font-medium text-gray-900">{config.name}</h3>
                        <p className="text-xs text-gray-600">{config.description}</p>
                      </div>
                      
                      <div className="space-y-3">
                        {config.settings.map(setting => (
                          <div 
                            id={`setting-${config.id}-${setting.id}`}
                            key={setting.id} 
                            className="bg-gray-50 rounded-lg p-3 transition-colors duration-200"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <div>
                                <h4 className="font-medium text-gray-900 text-sm">{setting.name}</h4>
                                <p className="text-xs text-gray-600">{setting.description}</p>
                              </div>
                              
                              {setting.type === 'toggle' && (
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={setting.value}
                                    onChange={() => handleUpdateEnterpriseSetting(config.id, setting.id, !setting.value)}
                                    className="sr-only peer"
                                  />
                                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                                </label>
                              )}
                            </div>
                            
                            {setting.type === 'select' && (
                              <select
                                value={setting.value}
                                onChange={(e) => handleUpdateEnterpriseSetting(config.id, setting.id, e.target.value)}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mt-1 text-xs"
                              >
                                {setting.options?.map(option => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            )}
                            
                            {setting.type === 'input' && (
                              <input
                                type="text"
                                value={setting.value}
                                onChange={(e) => handleUpdateEnterpriseSetting(config.id, setting.id, e.target.value)}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mt-1 text-xs"
                              />
                            )}
                            
                            {setting.type === 'range' && (
                              <div className="mt-1">
                                <input
                                  type="range"
                                  min={setting.min}
                                  max={setting.max}
                                  step={setting.step}
                                  value={setting.value}
                                  onChange={(e) => handleUpdateEnterpriseSetting(config.id, setting.id, parseInt(e.target.value))}
                                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                  <span>{setting.min}%</span>
                                  <span>{setting.value}%</span>
                                  <span>{setting.max}%</span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="py-6 text-center">
                  <Shield className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Recursos Enterprise</h3>
                  <p className="text-xs text-gray-600 mb-4 max-w-md mx-auto">
                    Acesse configurações avançadas de monitoramento com o plano Enterprise.
                  </p>
                  <button
                    onClick={() => onEnterpriseFeature && onEnterpriseFeature('Configurações Enterprise')}
                    className="px-4 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:shadow-lg transition-all text-xs"
                  >
                    Ver Plano Enterprise
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl p-3 shadow-lg border border-gray-100"
      >
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Resumo da Configuração</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">
              {areas.filter(area => area.enabled).length}
            </div>
            <div className="text-xs text-gray-600">Áreas Ativas</div>
          </div>
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">
              {areas.filter(area => area.enabled).reduce((acc, area) => acc + area.metrics.length, 0)}
            </div>
            <div className="text-xs text-gray-600">Métricas Monitoradas</div>
          </div>
          <div className="text-center p-2 bg-purple-50 rounded-lg">
            <div className="text-lg font-bold text-purple-600">
              {Math.round((areas.filter(area => area.enabled).length / areas.length) * 100)}%
            </div>
            <div className="text-xs text-gray-600">Cobertura</div>
          </div>
        </div>
        
        {/* Enterprise Feature Teaser */}
        {!isEnterprise && (
          <div className="mt-3 p-2 bg-purple-50 border border-purple-100 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center">
                <BarChart3 className="h-4 w-4 text-purple-600 mr-1 flex-shrink-0" />
                <div>
                  <p className="font-medium text-purple-800 text-xs">Monitoramento em Tempo Real</p>
                  <p className="text-xs text-purple-600">Alertas instantâneos e dashboards ao vivo</p>
                </div>
              </div>
              <button 
                onClick={() => onEnterpriseFeature && onEnterpriseFeature('Monitoramento em Tempo Real')}
                className="px-2 py-1 bg-purple-200 text-purple-700 rounded-lg flex items-center space-x-1 hover:bg-purple-300 transition-colors text-xs"
              >
                <Lock className="h-2.5 w-2.5 mr-0.5" />
                <span>Enterprise</span>
                <ChevronRight className="h-2.5 w-2.5 ml-0.5" />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Add New Area Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white rounded-xl p-4 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-gray-900">Nova Área de Monitoramento</h2>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {!isPremium ? (
                <div className="text-center py-5">
                  <Lock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Recurso Premium</h3>
                  <p className="text-gray-600 mb-4 text-sm">
                    Áreas de monitoramento personalizadas estão disponíveis apenas para assinantes do plano Premium.
                  </p>
                  <button
                    onClick={() => {
                      onPremiumFeature && onPremiumFeature('Áreas de Monitoramento Personalizadas')
                      setShowAddModal(false)
                    }}
                    className="px-4 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all text-sm"
                  >
                    Ver Plano Premium
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Nome da Área
                      </label>
                      <input
                        type="text"
                        value={newArea.name}
                        onChange={(e) => setNewArea({...newArea, name: e.target.value})}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Ex: Vendas Online"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Descrição
                      </label>
                      <textarea
                        value={newArea.description}
                        onChange={(e) => setNewArea({...newArea, description: e.target.value})}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        rows={2}
                        placeholder="Descreva o que será monitorado nesta área"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-medium text-gray-700">
                          Métricas
                        </label>
                        <button
                          onClick={addMetric}
                          className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
                        >
                          <Plus className="h-3 w-3 mr-0.5" />
                          Adicionar
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {newArea.metrics.map((metric, index) => (
                          <div key={index} className="flex items-center space-x-1">
                            <input
                              type="text"
                              value={metric}
                              onChange={(e) => updateMetric(index, e.target.value)}
                              className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                              placeholder="Nome da métrica"
                            />
                            {newArea.metrics.length > 1 && (
                              <button
                                onClick={() => removeMetric(index)}
                                className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                                aria-label="Remover métrica"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2 mt-4">
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleCreateArea}
                      className="flex-1 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg text-sm"
                    >
                      Criar Área
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <PreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title={`Preview: ${previewConfig?.name || 'Configuração'}`}
      >
        {previewConfig && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 bg-gradient-to-r ${previewConfig.color} rounded-xl flex items-center justify-center`}>
                <previewConfig.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">{previewConfig.name}</h3>
                <p className="text-sm text-gray-600">{previewConfig.description}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2 text-sm">Métricas Monitoradas</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {previewConfig.metrics.map((metric, index) => (
                  <div key={index} className="flex items-center space-x-1.5 p-1.5 bg-gray-50 rounded-lg">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <span className="text-xs text-gray-700">{metric}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2 text-sm">Visualização de Dashboard</h4>
              <div className="bg-gray-50 rounded-lg p-3 h-32 flex items-center justify-center">
                <p className="text-xs text-gray-500 text-center">
                  Aqui será exibido o dashboard de monitoramento para {previewConfig.name.toLowerCase()}.
                  <br />
                  <span className="text-xs">Os dados serão atualizados em tempo real quando esta área estiver ativa.</span>
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2 text-sm">Status</h4>
              <div className="flex items-center space-x-2">
                <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  previewConfig.enabled 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {previewConfig.enabled ? 'Ativo' : 'Inativo'}
                </div>
                
                {(previewConfig.requiresPremium || previewConfig.requiresEnterprise) && (
                  <div className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 flex items-center">
                    <Lock className="h-2.5 w-2.5 mr-0.5" />
                    {previewConfig.requiresEnterprise ? 'Enterprise' : 'Premium'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </PreviewModal>
    </div>
  )
}

export default MonitoringConfig