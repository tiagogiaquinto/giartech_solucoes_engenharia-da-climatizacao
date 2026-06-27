import { useEffect, useRef, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, MessageCircle, CheckCircle, AlertTriangle, Bell, ArrowRight, Trash2, Bot, Send, Loader2, ExternalLink, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useNotificationHub, HubAlert, thomazRaciocinar } from '../contexts/NotificationHubContext'
import { useUser } from '../contexts/UserContext'
import {
  ThomazConfig,
  IconCorner,
  loadThomazConfig,
  ThomazSettingsPanel,
} from './ThomazSettings'

const SOUNDS = {
  chat: [[1046.5, 0.05, 0], [1318.5, 0.05, 0.07]],
  critical: [[880, 0.12, 0], [659.25, 0.12, 0.15], [523.25, 0.18, 0.32]],
  default: [[880, 0.08, 0], [1108.7, 0.08, 0.1]],
}

function playSound(type: 'chat' | 'critical' | 'default') {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    if (ctx.state === 'suspended') return
    SOUNDS[type].forEach(([freq, gain, when]) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = type === 'critical' ? 'square' : 'sine'
      osc.frequency.value = freq as number
      g.gain.value = gain as number
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (when as number) + 0.2)
      osc.connect(g)
      g.connect(ctx.destination)
      osc.start(ctx.currentTime + (when as number))
      osc.stop(ctx.currentTime + (when as number) + 0.25)
    })
  } catch {}
}

const SEVERITY_STYLES: Record<string, { bg: string; border: string; icon: React.ReactNode; sound: 'chat' | 'critical' | 'default' }> = {
  critical: { bg: 'bg-red-600', border: 'border-red-700', icon: <AlertTriangle className="h-5 w-5 text-white" />, sound: 'critical' },
  warning: { bg: 'bg-amber-500', border: 'border-amber-600', icon: <AlertTriangle className="h-5 w-5 text-white" />, sound: 'default' },
  chat: { bg: 'bg-emerald-500', border: 'border-emerald-600', icon: <MessageCircle className="h-5 w-5 text-white" />, sound: 'chat' },
  agenda: { bg: 'bg-blue-600', border: 'border-blue-700', icon: <Clock className="h-5 w-5 text-white" />, sound: 'default' },
  success: { bg: 'bg-teal-500', border: 'border-teal-600', icon: <CheckCircle className="h-5 w-5 text-white" />, sound: 'default' },
  info: { bg: 'bg-slate-700', border: 'border-slate-800', icon: <Bell className="h-5 w-5 text-white" />, sound: 'default' },
}

// Maps IconCorner → toast stack position
const CORNER_TOAST_CLASS: Record<IconCorner, string> = {
  'top-right':    'top-4 right-4 items-end',
  'top-left':     'top-4 left-4 items-start',
  'bottom-right': 'bottom-28 right-4 items-end flex-col-reverse',
  'bottom-left':  'bottom-28 left-4 items-start flex-col-reverse',
}

// Maps IconCorner → floating button positions
const CORNER_BTN: Record<IconCorner, { bot: string; chat: string; settings: string }> = {
  'bottom-right': { bot: 'bottom-6 right-6',   chat: 'bottom-28 right-6',  settings: 'bottom-[6.5rem] right-[5.5rem]' },
  'bottom-left':  { bot: 'bottom-6 left-6',    chat: 'bottom-28 left-6',   settings: 'bottom-[6.5rem] left-[5.5rem]' },
  'top-right':    { bot: 'top-6 right-6',      chat: 'top-28 right-6',     settings: 'top-[6.5rem] right-[5.5rem]' },
  'top-left':     { bot: 'top-6 left-6',       chat: 'top-28 left-6',      settings: 'top-[6.5rem] left-[5.5rem]' },
}

// Maps IconCorner → chat panel anchor
const CORNER_PANEL: Record<IconCorner, string> = {
  'bottom-right': 'bottom-48 right-6',
  'bottom-left':  'bottom-48 left-6',
  'top-right':    'top-28 right-6',
  'top-left':     'top-28 left-6',
}

// Maps IconCorner → settings panel anchor
const CORNER_SETTINGS_PANEL: Record<IconCorner, string> = {
  'bottom-right': 'bottom-24 right-6',
  'bottom-left':  'bottom-24 left-6',
  'top-right':    'top-24 right-6',
  'top-left':     'top-24 left-6',
}

function AlertCard({ alert, onDismiss, onNavigate }: { alert: HubAlert; onDismiss: () => void; onNavigate?: () => void }) {
  const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.info
  const isThomaz = !!alert.thomaz_interrupt

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.88 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      className={`relative w-[360px] rounded-xl shadow-2xl border-2 overflow-hidden ${style.border} bg-white`}
    >
      <div className={`${style.bg} px-4 py-2.5 flex items-center gap-2.5`}>
        {style.icon}
        <span className="text-white font-semibold text-sm flex-1 leading-tight">{alert.title}</span>
        {!alert.sticky && (
          <button onClick={onDismiss} className="text-white/70 hover:text-white transition ml-1 shrink-0">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="px-4 py-3">
        {isThomaz ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-700 leading-snug">{alert.message}</p>
            {alert.thomaz_interrupt?.suggested_reply && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-800 italic">
                "{alert.thomaz_interrupt.suggested_reply}"
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button onClick={onNavigate} className="flex-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1.5 transition">
                Abrir Agora
              </button>
              <button onClick={onDismiss} className="flex-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-3 py-1.5 transition">
                Responder Depois
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            <p className="text-sm text-gray-700 leading-snug">{alert.message}</p>
            {alert.preview && <p className="text-xs text-gray-500 italic line-clamp-2">"{alert.preview}"</p>}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-gray-400">{new Date(alert.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              <div className="flex gap-2">
                {alert.link && (
                  <button onClick={onNavigate} className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition">
                    {alert.action_label || 'Ver'}
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
                {alert.sticky && (
                  <button onClick={onDismiss} className="text-xs font-semibold bg-red-100 hover:bg-red-200 text-red-700 rounded-lg px-2.5 py-1 transition">
                    Ciente
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Thomaz Mini-Chat Overlay ─────────────────────────────────────────────────
function ThomazMiniChat({ cfg, onCfgChange }: { cfg: ThomazConfig; onCfgChange: (c: ThomazConfig) => void }) {
  const [open, setOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [pergunta, setPergunta] = useState('')
  const [resposta, setResposta] = useState<{ texto: string; sugestoes?: string[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { user } = useUser()

  const corner = cfg.iconCorner
  const btn = CORNER_BTN[corner]
  const panel = CORNER_PANEL[corner]
  const settingsPanel = CORNER_SETTINGS_PANEL[corner]

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  const perguntar = async (texto?: string) => {
    const q = texto || pergunta.trim()
    if (!q || loading) return
    setPergunta('')
    setLoading(true)
    setResposta(null)
    try {
      const result = await thomazRaciocinar(q, user?.id)
      setResposta({
        texto: result.resposta_direta,
        sugestoes: result.alertas?.slice(0, 2).map((a: any) => a.title || a.recommended_action).filter(Boolean)
      })
    } catch {
      setResposta({ texto: 'Não consegui analisar agora. Tente novamente.' })
    } finally {
      setLoading(false)
    }
  }

  const abrirSidebar = () => {
    if (!resposta) return
    const ctx = {
      pergunta: pergunta || 'Análise solicitada',
      resposta: resposta.texto,
      sugestoes: resposta.sugestoes,
      origem: 'overlay'
    }
    window.dispatchEvent(new CustomEvent('thomaz:openWithContext', { detail: ctx }))
    setOpen(false)
    setResposta(null)
  }

  if (!cfg.enabled) return null

  return (
    <>
      {/* Floating Thomaz button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => { setOpen(o => !o); setShowSettings(false); setResposta(null) }}
        className={`fixed ${btn.bot} z-[9998] w-14 h-14 bg-gradient-to-br from-blue-700 to-blue-500 rounded-full shadow-xl flex items-center justify-center text-white hover:shadow-blue-400/50 transition-all`}
        title="Perguntar ao Thomaz"
      >
        <Bot className="w-7 h-7" />
        <motion.div
          animate={{ scale: [0.8, 1, 0.8], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white"
        />
      </motion.button>

      {/* Settings gear button (shown when mini-chat is not open) */}
      <AnimatePresence>
        {!open && !showSettings && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setShowSettings(true)}
            className={`fixed ${btn.chat} z-[9997] w-9 h-9 bg-white border-2 border-gray-200 hover:border-slate-400 rounded-full shadow flex items-center justify-center text-gray-500 hover:text-slate-700 transition-all`}
            title="Configurações do Thomaz"
          >
            <Settings className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Settings panel */}
      <AnimatePresence>
        {showSettings && (
          <div className={`fixed ${settingsPanel} z-[10000]`}>
            <ThomazSettingsPanel
              onClose={() => setShowSettings(false)}
              onChange={onCfgChange}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Mini-chat panel */}
      {cfg.miniChatEnabled && (
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`fixed ${panel} z-[9998] w-[340px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden`}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <Bot className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm leading-tight">Thomaz</p>
                    <p className="text-blue-100 text-[10px]">Pergunta rápida</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => { setOpen(false); setShowSettings(true) }}
                    className="text-white/70 hover:text-white transition"
                    title="Configurações"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                  <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={pergunta}
                    onChange={e => setPergunta(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && !loading && perguntar()}
                    placeholder="Pergunte algo ao Thomaz..."
                    disabled={loading}
                    className="flex-1 px-3 py-2 text-sm border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all disabled:opacity-50 outline-none"
                  />
                  <button
                    onClick={() => perguntar()}
                    disabled={loading || !pergunta.trim()}
                    className="w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-40 transition"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>

                <AnimatePresence>
                  {resposta && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="space-y-2"
                    >
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                        <p className="text-sm text-gray-800 leading-snug whitespace-pre-wrap">{resposta.texto}</p>
                      </div>

                      {resposta.sugestoes && resposta.sugestoes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {resposta.sugestoes.map((s, i) => (
                            <button
                              key={i}
                              onClick={() => perguntar(s)}
                              className="text-xs px-2.5 py-1 bg-white border border-blue-200 text-blue-600 rounded-full hover:bg-blue-50 transition"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}

                      <button
                        onClick={abrirSidebar}
                        className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-white border border-blue-200 hover:border-blue-300 rounded-xl px-3 py-2 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Ver análise completa
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </>
  )
}

// ─── Main notification hub ────────────────────────────────────────────────────
export function GiartechNotificationHub() {
  const { alerts, dismissAlert, dismissAll, markRead } = useNotificationHub()
  const navigate = useNavigate()
  const playedIds = useRef<Set<string>>(new Set())
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const [cfg, setCfg] = useState<ThomazConfig>(loadThomazConfig)

  const handleDismiss = useCallback((id: string) => {
    markRead(id)
    dismissAlert(id)
    const t = timersRef.current.get(id)
    if (t) clearTimeout(t)
    timersRef.current.delete(id)
  }, [markRead, dismissAlert])

  const handleNavigate = useCallback((alert: HubAlert) => {
    markRead(alert.id)
    dismissAlert(alert.id)
    if (alert.link) {
      try {
        const url = new URL(alert.link)
        navigate(url.pathname + url.search + url.hash)
      } catch {
        navigate(alert.link)
      }
    }
  }, [markRead, dismissAlert, navigate])

  useEffect(() => {
    if (alerts.length === 0) return
    const newest = alerts[0]
    if (playedIds.current.has(newest.id)) return

    // Check if this alert type is enabled
    const typeEnabled = cfg.types[newest.severity as keyof typeof cfg.types] ?? true
    if (!cfg.enabled || !typeEnabled) return

    playedIds.current.add(newest.id)

    if (cfg.sounds) {
      const style = SEVERITY_STYLES[newest.severity] || SEVERITY_STYLES.info
      playSound(style.sound)
    }

    if (!newest.sticky) {
      const delay = newest.severity === 'chat'
        ? cfg.autoDissmissSeconds.chat * 1000
        : cfg.autoDissmissSeconds.default * 1000
      const timer = setTimeout(() => handleDismiss(newest.id), delay)
      timersRef.current.set(newest.id, timer)
    }
  }, [alerts, handleDismiss, cfg])

  useEffect(() => {
    return () => { timersRef.current.forEach(t => clearTimeout(t)) }
  }, [])

  // Filter alerts by enabled types (when hub is active)
  const visibleAlerts = cfg.enabled
    ? alerts
        .filter(a => cfg.types[a.severity as keyof typeof cfg.types] ?? true)
        .slice(0, 5)
    : []

  const toastClass = CORNER_TOAST_CLASS[cfg.iconCorner]

  return (
    <>
      {/* Toast notifications */}
      <div className={`fixed ${toastClass} z-[9999] flex flex-col gap-3 pointer-events-none`}>
        <AnimatePresence mode="sync">
          {visibleAlerts.map(alert => (
            <div key={alert.id} className="pointer-events-auto">
              <AlertCard
                alert={alert}
                onDismiss={() => handleDismiss(alert.id)}
                onNavigate={() => handleNavigate(alert)}
              />
            </div>
          ))}
        </AnimatePresence>

        {alerts.length > 1 && cfg.enabled && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pointer-events-auto"
          >
            <button
              onClick={dismissAll}
              className="flex items-center gap-1.5 text-xs font-medium bg-white/90 hover:bg-white border border-gray-200 rounded-full px-3 py-1.5 shadow text-gray-600 hover:text-gray-800 transition"
            >
              <Trash2 className="h-3 w-3" />
              Limpar tudo ({alerts.length})
            </button>
          </motion.div>
        )}
      </div>

      {/* Thomaz mini-chat + settings */}
      <ThomazMiniChat cfg={cfg} onCfgChange={setCfg} />
    </>
  )
}
