import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Plus, Search, Filter, Eye, FileEdit as Edit, Trash2, Download, Send, Copy, CheckCircle2, Clock, X, Save, Upload, Palette, Building2, CreditCard, Award, FileCheck, ClipboardList, Shield, Printer, Share2, History, Star, Users, CheckSquare, Square, FolderOpen, Layers, Settings, ChevronRight, ChevronDown, LayoutGrid, List, BookOpen, FileSignature, QrCode, Zap, AlertCircle, Lock, Unlock, RefreshCw, ArrowRight, Tag, PenLine, CornerDownRight, GripVertical } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import DocumentEditor from '../components/DocumentEditor'
import AdvancedDocumentEditorPro from '../components/AdvancedDocumentEditorPro'

/* ─── Types ────────────────────────────────────────────────────── */
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
  preview_data?: any
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
  created_at: string
  updated_at: string
}

interface ContractTemplate {
  id: string
  name: string
  is_default: boolean
  contract_text: string
  contract_clauses: string
  warranty_terms: string
  payment_conditions: string
  bank_details_template: string
  active: boolean
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

/* ─── Constants ─────────────────────────────────────────────────── */
type Panel = 'repository' | 'templates' | 'contracts' | 'config'

const FOLDER_ITEMS: { id: Panel; label: string; icon: React.ElementType; count?: number }[] = [
  { id: 'repository', label: 'Repositório de OS', icon: FolderOpen },
  { id: 'templates', label: 'Fábrica de Modelos', icon: Layers },
  { id: 'contracts', label: 'Contratos de OS', icon: FileSignature },
  { id: 'config', label: 'Configurações', icon: Settings },
]

const CATEGORY_COLORS: Record<string, string> = {
  'PMOC': 'from-emerald-500 to-green-600',
  'Contrato': 'from-blue-500 to-blue-700',
  'Garantia': 'from-amber-500 to-orange-600',
  'Relatório': 'from-orange-500 to-red-500',
  'Laudo': 'from-rose-500 to-red-600',
  'Checklist': 'from-cyan-500 to-sky-600',
  'Orçamento': 'from-teal-500 to-teal-700',
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'PMOC': Shield,
  'Contrato': FileCheck,
  'Garantia': Award,
  'Relatório': FileText,
  'Laudo': ClipboardList,
  'Checklist': CheckCircle2,
  'Orçamento': CreditCard,
}

const STATUS_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Rascunho', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
  sent: { label: 'Enviado', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Send },
  signed: { label: 'Assinado', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2 },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-200', icon: X },
}

const DYNAMIC_VARS = [
  { key: '{{nome_cliente}}', label: 'Nome do Cliente' },
  { key: '{{cpf_cnpj}}', label: 'CPF / CNPJ' },
  { key: '{{valor_total}}', label: 'Valor Total' },
  { key: '{{numero_os}}', label: 'Número da OS' },
  { key: '{{data_atual}}', label: 'Data Atual' },
  { key: '{{garantia_dias}}', label: 'Garantia (dias)' },
  { key: '{{tecnico_nome}}', label: 'Nome do Técnico' },
  { key: '{{empresa_nome}}', label: 'Nome da Empresa' },
]

const SMART_CLAUSES = [
  {
    title: 'Garantia Técnica (CDC)',
    content: 'O serviço executado possui garantia técnica de 90 (noventa) dias, conforme disposto no artigo 26 do Código de Defesa do Consumidor (Lei nº 8.078/90), contados a partir da data de conclusão do serviço.',
    color: 'bg-green-50 border-green-300 text-green-800',
  },
  {
    title: 'Exclusões de Cobertura',
    content: 'Ficam excluídos da garantia: danos causados por mau uso, acidentes, instalações elétricas inadequadas, tensão fora do padrão, inundações, raios, ou qualquer intervenção realizada por terceiros não autorizados.',
    color: 'bg-amber-50 border-amber-300 text-amber-800',
  },
  {
    title: 'Responsabilidade Técnica',
    content: 'Todos os serviços são executados por profissionais habilitados e registrados no órgão competente, seguindo as normas NBR aplicáveis e os padrões técnicos do fabricante.',
    color: 'bg-blue-50 border-blue-300 text-blue-800',
  },
]

/* ─── Component ─────────────────────────────────────────────────── */
export default function GiartechDocs() {
  const [activePanel, setActivePanel] = useState<Panel>('repository')
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [documents, setDocuments] = useState<GeneratedDocument[]>([])
  const [contractTemplates, setContractTemplates] = useState<ContractTemplate[]>([])
  const [companyConfig, setCompanyConfig] = useState<CompanyConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid')
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set())
  const [showAdvancedEditor, setShowAdvancedEditor] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null)
  const [selectedDocument, setSelectedDocument] = useState<GeneratedDocument | null>(null)
  const [editorMode, setEditorMode] = useState<'create' | 'edit' | 'view'>('create')
  const [editingContractId, setEditingContractId] = useState<string | null>(null)
  const [contractForm, setContractForm] = useState<Partial<ContractTemplate>>({})
  const [saving, setSaving] = useState(false)
  const [expandedClause, setExpandedClause] = useState<number | null>(null)
  const [copiedClause, setCopiedClause] = useState<number | null>(null)

  useEffect(() => {
    loadAll()
  }, [])

  useEffect(() => {
    if (activePanel === 'repository') loadDocuments()
    else if (activePanel === 'templates') loadDocTemplates()
    else if (activePanel === 'contracts') loadContractTemplates()
    else if (activePanel === 'config') loadCompanyConfig()
  }, [activePanel])

  const loadAll = async () => {
    setLoading(true)
    await Promise.all([loadDocuments(), loadDocTemplates(), loadContractTemplates()])
    setLoading(false)
  }

  const loadDocTemplates = async () => {
    const { data } = await supabase
      .from('document_templates')
      .select('id,name,description,department,category,content_template,contract_text,fields,is_active,logo_url,header_text,footer_text,layout_config,show_header,show_footer,show_logo,custom_css,preview_data')
      .eq('is_active', true)
      .order('category')
      .order('name')
    setTemplates(data || [])
  }

  const loadDocuments = async () => {
    const { data } = await supabase
      .from('generated_documents')
      .select('*')
      .order('created_at', { ascending: false })
    setDocuments(data || [])
  }

  const loadContractTemplates = async () => {
    const { data } = await supabase
      .from('contract_templates')
      .select('*')
      .eq('active', true)
      .order('is_default', { ascending: false })
      .order('name')
    setContractTemplates(data || [])
  }

  const loadCompanyConfig = async () => {
    const { data } = await supabase.from('company_document_config').select('*').maybeSingle()
    setCompanyConfig(data || {
      company_name: '', company_cnpj: '', company_address: '',
      company_city: '', company_state: '', company_phone: '',
      company_email: '', primary_color: '#2563eb', secondary_color: '#1e40af',
    })
  }

  const handleCreateFromTemplate = (tpl: DocumentTemplate) => {
    setSelectedTemplate(tpl)
    setSelectedDocument(null)
    setEditorMode('create')
    setShowAdvancedEditor(true)
  }

  const handleViewDocument = (doc: GeneratedDocument) => {
    setSelectedDocument(doc)
    setSelectedTemplate(null)
    setEditorMode('view')
    setShowAdvancedEditor(true)
  }

  const handleEditDocument = (doc: GeneratedDocument) => {
    setSelectedDocument(doc)
    setSelectedTemplate(null)
    setEditorMode('edit')
    setShowAdvancedEditor(true)
  }

  const handleDeleteDocument = async (id: string) => {
    if (!confirm('Confirmar exclusão do documento?')) return
    await supabase.from('generated_documents').delete().eq('id', id)
    await loadDocuments()
    setSelectedDocIds(prev => { const s = new Set(prev); s.delete(id); return s })
  }

  const toggleDocSelect = (id: string) => {
    setSelectedDocIds(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  const handleSaveContractTemplate = async () => {
    if (!editingContractId) return
    setSaving(true)
    try {
      if (contractForm.is_default) {
        await supabase.from('contract_templates').update({ is_default: false }).neq('id', editingContractId)
      }
      await supabase.from('contract_templates')
        .update({ ...contractForm, updated_at: new Date().toISOString() })
        .eq('id', editingContractId)
      await loadContractTemplates()
      setEditingContractId(null)
      setContractForm({})
    } finally {
      setSaving(false)
    }
  }

  const handleSetDefaultContract = async (id: string) => {
    await supabase.from('contract_templates').update({ is_default: false }).neq('id', id)
    await supabase.from('contract_templates').update({ is_default: true }).eq('id', id)
    await loadContractTemplates()
  }

  const handleCopyClause = (idx: number, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedClause(idx)
    setTimeout(() => setCopiedClause(null), 2000)
  }

  const handleSaveCompanyConfig = async () => {
    if (!companyConfig) return
    setSaving(true)
    try {
      if (companyConfig.id) {
        await supabase.from('company_document_config').update(companyConfig).eq('id', companyConfig.id)
      } else {
        const { data } = await supabase.from('company_document_config').insert(companyConfig).select().maybeSingle()
        if (data) setCompanyConfig(data)
      }
    } finally {
      setSaving(false)
    }
  }

  /* ─── Filtered data ──────────────────────────────────────────── */
  const filteredDocs = documents.filter(d => {
    const matchSearch = !searchTerm ||
      d.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.document_number?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = statusFilter === 'all' || d.status === statusFilter
    return matchSearch && matchStatus
  })

  const filteredTemplates = templates.filter(t => {
    const matchSearch = !searchTerm || t.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCat = categoryFilter === 'all' || t.category === categoryFilter
    return matchSearch && matchCat
  })

  const categories = Array.from(new Set(templates.map(t => t.category).filter(Boolean)))

  /* ─── Panel counts ───────────────────────────────────────────── */
  const panelCounts: Record<Panel, number> = {
    repository: documents.length,
    templates: templates.length,
    contracts: contractTemplates.length,
    config: 0,
  }

  /* ─── Render ─────────────────────────────────────────────────── */
  if (showAdvancedEditor) {
    return (
      <AdvancedDocumentEditorPro
        template={selectedTemplate || undefined}
        document={selectedDocument || undefined}
        mode={editorMode}
        onClose={() => { setShowAdvancedEditor(false); loadDocuments() }}
        onSave={() => { setShowAdvancedEditor(false); loadDocuments() }}
      />
    )
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 overflow-hidden">

      {/* ── Left Navigation Panel ──────────────────────────────── */}
      <aside className="w-64 shrink-0 flex flex-col bg-white/70 backdrop-blur-xl border-r border-blue-100/60 shadow-xl">
        {/* Header */}
        <div className="px-5 pt-6 pb-4 border-b border-blue-100/60">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800 leading-tight">Giartech Docs</h1>
              <p className="text-xs text-slate-500">Central de documentos</p>
            </div>
          </div>
        </div>

        {/* Folder tree */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-2 mb-2">Pastas</p>
          {FOLDER_ITEMS.map(item => {
            const Icon = item.icon
            const active = activePanel === item.id
            const count = panelCounts[item.id]
            return (
              <button
                key={item.id}
                onClick={() => { setActivePanel(item.id); setSearchTerm(''); setCategoryFilter('all'); setStatusFilter('all') }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                  active
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                    : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`} />
                <span className="flex-1 text-left truncate">{item.label}</span>
                {count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    active ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}

          {/* Smart Clauses section */}
          <div className="mt-6">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-2 mb-2">Cláusulas Prontas</p>
            {SMART_CLAUSES.map((clause, idx) => (
              <div key={idx} className="mb-1">
                <button
                  onClick={() => setExpandedClause(expandedClause === idx ? null : idx)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <GripVertical className="w-3 h-3 text-slate-300 shrink-0" />
                  <span className="flex-1 text-left truncate">{clause.title}</span>
                  <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${expandedClause === idx ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {expandedClause === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className={`mx-2 mb-1 p-2.5 rounded-lg border text-[10px] leading-relaxed ${clause.color}`}>
                        <p className="mb-2">{clause.content}</p>
                        <button
                          onClick={() => handleCopyClause(idx, clause.content)}
                          className="flex items-center gap-1 text-[10px] font-semibold opacity-80 hover:opacity-100 transition-opacity"
                        >
                          {copiedClause === idx ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copiedClause === idx ? 'Copiado!' : 'Copiar'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Variables reference */}
          <div className="mt-4">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-2 mb-2">Variáveis Dinâmicas</p>
            <div className="px-2 space-y-1">
              {DYNAMIC_VARS.map(v => (
                <div key={v.key} className="flex items-center justify-between gap-1">
                  <code className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono truncate">{v.key}</code>
                  <button
                    onClick={() => { navigator.clipboard.writeText(v.key) }}
                    title="Copiar variável"
                    className="p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors shrink-0"
                  >
                    <Copy className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </nav>

        {/* Bottom stats */}
        <div className="px-4 py-3 border-t border-blue-100/60 bg-gradient-to-r from-blue-600/5 to-blue-800/5">
          <div className="grid grid-cols-3 gap-1 text-center">
            <div>
              <p className="text-sm font-bold text-blue-700">{documents.length}</p>
              <p className="text-[9px] text-slate-500">Docs</p>
            </div>
            <div>
              <p className="text-sm font-bold text-blue-700">{templates.length}</p>
              <p className="text-[9px] text-slate-500">Modelos</p>
            </div>
            <div>
              <p className="text-sm font-bold text-blue-700">{contractTemplates.length}</p>
              <p className="text-[9px] text-slate-500">Contratos</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Right Work Area ────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="shrink-0 bg-white/60 backdrop-blur-md border-b border-blue-100/60 px-6 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Giartech Docs</span>
            <ChevronRight className="w-3 h-3" />
            <span className="font-semibold text-slate-700">
              {FOLDER_ITEMS.find(f => f.id === activePanel)?.label}
            </span>
          </div>

          <div className="flex-1" />

          {/* Search */}
          {activePanel !== 'config' && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar..."
                className="pl-8 pr-3 py-1.5 text-sm bg-white border border-blue-100 rounded-lg w-52 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all"
              />
            </div>
          )}

          {/* Category filter */}
          {activePanel === 'templates' && (
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="text-sm border border-blue-100 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="all">Todas as categorias</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}

          {/* Status filter */}
          {activePanel === 'repository' && (
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-sm border border-blue-100 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="all">Todos os status</option>
              <option value="draft">Rascunho</option>
              <option value="sent">Enviado</option>
              <option value="signed">Assinado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          )}

          {/* View toggle */}
          {(activePanel === 'repository' || activePanel === 'templates') && (
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => setViewLayout('grid')}
                className={`p-1.5 rounded-md transition-colors ${viewLayout === 'grid' ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewLayout('list')}
                className={`p-1.5 rounded-md transition-colors ${viewLayout === 'list' ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            onClick={() => {
              if (activePanel === 'repository') loadDocuments()
              else if (activePanel === 'templates') loadDocTemplates()
              else if (activePanel === 'contracts') loadContractTemplates()
            }}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activePanel}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {activePanel === 'repository' && (
                  <RepositoryPanel
                    documents={filteredDocs}
                    viewLayout={viewLayout}
                    selectedDocIds={selectedDocIds}
                    onToggleSelect={toggleDocSelect}
                    onView={handleViewDocument}
                    onEdit={handleEditDocument}
                    onDelete={handleDeleteDocument}
                  />
                )}
                {activePanel === 'templates' && (
                  <TemplatesPanel
                    templates={filteredTemplates}
                    viewLayout={viewLayout}
                    onUse={handleCreateFromTemplate}
                  />
                )}
                {activePanel === 'contracts' && (
                  <ContractsPanel
                    templates={contractTemplates}
                    editingId={editingContractId}
                    form={contractForm}
                    saving={saving}
                    onEdit={(t) => { setEditingContractId(t.id); setContractForm(t) }}
                    onCancel={() => { setEditingContractId(null); setContractForm({}) }}
                    onSave={handleSaveContractTemplate}
                    onSetDefault={handleSetDefaultContract}
                    onFormChange={(data) => setContractForm(data)}
                  />
                )}
                {activePanel === 'config' && (
                  <ConfigPanel
                    config={companyConfig}
                    saving={saving}
                    onChange={setCompanyConfig}
                    onSave={handleSaveCompanyConfig}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   SUB-PANELS
══════════════════════════════════════════════════════════════════ */

/* ── Repository Panel ──────────────────────────────────────────── */
function RepositoryPanel({
  documents, viewLayout, selectedDocIds, onToggleSelect, onView, onEdit, onDelete
}: {
  documents: GeneratedDocument[]
  viewLayout: 'grid' | 'list'
  selectedDocIds: Set<string>
  onToggleSelect: (id: string) => void
  onView: (doc: GeneratedDocument) => void
  onEdit: (doc: GeneratedDocument) => void
  onDelete: (id: string) => void
}) {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mb-4 shadow-inner">
          <FolderOpen className="w-9 h-9 text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700 mb-1">Repositório vazio</h3>
        <p className="text-sm text-slate-400 max-w-xs">Crie documentos a partir dos modelos disponíveis na aba "Fábrica de Modelos".</p>
        <div className="mt-4 flex items-center gap-2 text-xs text-blue-600 font-medium">
          <ArrowRight className="w-3.5 h-3.5" />
          Vá para Fábrica de Modelos
        </div>
      </div>
    )
  }

  if (viewLayout === 'list') {
    return (
      <div className="bg-white/70 backdrop-blur rounded-2xl border border-blue-100/60 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
              <th className="w-8 px-3 py-3" />
              <th className="px-4 py-3 text-left font-semibold">Documento</th>
              <th className="px-4 py-3 text-left font-semibold">Cliente</th>
              <th className="px-4 py-3 text-left font-semibold">Tipo</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Data</th>
              <th className="px-3 py-3 text-center font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc, idx) => {
              const sm = STATUS_META[doc.status] || STATUS_META.draft
              const StatusIcon = sm.icon
              return (
                <tr key={doc.id} className={`border-b border-blue-50 hover:bg-blue-50/40 transition-colors ${idx % 2 === 0 ? '' : 'bg-slate-50/30'}`}>
                  <td className="px-3 py-3">
                    <button onClick={() => onToggleSelect(doc.id)}>
                      {selectedDocIds.has(doc.id)
                        ? <CheckSquare className="w-4 h-4 text-blue-600" />
                        : <Square className="w-4 h-4 text-slate-300" />}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{doc.title || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{doc.customer_name || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{doc.document_type || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${sm.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {sm.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {format(new Date(doc.created_at), "dd/MM/yy", { locale: ptBR })}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => onView(doc)} className="p-1.5 rounded-lg hover:bg-blue-100 text-slate-400 hover:text-blue-600 transition-colors" title="Visualizar">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => onEdit(doc)} className="p-1.5 rounded-lg hover:bg-amber-100 text-slate-400 hover:text-amber-600 transition-colors" title="Editar">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => onDelete(doc.id)} className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors" title="Excluir">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {documents.map(doc => {
        const sm = STATUS_META[doc.status] || STATUS_META.draft
        const StatusIcon = sm.icon
        const isSelected = selectedDocIds.has(doc.id)
        return (
          <motion.div
            key={doc.id}
            layout
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative bg-white/80 backdrop-blur rounded-2xl border transition-all duration-150 shadow-sm hover:shadow-md cursor-pointer group ${
              isSelected ? 'border-blue-400 ring-2 ring-blue-200' : 'border-blue-100/60 hover:border-blue-300'
            }`}
          >
            {/* Selection checkbox */}
            <button
              onClick={() => onToggleSelect(doc.id)}
              className="absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {isSelected
                ? <CheckSquare className="w-4 h-4 text-blue-600" />
                : <Square className="w-4 h-4 text-slate-400 bg-white rounded" />}
            </button>

            {/* Status badge */}
            <div className={`absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sm.color}`}>
              <StatusIcon className="w-2.5 h-2.5" />
              {sm.label}
            </div>

            {/* Header bar */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-t-2xl px-4 pt-5 pb-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center mb-2">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <p className="text-white font-semibold text-sm leading-tight line-clamp-2">{doc.title || 'Documento sem título'}</p>
              <p className="text-blue-200 text-xs mt-0.5 font-mono">{doc.document_number || '—'}</p>
            </div>

            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-sm text-slate-600 truncate">{doc.customer_name || 'Cliente não definido'}</span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-xs text-slate-400">
                  {format(new Date(doc.created_at), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                </span>
              </div>

              {/* Signature indicators */}
              <div className="flex gap-2 mb-4">
                <div className={`flex-1 flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-lg font-medium ${doc.data?.assinatura_tecnico ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-slate-50 text-slate-400 border border-slate-200'}`}>
                  {doc.data?.assinatura_tecnico ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                  Técnico
                </div>
                <div className={`flex-1 flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-lg font-medium ${doc.data?.assinatura_cliente ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-slate-50 text-slate-400 border border-slate-200'}`}>
                  {doc.data?.assinatura_cliente ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                  Cliente
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onView(doc)}
                  className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Ver
                </button>
                <button
                  onClick={() => onEdit(doc)}
                  className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Editar
                </button>
                <button
                  onClick={() => onDelete(doc.id)}
                  className="p-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

/* ── Templates Panel ───────────────────────────────────────────── */
function TemplatesPanel({
  templates, viewLayout, onUse
}: {
  templates: DocumentTemplate[]
  viewLayout: 'grid' | 'list'
  onUse: (t: DocumentTemplate) => void
}) {
  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mb-4 shadow-inner">
          <Layers className="w-9 h-9 text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700 mb-1">Nenhum modelo disponível</h3>
        <p className="text-sm text-slate-400 max-w-xs">Os modelos são configurados no banco de dados na tabela document_templates.</p>
      </div>
    )
  }

  const grouped = templates.reduce((acc, t) => {
    const cat = t.category || 'Outros'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(t)
    return acc
  }, {} as Record<string, DocumentTemplate[]>)

  if (viewLayout === 'list') {
    return (
      <div className="space-y-4">
        {Object.entries(grouped).map(([cat, items]) => {
          const Icon = CATEGORY_ICONS[cat] || FileText
          const gradient = CATEGORY_COLORS[cat] || 'from-slate-500 to-slate-600'
          return (
            <div key={cat} className="bg-white/70 backdrop-blur rounded-2xl border border-blue-100/60 overflow-hidden shadow-sm">
              <div className={`bg-gradient-to-r ${gradient} px-4 py-2.5 flex items-center gap-2`}>
                <Icon className="w-4 h-4 text-white" />
                <span className="text-white font-semibold text-sm">{cat}</span>
                <span className="ml-auto text-white/70 text-xs">{items.length} modelo{items.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="divide-y divide-blue-50">
                {items.map(t => (
                  <div key={t.id} className="flex items-center gap-4 px-4 py-3 hover:bg-blue-50/40 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{t.name}</p>
                      {t.description && <p className="text-xs text-slate-500 truncate mt-0.5">{t.description}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      {t.fields?.length > 0 && (
                        <span className="flex items-center gap-0.5 bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md font-medium">
                          <Zap className="w-2.5 h-2.5" />
                          {t.fields.length} vars
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => onUse(t)}
                      className="ml-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Usar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([cat, items]) => {
        const Icon = CATEGORY_ICONS[cat] || FileText
        const gradient = CATEGORY_COLORS[cat] || 'from-slate-500 to-slate-600'
        return (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow`}>
                <Icon className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-700">{cat}</span>
              <span className="text-xs text-slate-400">({items.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {items.map(t => (
                <motion.div
                  key={t.id}
                  layout
                  whileHover={{ y: -2 }}
                  className="bg-white/80 backdrop-blur rounded-2xl border border-blue-100/60 shadow-sm hover:shadow-md overflow-hidden transition-shadow group"
                >
                  <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow shrink-0`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm leading-tight">{t.name}</p>
                        {t.department && <p className="text-[10px] text-slate-400 mt-0.5">{t.department}</p>}
                      </div>
                    </div>
                    {t.description && (
                      <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-2">{t.description}</p>
                    )}

                    {/* Variable chips */}
                    {t.fields && t.fields.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {t.fields.slice(0, 3).map((f: any, i: number) => (
                          <span key={i} className="text-[9px] bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded-md font-mono">
                            {`{{${f.name || f.key || f}}}`}
                          </span>
                        ))}
                        {t.fields.length > 3 && (
                          <span className="text-[9px] text-slate-400 px-1.5 py-0.5">+{t.fields.length - 3}</span>
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => onUse(t)}
                      className="w-full py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Criar com este modelo
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Contracts Panel ───────────────────────────────────────────── */
function ContractsPanel({
  templates, editingId, form, saving, onEdit, onCancel, onSave, onSetDefault, onFormChange
}: {
  templates: ContractTemplate[]
  editingId: string | null
  form: Partial<ContractTemplate>
  saving: boolean
  onEdit: (t: ContractTemplate) => void
  onCancel: () => void
  onSave: () => void
  onSetDefault: (id: string) => void
  onFormChange: (data: Partial<ContractTemplate>) => void
}) {
  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mb-4 shadow-inner">
          <FileSignature className="w-9 h-9 text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700 mb-1">Nenhum contrato de OS encontrado</h3>
        <p className="text-sm text-slate-400 max-w-xs">Os contratos de OS são criados na tabela contract_templates do banco de dados.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>Use variáveis como <code className="bg-amber-100 px-1 rounded">[NOME_CLIENTE]</code>, <code className="bg-amber-100 px-1 rounded">[VALOR_TOTAL]</code>, <code className="bg-amber-100 px-1 rounded">[NUMERO_OS]</code> para substituição automática.</span>
      </div>

      {templates.map(template => (
        <motion.div
          key={template.id}
          layout
          className="bg-white/80 backdrop-blur rounded-2xl border border-blue-100/60 shadow-sm overflow-hidden"
        >
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSignature className="w-5 h-5 text-white" />
              <div>
                <p className="text-white font-semibold text-sm">{template.name}</p>
                {template.is_default && (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full mt-0.5">
                    <Star className="w-2.5 h-2.5" /> Padrão
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!template.is_default && editingId !== template.id && (
                <button
                  onClick={() => onSetDefault(template.id)}
                  className="px-3 py-1.5 text-xs bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors flex items-center gap-1"
                >
                  <Star className="w-3 h-3" /> Definir Padrão
                </button>
              )}
              {editingId === template.id ? (
                <>
                  <button
                    onClick={onSave}
                    disabled={saving}
                    className="px-3 py-1.5 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    <Save className="w-3 h-3" />
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button
                    onClick={onCancel}
                    className="px-3 py-1.5 text-xs bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Cancelar
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onEdit(template)}
                  className="px-3 py-1.5 text-xs bg-white text-blue-700 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1 font-medium"
                >
                  <Edit className="w-3 h-3" /> Editar
                </button>
              )}
            </div>
          </div>

          <div className="p-5">
            {editingId === template.id ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nome do Template</label>
                    <input
                      type="text"
                      value={form.name || ''}
                      onChange={e => onFormChange({ ...form, name: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <input
                      type="checkbox"
                      id={`default-${template.id}`}
                      checked={form.is_default || false}
                      onChange={e => onFormChange({ ...form, is_default: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <label htmlFor={`default-${template.id}`} className="text-sm text-slate-600">Definir como padrão</label>
                  </div>
                </div>

                {[
                  { key: 'contract_text', label: 'Texto do Contrato Principal', rows: 8 },
                  { key: 'contract_clauses', label: 'Cláusulas Contratuais', rows: 6 },
                  { key: 'warranty_terms', label: 'Termos de Garantia', rows: 4 },
                  { key: 'payment_conditions', label: 'Condições de Pagamento', rows: 4 },
                  { key: 'bank_details_template', label: 'Dados Bancários', rows: 3 },
                ].map(({ key, label, rows }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
                    <textarea
                      value={(form as any)[key] || ''}
                      onChange={e => onFormChange({ ...form, [key]: e.target.value })}
                      rows={rows}
                      className="w-full px-3 py-2 text-sm border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono resize-y"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'contract_text', label: 'Contrato Principal', color: 'bg-blue-50 border-blue-200 text-blue-800' },
                  { key: 'contract_clauses', label: 'Cláusulas', color: 'bg-slate-50 border-slate-200 text-slate-700' },
                  { key: 'warranty_terms', label: 'Garantia', color: 'bg-green-50 border-green-200 text-green-800' },
                  { key: 'payment_conditions', label: 'Pagamento', color: 'bg-amber-50 border-amber-200 text-amber-800' },
                ].map(({ key, label, color }) => {
                  const val = (template as any)[key]
                  if (!val) return null
                  return (
                    <div key={key} className={`border rounded-xl p-3 ${color}`}>
                      <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5 opacity-70">{label}</p>
                      <p className="text-xs leading-relaxed line-clamp-4">{val}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

/* ── Config Panel ──────────────────────────────────────────────── */
function ConfigPanel({
  config, saving, onChange, onSave
}: {
  config: CompanyConfig | null
  saving: boolean
  onChange: (c: CompanyConfig) => void
  onSave: () => void
}) {
  if (!config) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
    </div>
  )

  const update = (key: keyof CompanyConfig, value: string) => onChange({ ...config, [key]: value })

  return (
    <div className="max-w-3xl space-y-6">
      <div className="bg-white/80 backdrop-blur rounded-2xl border border-blue-100/60 shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-600" />
          Dados da Empresa
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { key: 'company_name', label: 'Nome da Empresa' },
            { key: 'company_cnpj', label: 'CNPJ' },
            { key: 'company_address', label: 'Endereço' },
            { key: 'company_city', label: 'Cidade' },
            { key: 'company_state', label: 'Estado' },
            { key: 'company_phone', label: 'Telefone' },
            { key: 'company_email', label: 'E-mail' },
            { key: 'company_website', label: 'Website' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
              <input
                type="text"
                value={(config as any)[key] || ''}
                onChange={e => update(key as keyof CompanyConfig, e.target.value)}
                className="w-full px-3 py-2 text-sm border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur rounded-2xl border border-blue-100/60 shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-blue-600" />
          Dados Bancários
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { key: 'bank_name', label: 'Banco' },
            { key: 'bank_agency', label: 'Agência' },
            { key: 'bank_account', label: 'Conta' },
            { key: 'bank_pix', label: 'PIX' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
              <input
                type="text"
                value={(config as any)[key] || ''}
                onChange={e => update(key as keyof CompanyConfig, e.target.value)}
                className="w-full px-3 py-2 text-sm border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur rounded-2xl border border-blue-100/60 shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Palette className="w-4 h-4 text-blue-600" />
          Identidade Visual
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Cor Primária</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.primary_color}
                onChange={e => update('primary_color', e.target.value)}
                className="w-10 h-9 rounded-lg border border-blue-200 cursor-pointer"
              />
              <input
                type="text"
                value={config.primary_color}
                onChange={e => update('primary_color', e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Cor Secundária</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.secondary_color}
                onChange={e => update('secondary_color', e.target.value)}
                className="w-10 h-9 rounded-lg border border-blue-200 cursor-pointer"
              />
              <input
                type="text"
                value={config.secondary_color}
                onChange={e => update('secondary_color', e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">URL do Logotipo</label>
            <input
              type="text"
              value={config.logo_url || ''}
              onChange={e => update('logo_url', e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-sm border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Texto Rodapé Padrão</label>
            <input
              type="text"
              value={config.default_footer || ''}
              onChange={e => update('default_footer', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onSave}
          disabled={saving}
          className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-800 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-blue-900 transition-all shadow-md flex items-center gap-2 disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>
    </div>
  )
}
