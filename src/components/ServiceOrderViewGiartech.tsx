import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Printer, Share2, FileText, Calendar, MapPin, Mail, Phone, Globe, User, Star, Briefcase } from 'lucide-react'
import { generateServiceOrderPDFGiartech } from '../utils/generateServiceOrderPDFGiartech'
import { getCompanyInfo } from '../utils/companyData'
import { ServiceItemComplete } from '../utils/serviceOrderDataMapper'
import { useEffect, useState } from 'react'
import { formatDateSafe } from '../utils/format'

type ServiceItem = ServiceItemComplete

interface ServiceOrderData {
  order_number: string
  date: string
  title?: string
  client: {
    name: string
    company_name?: string
    cnpj?: string
    cpf?: string
    address?: string
    city?: string
    state?: string
    cep?: string
    email?: string
    phone?: string
  }
  basic_info?: {
    deadline: string
    brand?: string
    model?: string
    equipment?: string
  }
  items: ServiceItem[]
  subtotal: number
  discount: number
  total: number
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
    conditions: string
  }
  warranty?: {
    period?: string
    conditions: string | string[]
  }
  contract_clauses?: any[]
  additional_info?: string
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
}

interface Props {
  isOpen: boolean
  onClose: () => void
  data: ServiceOrderData
}

export default function ServiceOrderViewGiartech({ isOpen, onClose, data }: Props) {
  const [companyInfo, setCompanyInfo] = useState<any>(null)

  useEffect(() => {
    const loadCompanyInfo = async () => {
      const info = await getCompanyInfo()
      setCompanyInfo(info)
    }
    loadCompanyInfo()
  }, [])

  if (!isOpen || !companyInfo) return null

  const handleDownloadPDF = async () => {
    try {
      await generateServiceOrderPDFGiartech(data)
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
          title: `Ordem de Serviço ${data.order_number}`,
          text: `Ordem de serviço para ${data.client.name}`,
          url: window.location.href
        })
      } catch (error) {
        console.log('Compartilhamento cancelado')
      }
    } else {
      // Fallback: copiar link para clipboard
      try {
        await navigator.clipboard.writeText(window.location.href)
        alert('Link copiado para a área de transferência!')
      } catch (error) {
        console.error('Erro ao copiar link:', error)
        alert('Não foi possível copiar o link. URL: ' + window.location.href)
      }
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return formatDateSafe(dateString)
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
          <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6 text-white" />
              <h2 className="text-xl font-bold text-white">Visualizar Ordem de Serviço</h2>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownloadPDF}
                className="px-4 py-2 bg-white text-blue-900 rounded-lg hover:bg-gray-100 flex items-center space-x-2 transition-colors"
                title="Baixar PDF"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Baixar PDF</span>
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-white text-blue-900 rounded-lg hover:bg-gray-100 flex items-center space-x-2 transition-colors"
                title="Imprimir"
              >
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">Imprimir</span>
              </button>
              <button
                onClick={handleShare}
                className="px-4 py-2 bg-white text-blue-900 rounded-lg hover:bg-gray-100 flex items-center space-x-2 transition-colors"
                title="Compartilhar"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Compartilhar</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-blue-950 rounded-lg transition-colors"
                title="Fechar"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto bg-white shadow-lg">
              <div className="border-b border-gray-200 p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-24 h-24 bg-blue-900 rounded-lg flex items-center justify-center">
                      <span className="text-white text-3xl font-bold">
                        {companyInfo.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-blue-900">{companyInfo.name}</h1>
                      <p className="text-sm text-gray-700">{companyInfo.owner}</p>
                      <p className="text-sm text-gray-600">CNPJ: {companyInfo.cnpj}</p>
                      <p className="text-sm text-gray-600">{companyInfo.address}</p>
                      <p className="text-sm text-gray-600">{companyInfo.city}-{companyInfo.state}</p>
                      <p className="text-sm text-gray-600">CEP {companyInfo.zip}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end space-x-2 mb-2">
                      <Calendar className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">{formatDate(data.date)}</span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center justify-end space-x-2">
                        <Mail className="h-4 w-4" />
                        <span>{companyInfo.email}</span>
                      </div>
                      <div className="flex items-center justify-end space-x-2">
                        <Phone className="h-4 w-4" />
                        <span>{companyInfo.phone}</span>
                      </div>
                      {companyInfo.instagram && (
                        <div className="flex items-center justify-end space-x-2">
                          <Globe className="h-4 w-4" />
                          <span>{companyInfo.instagram}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-center text-gray-600 italic text-sm">
                  Sua satisfação é o que motiva a nossa dedicação.
                </p>
              </div>

              <div className="bg-blue-900 text-white px-8 py-6">
                <h2 className="text-3xl font-bold">Ordem de serviço {data.order_number}</h2>
                {data.title && <p className="text-blue-100 mt-2">{data.title}</p>}
              </div>

              <div className="px-8 py-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Cliente: {data.client.name}</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  {data.client.company_name && <p>{data.client.company_name}</p>}
                  {data.client.cnpj && <p>CNPJ: {data.client.cnpj}</p>}
                  {data.client.cpf && <p>CPF: {data.client.cpf}</p>}
                  {data.client.address && (
                    <>
                      <p>{data.client.address}</p>
                      {data.client.city && <p>{data.client.city}, {data.client.state}-{data.client.state}</p>}
                      {data.client.cep && <p>CEP {data.client.cep}</p>}
                    </>
                  )}
                  {data.client.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <span>{data.client.email}</span>
                    </div>
                  )}
                  {data.client.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-blue-600" />
                      <span>{data.client.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {((data.installation_addresses && data.installation_addresses.length > 0) ||
                (data.installation_contacts && data.installation_contacts.length > 0)) && (
                <div className="px-8 py-6 border-b border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {data.installation_addresses && data.installation_addresses.length > 0 && (
                      <div>
                        <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          Endereços de Instalação
                        </h3>
                        <div className="space-y-3">
                          {data.installation_addresses.map((addr, i) => (
                            <div key={i} className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm">
                              <div className="flex items-center gap-1 mb-1">
                                {addr.is_primary && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                                {addr.label && <span className="font-semibold text-blue-700 text-xs uppercase tracking-wide">{addr.label}</span>}
                              </div>
                              <p className="text-gray-800">
                                {[addr.logradouro, addr.numero, addr.complemento].filter(Boolean).join(', ')}
                                {addr.bairro && ` — ${addr.bairro}`}
                              </p>
                              {(addr.cidade || addr.estado) && (
                                <p className="text-gray-600">{[addr.cidade, addr.estado].filter(Boolean).join(' / ')}{addr.cep && ` — CEP ${addr.cep}`}</p>
                              )}
                              {addr.referencia && <p className="text-xs text-gray-500 mt-0.5">Ref: {addr.referencia}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {data.installation_contacts && data.installation_contacts.length > 0 && (
                      <div>
                        <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <User className="h-4 w-4 text-green-600" />
                          Contatos no Local
                        </h3>
                        <div className="space-y-3">
                          {data.installation_contacts.map((c, i) => (
                            <div key={i} className="p-3 bg-green-50 rounded-lg border border-green-100 text-sm space-y-0.5">
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
                </div>
              )}

              {data.basic_info && (
                <div className="px-8 py-6 bg-blue-50 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-blue-900 mb-4">Informações básicas</h3>
                  <div className="grid grid-cols-2 gap-6 text-sm">
                    <div>
                      <p className="font-semibold text-gray-700">Prazo de execução</p>
                      <p className="text-gray-900">{data.basic_info.deadline}</p>
                    </div>
                    {data.basic_info.brand && (
                      <div>
                        <p className="font-semibold text-gray-700">Marca</p>
                        <p className="text-gray-900">{data.basic_info.brand}</p>
                      </div>
                    )}
                    {data.basic_info.model && (
                      <div>
                        <p className="font-semibold text-gray-700">Modelo</p>
                        <p className="text-gray-900">{data.basic_info.model}</p>
                      </div>
                    )}
                    {data.basic_info.equipment && (
                      <div>
                        <p className="font-semibold text-gray-700">Aparelho</p>
                        <p className="text-gray-900">{data.basic_info.equipment}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="px-8 py-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-blue-900 mb-4">Serviços</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-300">
                        <th className="text-left py-2 font-semibold text-gray-900">Descrição</th>
                        <th className="text-center py-2 font-semibold text-gray-900">Unidade</th>
                        <th className="text-right py-2 font-semibold text-gray-900">Preço unitário</th>
                        <th className="text-center py-2 font-semibold text-gray-900">Qtd.</th>
                        <th className="text-right py-2 font-semibold text-gray-900">Preço</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((item, index) => (
                        <tr key={index} className="border-b border-gray-200">
                          <td className="py-3">
                            <p className="font-semibold text-gray-900">{item.service_name || item.description}</p>
                            {(item.scope || item.service_scope || item.escopo_detalhado) && (
                              <p className="text-xs text-gray-600 mt-1 whitespace-pre-line">
                                ESCOPO:
                                <br />
                                {item.scope || item.service_scope || item.escopo_detalhado}
                              </p>
                            )}

                            {/* Materiais */}
                            {item.materials && item.materials.length > 0 && (
                              <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                                <p className="text-xs font-semibold text-green-900 mb-1">📦 Materiais:</p>
                                {item.materials.map((mat: any, idx: number) => (
                                  <p key={idx} className="text-xs text-green-800 ml-2">
                                    • {mat.nome || mat.material_name || mat.name} - {mat.quantidade || mat.quantity} {mat.unidade_medida || mat.unit || 'un'} - {formatCurrency(mat.preco_venda || mat.unit_price || 0)}
                                  </p>
                                ))}
                              </div>
                            )}

                            {/* Equipe */}
                            {item.team && item.team.length > 0 && (
                              <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                                <p className="text-xs font-semibold text-blue-900 mb-1">👷 Equipe:</p>
                                {item.team.map((func: any, idx: number) => (
                                  <p key={idx} className="text-xs text-blue-800 ml-2">
                                    • {func.nome || func.employee_name || func.name} {func.cargo || func.role ? `(${func.cargo || func.role})` : ''}
                                  </p>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="text-center py-3 text-gray-700">{item.unit}</td>
                          <td className="text-right py-3 text-gray-900">{formatCurrency(item.unit_price)}</td>
                          <td className="text-center py-3 text-gray-700">{item.quantity}</td>
                          <td className="text-right py-3 font-semibold text-gray-900">{formatCurrency(item.total_price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Serviços</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(data.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold text-blue-900">
                    <span>Subtotal</span>
                    <span>{formatCurrency(data.subtotal)}</span>
                  </div>
                  {data.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Desconto sobre serviços</span>
                      <span className="text-gray-900">- {formatCurrency(data.discount)}</span>
                    </div>
                  )}
                  <div className="bg-blue-900 text-white px-4 py-3 rounded flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(data.total)}</span>
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 bg-blue-50 border-b border-gray-200">
                <h3 className="text-lg font-bold text-blue-900 mb-4">Pagamento</h3>
                <div className="grid grid-cols-2 gap-8 text-sm">
                  <div>
                    <p className="font-semibold text-gray-700 mb-2">Meios de pagamento</p>
                    <p className="text-gray-900">{data.payment.methods}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 mb-2">PIX</p>
                    <p className="text-gray-900 font-mono">{data.payment.pix || companyInfo.cnpj}</p>
                  </div>
                </div>

                {data.payment.bank_details && (
                  <div className="mt-6 grid grid-cols-2 gap-8 text-sm">
                    <div>
                      <p className="font-semibold text-gray-700 mb-2">Dados bancários</p>
                      <div className="space-y-1 text-gray-900">
                        <p>Banco: {data.payment.bank_details.bank}</p>
                        <p>Agência: {data.payment.bank_details.agency}</p>
                        <p>Conta: {data.payment.bank_details.account}</p>
                        <p>Tipo de conta: {data.payment.bank_details.account_type}</p>
                        <p>Titular da conta (CPF/CNPJ): {data.payment.bank_details.holder}</p>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700 mb-2">Condições de pagamento</p>
                      <p className="text-gray-900">{data.payment.conditions}</p>
                    </div>
                  </div>
                )}
              </div>

              {data.warranty && (
                <div className="px-8 py-6 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-blue-900 mb-4">Garantia</h3>
                  {data.warranty.period && (
                    <div className="mb-4">
                      <p className="font-semibold text-gray-700 text-sm mb-1">Período de garantia</p>
                      <p className="text-gray-900">{data.warranty.period}</p>
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-700 text-sm mb-2">Condições da garantia</p>
                    <p className="text-sm text-gray-800 whitespace-pre-line">
                      {typeof data.warranty.conditions === 'string'
                        ? data.warranty.conditions
                        : Array.isArray(data.warranty.conditions)
                        ? data.warranty.conditions.join('\n\n')
                        : ''}
                    </p>
                  </div>
                </div>
              )}

              {data.contract_clauses && data.contract_clauses.length > 0 && (
                <div className="px-8 py-6 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-blue-900 mb-4">Cláusulas contratuais</h3>
                  <div className="space-y-4 text-sm">
                    {data.contract_clauses.map((clause: any, index: number) => (
                      <div key={index}>
                        <p className="font-semibold text-gray-900 mb-2">{clause.title}</p>
                        <div className="space-y-1 text-gray-700">
                          {clause.items.map((item: string, itemIndex: number) => (
                            <p key={itemIndex}>{item}</p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.additional_info && (
                <div className="px-8 py-6 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-blue-900 mb-4">Informações adicionais</h3>
                  <p className="text-sm text-gray-800 whitespace-pre-line">{data.additional_info}</p>
                  <p className="text-center text-gray-600 italic text-sm mt-4">
                    obrigado pela confiança, estaremos à disposição.
                  </p>
                  <p className="text-center font-semibold text-gray-900 mt-4">
                    {data.client.city || companyInfo.city}, {formatDate(data.date)}
                  </p>
                </div>
              )}

              <div className="px-8 py-12 bg-white">
                <div className="grid grid-cols-2 gap-12">
                  <div className="text-center">
                    <div className="border-t-2 border-gray-400 pt-2 mt-16">
                      <p className="font-bold text-gray-900 text-lg">{companyInfo.name}</p>
                      <p className="text-sm text-gray-700">{companyInfo.owner}</p>
                      <p className="text-xs text-gray-500 italic">diretor técnico</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="border-t-2 border-gray-400 pt-2 mt-16">
                      <p className="font-bold text-gray-900 text-lg">{data.client.name}</p>
                      {data.client.cnpj && (
                        <p className="text-sm text-gray-700">CNPJ {data.client.cnpj}</p>
                      )}
                      {data.client.cpf && (
                        <p className="text-sm text-gray-700">CPF {data.client.cpf}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-100 px-8 py-4 text-center border-t border-gray-200">
                <div className="flex items-center justify-center space-x-6 text-xs text-gray-600 mb-2">
                  <span>✉ {companyInfo.email}</span>
                  <span>📞 {companyInfo.phone}</span>
                  {companyInfo.instagram && <span>@{companyInfo.instagram}</span>}
                </div>
                <div className="text-xs text-gray-500">
                  {companyInfo.website || 'tgarconnection.com.br'}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
