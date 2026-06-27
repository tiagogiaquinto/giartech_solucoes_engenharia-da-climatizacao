import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

// ─── Ícones inline (sem dependência extra) ────────────────────
const Icon = {
  wrench:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  calendar: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  tasks:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  cart:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  phone:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.6 4.9 2 2 0 0 1 3.56 2.72h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.1a16 16 0 0 0 6 6l.9-.9a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 17.47z"/></svg>,
  map:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  check:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="20 6 9 17 4 12"/></svg>,
  plus:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  back:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polyline points="15 18 9 12 15 6"/></svg>,
  close:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  play:     () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  done:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  search:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  trash:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  clock:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  tool:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  alert:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
}

// ─── Cores de status (visíveis ao sol) ───────────────────────
const STATUS: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  'aberta':       { label: 'Aberta',       dot: '#3b82f6', text: '#1d4ed8', bg: '#eff6ff' },
  'cotacao':      { label: 'Cotação',      dot: '#a855f7', text: '#7e22ce', bg: '#faf5ff' },
  'in_progress':  { label: 'Em andamento', dot: '#f59e0b', text: '#b45309', bg: '#fffbeb' },
  'em_andamento': { label: 'Em andamento', dot: '#f59e0b', text: '#b45309', bg: '#fffbeb' },
  'completed':    { label: 'Concluída',    dot: '#22c55e', text: '#15803d', bg: '#f0fdf4' },
  'concluida':    { label: 'Concluída',    dot: '#22c55e', text: '#15803d', bg: '#f0fdf4' },
}

const PRIO: Record<string, { label: string; color: string }> = {
  'urgent': { label: '⚡ URGENTE', color: '#ef4444' },
  'high':   { label: '🔴 Alta',    color: '#f97316' },
  'medium': { label: '🟡 Média',   color: '#eab308' },
  'low':    { label: '⚪ Baixa',   color: '#9ca3af' },
}

const fmtData  = (d: string) => !d ? '—' : new Date(d).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})
const fmtHora  = (d: string) => !d ? '' : new Date(d).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
const fmtDia   = (d: string) => !d ? '—' : new Date(d).toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'})

// ─── TIPOS ────────────────────────────────────────────────────
type Tab = 'os' | 'agenda' | 'tarefas' | 'compras'
interface OS { id:string; order_number:string; title:string; client_name:string; client_phone:string; client_address:string; client_city:string; service_type:string; description:string; escopo_detalhado:string; orientacoes_servico:string; special_instructions:string; access_note:string; status:string; priority:string; service_date:string; due_date:string; scheduled_at:string; estimated_hours:number; progress_percent:number; checklist_completed:boolean; required_tools:string[]; required_materials:string[]; technician_notes:string; brand:string; model:string; equipment:string; special_tools:string; location:string }
interface Agenda { id:string; title:string; start_date:string; end_date:string; location:string; all_day:boolean; notes:string; client_name:string; os_number:string }
interface Task { id:string; title:string; description:string; status:string; priority:string; due_date:string; category:string; os_number:string; color:string }
interface Invent { id:string; name:string; category:string; unit:string; quantity:number; location:string; disponivel:boolean }
interface SolItem { nome_item:string; quantidade:number; unidade:string; observacao:string }

// ─── PORTAL PRINCIPAL ────────────────────────────────────────
export default function TechnicianPortal() {
  const [tab, setTab]         = useState<Tab>('os')
  const [loading, setLoading] = useState(false)
  const [os, setOs]           = useState<OS[]>([])
  const [agenda, setAgenda]   = useState<Agenda[]>([])
  const [tasks, setTasks]     = useState<Task[]>([])
  const [invent, setInvent]   = useState<Invent[]>([])
  const [osAtiva, setOsAtiva] = useState<OS | null>(null)
  const [checklist, setChecklist] = useState<any[]>([])
  const [techNote, setTechNote]   = useState('')
  const [progress, setProgress]   = useState(0)
  const [salvando, setSalvando]   = useState(false)
  const [savedOk, setSavedOk]     = useState(false)
  const [busca, setBusca]         = useState('')
  const [modalSol, setModalSol]   = useState(false)
  const [solOS, setSolOS]         = useState('')
  const [solUrg, setSolUrg]       = useState<'normal'|'alta'|'urgente'>('normal')
  const [solObs, setSolObs]       = useState('')
  const [solItens, setSolItens]   = useState<SolItem[]>([{nome_item:'',quantidade:1,unidade:'UN',observacao:''}])
  const [enviando, setEnviando]   = useState(false)
  const [enviado, setEnviado]     = useState(false)
  const noteRef = useRef<HTMLTextAreaElement>(null)

  const load = async (t: Tab) => {
    setLoading(true)
    try {
      if (t === 'os') {
        const { data } = await supabase.rpc('get_os_tecnico')
        setOs(data || [])
      } else if (t === 'agenda') {
        const hoje = new Date().toISOString().split('T')[0]
        const fim  = new Date(Date.now()+30*86400000).toISOString().split('T')[0]
        const { data } = await supabase.rpc('get_agenda_tecnico',{ p_data_inicio:hoje, p_data_fim:fim })
        setAgenda(data || [])
      } else if (t === 'tarefas') {
        const { data } = await supabase.rpc('get_tasks_tecnico')
        setTasks(data || [])
      } else {
        const { data } = await supabase.rpc('get_inventario_tecnico')
        setInvent(data || [])
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { load(tab) }, [tab])

  const abrirOS = async (o: OS) => {
    setOsAtiva(o); setTechNote(o.technician_notes || ''); setProgress(o.progress_percent || 0)
    const { data } = await supabase.rpc('get_checklist_os_tecnico',{ p_os_id: o.id })
    setChecklist(data || [])
  }

  const salvar = async () => {
    if (!osAtiva) return
    setSalvando(true)
    await supabase.rpc('tecnico_atualizar_os',{ p_os_id:osAtiva.id, p_progress:progress, p_technician_notes:techNote })
    setSalvando(false); setSavedOk(true); setTimeout(()=>setSavedOk(false),2000)
  }

  const mudarStatus = async (novo: string) => {
    if (!osAtiva) return
    await supabase.rpc('tecnico_atualizar_os',{ p_os_id:osAtiva.id, p_status:novo })
    setOsAtiva(p => p ? {...p, status:novo} : null)
    setOs(p => p.map(o => o.id===osAtiva.id ? {...o,status:novo} : o))
  }

  const marcarCheck = async (id:string, done:boolean) => {
    await supabase.rpc('tecnico_marcar_checklist',{ p_item_id:id, p_completed:done })
    setChecklist(p => p.map(c => c.id===id ? {...c,is_completed:done} : c))
  }

  const enviarSolicitacao = async () => {
    const validos = solItens.filter(i=>i.nome_item.trim())
    if (!validos.length) return
    setEnviando(true)
    const { data } = await supabase.rpc('criar_solicitacao_material',{
      p_service_order_id: solOS||null, p_urgencia:solUrg, p_observacoes:solObs, p_itens:validos
    })
    setEnviando(false)
    if (data?.ok) {
      setEnviado(true)
      setTimeout(()=>{ setEnviado(false); setModalSol(false); setSolItens([{nome_item:'',quantidade:1,unidade:'UN',observacao:''}]); setSolObs('') },2000)
    }
  }

  const inventFiltrado = invent.filter(i => !busca || i.name.toLowerCase().includes(busca.toLowerCase()) || i.category?.toLowerCase().includes(busca.toLowerCase()))

  // ─── TELA DE DETALHE DA OS ──────────────────────────────────
  if (osAtiva) {
    const st = STATUS[osAtiva.status] || { label:osAtiva.status, dot:'#9ca3af', text:'#374151', bg:'#f9fafb' }
    const checkDone = checklist.filter(c=>c.is_completed).length
    const checkPct  = checklist.length ? Math.round(checkDone/checklist.length*100) : 0
    const podeIniciar  = ['aberta','cotacao'].includes(osAtiva.status)
    const podeConcluir = ['in_progress','em_andamento'].includes(osAtiva.status)

    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col">
        {/* Topo */}
        <div className="flex items-center gap-3 px-4 pt-5 pb-3 bg-gray-900 border-b border-gray-800">
          <button onClick={()=>setOsAtiva(null)} className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
            <Icon.back />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 font-mono">{osAtiva.order_number}</p>
            <p className="font-semibold text-white text-base leading-tight truncate">{osAtiva.title}</p>
          </div>
          <span className="text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0" style={{background:st.bg, color:st.text}}>
            {st.label}
          </span>
        </div>

        {/* Conteúdo rolável */}
        <div className="flex-1 overflow-y-auto pb-32 space-y-3 px-4 pt-4">

          {/* Prioridade urgente — destaque máximo */}
          {osAtiva.priority === 'urgent' && (
            <div className="bg-red-500 rounded-2xl p-4 flex items-center gap-3">
              <Icon.alert />
              <p className="font-bold text-white text-base">SERVIÇO URGENTE</p>
            </div>
          )}

          {/* Cliente + contato */}
          <div className="bg-gray-800 rounded-2xl p-4 space-y-3">
            <p className="text-lg font-semibold text-white">{osAtiva.client_name}</p>
            {osAtiva.client_phone && (
              <a href={`tel:${osAtiva.client_phone}`}
                className="flex items-center gap-3 bg-green-600 text-white rounded-xl px-4 py-3 font-semibold text-sm active:scale-95 transition-transform">
                <Icon.phone />
                Ligar: {osAtiva.client_phone}
              </a>
            )}
            {osAtiva.client_address && (
              <a href={`https://maps.google.com/?q=${encodeURIComponent([osAtiva.client_address,osAtiva.client_city].filter(Boolean).join(', '))}`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-3 bg-blue-600 text-white rounded-xl px-4 py-3 font-semibold text-sm active:scale-95 transition-transform">
                <Icon.map />
                {osAtiva.client_address}{osAtiva.client_city ? `, ${osAtiva.client_city}` : ''}
              </a>
            )}
            {osAtiva.access_note && (
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-3">
                <p className="text-yellow-300 text-xs font-semibold mb-1">Instrução de acesso</p>
                <p className="text-yellow-100 text-sm">{osAtiva.access_note}</p>
              </div>
            )}
          </div>

          {/* Equipamento */}
          {(osAtiva.equipment || osAtiva.brand || osAtiva.model) && (
            <div className="bg-gray-800 rounded-2xl p-4">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Equipamento</p>
              <p className="text-white text-base font-medium">{[osAtiva.equipment,osAtiva.brand,osAtiva.model].filter(Boolean).join(' · ')}</p>
            </div>
          )}

          {/* O que fazer */}
          {(osAtiva.description || osAtiva.escopo_detalhado) && (
            <div className="bg-gray-800 rounded-2xl p-4 space-y-3">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">O que fazer</p>
              {osAtiva.description && <p className="text-white text-sm leading-relaxed">{osAtiva.description}</p>}
              {osAtiva.escopo_detalhado && (
                <div className="border-t border-gray-700 pt-3">
                  <p className="text-xs text-gray-400 mb-1">Escopo detalhado</p>
                  <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-line">{osAtiva.escopo_detalhado}</p>
                </div>
              )}
              {osAtiva.orientacoes_servico && (
                <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-3">
                  <p className="text-blue-300 text-xs font-semibold mb-1">Orientações</p>
                  <p className="text-blue-100 text-sm leading-relaxed">{osAtiva.orientacoes_servico}</p>
                </div>
              )}
              {osAtiva.special_instructions && (
                <div className="bg-orange-500/20 border border-orange-500/30 rounded-xl p-3">
                  <p className="text-orange-300 text-xs font-semibold mb-1">Atenção</p>
                  <p className="text-orange-100 text-sm">{osAtiva.special_instructions}</p>
                </div>
              )}
            </div>
          )}

          {/* Ferramentas */}
          {osAtiva.required_tools?.length > 0 && (
            <div className="bg-gray-800 rounded-2xl p-4">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">Ferramentas necessárias</p>
              <div className="flex flex-wrap gap-2">
                {osAtiva.required_tools.map((t,i) => (
                  <span key={i} className="flex items-center gap-1.5 bg-gray-700 text-gray-200 text-sm px-3 py-1.5 rounded-full">
                    <Icon.tool />{t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Checklist */}
          {checklist.length > 0 && (
            <div className="bg-gray-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Checklist</p>
                <span className="text-sm font-bold text-white">{checkDone}/{checklist.length}</span>
              </div>
              {/* Barra grossa — fácil de ver em campo */}
              <div className="h-3 bg-gray-700 rounded-full mb-4 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{width:`${checkPct}%`, background: checkPct===100?'#22c55e':'#3b82f6'}} />
              </div>
              <div className="space-y-1">
                {checklist.map(item => (
                  <button key={item.id} onClick={()=>marcarCheck(item.id,!item.is_completed)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors active:scale-98 ${
                      item.is_completed ? 'bg-green-500/20' : 'bg-gray-700'
                    }`}>
                    <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all ${
                      item.is_completed ? 'bg-green-500 border-green-500' : 'border-gray-500'
                    }`}>
                      {item.is_completed && <Icon.check />}
                    </div>
                    <span className={`text-sm flex-1 ${item.is_completed ? 'line-through text-gray-400' : 'text-white'}`}>
                      {item.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Progresso + notas */}
          <div className="bg-gray-800 rounded-2xl p-4 space-y-4">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Meu progresso</p>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Execução</span>
                <span className="text-white font-bold text-xl">{progress}%</span>
              </div>
              {/* Slider grande — fácil de arrastar com dedão */}
              <input type="range" min={0} max={100} step={5} value={progress}
                onChange={e => setProgress(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{accentColor:'#3b82f6'}} />
              <div className="flex justify-between mt-1 text-xs text-gray-600">
                <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
              </div>
            </div>

            <textarea ref={noteRef} value={techNote} onChange={e=>setTechNote(e.target.value)}
              placeholder="Notas técnicas, o que foi feito, pendências..."
              rows={4}
              className="w-full bg-gray-900 text-white text-sm rounded-xl border border-gray-700 p-3 resize-none focus:outline-none focus:border-blue-500 leading-relaxed"
            />
          </div>

        </div>

        {/* Botões fixos no rodapé — SEMPRE VISÍVEIS */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur border-t border-gray-800 p-4 space-y-3 max-w-lg mx-auto">
          {/* Botão principal de status */}
          {podeIniciar && (
            <button onClick={()=>mudarStatus('in_progress')}
              className="w-full h-14 rounded-2xl bg-blue-600 text-white font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-transform">
              <Icon.play />Iniciar execução
            </button>
          )}
          {podeConcluir && (
            <button onClick={()=>mudarStatus('completed')}
              className="w-full h-14 rounded-2xl bg-green-600 text-white font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-transform">
              <Icon.done />Marcar como concluída
            </button>
          )}
          {/* Salvar progresso + solicitar material */}
          <div className="flex gap-3">
            <button onClick={salvar} disabled={salvando}
              className={`flex-1 h-12 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
                savedOk ? 'bg-green-600 text-white' : 'bg-gray-700 text-white disabled:opacity-50'
              }`}>
              {savedOk ? '✓ Salvo' : salvando ? 'Salvando...' : 'Salvar progresso'}
            </button>
            <button onClick={()=>{ setModalSol(true); setSolOS(osAtiva.id) }}
              className="w-12 h-12 rounded-2xl bg-gray-700 text-white flex items-center justify-center active:scale-95">
              <Icon.cart />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── LISTA PRINCIPAL ─────────────────────────────────────────
  const tabs: { id:Tab; icon:()=>React.JSX.Element; label:string; badge?:number }[] = [
    { id:'os',      icon:Icon.wrench,   label:'OS',      badge: os.length },
    { id:'agenda',  icon:Icon.calendar, label:'Agenda',  badge: agenda.length },
    { id:'tarefas', icon:Icon.tasks,    label:'Tarefas', badge: tasks.length },
    { id:'compras', icon:Icon.cart,     label:'Compras' },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col max-w-lg mx-auto">

      {/* Header compacto */}
      <div className="px-4 pt-5 pb-2 bg-gray-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Icon.wrench />
          </div>
          <div>
            <p className="font-bold text-white text-lg leading-none">Giartech</p>
            <p className="text-xs text-gray-400">Portal do Técnico</p>
          </div>
          {loading && <div className="ml-auto w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
        </div>
      </div>

      {/* Tabs — ocupam a largura toda, touch targets grandes */}
      <div className="grid grid-cols-4 bg-gray-900 border-b border-gray-800 px-2 pb-2 gap-1">
        {tabs.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)}
            className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-colors relative ${
              tab===t.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}>
            <t.icon />
            <span className="text-xs font-medium">{t.label}</span>
            {t.badge && t.badge > 0 ? (
              <span className={`absolute top-1 right-2 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                tab===t.id ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'
              }`}>{t.badge > 9 ? '9+' : t.badge}</span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto pb-6">

        {/* ═══ ABA OS ═══ */}
        {tab==='os' && (
          <div className="p-3 space-y-2">
            {!loading && os.length===0 && (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4"><Icon.wrench /></div>
                <p className="text-gray-400 text-sm">Nenhuma OS atribuída</p>
              </div>
            )}
            {os.map(o => {
              const st = STATUS[o.status] || {label:o.status,dot:'#9ca3af',text:'#374151',bg:'#f9fafb'}
              const pr = PRIO[o.priority]
              const vence = o.due_date && new Date(o.due_date) < new Date(Date.now()+86400000*2)
              return (
                <button key={o.id} onClick={()=>abrirOS(o)}
                  className="w-full bg-gray-800 rounded-2xl p-4 text-left active:scale-98 transition-transform space-y-3">
                  {/* Status + prioridade */}
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{background:st.dot}} />
                    <span className="text-sm font-semibold">
                      <span className="px-2 py-0.5 rounded-full text-xs" style={{background:st.bg,color:st.text}}>{st.label}</span>
                    </span>
                    {pr && <span className="text-xs font-bold ml-1" style={{color:pr.color}}>{pr.label}</span>}
                    <span className="ml-auto font-mono text-xs text-gray-500">{o.order_number}</span>
                  </div>
                  {/* Nome do serviço */}
                  <p className="font-bold text-white text-base leading-tight">{o.title}</p>
                  {/* Cliente */}
                  <p className="text-gray-400 text-sm">{o.client_name}</p>
                  {/* Endereço + prazo */}
                  <div className="flex items-center justify-between">
                    {o.client_address
                      ? <span className="text-xs text-gray-500 flex items-center gap-1"><Icon.map />{o.client_city || o.client_address}</span>
                      : <span />}
                    {o.due_date && (
                      <span className={`text-xs font-semibold flex items-center gap-1 ${vence?'text-red-400':'text-gray-500'}`}>
                        <Icon.clock />{fmtData(o.due_date)}
                      </span>
                    )}
                  </div>
                  {/* Barra de progresso se já iniciada */}
                  {o.progress_percent > 0 && (
                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-blue-500 transition-all" style={{width:`${o.progress_percent}%`}} />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* ═══ ABA AGENDA ═══ */}
        {tab==='agenda' && (
          <div className="p-3 space-y-2">
            {!loading && agenda.length===0 && (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4"><Icon.calendar /></div>
                <p className="text-gray-400 text-sm">Nenhum evento nos próximos 30 dias</p>
              </div>
            )}
            {agenda.map(ev => (
              <div key={ev.id} className="bg-gray-800 rounded-2xl p-4 flex gap-4">
                {/* Data destaque */}
                <div className="text-center flex-shrink-0 w-14 bg-blue-600/20 rounded-xl p-2">
                  <p className="text-blue-400 text-xs font-bold uppercase">{new Date(ev.start_date).toLocaleDateString('pt-BR',{weekday:'short'})}</p>
                  <p className="text-white text-2xl font-black leading-none">{new Date(ev.start_date).getDate()}</p>
                  <p className="text-gray-400 text-xs">{fmtHora(ev.start_date)}</p>
                </div>
                <div className="flex-1 space-y-1">
                  <p className="font-bold text-white text-base leading-tight">{ev.title}</p>
                  {ev.client_name && <p className="text-sm text-gray-400">{ev.client_name}</p>}
                  {ev.location && (
                    <a href={`https://maps.google.com/?q=${encodeURIComponent(ev.location)}`}
                      target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 text-blue-400 text-xs">
                      <Icon.map />{ev.location}
                    </a>
                  )}
                  {ev.os_number && <span className="inline-block text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">OS {ev.os_number}</span>}
                  {ev.notes && <p className="text-xs text-gray-500">{ev.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══ ABA TAREFAS ═══ */}
        {tab==='tarefas' && (
          <div className="p-3 space-y-2">
            {!loading && tasks.length===0 && (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4"><Icon.tasks /></div>
                <p className="text-gray-400 text-sm">Nenhuma tarefa atribuída</p>
              </div>
            )}
            {tasks.map(t => {
              const pr = PRIO[t.priority] || {label:t.priority, color:'#9ca3af'}
              const vencida = t.due_date && new Date(t.due_date) < new Date()
              return (
                <div key={t.id}
                  className="bg-gray-800 rounded-2xl p-4 space-y-2"
                  style={{borderLeft:`4px solid ${t.color||'#3b82f6'}`}}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-white text-base leading-tight flex-1">{t.title}</p>
                    <span className="text-xs font-bold flex-shrink-0" style={{color:pr.color}}>{pr.label}</span>
                  </div>
                  {t.description && <p className="text-sm text-gray-400">{t.description}</p>}
                  <div className="flex flex-wrap gap-2">
                    {t.category && <span className="text-xs bg-blue-600/20 text-blue-300 px-2 py-0.5 rounded-full">{t.category}</span>}
                    {t.os_number && <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">OS {t.os_number}</span>}
                    {t.due_date && (
                      <span className={`text-xs flex items-center gap-1 font-semibold ${vencida?'text-red-400':'text-gray-500'}`}>
                        <Icon.clock />{fmtDia(t.due_date)}{vencida&&' (vencida)'}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ═══ ABA COMPRAS / INVENTÁRIO ═══ */}
        {tab==='compras' && (
          <div className="p-3 space-y-3">
            {/* Botão de solicitar — GRANDE e em destaque */}
            <button onClick={()=>setModalSol(true)}
              className="w-full h-16 rounded-2xl bg-blue-600 text-white font-bold text-base flex items-center justify-center gap-3 active:scale-95 transition-transform shadow-lg shadow-blue-600/30">
              <Icon.plus />
              Solicitar Materiais
            </button>

            {/* Campo de busca no inventário */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"><Icon.search /></span>
              <input value={busca} onChange={e=>setBusca(e.target.value)}
                placeholder="Buscar no inventário..."
                className="w-full h-12 pl-11 pr-4 bg-gray-800 text-white rounded-2xl border border-gray-700 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Lista do inventário */}
            <div className="bg-gray-800 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-700">
                <p className="text-sm font-semibold text-white">Ferramentas e materiais</p>
                <p className="text-xs text-gray-400">{inventFiltrado.length} itens</p>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="divide-y divide-gray-700">
                  {inventFiltrado.map(item => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${item.disponivel?'bg-green-400':'bg-red-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.category}{item.location?` · ${item.location}`:''}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-bold ${item.disponivel?'text-white':'text-red-400'}`}>
                          {item.quantity} {item.unit}
                        </p>
                        {!item.disponivel && <p className="text-xs text-red-500">Indisponível</p>}
                      </div>
                    </div>
                  ))}
                  {inventFiltrado.length===0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">Nenhum item encontrado</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ═══ MODAL DE SOLICITAÇÃO ═══ */}
      {modalSol && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end">
          <div className="bg-gray-900 w-full rounded-t-3xl max-h-[92vh] flex flex-col">
            {/* Handle de arrasto visual */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 bg-gray-700 rounded-full" />
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
              <div>
                <p className="font-bold text-white text-base">Solicitar Materiais</p>
                <p className="text-xs text-gray-400">Enviado para aprovação do gestor</p>
              </div>
              <button onClick={()=>setModalSol(false)} className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                <Icon.close />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

              {/* OS vinculada */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">Ordem de serviço</label>
                <select value={solOS} onChange={e=>setSolOS(e.target.value)}
                  className="w-full h-12 bg-gray-800 text-white rounded-xl border border-gray-700 px-4 text-sm focus:outline-none focus:border-blue-500">
                  <option value="">Sem OS vinculada</option>
                  {os.map(o=><option key={o.id} value={o.id}>{o.order_number} — {o.client_name}</option>)}
                </select>
              </div>

              {/* Urgência — botões grandes */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">Urgência</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    {v:'normal'  as const, l:'Normal',  c:'border-gray-600 text-gray-300', a:'bg-gray-600'},
                    {v:'alta'    as const, l:'Alta',    c:'border-orange-600 text-orange-300', a:'bg-orange-600'},
                    {v:'urgente' as const, l:'Urgente', c:'border-red-600 text-red-300', a:'bg-red-600'},
                  ] as const).map(opt=>(
                    <button key={opt.v} onClick={()=>setSolUrg(opt.v)}
                      className={`h-12 rounded-xl border-2 font-bold text-sm transition-colors active:scale-95 ${
                        solUrg===opt.v ? opt.a+' text-white border-transparent' : opt.c
                      }`}>
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Itens */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">Materiais solicitados</label>
                <div className="space-y-3">
                  {solItens.map((item,idx)=>(
                    <div key={idx} className="bg-gray-800 rounded-2xl p-4 space-y-3">
                      <div className="flex gap-2">
                        <input value={item.nome_item}
                          onChange={e=>setSolItens(p=>p.map((it,i)=>i===idx?{...it,nome_item:e.target.value}:it))}
                          placeholder="Nome do material..."
                          className="flex-1 h-11 bg-gray-900 text-white rounded-xl border border-gray-700 px-4 text-sm focus:outline-none focus:border-blue-500"
                        />
                        {solItens.length>1&&(
                          <button onClick={()=>setSolItens(p=>p.filter((_,i)=>i!==idx))}
                            className="w-11 h-11 bg-red-500/20 text-red-400 rounded-xl flex items-center justify-center">
                            <Icon.trash />
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input type="number" min={1} value={item.quantidade}
                          onChange={e=>setSolItens(p=>p.map((it,i)=>i===idx?{...it,quantidade:Number(e.target.value)}:it))}
                          className="w-20 h-11 bg-gray-900 text-white rounded-xl border border-gray-700 px-3 text-sm text-center focus:outline-none focus:border-blue-500"
                        />
                        <select value={item.unidade}
                          onChange={e=>setSolItens(p=>p.map((it,i)=>i===idx?{...it,unidade:e.target.value}:it))}
                          className="w-24 h-11 bg-gray-900 text-white rounded-xl border border-gray-700 px-2 text-sm focus:outline-none">
                          {['UN','MT','KG','CX','PC','RL','LT','M²'].map(u=><option key={u}>{u}</option>)}
                        </select>
                        <input value={item.observacao}
                          onChange={e=>setSolItens(p=>p.map((it,i)=>i===idx?{...it,observacao:e.target.value}:it))}
                          placeholder="Obs..."
                          className="flex-1 h-11 bg-gray-900 text-white rounded-xl border border-gray-700 px-3 text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  ))}
                  <button onClick={()=>setSolItens(p=>[...p,{nome_item:'',quantidade:1,unidade:'UN',observacao:''}])}
                    className="w-full h-12 rounded-2xl border-2 border-dashed border-gray-700 text-gray-500 text-sm font-medium hover:border-blue-500 hover:text-blue-400 transition-colors">
                    + Adicionar item
                  </button>
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">Observações</label>
                <textarea value={solObs} onChange={e=>setSolObs(e.target.value)}
                  placeholder="Para qual serviço, motivo da urgência..."
                  rows={3}
                  className="w-full bg-gray-800 text-white rounded-xl border border-gray-700 p-4 text-sm resize-none focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Botão de envio — fixo na base */}
            <div className="px-5 pb-8 pt-3 border-t border-gray-800">
              <button onClick={enviarSolicitacao} disabled={enviando||enviado}
                className={`w-full h-16 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  enviado ? 'bg-green-600 text-white' : 'bg-blue-600 text-white disabled:opacity-50'
                }`}>
                {enviado ? '✓ Solicitação enviada!' : enviando ? 'Enviando...' : <><Icon.plus />Enviar solicitação</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
