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
  Printer,
  Share2,
  MessageSquare,
  History,
  Star,
  Users
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import DocumentEditor from '../components/DocumentEditor'
import VisualDocumentEditor from '../components/VisualDocumentEditor'

interface DocumentTemplate {
  id: string
  name: string
  description: string
  department: string
  category: string
  content_template: string
  contract_text?: string
  fields: any[]
  is_active: boolean
  logo_url?: string
  header_text?: string
  footer_text?: string
  layout_config?: any
  show_header?: boolean
  show_footer?: boolean
  show_logo?: boolean
  custom_css?: string
  custom_js?: string
  preview_data?: any
  custom_styles?: any
}

interface GeneratedDocument {
  id: string
  template_id: string
  document_number: string
  document_type: string
  title: string
  customer_name: string
  data: any
  html_content: string
  status: 'draft' | 'sent' | 'signed' | 'cancelled'
  version: number
  is_editable: boolean
  created_at: string
  updated_at: string
  last_edited_at: string
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
type EditorMode = 'create' | 'edit' | 'view'

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

const statusColors: Record<string, string> = {
  'draft': 'bg-yellow-100 text-yellow-800',
  'sent': 'bg-blue-100 text-blue-800',
  'signed': 'bg-green-100 text-green-800',
  'cancelled': 'bg-red-100 text-red-800'
}

const statusLabels: Record<string, string> = {
  'draft': 'Rascunho',
  'sent': 'Enviado',
  'signed': 'Assinado',
  'cancelled': 'Cancelado'
}

export default function DocumentCenter() {
  const [viewMode, setViewMode] = useState<ViewMode>('documents')
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [documents, setDocuments] = useState<GeneratedDocument[]>([])
  const [companyConfig, setCompanyConfig] = useState<CompanyConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showEditor, setShowEditor] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null)
  const [selectedDocument, setSelectedDocument] = useState<GeneratedDocument | null>(null)
  const [editorMode, setEditorMode] = useState<EditorMode>('create')
  const [saving, setSaving] = useState(false)
  const [showVisualEditor, setShowVisualEditor] = useState(false)

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
      .select(`
        id,
        name,
        description,
        department,
        category,
        content_template,
        contract_text,
        fields,
        is_active,
        logo_url,
        header_text,
        footer_text,
        layout_config,
        show_header,
        show_footer,
        show_logo,
        custom_css,
        custom_js,
        preview_data,
        created_at,
        updated_at
      `)
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      console.error('❌ Error loading templates:', error)
      throw error
    }

    console.log('✅ Loaded templates:', data?.length || 0)
    if (data && data.length > 0) {
      console.log('📄 First template sample:', {
        name: data[0].name,
        has_content: !!data[0].content_template,
        content_length: data[0].content_template?.length || 0,
        has_header: !!data[0].header_text,
        has_footer: !!data[0].footer_text,
        has_logo: !!data[0].logo_url
      })
    }

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

  const handleCreateDocument = (template: DocumentTemplate, useVisual = false) => {
    console.log('🎯 handleCreateDocument called:', {
      template_name: template.name,
      useVisual,
      has_content: !!template.content_template,
      content_length: template.content_template?.length || 0,
      has_header: !!template.header_text,
      has_footer: !!template.footer_text
    })

    setSelectedTemplate(template)
    setSelectedDocument(null)
    setEditorMode('create')

    if (useVisual) {
      console.log('✨ Opening Visual Editor with template:', template.name)
      setShowVisualEditor(true)
    } else {
      console.log('📝 Opening Simple Editor')
      setShowEditor(true)
    }
  }

  const handleCreateDocumentVisual = (template: DocumentTemplate) => {
    handleCreateDocument(template, true)
  }

  const handleViewDocument = (document: GeneratedDocument) => {
    setSelectedDocument(document)
    setSelectedTemplate(null)
    setEditorMode('view')
    setShowEditor(true)
  }

  const handleEditDocument = (document: GeneratedDocument) => {
    setSelectedDocument(document)
    setSelectedTemplate(null)
    setEditorMode('edit')
    setShowEditor(true)
  }

  const handleDeleteDocument = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return

    try {
      const { error } = await supabase
        .from('generated_documents')
        .delete()
        .eq('id', id)

      if (error) throw error

      alert('Documento excluído com sucesso!')
      await loadDocuments()
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Erro ao excluir documento')
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
    (statusFilter === 'all' || d.status === statusFilter) &&
    (searchTerm === '' ||
     d.document_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
     d.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     d.title.toLowerCase().includes(searchTerm.toLowerCase()))
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
            Centro de Documentos Empresarial
          </h1>
          <p className="text-gray-600">
            Crie, edite e gerencie todos os documentos da empresa com editor visual
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
          Documentos ({documents.length})
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
          Templates ({templates.length})
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
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos Status</option>
                  <option value="draft">Rascunhos</option>
                  <option value="sent">Enviados</option>
                  <option value="signed">Assinados</option>
                  <option value="cancelled">Cancelados</option>
                </select>
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
                      Título
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Versão
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {doc.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {doc.customer_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {doc.document_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[doc.status]}`}>
                          {statusLabels[doc.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        v{doc.version}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {format(new Date(doc.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleViewDocument(doc)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Visualizar"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          {doc.is_editable && (
                            <button
                              onClick={() => handleEditDocument(doc)}
                              className="text-green-600 hover:text-green-900"
                              title="Editar"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Excluir"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredDocuments.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-medium">Nenhum documento encontrado</p>
                        <p className="text-sm mt-2">Crie seu primeiro documento a partir de um template</p>
                      </td>
                    </tr>
                  )}
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
                  className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer group"
                >
                  <div className={`h-32 bg-gradient-to-br ${colorClass} p-6 flex items-center justify-center`}>
                    <Icon className="w-16 h-16 text-white" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {template.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                        {template.category}
                      </span>
                      <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleCreateDocument(template)}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center"
                          title="Editor Simples"
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Simples
                        </button>
                        <button
                          onClick={() => handleCreateDocumentVisual(template)}
                          className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium flex items-center"
                          title="Editor Visual (Canva)"
                        >
                          <Palette className="w-4 h-4 mr-1" />
                          Visual
                        </button>
                      </div>
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

      {showEditor && (
        <DocumentEditor
          document={selectedDocument}
          template={selectedTemplate}
          mode={editorMode}
          onClose={() => {
            setShowEditor(false)
            setSelectedDocument(null)
            setSelectedTemplate(null)
          }}
          onSave={() => {
            loadDocuments()
          }}
        />
      )}

      {showVisualEditor && selectedTemplate && (
        <VisualDocumentEditor
          template={selectedTemplate}
          onClose={() => {
            setShowVisualEditor(false)
            setSelectedDocument(null)
            setSelectedTemplate(null)
          }}
          onSave={() => {
            loadDocuments()
            loadTemplates()
          }}
        />
      )}
    </div>
  )
}
