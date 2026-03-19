import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, X, Eye, FileEdit as Edit3, Download, Share2, FileText, Plus, Trash2, Copy, Clock, User, MessageSquare, Check, AlertCircle, Settings, Printer } from 'lucide-react'
import { supabase } from '../lib/supabase'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

interface Block {
  id: string
  name: string
  category: string
  block_type: string
  content: string
  variables: any[]
}

interface DocumentEditorProps {
  document?: any
  template?: any
  onClose: () => void
  onSave: () => void
  mode: 'create' | 'edit' | 'view'
}

export default function DocumentEditor({ document, template, onClose, onSave, mode: initialMode }: DocumentEditorProps) {
  const [mode, setMode] = useState(initialMode)
  const [content, setContent] = useState('')
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [blocks, setBlocks] = useState<Block[]>([])
  const [showBlocks, setShowBlocks] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [saving, setSaving] = useState(false)
  const [companyConfig, setCompanyConfig] = useState<any>(null)
  const [currentDocument, setCurrentDocument] = useState(document)
  const [versions, setVersions] = useState<any[]>([])
  const [showVersions, setShowVersions] = useState(false)

  useEffect(() => {
    loadCompanyConfig()
    loadBlocks()
    if (document) {
      loadDocument()
    } else if (template) {
      initializeFromTemplate()
    }
  }, [document, template])

  const loadCompanyConfig = async () => {
    const { data } = await supabase
      .from('company_document_config')
      .select('*')
      .maybeSingle()
    setCompanyConfig(data)
  }

  const loadBlocks = async () => {
    const { data } = await supabase
      .from('document_blocks')
      .select('*')
      .eq('is_active', true)
      .order('category')
    setBlocks(data || [])
  }

  const loadDocument = async () => {
    if (!document) return

    setContent(document.html_content || generateContent(document.data))
    setFormData(document.data || {})

    const { data: versionData } = await supabase
      .from('generated_documents')
      .select('*')
      .or(`parent_id.eq.${document.id},id.eq.${document.id}`)
      .order('version', { ascending: false })

    setVersions(versionData || [])
  }

  const initializeFromTemplate = () => {
    if (!template) return

    const initialData: Record<string, any> = {}

    if (companyConfig) {
      initialData.empresa_nome = companyConfig.company_name
      initialData.empresa_cnpj = companyConfig.company_cnpj
      initialData.empresa_endereco = companyConfig.company_address
      initialData.empresa_telefone = companyConfig.company_phone
      initialData.empresa_email = companyConfig.company_email
      initialData.responsavel_nome = companyConfig.technical_manager
      initialData.registro_profissional = companyConfig.technical_register
      initialData.banco_nome = companyConfig.bank_name
      initialData.banco_agencia = companyConfig.bank_agency
      initialData.banco_conta = companyConfig.bank_account
      initialData.banco_pix = companyConfig.bank_pix
    }

    template.fields.forEach((field: any) => {
      if (!initialData[field.name]) {
        if (field.type === 'date') {
          initialData[field.name] = new Date().toISOString().split('T')[0]
        } else {
          initialData[field.name] = field.default || ''
        }
      }
    })

    setFormData(initialData)
    setContent(template.content_template)
  }

  const generateContent = (data: Record<string, any>) => {
    let result = template?.content_template || content
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      result = result.replace(regex, data[key] || '')
    })
    return result
  }

  const renderPreview = () => {
    if (!companyConfig) return <div className="p-8">Carregando...</div>

    const previewContent = generateContent(formData)
    const lines = previewContent.split('\n')

    return (
      <div className="bg-white p-12 min-h-full shadow-xl">
        <div
          className="mb-8 p-6 text-white rounded-lg"
          style={{ backgroundColor: companyConfig.primary_color || '#2563eb' }}
        >
          <h1 className="text-3xl font-bold mb-2">{companyConfig.company_name}</h1>
          <p className="text-sm opacity-90">
            {companyConfig.company_phone} | {companyConfig.company_email}
          </p>
        </div>

        <div className="prose max-w-none">
          {lines.map((line, idx) => {
            if (line.startsWith('# ')) {
              return (
                <h1 key={idx} className="text-3xl font-bold mb-4 mt-8 text-gray-900">
                  {line.replace('# ', '')}
                </h1>
              )
            } else if (line.startsWith('## ')) {
              return (
                <h2 key={idx} className="text-2xl font-bold mb-3 mt-6 text-gray-800">
                  {line.replace('## ', '')}
                </h2>
              )
            } else if (line.startsWith('### ')) {
              return (
                <h3 key={idx} className="text-xl font-bold mb-2 mt-4 text-gray-700">
                  {line.replace('### ', '')}
                </h3>
              )
            } else if (line.startsWith('**') && line.endsWith('**')) {
              return (
                <p key={idx} className="font-bold mb-2 text-gray-900">
                  {line.replace(/\*\*/g, '')}
                </p>
              )
            } else if (line.trim() === '---') {
              return <hr key={idx} className="my-6 border-gray-300" />
            } else if (line.trim() === '') {
              return <div key={idx} className="h-4" />
            } else {
              return (
                <p key={idx} className="mb-2 text-gray-700 leading-relaxed">
                  {line}
                </p>
              )
            }
          })}
        </div>

        {companyConfig.default_footer && (
          <div className="mt-12 pt-6 border-t border-gray-300 text-center text-sm text-gray-500">
            {companyConfig.default_footer}
          </div>
        )}
      </div>
    )
  }

  const insertBlock = (block: Block) => {
    setContent(prev => prev + '\n\n' + block.content)
    setShowBlocks(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const htmlContent = generateContent(formData)

      if (currentDocument) {
        const { error } = await supabase
          .from('generated_documents')
          .update({
            data: formData,
            html_content: htmlContent,
            last_edited_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', currentDocument.id)

        if (error) throw error

        await supabase.from('document_edit_history').insert({
          document_id: currentDocument.id,
          change_type: 'edited',
          changes: { data: formData },
          comment: 'Documento editado'
        })
      } else {
        const { data: docNumber } = await supabase.rpc('generate_document_number', {
          doc_type: template.category
        })

        const { error } = await supabase
          .from('generated_documents')
          .insert({
            template_id: template.id,
            document_number: docNumber,
            document_type: template.category,
            title: template.name,
            customer_name: formData.cliente_nome || formData.contratante_nome || 'N/A',
            data: formData,
            html_content: htmlContent,
            status: 'draft',
            is_editable: true
          })

        if (error) throw error
      }

      alert('Documento salvo com sucesso!')
      onSave()
      onClose()
    } catch (error) {
      console.error('Error saving:', error)
      alert('Erro ao salvar documento')
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!companyConfig) return

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
    const previewContent = generateContent(formData)
    const lines = previewContent.split('\n')

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

    const fileName = currentDocument?.document_number || 'documento'
    doc.save(`${fileName}.pdf`)
  }

  const createNewVersion = async () => {
    if (!currentDocument) return

    try {
      const { data: newVersionId } = await supabase.rpc('create_new_document_version', {
        doc_id: currentDocument.id
      })

      alert('Nova versão criada com sucesso!')
      loadDocument()
    } catch (error) {
      console.error('Error creating version:', error)
      alert('Erro ao criar nova versão')
    }
  }

  const duplicateDocument = async () => {
    if (!currentDocument) return

    try {
      const { data: newDocId } = await supabase.rpc('duplicate_document', {
        doc_id: currentDocument.id
      })

      alert('Documento duplicado com sucesso!')
      onSave()
    } catch (error) {
      console.error('Error duplicating:', error)
      alert('Erro ao duplicar documento')
    }
  }

  const fields = template?.fields || []

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-lg shadow-2xl w-full h-full max-w-[98vw] max-h-[98vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <FileText className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">
                {currentDocument?.title || template?.name || 'Documento'}
              </h2>
              <p className="text-blue-100 text-sm">
                {currentDocument?.document_number || 'Novo documento'}
                {currentDocument && ` • Versão ${currentDocument.version}`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {mode === 'view' && currentDocument?.is_editable && (
              <button
                onClick={() => setMode('edit')}
                className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 flex items-center"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Editar
              </button>
            )}
            {mode === 'edit' && (
              <button
                onClick={() => setMode('view')}
                className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 flex items-center"
              >
                <Eye className="w-4 h-4 mr-2" />
                Visualizar
              </button>
            )}
            {currentDocument && (
              <>
                <button
                  onClick={createNewVersion}
                  className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 flex items-center"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Nova Versão
                </button>
                <button
                  onClick={duplicateDocument}
                  className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 flex items-center"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicar
                </button>
              </>
            )}
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center"
            >
              <Printer className="w-4 h-4 mr-2" />
              Baixar PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-blue-800 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Editor (quando em modo edit ou create) */}
          {(mode === 'edit' || mode === 'create') && (
            <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Preencher Campos</h3>
                  <button
                    onClick={() => setShowBlocks(!showBlocks)}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Blocos
                  </button>
                </div>

                {showBlocks && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-3">Blocos Reutilizáveis</h4>
                    <div className="space-y-2">
                      {blocks.map((block) => (
                        <button
                          key={block.id}
                          onClick={() => insertBlock(block)}
                          className="w-full text-left px-3 py-2 bg-white border border-gray-200 rounded hover:border-blue-500 hover:bg-blue-50"
                        >
                          <div className="font-medium text-sm">{block.name}</div>
                          <div className="text-xs text-gray-500">{block.category}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  {fields.map((field: any) => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.label}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          value={formData[field.name] || ''}
                          onChange={(e) => {
                            setFormData({ ...formData, [field.name]: e.target.value })
                          }}
                          rows={4}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : field.type === 'date' ? (
                        <input
                          type="date"
                          value={formData[field.name] || ''}
                          onChange={(e) => {
                            setFormData({ ...formData, [field.name]: e.target.value })
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <input
                          type="text"
                          value={formData[field.name] || ''}
                          onChange={(e) => {
                            setFormData({ ...formData, [field.name]: e.target.value })
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conteúdo do Template (Markdown)
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={15}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Use variáveis com {'{{'} nome {'}}'} para inserir dados
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Preview */}
          <div className={`${mode === 'view' ? 'w-full' : 'w-1/2'} bg-gray-100 overflow-y-auto`}>
            {renderPreview()}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <div className="flex items-center space-x-4">
            {currentDocument && versions.length > 1 && (
              <button
                onClick={() => setShowVersions(!showVersions)}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                <Clock className="w-4 h-4 mr-1" />
                {versions.length} versões
              </button>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              Cancelar
            </button>
            {(mode === 'edit' || mode === 'create') && (
              <button
                onClick={handleSave}
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
                    Salvar
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Versions Panel */}
        {showVersions && (
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl border-l border-gray-200 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Histórico de Versões</h3>
              <button onClick={() => setShowVersions(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              {versions.map((v) => (
                <div
                  key={v.id}
                  className={`p-4 rounded-lg border ${
                    v.id === currentDocument?.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Versão {v.version}</span>
                    {v.id === currentDocument?.id && (
                      <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                        Atual
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date(v.created_at).toLocaleString('pt-BR')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{v.status}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
