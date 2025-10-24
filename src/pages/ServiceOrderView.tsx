import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, User, Calendar, FileText, Package, Users, DollarSign, FileDown, CreditCard as Edit, Trash2, CircleAlert as AlertCircle, Eye } from 'lucide-react'
import { supabase, getServiceOrderById, deleteServiceOrder } from '../lib/supabase'
import { generateServiceOrderPDFGiartech } from '../utils/generateServiceOrderPDFGiartech'
import { mapServiceItems } from '../utils/serviceOrderDataMapper'
import ContractViewModal from '../components/ContractViewModal'
import ProposalViewModal from '../components/ProposalViewModal'
import ServiceOrderViewGiartech from '../components/ServiceOrderViewGiartech'
import { OSTimeline } from '../components/OSTimeline'
import { InlineEdit } from '../components/InlineEdit'
import { OSAuditLog } from '../components/OSAuditLog'
import { OSChecklist } from '../components/OSChecklist'
import { ServiceDetailedInfo } from '../components/ServiceDetailedInfo'
import { ServiceInfoEditModal } from '../components/ServiceInfoEditModal'

const ServiceOrderView = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<any>(null)
  const [customer, setCustomer] = useState<any>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showContractModal, setShowContractModal] = useState(false)
  const [showProposalModal, setShowProposalModal] = useState(false)
  const [showGiartechModal, setShowGiartechModal] = useState(false)
  const [showTimelineModal, setShowTimelineModal] = useState(false)
  const [showAuditModal, setShowAuditModal] = useState(false)
  const [showChecklistModal, setShowChecklistModal] = useState(false)
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [companySettings, setCompanySettings] = useState<any>(null)
  const [showServiceInfoModal, setShowServiceInfoModal] = useState(false)
  const [selectedServiceItem, setSelectedServiceItem] = useState<any>(null)

  useEffect(() => {
    if (id) {
      loadOrder()
    }
  }, [id])

  const loadOrder = async () => {
    try {
      setLoading(true)
      const orderData = await getServiceOrderById(id!)

      if (orderData) {
        setOrder(orderData)

        // Buscar cliente com endereço completo
        const { data: customerData } = await supabase
          .from('customers')
          .select(`
            *,
            customer_addresses(
              logradouro,
              numero,
              complemento,
              bairro,
              cidade,
              estado,
              cep
            )
          `)
          .eq('id', orderData.client_id)
          .single()

        setCustomer(customerData)

        // Buscar itens da ordem de serviço COM TODOS OS CAMPOS
        const { data: itemsData } = await supabase
          .from('service_order_items')
          .select(`
            *,
            service_catalog:service_catalog_id(
              id,
              name,
              description,
              base_price,
              category,
              escopo_servico,
              requisitos_tecnicos,
              avisos_seguranca,
              passos_execucao,
              resultados_esperados,
              padroes_qualidade,
              informacoes_garantia,
              observacoes_tecnicas,
              tempo_estimado_minutos
            )
          `)
          .eq('service_order_id', id!)

        // Buscar materiais de cada item
        const { data: materialsData } = await supabase
          .from('service_order_materials')
          .select(`
            *,
            material:material_id(name, unit)
          `)
          .eq('service_order_id', id!)

        // Buscar mão de obra (labor) de cada item
        const { data: laborData } = await supabase
          .from('service_order_labor')
          .select(`
            *,
            employee:staff_id(id, name)
          `)
          .eq('service_order_id', id!)

        // Buscar equipe da OS
        const { data: teamData } = await supabase
          .from('service_order_team')
          .select(`
            *,
            employee:employee_id(id, name)
          `)
          .eq('service_order_id', id!)

        // Atualizar order com os itens carregados
        if (itemsData && itemsData.length > 0) {
          const enrichedItems = itemsData.map((item: any) => {
            // Filtrar materiais deste item
            const itemMaterials = (materialsData || []).filter(
              (m: any) => m.service_order_item_id === item.id
            ).map((m: any) => ({
              nome: m.material_name || m.nome_material || m.material?.name || 'Material',
              quantidade: m.quantity || m.quantidade || 0,
              unidade_medida: m.material_unit || m.material?.unit || 'un',
              preco_unitario: m.unit_price || m.preco_venda || 0,
              valor_total: m.total_price || m.valor_total || 0
            }))

            // Filtrar mão de obra deste item
            const itemLabor = (laborData || []).filter(
              (l: any) => l.service_order_item_id === item.id
            ).map((l: any) => ({
              nome: l.nome_funcionario || l.employee?.name || 'Funcionário',
              tempo_minutos: l.tempo_minutos || (l.hours ? l.hours * 60 : 0) || 0,
              custo_hora: l.custo_hora || l.hourly_rate || 0,
              custo_total: l.custo_total || l.total_cost || 0
            }))

            return {
              id: item.id,
              service_catalog_id: item.service_catalog_id,
              description: item.descricao || item.notes || item.service_catalog?.description || item.service_catalog?.name || '',
              name: item.service_catalog?.name || item.descricao || '',
              descricao: item.descricao || item.notes || item.service_catalog?.name || '',
              escopo: item.escopo_detalhado || item.escopo || '',
              escopo_detalhado: item.escopo_detalhado || item.escopo || '',
              scope: item.escopo_detalhado || item.escopo || '',
              quantity: item.quantity || item.quantidade || 1,
              quantidade: item.quantidade || item.quantity || 1,
              unit_price: item.unit_price || item.preco_unitario || 0,
              preco_unitario: item.preco_unitario || item.unit_price || 0,
              total_price: item.total_price || item.preco_total || 0,
              preco_total: item.preco_total || item.total_price || 0,
              estimated_duration: item.estimated_duration || item.tempo_estimado_minutos || 0,
              tempo_estimado_minutos: item.tempo_estimado_minutos || item.estimated_duration || 0,
              materiais: itemMaterials,
              funcionarios: itemLabor
            }
          })

          setOrder({
            ...orderData,
            items: enrichedItems,
            team: (teamData || []).map((t: any) => ({
              id: t.id,
              employee_id: t.employee_id,
              nome: t.employee?.name || 'Funcionário',
              role: t.role || '',
              assigned_at: t.assigned_at
            }))
          } as any)
        }

        const { data: bankData } = await supabase
          .from('bank_accounts')
          .select('*')
          .eq('is_default', true)
          .maybeSingle()

        if (bankData) {
          setBankAccounts([bankData])
        }

        const { data: settingsData } = await supabase
          .from('company_settings')
          .select('*')
          .maybeSingle()

        setCompanySettings(settingsData)
      }
    } catch (error) {
      console.error('Error loading order:', error)
      alert('Erro ao carregar ordem de serviço')
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePDF = async () => {
    if (!order || !customer) {
      alert('Dados incompletos para gerar PDF')
      return
    }

    try {
      // Buscar configurações da empresa
      const { data: companyData } = await supabase
        .from('company_settings')
        .select('*')
        .maybeSingle()

      const companyInfo = companyData ? {
        name: companyData.company_name || 'Sua Empresa',
        cnpj: companyData.cnpj || '00.000.000/0000-00',
        address: companyData.address || 'Rua Exemplo, 123',
        city: companyData.city || 'São Paulo',
        state: companyData.state || 'SP',
        zip: companyData.zip_code || '00000-000',
        phone: companyData.phone || '(11) 0000-0000',
        email: companyData.email || 'contato@empresa.com.br',
        website: companyData.website || 'www.empresa.com.br'
      } : {
        name: 'Sua Empresa',
        cnpj: '00.000.000/0000-00',
        address: 'Rua Exemplo, 123',
        city: 'São Paulo',
        state: 'SP',
        zip: '00000-000',
        phone: '(11) 0000-0000',
        email: 'contato@empresa.com.br',
        website: 'www.empresa.com.br'
      }

      // Buscar endereço do cliente
      const customerAddr = customer.customer_addresses?.[0]

      const orderData = {
        order_number: order.order_number || 'N/A',
        created_at: order.created_at,
        status: order.status,
        customer: {
          nome_razao: customer.nome_razao || customer.name || 'Cliente',
          name: customer.name || customer.nome_razao || 'Cliente',
          cnpj_cpf: customer.cnpj_cpf || '',
          email: customer.email || '',
          telefone: customer.telefone || customer.phone || '',
          phone: customer.phone || customer.telefone || '',
          endereco: customerAddr?.logradouro || customer.endereco || customer.address || '',
          address: customerAddr?.logradouro || customer.address || customer.endereco || '',
          cidade: customerAddr?.cidade || customer.cidade || customer.city || '',
          city: customerAddr?.cidade || customer.city || customer.cidade || '',
          estado: customerAddr?.estado || customer.estado || customer.state || '',
          state: customerAddr?.estado || customer.state || customer.estado || '',
          cep: customerAddr?.cep || customer.cep || customer.zip_code || '',
          zip_code: customerAddr?.cep || customer.zip_code || customer.cep || ''
        },
        description: order.description || '',
        scheduled_at: order.due_date || order.service_date,
        service_date: order.service_date || order.due_date,
        completion_date: order.completion_date,
        items: order.items || [],
        team: order.team || [],
        payment_method: order.payment_method || '',
        payment_installments: order.payment_installments || 1,
        warranty_period: order.warranty_period || 0,
        warranty_type: order.warranty_type || 'days',
        warranty_terms: order.warranty_terms || '',
        subtotal: order.subtotal || order.total_value || 0,
        total_value: order.total_value || 0,
        discount_amount: order.discount_amount || order.desconto_valor || 0,
        desconto_valor: order.desconto_valor || order.discount_amount || 0,
        final_total: order.final_total || order.total_value || 0,
        notes: order.notes || ''
      }

      await generateServiceOrderPDFGiartech(prepareGiartechData())
      alert('PDF gerado com sucesso!')
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      alert('Erro ao gerar PDF!')
    }
  }

  const prepareGiartechData = () => {
    if (!order || !customer) return null

    const customerAddr = customer.customer_addresses?.[0]

    // Debug: ver dados dos itens
    console.log('📦 PREPARANDO DADOS GIARTECH')
    console.log('📦 Total de itens:', order.items?.length)
    if (order.items && order.items.length > 0) {
      console.log('📝 Primeiro item completo:', JSON.stringify(order.items[0], null, 2))
      if (order.items[0]?.service_catalog) {
        console.log('📚 Catálogo do primeiro item:', JSON.stringify(order.items[0].service_catalog, null, 2))
      }
    }

    return {
      order_number: order.order_number || 'N/A',
      date: order.created_at || new Date().toISOString(),
      title: order.title || order.description || '',
      client: {
        name: order.client_name || customer.nome_razao || customer.name || 'Cliente',
        company_name: order.client_company_name || customer.nome_fantasia || '',
        cnpj: order.client_cnpj || customer.cnpj || '',
        cpf: order.client_cpf || customer.cpf || '',
        address: order.client_address || (customerAddr ? `${customerAddr.logradouro}${customerAddr.numero ? ', ' + customerAddr.numero : ''}` : ''),
        city: order.client_city || customerAddr?.cidade || '',
        state: order.client_state || customerAddr?.estado || '',
        cep: order.client_cep || customerAddr?.cep || '',
        email: order.client_email || customer.email || '',
        phone: order.client_phone || customer.telefone || customer.phone || ''
      },
      basic_info: {
        deadline: order.prazo_execucao_dias ? `${order.prazo_execucao_dias} dias` : '15 dias',
        brand: order.brand || '',
        model: order.model || '',
        equipment: order.equipment || ''
      },
      items: mapServiceItems(order.items || []),
      subtotal: order.subtotal || order.total_value || 0,
      discount: order.discount_amount || order.desconto_valor || 0,
      total: order.final_total || order.total_value || 0,
      payment: {
        methods: order.payment_methods || 'Transferência bancária, dinheiro, cartão de crédito, cartão de débito ou pix',
        pix: order.payment_pix || companySettings?.pix_key || order.client_cnpj || order.client_cpf || '',
        bank_details: bankAccounts[0] ? {
          bank: bankAccounts[0].bank_name || 'Banco',
          agency: bankAccounts[0].agency || '0001',
          account: bankAccounts[0].account_number || '',
          account_type: bankAccounts[0].account_type === 'checking' ? 'Corrente' : bankAccounts[0].account_type === 'savings' ? 'Poupança' : 'Corrente',
          holder: bankAccounts[0].account_holder || companySettings?.company_name || ''
        } : undefined,
        conditions: order.payment_conditions || 'Sinal de 50% e o valor restante após a conclusão.'
      },
      warranty: {
        period: order.warranty_period ? `${order.warranty_period} ${order.warranty_type === 'days' ? 'dias' : order.warranty_type === 'months' ? 'meses' : 'anos'}` : '12 meses',
        conditions: order.warranty_terms || `Garantias referentes à sistemas de novo em tubulações antigas, só serão válidas, com os processos de descontaminação das tubulações antigas.

Garantia de (EQUIPAMENTOS NOVOS) que podem ser de 5 a 10 anos, só são válidas com manutenção semestral comprovada COM LAUDO TÉCNICO.

Garantias extendidas pela nossa empresa, são concedidas em caso de compra das máquinas conosco, as mesmas deixam de ter validade legal de 3 meses e podem ter até 12 meses de acordo com o tipo e capacidade do sistema, mediante a manutenção dos equipamentos realizadas conosco nos prazos estipulados pelo fabricante...`
      },
      contract_clauses: order.contract_clauses ? JSON.parse(order.contract_clauses) : [],
      additional_info: order.additional_info || 'Trabalhamos para que seus projetos, se tornem realidade.. Obrigado pela confiança'
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const handleDeleteClick = () => {
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!id) return

    try {
      setDeleting(true)
      await deleteServiceOrder(id)
      alert('Ordem de serviço excluída com sucesso!')
      navigate('/service-orders')
    } catch (err) {
      console.error('Error deleting order:', err)
      alert('Erro ao excluir ordem de serviço. Verifique se não há dependências.')
    } finally {
      setDeleting(false)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteModal(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-gray-600">Ordem de serviço não encontrada</p>
          <button
            onClick={() => navigate('/service-orders')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/service-orders')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Visualizar Ordem de Serviço</h1>
            <p className="text-gray-600 mt-1">OS #{order.order_number}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowGiartechModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 flex items-center gap-2 shadow-lg"
          >
            <Eye className="h-4 w-4" />
            Ver Orçamento
          </button>
          <button
            onClick={handleGeneratePDF}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 flex items-center gap-2 shadow-lg"
          >
            <FileDown className="h-4 w-4" />
            Gerar PDF OS
          </button>
          <button
            onClick={() => setShowProposalModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-700 hover:to-teal-800 flex items-center gap-2 shadow-lg"
          >
            <Eye className="h-4 w-4" />
            Ver Proposta
          </button>
          <button
            onClick={() => setShowContractModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 flex items-center gap-2 shadow-lg"
          >
            <FileText className="h-4 w-4" />
            Ver Contrato
          </button>
          <button
            onClick={() => navigate(`/service-orders?edit=${id}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Editar
          </button>
          <button
            onClick={() => setShowTimelineModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 flex items-center gap-2 shadow-lg"
          >
            <Calendar className="h-4 w-4" />
            Timeline
          </button>
          <button
            onClick={() => setShowChecklistModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg hover:from-amber-700 hover:to-amber-800 flex items-center gap-2 shadow-lg"
          >
            <FileText className="h-4 w-4" />
            Checklist
          </button>
          <button
            onClick={() => setShowAuditModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 flex items-center gap-2 shadow-lg"
          >
            <AlertCircle className="h-4 w-4" />
            Auditoria
          </button>
          <button
            onClick={handleDeleteClick}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 flex items-center gap-2 shadow-lg"
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm border"
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Informações do Cliente
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                <p className="text-gray-900">{customer?.nome_razao || customer?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <p className="text-gray-900">{customer?.telefone || customer?.phone || 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900">{customer?.email || 'N/A'}</p>
              </div>
              {(customer?.endereco || customer?.address) && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                  <p className="text-gray-900">
                    {customer?.endereco || customer?.address}
                    {(customer?.cidade || customer?.city) && `, ${customer?.cidade || customer?.city}`}
                    {(customer?.estado || customer?.state) && ` - ${customer?.estado || customer?.state}`}
                    {(customer?.cep || customer?.zip_code) && ` - CEP: ${customer?.cep || customer?.zip_code}`}
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border"
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Detalhes da Ordem
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <p className="text-gray-900">{order.description || 'Sem descrição'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Criação</label>
                  <p className="text-gray-900">{formatDate(order.created_at)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Prevista</label>
                  <p className="text-gray-900">
                    {order.due_date ? formatDate(order.due_date) :
                     order.service_date ? formatDate(order.service_date) : 'Não definida'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {order.items && order.items.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-6 shadow-sm border"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  Serviços
                </h2>
                <button
                  onClick={() => {
                    if (order.items && order.items.length > 0) {
                      setSelectedServiceItem(order.items[0])
                      setShowServiceInfoModal(true)
                    }
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Edit className="h-4 w-4" />
                  Editar Informações
                </button>
              </div>
              <div className="space-y-3">
                {order.items.map((item: any, index: number) => (
                  <ServiceDetailedInfo
                    key={item.id || index}
                    service={item}
                    isExpanded={false}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm border"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Resumo Financeiro
            </h3>
            <div className="space-y-3">
              {order.items && order.items.length > 0 && (
                <div className="space-y-2 pb-3 border-b">
                  {order.items.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600 flex-1 mr-2">
                        {item.descricao || item.description || item.service_name || 'Serviço'}
                      </span>
                      <span className="font-medium whitespace-nowrap">
                        {formatCurrency(item.total_price || item.total || ((item.unit_price || item.price || 0) * (item.quantity || 1)))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">{formatCurrency(order.subtotal_value || order.total_value || 0)}</span>
              </div>
              {order.discount_value > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Desconto:</span>
                  <span className="font-semibold">-{formatCurrency(order.discount_value)}</span>
                </div>
              )}
              <div className="pt-3 border-t">
                <div className="flex justify-between">
                  <span className="text-lg font-bold text-gray-900">Total:</span>
                  <span className="text-2xl font-bold text-green-600">{formatCurrency(order.total_value || 0)}</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border"
          >
            <h3 className="text-lg font-semibold mb-4">Status</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Status Atual:</span>
                <div className="mt-1">
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    order.status === 'completed' ? 'bg-green-100 text-green-800' :
                    order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status === 'completed' ? 'Concluída' :
                     order.status === 'in_progress' ? 'Em Andamento' :
                     order.status === 'pending' ? 'Pendente' :
                     order.status}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <Trash2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Excluir Ordem de Serviço</h3>
                    <p className="text-red-100 text-sm">Esta ação não pode ser desfeita</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-900 font-semibold mb-2">
                      Você está prestes a excluir a seguinte OS:
                    </p>
                    <div className="space-y-2 text-sm">
                      <p className="text-red-800">
                        <span className="font-bold">Número:</span> {order?.order_number}
                      </p>
                      <p className="text-red-800">
                        <span className="font-bold">Cliente:</span> {customer?.nome_razao || customer?.name}
                      </p>
                      <p className="text-red-800">
                        <span className="font-bold">Serviço:</span> {order?.service_type}
                      </p>
                      <p className="text-red-800">
                        <span className="font-bold">Valor:</span> {formatCurrency(order?.total_cost || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-yellow-900 font-semibold mb-1">
                      ⚠️ Atenção!
                    </p>
                    <p className="text-yellow-800 text-sm">
                      Ao excluir esta OS, todos os dados relacionados serão permanentemente removidos do sistema. Esta ação é irreversível.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-gray-700 text-center mb-6 font-medium">
                Tem certeza que deseja continuar?
              </p>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCancelDelete}
                  disabled={deleting}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-5 w-5" />
                      Confirmar Exclusão
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      <ContractViewModal
        isOpen={showContractModal}
        onClose={() => setShowContractModal(false)}
        serviceOrderId={id || ''}
      />

      {order && customer && (
        <>
          <ServiceOrderViewGiartech
            isOpen={showGiartechModal}
            onClose={() => setShowGiartechModal(false)}
            data={prepareGiartechData()}
          />

          <ProposalViewModal
            isOpen={showProposalModal}
            onClose={() => setShowProposalModal(false)}
            data={{
              order_number: order.order_number || 'N/A',
              date: order.created_at || new Date().toISOString(),
              title: order.description || '',
              client: {
                name: customer.nome_razao || customer.name || 'Cliente',
                company_name: customer.nome_razao,
                cnpj: customer.cnpj_cpf,
                address: (() => {
                  const addr = customer.customer_addresses?.[0]
                  if (addr) {
                    return `${addr.logradouro}${addr.numero ? ', ' + addr.numero : ''}${addr.complemento ? ' - ' + addr.complemento : ''}`
                  }
                  return customer.address_street
                    ? `${customer.address_street}${customer.address_number ? ', ' + customer.address_number : ''}${customer.address_complement ? ' - ' + customer.address_complement : ''}`
                    : (customer.endereco || customer.address)
                })(),
                city: (() => {
                  const addr = customer.customer_addresses?.[0]
                  return addr?.cidade || customer.address_city || customer.cidade || customer.city
                })(),
                state: (() => {
                  const addr = customer.customer_addresses?.[0]
                  return addr?.estado || customer.address_state || customer.estado || customer.state
                })(),
                cep: (() => {
                  const addr = customer.customer_addresses?.[0]
                  return addr?.cep || customer.address_zip_code || customer.cep || customer.zip_code
                })(),
                email: customer.email,
                phone: customer.telefone || customer.phone
              },
              company: {
                name: companySettings?.company_name || 'Giartech Soluções',
                owner: companySettings?.owner_name || 'Tiago Bruno Giaquinto',
                cnpj: companySettings?.cnpj || '375.098.970',
                address: companySettings?.address || 'Rua Quito 14, 14',
                city: companySettings?.city || 'São Paulo',
                state: companySettings?.state || 'SP',
                cep: companySettings?.zip_code,
                email: companySettings?.email || 'giartechsolucoes@gmail.com',
                phones: companySettings?.phone ? [companySettings.phone] : ['+351 511 966 617', '+351 511 943 985'],
                social: {
                  instagram: '@tg.arconnection',
                  facebook: '@tgarconnection',
                  website: 'tgarconnection.com.br'
                },
                tagline: 'Sua satisfação é o que motiva a nossa dedicação'
              },
              basic_info: {
                deadline: order.estimated_hours ? `${order.estimated_hours} horas` : '3 DIAS',
                brand: order.equipment_brand,
                model: order.equipment_model
              },
              items: (order.items || []).map((item: any) => ({
                description: item.service_catalog?.name || item.service_name || item.name || item.descricao || item.description || 'Serviço',
                scope: item.notes || item.service_catalog?.description || item.scope || item.description || '',
                unit: item.unit || 'un.',
                unit_price: item.unit_price || item.preco_unitario || item.price || 0,
                quantity: item.quantity || item.quantidade || 1,
                total_price: item.total_price || item.preco_total || ((item.unit_price || item.preco_unitario || item.price || 0) * (item.quantity || item.quantidade || 1))
              })),
              subtotal: order.subtotal_value || order.total_value || 0,
              discount: order.discount_value || order.desconto_valor || 0,
              total: order.total_value || 0,
              show_value: order.show_value !== false,
              relatorio_tecnico: order.relatorio_tecnico,
              orientacoes_servico: order.orientacoes_servico,
              escopo_detalhado: order.escopo_detalhado,
              payment: {
                methods: order.payment_method === 'dinheiro' ? 'Dinheiro' :
                        order.payment_method === 'pix' ? 'PIX' :
                        order.payment_method === 'cartao_credito' ? 'Cartão de Crédito' :
                        order.payment_method === 'cartao_debito' ? 'Cartão de Débito' :
                        order.payment_method === 'transferencia' ? 'Transferência Bancária' :
                        'Transferência bancária, dinheiro, cartão de crédito, cartão de débito ou pix',
                pix: bankAccounts[0]?.pix_key || companySettings?.cnpj,
                bank_details: bankAccounts[0] ? {
                  bank: bankAccounts[0].bank_name,
                  agency: bankAccounts[0].agency,
                  account: bankAccounts[0].account_number,
                  account_type: bankAccounts[0].account_type === 'checking' ? 'Corrente' : 'Poupança',
                  holder: bankAccounts[0].account_holder
                } : undefined,
                conditions: order.payment_installments && order.payment_installments > 1
                  ? `Forma de Pagamento: ${order.payment_method === 'dinheiro' ? 'Dinheiro' : order.payment_method === 'pix' ? 'PIX' : order.payment_method === 'cartao_credito' ? 'Cartão de Crédito' : order.payment_method === 'cartao_debito' ? 'Cartão de Débito' : order.payment_method === 'transferencia' ? 'Transferência' : 'Diversos'}\nParcelas: ${order.payment_installments}x\nLINK DE PAGAMENTO EM ${order.payment_installments}X SEM JUROS / DEMAIS PARCELAS INCIDÊNCIA DE JUROS DA MÁQUINA\nÀ VISTA 5% DE DESCONTO`
                  : `Forma de Pagamento: ${order.payment_method === 'dinheiro' ? 'Dinheiro' : order.payment_method === 'pix' ? 'PIX' : order.payment_method === 'cartao_credito' ? 'Cartão de Crédito' : order.payment_method === 'cartao_debito' ? 'Cartão de Débito' : order.payment_method === 'transferencia' ? 'Transferência' : 'À Vista'}\nPagamento à vista com 5% de desconto`
              },
              warranty: {
                period: order.warranty_period ? `${order.warranty_period} ${order.warranty_type === 'days' ? 'dias' : 'meses'}` : '90 dias',
                conditions: order.warranty_terms || `Garantias referentes à sistemas de novo em tubulações antigas, só serão válidas, com os processos de descontaminação das tubulações antigas.\n\nGarantia de (EQUIPAMENTOS NOVOS) que podem ser de 5 a 10 anos, só são válidas com manutenção semestral comprovada COM LAUDO TÉCNICO.\n\nGarantias extendidas pela nossa empresa, são concedidas em caso de compra das máquinas conosco, as mesmas deixam de ter validade legal de 3 meses e podem ter até 12 meses de acordo com o tipo e capacidade do sistema, mediante a manutenção dos equipamentos realizadas conosco nos prazos estipulados pelo fabricante...`
              },
              contract_clauses: `1. Obrigações do Cliente
1.1. O cliente deve fornecer todas as informações necessárias para a execução adequada dos serviços contratados, incluindo, mas não se limitando a, especificações técnicas, localização e horários preferenciais para a realização dos serviços, como também a planta do imóvel e projeto arquitetônico.
1.2. O cliente deve garantir o acesso seguro e adequado às instalações onde os serviços serão realizados.
1.3. O cliente deve comunicar prontamente qualquer problema ou defeito observado nos serviços prestados.
1.4. É de responsabilidade do cliente o destelhamento e reinstalação do telhado.

2. Obrigações do Contratante
2.1. O contratante deve realizar os serviços de acordo com as especificações técnicas fornecidas pelo cliente e de acordo com os padrões da indústria.
2.2. O contratante deve cumprir todos os prazos acordados para a execução dos serviços.
2.3. O contratante deve manter o cliente informado sobre o progresso dos serviços e quaisquer problemas ou atrasos que possam surgir.

3. Regras de Rescisão
3.1. Ambas as partes têm o direito de rescindir o contrato a qualquer momento, com um aviso prévio de 30 dias.
3.2. Em caso de violação de qualquer uma das obrigações estabelecidas neste contrato, a parte não infratora tem o direito de rescindir o contrato imediatamente, sem necessidade de aviso prévio.

4. Regras Gerais
4.1. Este contrato não cria qualquer relação de parceria, joint venture, emprego ou agência entre as partes.
4.2. Nenhuma das partes pode ceder ou transferir seus direitos ou obrigações sob este contrato sem o consentimento prévio por escrito da outra parte.
4.3. Este contrato constitui o acordo completo entre as partes e substitui todos os acordos anteriores, escritos ou orais, relacionados ao seu objeto.`,
              additional_info: order.notes || 'Trabalhamos para que seus projetos, se tornem realidade.. Obrigado pela confiança\n\nobrigado pela confiança, estaremos à disposição.'
            }}
          />
        </>
      )}

      {/* Pacote C - Timeline Modal */}
      {showTimelineModal && id && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">Timeline de Status</h2>
              <button onClick={() => setShowTimelineModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
            </div>
            <div className="p-6">
              <OSTimeline serviceOrderId={id} isOpen={showTimelineModal} onClose={() => setShowTimelineModal(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Pacote D - Auditoria Modal */}
      {showAuditModal && id && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">Histórico de Auditoria</h2>
              <button onClick={() => setShowAuditModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
            </div>
            <div className="p-6">
              <OSAuditLog serviceOrderId={id} isOpen={showAuditModal} onClose={() => setShowAuditModal(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Pacote D - Checklist Modal */}
      {showChecklistModal && id && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">Checklist de Execução</h2>
              <button onClick={() => setShowChecklistModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
            </div>
            <div className="p-6">
              <OSChecklist serviceOrderId={id} />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Informações do Serviço */}
      <ServiceInfoEditModal
        isOpen={showServiceInfoModal}
        onClose={() => {
          setShowServiceInfoModal(false)
          setSelectedServiceItem(null)
        }}
        serviceItem={selectedServiceItem}
        onSave={() => {
          loadOrder()
          setShowServiceInfoModal(false)
          setSelectedServiceItem(null)
        }}
      />
    </div>
  )
}

export default ServiceOrderView
