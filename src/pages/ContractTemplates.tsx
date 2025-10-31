import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Plus, Edit, Trash2, Save, X, Check, AlertCircle, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'

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

const ContractTemplates = () => {
  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<ContractTemplate>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('active', true)
        .order('is_default', { ascending: false })
        .order('name')

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Templates loaded:', data)
      setTemplates(data || [])
    } catch (error) {
      console.error('Error loading templates:', error)
      alert('Erro ao carregar templates: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (template: ContractTemplate) => {
    setEditingId(template.id)
    setFormData(template)
  }

  const handleCancel = () => {
    setEditingId(null)
    setFormData({})
  }

  const handleSave = async () => {
    if (!editingId) return

    try {
      setSaving(true)

      if (formData.is_default) {
        await supabase
          .from('contract_templates')
          .update({ is_default: false })
          .neq('id', editingId)
      }

      const { error } = await supabase
        .from('contract_templates')
        .update({
          name: formData.name,
          contract_text: formData.contract_text,
          contract_clauses: formData.contract_clauses,
          warranty_terms: formData.warranty_terms,
          payment_conditions: formData.payment_conditions,
          bank_details_template: formData.bank_details_template,
          is_default: formData.is_default,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingId)

      if (error) throw error

      alert('Template salvo com sucesso!')
      await loadTemplates()
      handleCancel()
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Erro ao salvar template')
    } finally {
      setSaving(false)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await supabase
        .from('contract_templates')
        .update({ is_default: false })
        .neq('id', id)

      await supabase
        .from('contract_templates')
        .update({ is_default: true })
        .eq('id', id)

      alert('Template definido como padrão!')
      await loadTemplates()
    } catch (error) {
      console.error('Error setting default:', error)
      alert('Erro ao definir padrão')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FileText className="h-8 w-8 text-blue-600" />
          Templates de Contrato
        </h1>
        <p className="text-gray-600 mt-2">
          Gerencie os modelos de contrato, termos de garantia e condições de pagamento
        </p>
      </div>

      {templates.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-12 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhum template encontrado</h3>
          <p className="text-gray-600 mb-6">
            Não há templates de contrato cadastrados no momento.
          </p>
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
            <p className="text-sm text-blue-900">
              <strong>Nota:</strong> Os templates devem ser criados diretamente no banco de dados Supabase
              na tabela <code className="bg-blue-100 px-2 py-1 rounded">contract_templates</code>.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {templates.map((template) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b-2 border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-blue-600" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{template.name}</h3>
                    {template.is_default && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold mt-1">
                        <Star className="h-3 w-3" />
                        Template Padrão
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!template.is_default && (
                    <button
                      onClick={() => handleSetDefault(template.id)}
                      className="px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-2"
                      title="Definir como padrão"
                    >
                      <Star className="h-4 w-4" />
                      Definir Padrão
                    </button>
                  )}
                  {editingId === template.id ? (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        <Save className="h-4 w-4" />
                        {saving ? 'Salvando...' : 'Salvar'}
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={saving}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleEdit(template)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6">
              {editingId === template.id ? (
                <div className="space-y-6">
                  <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-4">
                    <p className="text-sm text-yellow-900 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      <strong>Dica:</strong> Use variáveis como [NOME_CLIENTE], [VALOR_TOTAL], [NUMERO_OS] para substituição automática
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Nome do Template
                    </label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ex: Contrato Padrão"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_default || false}
                        onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                        className="w-5 h-5 text-blue-600"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Definir como template padrão para todas as novas OS
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      📄 Texto do Contrato Principal
                    </label>
                    <textarea
                      value={formData.contract_text || ''}
                      onChange={(e) => setFormData({ ...formData, contract_text: e.target.value })}
                      rows={10}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                      placeholder="Digite o texto principal do contrato..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      📋 Cláusulas Contratuais
                    </label>
                    <textarea
                      value={formData.contract_clauses || ''}
                      onChange={(e) => setFormData({ ...formData, contract_clauses: e.target.value })}
                      rows={8}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                      placeholder="Digite as cláusulas contratuais..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      ✅ Termos de Garantia
                    </label>
                    <textarea
                      value={formData.warranty_terms || ''}
                      onChange={(e) => setFormData({ ...formData, warranty_terms: e.target.value })}
                      rows={8}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                      placeholder="Digite os termos de garantia..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      💰 Condições de Pagamento
                    </label>
                    <textarea
                      value={formData.payment_conditions || ''}
                      onChange={(e) => setFormData({ ...formData, payment_conditions: e.target.value })}
                      rows={8}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                      placeholder="Digite as condições de pagamento..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      🏦 Dados Bancários (Template)
                    </label>
                    <textarea
                      value={formData.bank_details_template || ''}
                      onChange={(e) => setFormData({ ...formData, bank_details_template: e.target.value })}
                      rows={6}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                      placeholder="Digite o template dos dados bancários..."
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                    <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Contrato Principal
                    </h4>
                    <p className="text-sm text-blue-800 whitespace-pre-wrap line-clamp-6">
                      {template.contract_text}
                    </p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
                    <h4 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Cláusulas
                    </h4>
                    <p className="text-sm text-purple-800 whitespace-pre-wrap line-clamp-6">
                      {template.contract_clauses}
                    </p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                    <h4 className="font-bold text-green-900 mb-2 flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Garantia
                    </h4>
                    <p className="text-sm text-green-800 whitespace-pre-wrap line-clamp-6">
                      {template.warranty_terms}
                    </p>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-4 border-2 border-orange-200">
                    <h4 className="font-bold text-orange-900 mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Pagamento
                    </h4>
                    <p className="text-sm text-orange-800 whitespace-pre-wrap line-clamp-6">
                      {template.payment_conditions}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      )}
    </div>
  )
}

export default ContractTemplates
