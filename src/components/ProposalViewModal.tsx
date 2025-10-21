import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Send, Mail, Phone, MapPin, Calendar, FileText, DollarSign, Shield, Building2, Globe, Instagram, Facebook, Printer, Share2 } from 'lucide-react'
import { generateBudgetPDF } from '../utils/generateBudgetPDF'

interface ProposalItem {
  description: string
  scope?: string
  unit: string
  unit_price: number
  quantity: number
  total_price: number
}

interface ProposalData {
  order_number: string
  date: string
  title?: string
  client: {
    name: string
    company_name?: string
    cnpj?: string
    address?: string
    city?: string
    state?: string
    cep?: string
    email?: string
    phone?: string
  }
  company: {
    name: string
    owner: string
    cnpj: string
    address: string
    city: string
    state: string
    cep?: string
    email: string
    phones: string[]
    social?: {
      instagram?: string
      facebook?: string
      website?: string
    }
    tagline?: string
  }
  basic_info: {
    deadline: string
    brand?: string
    model?: string
    equipment?: string
  }
  items: ProposalItem[]
  subtotal: number
  discount: number
  total: number
  discount_amount?: number
  final_total?: number
  show_value?: boolean
  relatorio_tecnico?: string
  orientacoes_servico?: string
  escopo_detalhado?: string
  payment: {
    methods: string
    pix?: string
    bank_details?: {
      bank: string
      agency: string
      account: string
      account_type: string
      holder: string
    }
    bank?: {
      name: string
      agency: string
      account: string
      type: string
      holder: string
    }
    conditions: string
  }
  warranty: {
    period?: string
    conditions: string | string[]
  }
  contract_clauses: string | {
    title: string
    items: string[]
  }[]
  additional_notes?: string
  additional_info?: string
  signatures?: {
    company_representative: string
    company_role: string
    client_name: string
    client_document: string
  }
}

interface ProposalViewModalProps {
  isOpen: boolean
  onClose: () => void
  data: ProposalData
}

export default function ProposalViewModal({ isOpen, onClose, data }: ProposalViewModalProps) {
  if (!isOpen) return null

  const handleDownloadPDF = async () => {
    try {
      const budgetData = {
        order_number: data.order_number,
        date: data.date,
        title: data.title,
        client: data.client,
        basic_info: data.basic_info,
        items: data.items,
        subtotal: data.subtotal,
        discount: data.discount_amount || data.discount,
        discount_percentage: data.discount > 0 && data.subtotal > 0
          ? Math.round((data.discount / data.subtotal) * 100)
          : undefined,
        total: data.final_total || data.total,
        show_value: data.show_value,
        technical_report: data.relatorio_tecnico,
        service_instructions: data.orientacoes_servico,
        detailed_scope: data.escopo_detalhado,
        payment: data.payment,
        warranty: data.warranty,
        additional_info: data.additional_notes || data.additional_info,
        special_conditions: data.additional_info
      }

      await generateBudgetPDF(budgetData)
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      alert('Erro ao gerar PDF. Por favor, verifique os dados e tente novamente.')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Orçamento ${data.order_number}`,
          text: `Orçamento para ${data.client.name}`,
          url: window.location.href
        })
      } catch (error) {
        console.log('Compartilhamento cancelado')
      }
    } else {
      alert('Compartilhamento não suportado neste navegador')
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header com ações */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6 text-white" />
              <h2 className="text-xl font-bold text-white">Visualizar Orçamento</h2>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownloadPDF}
                className="px-4 py-2 bg-white text-teal-700 rounded-lg hover:bg-gray-100 flex items-center space-x-2 transition-colors"
                title="Baixar PDF"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Baixar PDF</span>
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-white text-teal-700 rounded-lg hover:bg-gray-100 flex items-center space-x-2 transition-colors"
                title="Imprimir"
              >
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">Imprimir</span>
              </button>
              <button
                onClick={handleShare}
                className="px-4 py-2 bg-white text-teal-700 rounded-lg hover:bg-gray-100 flex items-center space-x-2 transition-colors"
                title="Compartilhar"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Compartilhar</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-teal-800 rounded-lg transition-colors"
                title="Fechar"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          {/* Conteúdo scrollável */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <div className="max-w-4xl mx-auto bg-white shadow-lg my-8">

              {/* Header da proposta - Estilo PDF */}
              <div className="bg-gradient-to-r from-teal-700 to-teal-800 px-8 py-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-white p-3 rounded-lg">
                      <Building2 className="h-12 w-12 text-teal-700" />
                    </div>
                    <div className="text-white">
                      <h1 className="text-2xl font-bold">{data.company.name}</h1>
                      <p className="text-teal-100 text-sm mt-1">{data.company.owner}</p>
                      <p className="text-teal-100 text-sm">CNPJ: {data.company.cnpj}</p>
                      <p className="text-teal-100 text-sm">{data.company.address}</p>
                      <p className="text-teal-100 text-sm">{data.company.city}-{data.company.state}</p>
                    </div>
                  </div>
                  <div className="text-right text-white">
                    <div className="flex items-center justify-end space-x-2 mb-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">{formatDate(data.date)}</span>
                    </div>
                    <div className="flex items-center justify-end space-x-2 text-sm">
                      <Mail className="h-4 w-4" />
                      <span>{data.company.email}</span>
                    </div>
                    {data.company.phones.map((phone, idx) => (
                      <div key={idx} className="flex items-center justify-end space-x-2 text-sm">
                        <Phone className="h-4 w-4" />
                        <span>{phone}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {data.company.tagline && (
                  <p className="text-center text-teal-100 text-sm mt-4 italic">{data.company.tagline}</p>
                )}

                {data.company.social && (
                  <div className="flex items-center justify-center space-x-4 mt-3">
                    {data.company.social.instagram && (
                      <div className="flex items-center space-x-1 text-teal-100 text-sm">
                        <Instagram className="h-4 w-4" />
                        <span>{data.company.social.instagram}</span>
                      </div>
                    )}
                    {data.company.social.facebook && (
                      <div className="flex items-center space-x-1 text-teal-100 text-sm">
                        <Facebook className="h-4 w-4" />
                        <span>{data.company.social.facebook}</span>
                      </div>
                    )}
                    {data.company.social.website && (
                      <div className="flex items-center space-x-1 text-teal-100 text-sm">
                        <Globe className="h-4 w-4" />
                        <span>{data.company.social.website}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Número do orçamento e título */}
              <div className="bg-teal-700 px-8 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Orçamento {data.order_number}</h2>
                    {data.title && <p className="text-teal-100 mt-1">{data.title}</p>}
                  </div>
                  <div className="bg-white px-4 py-2 rounded-lg">
                    <p className="text-xs text-gray-500">Validade</p>
                    <p className="text-sm font-semibold text-gray-900">30 dias</p>
                  </div>
                </div>
              </div>

              {/* Dados do cliente */}
              <div className="px-8 py-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-teal-900 mb-3">Cliente: {data.client.name}</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    {data.client.company_name && (
                      <p className="text-gray-700">{data.client.company_name}</p>
                    )}
                    {data.client.cnpj && (
                      <p className="text-sm text-gray-600">CNPJ: {data.client.cnpj}</p>
                    )}
                    {data.client.address && (
                      <p className="text-sm text-gray-600">{data.client.address}</p>
                    )}
                    {data.client.city && (
                      <p className="text-sm text-gray-600">{data.client.city}-{data.client.state}</p>
                    )}
                    {data.client.cep && (
                      <p className="text-sm text-gray-600">CEP {data.client.cep}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    {data.client.email && (
                      <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <Mail className="h-4 w-4 text-teal-600" />
                        <span>{data.client.email}</span>
                      </div>
                    )}
                    {data.client.phone && (
                      <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <Phone className="h-4 w-4 text-teal-600" />
                        <span>{data.client.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Informações básicas */}
              <div className="px-8 py-6 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-bold text-teal-900 mb-4">Informações básicas</h3>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Prazo de execução</p>
                    <p className="text-gray-900">{data.basic_info.deadline}</p>
                  </div>
                  {data.basic_info.brand && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Marca</p>
                      <p className="text-gray-900">{data.basic_info.brand}</p>
                    </div>
                  )}
                  {data.basic_info.model && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Modelo</p>
                      <p className="text-gray-900">{data.basic_info.model}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Serviços */}
              <div className="px-8 py-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-teal-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Serviços e Produtos
                </h3>
                <div className="space-y-4">
                  {data.items.map((item, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className={`grid ${data.show_value !== false ? 'grid-cols-12' : 'grid-cols-8'} gap-4 mb-3`}>
                        <div className={data.show_value !== false ? 'col-span-5' : 'col-span-6'}>
                          <div className="flex items-start">
                            <span className="bg-teal-100 text-teal-700 text-xs font-semibold px-2 py-1 rounded mr-2">
                              {index + 1}
                            </span>
                            <div>
                              <p className="font-semibold text-gray-900 mb-1">{item.description}</p>
                              {item.scope && (
                                <div className="text-sm text-gray-600 whitespace-pre-line mt-2 bg-gray-50 p-2 rounded">
                                  {item.scope}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="col-span-1 text-center">
                          <p className="text-xs text-gray-500 mb-1">Unidade</p>
                          <p className="text-sm font-medium text-gray-700">{item.unit}</p>
                        </div>
                        <div className="col-span-1 text-center">
                          <p className="text-xs text-gray-500 mb-1">Qtd.</p>
                          <p className="text-sm font-medium text-gray-700">{item.quantity}</p>
                        </div>
                        {data.show_value !== false && (
                          <>
                            <div className="col-span-2 text-center">
                              <p className="text-xs text-gray-500 mb-1">Preço unitário</p>
                              <p className="text-sm font-medium text-gray-900">{formatCurrency(item.unit_price)}</p>
                            </div>
                            <div className="col-span-2 text-right">
                              <p className="text-xs text-gray-500 mb-1">Total</p>
                              <p className="text-base font-bold text-teal-700">{formatCurrency(item.total_price)}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Resumo financeiro */}
                {data.show_value !== false && (
                  <div className="mt-6 space-y-3">
                    <div className="bg-gray-50 px-6 py-3 rounded-lg flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Subtotal</span>
                      <span className="text-base font-semibold text-gray-900">{formatCurrency(data.subtotal)}</span>
                    </div>
                    {data.discount > 0 && (
                      <div className="bg-red-50 px-6 py-3 rounded-lg flex items-center justify-between">
                        <span className="text-sm font-medium text-red-700">
                          Desconto {data.discount > 0 && data.subtotal > 0 ? `(${Math.round((data.discount / data.subtotal) * 100)}%)` : ''}
                        </span>
                        <span className="text-base font-semibold text-red-700">- {formatCurrency(data.discount_amount || data.discount)}</span>
                      </div>
                    )}
                    <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-4 rounded-lg flex items-center justify-between shadow-lg">
                      <div>
                        <p className="text-sm opacity-90">Valor Total</p>
                        <span className="text-2xl font-bold">TOTAL</span>
                      </div>
                      <span className="text-3xl font-bold">{formatCurrency(data.total || data.final_total || 0)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Escopo Detalhado */}
              {data.escopo_detalhado && (
                <div className="px-8 py-6 border-b border-gray-200 bg-blue-50">
                  <h3 className="text-lg font-bold text-blue-900 mb-4">Escopo Detalhado do Serviço</h3>
                  <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">
                    {data.escopo_detalhado}
                  </p>
                </div>
              )}

              {/* Relatório Técnico */}
              {data.relatorio_tecnico && (
                <div className="px-8 py-6 border-b border-gray-200 bg-amber-50">
                  <h3 className="text-lg font-bold text-amber-900 mb-4">Relatório Técnico</h3>
                  <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">
                    {data.relatorio_tecnico}
                  </p>
                </div>
              )}

              {/* Orientações de Serviço */}
              {data.orientacoes_servico && (
                <div className="px-8 py-6 border-b border-gray-200 bg-green-50">
                  <h3 className="text-lg font-bold text-green-900 mb-4">Orientações de Serviço</h3>
                  <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">
                    {data.orientacoes_servico}
                  </p>
                </div>
              )}

              {/* Pagamento */}
              <div className="px-8 py-6 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-bold text-teal-900 mb-4">Pagamento</h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Meios de pagamento</p>
                    <p className="text-gray-900">{data.payment.methods}</p>
                  </div>

                  {data.payment.pix && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">PIX</p>
                      <p className="text-gray-900 font-mono">{data.payment.pix}</p>
                    </div>
                  )}

                  {(data.payment.bank || data.payment.bank_details) && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Dados bancários</p>
                      <div className="bg-white rounded-lg p-4 space-y-1 text-sm">
                        <p className="text-gray-700"><span className="font-medium">Banco:</span> {data.payment.bank?.name || data.payment.bank_details?.bank}</p>
                        <p className="text-gray-700"><span className="font-medium">Agência:</span> {data.payment.bank?.agency || data.payment.bank_details?.agency}</p>
                        <p className="text-gray-700"><span className="font-medium">Conta:</span> {data.payment.bank?.account || data.payment.bank_details?.account}</p>
                        <p className="text-gray-700"><span className="font-medium">Tipo de conta:</span> {data.payment.bank?.type || data.payment.bank_details?.account_type}</p>
                        <p className="text-gray-700"><span className="font-medium">Titular da conta (CPF/CNPJ):</span> {data.payment.bank?.holder || data.payment.bank_details?.holder}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Condições de pagamento</p>
                    <p className="text-gray-900 whitespace-pre-line">{data.payment.conditions}</p>
                  </div>
                </div>
              </div>

              {/* Garantia */}
              <div className="px-8 py-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-teal-900 mb-4 flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Garantia</span>
                </h3>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Condições da garantia</p>
                  <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                    {typeof data.warranty.conditions === 'string'
                      ? data.warranty.conditions
                      : Array.isArray(data.warranty.conditions)
                        ? data.warranty.conditions.join('\n\n')
                        : ''
                    }
                  </p>
                </div>
              </div>

              {/* Cláusulas contratuais */}
              <div className="px-8 py-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-teal-900 mb-4">Cláusulas contratuais</h3>
                <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                  {typeof data.contract_clauses === 'string'
                    ? data.contract_clauses
                    : Array.isArray(data.contract_clauses)
                      ? data.contract_clauses.map((clause, idx) => (
                          <div key={idx} className="mb-4">
                            <h4 className="font-semibold mb-2">{clause.title}</h4>
                            <ul className="list-disc pl-5 space-y-1">
                              {clause.items.map((item, itemIdx) => (
                                <li key={itemIdx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        ))
                      : ''
                  }
                </div>
              </div>

              {/* Informações adicionais */}
              {(data.additional_notes || data.additional_info) && (
                <div className="px-8 py-6 bg-gray-50">
                  <h3 className="text-lg font-bold text-teal-900 mb-4">Informações adicionais</h3>
                  <p className="text-gray-700 whitespace-pre-line">{data.additional_notes || data.additional_info}</p>
                  <p className="text-center text-gray-600 italic mt-4">
                    {data.company.city}, {formatDate(data.date)}
                  </p>
                </div>
              )}

              {/* Assinaturas */}
              <div className="px-8 py-8 bg-white">
                <div className="grid grid-cols-2 gap-12">
                  <div className="text-center">
                    <div className="border-t-2 border-gray-300 pt-2 mt-16">
                      <p className="font-bold text-gray-900">{data.company.name}</p>
                      <p className="text-sm text-gray-600">{data.company.owner}</p>
                      <p className="text-xs text-gray-500">diretor técnico</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="border-t-2 border-gray-300 pt-2 mt-16">
                      <p className="font-bold text-gray-900">{data.client.name}</p>
                      {data.client.cnpj && (
                        <p className="text-sm text-gray-600">CNPJ {data.client.cnpj}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer com informações de contato */}
              <div className="bg-gray-100 px-8 py-4 text-center border-t border-gray-200">
                <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Mail className="h-4 w-4" />
                    <span>{data.company.email}</span>
                  </div>
                  {data.company.phones.map((phone, idx) => (
                    <div key={idx} className="flex items-center space-x-1">
                      <Phone className="h-4 w-4" />
                      <span>{phone}</span>
                    </div>
                  ))}
                </div>
                {data.company.social && (
                  <div className="flex items-center justify-center space-x-4 mt-2 text-sm text-gray-600">
                    {data.company.social.instagram && (
                      <div className="flex items-center space-x-1">
                        <Instagram className="h-4 w-4" />
                        <span>{data.company.social.instagram}</span>
                      </div>
                    )}
                    {data.company.social.facebook && (
                      <div className="flex items-center space-x-1">
                        <Facebook className="h-4 w-4" />
                        <span>{data.company.social.facebook}</span>
                      </div>
                    )}
                    {data.company.social.website && (
                      <div className="flex items-center space-x-1">
                        <Globe className="h-4 w-4" />
                        <span>{data.company.social.website}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
