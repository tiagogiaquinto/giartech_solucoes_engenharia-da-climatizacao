import { useState, useEffect } from 'react'
import { X, Save, FileText, AlertTriangle, Wrench, Award, Shield, Info } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface ServiceInfoEditModalProps {
  isOpen: boolean
  onClose: () => void
  serviceItem: any
  onSave: () => void
}

export function ServiceInfoEditModal({ isOpen, onClose, serviceItem, onSave }: ServiceInfoEditModalProps) {
  const [formData, setFormData] = useState({
    service_name: '',
    service_description: '',
    service_scope: '',
    technical_requirements: '',
    safety_warnings: '',
    execution_steps: '',
    expected_results: '',
    quality_standards: '',
    warranty_info: '',
    observations: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (serviceItem && isOpen) {
      setFormData({
        service_name: serviceItem.service_name || serviceItem.descricao || '',
        service_description: serviceItem.service_description || serviceItem.descricao || '',
        service_scope: serviceItem.service_scope || serviceItem.escopo_detalhado || '',
        technical_requirements: serviceItem.technical_requirements || '',
        safety_warnings: serviceItem.safety_warnings || '',
        execution_steps: serviceItem.execution_steps || '',
        expected_results: serviceItem.expected_results || '',
        quality_standards: serviceItem.quality_standards || '',
        warranty_info: serviceItem.warranty_info || '',
        observations: serviceItem.observations || serviceItem.notes || ''
      })
    }
  }, [serviceItem, isOpen])

  const handleSave = async () => {
    if (!serviceItem?.id) return

    try {
      setSaving(true)

      const { error } = await supabase
        .from('service_order_items')
        .update(formData)
        .eq('id', serviceItem.id)

      if (error) throw error

      onSave()
      onClose()
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('Erro ao salvar informações do serviço')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div>
            <h2 className="text-xl font-bold">Informações Detalhadas do Serviço</h2>
            <p className="text-sm text-blue-100 mt-1">
              Adicione descrições completas e requisitos técnicos
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Nome do Serviço */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <FileText className="h-4 w-4 text-blue-600" />
              Nome do Serviço
            </label>
            <input
              type="text"
              value={formData.service_name}
              onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Instalação de Ar Condicionado Split 12.000 BTUs"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Info className="h-4 w-4 text-blue-600" />
              Descrição Detalhada
            </label>
            <textarea
              value={formData.service_description}
              onChange={(e) => setFormData({ ...formData, service_description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Descreva detalhadamente o serviço a ser executado..."
            />
          </div>

          {/* Escopo */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <FileText className="h-4 w-4 text-green-600" />
              Escopo do Serviço
            </label>
            <textarea
              value={formData.service_scope}
              onChange={(e) => setFormData({ ...formData, service_scope: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="O que está incluído neste serviço? Ex:&#10;• Instalação completa da unidade interna e externa&#10;• Tubulação até 3 metros&#10;• Suporte e dreno&#10;• Testes de funcionamento"
            />
            <p className="text-xs text-gray-500 mt-1">
              Liste tudo que está incluído no serviço. Use • para bullet points.
            </p>
          </div>

          {/* Requisitos Técnicos */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Wrench className="h-4 w-4 text-purple-600" />
              Requisitos Técnicos
            </label>
            <textarea
              value={formData.technical_requirements}
              onChange={(e) => setFormData({ ...formData, technical_requirements: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Equipamentos, ferramentas ou condições necessárias..."
            />
          </div>

          {/* Avisos de Segurança */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              Avisos de Segurança
            </label>
            <textarea
              value={formData.safety_warnings}
              onChange={(e) => setFormData({ ...formData, safety_warnings: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none bg-yellow-50"
              placeholder="EPIs necessários, cuidados especiais, riscos a serem observados..."
            />
          </div>

          {/* Passos de Execução */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <FileText className="h-4 w-4 text-indigo-600" />
              Passos de Execução
            </label>
            <textarea
              value={formData.execution_steps}
              onChange={(e) => setFormData({ ...formData, execution_steps: e.target.value })}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Liste os passos da execução (um por linha)&#10;Ex:&#10;Fixar suporte da unidade interna&#10;Passar tubulação e elétrica&#10;Instalar unidade externa&#10;Fazer vácuo no sistema&#10;Testar funcionamento"
            />
            <p className="text-xs text-gray-500 mt-1">
              Digite um passo por linha. Serão numerados automaticamente.
            </p>
          </div>

          {/* Resultados Esperados */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <FileText className="h-4 w-4 text-green-600" />
              Resultados Esperados
            </label>
            <textarea
              value={formData.expected_results}
              onChange={(e) => setFormData({ ...formData, expected_results: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none bg-green-50"
              placeholder="O que o cliente pode esperar após a conclusão do serviço..."
            />
          </div>

          {/* Padrões de Qualidade */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Award className="h-4 w-4 text-blue-600" />
              Padrões de Qualidade
            </label>
            <textarea
              value={formData.quality_standards}
              onChange={(e) => setFormData({ ...formData, quality_standards: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Normas técnicas, certificações, procedimentos de qualidade..."
            />
          </div>

          {/* Garantia */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Shield className="h-4 w-4 text-blue-600" />
              Informações de Garantia
            </label>
            <textarea
              value={formData.warranty_info}
              onChange={(e) => setFormData({ ...formData, warranty_info: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-blue-50"
              placeholder="Ex: Garantia de 90 dias para mão de obra e 1 ano para equipamentos"
            />
          </div>

          {/* Observações */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Info className="h-4 w-4 text-gray-600" />
              Observações Adicionais
            </label>
            <textarea
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Outras informações importantes..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <p className="text-sm text-gray-600">
            Preencha o máximo de informações possível para documentação completa
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Salvando...' : 'Salvar Informações'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
