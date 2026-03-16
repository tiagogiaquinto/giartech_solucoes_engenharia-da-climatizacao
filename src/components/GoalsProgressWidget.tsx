import React, { useEffect, useState } from 'react'
import { Target, TrendingUp, Trophy, AlertCircle, RefreshCw, Zap } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface GoalData {
  id: string
  description: string | null
  period_type: string
  start_date: string
  end_date: string
  target_amount: number
  achieved_amount: number
  net_profit_target: number
  net_profit_achieved: number
  goal_type: string
  status: string
  notes: string | null
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0)

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

interface ProgressBarProps {
  value: number
  max: number
  color?: string
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, max, color = 'bg-green-500' }) => {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${pct}%` }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-white drop-shadow" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
          {pct.toFixed(1)}%
        </span>
      </div>
    </div>
  )
}

interface GoalsProgressWidgetProps {
  compact?: boolean
}

export const GoalsProgressWidget: React.FC<GoalsProgressWidgetProps> = ({ compact = false }) => {
  const [goal, setGoal] = useState<GoalData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const today = new Date().toISOString().slice(0, 10)
    const { data } = await supabase
      .from('company_goals')
      .select('*')
      .in('period_type', ['mensal', 'monthly'])
      .lte('start_date', today)
      .gte('end_date', today)
      .neq('status', 'cancelada')
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle()
    setGoal(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 flex items-center justify-center min-h-[120px]">
        <RefreshCw className="h-5 w-5 text-gray-300 animate-spin" />
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-6 text-center">
        <Target className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Nenhuma meta ativa este mês</p>
      </div>
    )
  }

  const faturamentoPct = goal.target_amount > 0
    ? Math.min(100, (goal.achieved_amount / goal.target_amount) * 100)
    : 0
  const lucroLiquidoPct = goal.net_profit_target > 0
    ? Math.min(100, (goal.net_profit_achieved / goal.net_profit_target) * 100)
    : 0

  const restante = Math.max(0, goal.net_profit_target - goal.net_profit_achieved)
  const daysLeft = Math.max(0, Math.ceil(
    (new Date(goal.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  ))

  const faturBg = faturamentoPct >= 100 ? 'bg-green-500' : faturamentoPct >= 70 ? 'bg-amber-400' : 'bg-blue-500'
  const lucroBg = lucroLiquidoPct >= 100 ? 'bg-green-500' : lucroLiquidoPct >= 70 ? 'bg-emerald-500' : 'bg-orange-400'

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow">
            <Target className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">
              {goal.description || 'Meta do Mês'}
            </p>
            <p className="text-xs text-gray-500">
              {formatDate(goal.start_date)} – {formatDate(goal.end_date)} · {daysLeft}d restantes
            </p>
          </div>
        </div>
        <button onClick={load} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <RefreshCw className="h-3.5 w-3.5 text-gray-400" />
        </button>
      </div>

      <div className="p-4 space-y-5">
        {/* Faturamento Bruto */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">Faturamento Bruto</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-gray-800">{fmt(goal.achieved_amount)}</span>
              <span className="text-xs text-gray-400 ml-1">/ {fmt(goal.target_amount)}</span>
            </div>
          </div>
          <ProgressBar value={goal.achieved_amount} max={goal.target_amount} color={faturBg} />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-400">{fmt(0)}</span>
            {faturamentoPct >= 100 ? (
              <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                <Trophy className="h-3 w-3" /> Meta atingida!
              </span>
            ) : (
              <span className="text-xs text-gray-500">Faltam {fmt(goal.target_amount - goal.achieved_amount)}</span>
            )}
            <span className="text-xs text-gray-400">{fmt(goal.target_amount)}</span>
          </div>
        </div>

        {/* Lucro Líquido (Real) */}
        {goal.net_profit_target > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium text-gray-700">Lucro Líquido Real</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-emerald-700">{fmt(goal.net_profit_achieved)}</span>
                <span className="text-xs text-gray-400 ml-1">/ {fmt(goal.net_profit_target)}</span>
              </div>
            </div>
            <ProgressBar value={goal.net_profit_achieved} max={goal.net_profit_target} color={lucroBg} />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-400">{fmt(0)}</span>
              {lucroLiquidoPct >= 100 ? (
                <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                  <Trophy className="h-3 w-3" /> Meta de lucro atingida!
                </span>
              ) : (
                <span className="text-xs text-gray-500">Faltam {fmt(restante)} em lucro</span>
              )}
              <span className="text-xs text-gray-400">{fmt(goal.net_profit_target)}</span>
            </div>
          </div>
        )}

        {/* Bottom alert */}
        {restante > 0 && daysLeft > 0 && (
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Para atingir a meta de lucro nos próximos <strong>{daysLeft} dias</strong>,
              é necessário gerar em média <strong>{fmt(restante / daysLeft)}/dia</strong> em lucro líquido.
            </p>
          </div>
        )}

        {!compact && goal.notes && (
          <p className="text-xs text-gray-500 italic">{goal.notes}</p>
        )}
      </div>
    </div>
  )
}
