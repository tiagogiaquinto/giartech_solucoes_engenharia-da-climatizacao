import { useState } from 'react'
import { ChevronDown, ChevronUp, FileText, CheckCircle, AlertTriangle, Wrench, Clock, Award, Shield, Info } from 'lucide-react'

interface ServiceDetailedInfoProps {
  service: {
    service_name?: string
    descricao?: string
    service_description?: string
    service_scope?: string
    escopo_detalhado?: string
    technical_requirements?: string
    safety_warnings?: string
    execution_steps?: string
    expected_results?: string
    quality_standards?: string
    warranty_info?: string
    observations?: string
    notes?: string
    quantity?: number
    quantidade?: number
    unit_price?: number
    preco_unitario?: number
    total_price?: number
    preco_total?: number
    estimated_duration?: number
    tempo_estimado_minutos?: number
  }
  isExpanded?: boolean
  onToggle?: () => void
}

export function ServiceDetailedInfo({ service, isExpanded = false, onToggle }: ServiceDetailedInfoProps) {
  const [expanded, setExpanded] = useState(isExpanded)

  const handleToggle = () => {
    setExpanded(!expanded)
    onToggle?.()
  }

  const serviceName = service.service_name || service.descricao || 'Serviço'
  const description = service.service_description || service.descricao
  const scope = service.service_scope || service.escopo_detalhado
  const quantity = service.quantity || service.quantidade || 1
  const unitPrice = service.unit_price || service.preco_unitario || 0
  const totalPrice = service.total_price || service.preco_total || 0
  const duration = service.estimated_duration || service.tempo_estimado_minutos

  const hasDetailedInfo = !!(
    description ||
    scope ||
    service.technical_requirements ||
    service.safety_warnings ||
    service.execution_steps ||
    service.expected_results ||
    service.quality_standards ||
    service.warranty_info ||
    service.observations ||
    service.notes
  )

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Header Compacto */}
      <div
        className="px-4 py-3 bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={handleToggle}
      >
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-blue-600" />
            <div>
              <h4 className="font-semibold text-gray-900">{serviceName}</h4>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                <span>Qtd: {quantity}</span>
                <span>•</span>
                <span>R$ {unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                {duration && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {duration}min
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm text-gray-600">Total</div>
            <div className="font-bold text-lg text-gray-900">
              R$ {totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          {hasDetailedInfo && (
            <button className="p-1 hover:bg-gray-200 rounded transition-colors">
              {expanded ? (
                <ChevronUp className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-600" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Conteúdo Expandido */}
      {expanded && hasDetailedInfo && (
        <div className="px-4 py-4 space-y-4 border-t border-gray-200">
          {/* Descrição */}
          {description && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-blue-600" />
                <h5 className="font-semibold text-gray-900">Descrição</h5>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed pl-6">
                {description}
              </p>
            </div>
          )}

          {/* Escopo */}
          {scope && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <h5 className="font-semibold text-gray-900">Escopo do Serviço</h5>
              </div>
              <div className="text-gray-700 text-sm leading-relaxed pl-6 whitespace-pre-wrap">
                {scope}
              </div>
            </div>
          )}

          {/* Requisitos Técnicos */}
          {service.technical_requirements && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Wrench className="h-4 w-4 text-purple-600" />
                <h5 className="font-semibold text-gray-900">Requisitos Técnicos</h5>
              </div>
              <div className="text-gray-700 text-sm leading-relaxed pl-6 whitespace-pre-wrap">
                {service.technical_requirements}
              </div>
            </div>
          )}

          {/* Avisos de Segurança */}
          {service.safety_warnings && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <h5 className="font-semibold text-yellow-900">Avisos de Segurança</h5>
              </div>
              <div className="text-yellow-800 text-sm leading-relaxed pl-6 whitespace-pre-wrap">
                {service.safety_warnings}
              </div>
            </div>
          )}

          {/* Passos de Execução */}
          {service.execution_steps && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-indigo-600" />
                <h5 className="font-semibold text-gray-900">Passos de Execução</h5>
              </div>
              <div className="text-gray-700 text-sm leading-relaxed pl-6">
                {service.execution_steps.split('\n').map((step, index) => (
                  <div key={index} className="flex gap-2 mb-1">
                    <span className="font-semibold text-indigo-600 min-w-[24px]">
                      {index + 1}.
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resultados Esperados */}
          {service.expected_results && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <h5 className="font-semibold text-green-900">Resultados Esperados</h5>
              </div>
              <div className="text-green-800 text-sm leading-relaxed pl-6 whitespace-pre-wrap">
                {service.expected_results}
              </div>
            </div>
          )}

          {/* Padrões de Qualidade */}
          {service.quality_standards && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-4 w-4 text-blue-600" />
                <h5 className="font-semibold text-gray-900">Padrões de Qualidade</h5>
              </div>
              <div className="text-gray-700 text-sm leading-relaxed pl-6 whitespace-pre-wrap">
                {service.quality_standards}
              </div>
            </div>
          )}

          {/* Garantia */}
          {service.warranty_info && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <h5 className="font-semibold text-blue-900">Garantia</h5>
              </div>
              <div className="text-blue-800 text-sm leading-relaxed pl-6 whitespace-pre-wrap">
                {service.warranty_info}
              </div>
            </div>
          )}

          {/* Observações */}
          {(service.observations || service.notes) && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-gray-600" />
                <h5 className="font-semibold text-gray-900">Observações</h5>
              </div>
              <div className="text-gray-700 text-sm leading-relaxed pl-6 whitespace-pre-wrap">
                {service.observations || service.notes}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mensagem se não há detalhes */}
      {expanded && !hasDetailedInfo && (
        <div className="px-4 py-8 text-center border-t border-gray-200">
          <Info className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">
            Nenhuma informação detalhada disponível para este serviço.
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Adicione descrições, escopo e requisitos para melhor documentação.
          </p>
        </div>
      )}
    </div>
  )
}
