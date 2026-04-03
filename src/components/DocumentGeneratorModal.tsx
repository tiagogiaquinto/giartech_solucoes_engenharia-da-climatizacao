import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Share2, Eye, FileText, Receipt, ClipboardList, Loader2, CheckCircle, AlertCircle, MessageCircle } from 'lucide-react'
import { getCompanyProfile } from '../utils/documentEngine/companyService'
import { generateOSPDF } from '../utils/documentEngine/generateOS'
import { generateOrcamentoPDF } from '../utils/documentEngine/generateOrcamento'
import { generateReciboPDF } from '../utils/documentEngine/generateRecibo'
import type { OSDocumentData, BudgetDocumentData, ReciboDocumentData, CompanyProfile, DocumentItem, DocumentFinancial } from '../utils/documentEngine/types'

export type DocType = 'os' | 'orcamento' | 'recibo'

interface DocumentGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  order: any
  customer: any
  docType?: DocType
}

interface DocConfig {
  type: DocType
  label: string
  icon: React.ReactNode
  description: string
  color: string
}

const DOC_CONFIGS: DocConfig[] = [
  {
    type: 'os',
    label: 'Ordem de Serviço',
    icon: <ClipboardList className="h-5 w-5" />,
    description: 'Documento técnico completo com itens, valores, garantia e assinaturas.',
    color: 'bg-blue-600 hover:bg-blue-700',
  },
  {
    type: 'orcamento',
    label: 'Orçamento',
    icon: <FileText className="h-5 w-5" />,
    description: 'Proposta comercial com itens, valores e espaço para aceite do cliente.',
    color: 'bg-teal-600 hover:bg-teal-700',
  },
  {
    type: 'recibo',
    label: 'Recibo de Pagamento',
    icon: <Receipt className="h-5 w-5" />,
    description: 'Comprovante de pagamento com valor por extenso e quitação automática.',
    color: 'bg-green-600 hover:bg-green-700',
  },
]

export default function DocumentGeneratorModal({
  isOpen,
  onClose,
  order,
  customer,
  docType,
}: DocumentGeneratorModalProps) {
  const [selectedType, setSelectedType] = useState<DocType>(docType || 'os')
  const [step, setStep] = useState<'select' | 'preview' | 'done'>('select')
  const [generating, setGenerating] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [company, setCompany] = useState<CompanyProfile | null>(null)

  useEffect(() => {
    if (isOpen) {
      getCompanyProfile().then(setCompany)
      setStep(docType ? 'select' : 'select')
      setPreviewUrl(null)
      setBlob(null)
      setError(null)
    }
  }, [isOpen, docType])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const buildOSData = useCallback((company: CompanyProfile): OSDocumentData => {
    const customerAddr = customer?.customer_addresses?.[0]
    const addrParts = [
      customerAddr?.logradouro,
      customerAddr?.numero,
      customerAddr?.bairro,
    ].filter(Boolean).join(', ')

    const items: DocumentItem[] = (order.items || []).map((item: any) => {
      const qty = Number(item.quantity || item.quantidade || 1)
      const price = Number(item.unit_price || item.preco_unitario || 0)
      return {
        description: item.name || item.descricao || item.description || '—',
        quantity: qty,
        unit: item.unit || 'un',
        unit_price: price,
        total: Number(item.total_price || item.preco_total || qty * price),
        notes: item.escopo_detalhado || '',
      }
    })

    const materials = (order.materials || []).map((m: any) => ({
      name: m.name || m.nome || '—',
      quantity: Number(m.quantity || m.quantidade || 0),
      unit: m.unit || m.unidade || 'un',
      unit_cost: Number(m.unit_cost || m.preco_unitario || 0),
      total_cost: Number(m.total_cost || m.valor_total || 0),
    }))

    const team = (order.team || []).map((t: any) => ({
      name: t.nome || t.name || '—',
      role: t.role || t.cargo || '—',
    }))

    const subtotal = items.reduce((sum, it) => sum + it.total, 0)
    const discount = Number(order.discount_amount || order.desconto_valor || 0)
    const net = Number(order.total_value || order.final_total || subtotal - discount || 0)

    const financial: DocumentFinancial = {
      subtotal: subtotal || net,
      discount: discount > 0 ? discount : undefined,
      net_value: net,
      payment_method: order.payment_method || order.forma_pagamento || '',
      payment_installments: Number(order.payment_installments || 1),
      payment_conditions: order.payment_conditions || order.condicoes_pagamento || '',
      pix_key: order.pix_key || order.payment_pix || company.pix_key || '',
      labor_value: Number(order.labor_value || 0) || undefined,
      materials_value: Number(order.materials_value || 0) || undefined,
    }

    return {
      type: 'os',
      company,
      order_number: order.order_number || order.number || 'S/N',
      status: order.status,
      created_at: order.created_at,
      scheduled_date: order.service_date || order.scheduled_date || order.due_date,
      execution_deadline: order.execution_deadline,
      description: order.description || '',
      instructions: order.instructions || '',
      report: order.report || order.relatorio_tecnico || '',
      priority: order.priority || 'Normal',
      customer: {
        name: order.client_name || customer?.nome_razao || customer?.name || 'Cliente',
        cpf_cnpj: order.client_cnpj || order.client_cpf || customer?.cnpj || customer?.cpf || '',
        phone: order.client_phone || customer?.telefone || customer?.phone || '',
        email: order.client_email || customer?.email || '',
        address: addrParts || order.client_address || customer?.endereco || '',
        address_complement: customerAddr?.complemento || '',
        city: customerAddr?.cidade || order.client_city || customer?.cidade || '',
        state: customerAddr?.estado || order.client_state || customer?.estado || '',
      },
      items,
      materials,
      team,
      financial,
      checklist_items: (order.checklist_items || []).map((c: any) => ({
        description: c.description || c.descricao || '',
        checked: !!c.checked || !!c.completed,
      })),
      warranty_days: order.warranty_period || company.default_warranty_days || 90,
      warranty_terms: order.warranty_terms || '',
      signature: { technician_name: order.technician_name || '' },
      milestones: (order.milestones || []).map((m: any) => ({
        title: m.title || m.etapa_nome || '',
        scheduled_at: m.scheduled_at || m.data_agendada || null,
        actual_at: m.actual_at || m.data_conclusao || null,
        status: m.status || 'agendado',
        completed_by: m.completed_by || null,
        notes: m.notes || m.observacoes || null,
      })),
    }
  }, [order, customer])

  const buildOrcamentoData = useCallback((company: CompanyProfile): BudgetDocumentData => {
    const osData = buildOSData(company)
    return {
      type: 'orcamento',
      company,
      budget_number: `ORC-${order.order_number || order.number || 'S/N'}`,
      created_at: order.created_at,
      valid_until: (() => {
        const d = new Date()
        d.setDate(d.getDate() + 30)
        return d.toISOString()
      })(),
      customer: osData.customer,
      items: osData.items,
      financial: osData.financial,
      os_reference: osData.order_number,
      notes: order.instructions || order.description || '',
    }
  }, [buildOSData, order])

  const buildReciboData = useCallback((company: CompanyProfile): ReciboDocumentData => {
    const osData = buildOSData(company)
    return {
      type: 'recibo',
      company,
      recibo_number: `REC-${order.order_number || order.number || 'S/N'}`,
      created_at: new Date().toISOString(),
      customer: osData.customer,
      os_reference: osData.order_number,
      description: order.description || `Serviços referentes à OS Nº ${osData.order_number}`,
      financial: osData.financial,
    }
  }, [buildOSData, order])

  const handleGenerate = async (type: DocType) => {
    if (!company) return
    setGenerating(true)
    setError(null)
    try {
      let pdfBlob: Blob
      if (type === 'os') {
        pdfBlob = await generateOSPDF(buildOSData(company))
      } else if (type === 'orcamento') {
        pdfBlob = await generateOrcamentoPDF(buildOrcamentoData(company))
      } else {
        pdfBlob = await generateReciboPDF(buildReciboData(company))
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      const url = URL.createObjectURL(pdfBlob)
      setBlob(pdfBlob)
      setPreviewUrl(url)
      setSelectedType(type)
      setStep('preview')
    } catch (err: any) {
      setError(err?.message || 'Erro ao gerar documento')
    } finally {
      setGenerating(false)
    }
  }

  const handleDownload = () => {
    if (!blob) return
    const typeLabels: Record<DocType, string> = {
      os: 'OS',
      orcamento: 'Orcamento',
      recibo: 'Recibo',
    }
    const osNum = order?.order_number || order?.number || 'SN'
    const filename = `${typeLabels[selectedType]}_${osNum}.pdf`
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const handleWhatsApp = () => {
    const clientPhone = (customer?.telefone || customer?.phone || '').replace(/\D/g, '')
    const osNum = order?.order_number || order?.number || ''
    const clientName = customer?.nome_razao || customer?.name || 'Cliente'
    const typeLabel: Record<DocType, string> = {
      os: 'a Ordem de Serviço',
      orcamento: 'o Orçamento',
      recibo: 'o Recibo de Pagamento',
    }
    const msg = encodeURIComponent(
      `Olá ${clientName}, segue ${typeLabel[selectedType]} da OS #${osNum}. Qualquer dúvida, estamos à disposição!`
    )
    const url = clientPhone
      ? `https://wa.me/55${clientPhone}?text=${msg}`
      : `https://wa.me/?text=${msg}`
    window.open(url, '_blank', 'noopener')
  }

  if (!isOpen) return null

  const currentConfig = DOC_CONFIGS.find(c => c.type === selectedType)

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Gerador de Documentos</h2>
                <p className="text-sm text-gray-500">OS #{order?.order_number || order?.number || '—'}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            {step === 'select' && (
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-6">
                  Selecione o tipo de documento que deseja gerar para esta OS.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {DOC_CONFIGS.map(config => (
                    <motion.button
                      key={config.type}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleGenerate(config.type)}
                      disabled={generating}
                      className="relative flex flex-col items-start gap-3 p-5 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:shadow-md transition-all text-left bg-white disabled:opacity-60 disabled:cursor-not-allowed group"
                    >
                      <div className={`p-2.5 rounded-lg text-white ${config.color} transition-colors`}>
                        {config.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{config.label}</h3>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{config.description}</p>
                      </div>
                      {generating && selectedType === config.type && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
                          <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </motion.div>
                )}
              </div>
            )}

            {step === 'preview' && previewUrl && (
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-b">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-medium">{currentConfig?.label} gerado com sucesso</span>
                  </div>
                  <button
                    onClick={() => { setStep('select'); setPreviewUrl(null) }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Gerar outro tipo
                  </button>
                </div>

                <div className="flex-1 bg-gray-100 p-4 overflow-auto" style={{ minHeight: 420 }}>
                  <iframe
                    src={previewUrl}
                    className="w-full rounded-lg shadow-lg bg-white"
                    style={{ height: '580px', border: 'none' }}
                    title="Preview do Documento"
                  />
                </div>

                <div className="flex items-center gap-3 px-6 py-4 border-t bg-white flex-wrap">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm"
                  >
                    <Download className="h-4 w-4" />
                    Baixar PDF
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleWhatsApp}
                    className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Enviar pelo WhatsApp
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.open(previewUrl, '_blank')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-sm transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    Abrir em Nova Aba
                  </motion.button>

                  <div className="flex-1" />

                  <p className="text-xs text-gray-400">
                    O PDF foi gerado com os dados atuais da OS.
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
