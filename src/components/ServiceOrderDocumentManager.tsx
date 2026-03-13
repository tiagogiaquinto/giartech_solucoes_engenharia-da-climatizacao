import { useState, useEffect } from 'react'
import { FileText, Plus, Eye, Download, Printer, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import TemplateSelectorModal from './TemplateSelectorModal'
import { TemplateData } from '../services/templateFillService'

interface ServiceOrderDocumentManagerProps {
  serviceOrderId?: string
  serviceOrderData?: any
  customerData?: any
  companyData?: any
  items?: any[]
  materials?: any[]
  team?: any[]
}

interface Document {
  id: string
  name: string
  document_type: string
  content_html: string
  created_at: string
}

const ServiceOrderDocumentManager = ({
  serviceOrderId,
  serviceOrderData,
  customerData,
  companyData,
  items = [],
  materials = [],
  team = []
}: ServiceOrderDocumentManagerProps) => {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [selectedDocType, setSelectedDocType] = useState<string>('')
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)

  useEffect(() => {
    if (serviceOrderId) {
      loadDocuments()
    }
  }, [serviceOrderId])

  const loadDocuments = async () => {
    if (!serviceOrderId) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('service_order_documents')
        .select('*')
        .eq('service_order_id', serviceOrderId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDocument = (docType: string) => {
    setSelectedDocType(docType)
    setShowTemplateSelector(true)
  }

  const handleTemplateSelected = async (filledHtml: string, template: any) => {
    if (!serviceOrderId) {
      alert('Salve a OS primeiro para gerar documentos')
      return
    }

    try {
      const { error } = await supabase
        .from('service_order_documents')
        .insert([{
          service_order_id: serviceOrderId,
          template_id: template.id,
          name: template.name,
          document_type: selectedDocType,
          content_html: filledHtml
        }])

      if (error) throw error

      alert('Documento gerado com sucesso!')
      loadDocuments()
      setShowTemplateSelector(false)
    } catch (error) {
      console.error('Error saving document:', error)
      alert('Erro ao salvar documento')
    }
  }

  const handlePrint = (doc: Document) => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${doc.name}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            ${doc.content_html}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleDelete = async (docId: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return

    try {
      const { error } = await supabase
        .from('service_order_documents')
        .delete()
        .eq('id', docId)

      if (error) throw error

      alert('Documento excluído com sucesso!')
      loadDocuments()
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Erro ao excluir documento')
    }
  }

  const templateData: TemplateData = {
    serviceOrder: serviceOrderData,
    customer: customerData,
    company: companyData,
    items,
    materials,
    team
  }

  const documentTypes = [
    { value: 'service_order', label: 'Ordem de Serviço', icon: '📋' },
    { value: 'proposal', label: 'Proposta Comercial', icon: '💼' },
    { value: 'contract', label: 'Contrato', icon: '📄' },
    { value: 'report', label: 'Relatório Técnico', icon: '📊' },
    { value: 'certificate', label: 'Certificado', icon: '🏆' },
    { value: 'budget', label: 'Orçamento', icon: '💰' }
  ]

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border-2 border-purple-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <FileText className="w-6 h-6 mr-2 text-purple-600" />
              Documentos da OS
            </h3>
            <p className="text-gray-600 text-sm mt-1">
              Gere documentos profissionais usando templates personalizados
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {documentTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => handleCreateDocument(type.value)}
              className="p-4 bg-white hover:bg-purple-50 border-2 border-purple-200 hover:border-purple-400 rounded-lg transition-all text-left group"
              disabled={!serviceOrderId}
            >
              <div className="text-3xl mb-2">{type.icon}</div>
              <div className="font-semibold text-gray-900 group-hover:text-purple-700">
                {type.label}
              </div>
              <div className="text-xs text-gray-500 mt-1">Gerar documento</div>
            </button>
          ))}
        </div>

        {!serviceOrderId && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start space-x-2">
            <span className="text-yellow-600">⚠️</span>
            <p className="text-sm text-yellow-800">
              Salve a Ordem de Serviço primeiro para gerar documentos
            </p>
          </div>
        )}
      </div>

      {documents.length > 0 && (
        <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b">
            <h4 className="font-bold text-gray-900 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              Documentos Gerados ({documents.length})
            </h4>
          </div>
          <div className="divide-y">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-900">{doc.name}</h5>
                  <p className="text-sm text-gray-500">
                    Criado em {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                    title="Visualizar"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handlePrint(doc)}
                    className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                    title="Imprimir"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showTemplateSelector && (
        <TemplateSelectorModal
          isOpen={showTemplateSelector}
          onClose={() => setShowTemplateSelector(false)}
          templateType={selectedDocType}
          data={templateData}
          onSelect={handleTemplateSelected}
          title={`Selecionar Template - ${documentTypes.find(t => t.value === selectedDocType)?.label}`}
        />
      )}

      {previewDoc && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-between">
              <h3 className="text-2xl font-bold">{previewDoc.name}</h3>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] bg-gray-50">
              <div
                className="bg-white rounded-lg shadow-lg p-8"
                dangerouslySetInnerHTML={{ __html: previewDoc.content_html }}
              />
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={() => handlePrint(previewDoc)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ServiceOrderDocumentManager
