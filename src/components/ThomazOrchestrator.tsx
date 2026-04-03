import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot, CheckCircle2, XCircle, Loader2, X, Zap,
  ChevronDown, ChevronUp, Sparkles, Send, MessageSquare
} from 'lucide-react'
import { ChainResult, OSFinalizePayload, runOSFinalizeChain } from '../services/giartechEngine'
import { supabase } from '../lib/supabase'
import thomazConversationalService from '../services/thomazConversationalService'

const IDLE_CHECK_KEY = 'thomaz_idle_check_date'
const SESSION_ID = 'orchestrator_' + Date.now()

interface OrchestratorMessage {
  id: string
  text: string
  type: 'info' | 'success' | 'warning' | 'action_prompt' | 'user' | 'thinking'
  timestamp: Date
  payload?: OSFinalizePayload
}

interface ThomazOrchestratorProps {
  onOpenTaskBoard?: () => void
}

export function ThomazOrchestrator({ onOpenTaskBoard }: ThomazOrchestratorProps) {
  const [messages, setMessages] = useState<OrchestratorMessage[]>([])
  const [runningChain, setRunningChain] = useState(false)
  const [chainResults, setChainResults] = useState<ChainResult[] | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<OSFinalizePayload | null>(null)
  const [inputText, setInputText] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (expanded && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, expanded])

  const pushMessage = useCallback((msg: Omit<OrchestratorMessage, 'id' | 'timestamp'>) => {
    setMessages(prev => [
      ...prev,
      { ...msg, id: `${Date.now()}_${Math.random()}`, timestamp: new Date() },
    ].slice(-20))
    setExpanded(true)
  }, [])

  // Realtime: OS finalizada
  useEffect(() => {
    const channel = supabase
      .channel('thomaz_orchestrator_os')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'service_orders' },
        async (payload: any) => {
          const newStatus = payload.new?.status
          const oldStatus = payload.old?.status

          if (newStatus === 'completed' && oldStatus !== 'completed') {
            const os = payload.new
            const osPayload: OSFinalizePayload = {
              osId: os.id,
              orderNumber: os.order_number || os.id.substring(0, 8),
              clientName: os.client_name || 'Cliente',
              clientEmail: os.client_email,
              actualValue: os.actual_value,
              margin: os.margin_percentage,
            }

            pushMessage({
              type: 'action_prompt',
              text: `OS #${osPayload.orderNumber} (${osPayload.clientName}) finalizada${osPayload.actualValue ? ` — R$ ${Number(osPayload.actualValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}. Disparo a cadeia automática (PDF + E-mail + Tarefa)?`,
              payload: osPayload,
            })
            setPendingPayload(osPayload)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [pushMessage])

  // Verificação de equipe ociosa — apenas 1x por dia
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    const lastCheck = localStorage.getItem(IDLE_CHECK_KEY)
    if (lastCheck === today) return

    const checkIdleTeam = async () => {
      const thursday = new Date()
      thursday.setDate(thursday.getDate() + ((4 - thursday.getDay() + 7) % 7))
      const dateStr = thursday.toISOString().substring(0, 10)

      const { data: events } = await supabase
        .from('agenda_events')
        .select('id')
        .gte('start_date', dateStr)
        .lte('start_date', dateStr)
        .limit(5)

      if (!events || events.length < 2) {
        pushMessage({
          type: 'action_prompt',
          text: `A equipe parece ociosa na quinta-feira (${dateStr}). Disparo lembretes de manutenção preventiva para clientes da agenda?`,
        })
      }

      localStorage.setItem(IDLE_CHECK_KEY, today)
    }

    const timer = setTimeout(checkIdleTeam, 8000)
    return () => clearTimeout(timer)
  }, [pushMessage])

  const handleRunChain = useCallback(async (payload: OSFinalizePayload) => {
    setRunningChain(true)
    setChainResults(null)
    setPendingPayload(null)

    pushMessage({ type: 'info', text: `Executando cadeia para OS #${payload.orderNumber}...` })

    const results = await runOSFinalizeChain(payload)
    setChainResults(results)
    setRunningChain(false)

    const successCount = results.filter(r => r.success).length - 1
    const total = results.length - 2

    pushMessage({
      type: 'success',
      text: `OS #${payload.orderNumber} processada. ${successCount}/${total} ações concluídas: PDF gerado, e-mail enviado, tarefa criada no Kanban.`,
    })
  }, [pushMessage])

  const handleDismiss = useCallback((id: string) => {
    setMessages(prev => {
      const next = prev.filter(m => m.id !== id)
      if (next.length === 0) setExpanded(false)
      return next
    })
  }, [])

  const handleSendPreventiveMaintenance = useCallback(async () => {
    setPendingPayload(null)
    pushMessage({
      type: 'success',
      text: `Disparando lembretes de manutenção preventiva... verificando contratos ativos e agendando visitas para quinta-feira.`,
    })
  }, [pushMessage])

  const handleSendMessage = useCallback(async () => {
    const text = inputText.trim()
    if (!text || sendingMessage) return

    setInputText('')
    setSendingMessage(true)

    pushMessage({ type: 'user', text })

    const thinkingId = `thinking_${Date.now()}`
    setMessages(prev => [
      ...prev,
      { id: thinkingId, text: '', type: 'thinking', timestamp: new Date() },
    ])

    try {
      const response = await thomazConversationalService.chat(text, SESSION_ID)
      setMessages(prev => prev.filter(m => m.id !== thinkingId))
      pushMessage({ type: 'info', text: response.message })
    } catch {
      setMessages(prev => prev.filter(m => m.id !== thinkingId))
      pushMessage({ type: 'warning', text: 'Não consegui processar sua mensagem. Tente novamente.' })
    } finally {
      setSendingMessage(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [inputText, sendingMessage, pushMessage])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const hasContent = messages.length > 0 || runningChain

  return (
    <AnimatePresence>
      {hasContent && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="fixed bottom-6 right-6 z-[900] w-[420px] max-w-[calc(100vw-1.5rem)]"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">

            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-800 to-slate-900 cursor-pointer select-none"
              onClick={() => setExpanded(e => !e)}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white flex items-center gap-1.5">
                    Thomaz AI
                    <Sparkles className="h-3 w-3 text-yellow-400" />
                    <span className="text-xs font-normal text-slate-300">Orquestrador</span>
                  </p>
                </div>
                {messages.filter(m => m.type !== 'user' && m.type !== 'thinking').length > 0 && (
                  <span className="text-[10px] bg-blue-500 text-white rounded-full px-1.5 py-0.5 font-bold leading-none">
                    {messages.filter(m => m.type !== 'user' && m.type !== 'thinking').length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {(runningChain || sendingMessage) && <Loader2 className="h-3.5 w-3.5 text-blue-400 animate-spin" />}
                {expanded
                  ? <ChevronDown className="h-4 w-4 text-slate-400" />
                  : <ChevronUp className="h-4 w-4 text-slate-400" />
                }
              </div>
            </div>

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  {/* Messages */}
                  <div className="p-3 space-y-2 max-h-72 overflow-y-auto">
                    {messages.map(msg => {
                      if (msg.type === 'thinking') {
                        return (
                          <div key={msg.id} className="flex items-center gap-2 px-1">
                            <div className="flex gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <span className="text-xs text-gray-400">Thomaz está pensando...</span>
                          </div>
                        )
                      }

                      if (msg.type === 'user') {
                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex justify-end"
                          >
                            <div className="bg-slate-800 text-white text-xs rounded-2xl rounded-tr-sm px-3 py-2 max-w-[80%] leading-relaxed">
                              {msg.text}
                            </div>
                          </motion.div>
                        )
                      }

                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className={`rounded-xl border p-3 relative ${
                            msg.type === 'success'
                              ? 'bg-teal-50 border-teal-200'
                              : msg.type === 'action_prompt'
                                ? 'bg-blue-50 border-blue-200'
                                : msg.type === 'warning'
                                  ? 'bg-amber-50 border-amber-200'
                                  : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <button
                            onClick={() => handleDismiss(msg.id)}
                            className="absolute top-2 right-2 text-gray-300 hover:text-gray-500 transition"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                          <div className="flex gap-2.5">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                              msg.type === 'success' ? 'bg-teal-500' :
                              msg.type === 'action_prompt' ? 'bg-blue-500' :
                              msg.type === 'warning' ? 'bg-amber-500' : 'bg-gray-400'
                            }`}>
                              {msg.type === 'success'
                                ? <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                                : <Bot className="h-3.5 w-3.5 text-white" />
                              }
                            </div>
                            <div className="flex-1 min-w-0 pr-5">
                              <p className="text-xs text-gray-700 leading-relaxed">{msg.text}</p>

                              {msg.type === 'action_prompt' && msg.payload && (
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() => handleRunChain(msg.payload!)}
                                    disabled={runningChain}
                                    className="flex items-center gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1.5 transition disabled:opacity-60"
                                  >
                                    <Zap className="h-3 w-3" />
                                    {runningChain ? 'Executando...' : 'Executar Cadeia'}
                                  </button>
                                  <button
                                    onClick={() => handleDismiss(msg.id)}
                                    className="text-xs text-gray-500 hover:text-gray-700 px-2 transition"
                                  >
                                    Ignorar
                                  </button>
                                </div>
                              )}

                              {msg.type === 'action_prompt' && !msg.payload && (
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={handleSendPreventiveMaintenance}
                                    className="flex items-center gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1.5 transition"
                                  >
                                    <Zap className="h-3 w-3" />
                                    Disparar Lembretes
                                  </button>
                                  <button
                                    onClick={() => handleDismiss(msg.id)}
                                    className="text-xs text-gray-500 hover:text-gray-700 px-2 transition"
                                  >
                                    Ignorar
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}

                    {runningChain && (
                      <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-200 rounded-xl p-3">
                        <Loader2 className="h-4 w-4 text-blue-500 animate-spin shrink-0" />
                        <p className="text-xs text-blue-700 font-medium">Executando automações em cadeia...</p>
                      </div>
                    )}

                    {chainResults && (
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-1">
                        <p className="text-xs font-semibold text-gray-600 mb-2">Relatório da Cadeia:</p>
                        {chainResults.map((r, i) => (
                          <div key={i} className="flex items-start gap-2">
                            {r.success
                              ? <CheckCircle2 className="h-3.5 w-3.5 text-teal-500 shrink-0 mt-0.5" />
                              : <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                            }
                            <div>
                              <p className="text-xs text-gray-700">{r.step}</p>
                              {r.detail && <p className="text-[10px] text-gray-400">{r.detail}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input de ordens */}
                  <div className="border-t border-gray-100 px-3 py-2.5 bg-gray-50">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Dê uma ordem ao Thomaz..."
                        disabled={sendingMessage}
                        className="flex-1 text-xs bg-white border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 placeholder:text-gray-400 disabled:opacity-60 transition"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!inputText.trim() || sendingMessage}
                        className="w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl transition shrink-0"
                      >
                        {sendingMessage
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Send className="h-3.5 w-3.5" />
                        }
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1.5 ml-6">
                      Ex: "Liste OS abertas", "Quem está ocioso?", "Crie tarefa para João"
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
