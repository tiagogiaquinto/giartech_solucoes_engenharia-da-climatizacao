import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, X, Eye, Code, Layout, Palette, FileText } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface AdvancedTemplateEditorProps {
  templateId?: string
  onSave: () => void
  onCancel: () => void
}

const AdvancedTemplateEditor = ({ templateId, onSave, onCancel }: AdvancedTemplateEditorProps) => {
  const [activeTab, setActiveTab] = useState<'content' | 'variables' | 'blocks' | 'theme' | 'preview'>('content')
  const [saving, setSaving] = useState(false)
  const [template, setTemplate] = useState({
    name: '',
    description: '',
    category: 'operational',
    template_type: 'service_order',
    content_template: '',
    tags: [] as string[],
    is_public: false
  })

  const categories = [
    { value: 'operational', label: 'Operacional' },
    { value: 'commercial', label: 'Comercial' },
    { value: 'technical', label: 'Técnico' },
    { value: 'financial', label: 'Financeiro' },
    { value: 'legal', label: 'Jurídico' }
  ]

  const templateTypes = [
    { value: 'service_order', label: 'Ordem de Serviço' },
    { value: 'proposal', label: 'Proposta' },
    { value: 'contract', label: 'Contrato' },
    { value: 'report', label: 'Relatório' },
    { value: 'certificate', label: 'Certificado' },
    { value: 'budget', label: 'Orçamento' }
  ]

  useEffect(() => {
    if (templateId) {
      loadTemplate()
    }
  }, [templateId])

  const loadTemplate = async () => {
    try {
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('id', templateId)
        .single()

      if (error) throw error
      if (data) {
        setTemplate({
          name: data.name,
          description: data.description || '',
          category: data.category,
          template_type: data.template_type,
          content_template: data.content_template,
          tags: data.tags || [],
          is_public: data.is_public
        })
      }
    } catch (error) {
      console.error('Error loading template:', error)
      alert('Erro ao carregar template')
    }
  }

  const handleSave = async () => {
    if (!template.name || !template.content_template) {
      alert('Preencha o nome e o conteúdo do template')
      return
    }

    try {
      setSaving(true)

      if (templateId) {
        const { error } = await supabase
          .from('document_templates')
          .update({
            name: template.name,
            description: template.description,
            category: template.category,
            template_type: template.template_type,
            content_template: template.content_template,
            tags: template.tags,
            is_public: template.is_public
          })
          .eq('id', templateId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('document_templates')
          .insert([{
            ...template,
            is_active: true
          }])

        if (error) throw error
      }

      alert('Template salvo com sucesso!')
      onSave()
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Erro ao salvar template')
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'content', label: 'Conteúdo', icon: FileText },
    { id: 'variables', label: 'Variáveis', icon: Code },
    { id: 'blocks', label: 'Blocos', icon: Layout },
    { id: 'theme', label: 'Tema', icon: Palette },
    { id: 'preview', label: 'Preview', icon: Eye }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <input
                type="text"
                value={template.name}
                onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                placeholder="Nome do Template"
                className="text-2xl font-bold border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 w-full"
              />
              <input
                type="text"
                value={template.description}
                onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                placeholder="Descrição breve do template"
                className="text-sm text-gray-600 border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 w-full mt-1"
              />
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-2"
              >
                <X className="w-5 h-5" />
                <span>Cancelar</span>
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                <span>{saving ? 'Salvando...' : 'Salvar'}</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center space-x-1 mt-4 border-b">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 flex items-center space-x-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select
                value={template.category}
                onChange={(e) => setTemplate({ ...template, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Documento
              </label>
              <select
                value={template.template_type}
                onChange={(e) => setTemplate({ ...template, template_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {templateTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'content' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conteúdo HTML do Template
              </label>
              <textarea
                value={template.content_template}
                onChange={(e) => setTemplate({ ...template, content_template: e.target.value })}
                placeholder="Cole ou escreva o HTML do seu template aqui..."
                className="w-full h-96 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
              <p className="mt-2 text-sm text-gray-600">
                Use variáveis no formato: {`{{company.name}}, {{customer.name}}, {{os.number}}`}
              </p>
            </div>
          )}

          {activeTab === 'variables' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Variáveis Disponíveis</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Dados da Empresa</h4>
                  <ul className="space-y-1 text-sm text-blue-800">
                    <li><code>{`{{company.name}}`}</code></li>
                    <li><code>{`{{company.cnpj}}`}</code></li>
                    <li><code>{`{{company.phone}}`}</code></li>
                    <li><code>{`{{company.email}}`}</code></li>
                    <li><code>{`{{company.address}}`}</code></li>
                  </ul>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Dados do Cliente</h4>
                  <ul className="space-y-1 text-sm text-green-800">
                    <li><code>{`{{customer.name}}`}</code></li>
                    <li><code>{`{{customer.document}}`}</code></li>
                    <li><code>{`{{customer.phone}}`}</code></li>
                    <li><code>{`{{customer.email}}`}</code></li>
                    <li><code>{`{{customer.address}}`}</code></li>
                  </ul>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-2">Dados da OS</h4>
                  <ul className="space-y-1 text-sm text-purple-800">
                    <li><code>{`{{os.number}}`}</code></li>
                    <li><code>{`{{os.date}}`}</code></li>
                    <li><code>{`{{os.status}}`}</code></li>
                    <li><code>{`{{os.notes}}`}</code></li>
                  </ul>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Data/Hora Atual</h4>
                  <ul className="space-y-1 text-sm text-yellow-800">
                    <li><code>{`{{current.date}}`}</code></li>
                    <li><code>{`{{current.time}}`}</code></li>
                    <li><code>{`{{current.datetime}}`}</code></li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'blocks' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Blocos Reutilizáveis</h3>
              <p className="text-gray-600 mb-4">
                Clique em um bloco para copiar e colar no seu template
              </p>
              <div className="space-y-3">
                <div className="p-4 border rounded-lg hover:border-blue-500 cursor-pointer">
                  <h4 className="font-medium">Dados Técnicos do Equipamento HVAC</h4>
                  <p className="text-sm text-gray-600">Tabela com marca, modelo, BTUs, gás, tensão</p>
                </div>
                <div className="p-4 border rounded-lg hover:border-blue-500 cursor-pointer">
                  <h4 className="font-medium">Check-list Manutenção Preventiva</h4>
                  <p className="text-sm text-gray-600">10 itens de verificação padrão</p>
                </div>
                <div className="p-4 border rounded-lg hover:border-blue-500 cursor-pointer">
                  <h4 className="font-medium">Tabela de Medições Técnicas</h4>
                  <p className="text-sm text-gray-600">Pressões, temperaturas e corrente elétrica</p>
                </div>
                <div className="p-4 border rounded-lg hover:border-blue-500 cursor-pointer">
                  <h4 className="font-medium">Termo de Garantia HVAC</h4>
                  <p className="text-sm text-gray-600">Garantia padrão de 90 dias com condições</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'theme' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Personalização Visual</h3>
              <p className="text-gray-600 mb-4">
                Personalize as cores e fontes do seu template diretamente no HTML
              </p>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Dica de Cores</h4>
                  <p className="text-sm text-gray-600">Use classes Tailwind ou estilos inline para personalizar cores</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preview' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Visualização do Template</h3>
              <div className="border rounded-lg p-6 bg-white">
                <div
                  dangerouslySetInnerHTML={{
                    __html: template.content_template
                      .replace(/\{\{company\.name\}\}/g, 'Sua Empresa')
                      .replace(/\{\{customer\.name\}\}/g, 'João Silva')
                      .replace(/\{\{os\.number\}\}/g, '001/2024')
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdvancedTemplateEditor
