import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Printer, Share2, FileText, MapPin, Mail, Phone, Star, User } from 'lucide-react'
import { generateServiceOrderPDFGiartech } from '../utils/generateServiceOrderPDFGiartech'
import { getCompanyInfo } from '../utils/companyData'
import { useEffect, useState } from 'react'
import { formatDateSafe } from '../utils/format'

interface OSData {
  order_number?: string
  number?: string
  status?: string
  created_at?: string
  scheduled_date?: string
  execution_deadline?: string
  description?: string
  instructions?: string
  report?: string
  priority?: string
  payment_method?: string
  payment_installments?: number
  payment_conditions?: string
  pix_key?: string
  total_value?: number
  labor_value?: number
  materials_value?: number
  discount?: number
  net_value?: number
  customer_name?: string
  customer_phone?: string
  customer_email?: string
  customer_cpf_cnpj?: string
  address?: string
  address_complement?: string
  city?: string
  state?: string
  items?: Array<{
    name?: string
    description?: string
    quantity?: number
    unit_price?: number
    total?: number
    unit?: string
  }>
  materials?: Array<{
    name?: string
    quantity?: number
    unit?: string
    unit_cost?: number
    total_cost?: number
  }>
  team?: Array<{ name?: string; role?: string }>
  checklist_items?: Array<{ description?: string; checked?: boolean }>
  signature_data?: string
  installation_addresses?: Array<{
    label?: string
    logradouro?: string
    numero?: string
    complemento?: string
    bairro?: string
    cidade?: string
    estado?: string
    cep?: string
    referencia?: string
    is_primary?: boolean
  }>
  installation_contacts?: Array<{
    nome?: string
    telefone?: string
    email?: string
    cargo?: string
    is_primary?: boolean
  }>
  [key: string]: any
}

interface Props {
  isOpen: boolean
  onClose: () => void
  data: OSData | null
}

const fmtCurrency = (v: number | undefined | null) => {
  if (v == null) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

const statusColors: Record<string, string> = {
  concluido: 'bg-[#eafff8] text-[#0a6b4a]',
  completed: 'bg-[#eafff8] text-[#0a6b4a]',
  em_andamento: 'bg-[#fff3ee] text-[#cc5a2a]',
  in_progress: 'bg-[#fff3ee] text-[#cc5a2a]',
  cancelado: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-gray-100 text-gray-600',
  pausado: 'bg-amber-50 text-amber-700',
}

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  aberto: 'Aberto',
  em_andamento: 'Em Andamento',
  in_progress: 'Em Andamento',
  concluido: 'Concluído',
  completed: 'Concluído',
  cancelado: 'Cancelado',
  cancelled: 'Cancelado',
  pausado: 'Pausado',
  cotacao: 'Em Cotação',
}

const pmLabel = (method: string | undefined) => {
  const m = { pix: 'PIX', boleto: 'Boleto Bancário', credito: 'Cartão de Crédito', debito: 'Cartão de Débito', dinheiro: 'Dinheiro' } as Record<string, string>
  return m[method || ''] || method || '—'
}

export default function ServiceOrderViewGiartech({ isOpen, onClose, data }: Props) {
  const [companyInfo, setCompanyInfo] = useState<any>(null)

  useEffect(() => {
    getCompanyInfo().then(setCompanyInfo)
  }, [])

  if (!isOpen || !data) return null

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `OS ${data.order_number}`, url: window.location.href })
      } catch { /* ignored */ }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href)
        alert('Link copiado!')
      } catch { /* ignored */ }
    }
  }

  const orderNum = data.order_number || data.number || 'S/N'
  const statusKey = (data.status || '').toLowerCase()
  const statusColor = statusColors[statusKey] || 'bg-gray-100 text-gray-800'
  const statusText = statusLabels[statusKey] || data.status || 'Aberto'

  const items = data.items || []
  const materials = data.materials || []
  const team = data.team || []

  const itemsSubtotal = items.reduce((acc, item) => acc + Number(item.total ?? (Number(item.quantity || 1) * Number(item.unit_price || 0))), 0)
  const discount = Number(data.discount || 0)
  const grandTotal = Number(data.net_value || data.total_value || itemsSubtotal - discount || 0)

  const buildPDFData = () => ({
    order_number: data.order_number || data.number || 'S/N',
    date: data.created_at || new Date().toISOString(),
    title: data.description,
    client: {
      name: data.customer_name || '—',
      cnpj: data.customer_cpf_cnpj,
      address: data.address,
      city: data.city,
      state: data.state,
      email: data.customer_email,
      phone: data.customer_phone,
    },
    items: (data.items || []).map(item => ({
      service_name: item.name,
      descricao: item.description,
      unit: item.unit,
      unit_price: item.unit_price,
      quantity: item.quantity,
      total_price: item.total,
    })),
    subtotal: itemsSubtotal,
    discount,
    total: grandTotal,
    payment: {
      methods: pmLabel(data.payment_method),
      pix: data.pix_key,
      conditions: data.payment_conditions || (data.payment_installments && data.payment_installments > 1 ? `${data.payment_installments}x parcelas` : 'À vista'),
    },
  })

  const handleDownloadPDF = async () => {
    try {
      await generateServiceOrderPDFGiartech(buildPDFData())
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      alert('Erro ao gerar PDF.')
    }
  }

  const handlePrint = async () => {
    try {
      await generateServiceOrderPDFGiartech(buildPDFData())
    } catch (error) {
      console.error('Erro ao imprimir:', error)
      alert('Erro ao gerar PDF.')
    }
  }

  const hasPayment = !!(data.payment_method || data.payment_conditions)

  const WARRANTY_TEXT = 'Os serviços executados possuem garantia de 90 (noventa) dias contra defeitos de mão de obra, conforme o Código de Defesa do Consumidor (CDC — Lei 8.078/90).'

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          <div className="bg-[#191919] px-6 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5 text-[#0062f6]" />
              <h2 className="text-lg font-semibold text-white">Ordem de Serviço</h2>
              <span className="text-[rgba(255,255,255,0.4)] text-sm">#{orderNum}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={handleDownloadPDF} className="px-3 py-1.5 bg-[#0062f6] text-white rounded-lg hover:bg-[#0052d6] flex items-center space-x-1.5 text-xs font-medium transition-colors">
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Baixar PDF</span>
              </button>
              <button onClick={handlePrint} className="px-3 py-1.5 bg-white/10 text-white rounded-lg hover:bg-white/20 flex items-center space-x-1.5 text-xs font-medium transition-colors">
                <Printer className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Imprimir</span>
              </button>
              <button onClick={handleShare} className="px-3 py-1.5 bg-white/10 text-white rounded-lg hover:bg-white/20 flex items-center space-x-1.5 text-xs font-medium transition-colors">
                <Share2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Compartilhar</span>
              </button>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-[#f4f7ff] p-6">
            <div className="max-w-4xl mx-auto bg-white border border-[rgba(0,98,246,0.12)] rounded-xl overflow-hidden">

              {/* Header da OS */}
              <div className="bg-[#191919] px-8 py-6 flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-bold text-white">{companyInfo?.name || 'Giartech Soluções'}</h1>
                  <p className="text-[rgba(255,255,255,0.4)] text-xs mt-1 tracking-widest uppercase">Soluções em Tecnologia</p>
                </div>
                <div className="text-right">
                  <p className="text-[rgba(255,255,255,0.55)] text-xs uppercase tracking-widest">Ordem de Serviço</p>
                  <p className="text-white text-2xl font-bold mt-0.5">Nº {orderNum}</p>
                  <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor}`}>
                    {statusText}
                  </span>
                </div>
              </div>
              <div className="h-0.5 bg-[#0062f6]" />

              {/* Informações gerais */}
              <div className="px-8 py-5 border-b border-[rgba(0,98,246,0.08)] grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-[9px] text-[#0062f6] uppercase font-semibold tracking-widest mb-1">Data de Abertura</p>
                  <p className="text-[#191919] font-medium">{data.created_at ? formatDateSafe(data.created_at) : '—'}</p>
                </div>
                {data.scheduled_date && (
                  <div>
                    <p className="text-[9px] text-[#0062f6] uppercase font-semibold tracking-widest mb-1">Data Agendada</p>
                    <p className="text-[#191919] font-medium">{formatDateSafe(data.scheduled_date)}</p>
                  </div>
                )}
                {data.priority && (
                  <div>
                    <p className="text-[9px] text-[#0062f6] uppercase font-semibold tracking-widest mb-1">Prioridade</p>
                    <p className="text-[#191919] font-medium">{data.priority}</p>
                  </div>
                )}
              </div>

              {data.description && (
                <div className="px-8 py-4 border-b border-[rgba(0,98,246,0.08)] bg-[#f4f7ff]">
                  <p className="text-[9px] text-[#0062f6] uppercase font-semibold tracking-widest mb-1">Descrição / Problema</p>
                  <p className="text-[#4a5568] text-sm">{data.description}</p>
                </div>
              )}

              {/* Cliente */}
              <div className="px-8 py-5 border-b border-[rgba(0,98,246,0.08)]">
                <h3 className="text-[9px] font-semibold text-[#0062f6] uppercase tracking-widest mb-3">Dados do Cliente</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-[#8a95a8] mb-0.5">Nome / Razão Social</p>
                    <p className="text-[#191919] font-semibold">{data.customer_name || '—'}</p>
                  </div>
                  {data.customer_cpf_cnpj && (
                    <div>
                      <p className="text-xs text-[#8a95a8] mb-0.5">CPF / CNPJ</p>
                      <p className="text-[#4a5568]">{data.customer_cpf_cnpj}</p>
                    </div>
                  )}
                  {data.customer_phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-[#8a95a8]" />
                      <p className="text-[#4a5568]">{data.customer_phone}</p>
                    </div>
                  )}
                  {data.customer_email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3 text-[#8a95a8]" />
                      <p className="text-[#4a5568]">{data.customer_email}</p>
                    </div>
                  )}
                  {data.address && (
                    <div className="col-span-2 flex items-start gap-1">
                      <MapPin className="h-3 w-3 text-[#8a95a8] mt-0.5 flex-shrink-0" />
                      <p className="text-[#4a5568]">{[data.address, data.address_complement, data.city, data.state].filter(Boolean).join(', ')}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Endereços de instalação */}
              {((data.installation_addresses && data.installation_addresses.length > 0) ||
                (data.installation_contacts && data.installation_contacts.length > 0)) && (
                <div className="px-8 py-5 border-b border-[rgba(0,98,246,0.08)]">
                  <h3 className="text-[9px] font-semibold text-[#0062f6] uppercase tracking-widest mb-3">Local de Instalação / Execução</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.installation_addresses?.map((addr, i) => (
                      <div key={i} className="p-3 bg-[#eef3ff] rounded-lg border border-[rgba(0,98,246,0.12)] text-sm">
                        <div className="flex items-center gap-1 mb-1">
                          {addr.is_primary && <Star className="h-3 w-3 text-[#ff8149] fill-[#ff8149]" />}
                          {addr.label && <span className="font-semibold text-[#0062f6] text-xs uppercase">{addr.label}</span>}
                        </div>
                        <p className="text-[#191919]">{[addr.logradouro, addr.numero, addr.complemento].filter(Boolean).join(', ')}{addr.bairro ? ` — ${addr.bairro}` : ''}</p>
                        {(addr.cidade || addr.estado) && <p className="text-[#4a5568]">{[addr.cidade, addr.estado].filter(Boolean).join(' / ')}{addr.cep ? ` — CEP ${addr.cep}` : ''}</p>}
                        {addr.referencia && <p className="text-xs text-[#8a95a8] mt-0.5">Ref: {addr.referencia}</p>}
                      </div>
                    ))}
                    {data.installation_contacts?.map((c, i) => (
                      <div key={i} className="p-3 bg-[#eafff8] rounded-lg border border-[rgba(0,196,154,0.2)] text-sm space-y-0.5">
                        <div className="flex items-center gap-1">
                          {c.is_primary && <Star className="h-3 w-3 text-[#ff8149] fill-[#ff8149]" />}
                          <User className="h-3 w-3 text-[#0a6b4a]" />
                          <span className="font-medium text-[#191919]">{c.nome}</span>
                          {c.cargo && <span className="text-xs text-[#8a95a8]">— {c.cargo}</span>}
                        </div>
                        {c.telefone && <p className="text-[#4a5568] flex items-center gap-1"><Phone className="h-3 w-3" />{c.telefone}</p>}
                        {c.email && <p className="text-[#4a5568] flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Itens / Serviços */}
              {items.length > 0 && (
                <div className="px-8 py-5 border-b border-[rgba(0,98,246,0.08)]">
                  <h3 className="text-[9px] font-semibold text-[#0062f6] uppercase tracking-widest mb-3">Serviços / Itens da Ordem</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-[#191919] text-white">
                          <th className="text-left px-3 py-2 font-semibold w-8">#</th>
                          <th className="text-left px-3 py-2 font-semibold">Descrição</th>
                          <th className="text-center px-3 py-2 font-semibold w-16">Qtd</th>
                          <th className="text-right px-3 py-2 font-semibold w-28">Vl. Unit.</th>
                          <th className="text-right px-3 py-2 font-semibold w-28">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, idx) => {
                          const qty = Number(item.quantity || 1)
                          const price = Number(item.unit_price || 0)
                          const sub = Number(item.total ?? qty * price)
                          return (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f4f7ff]'}>
                              <td className="px-3 py-2.5 text-[#8a95a8] font-medium text-center">{String(idx + 1).padStart(2, '0')}</td>
                              <td className="px-3 py-2.5">
                                <p className="font-semibold text-[#191919]">{item.name || '—'}</p>
                                {item.description && <p className="text-xs text-[#8a95a8] mt-0.5">{item.description}</p>}
                              </td>
                              <td className="px-3 py-2.5 text-center text-[#4a5568]">{qty}</td>
                              <td className="px-3 py-2.5 text-right text-[#4a5568]">{fmtCurrency(price)}</td>
                              <td className="px-3 py-2.5 text-right font-semibold text-[#191919]">{fmtCurrency(sub)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Materiais */}
              {materials.length > 0 && (
                <div className="px-8 py-5 border-b border-[rgba(0,98,246,0.08)]">
                  <h3 className="text-[9px] font-semibold text-[#0062f6] uppercase tracking-widest mb-3">Materiais Utilizados</h3>
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-[#eef3ff] text-[#0062f6]">
                        <th className="text-left px-3 py-2">Material</th>
                        <th className="text-center px-3 py-2 w-16">Qtd</th>
                        <th className="text-center px-3 py-2 w-16">Un.</th>
                        <th className="text-right px-3 py-2 w-28">Custo Unit.</th>
                        <th className="text-right px-3 py-2 w-28">Custo Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {materials.map((m, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f4f7ff]'}>
                          <td className="px-3 py-2.5 text-[#191919]">{m.name || '—'}</td>
                          <td className="px-3 py-2.5 text-center text-[#4a5568]">{m.quantity || 0}</td>
                          <td className="px-3 py-2.5 text-center text-[#4a5568]">{m.unit || 'un'}</td>
                          <td className="px-3 py-2.5 text-right text-[#4a5568]">{fmtCurrency(m.unit_cost)}</td>
                          <td className="px-3 py-2.5 text-right font-semibold text-[#191919]">{fmtCurrency(m.total_cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Equipe */}
              {team.length > 0 && (
                <div className="px-8 py-5 border-b border-[rgba(0,98,246,0.08)]">
                  <h3 className="text-[9px] font-semibold text-[#0062f6] uppercase tracking-widest mb-3">Equipe Responsável</h3>
                  <div className="flex flex-wrap gap-3">
                    {team.map((t, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-[#eef3ff] px-3 py-2 rounded-lg text-sm border border-[rgba(0,98,246,0.15)]">
                        <User className="h-4 w-4 text-[#0062f6]" />
                        <span className="font-medium text-[#191919]">{t.name || '—'}</span>
                        {t.role && <span className="text-[#8a95a8]">· {t.role}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resumo Financeiro */}
              <div className="px-8 py-5 border-b border-[rgba(0,98,246,0.08)]">
                <h3 className="text-[9px] font-semibold text-[#0062f6] uppercase tracking-widest mb-3">Resumo Financeiro</h3>
                <div className="flex justify-end">
                  <div className="w-64 space-y-1 text-sm">
                    {itemsSubtotal > 0 && (
                      <div className="flex justify-between text-[#4a5568]">
                        <span>Subtotal dos Itens</span>
                        <span>{fmtCurrency(itemsSubtotal)}</span>
                      </div>
                    )}
                    {data.labor_value != null && data.labor_value > 0 && (
                      <div className="flex justify-between text-[#4a5568]">
                        <span>Mão de Obra</span>
                        <span>{fmtCurrency(data.labor_value)}</span>
                      </div>
                    )}
                    {data.materials_value != null && data.materials_value > 0 && (
                      <div className="flex justify-between text-[#4a5568]">
                        <span>Materiais</span>
                        <span>{fmtCurrency(data.materials_value)}</span>
                      </div>
                    )}
                    {discount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Desconto</span>
                        <span>- {fmtCurrency(discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between bg-[#0062f6] text-white px-3 py-2 rounded-lg font-bold text-base mt-2">
                      <span>TOTAL</span>
                      <span>{fmtCurrency(grandTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pagamento */}
              {hasPayment && (
                <div className="px-8 py-5 border-b border-[rgba(0,98,246,0.08)] bg-[#f4f7ff]">
                  <h3 className="text-[9px] font-semibold text-[#0062f6] uppercase tracking-widest mb-3">Condições de Pagamento</h3>
                  <div className="flex flex-wrap gap-4 text-sm">
                    {data.payment_method && (
                      <div className="bg-white border border-[rgba(0,98,246,0.15)] rounded-lg px-4 py-3">
                        <p className="text-[9px] text-[#8a95a8] uppercase font-semibold tracking-widest mb-1">Forma de Pagamento</p>
                        <p className="font-bold text-[#191919]">{pmLabel(data.payment_method)}</p>
                      </div>
                    )}
                    {data.payment_installments && data.payment_installments > 1 && (
                      <div className="bg-white border border-[rgba(0,98,246,0.15)] rounded-lg px-4 py-3">
                        <p className="text-[9px] text-[#8a95a8] uppercase font-semibold tracking-widest mb-1">Parcelas</p>
                        <p className="font-bold text-[#191919]">{data.payment_installments}x</p>
                      </div>
                    )}
                    {data.payment_conditions && (
                      <div className="bg-white border border-[rgba(0,98,246,0.15)] rounded-lg px-4 py-3">
                        <p className="text-[9px] text-[#8a95a8] uppercase font-semibold tracking-widest mb-1">Condição</p>
                        <p className="font-bold text-[#191919]">{data.payment_conditions}</p>
                      </div>
                    )}
                    {data.pix_key && data.payment_method === 'pix' && (
                      <div className="bg-white border border-[rgba(0,98,246,0.15)] rounded-lg px-4 py-3">
                        <p className="text-[9px] text-[#8a95a8] uppercase font-semibold tracking-widest mb-1">Chave PIX</p>
                        <p className="font-mono text-[#191919]">{data.pix_key}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Instruções / Relatório */}
              {(data.instructions || data.report) && (
                <div className="px-8 py-5 border-b border-[rgba(0,98,246,0.08)]">
                  {data.instructions && (
                    <div className="mb-4">
                      <h3 className="text-[9px] font-semibold text-[#0062f6] uppercase tracking-widest mb-2">Instruções</h3>
                      <p className="text-[#4a5568] text-sm whitespace-pre-line bg-[#f4f7ff] p-3 rounded-lg border border-[rgba(0,98,246,0.08)]">{data.instructions}</p>
                    </div>
                  )}
                  {data.report && (
                    <div>
                      <h3 className="text-[9px] font-semibold text-[#0062f6] uppercase tracking-widest mb-2">Relatório de Execução</h3>
                      <p className="text-[#4a5568] text-sm whitespace-pre-line bg-[#f4f7ff] p-3 rounded-lg border border-[rgba(0,98,246,0.08)]">{data.report}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Garantia */}
              <div className="px-8 py-5 border-b border-[rgba(0,98,246,0.08)] bg-[#fff3ee]">
                <h3 className="text-[9px] font-semibold text-[#ff8149] uppercase tracking-widest mb-2">Garantia Técnica</h3>
                <p className="text-[#4a5568] text-sm">{WARRANTY_TEXT}</p>
              </div>

              {/* Assinaturas */}
              <div className="px-8 py-8">
                <h3 className="text-[9px] font-semibold text-[#0062f6] uppercase tracking-widest mb-6 text-center">Assinatura e Confirmação</h3>
                <div className="grid grid-cols-2 gap-12">
                  <div className="text-center">
                    <div className="border-t-2 border-[rgba(0,98,246,0.2)] pt-3 mt-16">
                      <p className="font-bold text-[#191919]">{companyInfo?.name || 'Giartech Soluções'}</p>
                      <p className="text-sm text-[#8a95a8]">{team[0]?.name || 'Técnico Responsável'}</p>
                    </div>
                  </div>
                  <div className="text-center">
                    {data.signature_data && (
                      <img src={data.signature_data} alt="Assinatura do cliente" className="max-h-16 mx-auto mb-2" />
                    )}
                    <div className="border-t-2 border-[rgba(0,98,246,0.2)] pt-3 mt-16">
                      <p className="font-bold text-[#191919]">{data.customer_name || 'Cliente'}</p>
                      <p className="text-sm text-[#8a95a8]">Assinatura do Cliente</p>
                    </div>
                  </div>
                </div>
                <p className="text-center text-xs text-[#8a95a8] mt-6">Data: _____ / _____ / _______  &nbsp;&nbsp;&nbsp;  Horário: _____ : _____</p>
              </div>

              {/* Rodapé */}
              <div className="bg-[#191919] px-8 py-4 text-center">
                <div className="flex items-center justify-center gap-6 text-xs text-[rgba(255,255,255,0.4)] mb-1">
                  {companyInfo?.email && <span>{companyInfo.email}</span>}
                  {companyInfo?.phone && <span>{companyInfo.phone}</span>}
                  {companyInfo?.website && <span>{companyInfo.website}</span>}
                </div>
                <p className="text-xs text-[rgba(255,255,255,0.25)]">Documento gerado em {new Date().toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
