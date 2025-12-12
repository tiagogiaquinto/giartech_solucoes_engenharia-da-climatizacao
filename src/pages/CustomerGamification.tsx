import { useState, useEffect } from 'react'
import { Trophy, Star, Award, TrendingUp, Gift, Crown, Users, Zap } from 'lucide-react'
import { supabase } from '../lib/supabase'

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

interface Badge {
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

const CustomerGamification = () => {
  const [leaderboard, setLeaderboard] = useState<CustomerPoint[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerPoint | null>(null)
  const [customerBadges, setCustomerBadges] = useState<Badge[]>([])
  const [allBadges, setAllBadges] = useState<Badge[]>([])
  const [benefits, setBenefits] = useState<TierBenefit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedCustomer) {
      loadCustomerBadges(selectedCustomer.customer_id)
    }
  }, [selectedCustomer])

  const loadData = async () => {
    setLoading(true)
    try {
      const [
        { data: leaderboardData },
        { data: badgesData },
        { data: benefitsData }
      ] = await Promise.all([
        supabase.from('v_customer_leaderboard').select('*').limit(50),
        supabase.from('customer_badges').select('*').eq('active', true),
        supabase.from('customer_tier_benefits').select('*').eq('active', true).order('display_order')
      ])

      setLeaderboard(leaderboardData || [])
      setAllBadges(badgesData || [])
      setBenefits(benefitsData || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCustomerBadges = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('customer_badges_earned')
        .select(`
          earned_date,
          customer_badges (
            id,
            badge_name,
            description,
            badge_level,
            badge_icon
          )
        `)
        .eq('customer_id', customerId)

      if (error) throw error

      const formatted = (data || []).map((item: any) => ({
        ...item.customer_badges,
        earned_date: item.earned_date
      }))

      setCustomerBadges(formatted)
    } catch (error) {
      console.error('Erro ao carregar badges:', error)
    }
  }

  const getTierInfo = (tier: string) => {
    const tiers: Record<string, { name: string; color: string; icon: JSX.Element; min: number }> = {
      bronze: { name: 'Bronze', color: 'from-orange-600 to-amber-700', icon: <Award className="h-6 w-6" />, min: 0 },
      silver: { name: 'Prata', color: 'from-gray-400 to-gray-600', icon: <Star className="h-6 w-6" />, min: 1000 },
      gold: { name: 'Ouro', color: 'from-yellow-400 to-yellow-600', icon: <Trophy className="h-6 w-6" />, min: 3000 },
      diamond: { name: 'Diamante', color: 'from-cyan-400 to-blue-600', icon: <Zap className="h-6 w-6" />, min: 7000 },
      vip: { name: 'VIP', color: 'from-purple-500 to-pink-600', icon: <Crown className="h-6 w-6" />, min: 15000 }
    }
    return tiers[tier] || tiers.bronze
  }

  const getNextTierInfo = (currentTier: string, currentPoints: number) => {
    const tiers = ['bronze', 'silver', 'gold', 'diamond', 'vip']
    const currentIndex = tiers.indexOf(currentTier)

    if (currentIndex === tiers.length - 1) {
      return { nextTier: 'VIP', pointsNeeded: 0, progress: 100 }
    }

    const nextTier = tiers[currentIndex + 1]
    const tierInfo = getTierInfo(nextTier)
    const currentTierMin = getTierInfo(currentTier).min
    const pointsNeeded = tierInfo.min - currentPoints
    const progress = ((currentPoints - currentTierMin) / (tierInfo.min - currentTierMin)) * 100

    return { nextTier: tierInfo.name, pointsNeeded, progress: Math.min(progress, 100) }
  }

  const getBadgeLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      bronze: 'bg-orange-100 text-orange-800 border-orange-300',
      silver: 'bg-gray-100 text-gray-800 border-gray-300',
      gold: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      diamond: 'bg-cyan-100 text-cyan-800 border-cyan-300',
      legendary: 'bg-purple-100 text-purple-800 border-purple-300'
    }
    return colors[level] || colors.bronze
  }

  const stats = {
    totalCustomers: leaderboard.length,
    totalPoints: leaderboard.reduce((sum, c) => sum + c.total_points, 0),
    avgPoints: leaderboard.length > 0 ? Math.round(leaderboard.reduce((sum, c) => sum + c.total_points, 0) / leaderboard.length) : 0,
    vipCustomers: leaderboard.filter(c => c.current_tier === 'vip').length
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gamificação de Clientes</h1>
        <p className="text-gray-600 mt-1">Pontos, níveis, badges e benefícios</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</h3>
          <p className="text-gray-600 text-sm">Clientes no Sistema</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Star className="h-8 w-8 text-yellow-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.totalPoints.toLocaleString()}</h3>
          <p className="text-gray-600 text-sm">Pontos Totais</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.avgPoints.toLocaleString()}</h3>
          <p className="text-gray-600 text-sm">Média de Pontos</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Crown className="h-8 w-8 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.vipCustomers}</h3>
          <p className="text-gray-600 text-sm">Clientes VIP</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-600" />
              Ranking de Clientes
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posição</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nível</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pontos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compras</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Badges</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Carregando...
                    </td>
                  </tr>
                ) : leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Nenhum cliente com pontos ainda
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((customer) => {
                    const tierInfo = getTierInfo(customer.current_tier)
                    return (
                      <tr
                        key={customer.id}
                        onClick={() => setSelectedCustomer(customer)}
                        className={`hover:bg-gray-50 cursor-pointer ${
                          selectedCustomer?.id === customer.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {customer.ranking_position <= 3 ? (
                              <Trophy className={`h-5 w-5 ${
                                customer.ranking_position === 1 ? 'text-yellow-500' :
                                customer.ranking_position === 2 ? 'text-gray-400' :
                                'text-orange-600'
                              }`} />
                            ) : (
                              <span className="text-sm font-medium text-gray-900">
                                {customer.ranking_position}º
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{customer.customer_name}</div>
                          <div className="text-xs text-gray-500">
                            R$ {customer.total_spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} gastos
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r ${tierInfo.color} text-white`}>
                            {tierInfo.icon}
                            <span className="text-sm font-semibold">{tierInfo.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-gray-900">
                            {customer.total_points.toLocaleString()} pts
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{customer.total_purchases}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{customer.total_badges}</div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">
              {selectedCustomer ? 'Detalhes do Cliente' : 'Selecione um Cliente'}
            </h2>
          </div>

          <div className="p-6">
            {!selectedCustomer ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Clique em um cliente no ranking</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-lg mb-2">{selectedCustomer.customer_name}</h3>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${getTierInfo(selectedCustomer.current_tier).color} text-white`}>
                    {getTierInfo(selectedCustomer.current_tier).icon}
                    <span className="font-semibold">{getTierInfo(selectedCustomer.current_tier).name}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Progresso para {getNextTierInfo(selectedCustomer.current_tier, selectedCustomer.total_points).nextTier}</span>
                    <span className="font-medium">
                      {selectedCustomer.current_tier === 'vip' ? (
                        'Nível Máximo!'
                      ) : (
                        `${getNextTierInfo(selectedCustomer.current_tier, selectedCustomer.total_points).pointsNeeded.toLocaleString()} pts faltam`
                      )}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full bg-gradient-to-r ${getTierInfo(selectedCustomer.current_tier).color}`}
                      style={{ width: `${getNextTierInfo(selectedCustomer.current_tier, selectedCustomer.total_points).progress}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-900">{selectedCustomer.total_points.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Pontos Totais</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-900">{selectedCustomer.total_purchases}</div>
                    <div className="text-sm text-gray-600">Compras</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-600" />
                    Badges Conquistados ({customerBadges.length})
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {customerBadges.length === 0 ? (
                      <p className="text-sm text-gray-500">Nenhum badge ainda</p>
                    ) : (
                      customerBadges.map((badge) => (
                        <div key={badge.id} className={`p-3 rounded-lg border ${getBadgeLevelColor(badge.badge_level)}`}>
                          <div className="font-medium text-sm">{badge.badge_name}</div>
                          <div className="text-xs mt-1 opacity-80">{badge.description}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Gift className="h-5 w-5 text-purple-600" />
                    Benefícios do Nível
                  </h4>
                  <div className="space-y-2">
                    {benefits
                      .filter(b => b.tier_level === selectedCustomer.current_tier)
                      .map((benefit, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2" />
                          <div>
                            <div className="font-medium">{benefit.benefit_description}</div>
                            {benefit.benefit_value && (
                              <div className="text-gray-600 text-xs">{benefit.benefit_value}</div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Todos os Badges Disponíveis</h2>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {allBadges.map((badge) => (
              <div key={badge.id} className={`p-4 rounded-lg border-2 ${getBadgeLevelColor(badge.badge_level)}`}>
                <div className="flex items-start justify-between mb-2">
                  <Award className="h-8 w-8" />
                  <span className="text-xs font-semibold uppercase">{badge.badge_level}</span>
                </div>
                <h3 className="font-bold text-sm mb-1">{badge.badge_name}</h3>
                <p className="text-xs opacity-80">{badge.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomerGamification
