import React from 'react'
import { Check, Clock, Wrench, CheckCircle, XCircle, PauseCircle, FileText } from 'lucide-react'

export type PipelineStage = 'orcamento' | 'agendado' | 'em_execucao' | 'concluido' | 'cancelado' | 'pausado'

interface Stage {
  key: PipelineStage
  label: string
  icon: React.ReactNode
  color: string
  bg: string
  border: string
}

const STAGES: Stage[] = [
  {
    key: 'orcamento',
    label: 'Orçamento',
    icon: <FileText className="h-4 w-4" />,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-300'
  },
  {
    key: 'agendado',
    label: 'Agendado',
    icon: <Clock className="h-4 w-4" />,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-300'
  },
  {
    key: 'em_execucao',
    label: 'Em Execução',
    icon: <Wrench className="h-4 w-4" />,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-300'
  },
  {
    key: 'concluido',
    label: 'Concluído',
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-300'
  }
]

const TERMINAL_STAGES: Stage[] = [
  {
    key: 'pausado',
    label: 'Pausado',
    icon: <PauseCircle className="h-4 w-4" />,
    color: 'text-gray-500',
    bg: 'bg-gray-50',
    border: 'border-gray-300'
  },
  {
    key: 'cancelado',
    label: 'Cancelado',
    icon: <XCircle className="h-4 w-4" />,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-300'
  }
]

interface OSPipelineStepperProps {
  currentStage: PipelineStage
  onChange?: (stage: PipelineStage) => void
  readonly?: boolean
  compact?: boolean
}

export const OSPipelineStepper: React.FC<OSPipelineStepperProps> = ({
  currentStage,
  onChange,
  readonly = false,
  compact = false
}) => {
  const isTerminal = TERMINAL_STAGES.some(s => s.key === currentStage)
  const currentMainIndex = STAGES.findIndex(s => s.key === currentStage)

  const getStageState = (stage: Stage, index: number) => {
    if (isTerminal) {
      return { done: false, active: false, upcoming: true }
    }
    return {
      done: index < currentMainIndex,
      active: index === currentMainIndex,
      upcoming: index > currentMainIndex
    }
  }

  const terminalStage = TERMINAL_STAGES.find(s => s.key === currentStage)

  if (compact) {
    const allDisplayStages = isTerminal ? [...STAGES, ...(terminalStage ? [terminalStage] : [])] : STAGES
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {STAGES.map((stage, index) => {
          const { done, active } = getStageState(stage, index)
          return (
            <React.Fragment key={stage.key}>
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                  active
                    ? `${stage.bg} ${stage.color} border ${stage.border}`
                    : done
                    ? 'bg-green-50 text-green-600 border border-green-200'
                    : isTerminal
                    ? 'bg-gray-50 text-gray-400'
                    : 'bg-gray-50 text-gray-400'
                }`}
              >
                {done ? <Check className="h-3 w-3" /> : stage.icon}
                <span>{stage.label}</span>
              </div>
              {index < STAGES.length - 1 && (
                <div className={`h-px w-3 ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          )
        })}
        {isTerminal && terminalStage && (
          <>
            <div className="h-px w-3 bg-gray-200" />
            <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${terminalStage.bg} ${terminalStage.color} border ${terminalStage.border}`}>
              {terminalStage.icon}
              <span>{terminalStage.label}</span>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700">Esteira da OS</h4>
        {isTerminal && terminalStage && (
          <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${terminalStage.bg} ${terminalStage.color} border ${terminalStage.border}`}>
            {terminalStage.icon}
            {terminalStage.label}
          </span>
        )}
      </div>

      <div className="flex items-center gap-0">
        {STAGES.map((stage, index) => {
          const { done, active, upcoming } = getStageState(stage, index)
          const isClickable = !readonly && !upcoming && !isTerminal

          return (
            <React.Fragment key={stage.key}>
              <div className="flex flex-col items-center flex-1 min-w-0">
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onChange && onChange(stage.key)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                    active
                      ? `${stage.bg} ${stage.border} ${stage.color} shadow-md scale-110`
                      : done
                      ? 'bg-green-500 border-green-500 text-white'
                      : isTerminal
                      ? 'bg-gray-100 border-gray-200 text-gray-400'
                      : 'bg-gray-100 border-gray-200 text-gray-400'
                  } ${isClickable ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
                >
                  {done ? <Check className="h-4 w-4" /> : stage.icon}
                </button>
                <span className={`text-xs mt-1 font-medium text-center leading-tight ${
                  active ? stage.color : done ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {stage.label}
                </span>
              </div>

              {index < STAGES.length - 1 && (
                <div className={`h-0.5 flex-1 transition-all mt-[-18px] ${
                  done || (active && !isTerminal) ? 'bg-green-400' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {!readonly && !isTerminal && (
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => onChange && onChange('pausado')}
            className="flex items-center gap-1 px-3 py-1 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <PauseCircle className="h-3.5 w-3.5" />
            Pausar
          </button>
          <button
            type="button"
            onClick={() => onChange && onChange('cancelado')}
            className="flex items-center gap-1 px-3 py-1 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            <XCircle className="h-3.5 w-3.5" />
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}
