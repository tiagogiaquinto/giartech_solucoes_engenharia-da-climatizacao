import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, FileText, Package, Users, DollarSign, Clock, CheckCircle, AlertCircle, FileEdit as Edit, Trash2, Download, Eye, MessageCircle, Share2, MapPin, Phone, Mail, Star, User } from 'lucide-react'
import { supabase, getServiceOrderById, deleteServiceOrder } from '../lib/supabase'
import { formatDateSafe } from '../utils/format'
import { OSFiscalHealth } from '../components/OSFiscalHealth'
import { OSPaymentFlow } from '../components/OSPaymentFlow'
import { OSChatPanel } from '../components/OSChatPanel'
import { OSFinancialWaterfall } from '../components/OSFinancialWaterfall'
import { generateVisitReportPDF } from '../utils/generateVisitReportPDF'
import { OSTrackQRCodePanel } from '../components/OSTrackQRCode'

const ServiceOrderDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<any>(null)
  const [customer, setCustomer] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [team, setTeam] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [osAddresses, setOsAddresses] = useState<any[]>([])
  const [osContacts, setOsContacts] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadOrderData()
    }
  }, [id])

  const loadOrderData = async () => {
    try {
      setLoading(true)
      setError(null)

      const orderData = await getServiceOrderById(id!)

      if (!orderData) {
        setError('Ordem de serviço não encontrada')
        setLoading(false)
        return
      }

      setOrder(orderData)

      const [customerRes, itemsRes, materialsRes, teamRes, documentsRes] = await Promise.all([
        supabase
          .from('customers')
          .select('*, customer_addresses(*)')
          .eq('id', orderData.client_id)
          .single(),

        supabase
          .from('service_order_items')
          .select('*, service_catalog:service_catalog_id(*)')
          .eq('service_order_id', id)
          .order('created_at', { ascending: true }),

        supabase
          .from('service_order_materials')
          .select('*, inventory_items(*)')
          .eq('service_order_id', id)
          .order('created_at', { ascending: true }),

        supabase
          .from('service_order_labor')
          .select('*, employees(*)')
          .eq('service_order_id', id)
          .order('created_at', { ascending: true }),

        supabase
          .from('service_order_documents')
          .select('*')
          .eq('service_order_id', id)
          .order('created_at', { ascending: false })
      ])

      setCustomer(customerRes.data)
      setItems(itemsRes.data || [])
      setMaterials(materialsRes.data || [])
      setTeam(teamRes.data || [])
      setDocuments(documentsRes.data || [])

      const [{ data: addrs }, { data: conts }] = await Promise.all([
        supabase.from('service_order_addresses').select('*').eq('service_order_id', id!).order('is_primary', { ascending: false }),
        supabase.from('service_order_contacts').select('*').eq('service_order_id', id!).order('is_primary', { ascending: false }),
      ])
      setOsAddresses(addrs || [])
      setOsContacts(conts || [])

    } catch (err) {
      console.error('Error loading order:', err)
      setError('Erro ao carregar ordem de serviço')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir esta ordem de serviço?')) {
      return
    }

    try {
      await deleteServiceOrder(id!)
      navigate('/service-orders')
    } catch (err) {
      console.error('Error deleting order:', err)
      alert('Erro ao excluir ordem de serviço')
    }
  }

  const handleDownloadReport = async () => {
    if (!order) return
    if (order.report_pdf_url) {
      window.open(order.report_pdf_url, '_blank')
      return
    }
    const completionData = await supabase
      .from('os_completion_data')
      .select('technician_signature, client_signature, client_name')
      .eq('os_id', id)
      .maybeSingle()

    const checklistData = await supabase
      .from('os_checklist_items')
      .select('description, is_completed, technical_note')
      .eq('os_id', id)

    const materialsData = await supabase
      .from('service_order_materials')
      .select('quantity, inventory_items(name, unit)')
      .eq('service_order_id', id)

    await generateVisitReportPDF({
      order_number: order.order_number,
      customer_name: customer?.nome_razao || customer?.name || order.client_name || 'Cliente',
      customer_address: order.client_address,
      customer_city: order.client_city,
      customer_phone: customer?.telefone || customer?.phone,
      technician_name: team[0]?.employees?.nome || 'Técnico',
      completed_at: order.completed_at || order.created_at,
      description: order.description,
      report: order.report,
      checklist_items: checklistData.data || [],
      materials_used: (materialsData.data || []).map((m: any) => ({
        name: m.inventory_items?.name || 'Material',
        quantity: m.quantity,
        unit: m.inventory_items?.unit
      })),
      tech_signature: completionData.data?.technician_signature,
      client_signature: completionData.data?.client_signature,
      client_signer_name: completionData.data?.client_name,
      total_value: order.total_value || order.net_value || order.final_price,
    })
  }

  const handleShareWhatsApp = () => {
    if (!order) return
    const phone = (customer?.whatsapp || customer?.telefone || customer?.phone || '').replace(/\D/g, '')
    const reportUrl = order.report_pdf_url || ''
    const orderNum = order.order_number
    const customerName = customer?.nome_razao || customer?.name || order.client_name || 'Cliente'

    let message = `Olá ${customerName}! 👋\n\n`
    message += `O serviço da OS #${orderNum} foi concluído com sucesso pela equipe Giartech. ✅\n\n`

    if (reportUrl) {
      message += `📄 Acesse o Relatório de Visita Técnica:\n${reportUrl}\n\n`
    }

    message += `Qualquer dúvida, estamos à disposição!\n_Equipe Giartech Soluções_`

    const encodedMsg = encodeURIComponent(message)
    const waUrl = phone
      ? `https://api.whatsapp.com/send?phone=55${phone}&text=${encodedMsg}`
      : `https://api.whatsapp.com/send?text=${encodedMsg}`

    window.open(waUrl, '_blank')
  }

  const handleMarkCompleted = async () => {
    if (!order || !window.confirm('Confirmar conclusão desta OS e gerar lançamento financeiro?')) return
    const completedAt = new Date().toISOString()
    await supabase
      .from('service_orders')
      .update({ status: 'completed', completed_at: completedAt })
      .eq('id', id!)

    const orderValue = Number(order.total_value || order.net_value || order.final_price || 0)
    if (orderValue > 0) {
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 5)
      await supabase.from('finance_entries').insert({
        descricao: `OS #${order.order_number} — ${customer?.nome_razao || customer?.name || order.client_name || 'Cliente'}`,
        valor: orderValue,
        tipo: 'receita',
        status: 'a_receber',
        data: completedAt.split('T')[0],
        data_vencimento: dueDate.toISOString().split('T')[0],
        customer_id: order.client_id || null,
        recorrente: false,
        is_recurring: false,
      })
    }

    const dueTaskDate = new Date()
    dueTaskDate.setDate(dueTaskDate.getDate() + 1)
    supabase.from('tasks').insert({
      title: `Faturar OS #${order.order_number} — ${customer?.nome_razao || customer?.name || order.client_name || 'Cliente'}`,
      description: `Serviço concluído. Verificar nota fiscal${orderValue > 0 ? ` e confirmar recebimento de R$ ${orderValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}.`,
      status: 'todo',
      priority: 'high',
      due_date: dueTaskDate.toISOString().split('T')[0],
    }).then(() => {})

    await loadOrderData()
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      paused: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      quotation: 'bg-purple-100 text-purple-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      in_progress: 'Em Andamento',
      paused: 'Pausado',
      completed: 'Concluído',
      cancelled: 'Cancelado',
      quotation: 'Orçamento'
    }
    return labels[status] || status
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando ordem de serviço...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro</h2>
          <p className="text-gray-600 mb-4">{error || 'Ordem de serviço não encontrada'}</p>
          <button
            onClick={() => navigate('/service-orders')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Voltar para Ordens de Serviço
          </button>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: FileText },
    { id: 'items', label: 'Serviços', icon: Package, badge: items.length },
    { id: 'materials', label: 'Materiais', icon: Package, badge: materials.length },
    { id: 'team', label: 'Equipe', icon: Users, badge: team.length },
    { id: 'financial', label: 'Financeiro', icon: DollarSign },
    { id: 'documents', label: 'Documentos', icon: FileText, badge: documents.length },
    { id: 'timeline', label: 'Histórico', icon: Clock }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/service-orders')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Voltar
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadReport}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-900 transition-colors"
                title="Baixar Relatório de Visita Técnica (PDF)"
              >
                <FileText className="h-4 w-4" />
                Laudo PDF
              </button>

              {(order?.status === 'completed' || order?.status === 'concluido') && (
                <button
                  onClick={handleShareWhatsApp}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  title="Compartilhar laudo via WhatsApp"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                  {order?.report_pdf_url && (
                    <span className="ml-1 w-2 h-2 rounded-full bg-green-300 inline-block" title="PDF disponível" />
                  )}
                </button>
              )}

              {(order?.status === 'in_progress' || order?.status === 'pending') && (
                <button
                  onClick={handleMarkCompleted}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  <CheckCircle className="h-4 w-4" />
                  Concluir OS
                </button>
              )}

              <button
                onClick={() => navigate(`/service-orders/${id}/edit`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Edit className="h-4 w-4" />
                Editar
              </button>

              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </button>
            </div>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                OS #{order.order_number}
              </h1>
              <p className="text-gray-600">
                {customer?.name || 'Cliente não identificado'}
              </p>
            </div>

            <div className="text-right">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {getStatusLabel(order.status)}
              </span>
              <p className="text-sm text-gray-600 mt-2">
                Criado em {formatDateSafe(order.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap
                    ${activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }
                  `}
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.label}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <OverviewTab order={order} customer={customer} osAddresses={osAddresses} osContacts={osContacts} />
            )}

            {activeTab === 'items' && (
              <ItemsTab items={items} orderId={id!} onUpdate={loadOrderData} />
            )}

            {activeTab === 'materials' && (
              <MaterialsTab materials={materials} orderId={id!} onUpdate={loadOrderData} />
            )}

            {activeTab === 'team' && (
              <TeamTab team={team} orderId={id!} onUpdate={loadOrderData} />
            )}

            {activeTab === 'financial' && (
              <FinancialTab order={order} items={items} materials={materials} team={team} onUpdate={loadOrderData} />
            )}

            {activeTab === 'documents' && (
              <DocumentsTab documents={documents} orderId={id!} onUpdate={loadOrderData} />
            )}

            {activeTab === 'timeline' && (
              <TimelineTab orderId={id!} />
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

const OverviewTab = ({ order, customer, osAddresses, osContacts }: any) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Informações do Cliente</h3>
        <div className="space-y-2">
          <p><span className="font-medium">Nome:</span> {customer?.nome_razao || customer?.name}</p>
          <p><span className="font-medium">Email:</span> {customer?.email}</p>
          <p><span className="font-medium">Telefone:</span> {customer?.telefone || customer?.phone}</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Detalhes da OS</h3>
        <div className="space-y-2">
          <p><span className="font-medium">Número:</span> {order.order_number}</p>
          <p><span className="font-medium">Data:</span> {formatDateSafe(order.created_at)}</p>
          <p><span className="font-medium">Prazo:</span> {order.execution_deadline ? formatDateSafe(order.execution_deadline) : 'Não definido'}</p>
        </div>
      </div>
    </div>

    {(osAddresses?.length > 0 || osContacts?.length > 0) && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {osAddresses?.length > 0 && (
          <div>
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-500" />
              Endereços de Instalação
            </h3>
            <div className="space-y-2">
              {osAddresses.map((addr: any, i: number) => (
                <div key={addr.id || i} className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm">
                  <div className="flex items-center gap-1 mb-1">
                    {addr.is_primary && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                    {addr.label && <span className="font-semibold text-blue-700 text-xs uppercase">{addr.label}</span>}
                  </div>
                  <p className="text-gray-800">{[addr.logradouro, addr.numero, addr.complemento].filter(Boolean).join(', ')}{addr.bairro && ` — ${addr.bairro}`}</p>
                  {(addr.cidade || addr.estado) && <p className="text-gray-600">{[addr.cidade, addr.estado].filter(Boolean).join(' / ')}{addr.cep && ` — CEP ${addr.cep}`}</p>}
                  {addr.referencia && <p className="text-xs text-gray-500 mt-0.5">Ref: {addr.referencia}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {osContacts?.length > 0 && (
          <div>
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-green-500" />
              Contatos no Local
            </h3>
            <div className="space-y-2">
              {osContacts.map((c: any, i: number) => (
                <div key={c.id || i} className="p-3 bg-green-50 rounded-lg border border-green-100 text-sm space-y-0.5">
                  <div className="flex items-center gap-1">
                    {c.is_primary && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                    <span className="font-medium text-gray-800">{c.nome}</span>
                    {c.cargo && <span className="text-xs text-gray-500">— {c.cargo}</span>}
                  </div>
                  {c.telefone && <p className="text-gray-600 flex items-center gap-1"><Phone className="h-3 w-3" />{c.telefone}</p>}
                  {c.email && <p className="text-gray-600 flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )}

    {order.description && (
      <div>
        <h3 className="text-lg font-semibold mb-2">Descrição</h3>
        <p className="text-gray-700 whitespace-pre-wrap">{order.description}</p>
      </div>
    )}

    {order.notes && (
      <div>
        <h3 className="text-lg font-semibold mb-2">Observações</h3>
        <p className="text-gray-700 whitespace-pre-wrap">{order.notes}</p>
      </div>
    )}

    {order.track_token && (
      <OSTrackQRCodePanel trackToken={order.track_token} orderNumber={order.order_number} />
    )}
  </div>
)

const ItemsTab = ({ items, orderId, onUpdate }: any) => (
  <div>
    <h3 className="text-lg font-semibold mb-4">Serviços da Ordem</h3>
    {items.length === 0 ? (
      <p className="text-gray-500">Nenhum serviço adicionado</p>
    ) : (
      <div className="space-y-4">
        {items.map((item: any) => (
          <div key={item.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold">{item.service_catalog?.name || item.service_name}</h4>
                {item.description && <p className="text-sm text-gray-600 mt-1">{item.description}</p>}
              </div>
              <div className="text-right">
                <p className="font-semibold">R$ {parseFloat(item.unit_price || 0).toFixed(2)}</p>
                <p className="text-sm text-gray-600">Qtd: {item.quantity || 1}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)

const MaterialsTab = ({ materials, orderId, onUpdate }: any) => (
  <div>
    <h3 className="text-lg font-semibold mb-4">Materiais Utilizados</h3>
    {materials.length === 0 ? (
      <p className="text-gray-500">Nenhum material adicionado</p>
    ) : (
      <div className="space-y-4">
        {materials.map((material: any) => (
          <div key={material.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold">{material.inventory_items?.name || material.material_name}</h4>
                <p className="text-sm text-gray-600">SKU: {material.inventory_items?.sku}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">R$ {parseFloat(material.unit_cost || 0).toFixed(2)}</p>
                <p className="text-sm text-gray-600">Qtd: {material.quantity}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)

const TeamTab = ({ team, orderId, onUpdate }: any) => (
  <div>
    <h3 className="text-lg font-semibold mb-4">Equipe Alocada</h3>
    {team.length === 0 ? (
      <p className="text-gray-500">Nenhum funcionário alocado</p>
    ) : (
      <div className="space-y-4">
        {team.map((member: any) => (
          <div key={member.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold">{member.employees?.name}</h4>
                <p className="text-sm text-gray-600">{member.employees?.role}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">{member.hours_worked || 0}h trabalhadas</p>
                <p className="font-semibold">R$ {parseFloat(member.labor_cost || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)

const FinancialTab = ({ order, items, materials, team, onUpdate }: any) => {
  const grossValue = items.reduce((sum: number, item: any) =>
    sum + (parseFloat(item.unit_price || 0) * parseFloat(item.quantity || 1)), 0
  )
  const materialsTotal = materials.reduce((sum: number, mat: any) =>
    sum + (parseFloat(mat.unit_cost || 0) * parseFloat(mat.quantity || 1)), 0
  )
  const laborTotal = team.reduce((sum: number, member: any) =>
    sum + parseFloat(member.labor_cost || member.custo_total || 0), 0
  )
  const total = parseFloat(order.total_value || grossValue || 0)

  return (
    <div className="space-y-5">
      {/* Full financial waterfall */}
      <OSFinancialWaterfall
        orderId={order.id}
        grossValue={grossValue || total}
        materialsTotal={materialsTotal}
        laborTotal={laborTotal}
        regime={order.regime_tributario || undefined}
        showConfig={true}
      />

      {/* Payment Flow Stepper */}
      <OSPaymentFlow
        orderId={order.id}
        orderNumber={order.order_number || ''}
        totalValue={total}
        sinalPago={parseFloat(order.sinal_pago || 0)}
        paymentStatus={order.payment_status || 'pendente'}
        nfStatus={order.nf_status || 'nao_emitida'}
        reciboEmitido={order.recibo_emitido || false}
        onUpdate={onUpdate}
      />

      <OSChatPanel
        serviceOrderId={order.id}
        serviceOrderTitle={order.title || order.order_number || ''}
      />
    </div>
  )
}

const DocumentsTab = ({ documents, orderId, onUpdate }: any) => (
  <div>
    <h3 className="text-lg font-semibold mb-4">Documentos</h3>
    {documents.length === 0 ? (
      <p className="text-gray-500">Nenhum documento anexado</p>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documents.map((doc: any) => (
          <div key={doc.id} className="border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="flex-1">
                <h4 className="font-semibold">{doc.document_name}</h4>
                <p className="text-sm text-gray-600">{doc.document_type}</p>
                <p className="text-xs text-gray-500">{formatDateSafe(doc.created_at)}</p>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Download className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)

const TimelineTab = ({ orderId }: any) => (
  <div>
    <h3 className="text-lg font-semibold mb-4">Histórico de Alterações</h3>
    <div className="space-y-4">
      <p className="text-gray-500">Funcionalidade de histórico em desenvolvimento</p>
    </div>
  </div>
)

export default ServiceOrderDetails
