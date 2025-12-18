import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Download,
  Send,
  Copy,
  CheckCircle2,
  Clock,
  XCircle,
  Settings,
  Save,
  X,
  Upload,
  Palette,
  Building2,
  CreditCard,
  Award,
  FileCheck,
  ClipboardList,
  Shield,
  Printer
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

interface DocumentTemplate {
  id: string
  name: string
  description: string
  department: string
  category: string
  content_template: string
  fields: any[]
  is_active: boolean
}

interface GeneratedDocument {
  id: string
  template_id: string
  document_number: string
  document_type: string
  title: string
  customer_name: string
  data: any
  status: 'draft' | 'sent' | 'signed' | 'cancelled'
  created_at: string
  updated_at: string
}

interface CompanyConfig {
  id?: string
  company_name: string
  company_cnpj: string
  company_address: string
  company_city: string
  company_state: string
  company_phone: string
  company_email: string
  company_website?: string
  bank_name?: string
  bank_agency?: string
  bank_account?: string
  bank_pix?: string
  technical_manager?: string
  technical_register?: string
  primary_color: string
  secondary_color: string
  logo_url?: string
  default_footer?: string
}

type ViewMode = 'documents' | 'templates' | 'config'

const categoryIcons: Record<string, any> = {
  'PMOC': Shield,
  'Contrato': FileCheck,
  'Garantia': Award,
  'Relatório': FileText,
  'Laudo': ClipboardList,
  'Checklist': CheckCircle2,
  'Orçamento': CreditCard
}

const categoryColors: Record<string, string> = {
  'PMOC': 'from-green-500 to-emerald-600',
  'Contrato': 'from-blue-500 to-blue-600',
  'Garantia': 'from-purple-500 to-purple-600',
  'Relatório': 'from-orange-500 to-orange-600',
  'Laudo': 'from-red-500 to-red-600',
  'Checklist': 'from-cyan-500 to-cyan-600',
  'Orçamento': 'from-indigo-500 to-indigo-600'
}

export default function DocumentCenter() {
  const [viewMode, setViewMode] = useState<ViewMode>('documents')
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [documents, setDocuments] = useState<GeneratedDocument[]>([])
  const [companyConfig, setCompanyConfig] = useState<CompanyConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showGenerator, setShowGenerator] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [viewMode])

  const loadData = async () => {
    setLoading(true)
    try {
      if (viewMode === 'documents') {
        await loadDocuments()
      } else if (viewMode === 'templates') {
        await loadTemplates()
      } else if (viewMode === 'config') {
        await loadCompanyConfig()
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from('document_templates')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (error) throw error
    setTemplates(data || [])
  }

  const loadDocuments = async () => {
    const { data, error } = await supabase
      .from('generated_documents')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    setDocuments(data || [])
  }

  const loadCompanyConfig = async () => {
    const { data, error } = await supabase
      .from('company_document_config')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') throw error

    setCompanyConfig(data || {
      company_name: '',
      company_cnpj: '',
      company_address: '',
      company_city: '',
      company_state: '',
      company_phone: '',
      company_email: '',
      primary_color: '#2563eb',
      secondary_color: '#1e40af'
    })
  }

  const handleGenerateDocument = (template: DocumentTemplate) => {
    setSelectedTemplate(template)
    const initialData: Record<string, any> = {}
    template.fields.forEach((field: any) => {
      initialData[field.name] = field.type === 'date' ? format(new Date(), 'yyyy-MM-dd') : ''
    })
    setFormData(initialData)
    setShowGenerator(true)
  }

  const replaceTemplateVariables = (template: string, data: Record<string, any>) => {
    let result = template
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      result = result.replace(regex, data[key] || '')
    })
    return result
  }

  const generatePDF = async () => {
    if (!selectedTemplate || !companyConfig) return

    setSaving(true)
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 20

      doc.setFillColor(companyConfig.primary_color || '#2563eb')
      doc.rect(0, 0, pageWidth, 40, 'F')

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text(companyConfig.company_name, margin, 25)

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`${companyConfig.company_phone} | ${companyConfig.company_email}`, margin, 32)

      let yPosition = 55

      const content = replaceTemplateVariables(selectedTemplate.content_template, formData)
      const lines = content.split('\n')

      doc.setTextColor(0, 0, 0)

      lines.forEach((line) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage()
          yPosition = 20
        }

        if (line.startsWith('# ')) {
          doc.setFontSize(16)
          doc.setFont('helvetica', 'bold')
          doc.text(line.replace('# ', ''), margin, yPosition)
          yPosition += 10
        } else if (line.startsWith('## ')) {
          doc.setFontSize(14)
          doc.setFont('helvetica', 'bold')
          doc.text(line.replace('## ', ''), margin, yPosition)
          yPosition += 8
        } else if (line.startsWith('### ')) {
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.text(line.replace('### ', ''), margin, yPosition)
          yPosition += 7
        } else if (line.startsWith('**') && line.endsWith('**')) {
          doc.setFontSize(10)
          doc.setFont('helvetica', 'bold')
          doc.text(line.replace(/\*\*/g, ''), margin, yPosition)
          yPosition += 6
        } else if (line.trim() === '---') {
          doc.setDrawColor(200, 200, 200)
          doc.line(margin, yPosition, pageWidth - margin, yPosition)
          yPosition += 5
        } else if (line.trim() !== '') {
          doc.setFontSize(10)
          doc.setFont('helvetica', 'normal')
          const splitText = doc.splitTextToSize(line, pageWidth - (margin * 2))
          doc.text(splitText, margin, yPosition)
          yPosition += 5 * splitText.length
        } else {
          yPosition += 3
        }
      })

      if (companyConfig.default_footer) {
        doc.setFontSize(8)
        doc.setTextColor(128, 128, 128)
        doc.text(companyConfig.default_footer, pageWidth / 2, pageHeight - 10, { align: 'center' })
      }

      const { data: docNumberData } = await supabase.rpc('generate_document_number', {
        doc_type: selectedTemplate.category
      })

      const documentData = {
        template_id: selectedTemplate.id,
        document_number: docNumberData,
        document_type: selectedTemplate.category,
        title: selectedTemplate.name,
        customer_name: formData.cliente_nome || formData.contratante_nome || 'N/A',
        data: formData,
        status: 'draft'
      }

      const { data: savedDoc, error: saveError } = await supabase
        .from('generated_documents')
        .insert([documentData])
        .select()
        .single()

      if (saveError) throw saveError

      doc.save(`${documentData.document_number}.pdf`)

      await loadDocuments()
      setShowGenerator(false)
      setSelectedTemplate(null)
      setFormData({})

      alert('Documento gerado com sucesso!')
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Erro ao gerar documento')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveConfig = async () => {
    if (!companyConfig) return

    setSaving(true)
    try {
      const { data: existing } = await supabase
        .from('company_document_config')
        .select('id')
        .single()

      if (existing) {
        const { error } = await supabase
          .from('company_document_config')
          .update(companyConfig)
          .eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('company_document_config')
          .insert([companyConfig])
        if (error) throw error
      }

      alert('Configurações salvas com sucesso!')
    } catch (error) {
      console.error('Error saving config:', error)
      alert('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  const filteredTemplates = templates.filter(t =>
    (categoryFilter === 'all' || t.category === categoryFilter) &&
    (searchTerm === '' ||
     t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     t.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const filteredDocuments = documents.filter(d =>
    searchTerm === '' ||
    d.document_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const categories = Array.from(new Set(templates.map(t => t.category)))

  const stats = {
    total: documents.length,
    draft: documents.filter(d => d.status === 'draft').length,
    sent: documents.filter(d => d.status === 'sent').length,
    signed: documents.filter(d => d.status === 'signed').length
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Centro de Documentos
          </h1>
          <p className="text-gray-600">
            Gerencie templates e crie documentos profissionais
          </p>
        </div>
      </div>

      <div className="flex space-x-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setViewMode('documents')}
          className={`px-6 py-3 font-medium transition-all ${
            viewMode === 'documents'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileText className="inline w-5 h-5 mr-2" />
          Documentos Gerados
        </button>
        <button
          onClick={() => setViewMode('templates')}
          className={`px-6 py-3 font-medium transition-all ${
            viewMode === 'templates'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Edit className="inline w-5 h-5 mr-2" />
          Templates
        </button>
        <button
          onClick={() => setViewMode('config')}
          className={`px-6 py-3 font-medium transition-all ${
            viewMode === 'config'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Settings className="inline w-5 h-5 mr-2" />
          Configurações
        </button>
      </div>

      {viewMode === 'documents' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rascunhos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.draft}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Enviados</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.sent}</p>
                </div>
                <Send className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Assinados</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.signed}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar documentos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Número
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {doc.document_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {doc.document_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {doc.customer_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          doc.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                          doc.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                          doc.status === 'signed' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {doc.status === 'draft' ? 'Rascunho' :
                           doc.status === 'sent' ? 'Enviado' :
                           doc.status === 'signed' ? 'Assinado' : 'Cancelado'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {format(new Date(doc.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">
                          <Eye className="w-5 h-5" />
                        </button>
                        <button className="text-green-600 hover:text-green-900 mr-3">
                          <Download className="w-5 h-5" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {viewMode === 'templates' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todas Categorias</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => {
              const Icon = categoryIcons[template.category] || FileText
              const colorClass = categoryColors[template.category] || 'from-gray-500 to-gray-600'

              return (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer"
                  onClick={() => handleGenerateDocument(template)}
                >
                  <div className={`h-32 bg-gradient-to-br ${colorClass} p-6 flex items-center justify-center`}>
                    <Icon className="w-16 h-16 text-white" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {template.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                        {template.category}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleGenerateDocument(template)
                        }}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center"
                      >
                        Gerar <Plus className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}

      {viewMode === 'config' && companyConfig && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Configurações da Empresa
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Empresa
                </label>
                <input
                  type="text"
                  value={companyConfig.company_name}
                  onChange={(e) => setCompanyConfig({...companyConfig, company_name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CNPJ
                </label>
                <input
                  type="text"
                  value={companyConfig.company_cnpj}
                  onChange={(e) => setCompanyConfig({...companyConfig, company_cnpj: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endereço
                </label>
                <input
                  type="text"
                  value={companyConfig.company_address}
                  onChange={(e) => setCompanyConfig({...companyConfig, company_address: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cidade
                </label>
                <input
                  type="text"
                  value={companyConfig.company_city}
                  onChange={(e) => setCompanyConfig({...companyConfig, company_city: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <input
                  type="text"
                  value={companyConfig.company_state}
                  onChange={(e) => setCompanyConfig({...companyConfig, company_state: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone
                </label>
                <input
                  type="text"
                  value={companyConfig.company_phone}
                  onChange={(e) => setCompanyConfig({...companyConfig, company_phone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  value={companyConfig.company_email}
                  onChange={(e) => setCompanyConfig({...companyConfig, company_email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Responsável Técnico
                </label>
                <input
                  type="text"
                  value={companyConfig.technical_manager || ''}
                  onChange={(e) => setCompanyConfig({...companyConfig, technical_manager: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registro Profissional (CREA/CRT)
                </label>
                <input
                  type="text"
                  value={companyConfig.technical_register || ''}
                  onChange={(e) => setCompanyConfig({...companyConfig, technical_register: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banco
                </label>
                <input
                  type="text"
                  value={companyConfig.bank_name || ''}
                  onChange={(e) => setCompanyConfig({...companyConfig, bank_name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agência
                </label>
                <input
                  type="text"
                  value={companyConfig.bank_agency || ''}
                  onChange={(e) => setCompanyConfig({...companyConfig, bank_agency: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conta
                </label>
                <input
                  type="text"
                  value={companyConfig.bank_account || ''}
                  onChange={(e) => setCompanyConfig({...companyConfig, bank_account: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PIX
                </label>
                <input
                  type="text"
                  value={companyConfig.bank_pix || ''}
                  onChange={(e) => setCompanyConfig({...companyConfig, bank_pix: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cor Primária
                </label>
                <input
                  type="color"
                  value={companyConfig.primary_color}
                  onChange={(e) => setCompanyConfig({...companyConfig, primary_color: e.target.value})}
                  className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cor Secundária
                </label>
                <input
                  type="color"
                  value={companyConfig.secondary_color}
                  onChange={(e) => setCompanyConfig({...companyConfig, secondary_color: e.target.value})}
                  className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rodapé Padrão
                </label>
                <textarea
                  value={companyConfig.default_footer || ''}
                  onChange={(e) => setCompanyConfig({...companyConfig, default_footer: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveConfig}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Salvar Configurações
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {showGenerator && selectedTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowGenerator(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedTemplate.name}</h2>
                    <p className="text-blue-100 mt-1">{selectedTemplate.description}</p>
                  </div>
                  <button
                    onClick={() => setShowGenerator(false)}
                    className="text-white hover:text-gray-200"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedTemplate.fields.map((field: any) => (
                    <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.label}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          value={formData[field.name] || ''}
                          onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                          rows={4}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : field.type === 'date' ? (
                        <input
                          type="date"
                          value={formData[field.name] || ''}
                          onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <input
                          type="text"
                          value={formData[field.name] || ''}
                          onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                <button
                  onClick={() => setShowGenerator(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={generatePDF}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Printer className="w-5 h-5 mr-2" />
                      Gerar PDF
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
