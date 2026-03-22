import { useState, useEffect } from 'react'
import {
  Trophy, Star, Award, TrendingUp, Gift, Crown, Users, Zap, CheckCircle,
  XCircle, Search, Target, DollarSign, Clock, BarChart2, Gem, RefreshCw,
  ChevronRight, Settings, UserCheck, FileText
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useToast } from '../hooks/useToast'
import { formatDateSafe } from '../utils/format'

type TopTab = 'clientes' | 'parceiros' | 'gerenciar'

// ─── Customer types ───────────────────────────────────────────────────────────
interface CustomerPoint {
  id: string
  customer_id: string
  customer_name: string
  total_points: number
  available_points: number
  current_tier: string
  total_purchases: number
  total_spent: number
  ranking_position: number
  total_badges: number
}

interface CustomerBadge {
  id: string
  badge_name: string
  description: string
  badge_level: string
  badge_icon: string
  earned_date?: string
}

interface TierBenefit {
  tier_level: string
  benefit_type: string
  benefit_description: string
  benefit_value: string
}

// ─── Partner types ────────────────────────────────────────────────────────────
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

interface PartnerTier {
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

interface PartnerBadge {
  id: string
  badge_key: string
  badge_name: string
  description: string
  badge_icon: string
  badge_level: string
  points_awarded: number
  earned_at?: string
}

// ─── Manager types ────────────────────────────────────────────────────────────
interface ManagedCustomer {
  id: string
  nome_razao: string
  participa_gamificacao: boolean
  data_adesao_gamificacao: string | null
  total_points: number
  total_purchases: number
  total_spent: number
  current_tier: string
  os_pendentes_inclusao: number
  valor_pendente: number
}

interface ServiceOrder {
  id: string
  order_number: string
  customer_id: string
  customer_name: string
  participa_gamificacao: boolean
  status: string
  total_value: number
  created_at: string
  incluir_gamificacao: boolean
  pontos_gerados: number
  status_gamificacao: string
  pode_incluir: boolean
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
const TIER_GRADIENT: Record<string, string> = {
  bronze:  'from-orange-600 to-amber-700',
  silver:  'from-gray-400 to-gray-600',
  gold:    'from-yellow-400 to-yellow-600',
  diamond: 'from-cyan-400 to-blue-600',
  vip:     'from-rose-500 to-pink-700',
}
const TIER_NAMES: Record<string, string> = {
  bronze: 'Bronze', silver: 'Prata', gold: 'Ouro', diamond: 'Diamante', vip: 'VIP'
}
const TIER_COLORS_BADGE: Record<string, string> = {
  bronze:  'bg-amber-100 text-amber-800 border-amber-300',
  silver:  'bg-gray-100 text-gray-700 border-gray-300',
  gold:    'bg-yellow-100 text-yellow-800 border-yellow-300',
  diamond: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  vip:     'bg-rose-100 text-rose-800 border-rose-300',
}
const TIER_ICON = (t: string, cls = 'w-4 h-4'): JSX.Element => {
  const icons: Record<string, JSX.Element> = {
    bronze:  <Award className={cls} />,
    silver:  <Star className={cls} />,
    gold:    <Trophy className={cls} />,
    diamond: <Gem className={cls} />,
    vip:     <Crown className={cls} />,
  }
  return icons[t] || icons.bronze
}
const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
const fmtN = (n: number) => new Intl.NumberFormat('pt-BR').format(n)

const PARTNER_BADGE_ICONS: Record<string, JSX.Element> = {
  'star': <Star className="w-4 h-4" />, 'users': <Users className="w-4 h-4" />,
  'check-circle': <CheckCircle className="w-4 h-4" />, 'trending-up': <TrendingUp className="w-4 h-4" />,
  'trophy': <Trophy className="w-4 h-4" />, 'dollar-sign': <DollarSign className="w-4 h-4" />,
  'gem': <Gem className="w-4 h-4" />, 'crown': <Crown className="w-4 h-4" />,
  'zap': <Zap className="w-4 h-4" />, 'award': <Award className="w-4 h-4" />,
}

// ─── Sub-tab pills ─────────────────────────────────────────────────────────────
const SubTabs = ({ tabs, active, onChange }: { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) => (
  <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
    {tabs.map(t => (
      <button
        key={t.id}
        onClick={() => onChange(t.id)}
        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${active === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
      >
        {t.label}
      </button>
    ))}
  </div>
)

// ─── Customer section ─────────────────────────────────────────────────────────
const CustomerSection = () => {
  const [subTab, setSubTab] = useState('ranking')
  const [leaderboard, setLeaderboard] = useState<CustomerPoint[]>([])
  const [selected, setSelected] = useState<CustomerPoint | null>(null)
  const [customerBadges, setCustomerBadges] = useState<CustomerBadge[]>([])
  const [allBadges, setAllBadges] = useState<CustomerBadge[]>([])
  const [benefits, setBenefits] = useState<TierBenefit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])
  useEffect(() => { if (selected) loadCustomerBadges(selected.customer_id) }, [selected])

  const loadData = async () => {
    setLoading(true)
    try {
      const [{ data: lb }, { data: bg }, { data: bf }] = await Promise.all([
        supabase.from('v_customer_leaderboard').select('*').limit(50),
        supabase.from('customer_badges').select('*').eq('active', true),
        supabase.from('customer_tier_benefits').select('*').eq('active', true).order('display_order'),
      ])
      setLeaderboard(lb || [])
      setAllBadges(bg || [])
      setBenefits(bf || [])
      if (lb && lb.length > 0 && !selected) setSelected(lb[0])
    } finally { setLoading(false) }
  }

  const loadCustomerBadges = async (customerId: string) => {
    const { data } = await supabase
      .from('customer_badges_earned')
      .select('earned_date, customer_badges(id, badge_name, description, badge_level, badge_icon)')
      .eq('customer_id', customerId)
    setCustomerBadges((data || []).map((r: any) => ({ ...r.customer_badges, earned_date: r.earned_date })))
  }

  const getTierInfo = (tier: string) => ({
    name: TIER_NAMES[tier] || tier,
    color: TIER_GRADIENT[tier] || TIER_GRADIENT.bronze,
    icon: TIER_ICON(tier, 'h-5 w-5'),
    min: { bronze: 0, silver: 1000, gold: 3000, diamond: 7000, vip: 15000 }[tier] ?? 0
  })

  const getNextTier = (tier: string, pts: number) => {
    const order = ['bronze', 'silver', 'gold', 'diamond', 'vip']
    const idx = order.indexOf(tier)
    if (idx === order.length - 1) return { nextTier: 'VIP', pointsNeeded: 0, progress: 100 }
    const next = order[idx + 1]
    const cur = getTierInfo(tier)
    const nxt = getTierInfo(next)
    const needed = nxt.min - pts
    const progress = ((pts - cur.min) / (nxt.min - cur.min)) * 100
    return { nextTier: TIER_NAMES[next], pointsNeeded: needed, progress: Math.min(progress, 100) }
  }

  const stats = {
    total: leaderboard.length,
    pts: leaderboard.reduce((s, c) => s + c.total_points, 0),
    avg: leaderboard.length ? Math.round(leaderboard.reduce((s, c) => s + c.total_points, 0) / leaderboard.length) : 0,
    vip: leaderboard.filter(c => c.current_tier === 'vip').length,
  }

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Clientes no Sistema', value: fmtN(stats.total), icon: <Users className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-50 border-blue-100' },
          { label: 'Pontos Totais', value: fmtN(stats.pts), icon: <Star className="w-5 h-5 text-yellow-600" />, bg: 'bg-yellow-50 border-yellow-100' },
          { label: 'Média de Pontos', value: fmtN(stats.avg), icon: <TrendingUp className="w-5 h-5 text-green-600" />, bg: 'bg-green-50 border-green-100' },
          { label: 'Clientes VIP', value: fmtN(stats.vip), icon: <Crown className="w-5 h-5 text-rose-600" />, bg: 'bg-rose-50 border-rose-100' },
        ].map((k, i) => (
          <div key={i} className={`${k.bg} border rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-1">{k.icon}<span className="text-xs text-gray-500">{k.label}</span></div>
            <p className="text-xl font-bold text-gray-900">{k.value}</p>
          </div>
        ))}
      </div>

      <SubTabs tabs={[{ id: 'ranking', label: 'Ranking' }, { id: 'badges', label: 'Conquistas' }]} active={subTab} onChange={setSubTab} />

      {subTab === 'ranking' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* leaderboard */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Ranking de Clientes</h2>
            </div>
            <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {['Pos.', 'Cliente', 'Nível', 'Pontos', 'Compras', 'Badges'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {leaderboard.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">Nenhum cliente com pontos ainda</td></tr>
                  ) : leaderboard.map(c => {
                    const t = getTierInfo(c.current_tier)
                    return (
                      <tr key={c.id} onClick={() => setSelected(c)} className={`cursor-pointer hover:bg-gray-50 ${selected?.id === c.id ? 'bg-blue-50' : ''}`}>
                        <td className="px-4 py-3">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${c.ranking_position === 1 ? 'bg-yellow-400 text-white' : c.ranking_position === 2 ? 'bg-gray-300 text-gray-700' : c.ranking_position === 3 ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-500'}`}>{c.ranking_position}</div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{c.customer_name}</p>
                          <p className="text-xs text-gray-400">{fmt(c.total_spent)} gastos</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r ${t.color} text-white text-xs font-semibold`}>
                            {t.icon}{t.name}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-900">{fmtN(c.total_points)}</td>
                        <td className="px-4 py-3 text-gray-700">{c.total_purchases}</td>
                        <td className="px-4 py-3 text-gray-700">{c.total_badges}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* detail */}
          <div className="space-y-4">
            {selected ? (() => {
              const t = getTierInfo(selected.current_tier)
              const nxt = getNextTier(selected.current_tier, selected.total_points)
              return (
                <>
                  <div className={`bg-gradient-to-br ${t.color} rounded-xl p-5 text-white`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-full bg-white bg-opacity-20 flex items-center justify-center font-bold text-lg">{selected.customer_name.charAt(0)}</div>
                      <div className="flex-1">
                        <p className="font-bold">{selected.customer_name}</p>
                        <div className="flex items-center gap-1 text-sm text-white text-opacity-90">{t.icon}{t.name}</div>
                      </div>
                      <div className="text-right"><p className="text-2xl font-black">#{selected.ranking_position}</p><p className="text-xs opacity-70">ranking</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white bg-opacity-20 rounded-lg p-2 text-center"><p className="text-lg font-bold">{fmtN(selected.total_points)}</p><p className="text-xs opacity-80">pontos</p></div>
                      <div className="bg-white bg-opacity-20 rounded-lg p-2 text-center"><p className="text-lg font-bold">{selected.total_purchases}</p><p className="text-xs opacity-80">compras</p></div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-500">Progresso para {nxt.nextTier}</span>
                      <span className="font-semibold">{selected.current_tier === 'vip' ? 'Nível Máximo!' : `${fmtN(nxt.pointsNeeded)} pts`}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div className={`h-2.5 rounded-full bg-gradient-to-r ${t.color}`} style={{ width: `${nxt.progress}%` }} />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h3 className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-yellow-500" />Badges ({customerBadges.length})</h3>
                    {customerBadges.length === 0 ? <p className="text-sm text-gray-400">Nenhum badge ainda</p> : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {customerBadges.map(b => (
                          <div key={b.id} className={`px-3 py-2 rounded-lg border text-xs font-medium ${TIER_COLORS_BADGE[b.badge_level] || TIER_COLORS_BADGE.bronze}`}>
                            <p className="font-semibold">{b.badge_name}</p>
                            <p className="opacity-80 mt-0.5">{b.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h3 className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2"><Gift className="w-4 h-4 text-blue-500" />Benefícios do Nível</h3>
                    <div className="space-y-1.5">
                      {benefits.filter(b => b.tier_level === selected.current_tier).map((b, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                          <div><p className="font-medium text-gray-800">{b.benefit_description}</p>{b.benefit_value && <p className="text-xs text-gray-500">{b.benefit_value}</p>}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )
            })() : (
              <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-16 text-gray-400">
                <Users className="w-12 h-12 mb-3 opacity-30" /><p className="text-sm">Selecione um cliente</p>
              </div>
            )}
          </div>
        </div>
      )}

      {subTab === 'badges' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Todos os Badges Disponíveis</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {allBadges.map(b => (
              <div key={b.id} className={`p-4 rounded-xl border-2 ${TIER_COLORS_BADGE[b.badge_level] || TIER_COLORS_BADGE.bronze}`}>
                <div className="flex items-start justify-between mb-2">
                  <Award className="w-7 h-7" />
                  <span className="text-xs font-bold uppercase">{b.badge_level}</span>
                </div>
                <p className="font-bold text-sm">{b.badge_name}</p>
                <p className="text-xs opacity-80 mt-0.5">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Partner section ──────────────────────────────────────────────────────────
const PartnerSection = () => {
  const [subTab, setSubTab] = useState('ranking')
  const [leaderboard, setLeaderboard] = useState<PartnerEntry[]>([])
  const [tiers, setTiers] = useState<PartnerTier[]>([])
  const [badgesCatalog, setBadgesCatalog] = useState<PartnerBadge[]>([])
  const [selected, setSelected] = useState<PartnerEntry | null>(null)
  const [partnerBadges, setPartnerBadges] = useState<PartnerBadge[]>([])
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
    } finally { setLoading(false) }
  }

  const loadPartnerBadges = async (id: string) => {
    const { data } = await supabase
      .from('partner_badges_earned')
      .select('earned_at, partner_badges_catalog(*)')
      .eq('partner_account_id', id)
    setPartnerBadges((data || []).map((r: any) => ({ ...r.partner_badges_catalog, earned_at: r.earned_at })))
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const { data, error } = await supabase.rpc('sync_all_partners_gamification')
      if (error) throw error
      showToast(`${data} parceiros sincronizados!`, 'success')
      loadAll()
    } catch { showToast('Erro ao sincronizar', 'error') }
    finally { setSyncing(false) }
  }

  const tierOf = (level: string) => tiers.find(t => t.tier_level === level)

  const stats = {
    total: leaderboard.length,
    active: leaderboard.filter(p => p.is_active).length,
    converted: leaderboard.reduce((s, p) => s + p.converted_referrals, 0),
    commission: leaderboard.reduce((s, p) => s + p.total_commission_earned, 0),
    pending: leaderboard.reduce((s, p) => s + p.commission_pending, 0),
  }

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>

  return (
    <div className="space-y-5">
      {/* KPIs + sync */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 flex-1">
          {[
            { label: 'Total Parceiros', value: fmtN(stats.total), icon: <Users className="w-4 h-4 text-blue-600" />, bg: 'bg-blue-50 border-blue-100' },
            { label: 'Ativos', value: fmtN(stats.active), icon: <CheckCircle className="w-4 h-4 text-green-600" />, bg: 'bg-green-50 border-green-100' },
            { label: 'Convertidas', value: fmtN(stats.converted), icon: <Target className="w-4 h-4 text-orange-600" />, bg: 'bg-orange-50 border-orange-100' },
            { label: 'Comissões Geradas', value: fmt(stats.commission), icon: <DollarSign className="w-4 h-4 text-yellow-600" />, bg: 'bg-yellow-50 border-yellow-100' },
            { label: 'Comissões Pendentes', value: fmt(stats.pending), icon: <Clock className="w-4 h-4 text-rose-600" />, bg: 'bg-rose-50 border-rose-100' },
          ].map((k, i) => (
            <div key={i} className={`${k.bg} border rounded-xl p-3`}>
              <div className="flex items-center gap-1.5 mb-1">{k.icon}<span className="text-xs text-gray-500">{k.label}</span></div>
              <p className="text-lg font-bold text-gray-900">{k.value}</p>
            </div>
          ))}
        </div>
        <button onClick={handleSync} disabled={syncing} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 shrink-0">
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Sincronizando...' : 'Sincronizar'}
        </button>
      </div>

      <SubTabs
        tabs={[{ id: 'ranking', label: 'Ranking' }, { id: 'niveis', label: 'Níveis' }, { id: 'conquistas', label: 'Conquistas' }]}
        active={subTab}
        onChange={setSubTab}
      />

      {subTab === 'ranking' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100"><h2 className="font-semibold text-gray-900">Ranking de Parceiros</h2></div>
            <div className="divide-y divide-gray-50 max-h-[520px] overflow-y-auto">
              {leaderboard.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Users className="w-12 h-12 mb-3 opacity-30" /><p>Nenhum parceiro. Clique em Sincronizar.</p>
                </div>
              ) : leaderboard.map((p, idx) => {
                const grad = TIER_GRADIENT[p.current_tier] || TIER_GRADIENT.bronze
                const isSel = selected?.partner_account_id === p.partner_account_id
                return (
                  <button key={p.partner_account_id} onClick={() => setSelected(p)}
                    className={`w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-gray-50 transition-colors ${isSel ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${idx === 0 ? 'bg-yellow-400 text-white' : idx === 1 ? 'bg-gray-300 text-gray-700' : idx === 2 ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-500'}`}>{p.ranking_position}</div>
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white shrink-0`}>{TIER_ICON(p.current_tier)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 truncate">{p.partner_name}</p>
                        {!p.is_active && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Inativo</span>}
                      </div>
                      <p className="text-xs text-gray-500">{TIER_NAMES[p.current_tier]} · {p.converted_referrals} convertidas · {p.conversion_rate}% conv.</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-sm text-gray-900">{fmt(p.total_commission_earned)}</p>
                      <p className="text-xs text-gray-400">{p.total_referrals} indicações</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-4">
            {selected ? (() => {
              const curIdx = tiers.findIndex(t => t.tier_level === selected.current_tier)
              const next = tiers[curIdx + 1]
              const grad = TIER_GRADIENT[selected.current_tier] || TIER_GRADIENT.bronze
              return (
                <>
                  <div className={`bg-gradient-to-br ${grad} rounded-xl p-5 text-white`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-11 h-11 rounded-full bg-white bg-opacity-20 flex items-center justify-center font-bold text-lg">{selected.partner_name.charAt(0)}</div>
                      <div className="flex-1"><p className="font-bold">{selected.partner_name}</p><div className="flex items-center gap-1 text-sm opacity-90">{TIER_ICON(selected.current_tier)}{TIER_NAMES[selected.current_tier]}</div></div>
                      <div className="text-right"><p className="text-2xl font-black">#{selected.ranking_position}</p><p className="text-xs opacity-70">ranking</p></div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[['total_referrals', 'Enviadas'], ['converted_referrals', 'Convertidas'], ['conversion_rate', 'Taxa %']].map(([k, l]) => (
                        <div key={k} className="bg-white bg-opacity-20 rounded-lg p-2 text-center">
                          <p className="text-base font-bold">{(selected as any)[k]}</p><p className="text-xs opacity-80">{l}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
                    <h3 className="font-semibold text-sm text-gray-900">Comissões</h3>
                    {[['Total gerado', fmt(selected.total_commission_earned), 'text-gray-900'], ['Pago', fmt(selected.commission_paid), 'text-green-600'], ['Pendente', fmt(selected.commission_pending), 'text-orange-600']].map(([l, v, c]) => (
                      <div key={l} className="flex justify-between text-sm"><span className="text-gray-500">{l}</span><span className={`font-semibold ${c}`}>{v}</span></div>
                    ))}
                  </div>

                  {next ? (() => {
                    const pctR = Math.min(100, (selected.total_referrals / next.min_referrals) * 100)
                    const pctC = Math.min(100, next.min_converted > 0 ? (selected.converted_referrals / next.min_converted) * 100 : 100)
                    const pctM = Math.min(100, next.min_commission > 0 ? (selected.total_commission_earned / next.min_commission) * 100 : 100)
                    const overall = Math.round((pctR + pctC + pctM) / 3)
                    return (
                      <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex justify-between mb-2"><h3 className="font-semibold text-sm text-gray-900">Progresso para {next.tier_name}</h3><span className="text-xs font-bold text-blue-600">{overall}%</span></div>
                        <div className="w-full bg-gray-100 rounded-full h-2 mb-3"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${overall}%` }} /></div>
                        <div className="space-y-1 text-xs text-gray-500">
                          <div className="flex justify-between"><span>Indicações ({selected.total_referrals}/{next.min_referrals})</span><span className="font-medium">{Math.round(pctR)}%</span></div>
                          <div className="flex justify-between"><span>Convertidas ({selected.converted_referrals}/{next.min_converted})</span><span className="font-medium">{Math.round(pctC)}%</span></div>
                          <div className="flex justify-between"><span>Comissões</span><span className="font-medium">{Math.round(pctM)}%</span></div>
                        </div>
                      </div>
                    )
                  })() : (
                    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                      <Crown className="w-8 h-8 text-rose-500" /><div><p className="font-semibold text-sm">Status VIP atingido!</p><p className="text-xs text-gray-400">Nível máximo de parceria</p></div>
                    </div>
                  )}

                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h3 className="font-semibold text-sm text-gray-900 mb-3">Conquistas ({partnerBadges.length})</h3>
                    {partnerBadges.length === 0 ? <p className="text-xs text-gray-400">Nenhuma conquista ainda</p> : (
                      <div className="flex flex-wrap gap-2">
                        {partnerBadges.map(b => (
                          <div key={b.id} title={b.description} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${TIER_COLORS_BADGE[b.badge_level] || TIER_COLORS_BADGE.bronze}`}>
                            {PARTNER_BADGE_ICONS[b.badge_icon] || <Award className="w-3.5 h-3.5" />}{b.badge_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )
            })() : (
              <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-16 text-gray-400">
                <Users className="w-12 h-12 mb-3 opacity-30" /><p className="text-sm">Selecione um parceiro</p>
              </div>
            )}
          </div>
        </div>
      )}

      {subTab === 'niveis' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tiers.map(tier => {
              const count = leaderboard.filter(p => p.current_tier === tier.tier_level).length
              return (
                <div key={tier.tier_level} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className={`bg-gradient-to-r ${TIER_GRADIENT[tier.tier_level] || TIER_GRADIENT.bronze} p-5 text-white`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">{TIER_ICON(tier.tier_level, 'w-5 h-5')}<div><p className="font-bold">{tier.tier_name}</p><p className="text-xs opacity-80">+{tier.commission_bonus_percent}% comissão</p></div></div>
                      <div className="text-right"><p className="text-2xl font-black">{count}</p><p className="text-xs opacity-80">parceiros</p></div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-3 gap-2 mb-3 text-center text-xs">
                      <div className="bg-gray-50 rounded-lg p-2"><p className="font-bold text-gray-900">{tier.min_referrals}</p><p className="text-gray-500">indicações</p></div>
                      <div className="bg-gray-50 rounded-lg p-2"><p className="font-bold text-gray-900">{tier.min_converted}</p><p className="text-gray-500">convertidas</p></div>
                      <div className="bg-gray-50 rounded-lg p-2"><p className="font-bold text-gray-900">{fmt(tier.min_commission)}</p><p className="text-gray-500">comissões</p></div>
                    </div>
                    <div className="space-y-1.5">
                      {tier.benefits.map((b, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
                          <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />{b}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {leaderboard.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Distribuição por Nível</h3>
              <div className="space-y-3">
                {tiers.map(tier => {
                  const count = leaderboard.filter(p => p.current_tier === tier.tier_level).length
                  const pct = leaderboard.length > 0 ? (count / leaderboard.length) * 100 : 0
                  return (
                    <div key={tier.tier_level} className="flex items-center gap-4">
                      <div className="flex items-center gap-2 w-24 shrink-0">
                        <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${TIER_GRADIENT[tier.tier_level]} flex items-center justify-center text-white`}>{TIER_ICON(tier.tier_level, 'w-3 h-3')}</div>
                        <span className="text-sm font-medium text-gray-700">{tier.tier_name}</span>
                      </div>
                      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                        <div className={`h-2.5 rounded-full bg-gradient-to-r ${TIER_GRADIENT[tier.tier_level]}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 w-20 text-right">{count} ({Math.round(pct)}%)</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {subTab === 'conquistas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {badgesCatalog.map(badge => (
            <div key={badge.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center border-2 ${TIER_COLORS_BADGE[badge.badge_level] || TIER_COLORS_BADGE.bronze} shrink-0`}>
                  {PARTNER_BADGE_ICONS[badge.badge_icon] || <Award className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{badge.badge_name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${TIER_COLORS_BADGE[badge.badge_level] || TIER_COLORS_BADGE.bronze}`}>{badge.badge_level}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{badge.description}</p>
                  <div className="flex items-center gap-1 mt-1.5 text-xs text-yellow-600 font-medium">
                    <Zap className="w-3.5 h-3.5" />{badge.points_awarded} pts
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Manager section ──────────────────────────────────────────────────────────
const ManagerSection = () => {
  const [subTab, setSubTab] = useState<'customers' | 'orders'>('customers')
  const [customers, setCustomers] = useState<ManagedCustomer[]>([])
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterC, setFilterC] = useState<'all' | 'participants' | 'non_participants'>('all')
  const [filterO, setFilterO] = useState<'all' | 'available' | 'included'>('all')
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const { showToast } = useToast()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [{ data: c }, { data: o }] = await Promise.all([
        supabase.from('v_relatorio_gamificacao_cliente').select('*').order('total_points', { ascending: false }),
        supabase.from('v_os_disponiveis_gamificacao').select('*').order('created_at', { ascending: false }),
      ])
      setCustomers(c || [])
      setOrders(o || [])
    } finally { setLoading(false) }
  }

  const activateCustomer = async (id: string, processOld: boolean) => {
    try {
      const { data, error } = await supabase.rpc('ativar_gamificacao_cliente', { p_customer_id: id, p_processar_os_antigas: processOld })
      if (error) throw error
      showToast(processOld ? `Ativado! ${data.os_marcadas_para_processar} OSs marcadas.` : 'Cliente ativado!', 'success')
      loadData()
    } catch { showToast('Erro ao ativar gamificação', 'error') }
  }

  const deactivateCustomer = async (id: string) => {
    if (!confirm('Deseja realmente desativar a gamificação para este cliente?')) return
    try {
      const { error } = await supabase.rpc('desativar_gamificacao_cliente', { p_customer_id: id, p_motivo: 'Desativado pelo usuário', p_remover_pontos: false })
      if (error) throw error
      showToast('Cliente desativado. Pontos mantidos.', 'success')
      loadData()
    } catch { showToast('Erro ao desativar', 'error') }
  }

  const includeOrder = async (orderId: string) => {
    try {
      const { data, error } = await supabase.rpc('incluir_os_na_gamificacao', { p_service_order_id: orderId })
      if (error) throw error
      if (data.success) { showToast(`OS incluída! ${data.pontos_gerados} pontos gerados.`, 'success'); loadData() }
      else showToast(data.error || 'Erro ao incluir OS', 'error')
    } catch { showToast('Erro ao incluir OS', 'error') }
  }

  const includeMultiple = async () => {
    if (!selectedOrders.size) return
    if (!confirm(`Incluir ${selectedOrders.size} OSs na gamificação?`)) return
    try {
      const { data, error } = await supabase.rpc('incluir_multiplas_os_gamificacao', { p_service_order_ids: Array.from(selectedOrders) })
      if (error) throw error
      showToast(`${data.total_processadas} OSs processadas! ${data.total_pontos_gerados} pontos gerados.`, 'success')
      setSelectedOrders(new Set()); loadData()
    } catch { showToast('Erro ao processar OSs', 'error') }
  }

  const filteredC = customers.filter(c => {
    const ms = c.nome_razao?.toLowerCase().includes(search.toLowerCase()) ?? false
    const mf = filterC === 'all' || (filterC === 'participants' && c.participa_gamificacao) || (filterC === 'non_participants' && !c.participa_gamificacao)
    return ms && mf
  })

  const filteredO = orders.filter(o => {
    const ms = o.customer_name?.toLowerCase().includes(search.toLowerCase()) || o.order_number?.toLowerCase().includes(search.toLowerCase())
    const mf = filterO === 'all' || (filterO === 'available' && o.pode_incluir) || (filterO === 'included' && o.incluir_gamificacao)
    return ms && mf
  })

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>

  return (
    <div className="space-y-5">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Award className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-blue-900 text-sm">Como funciona</p>
          <ul className="text-sm text-blue-800 mt-1 space-y-0.5">
            <li>• Ative clientes para que participem da gamificação</li>
            <li>• Marque OSs concluídas para gerar pontos automaticamente</li>
            <li>• Clientes inativos não acumulam pontos mesmo com OSs concluídas</li>
          </ul>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200 pb-0">
        {([['customers', <UserCheck className="w-4 h-4" />, `Clientes (${customers.filter(c => c.participa_gamificacao).length} ativos)`], ['orders', <FileText className="w-4 h-4" />, `OSs (${orders.filter(o => o.pode_incluir).length} disponíveis)`]] as [string, JSX.Element, string][]).map(([id, icon, label]) => (
          <button key={id} onClick={() => setSubTab(id as any)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${subTab === id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {icon}{label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div className="flex gap-1.5">
            {subTab === 'customers' ? (
              [['all', 'Todos'], ['participants', 'Ativos'], ['non_participants', 'Inativos']].map(([v, l]) => (
                <button key={v} onClick={() => setFilterC(v as any)}
                  className={`px-3 py-2 rounded-lg text-sm ${filterC === v ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{l}</button>
              ))
            ) : (
              [['all', 'Todas'], ['available', 'Disponíveis'], ['included', 'Incluídas']].map(([v, l]) => (
                <button key={v} onClick={() => setFilterO(v as any)}
                  className={`px-3 py-2 rounded-lg text-sm ${filterO === v ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{l}</button>
              ))
            )}
          </div>
        </div>

        {subTab === 'customers' ? (
          <div className="space-y-3">
            {filteredC.length === 0 ? (
              <div className="text-center py-12 text-gray-400"><Users className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>Nenhum cliente encontrado</p></div>
            ) : filteredC.map(c => (
              <div key={c.id} className={`border rounded-xl p-4 ${c.participa_gamificacao ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-semibold text-gray-900">{c.nome_razao || 'Cliente sem nome'}</p>
                      {c.participa_gamificacao && c.current_tier && (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${TIER_COLORS_BADGE[c.current_tier] || TIER_COLORS_BADGE.bronze}`}>{TIER_NAMES[c.current_tier]}</span>
                      )}
                    </div>
                    {c.participa_gamificacao ? (
                      <div className="flex gap-4 text-sm flex-wrap">
                        <span className="text-blue-600 font-semibold">{fmtN(c.total_points)} pts</span>
                        <span className="text-gray-500">{c.total_purchases} compras</span>
                        <span className="text-gray-500">{fmt(c.total_spent)} gastos</span>
                        {c.data_adesao_gamificacao && <span className="text-gray-400">desde {formatDateSafe(c.data_adesao_gamificacao)}</span>}
                      </div>
                    ) : <p className="text-sm text-gray-400">Não participa da gamificação</p>}
                    {c.os_pendentes_inclusao > 0 && c.participa_gamificacao && (
                      <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1.5 text-xs text-yellow-800">
                        {c.os_pendentes_inclusao} OS(s) pendentes ({fmt(c.valor_pendente)})
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {c.participa_gamificacao ? (
                      <button onClick={() => deactivateCustomer(c.id)} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 flex items-center gap-1.5">
                        <XCircle className="w-4 h-4" />Desativar
                      </button>
                    ) : (
                      <>
                        <button onClick={() => activateCustomer(c.id, false)} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4" />Ativar
                        </button>
                        <button onClick={() => activateCustomer(c.id, true)} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4" />Ativar + OSs
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {selectedOrders.size > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between">
                <p className="text-sm text-blue-900">{selectedOrders.size} OS(s) selecionadas</p>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedOrders(new Set())} className="px-3 py-1.5 bg-white text-gray-700 rounded-lg text-sm border border-gray-300">Limpar</button>
                  <button onClick={includeMultiple} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm">Processar</button>
                </div>
              </div>
            )}
            {filteredO.length === 0 ? (
              <div className="text-center py-12 text-gray-400"><Award className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>Nenhuma OS encontrada</p></div>
            ) : filteredO.map(o => (
              <div key={o.id} className={`border rounded-xl p-4 ${o.incluir_gamificacao ? 'border-green-200 bg-green-50' : o.pode_incluir ? 'border-blue-100 bg-blue-50' : 'border-gray-200'}`}>
                <div className="flex items-center gap-4">
                  {o.pode_incluir && (
                    <input type="checkbox" checked={selectedOrders.has(o.id)}
                      onChange={e => { const s = new Set(selectedOrders); e.target.checked ? s.add(o.id) : s.delete(o.id); setSelectedOrders(s) }}
                      className="w-4 h-4 text-blue-600 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-semibold text-gray-900">OS #{o.order_number || 'S/N'}</p>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${o.status_gamificacao === 'Disponível' ? 'bg-blue-100 text-blue-800' : o.status_gamificacao === 'Já incluída' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {o.status_gamificacao}
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm text-gray-500 flex-wrap">
                      <span>{o.customer_name}</span>
                      <span>{fmt(o.total_value || 0)}</span>
                      <span>{o.created_at ? formatDateSafe(o.created_at) : '-'}</span>
                      {o.incluir_gamificacao && (o.pontos_gerados || 0) > 0 && <span className="text-green-600 font-semibold">{o.pontos_gerados} pts</span>}
                    </div>
                  </div>
                  {o.pode_incluir && (
                    <button onClick={() => includeOrder(o.id)} className="ml-2 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 flex items-center gap-1.5 shrink-0">
                      <CheckCircle className="w-4 h-4" />Incluir
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main hub ─────────────────────────────────────────────────────────────────
const GamificationHub = () => {
  const [tab, setTab] = useState<TopTab>('clientes')

  const topTabs: { id: TopTab; label: string; icon: JSX.Element; desc: string }[] = [
    { id: 'clientes', label: 'Clientes', icon: <Users className="w-5 h-5" />, desc: 'Ranking, badges e benefícios de clientes' },
    { id: 'parceiros', label: 'Parceiros', icon: <Trophy className="w-5 h-5" />, desc: 'Ranking e indicações de parceiros' },
    { id: 'gerenciar', label: 'Gerenciar', icon: <Settings className="w-5 h-5" />, desc: 'Ativar clientes e processar OSs' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Trophy className="w-7 h-7 text-yellow-500" />
          Central de Gamificação
        </h1>
        <p className="text-gray-500 mt-0.5 text-sm">Clientes, parceiros, rankings, conquistas e gerenciamento em um só lugar</p>
      </div>

      {/* Top-level tab selector */}
      <div className="grid grid-cols-3 gap-3">
        {topTabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
              tab === t.id
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${tab === t.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
              {t.icon}
            </div>
            <div>
              <p className={`font-semibold ${tab === t.id ? 'text-blue-700' : 'text-gray-800'}`}>{t.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'clientes' && <CustomerSection />}
      {tab === 'parceiros' && <PartnerSection />}
      {tab === 'gerenciar' && <ManagerSection />}
    </div>
  )
}

export default GamificationHub
