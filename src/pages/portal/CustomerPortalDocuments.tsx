import React, { useState, useEffect, useRef } from 'react'
import { FileText, Download, Search, FileCheck, Receipt, FileSpreadsheet, RefreshCw, Eye } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { usePortal } from '../../contexts/PortalContext'

interface Document {
  id: string
  title: string
  document_type: string
  pdf_url: string | null
  status: string
  created_at: string
  customer_name: string
}

const TYPE_ICONS: Record<string, any> = {
  orcamento:   FileSpreadsheet,
  certificado: FileCheck,
  nota_fiscal: Receipt,
  contrato:    FileText,
  recibo:      Receipt,
  outros:      FileText,
}

const TYPE_LABELS: Record<string, string> = {
  orcamento:   'Orcamento',
  certificado: 'Certificado',
  nota_fiscal: 'Nota Fiscal',
  contrato:    'Contrato',
  recibo:      'Recibo',
  outros:      'Outros',
}

export default function CustomerPortalDocuments() {
  const { portalUser } = usePortal()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!portalUser?.linked_customer_id) return
    loadDocuments()

    const ch = supabase
      .channel(`portal-docs-${portalUser.linked_customer_id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'generated_documents',
      }, () => { loadDocuments() })
      .subscribe()

    channelRef.current = ch
    return () => { ch.unsubscribe() }
  }, [portalUser?.linked_customer_id])

  const loadDocuments = async () => {
    if (!portalUser?.linked_customer_id) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('generated_documents')
        .select('id, title, document_type, pdf_url, status, created_at, customer_name')
        .eq('customer_id', portalUser.linked_customer_id)
        .order('created_at', { ascending: false })

      if (!error) setDocuments(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const logView = async (doc: Document) => {
    if (!portalUser) return
    await supabase.rpc('log_portal_document_view', {
      p_portal_account_id: portalUser.account_id,
      p_customer_id: portalUser.linked_customer_id,
      p_document_name: doc.title || doc.document_type,
      p_document_type: doc.document_type || 'outros',
    })
  }

  const handleDownload = async (doc: Document) => {
    await logView(doc)
    if (doc.pdf_url) {
      window.open(doc.pdf_url, '_blank', 'noopener,noreferrer')
    }
  }

  const filtered = documents.filter(d => {
    const matchSearch = !search || (d.title || '').toLowerCase().includes(search.toLowerCase())
    const matchType = !filterType || d.document_type === filterType
    return matchSearch && matchType
  })

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR')

  const docTypes = Array.from(new Set(documents.map(d => d.document_type).filter(Boolean)))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
          <p className="text-gray-500 text-sm">Orcamentos, certificados e contratos</p>
        </div>
        <button onClick={loadDocuments} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <RefreshCw size={18} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar documento..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Todos os tipos</option>
          {docTypes.map(t => (
            <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw size={24} className="animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FileText size={40} className="mx-auto mb-3 opacity-30" />
            <p>Nenhum documento encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(doc => {
              const Icon = TYPE_ICONS[doc.document_type] || FileText
              return (
                <div key={doc.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{doc.title || TYPE_LABELS[doc.document_type] || 'Documento'}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                      <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">
                        {TYPE_LABELS[doc.document_type] || doc.document_type}
                      </span>
                      <span>{formatDate(doc.created_at)}</span>
                      {doc.status && (
                        <span className={`px-1.5 py-0.5 rounded ${
                          doc.status === 'aprovado' ? 'bg-green-100 text-green-700' :
                          doc.status === 'enviado'  ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>{doc.status}</span>
                      )}
                    </div>
                  </div>
                  {doc.pdf_url ? (
                    <button
                      onClick={() => handleDownload(doc)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shrink-0"
                    >
                      <Download size={12} /> Baixar
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-400 shrink-0">
                      <Eye size={12} /> Sem PDF
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
