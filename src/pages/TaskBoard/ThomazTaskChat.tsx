import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot, X, Send, Loader2, Sparkles, ChevronDown, ChevronUp,
  Plus, MoveRight, UserCheck, CheckCircle2, List, Zap, Minimize2, Maximize2
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Task, ColumnId, Priority } from './types'

interface ChatMsg {
  id: string
  role: 'user' | 'thomaz'
  text: string
  ts: Date
  loading?: boolean
}

interface Props {
  tasks: Task[]
  onCreateTask: (payload: Partial<Task>) => Promise<any>
  onUpdateTask: (id: string, payload: Partial<Task>) => void
  onOpenTask: (id: string) => void
}

const COLUMN_LABELS: Record<ColumnId, string> = {
  todo: 'Para Fazer',
  in_progress: 'Em Andamento',
  review: 'Em Revisão',
  blocked: 'Bloqueado',
  done: 'Concluído',
}

const COLUMN_ALIASES: Record<string, ColumnId> = {
  'para fazer': 'todo',
  'todo': 'todo',
  'a fazer': 'todo',
  'pendente': 'todo',
  'em andamento': 'in_progress',
  'andamento': 'in_progress',
  'iniciado': 'in_progress',
  'iniciada': 'in_progress',
  'em revisão': 'review',
  'revisão': 'review',
  'revisao': 'review',
  'review': 'review',
  'bloqueado': 'blocked',
  'bloqueada': 'blocked',
  'parado': 'blocked',
  'impedido': 'blocked',
  'concluído': 'done',
  'concluida': 'done',
  'concluido': 'done',
  'finalizado': 'done',
  'feito': 'done',
  'done': 'done',
}

const PRIORITY_ALIASES: Record<string, Priority> = {
  'urgente': 'urgent', 'urgência': 'urgent', 'urgencia': 'urgent', 'critical': 'urgent',
  'alta': 'high', 'alto': 'high', 'high': 'high',
  'normal': 'normal', 'média': 'normal', 'media': 'normal',
  'baixa': 'low', 'baixo': 'low', 'low': 'low',
}

function normalizeText(t: string) {
  return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function resolveColumn(text: string): ColumnId | null {
  const n = normalizeText(text)
  for (const [alias, col] of Object.entries(COLUMN_ALIASES)) {
    if (n.includes(normalizeText(alias))) return col
  }
  return null
}

function resolvePriority(text: string): Priority {
  const n = normalizeText(text)
  for (const [alias, pri] of Object.entries(PRIORITY_ALIASES)) {
    if (n.includes(normalizeText(alias))) return pri
  }
  return 'normal'
}

function findTaskByTitle(tasks: Task[], query: string): Task | null {
  const q = normalizeText(query)
  return tasks.find(t => normalizeText(t.title).includes(q)) || null
}

async function fetchEmployees(): Promise<{ id: string; name: string; role?: string }[]> {
  const { data } = await supabase
    .from('employees')
    .select('id, name, role')
    .eq('active', true)
    .order('name')
  return data || []
}

function matchEmployee(name: string, employees: { id: string; name: string; role?: string }[]): { id: string; name: string } | null {
  const q = normalizeText(name)
  return employees.find(e => normalizeText(e.name).includes(q) || normalizeText(e.name.split(' ')[0]).includes(q)) || null
}

async function processCommand(
  input: string,
  tasks: Task[],
  onCreateTask: Props['onCreateTask'],
  onUpdateTask: Props['onUpdateTask'],
): Promise<string> {
  const n = normalizeText(input)

  if (/(cri[ae]|adiciona|nova? tarefa|add task|faz uma tarefa|gera uma tarefa)/.test(n)) {
    const titleMatch = input.match(/(?:tarefa|task)?[:\s"«]+(.+?)(?:$|["»]|para |com prioridade|urgente|alta|normal|baixa)/i)
    const rawTitle = titleMatch ? titleMatch[1].trim() : input.replace(/cri[ae]r?|adiciona[r]?|nova? tarefa/gi, '').trim()
    const title = rawTitle || 'Nova tarefa'
    const priority = resolvePriority(input)
    const column = resolveColumn(input) || 'todo'

    await onCreateTask({ title, priority, column_id: column, description: '', tags: [] })
    return `Tarefa **"${title}"** criada em *${COLUMN_LABELS[column]}* com prioridade **${priority === 'urgent' ? 'urgente' : priority === 'high' ? 'alta' : priority === 'low' ? 'baixa' : 'normal'}**. Posso fazer mais alguma coisa?`
  }

  if (/(move[r]?|coloca[r]?|joga|transfer[ei]|passa[r]?)/.test(n)) {
    const col = resolveColumn(input)
    if (!col) return 'Qual coluna você quer mover? Posso mover para: *Para Fazer, Em Andamento, Em Revisão, Bloqueado* ou *Concluído*.'

    const colNames = Object.values(COLUMN_ALIASES)
    const cleanInput = input.replace(/mover?|coloca[r]?|joga[r]?|transfer[ei][r]?|para[r]?/gi, '').trim()

    const task = findTaskByTitle(tasks, cleanInput)
    if (!task) {
      const activeTasks = tasks.filter(t => t.column_id !== 'done')
      if (activeTasks.length === 0) return 'Não encontrei tarefas ativas para mover.'
      return `Qual tarefa você quer mover para *${COLUMN_LABELS[col]}*? As ativas são:\n${activeTasks.slice(0, 6).map(t => `• ${t.title}`).join('\n')}`
    }

    onUpdateTask(task.id, { column_id: col })
    return `Tarefa **"${task.title}"** movida para *${COLUMN_LABELS[col]}*. Feito!`
  }

  if (/(atribu[íi]|designa[r]?|assign|responsavel|dono)/.test(n)) {
    const employees = await fetchEmployees()
    const empMatch = employees.find(e => n.includes(normalizeText(e.name)) || n.includes(normalizeText(e.name.split(' ')[0])))

    if (!empMatch) {
      return `Para atribuir uma tarefa, me diga o nome do responsável. Funcionários cadastrados:\n${employees.slice(0, 8).map(e => `• ${e.name}${e.role ? ` (${e.role})` : ''}`).join('\n')}`
    }

    const cleanInput = input
      .replace(/atribu[íi][r]?|designa[r]?|assign|para o?|para a?|ao?|ao funcionario/gi, '')
      .replace(empMatch.name, '').trim()

    const task = findTaskByTitle(tasks, cleanInput)
    if (!task) {
      const activeTasks = tasks.filter(t => t.column_id !== 'done')
      return `Qual tarefa você quer atribuir a **${empMatch.name}**?\n${activeTasks.slice(0, 5).map(t => `• ${t.title}`).join('\n')}`
    }

    onUpdateTask(task.id, { assignee_id: empMatch.id, assignee_name: empMatch.name })
    return `Tarefa **"${task.title}"** atribuída a **${empMatch.name}**. Ele(a) receberá a notificação!`
  }

  if (/(listar?|mostrar?|quais|quantas|ver tarefas|status)/.test(n)) {
    const col = resolveColumn(input)
    const filtered = col ? tasks.filter(t => t.column_id === col) : tasks

    if (filtered.length === 0) {
      return col
        ? `Nenhuma tarefa em *${COLUMN_LABELS[col]}* no momento.`
        : 'Não há tarefas cadastradas ainda.'
    }

    const grouped: Record<string, Task[]> = {}
    filtered.forEach(t => {
      if (!grouped[t.column_id]) grouped[t.column_id] = []
      grouped[t.column_id].push(t)
    })

    let response = col
      ? `**${COLUMN_LABELS[col]}** (${filtered.length} tarefa${filtered.length !== 1 ? 's' : ''}):\n`
      : `**Resumo do quadro** (${tasks.length} tarefa${tasks.length !== 1 ? 's' : ''} total):\n`

    Object.entries(grouped).forEach(([colId, colTasks]) => {
      if (!col) response += `\n*${COLUMN_LABELS[colId as ColumnId]}* — ${colTasks.length}\n`
      colTasks.slice(0, col ? 10 : 3).forEach(t => {
        response += `• ${t.title}${t.assignee_name ? ` → ${t.assignee_name}` : ''}\n`
      })
    })

    return response.trim()
  }

  if (/(urgente|priorit|importante|critico)/.test(n) && /(listar?|mostrar?|quais|ver)/.test(n)) {
    const urgent = tasks.filter(t => t.priority === 'urgent' && t.column_id !== 'done')
    if (urgent.length === 0) return 'Ótima notícia! Não há tarefas urgentes pendentes no momento.'
    return `**${urgent.length} tarefa${urgent.length !== 1 ? 's' : ''} urgente${urgent.length !== 1 ? 's' : ''}:**\n${urgent.map(t => `• ${t.title}${t.assignee_name ? ` (${t.assignee_name})` : ''}`).join('\n')}`
  }

  if (/(concluir?|finalizar?|fechar|completar|marcar como concluido|marcar pronto)/.test(n)) {
    const cleanInput = input.replace(/concluir?|finalizar?|fechar?|completar?|marcar como|pronto|feito/gi, '').trim()
    const task = findTaskByTitle(tasks, cleanInput)

    if (!task) {
      const active = tasks.filter(t => t.column_id !== 'done')
      return `Qual tarefa você quer concluir?\n${active.slice(0, 6).map(t => `• ${t.title}`).join('\n')}`
    }

    onUpdateTask(task.id, { column_id: 'done' })
    return `Tarefa **"${task.title}"** marcada como **Concluída**! Ótimo trabalho!`
  }

  if (/(bloquea[r]?|bloquear|impedido|bloqueado)/.test(n)) {
    const cleanInput = input.replace(/bloquea[r]?|bloquear|impedido|bloqueado/gi, '').trim()
    const task = findTaskByTitle(tasks, cleanInput)
    if (!task) return 'Qual tarefa está bloqueada? Me diga o título ou parte dele.'
    onUpdateTask(task.id, { column_id: 'blocked' })
    return `Tarefa **"${task.title}"** movida para *Bloqueado*. Vou monitorar e alertar se ficar parada por mais de 48h.`
  }

  if (/(resumo|dashboard|relatorio|como esta|status geral|panorama)/.test(n)) {
    const active = tasks.filter(t => t.column_id !== 'done')
    const done = tasks.filter(t => t.column_id === 'done')
    const urgent = tasks.filter(t => t.priority === 'urgent' && t.column_id !== 'done')
    const blocked = tasks.filter(t => t.column_id === 'blocked')
    const unassigned = active.filter(t => !t.assignee_name)

    return `**Resumo do Task Board:**\n• ${active.length} tarefa${active.length !== 1 ? 's' : ''} ativa${active.length !== 1 ? 's' : ''}\n• ${done.length} concluída${done.length !== 1 ? 's' : ''}\n• ${urgent.length} urgente${urgent.length !== 1 ? 's' : ''} 🚨\n• ${blocked.length} bloqueada${blocked.length !== 1 ? 's' : ''}\n• ${unassigned.length} sem responsável\n\nQuer que eu tome alguma ação?`
  }

  if (/(ajuda|o que voce faz|o que você faz|como usar|comandos|o que posso)/.test(n)) {
    return `Posso te ajudar com o quadro de tarefas! Experimente:\n• *"Cria uma tarefa Revisar proposta com prioridade alta"*\n• *"Move Revisar proposta para Em Andamento"*\n• *"Atribui Revisar proposta para João"*\n• *"Listar tarefas bloqueadas"*\n• *"Conclui a tarefa Revisar proposta"*\n• *"Resumo geral"*\n• *"Quais tarefas urgentes temos?"*`
  }

  const activeTasks = tasks.filter(t => t.column_id !== 'done')
  return `Entendi que você disse: *"${input}"*\n\nPosso criar tarefas, mover entre colunas, atribuir responsáveis, listar ou concluir. Como posso ajudar com o quadro de tarefas?`
}

function renderText(text: string) {
  return text.split('\n').map((line, i) => {
    const boldedLine = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>')
    if (line.startsWith('•')) {
      return <li key={i} className="ml-3 list-none text-[12.5px] leading-relaxed" dangerouslySetInnerHTML={{ __html: boldedLine }} />
    }
    if (!line) return <br key={i} />
    return <p key={i} className="text-[12.5px] leading-relaxed" dangerouslySetInnerHTML={{ __html: boldedLine }} />
  })
}

const QUICK_PROMPTS = [
  { label: 'Resumo geral', icon: List },
  { label: 'Ver urgentes', icon: Zap },
  { label: 'Criar tarefa', icon: Plus },
  { label: 'Tarefas sem responsável', icon: UserCheck },
]

export function ThomazTaskChat({ tasks, onCreateTask, onUpdateTask, onOpenTask }: Props) {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && messages.length === 0) {
      const hour = new Date().getHours()
      const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
      setMessages([{
        id: 'intro',
        role: 'thomaz',
        text: `${greeting}! Sou o Thomaz, seu assistente de tarefas. Posso criar tarefas, mover entre colunas, atribuir responsáveis e muito mais. O que precisa?`,
        ts: new Date(),
      }])
    }
  }, [open, messages.length])

  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
    }
  }, [messages, open, minimized])

  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, minimized])

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: ChatMsg = { id: `u_${Date.now()}`, role: 'user', text: text.trim(), ts: new Date() }
    const placeholderId = `t_${Date.now()}`

    setMessages(prev => [...prev, userMsg, { id: placeholderId, role: 'thomaz', text: '', ts: new Date(), loading: true }])
    setInput('')
    setLoading(true)

    try {
      await new Promise(r => setTimeout(r, 420))
      const reply = await processCommand(text, tasks, onCreateTask, onUpdateTask)
      setMessages(prev => prev.map(m => m.id === placeholderId ? { ...m, text: reply, loading: false } : m))
    } catch {
      setMessages(prev => prev.map(m => m.id === placeholderId ? { ...m, text: 'Ocorreu um erro ao processar o comando. Tente novamente.', loading: false } : m))
    } finally {
      setLoading(false)
    }
  }, [loading, tasks, onCreateTask, onUpdateTask])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-20 right-6 z-[960] w-[360px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col"
            style={{ maxHeight: minimized ? 52 : 480 }}
          >
            <div className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-800 shrink-0">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white leading-none">Thomaz AI</p>
                <p className="text-[10px] text-blue-200">Assistente do Task Board</p>
              </div>
              <button
                onClick={() => setMinimized(m => !m)}
                className="text-white/70 hover:text-white transition p-0.5"
                title={minimized ? 'Expandir' : 'Minimizar'}
              >
                {minimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="text-white/70 hover:text-white transition p-0.5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {!minimized && (
              <>
                <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {msg.role === 'thomaz' && (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="h-3.5 w-3.5 text-white" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                        }`}
                      >
                        {msg.loading ? (
                          <div className="flex items-center gap-1.5 py-0.5">
                            <motion.span animate={{ opacity: [0.3,1,0.3] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0 }} className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                            <motion.span animate={{ opacity: [0.3,1,0.3] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                            <motion.span animate={{ opacity: [0.3,1,0.3] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                          </div>
                        ) : msg.role === 'thomaz' ? (
                          <div className="space-y-0.5">{renderText(msg.text)}</div>
                        ) : (
                          <p className="text-[12.5px] leading-relaxed">{msg.text}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                {messages.length <= 1 && (
                  <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                    {QUICK_PROMPTS.map(qp => {
                      const Icon = qp.icon
                      return (
                        <button
                          key={qp.label}
                          onClick={() => send(qp.label)}
                          className="flex items-center gap-1 text-xs px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full hover:bg-blue-100 transition"
                        >
                          <Icon className="h-3 w-3" />
                          {qp.label}
                        </button>
                      )
                    })}
                  </div>
                )}

                <div className="px-3 py-2.5 border-t border-gray-100 flex items-center gap-2 shrink-0">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    placeholder="Manda um comando para o Thomaz..."
                    className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white transition disabled:opacity-50"
                  />
                  <button
                    onClick={() => send(input)}
                    disabled={!input.trim() || loading}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition shrink-0 ${
                      input.trim() && !loading
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.94 }}
        className={`fixed bottom-6 right-6 z-[960] w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl transition-all ${
          open
            ? 'bg-blue-700 text-white'
            : 'bg-gradient-to-br from-blue-600 to-blue-800 text-white'
        }`}
        title="Thomaz AI - Assistente de Tarefas"
      >
        {open ? <X className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
        )}
      </motion.button>
    </>
  )
}
