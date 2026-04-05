import React from 'react'
import { motion } from 'framer-motion'
import { Users, Clock, Bell, Shield, Wifi } from 'lucide-react'

interface IAMStats {
  online_count: number
  pending_approvals: number
  recent_logins_24h: number
  total_staff: number
  total_portal: number
}

interface Props {
  stats: IAMStats | null
  loading: boolean
}

export const IAMStatsBar: React.FC<Props> = ({ stats, loading }) => {
  const items = [
    {
      label: 'Online agora',
      value: stats?.online_count ?? 0,
      icon: Wifi,
      color: '#4ade80',
      glow: 'rgba(74,222,128,0.15)',
      border: 'rgba(74,222,128,0.2)',
      pulse: true,
    },
    {
      label: 'Solicitações pendentes',
      value: stats?.pending_approvals ?? 0,
      icon: Bell,
      color: '#fb923c',
      glow: 'rgba(251,146,60,0.15)',
      border: 'rgba(251,146,60,0.2)',
      pulse: (stats?.pending_approvals ?? 0) > 0,
    },
    {
      label: 'Logins nas últimas 24h',
      value: stats?.recent_logins_24h ?? 0,
      icon: Clock,
      color: '#60a5fa',
      glow: 'rgba(96,165,250,0.12)',
      border: 'rgba(96,165,250,0.18)',
      pulse: false,
    },
    {
      label: 'Equipe interna',
      value: stats?.total_staff ?? 0,
      icon: Shield,
      color: '#a3e635',
      glow: 'rgba(163,230,53,0.1)',
      border: 'rgba(163,230,53,0.18)',
      pulse: false,
    },
    {
      label: 'Usuários de portal',
      value: stats?.total_portal ?? 0,
      icon: Users,
      color: '#67e8f9',
      glow: 'rgba(103,232,249,0.1)',
      border: 'rgba(103,232,249,0.18)',
      pulse: false,
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
      {items.map((item, i) => {
        const Icon = item.icon
        return (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, type: 'spring', damping: 20 }}
            className="relative rounded-2xl p-4 overflow-hidden"
            style={{
              background: `linear-gradient(140deg, ${item.glow} 0%, rgba(255,255,255,0.02) 100%)`,
              border: `1px solid ${item.border}`,
              backdropFilter: 'blur(12px)',
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${item.glow}`, border: `1px solid ${item.border}` }}
              >
                <Icon size={15} style={{ color: item.color }} />
              </div>
              {item.pulse && !loading && (
                <span className="relative flex h-2 w-2 mt-1">
                  <span
                    className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                    style={{ background: item.color }}
                  />
                  <span
                    className="relative inline-flex rounded-full h-2 w-2"
                    style={{ background: item.color }}
                  />
                </span>
              )}
            </div>

            {loading ? (
              <div className="h-7 w-12 rounded-lg animate-pulse mb-1"
                style={{ background: 'rgba(255,255,255,0.08)' }} />
            ) : (
              <p className="text-2xl font-bold leading-none mb-1" style={{ color: item.color }}>
                {item.value}
              </p>
            )}
            <p className="text-gray-500 text-xs leading-tight">{item.label}</p>
          </motion.div>
        )
      })}
    </div>
  )
}
