import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, X, Bell, BellOff, MessageCircle, AlertTriangle, Clock, CheckCircle, Info, Bot, Volume2, VolumeX, Timer } from 'lucide-react'

export type IconCorner = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'

export interface ThomazConfig {
  enabled: boolean
  sounds: boolean
  miniChatEnabled: boolean
  iconCorner: IconCorner
  types: {
    critical: boolean
    warning: boolean
    chat: boolean
    agenda: boolean
    success: boolean
    info: boolean
  }
  autoDissmissSeconds: {
    chat: number
    default: number
  }
}

const DEFAULT_CONFIG: ThomazConfig = {
  enabled: true,
  sounds: true,
  miniChatEnabled: true,
  iconCorner: 'bottom-right',
  types: {
    critical: true,
    warning: true,
    chat: true,
    agenda: true,
    success: true,
    info: true,
  },
  autoDissmissSeconds: {
    chat: 5,
    default: 8,
  },
}

const SETTINGS_KEY = 'thomaz_notification_config'

export function loadThomazConfig(): ThomazConfig {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_CONFIG
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_CONFIG
  }
}

export function saveThomazConfig(cfg: ThomazConfig) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(cfg))
}

const CORNER_OPTIONS: { value: IconCorner; label: string; pos: string }[] = [
  { value: 'top-left',     label: 'Superior Esq.', pos: 'top-2 left-2' },
  { value: 'top-right',    label: 'Superior Dir.', pos: 'top-2 right-2' },
  { value: 'bottom-left',  label: 'Inferior Esq.', pos: 'bottom-2 left-2' },
  { value: 'bottom-right', label: 'Inferior Dir.', pos: 'bottom-2 right-2' },
]

const TYPE_META = [
  { key: 'critical', label: 'Crítico',   icon: <AlertTriangle className="h-4 w-4 text-red-500" />,   desc: 'Alertas urgentes e vencimentos' },
  { key: 'warning',  label: 'Atenção',   icon: <AlertTriangle className="h-4 w-4 text-amber-500" />, desc: 'Avisos e situações de risco' },
  { key: 'chat',     label: 'Mensagens', icon: <MessageCircle className="h-4 w-4 text-emerald-500" />, desc: 'Mensagens e WhatsApp' },
  { key: 'agenda',   label: 'Agenda',    icon: <Clock className="h-4 w-4 text-blue-500" />,           desc: 'Eventos e compromissos' },
  { key: 'success',  label: 'Sucesso',   icon: <CheckCircle className="h-4 w-4 text-teal-500" />,     desc: 'Confirmações e conclusões' },
  { key: 'info',     label: 'Info',      icon: <Info className="h-4 w-4 text-slate-500" />,            desc: 'Notificações gerais' },
] as const

interface Props {
  onClose: () => void
  onChange: (cfg: ThomazConfig) => void
}

export function ThomazSettingsPanel({ onClose, onChange }: Props) {
  const [cfg, setCfg] = useState<ThomazConfig>(loadThomazConfig)

  const update = (patch: Partial<ThomazConfig>) => {
    const next = { ...cfg, ...patch }
    setCfg(next)
    saveThomazConfig(next)
    onChange(next)
  }

  const toggleType = (key: keyof ThomazConfig['types']) => {
    update({ types: { ...cfg.types, [key]: !cfg.types[key] } })
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 8 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="fixed bottom-24 right-6 z-[10000] w-[340px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
            <Settings className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Configurações do Thomaz</p>
            <p className="text-slate-300 text-[10px]">Notificações e posição do ícone</p>
          </div>
        </div>
        <button onClick={onClose} className="text-white/70 hover:text-white transition">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4 space-y-5 max-h-[70vh] overflow-y-auto">

        {/* Master toggle + sounds + mini-chat */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Geral</p>

          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">Notificações ativas</span>
            </div>
            <Toggle value={cfg.enabled} onChange={v => update({ enabled: v })} />
          </div>

          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              {cfg.sounds ? <Volume2 className="h-4 w-4 text-gray-500" /> : <VolumeX className="h-4 w-4 text-gray-400" />}
              <span className="text-sm text-gray-700">Sons de alerta</span>
            </div>
            <Toggle value={cfg.sounds} onChange={v => update({ sounds: v })} />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-gray-700">Mini-chat flutuante</span>
            </div>
            <Toggle value={cfg.miniChatEnabled} onChange={v => update({ miniChatEnabled: v })} />
          </div>
        </div>

        {/* Types */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Tipos de notificação</p>
          <div className="space-y-1">
            {TYPE_META.map(({ key, label, icon, desc }) => (
              <div key={key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2.5">
                  {icon}
                  <div>
                    <p className="text-sm font-medium text-gray-700">{label}</p>
                    <p className="text-[10px] text-gray-400">{desc}</p>
                  </div>
                </div>
                <Toggle value={cfg.types[key]} onChange={() => toggleType(key)} />
              </div>
            ))}
          </div>
        </div>

        {/* Auto-dismiss timing */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
            <Timer className="h-3 w-3" /> Auto-fechar (segundos)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Mensagens</label>
              <input
                type="number"
                min={3}
                max={30}
                value={cfg.autoDissmissSeconds.chat}
                onChange={e => update({ autoDissmissSeconds: { ...cfg.autoDissmissSeconds, chat: Number(e.target.value) } })}
                className="w-full px-3 py-1.5 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Outros alertas</label>
              <input
                type="number"
                min={3}
                max={60}
                value={cfg.autoDissmissSeconds.default}
                onChange={e => update({ autoDissmissSeconds: { ...cfg.autoDissmissSeconds, default: Number(e.target.value) } })}
                className="w-full px-3 py-1.5 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Icon position */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Posição do ícone flutuante</p>
          <div className="relative w-full h-24 bg-gray-100 rounded-xl border-2 border-gray-200 overflow-hidden">
            {CORNER_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => update({ iconCorner: opt.value })}
                className={`absolute w-8 h-8 rounded-full flex items-center justify-center transition-all ${opt.pos} ${
                  cfg.iconCorner === opt.value
                    ? 'bg-blue-600 shadow-lg scale-110'
                    : 'bg-white border-2 border-gray-300 hover:border-blue-400'
                }`}
                title={opt.label}
              >
                <Bot className={`w-4 h-4 ${cfg.iconCorner === opt.value ? 'text-white' : 'text-gray-400'}`} />
              </button>
            ))}
            <p className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 pointer-events-none">
              Tela do sistema
            </p>
          </div>
          <p className="text-xs text-gray-400 text-center">
            Posição atual: <span className="font-semibold text-gray-600">{CORNER_OPTIONS.find(o => o.value === cfg.iconCorner)?.label}</span>
          </p>
        </div>

      </div>

      <div className="px-4 pb-4">
        <button
          onClick={onClose}
          className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-xl transition"
        >
          Salvar e fechar
        </button>
      </div>
    </motion.div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-10 h-5.5 h-[22px] rounded-full transition-colors duration-200 focus:outline-none ${value ? 'bg-blue-600' : 'bg-gray-300'}`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${value ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
      />
    </button>
  )
}
