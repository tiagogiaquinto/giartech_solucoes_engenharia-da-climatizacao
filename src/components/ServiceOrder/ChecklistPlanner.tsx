import { useState, useRef } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import {
  Plus,
  Trash2,
  GripVertical,
  Zap,
  Wind,
  Thermometer,
  Wrench,
  ClipboardCheck,
  AlertCircle,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

export interface ChecklistStep {
  id: string
  description: string
  equipment_id?: string
  technical_note?: string
  position: number
}

interface EquipmentOption {
  id: string
  tipo_equipamento: string
  marca: string
  modelo: string
  capacidade?: string
}

interface ChecklistPlannerProps {
  steps: ChecklistStep[]
  onChange: (steps: ChecklistStep[]) => void
  customerEquipment?: EquipmentOption[]
  disabled?: boolean
}

const QUICK_TEMPLATES: Record<string, { label: string; icon: React.ReactNode; color: string; tasks: string[] }> = {
  instalacao: {
    label: 'Instalação',
    icon: <Wind className="w-4 h-4" />,
    color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    tasks: [
      'Verificar local de instalação e medidas',
      'Fixar suporte da unidade externa',
      'Instalar unidade interna',
      'Realizar passagem de tubulação de cobre',
      'Conectar cabos elétricos e de comunicação',
      'Realizar vácuo na linha',
      'Fazer carga de gás (se necessário)',
      'Testar funcionamento em todos os modos',
      'Limpar local e orientar o cliente sobre o uso'
    ]
  },
  carga_gas: {
    label: 'Carga de Gás',
    icon: <Thermometer className="w-4 h-4" />,
    color: 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100',
    tasks: [
      'Verificar pressão atual do sistema',
      'Localizar e reparar eventual vazamento',
      'Fazer vácuo completo na linha',
      'Carregar gás refrigerante conforme especificação',
      'Verificar pressão de alta e baixa',
      'Testar resfriamento/aquecimento',
      'Registrar quantidade de gás utilizada'
    ]
  },
  limpeza: {
    label: 'Limpeza',
    icon: <Zap className="w-4 h-4" />,
    color: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
    tasks: [
      'Desligar equipamento e proteger elétrica',
      'Remover e lavar filtros de ar',
      'Limpar serpentina do evaporador com produto específico',
      'Limpar bandeja coletora e dreno',
      'Limpar unidade externa e condensador',
      'Verificar dreno de condensado',
      'Ligar e testar funcionamento',
      'Entregar relatório de limpeza ao cliente'
    ]
  },
  preventiva: {
    label: 'Preventiva',
    icon: <ClipboardCheck className="w-4 h-4" />,
    color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
    tasks: [
      'Inspecionar componentes elétricos',
      'Verificar e limpar filtros',
      'Medir amperagem do compressor',
      'Verificar nível de refrigerante',
      'Limpar serpentinas interna e externa',
      'Verificar dreno e bandeja',
      'Testar todos os modos de operação',
      'Lubrificar partes móveis se necessário',
      'Preencher relatório de manutenção preventiva'
    ]
  },
  corretiva: {
    label: 'Corretiva',
    icon: <Wrench className="w-4 h-4" />,
    color: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
    tasks: [
      'Diagnosticar falha conforme relato do cliente',
      'Verificar código de erro no painel',
      'Inspecionar componentes suspeitos',
      'Substituir peça com defeito',
      'Testar após reparo',
      'Verificar se o defeito foi sanado',
      'Registrar peças utilizadas e tempo de serviço'
    ]
  }
}

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function formatEquipmentLabel(eq: EquipmentOption) {
  return `${eq.tipo_equipamento || 'Equipamento'} — ${eq.marca || ''} ${eq.modelo || ''}${eq.capacidade ? ` (${eq.capacidade})` : ''}`.trim()
}

export default function ChecklistPlanner({ steps, onChange, customerEquipment = [], disabled = false }: ChecklistPlannerProps) {
  const [newText, setNewText] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const addStep = (description: string) => {
    const text = description.trim()
    if (!text) return
    const step: ChecklistStep = {
      id: generateId(),
      description: text,
      position: steps.length
    }
    onChange([...steps, step])
    setNewText('')
    inputRef.current?.focus()
  }

  const applyTemplate = (templateKey: string) => {
    const template = QUICK_TEMPLATES[templateKey]
    if (!template) return
    const newSteps: ChecklistStep[] = template.tasks.map((desc, i) => ({
      id: generateId(),
      description: desc,
      position: steps.length + i
    }))
    onChange([...steps, ...newSteps])
  }

  const removeStep = (id: string) => {
    onChange(steps.filter(s => s.id !== id).map((s, i) => ({ ...s, position: i })))
    if (expandedId === id) setExpandedId(null)
  }

  const updateStep = (id: string, patch: Partial<ChecklistStep>) => {
    onChange(steps.map(s => s.id === id ? { ...s, ...patch } : s))
  }

  const handleReorder = (newOrder: ChecklistStep[]) => {
    onChange(newOrder.map((s, i) => ({ ...s, position: i })))
  }

  return (
    <div className="space-y-4">
      {/* Quick Templates */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Atalhos Inteligentes</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(QUICK_TEMPLATES).map(([key, tpl]) => (
            <button
              key={key}
              type="button"
              onClick={() => !disabled && applyTemplate(key)}
              disabled={disabled}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${tpl.color} disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {tpl.icon}
              {tpl.label}
            </button>
          ))}
        </div>
      </div>

      {/* Add Task Input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addStep(newText)}
          placeholder="Digite uma etapa e pressione Enter ou clique em +"
          disabled={disabled}
          className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 disabled:bg-gray-50 disabled:text-gray-400 transition-colors"
        />
        <button
          type="button"
          onClick={() => addStep(newText)}
          disabled={disabled || !newText.trim()}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Adicionar
        </button>
      </div>

      {/* Validation hint */}
      {steps.length === 0 && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">
            Adicione pelo menos uma etapa para poder enviar a OS ao técnico. Use os atalhos acima para preencher rapidamente.
          </p>
        </div>
      )}

      {/* Steps List - Draggable */}
      {steps.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-700">
              {steps.length} etapa{steps.length !== 1 ? 's' : ''} planejada{steps.length !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-gray-400">Arraste para reordenar</p>
          </div>

          <Reorder.Group axis="y" values={steps} onReorder={handleReorder} className="space-y-2">
            <AnimatePresence>
              {steps.map((step, index) => (
                <Reorder.Item
                  key={step.id}
                  value={step}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, height: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {/* Main row */}
                  <div className="flex items-center gap-2 px-3 py-3">
                    {/* Drag Handle */}
                    {!disabled && (
                      <div className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0">
                        <GripVertical className="w-4 h-4" />
                      </div>
                    )}

                    {/* Step number */}
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </span>

                    {/* Description */}
                    {disabled ? (
                      <span className="flex-1 text-sm text-gray-800 font-medium">{step.description}</span>
                    ) : (
                      <input
                        type="text"
                        value={step.description}
                        onChange={e => updateStep(step.id, { description: e.target.value })}
                        className="flex-1 text-sm text-gray-800 font-medium bg-transparent border-none outline-none focus:bg-blue-50 rounded px-1 py-0.5 transition-colors"
                      />
                    )}

                    {/* Expand details button */}
                    {customerEquipment.length > 0 && !disabled && (
                      <button
                        type="button"
                        onClick={() => setExpandedId(expandedId === step.id ? null : step.id)}
                        className="p-1 text-gray-400 hover:text-blue-500 transition-colors flex-shrink-0"
                        title="Vincular equipamento / obs. técnica"
                      >
                        {expandedId === step.id
                          ? <ChevronDown className="w-4 h-4" />
                          : <ChevronRight className="w-4 h-4" />
                        }
                      </button>
                    )}

                    {/* Delete */}
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => removeStep(step.id)}
                        className="p-1 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {expandedId === step.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 pt-0 border-t border-gray-100 mt-1 space-y-2">
                          {customerEquipment.length > 0 && (
                            <div>
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Equipamento vinculado</label>
                              <select
                                value={step.equipment_id || ''}
                                onChange={e => updateStep(step.id, { equipment_id: e.target.value || undefined })}
                                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                              >
                                <option value="">Nenhum (geral)</option>
                                {customerEquipment.map(eq => (
                                  <option key={eq.id} value={eq.id}>{formatEquipmentLabel(eq)}</option>
                                ))}
                              </select>
                            </div>
                          )}
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Observacao tecnica</label>
                            <input
                              type="text"
                              value={step.technical_note || ''}
                              onChange={e => updateStep(step.id, { technical_note: e.target.value || undefined })}
                              placeholder="Ex: Levar escada, unidade em local de difícil acesso..."
                              className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Tags summary when not expanded */}
                  {expandedId !== step.id && (step.equipment_id || step.technical_note) && (
                    <div className="px-10 pb-2 flex flex-wrap gap-1.5">
                      {step.equipment_id && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                          {formatEquipmentLabel(customerEquipment.find(e => e.id === step.equipment_id) || { id: '', tipo_equipamento: 'Equip.', marca: '', modelo: '' })}
                        </span>
                      )}
                      {step.technical_note && (
                        <span className="px-2 py-0.5 bg-gray-50 text-gray-500 rounded-full text-xs italic truncate max-w-xs">
                          {step.technical_note}
                        </span>
                      )}
                    </div>
                  )}
                </Reorder.Item>
              ))}
            </AnimatePresence>
          </Reorder.Group>
        </div>
      )}
    </div>
  )
}
