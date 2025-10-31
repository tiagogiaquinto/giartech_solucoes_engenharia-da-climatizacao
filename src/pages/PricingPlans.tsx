import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Check, 
  X, 
  Crown, 
  Zap, 
  Shield, 
  Users, 
  BarChart3, 
  Star,
  Calendar,
  FileText,
  DollarSign,
  Package,
  Smartphone,
  Palette,
  Cloud,
  Lock,
  MessageSquare,
  ArrowRight
} from 'lucide-react'
import { Link } from 'react-router-dom'

const PricingPlans = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly')
  const [showComparison, setShowComparison] = useState(false)

  const plans = [
    {
      name: 'Básico',
      description: 'Para pequenos negócios e profissionais autônomos',
      price: {
        monthly: 0,
        annual: 0
      },
      features: [
        'Até 50 ordens de serviço por mês',
        'Até 3 usuários',
        'Gestão básica de estoque',
        'Catálogo de serviços',
        'Relatórios básicos',
        'Suporte por email'
      ],
      limitations: [
        'Sem integração financeira',
        'Sem contratos de manutenção',
        'Sem personalização visual',
        'Sem acesso offline'
      ],
      cta: 'Começar Grátis',
      color: 'gray'
    },
    {
      name: 'Premium',
      description: 'Para empresas em crescimento que precisam de mais recursos',
      price: {
        monthly: 49.90,
        annual: 44.90
      },
      features: [
        'Ordens de serviço ilimitadas',
        'Até 10 usuários',
        'Gestão avançada de estoque',
        'Catálogo de serviços completo',
        'Contratos de manutenção',
        'Integração financeira',
        'Relatórios avançados',
        'Personalização visual',
        'Acesso offline',
        'Suporte prioritário'
      ],
      limitations: [
        'Sem API personalizada',
        'Sem SLA garantido'
      ],
      cta: 'Assinar Premium',
      color: 'blue',
      popular: true
    },
    {
      name: 'Enterprise',
      description: 'Para grandes empresas com necessidades complexas',
      price: {
        monthly: 99.90,
        annual: 89.90
      },
      features: [
        'Tudo do plano Premium',
        'Usuários ilimitados',
        'API personalizada',
        'Integrações avançadas',
        'Análise de dados avançada',
        'Monitoramento em tempo real',
        'Suporte 24/7',
        'Gerente de conta dedicado',
        'SLA garantido',
        'Treinamento personalizado'
      ],
      cta: 'Fale com Vendas',
      color: 'purple'
    }
  ]

  const featureComparison = [
    {
      category: 'Ordens de Serviço',
      features: [
        { name: 'Criação de OS', basic: true, premium: true, enterprise: true },
        { name: 'Atribuição de técnicos', basic: true, premium: true, enterprise: true },
        { name: 'Anexo de fotos', basic: true, premium: true, enterprise: true },
        { name: 'Histórico de status', basic: true, premium: true, enterprise: true },
        { name: 'OS ilimitadas', basic: false, premium: true, enterprise: true },
        { name: 'Modelos personalizados', basic: false, premium: true, enterprise: true },
        { name: 'Assinatura digital', basic: false, premium: true, enterprise: true },
        { name: 'Automação de fluxo', basic: false, premium: false, enterprise: true }
      ]
    },
    {
      category: 'Clientes',
      features: [
        { name: 'Cadastro básico', basic: true, premium: true, enterprise: true },
        { name: 'Histórico de serviços', basic: true, premium: true, enterprise: true },
        { name: 'Cadastro PF/PJ', basic: false, premium: true, enterprise: true },
        { name: 'Contratos de manutenção', basic: false, premium: true, enterprise: true },
        { name: 'SLA personalizado', basic: false, premium: false, enterprise: true },
        { name: 'Portal do cliente', basic: false, premium: false, enterprise: true }
      ]
    },
    {
      category: 'Estoque',
      features: [
        { name: 'Controle básico', basic: true, premium: true, enterprise: true },
        { name: 'Baixa automática', basic: false, premium: true, enterprise: true },
        { name: 'Alertas de estoque mínimo', basic: false, premium: true, enterprise: true },
        { name: 'Múltiplos depósitos', basic: false, premium: false, enterprise: true },
        { name: 'Gestão de fornecedores', basic: false, premium: true, enterprise: true }
      ]
    },
    {
      category: 'Financeiro',
      features: [
        { name: 'Faturamento básico', basic: true, premium: true, enterprise: true },
        { name: 'Integração com OS', basic: false, premium: true, enterprise: true },
        { name: 'Relatórios financeiros', basic: false, premium: true, enterprise: true },
        { name: 'Integração bancária', basic: false, premium: false, enterprise: true },
        { name: 'Fluxo de caixa avançado', basic: false, premium: false, enterprise: true }
      ]
    },
    {
      category: 'Relatórios',
      features: [
        { name: 'Relatórios básicos', basic: true, premium: true, enterprise: true },
        { name: 'Exportação PDF/Excel', basic: false, premium: true, enterprise: true },
        { name: 'Dashboards personalizados', basic: false, premium: true, enterprise: true },
        { name: 'Business Intelligence', basic: false, premium: false, enterprise: true },
        { name: 'Análise preditiva', basic: false, premium: false, enterprise: true }
      ]
    },
    {
      category: 'Suporte',
      features: [
        { name: 'Suporte por email', basic: true, premium: true, enterprise: true },
        { name: 'Suporte prioritário', basic: false, premium: true, enterprise: true },
        { name: 'Suporte 24/7', basic: false, premium: false, enterprise: true },
        { name: 'Gerente de conta', basic: false, premium: false, enterprise: true },
        { name: 'SLA garantido', basic: false, premium: false, enterprise: true },
        { name: 'Treinamento personalizado', basic: false, premium: false, enterprise: true }
      ]
    }
  ]

  const getColorClass = (plan: string) => {
    switch (plan) {
      case 'Básico': return 'gray'
      case 'Premium': return 'blue'
      case 'Enterprise': return 'purple'
      default: return 'gray'
    }
  }

  return (
    <div className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold text-gray-900 mb-4"
          >
            Planos e Preços
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Escolha o plano ideal para o seu negócio e comece a otimizar sua gestão de serviços hoje mesmo
          </motion.p>
          
          {/* Billing Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-8 inline-flex items-center bg-gray-100 p-1 rounded-full"
          >
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                billingPeriod === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                billingPeriod === 'annual'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Anual <span className="text-green-600 font-bold">-10%</span>
            </button>
          </motion.div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1, duration: 0.6 }}
              className={`relative rounded-2xl shadow-lg overflow-hidden transition-all duration-300 ${
                plan.popular
                  ? 'border-2 border-blue-500 transform md:-translate-y-4 hover:shadow-2xl'
                  : 'border border-gray-200 hover:shadow-xl'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 text-center text-sm font-bold">
                  MAIS POPULAR
                </div>
              )}
              
              <div className={`p-8 ${plan.popular ? 'pt-14' : 'pt-8'}`}>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-6 h-12">{plan.description}</p>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price[billingPeriod] === 0 ? 'Grátis' : `R$${plan.price[billingPeriod].toFixed(2)}`}
                  </span>
                  {plan.price[billingPeriod] > 0 && (
                    <span className="text-gray-600 ml-2">
                      /mês{billingPeriod === 'annual' && ', cobrado anualmente'}
                    </span>
                  )}
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                  
                  {plan.limitations && plan.limitations.map((limitation, idx) => (
                    <li key={`limit-${idx}`} className="flex items-start text-gray-400">
                      <X className="h-5 w-5 text-gray-300 mr-2 flex-shrink-0 mt-0.5" />
                      <span>{limitation}</span>
                    </li>
                  ))}
                </ul>
                
                <button
                  className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                    plan.name === 'Básico'
                      ? 'bg-gray-900 text-white hover:bg-gray-800'
                      : plan.name === 'Premium'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg transform hover:-translate-y-0.5'
                      : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:shadow-lg transform hover:-translate-y-0.5'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Feature Comparison Toggle */}
        <div className="text-center mb-8">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="inline-flex items-center space-x-2 text-blue-600 font-medium hover:text-blue-800 transition-colors"
          >
            <span>{showComparison ? 'Ocultar comparação detalhada' : 'Ver comparação detalhada de recursos'}</span>
            <motion.div
              animate={{ rotate: showComparison ? 90 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ArrowRight className="h-5 w-5" />
            </motion.div>
          </button>
        </div>

        {/* Feature Comparison Table */}
        {showComparison && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-16"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 w-1/3">
                      Recursos
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Básico
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-blue-600 uppercase tracking-wider bg-blue-50">
                      Premium
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-purple-600 uppercase tracking-wider bg-purple-50">
                      Enterprise
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {featureComparison.map((category) => (
                    <React.Fragment key={category.category}>
                      <tr className="bg-gray-50">
                        <td colSpan={4} className="px-6 py-4 text-sm font-medium text-gray-900">
                          {category.category}
                        </td>
                      </tr>
                      {category.features.map((feature, idx) => (
                        <tr key={`${category.category}-${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {feature.name}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {feature.basic ? (
                              <Check className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-gray-300 mx-auto" />
                            )}
                          </td>
                          <td className="px-6 py-4 text-center bg-blue-50">
                            {feature.premium ? (
                              <Check className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-gray-300 mx-auto" />
                            )}
                          </td>
                          <td className="px-6 py-4 text-center bg-purple-50">
                            {feature.enterprise ? (
                              <Check className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-gray-300 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Recursos Principais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: FileText,
                title: 'Gestão de Ordens de Serviço',
                description: 'Crie, acompanhe e gerencie todas as suas ordens de serviço em um só lugar.',
                color: 'blue'
              },
              {
                icon: Package,
                title: 'Controle de Estoque',
                description: 'Gerencie seu inventário com baixa automática de materiais utilizados nas OS.',
                color: 'green'
              },
              {
                icon: Users,
                title: 'Gestão de Clientes',
                description: 'Cadastro completo de clientes PF e PJ com histórico de serviços.',
                color: 'purple'
              },
              {
                icon: Calendar,
                title: 'Agendamento Inteligente',
                description: 'Organize a agenda dos técnicos e otimize rotas de atendimento.',
                color: 'orange'
              },
              {
                icon: DollarSign,
                title: 'Integração Financeira',
                description: 'Faturamento automático vinculado às ordens de serviço concluídas.',
                color: 'emerald'
              },
              {
                icon: BarChart3,
                title: 'Relatórios Avançados',
                description: 'Análise detalhada de desempenho, produtividade e resultados financeiros.',
                color: 'indigo'
              },
              {
                icon: Smartphone,
                title: 'Acesso Mobile',
                description: 'Acesse o sistema de qualquer lugar, mesmo sem conexão com internet.',
                color: 'pink'
              },
              {
                icon: Palette,
                title: 'Personalização Visual',
                description: 'Adapte a interface às cores e identidade visual da sua empresa.',
                color: 'amber'
              },
              {
                icon: Cloud,
                title: 'Backup Automático',
                description: 'Seus dados sempre seguros com backup automático na nuvem.',
                color: 'sky'
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-lg bg-${feature.color}-100 flex items-center justify-center mb-4`}>
                  <feature.icon className={`h-6 w-6 text-${feature.color}-600`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Perguntas Frequentes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {[
              {
                question: 'Posso mudar de plano a qualquer momento?',
                answer: 'Sim, você pode fazer upgrade ou downgrade do seu plano a qualquer momento. As mudanças entram em vigor imediatamente e o valor é ajustado proporcionalmente.'
              },
              {
                question: 'Existe período de teste?',
                answer: 'Sim, oferecemos 14 dias de teste gratuito para os planos Premium e Enterprise, com acesso a todos os recursos.'
              },
              {
                question: 'Como funciona o suporte técnico?',
                answer: 'O plano Básico inclui suporte por email com tempo de resposta de até 48h. O plano Premium oferece suporte prioritário com resposta em até 24h. O plano Enterprise inclui suporte 24/7 por email, chat e telefone.'
              },
              {
                question: 'Preciso instalar algum software?',
                answer: 'Não, o GiarTech é uma solução 100% web, acessível de qualquer navegador. Também oferecemos aplicativos mobile para iOS e Android nos planos Premium e Enterprise.'
              },
              {
                question: 'Meus dados estão seguros?',
                answer: 'Sim, utilizamos criptografia de ponta a ponta e seguimos as melhores práticas de segurança. Realizamos backups diários e estamos em conformidade com a LGPD.'
              },
              {
                question: 'Posso cancelar a qualquer momento?',
                answer: 'Sim, você pode cancelar sua assinatura a qualquer momento sem taxas adicionais. No caso de planos anuais, oferecemos reembolso proporcional ao período não utilizado.'
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white"
        >
          <h2 className="text-3xl font-bold mb-4">Pronto para transformar sua gestão de serviços?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Comece agora mesmo com o plano gratuito ou experimente todos os recursos premium por 14 dias sem compromisso.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:shadow-lg transition-all duration-200">
              Começar Gratuitamente
            </button>
            <button className="px-8 py-4 bg-blue-500 bg-opacity-30 text-white font-semibold rounded-xl hover:bg-opacity-40 hover:shadow-lg transition-all duration-200">
              Agendar Demonstração
            </button>
          </div>
        </motion.div>

        {/* Contact Info */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-2">Precisa de ajuda para escolher o plano ideal?</p>
          <p className="text-gray-900 font-medium">
            Entre em contato: <a href="tel:1155552560" className="text-blue-600 hover:text-blue-800">11 5555-2560</a> | <a href="mailto:contato@giartech.com.br" className="text-blue-600 hover:text-blue-800">contato@giartech.com.br</a>
          </p>
          <p className="text-gray-500 text-sm mt-4">
            GiarTech Soluções Engenharia da Climatização | CNPJ: 37.509.897/0001-93
          </p>
        </div>
      </div>
    </div>
  )
}

export default PricingPlans