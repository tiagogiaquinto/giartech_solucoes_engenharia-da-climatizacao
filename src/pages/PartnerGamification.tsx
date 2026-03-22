import { useState, useEffect } from 'react'
import {
  Trophy, Star, Award, TrendingUp, DollarSign, Crown, Users, Zap, Gift,
  RefreshCw, ChevronRight, CheckCircle, Clock, BarChart2, Gem, Target
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useToast } from '../hooks/useToast'

interface PartnerEntry {
  partner_account_id: string
  partner_name: string
  email: string
  phone: string
  is_active: boolean
  partner_since: string
  total_referrals: number
  converted_referrals: number
  pending_referrals: number
  total_commission_earned: number
  commission_paid: number
  commission_pending: number
  current_tier: string
  conversion_rate: number
  last_referral_at: string | null
  total_badges: number
  ranking_position: number
}

interface Tier {
  tier_level: string
  tier_name: string
  min_referrals: number
  min_converted: number
  min_commission: number
  commission_bonus_percent: number
  benefits: string[]
  color_from: string
  color_to: string
  display_order: number
}

interface Badge {
  id: string
  badge_key: string
  badge_name: string
  description: string
  badge_icon: string
  badge_level: string
  points_awarded: number
  earned_at?: string
}

const TIER_ICON: Record<string, JSX.Element> = {
  bronze:  <Award className="w-5 h-5" />,
  silver:  <Star className="w-5 h-5" />,
  gold:    <Trophy className="w-5 h-5" />,
  diamond: <Gem className="w-5 h-5" />,
  vip:     <Crown className="w-5 h-5" />,
}

const TIER_GRADIENT: Record<string, string> = {
  bronze:  'from-orange-600 to-amber-700',
  silver:  'from-gray-400 to-gray-600',
  gold:    'from-yellow-400 to-yellow-600',
  diamond: 'from-cyan-400 to-blue-600',
  vip:     'from-rose-500 to-pink-700',
}

const BADGE_ICON_MAP: Record<string, JSX.Element> = {
  'star':          <Star className="w-5 h-5" />,
  'users':         <Users className="w-5 h-5" />,
  'check-circle':  <CheckCircle className="w-5 h-5" />,
  'trending-up':   <TrendingUp className="w-5 h-5" />,
  'trophy':        <Trophy className="w-5 h-5" />,
  'dollar-sign':   <DollarSign className="w-5 h-5" />,
  'gem':           <Gem className="w-5 h-5" />,
  'crown':         <Crown className="w-5 h-5" />,
  'zap':           <Zap className="w-5 h-5" />,
  'award':         <Award className="w-5 h-5" />,
}

const BADGE_LEVEL_COLOR: Record<string, string> = {
  bronze:  'bg-amber-100 text-amber-800 border-amber-300',
  silver:  'bg-gray-100 text-gray-700 border-gray-300',
  gold:    'bg-yellow-100 text-yellow-800 border-yellow-300',
  diamond: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  vip:     'bg-rose-100 text-rose-800 border-rose-300',
}

const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
const fmtN = (n: number) => new Intl.NumberFormat('pt-BR').format(n)

const PartnerGamification = () => {
  const [tab, setTab] = useState<'ranking' | 'tiers' | 'badges'>('ranking')
  const [leaderboard, setLeaderboard] = useState<PartnerEntry[]>([])
  const [tiers, setTiers] = useState<Tier[]>([])
  const [badgesCatalog, setBadgesCatalog] = useState<Badge[]>([])
  const [selected, setSelected] = useState<PartnerEntry | null>(null)
  const [partnerBadges, setPartnerBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const { showToast } = useToast()

  useEffect(() => { loadAll() }, [])
  useEffect(() => { if (selected) loadPartnerBadges(selected.partner_account_id) }, [selected])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [{ data: lb }, { data: ts }, { data: bc }] = await Promise.all([
        supabase.from('v_partner_leaderboard').select('*').limit(100),
        supabase.from('partner_tiers').select('*').order('display_order'),
        supabase.from('partner_badges_catalog').select('*').eq('active', true).order('display_order'),
      ])
      setLeaderboard(lb || [])
      setTiers(ts || [])
      setBadgesCatalog(bc || [])
      if (lb && lb.length > 0 && !selected) setSelected(lb[0])
    } finally {
      setLoading(false)
    }
  }

  const loadPartnerBadges = async (partnerId: string) => {
    const { data } = await supabase
      .from('partner_badges_earned')
      .select('earned_at, partner_badges_catalog(*)')
      .eq('partner_account_id', partnerId)
    const earned: Badge[] = (data || []).map((r: any) => ({
      ...r.partner_badges_catalog,
      earned_at: r.earned_at,
    }))
    setPartnerBadges(earned)
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const { data, error } = await supabase.rpc('sync_all_partners_gamification')
      if (error) throw error
      showToast(`${data} parceiros sincronizados com sucesso!`, 'success')
      loadAll()
    } catch {
      showToast('Erro ao sincronizar dados', 'error')
    } finally {
      setSyncing(false)
    }
  }

  const tierOf = (level: string) => tiers.find(t => t.tier_level === level)

  const stats = {
    total: leaderboard.length,
    active: leaderboard.filter(p => p.is_active).length,
    total_converted: leaderboard.reduce((s, p) => s + p.converted_referrals, 0),
    total_commission: leaderboard.reduce((s, p) => s + p.total_commission_earned, 0),
    commission_pending: leaderboard.reduce((s, p) => s + p.commission_pending, 0),
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="w-7 h-7 text-yellow-500" />
            Gamificação de Parceiros
          </h1>
          <p className="text-gray-500 mt-0.5 text-sm">Rankings, níveis e conquistas dos parceiros de indicação</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Sincronizando...' : 'Sincronizar Dados'}
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total de Parceiros', value: fmtN(stats.total), icon: <Users className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-50', border: 'border-blue-100' },
          { label: 'Parceiros Ativos', value: fmtN(stats.active), icon: <CheckCircle className="w-5 h-5 text-green-600" />, bg: 'bg-green-50', border: 'border-green-100' },
          { label: 'Indicações Convertidas', value: fmtN(stats.total_converted), icon: <Target className="w-5 h-5 text-orange-600" />, bg: 'bg-orange-50', border: 'border-orange-100' },
          { label: 'Comissões Geradas', value: fmt(stats.total_commission), icon: <DollarSign className="w-5 h-5 text-yellow-600" />, bg: 'bg-yellow-50', border: 'border-yellow-100' },
          { label: 'Comissões Pendentes', value: fmt(stats.commission_pending), icon: <Clock className="w-5 h-5 text-rose-600" />, bg: 'bg-rose-50', border: 'border-rose-100' },
        ].map((k, i) => (
          <div key={i} className={`${k.bg} border ${k.border} rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-1">
              {k.icon}
              <span className="text-xs font-medium text-gray-500">{k.label}</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {([['ranking', 'Ranking', <BarChart2 className="w-4 h-4" />], ['tiers', 'Níveis', <Trophy className="w-4 h-4" />], ['badges', 'Conquistas', <Award className="w-4 h-4" />]] as [string, string, JSX.Element][]).map(([id, label, icon]) => (
          <button
            key={id}
            onClick={() => setTab(id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {icon}{label}
          </button>
        ))}
      </div>

      {/* RANKING TAB */}
      {tab === 'ranking' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leaderboard list */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Ranking Geral</h2>
            </div>
            <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
              {leaderboard.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Users className="w-12 h-12 mb-3 opacity-30" />
                  <p className="font-medium">Nenhum parceiro encontrado</p>
                  <p className="text-sm mt-1">Clique em "Sincronizar Dados" para carregar</p>
                </div>
              ) : leaderboard.map((p, idx) => {
                const tier = tierOf(p.current_tier)
                const gradient = TIER_GRADIENT[p.current_tier] || TIER_GRADIENT.bronze
                const isSelected = selected?.partner_account_id === p.partner_account_id
                return (
                  <button
                    key={p.partner_account_id}
                    onClick={() => setSelected(p)}
                    className={`w-full flex items-center gap-4 px-6 py-4 transition-all text-left hover:bg-gray-50 ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                  >
                    {/* position */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      idx === 0 ? 'bg-yellow-400 text-white' :
                      idx === 1 ? 'bg-gray-300 text-gray-700' :
                      idx === 2 ? 'bg-amber-600 text-white' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {p.ranking_position}
                    </div>
                    {/* tier badge */}
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white shrink-0`}>
                      {TIER_ICON[p.current_tier]}
                    </div>
                    {/* info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 truncate">{p.partner_name}</p>
                        {!p.is_active && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Inativo</span>}
                      </div>
                      <p className="text-xs text-gray-500">
                        {tier?.tier_name} · {p.converted_referrals} convertidas · {p.conversion_rate}% conversão
                      </p>
                    </div>
                    {/* commission */}
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-gray-900 text-sm">{fmt(p.total_commission_earned)}</p>
                      <p className="text-xs text-gray-400">{p.total_referrals} indicações</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Detail panel */}
          <div className="space-y-4">
            {selected ? (
              <>
                {/* Profile card */}
                <div className={`bg-gradient-to-br ${TIER_GRADIENT[selected.current_tier] || TIER_GRADIENT.bronze} rounded-xl p-6 text-white`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-2xl font-bold">
                      {selected.partner_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-lg leading-tight">{selected.partner_name}</p>
                      <div className="flex items-center gap-1 text-white text-opacity-90 text-sm">
                        {TIER_ICON[selected.current_tier]}
                        {tierOf(selected.current_tier)?.tier_name}
                      </div>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-2xl font-black">#{selected.ranking_position}</p>
                      <p className="text-xs text-white text-opacity-80">ranking</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-white bg-opacity-20 rounded-lg p-2">
                      <p className="text-lg font-bold">{selected.total_referrals}</p>
                      <p className="text-xs text-white text-opacity-80">Enviadas</p>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-lg p-2">
                      <p className="text-lg font-bold">{selected.converted_referrals}</p>
                      <p className="text-xs text-white text-opacity-80">Convertidas</p>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-lg p-2">
                      <p className="text-lg font-bold">{selected.conversion_rate}%</p>
                      <p className="text-xs text-white text-opacity-80">Taxa</p>
                    </div>
                  </div>
                </div>

                {/* Commission breakdown */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                  <h3 className="font-semibold text-gray-900 text-sm">Comissões</h3>
                  {[
                    { label: 'Total gerado', value: fmt(selected.total_commission_earned), color: 'text-gray-900' },
                    { label: 'Pago', value: fmt(selected.commission_paid), color: 'text-green-600' },
                    { label: 'Pendente', value: fmt(selected.commission_pending), color: 'text-orange-600' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{row.label}</span>
                      <span className={`font-semibold text-sm ${row.color}`}>{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* Progress to next tier */}
                {(() => {
                  const currentIdx = tiers.findIndex(t => t.tier_level === selected.current_tier)
                  const next = tiers[currentIdx + 1]
                  if (!next) return (
                    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-3">
                      <Crown className="w-8 h-8 text-rose-500" />
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">Status VIP atingido!</p>
                        <p className="text-xs text-gray-400">Nivel maximo de parceria</p>
                      </div>
                    </div>
                  )
                  const pctRef = Math.min(100, (selected.total_referrals / next.min_referrals) * 100)
                  const pctConv = Math.min(100, (selected.converted_referrals / next.min_converted) * 100)
                  const pctComm = Math.min(100, next.min_commission > 0 ? (selected.total_commission_earned / next.min_commission) * 100 : 100)
                  const overall = Math.round((pctRef + pctConv + pctComm) / 3)
                  return (
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900 text-sm">Progresso para {next.tier_name}</h3>
                        <span className="text-xs font-bold text-blue-600">{overall}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                        <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${overall}%` }} />
                      </div>
                      <div className="space-y-1.5 text-xs text-gray-500">
                        <div className="flex justify-between"><span>Indicações ({selected.total_referrals}/{next.min_referrals})</span><span className="font-medium">{Math.round(pctRef)}%</span></div>
                        <div className="flex justify-between"><span>Convertidas ({selected.converted_referrals}/{next.min_converted})</span><span className="font-medium">{Math.round(pctConv)}%</span></div>
                        <div className="flex justify-between"><span>Comissões ({fmt(selected.total_commission_earned)}/{fmt(next.min_commission)})</span><span className="font-medium">{Math.round(pctComm)}%</span></div>
                      </div>
                    </div>
                  )
                })()}

                {/* Badges */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-900 text-sm mb-3">
                    Conquistas ({partnerBadges.length}/{badgesCatalog.length})
                  </h3>
                  {partnerBadges.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">Nenhuma conquista ainda</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {partnerBadges.map(b => (
                        <div
                          key={b.id}
                          title={`${b.badge_name}: ${b.description}`}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${BADGE_LEVEL_COLOR[b.badge_level] || BADGE_LEVEL_COLOR.bronze}`}
                        >
                          {BADGE_ICON_MAP[b.badge_icon] || <Award className="w-3.5 h-3.5" />}
                          {b.badge_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-16 text-gray-400">
                <Users className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">Selecione um parceiro</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TIERS TAB */}
      {tab === 'tiers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tiers.map(tier => {
              const count = leaderboard.filter(p => p.current_tier === tier.tier_level).length
              return (
                <div key={tier.tier_level} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className={`bg-gradient-to-r ${TIER_GRADIENT[tier.tier_level] || TIER_GRADIENT.bronze} p-5 text-white`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {TIER_ICON[tier.tier_level]}
                        <div>
                          <p className="font-bold text-lg">{tier.tier_name}</p>
                          <p className="text-xs text-white text-opacity-80">
                            +{tier.commission_bonus_percent}% bônus em comissões
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black">{count}</p>
                        <p className="text-xs text-white text-opacity-80">parceiros</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-3 gap-3 mb-4 text-center text-xs">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="font-bold text-gray-900">{tier.min_referrals}</p>
                        <p className="text-gray-500">indicações</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="font-bold text-gray-900">{tier.min_converted}</p>
                        <p className="text-gray-500">convertidas</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="font-bold text-gray-900">{fmt(tier.min_commission)}</p>
                        <p className="text-gray-500">comissões</p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {tier.benefits.map((b, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                          {b}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Distribution bar */}
          {leaderboard.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Distribuição por Nível</h3>
              <div className="space-y-3">
                {tiers.map(tier => {
                  const count = leaderboard.filter(p => p.current_tier === tier.tier_level).length
                  const pct = leaderboard.length > 0 ? (count / leaderboard.length) * 100 : 0
                  return (
                    <div key={tier.tier_level} className="flex items-center gap-4">
                      <div className="flex items-center gap-2 w-28 shrink-0">
                        <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${TIER_GRADIENT[tier.tier_level]} flex items-center justify-center text-white`}>
                          {TIER_ICON[tier.tier_level]}
                        </div>
                        <span className="text-sm font-medium text-gray-700">{tier.tier_name}</span>
                      </div>
                      <div className="flex-1 bg-gray-100 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full bg-gradient-to-r ${TIER_GRADIENT[tier.tier_level]} transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 w-16 text-right">{count} ({Math.round(pct)}%)</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* BADGES TAB */}
      {tab === 'badges' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {badgesCatalog.map(badge => {
            const earnedCount = leaderboard.filter(p => {
              return false
            }).length

            return (
              <div key={badge.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${BADGE_LEVEL_COLOR[badge.badge_level] || BADGE_LEVEL_COLOR.bronze} shrink-0`}>
                    {BADGE_ICON_MAP[badge.badge_icon] || <Award className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{badge.badge_name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${BADGE_LEVEL_COLOR[badge.badge_level] || BADGE_LEVEL_COLOR.bronze}`}>
                        {badge.badge_level}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{badge.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1 text-xs text-yellow-600 font-medium">
                        <Zap className="w-3.5 h-3.5" />
                        {badge.points_awarded} pts
                      </div>
                      {badge.requirement_type && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Target className="w-3.5 h-3.5" />
                          {badge.requirement_type}: {badge.requirement_value}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default PartnerGamification
