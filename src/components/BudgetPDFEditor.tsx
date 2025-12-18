import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Download,
  Printer,
  Eye,
  Edit3,
  Plus,
  Trash2,
  Save,
  X,
  Settings,
  Copy,
  Send,
  Palette,
  CheckCircle2
} from 'lucide-react'
import {
  budgetPDFService,
  BudgetData,
  BudgetItem,
  PDFTemplate,
  defaultTemplates
} from '../services/budgetPDFService'
import { format } from 'date-fns'

interface BudgetPDFEditorProps {
  initialData?: Partial<BudgetData>
  onSave?: (data: BudgetData) => void
  onClose?: () => void
  readOnly?: boolean
}

export default function BudgetPDFEditor({
  initialData,
  onSave,
  onClose,
  readOnly = false
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

  const [newItem, setNewItem] = useState<Partial<BudgetItem>>({
    description: '',
    quantity: 1,
    unit: 'UN',
    unitPrice: 0,
    category: ''
  })

  useEffect(() => {
    calculateTotals()
  }, [budgetData.items, budgetData.discount, budgetData.discountType, budgetData.taxes])

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
      const url = await budgetPDFService.previewPDF(budgetData, selectedTemplate)
      setPreviewUrl(url)
      setShowPreview(true)
    } catch (error) {
      console.error('Error generating preview:', error)
      alert('Erro ao gerar preview do PDF')
    }
  }

  const handleDownload = () => {
    budgetPDFService.downloadPDF(budgetData, selectedTemplate)
  }

  const handlePrint = () => {
    budgetPDFService.printPDF(budgetData, selectedTemplate)
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
              <p className="text-blue-100 text-sm">Nº {budgetData.number}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!readOnly && (
              <>
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
    </div>
  )
}
