import React, { useState, useEffect } from 'react'
import { FileText, Download, Search, Filter, FileCheck, Receipt, FileSpreadsheet, RefreshCw } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { usePortal } from '../../contexts/PortalContext'

interface Document {
  id: string
  file_name: string
  file_type: string
  file_url: string
  category: string
  description: string
  created_at: string
  service_order_id: string
  order_number: string
}

const CATEGORY_ICONS: Record<string, any> = {
  certificado: FileCheck,
  orcamento: FileSpreadsheet,
  nota_fiscal: Receipt,
  contrato: FileText,
  outros: FileText,
}

const CATEGORY_LABELS: Record<string, string> = {
  certificado: 'Certificado',
  orcamento: 'Orcamento',
  nota_fiscal: 'Nota Fiscal',
  contrato: 'Contrato',
  outros: 'Outros',
}

export default function CustomerPortalDocuments() {
  const { portalUser } = usePortal()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  useEffect(() => {
    if (portalUser?.linked_customer_id) loadDocuments()
  }, [portalUser])

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const { data: osData } = await supabase
        .from('service_orders')
        .select('id, order_number')
        .eq('customer_id', portalUser!.linked_customer_id)

      if (!osData?.length) {
        setDocuments([])
        return
      }

      const osIds = osData.map(o => o.id)
      const osMap = Object.fromEntries(osData.map(o => [o.id, o.order_number]))

      const { data: docs } = await supabase
        .from('service_order_documents')
        .select('id, file_name, file_type, file_url, category, description, created_at, service_order_id')
        .in('service_order_id', osIds)
        .in('category', ['certificado', 'orcamento', 'nota_fiscal', 'contrato', 'outros'])
        .order('created_at', { ascending: false })

      setDocuments((docs || []).map(d => ({
        ...d,
        order_number: osMap[d.service_order_id] || '—'
      })))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = documents.filter(d => {
    const matchSearch = !search || d.file_name.toLowerCase().includes(search.toLowerCase())
    const matchCategory = !filterCategory || d.category === filterCategory
    return matchSearch && matchCategory
  })

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
          <p className="text-gray-500 text-sm">Certificados, orcamentos e notas fiscais</p>
        </div>
        <button onClick={loadDocuments} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <RefreshCw size={18} className="text-gray-500" />
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
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Todos os tipos</option>
          {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
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
              const Icon = CATEGORY_ICONS[doc.category] || FileText
              return (
                <div key={doc.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{doc.file_name}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                      <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">
                        {CATEGORY_LABELS[doc.category] || doc.category}
                      </span>
                      <span>OS {doc.order_number}</span>
                      <span>{formatDate(doc.created_at)}</span>
                    </div>
                  </div>
                  {doc.file_url && (
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      <Download size={12} /> Baixar
                    </a>
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
