import React from 'react'
import { motion } from 'framer-motion'
import { FileEdit as Edit2, Power, Clock, ShieldCheck, Eye, Loader2 } from 'lucide-react'
import { AnyProfile, ROLE_LABELS, ROLE_COLORS } from './types'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Props {
  profile: AnyProfile
  onEdit: (p: AnyProfile) => void
  onToggleActive: (p: AnyProfile) => void
  onImpersonate?: (p: AnyProfile) => void
  impersonating?: boolean
  index: number
}

export const ProfileCard: React.FC<Props> = ({
  profile,
  onEdit,
  onToggleActive,
  onImpersonate,
  impersonating = false,
  index,
}) => {
  const roleColor = ROLE_COLORS[profile.role] || ROLE_COLORS['viewer']
  const roleLabel = ROLE_LABELS[profile.role] || profile.role

  const isPortal = profile.type === 'cliente' || profile.type === 'parceiro'

  const initials = profile.full_name
    ? profile.full_name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : profile.email?.charAt(0).toUpperCase() || '?'

  const lastLoginText = profile.last_login
    ? formatDistanceToNow(new Date(profile.last_login), { addSuffix: true, locale: ptBR })
    : 'Nunca acessou'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="relative rounded-2xl overflow-hidden group"
      style={{
        background: 'linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        border: '1px solid rgba(59,130,246,0.15)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
      }}
    >
      {/* Top gradient accent */}
      <div className="h-0.5 w-full"
        style={{ background: `linear-gradient(90deg, ${roleColor.from}, ${roleColor.to}, transparent)` }} />

      <div className="p-5">
        {/* Avatar + Badge */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${roleColor.from}, ${roleColor.to})` }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm leading-tight truncate max-w-[140px]">
                {profile.full_name || '—'}
              </p>
              <p className="text-gray-400 text-xs truncate max-w-[140px]">{profile.email}</p>
            </div>
          </div>

          <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${profile.is_active ? 'bg-emerald-400' : 'bg-gray-600'}`}
            title={profile.is_active ? 'Ativo' : 'Inativo'} />
        </div>

        {/* Role Badge */}
        <div className="mb-4">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{
              background: `linear-gradient(135deg, ${roleColor.from}88, ${roleColor.to}88)`,
              color: roleColor.text,
              border: `1px solid ${roleColor.to}44`,
            }}>
            <ShieldCheck size={10} />
            {roleLabel}
          </span>
        </div>

        {/* Last login */}
        <div className="flex items-center gap-1.5 mb-4">
          <Clock size={11} className="text-gray-600 flex-shrink-0" />
          <span className="text-gray-500 text-xs truncate">{lastLoginText}</span>
        </div>

        {/* Impersonate button (portal accounts only) */}
        {isPortal && onImpersonate && (
          <button
            onClick={() => onImpersonate(profile)}
            disabled={impersonating || !profile.is_active}
            className="w-full flex items-center justify-center gap-1.5 py-2 mb-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-40"
            style={{
              background: 'linear-gradient(135deg, rgba(180,83,9,0.55), rgba(146,64,14,0.55))',
              border: '1px solid rgba(251,191,36,0.3)',
              color: '#fde68a',
            }}
          >
            {impersonating ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Eye size={12} />
            )}
            {impersonating ? 'Abrindo...' : 'Visualizar como'}
          </button>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(profile)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-90"
            style={{
              background: 'linear-gradient(135deg, rgba(29,78,216,0.6), rgba(14,165,233,0.6))',
              border: '1px solid rgba(59,130,246,0.35)',
              color: '#93c5fd',
            }}>
            <Edit2 size={12} />
            Editar
          </button>

          <button
            onClick={() => onToggleActive(profile)}
            title={profile.is_active ? 'Desativar' : 'Ativar'}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-90"
            style={{
              background: profile.is_active ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
              border: `1px solid ${profile.is_active ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
              color: profile.is_active ? '#f87171' : '#4ade80',
            }}>
            <Power size={13} />
          </button>
        </div>
      </div>

      {/* Inactive overlay */}
      {!profile.is_active && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.4)' }} />
      )}
    </motion.div>
  )
}
