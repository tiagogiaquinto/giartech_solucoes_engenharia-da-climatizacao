import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Download, Printer, Eye, FileEdit as Edit3, Plus, Trash2, Save, X, Settings, Copy, Send, Palette, CheckCircle2, Search, Package, Loader2 } from 'lucide-react'
import {
  budgetPDFService,
  BudgetData,
  BudgetItem,
  PDFTemplate,
  defaultTemplates
} from '../services/budgetPDFService'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import TemplateSelectorModal from './TemplateSelectorModal'
import { fillTemplate, TemplateData } from '../services/templateFillService'
import { generateOrcamentoPDF } from '../utils/documentEngine/generateOrcamento'
import type { BudgetDocumentData, CompanyProfile, DocumentItem, DocumentFinancial, DocumentCustomer } from '../utils/documentEngine/types'

interface BudgetPDFEditorProps {
  initialData?: Partial<BudgetData>
  onSave?: (data: BudgetData) => void
  onClose?: () => void
  readOnly?: boolean
  serviceOrderId?: string
}

export default function BudgetPDFEditor({
  initialData,
  onSave,
  onClose,
  readOnly = false,
  serviceOrderId
}: BudgetPDFEditorProps) {
  const [budgetData, setBudgetData] = useState<BudgetData>({
    number: initialData?.number || `ORC-${Date.now()}`,
    date: initialData?.date || new Date().toISOString(),
    validUntil: initialData?.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    customer: initialData?.customer || {
      name: '',
      document: '',
      email: '',
      phone: '',
      address: ''
    },
    company: initialData?.company || {
      name: 'Giartech Soluções',
      document: '00.000.000/0000-00',
      email: 'contato@giartech.com',
      phone: '(00) 0000-0000',
      address: 'Endereço da empresa'
    },
    items: initialData?.items || [],
    subtotal: 0,
    discount: initialData?.discount || 0,
    discountType: initialData?.discountType || 'percentage',
    taxes: initialData?.taxes || 0,
    total: 0,
    paymentTerms: initialData?.paymentTerms || '',
    observations: initialData?.observations || ''
  })

  const [selectedTemplate, setSelectedTemplate] = useState<PDFTemplate>(defaultTemplates[0])
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [showPreview, setShowPreview] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [loadedTemplateHtml, setLoadedTemplateHtml] = useState<string>('')

  // Estados para busca de serviços do catálogo
  const [serviceCatalog, setServiceCatalog] = useState<any[]>([])
  const [serviceSearch, setServiceSearch] = useState('')
  const [showServiceSearch, setShowServiceSearch] = useState(false)
  const [filteredServices, setFilteredServices] = useState<any[]>([])

  const [newItem, setNewItem] = useState<Partial<BudgetItem>>({
    description: '',
    quantity: 1,
    unit: 'UN',
    unitPrice: 0,
    category: ''
  })

  const [loadingCompany, setLoadingCompany] = useState(false)
  const [useProfessionalPDF, setUseProfessionalPDF] = useState(true)

  useEffect(() => {
    calculateTotals()
  }, [budgetData.items, budgetData.discount, budgetData.discountType, budgetData.taxes])

  useEffect(() => {
    loadServiceCatalog()
    loadCompanyData()
    if (serviceOrderId) {
      loadFromServiceOrder(serviceOrderId)
    }
  }, [])

  const loadFromServiceOrder = async (orderId: string) => {
    try {
      setLoadingCompany(true)

      const { data: order, error } = await supabase
        .from('service_orders')
        .select(`
          *,
          service_order_items(
            *,
            service_catalog:service_catalog_id(name, unit, description)
          ),
          service_order_materials(
            *,
            inventory_items(name, unit)
          ),
          service_order_labor(
            *,
            employees(name, cargo)
          ),
          customer:customer_id(
            *,
            customer_addresses(*)
          )
        `)
        .eq('id', orderId)
        .maybeSingle()

      if (error) throw error
      if (!order) return

      const customer = order.customer
      const customerAddr = customer?.customer_addresses?.[0]

      const items: BudgetItem[] = []

      // Add service items
      ;(order.service_order_items || []).forEach((item: any, idx: number) => {
        const qty = Number(item.quantity || item.quantidade || 1)
        const price = Number(item.unit_price || item.preco_unitario || item.base_price || 0)
        const desc = item.service_catalog?.name || item.name || item.descricao || item.description || 'Servico'
        const detailedScope = item.escopo_detalhado || item.service_catalog?.description || ''
        const fullDesc = detailedScope ? `${desc}\n${detailedScope}` : desc

        items.push({
          id: `svc-${idx + 1}`,
          description: fullDesc,
          quantity: qty,
          unit: item.unit || item.service_catalog?.unit || 'SV',
          unitPrice: price,
          total: Number(item.total_price || item.preco_total || qty * price),
          category: 'Servico'
        })
      })

      // Add materials as items
      ;(order.service_order_materials || []).forEach((mat: any, idx: number) => {
        const qty = Number(mat.quantity || mat.quantidade || 1)
        const cost = Number(mat.unit_cost || mat.preco_unitario || 0)
        items.push({
          id: `mat-${idx + 1}`,
          description: `Material: ${mat.inventory_items?.name || mat.name || 'Material'}`,
          quantity: qty,
          unit: mat.inventory_items?.unit || mat.unit || 'un',
          unitPrice: cost,
          total: Number(mat.total_cost || mat.valor_total || qty * cost),
          category: 'Material'
        })
      })

      const laborTotal = Number(order.labor_value || order.valor_mao_de_obra || 0)
      const materialsTotal = Number(order.materials_value || order.valor_materiais || 0)
      const discount = Number(order.discount_amount || order.desconto_valor || 0)
      const subtotal = items.reduce((sum, it) => sum + it.total, 0)

      const addressLine = customerAddr
        ? [customerAddr.logradouro || customerAddr.street, customerAddr.numero || customerAddr.number, customerAddr.bairro || customerAddr.neighborhood].filter(Boolean).join(', ')
        : order.client_address || ''
      const cityState = customerAddr
        ? [customerAddr.cidade || customerAddr.city, customerAddr.estado || customerAddr.state].filter(Boolean).join(' - ')
        : ''

      const team = (order.service_order_labor || []).map((l: any) => l.employees?.name || l.name).filter(Boolean)
      const teamInfo = team.length > 0 ? `Equipe: ${team.join(', ')}` : ''

      const obsParts = [order.description, order.instructions, teamInfo].filter(Boolean)
      if (order.warranty_terms) {
        obsParts.push(`Garantia: ${order.warranty_terms}`)
      }

      setBudgetData(prev => ({
        ...prev,
        number: `ORC-${order.order_number || Date.now()}`,
        customer: {
          name: order.client_name || customer?.nome_razao || customer?.name || '',
          document: order.client_cnpj || order.client_cpf || customer?.cnpj || customer?.cpf || '',
          email: order.client_email || customer?.email || '',
          phone: order.client_phone || customer?.telefone || customer?.phone || '',
          address: addressLine + (cityState ? `, ${cityState}` : '')
        },
        items,
        observations: obsParts.join('\n\n'),
        paymentTerms: order.payment_conditions || order.condicoes_pagamento || order.payment_terms || '',
        discount: discount,
        discountType: 'fixed'
      }))

    } catch (error) {
      console.error('Erro ao carregar dados da OS:', error)
    } finally {
      setLoadingCompany(false)
    }
  }

  const loadCompanyData = async () => {
    try {
      setLoadingCompany(true)
      const { data, error } = await supabase
        .from('company_profile')
        .select('*')
        .maybeSingle()

      if (error) throw error

      if (data) {
        setBudgetData(prev => ({
          ...prev,
          company: {
            name: data.company_name || prev.company.name,
            document: data.cnpj || prev.company.document,
            email: data.email || prev.company.email,
            phone: data.phone || prev.company.phone,
            address: [data.address, data.city, data.state].filter(Boolean).join(', ') || prev.company.address,
            logo: data.logo_url || prev.company.logo
          }
        }))
      }
    } catch (error) {
      console.error('Erro ao carregar dados da empresa:', error)
    } finally {
      setLoadingCompany(false)
    }
  }

  useEffect(() => {
    if (serviceSearch.length >= 2) {
      const filtered = serviceCatalog.filter(service =>
        service.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
        service.description?.toLowerCase().includes(serviceSearch.toLowerCase())
      )
      setFilteredServices(filtered.slice(0, 10))
      setShowServiceSearch(filtered.length > 0)
    } else {
      setFilteredServices([])
      setShowServiceSearch(false)
    }
  }, [serviceSearch, serviceCatalog])

  const loadServiceCatalog = async () => {
    try {
      const { data, error } = await supabase
        .from('service_catalog')
        .select(`
          *,
          service_catalog_materials (
            id,
            material_id,
            quantity,
            materials (
              id,
              name,
              unit,
              unit_cost,
              unit_price
            )
          )
        `)
        .eq('active', true)
        .order('name')

      if (error) throw error
      setServiceCatalog(data || [])
    } catch (error) {
      console.error('Erro ao carregar catálogo:', error)
    }
  }

  const calculateTotals = () => {
    const subtotal = budgetData.items.reduce((sum, item) => sum + item.total, 0)

    let discountAmount = 0
    if (budgetData.discountType === 'percentage') {
      discountAmount = (subtotal * (budgetData.discount || 0)) / 100
    } else {
      discountAmount = budgetData.discount || 0
    }

    const total = subtotal - discountAmount + (budgetData.taxes || 0)

    setBudgetData(prev => ({
      ...prev,
      subtotal,
      total
    }))
  }

  const selectServiceFromCatalog = (service: any) => {
    console.log('🔍 Serviço selecionado:', service)

    // Preenche o item com os dados do serviço
    setNewItem({
      description: service.name + (service.description ? ` - ${service.description}` : ''),
      quantity: 1,
      unit: service.unit || 'SV',
      unitPrice: service.base_price || 0,
      category: service.category || 'Serviço'
    })

    // Adiciona automaticamente os materiais associados ao serviço
    if (service.service_catalog_materials && service.service_catalog_materials.length > 0) {
      const materialsToAdd: BudgetItem[] = service.service_catalog_materials
        .filter((scm: any) => scm.materials)
        .map((scm: any) => ({
          id: `material-${Date.now()}-${Math.random()}`,
          description: `Material: ${scm.materials.name}`,
          quantity: scm.quantity,
          unit: scm.materials.unit,
          unitPrice: scm.materials.unit_price || scm.materials.unit_cost || 0,
          total: scm.quantity * (scm.materials.unit_price || scm.materials.unit_cost || 0),
          category: 'Material'
        }))

      if (materialsToAdd.length > 0) {
        setBudgetData(prev => ({
          ...prev,
          items: [...prev.items, ...materialsToAdd]
        }))
        console.log('✅ Materiais adicionados automaticamente:', materialsToAdd.length)
      }
    }

    setServiceSearch('')
    setShowServiceSearch(false)
    console.log('✅ Dados carregados no formulário')
  }

  const addItem = () => {
    if (!newItem.description || !newItem.quantity || !newItem.unitPrice) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    const item: BudgetItem = {
      id: Date.now().toString(),
      description: newItem.description,
      quantity: newItem.quantity || 1,
      unit: newItem.unit || 'UN',
      unitPrice: newItem.unitPrice || 0,
      total: (newItem.quantity || 1) * (newItem.unitPrice || 0),
      category: newItem.category
    }

    setBudgetData(prev => ({
      ...prev,
      items: [...prev.items, item]
    }))

    setNewItem({
      description: '',
      quantity: 1,
      unit: 'UN',
      unitPrice: 0,
      category: ''
    })
  }

  const removeItem = (id: string) => {
    setBudgetData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }))
  }

  const updateItem = (id: string, updates: Partial<BudgetItem>) => {
    setBudgetData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === id) {
          const updated = { ...item, ...updates }
          updated.total = updated.quantity * updated.unitPrice
          return updated
        }
        return item
      })
    }))
  }

  const generatePreview = async () => {
    try {
      if (useProfessionalPDF) {
        const docData = convertToDocumentData()
        const blob = await generateOrcamentoPDF(docData)
        const url = URL.createObjectURL(blob)
        setPreviewUrl(url)
        setShowPreview(true)
      } else {
        const url = await budgetPDFService.previewPDF(budgetData, selectedTemplate)
        setPreviewUrl(url)
        setShowPreview(true)
      }
    } catch (error) {
      console.error('Error generating preview:', error)
      alert('Erro ao gerar preview do PDF')
    }
  }

  const convertToDocumentData = (): BudgetDocumentData => {
    const items: DocumentItem[] = budgetData.items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unitPrice,
      total: item.total
    }))

    let discountAmount = 0
    if (budgetData.discountType === 'percentage') {
      discountAmount = (budgetData.subtotal * (budgetData.discount || 0)) / 100
    } else {
      discountAmount = budgetData.discount || 0
    }

    const financial: DocumentFinancial = {
      subtotal: budgetData.subtotal,
      discount: discountAmount > 0 ? discountAmount : undefined,
      net_value: budgetData.total,
      payment_method: budgetData.paymentTerms?.split(',')[0]?.trim() || undefined,
      payment_conditions: budgetData.paymentTerms || undefined
    }

    const customer: DocumentCustomer = {
      name: budgetData.customer.name,
      cpf_cnpj: budgetData.customer.document,
      phone: budgetData.customer.phone,
      email: budgetData.customer.email,
      address: budgetData.customer.address
    }

    const company: CompanyProfile = {
      company_name: budgetData.company.name,
      cnpj: budgetData.company.document,
      email: budgetData.company.email,
      phone: budgetData.company.phone,
      address: budgetData.company.address,
      logo_url: budgetData.company.logo
    }

    return {
      type: 'orcamento',
      company,
      budget_number: budgetData.number,
      valid_until: budgetData.validUntil,
      created_at: budgetData.date,
      customer,
      items,
      financial,
      notes: budgetData.observations
    }
  }

  const handleDownload = async () => {
    try {
      if (useProfessionalPDF) {
        const docData = convertToDocumentData()
        const blob = await generateOrcamentoPDF(docData)
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Orcamento_${budgetData.number}_${format(new Date(), 'ddMMyyyy')}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        budgetPDFService.downloadPDF(budgetData, selectedTemplate)
      }
    } catch (error) {
      console.error('Erro ao baixar PDF:', error)
      alert('Erro ao baixar PDF')
    }
  }

  const handlePrint = async () => {
    try {
      if (useProfessionalPDF) {
        const docData = convertToDocumentData()
        const blob = await generateOrcamentoPDF(docData)
        const url = URL.createObjectURL(blob)

        // Create an iframe for printing
        const iframe = document.createElement('iframe')
        iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:none;'
        document.body.appendChild(iframe)

        iframe.onload = () => {
          setTimeout(() => {
            iframe.contentWindow?.focus()
            iframe.contentWindow?.print()
            setTimeout(() => {
              document.body.removeChild(iframe)
              URL.revokeObjectURL(url)
            }, 1000)
          }, 250)
        }

        iframe.src = url
      } else {
        budgetPDFService.printPDF(budgetData, selectedTemplate)
      }
    } catch (error) {
      console.error('Erro ao imprimir:', error)
      alert('Erro ao imprimir')
    }
  }

  const handleLoadTemplate = (filledHtml: string, template: any) => {
    setLoadedTemplateHtml(filledHtml)
    setShowTemplateSelector(false)

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${template.name}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            ${filledHtml}
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (onSave) {
        await onSave(budgetData)
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Error saving:', error)
      alert('Erro ao salvar orçamento')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">
                {readOnly ? 'Visualizar Orçamento' : 'Editor de Orçamento'}
              </h2>
              <div className="flex items-center gap-2">
                <p className="text-blue-100 text-sm">Nº {budgetData.number}</p>
                {loadingCompany && (
                  <span className="flex items-center gap-1 text-xs text-blue-200">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Carregando empresa...
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!readOnly && (
              <>
                <label className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg cursor-pointer hover:bg-white/20 transition-colors">
                  <input
                    type="checkbox"
                    checked={useProfessionalPDF}
                    onChange={e => setUseProfessionalPDF(e.target.checked)}
                    className="w-4 h-4 rounded border-white/30 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-white font-medium">PDF Profissional</span>
                </label>
                <button
                  onClick={() => setShowTemplateSelector(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  title="Carregar template do banco de dados"
                >
                  <FileText className="w-4 h-4" />
                  Carregar Template
                </button>
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Palette className="w-4 h-4" />
                  Templates
                </button>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {saved ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Salvo!
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {saving ? 'Salvando...' : 'Salvar'}
                    </>
                  )}
                </button>
              </>
            )}

            <button
              onClick={generatePreview}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Visualizar
            </button>

            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Baixar
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Templates Selector */}
        <AnimatePresence>
          {showTemplates && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-gray-50 border-b border-gray-200 px-6 py-4 overflow-hidden"
            >
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Selecione um Template</h3>
              <div className="grid grid-cols-4 gap-3">
                {defaultTemplates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedTemplate.id === template.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className="h-20 rounded mb-2"
                      style={{ backgroundColor: template.primaryColor }}
                    />
                    <p className="text-sm font-medium text-gray-900">{template.name}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Customer Info */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-blue-600" />
              Dados do Cliente
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome/Razão Social *
                </label>
                <input
                  type="text"
                  value={budgetData.customer.name}
                  onChange={e => setBudgetData(prev => ({
                    ...prev,
                    customer: { ...prev.customer, name: e.target.value }
                  }))}
                  disabled={readOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CPF/CNPJ *
                </label>
                <input
                  type="text"
                  value={budgetData.customer.document}
                  onChange={e => setBudgetData(prev => ({
                    ...prev,
                    customer: { ...prev.customer, document: e.target.value }
                  }))}
                  disabled={readOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={budgetData.customer.email}
                  onChange={e => setBudgetData(prev => ({
                    ...prev,
                    customer: { ...prev.customer, email: e.target.value }
                  }))}
                  disabled={readOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="text"
                  value={budgetData.customer.phone}
                  onChange={e => setBudgetData(prev => ({
                    ...prev,
                    customer: { ...prev.customer, phone: e.target.value }
                  }))}
                  disabled={readOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endereço
                </label>
                <input
                  type="text"
                  value={budgetData.customer.address || ''}
                  onChange={e => setBudgetData(prev => ({
                    ...prev,
                    customer: { ...prev.customer, address: e.target.value }
                  }))}
                  disabled={readOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder="Rua, número, bairro, cidade - UF"
                />
              </div>
            </div>
          </div>

          {/* Budget Info */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações do Orçamento</h3>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Emissão
                </label>
                <input
                  type="date"
                  value={format(new Date(budgetData.date), 'yyyy-MM-dd')}
                  onChange={e => setBudgetData(prev => ({
                    ...prev,
                    date: new Date(e.target.value).toISOString()
                  }))}
                  disabled={readOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Validade
                </label>
                <input
                  type="date"
                  value={format(new Date(budgetData.validUntil), 'yyyy-MM-dd')}
                  onChange={e => setBudgetData(prev => ({
                    ...prev,
                    validUntil: new Date(e.target.value).toISOString()
                  }))}
                  disabled={readOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Itens do Orçamento</h3>

            {!readOnly && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-3">Adicionar Item</h4>

                {/* Busca de Serviços do Catálogo */}
                <div className="mb-4 relative">
                  <label className="block text-sm font-medium text-blue-900 mb-2">
                    🔍 Buscar Serviço do Catálogo
                  </label>
                  <input
                    type="text"
                    placeholder="Digite o nome do serviço (mínimo 2 caracteres)..."
                    value={serviceSearch}
                    onChange={e => setServiceSearch(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />

                  {/* Dropdown com resultados */}
                  {showServiceSearch && filteredServices.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border-2 border-blue-300 rounded-lg shadow-xl max-h-96 overflow-y-auto">
                      {filteredServices.map((service) => (
                        <button
                          key={service.id}
                          onClick={() => selectServiceFromCatalog(service)}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-200 transition-colors"
                        >
                          <div className="font-semibold text-gray-900">{service.name}</div>
                          {service.description && (
                            <div className="text-sm text-gray-600 mt-1">{service.description}</div>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="text-blue-600 font-semibold">
                              R$ {service.base_price?.toFixed(2) || '0.00'}
                            </span>
                            {service.estimated_time_minutes && (
                              <span className="text-gray-500">
                                ⏱️ {service.estimated_time_minutes} min
                              </span>
                            )}
                            {service.service_catalog_materials?.length > 0 && (
                              <span className="text-green-600">
                                📦 {service.service_catalog_materials.length} materiais
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-sm text-gray-600 mb-3 px-2">
                  Ou preencha manualmente:
                </div>

                <div className="grid grid-cols-6 gap-3">
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Descrição"
                      value={newItem.description}
                      onChange={e => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Qtd"
                      value={newItem.quantity}
                      onChange={e => setNewItem(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Unid."
                      value={newItem.unit}
                      onChange={e => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Valor Unit."
                      value={newItem.unitPrice}
                      onChange={e => setNewItem(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <button
                      onClick={addItem}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Descrição</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Qtd</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Unid.</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Valor Unit.</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Total</th>
                    {!readOnly && <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {budgetData.items.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-center">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-center">{item.unit}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">R$ {item.unitPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">R$ {item.total.toFixed(2)}</td>
                      {!readOnly && (
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="max-w-md ml-auto space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium text-gray-900">R$ {budgetData.subtotal.toFixed(2)}</span>
              </div>

              {!readOnly && (
                <div className="flex gap-3 items-center text-sm">
                  <span className="text-gray-600">Desconto:</span>
                  <input
                    type="number"
                    value={budgetData.discount}
                    onChange={e => setBudgetData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                    className="w-24 px-3 py-1 border border-gray-300 rounded"
                  />
                  <select
                    value={budgetData.discountType}
                    onChange={e => setBudgetData(prev => ({ ...prev, discountType: e.target.value as 'percentage' | 'fixed' }))}
                    className="px-3 py-1 border border-gray-300 rounded"
                  >
                    <option value="percentage">%</option>
                    <option value="fixed">R$</option>
                  </select>
                </div>
              )}

              <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-200">
                <span className="text-gray-900">TOTAL:</span>
                <span className="text-blue-600">R$ {budgetData.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Terms & Observations */}
          {!readOnly && (
            <>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Condições de Pagamento</h3>
                <textarea
                  value={budgetData.paymentTerms}
                  onChange={e => setBudgetData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                  placeholder="Ex: 50% na assinatura do contrato e 50% na entrega"
                />
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Observações</h3>
                <textarea
                  value={budgetData.observations}
                  onChange={e => setBudgetData(prev => ({ ...prev, observations: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                  placeholder="Informações adicionais, garantias, prazos, etc."
                />
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && previewUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-lg shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Preview do Orçamento</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <iframe
                  src={previewUrl}
                  className="w-full h-full"
                  title="Preview do Orçamento"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <TemplateSelectorModal
          isOpen={showTemplateSelector}
          onClose={() => setShowTemplateSelector(false)}
          templateType="budget"
          data={{
            budget: {
              budget_number: budgetData.number,
              validity_date: budgetData.validUntil,
              total: budgetData.total
            },
            customer: {
              name: budgetData.customer.name,
              cpf_cnpj: budgetData.customer.document,
              email: budgetData.customer.email,
              phone: budgetData.customer.phone,
              address: budgetData.customer.address
            },
            company: {
              name: budgetData.company.name,
              cnpj: budgetData.company.document,
              email: budgetData.company.email,
              phone: budgetData.company.phone,
              address: budgetData.company.address
            },
            items: budgetData.items.map(item => ({
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unitPrice,
              total_price: item.total
            }))
          }}
          onSelect={handleLoadTemplate}
          title="Selecionar Template de Orçamento"
        />
      )}
    </div>
  )
}
