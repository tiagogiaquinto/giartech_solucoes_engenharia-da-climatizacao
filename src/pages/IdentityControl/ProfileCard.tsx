import React from 'react'
import { motion } from 'framer-motion'
import { FileEdit as Edit2, Power, Clock, ShieldCheck, Eye, Loader2, CheckCircle, AlertCircle, UserX, Monitor } from 'lucide-react'
import { AnyProfile, ROLE_LABELS, ROLE_COLORS } from './types'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Props {
  profile: AnyProfile
  onEdit: (p: AnyProfile) => void
  onToggleActive: (p: AnyProfile) => void
  onImpersonate?: (p: AnyProfile) => void
  onDevices?: (p: AnyProfile) => void
  impersonating?: boolean
  index: number
}

function getStatusBadge(profile: AnyProfile) {
  if (!profile.is_active) return { label: 'Inativo', color: '#6b7280', bg: 'rgba(107,114,128,0.15)', icon: UserX }
  if (!profile.last_login)  return { label: 'Nunca acessou', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', icon: AlertCircle }
  return { label: 'Ativo', color: '#4ade80', bg: 'rgba(74,222,128,0.15)', icon: CheckCircle }
}

export const ProfileCard: React.FC<Props> = ({
  profile,
  onEdit,
  onToggleActive,
  onImpersonate,
  onDevices,
  impersonating = false,
  index,
}) => {
  const roleColor = ROLE_COLORS[profile.role] || ROLE_COLORS['viewer']
  const roleLabel = ROLE_LABELS[profile.role] || profile.role
  const status = getStatusBadge(profile)
  const StatusIcon = status.icon

  const isPortal = profile.type === 'cliente' || profile.type === 'parceiro'

  const initials = profile.full_name
    ? profile.full_name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : profile.email?.charAt(0).toUpperCase() || '?'

  const lastLoginText = profile.last_login
    ? formatDistanceToNow(new Date(profile.last_login), { addSuffix: true, locale: ptBR })
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.035, type: 'spring', damping: 22, stiffness: 200 }}
      className="relative rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: 'linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
        border: `1px solid rgba(59,130,246,0.14)`,
        backdropFilter: 'blur(16px)',
        boxShadow: '0 4px 28px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* Role-colored top accent bar */}
      <div className="h-0.5 w-full flex-shrink-0"
        style={{ background: `linear-gradient(90deg, ${roleColor.from}, ${roleColor.to} 60%, transparent)` }} />

      <div className="p-5 flex flex-col flex-1 gap-3">
        {/* Row 1: Avatar + name + status dot */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div
            className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-bold text-sm"
            style={{
              background: `linear-gradient(135deg, ${roleColor.from}, ${roleColor.to})`,
              boxShadow: `0 2px 12px ${roleColor.to}55`,
            }}
          >
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm leading-tight truncate">
              {profile.full_name || '—'}
            </p>
            <p className="text-gray-400 text-xs truncate mt-0.5">{profile.email}</p>
          </div>

          {/* Active dot */}
          <div
            className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0"
            style={{ background: status.color, boxShadow: `0 0 6px ${status.color}88` }}
            title={status.label}
          />
        </div>

        {/* Row 2: Role badge + status badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{
              background: `linear-gradient(135deg, ${roleColor.from}cc, ${roleColor.to}cc)`,
              color: roleColor.text,
              border: `1px solid ${roleColor.to}44`,
            }}
          >
            <ShieldCheck size={9} />
            {roleLabel}
          </span>

          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{
              background: status.bg,
              color: status.color,
              border: `1px solid ${status.color}33`,
            }}
          >
            <StatusIcon size={9} />
            {status.label}
          </span>
        </div>

        {/* Row 3: Last login */}
        <div className="flex items-center gap-1.5">
          <Clock size={10} className="text-gray-600 flex-shrink-0" />
          <span className="text-gray-500 text-xs truncate">
            {lastLoginText ? `Último acesso ${lastLoginText}` : 'Nunca acessou o sistema'}
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Devices button — portal accounts only */}
        {isPortal && onDevices && (
          <button
            onClick={() => onDevices(profile)}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all hover:brightness-110"
            style={{
              background: 'rgba(30,58,138,0.35)',
              border: '1px solid rgba(96,165,250,0.2)',
              color: '#93c5fd',
            }}
          >
            <Monitor size={11} />
            Dispositivos ativos
          </button>
        )}

        {/* Impersonate button — portal accounts only */}
        {isPortal && onImpersonate && (
          <button
            onClick={() => onImpersonate(profile)}
            disabled={impersonating || !profile.is_active}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, rgba(180,83,9,0.5), rgba(146,64,14,0.5))',
              border: '1px solid rgba(251,191,36,0.28)',
              color: '#fde68a',
            }}
          >
            {impersonating
              ? <Loader2 size={12} className="animate-spin" />
              : <Eye size={12} />
            }
            {impersonating ? 'Abrindo portal...' : 'Visualizar como'}
          </button>
        )}

        {/* Edit + Toggle row */}
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(profile)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all hover:brightness-110"
            style={{
              background: 'linear-gradient(135deg, rgba(29,78,216,0.55), rgba(14,165,233,0.55))',
              border: '1px solid rgba(59,130,246,0.3)',
              color: '#93c5fd',
            }}
          >
            <Edit2 size={12} />
            Editar perfil
          </button>

          <button
            onClick={() => onToggleActive(profile)}
            title={profile.is_active ? 'Desativar conta' : 'Ativar conta'}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:brightness-110"
            style={{
              background: profile.is_active
                ? 'rgba(239,68,68,0.13)'
                : 'rgba(34,197,94,0.13)',
              border: `1px solid ${profile.is_active ? 'rgba(239,68,68,0.28)' : 'rgba(34,197,94,0.28)'}`,
              color: profile.is_active ? '#f87171' : '#4ade80',
            }}
          >
            <Power size={13} />
          </button>
        </div>
      </div>

      {/* Inactive overlay */}
      {!profile.is_active && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.35)' }}
        />
      )}
    </motion.div>
  )
}
