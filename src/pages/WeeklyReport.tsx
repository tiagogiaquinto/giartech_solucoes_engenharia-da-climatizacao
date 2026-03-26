import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, Send, CheckCircle, AlertCircle, RefreshCw, Mail, MessageCircle, TrendingUp, BarChart2, ChevronDown, ChevronUp, Eye } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Schedule {
  id: string
  is_active: boolean
  day_of_week: number
  hour_of_day: number
  send_whatsapp: boolean
  send_email: boolean
  email_recipient: string | null
  custom_intro: string | null
}

interface HistoryItem {
  id: string
  week_start: string
  week_end: string
  total_oss: number
  faturamento: number
  lucro_liquido: number
  margem_pct: number
  taxa_conclusao: number
  var_faturamento: number
  sent_whatsapp: boolean
  sent_email: boolean
  whatsapp_status: string
  report_text: string | null
  sent_at: string | null
  created_at: string
}

interface WeeklyKPIs {
  total_oss: number
  concluidas: number
  faturamento: number
  custo_total: number
  lucro_liquido: number
  margem_pct: number
  taxa_conclusao: number
  ticket_medio: number
  faturamento_semana_anterior: number
  variacao_faturamento_pct: number
}

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export default function WeeklyReport() {
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [kpis, setKpis] = useState<WeeklyKPIs | null>(null)
  const [previewText, setPreviewText] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [form, setForm] = useState({
    is_active: true,
    day_of_week: 0,
    hour_of_day: 20,
    send_whatsapp: true,
    send_email: false,
    email_recipient: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [{ data: sched }, { data: hist }, { data: kpisData }] = await Promise.all([
      supabase.from('weekly_report_schedules').select('*').eq('is_active', true).maybeSingle(),
      supabase.from('weekly_report_history').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('v_weekly_performance_summary').select('*').maybeSingle(),
    ])
    if (sched) {
      setSchedule(sched)
      setForm({
        is_active: sched.is_active,
        day_of_week: sched.day_of_week,
        hour_of_day: sched.hour_of_day,
        send_whatsapp: sched.send_whatsapp,
        send_email: sched.send_email,
        email_recipient: sched.email_recipient ?? '',
      })
    }
    setHistory(hist ?? [])
    if (kpisData) setKpis(kpisData as WeeklyKPIs)
    setLoading(false)
  }

  async function handlePreview() {
    setPreviewLoading(true)
    setPreviewText(null)
    const { data } = await supabase.rpc('generate_weekly_report_text')
    setPreviewText(data as string)
    setPreviewLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    if (schedule?.id) {
      await supabase.from('weekly_report_schedules').update({
        is_active: form.is_active,
        day_of_week: form.day_of_week,
        hour_of_day: form.hour_of_day,
        send_whatsapp: form.send_whatsapp,
        send_email: form.send_email,
        email_recipient: form.email_recipient || null,
        updated_at: new Date().toISOString(),
      }).eq('id', schedule.id)
    } else {
      await supabase.from('weekly_report_schedules').insert({
        is_active: form.is_active,
        day_of_week: form.day_of_week,
        hour_of_day: form.hour_of_day,
        send_whatsapp: form.send_whatsapp,
        send_email: form.send_email,
        email_recipient: form.email_recipient || null,
      })
    }
    setSaving(false)
    setSuccessMsg('Configuração salva!')
    setTimeout(() => setSuccessMsg(''), 3000)
    loadData()
  }

  async function handleSendNow() {
    setSending(true)
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      const res = await fetch(`${supabaseUrl}/functions/v1/weekly-report`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${anonKey}`, 'Content-Type': 'application/json' },
      })
      const json = await res.json()
      if (json.success) {
        setSuccessMsg('Relatório gerado e enfileirado com sucesso!')
        loadData()
      } else {
        setSuccessMsg(`Erro: ${json.error}`)
      }
    } catch (e: unknown) {
      setSuccessMsg('Erro ao disparar relatório.')
    }
    setSending(false)
    setTimeout(() => setSuccessMsg(''), 5000)
  }

  function formatCurrency(v: number) {
    return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  function formatDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatório Semanal Automático</h1>
          <p className="text-sm text-gray-500 mt-1">Configure o envio automático do resumo de desempenho toda semana</p>
        </div>
        <button
          onClick={handleSendNow}
          disabled={sending}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {sending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Gerar e Enviar Agora
        </button>
      </div>

      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-sm"
        >
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          {successMsg}
        </motion.div>
      )}

      {/* KPIs da semana atual */}
      {kpis && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            Semana Atual — Prévia dos Dados
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Faturamento', value: formatCurrency(kpis.faturamento), sub: `${kpis.variacao_faturamento_pct >= 0 ? '+' : ''}${Number(kpis.variacao_faturamento_pct).toFixed(1)}% vs semana anterior`, color: 'blue' },
              { label: 'Lucro Líquido', value: formatCurrency(kpis.lucro_liquido), sub: `Margem: ${Number(kpis.margem_pct).toFixed(1)}%`, color: 'emerald' },
              { label: 'Total OS', value: String(kpis.total_oss), sub: `${kpis.concluidas} concluídas`, color: 'teal' },
              { label: 'Taxa Conclusão', value: `${Number(kpis.taxa_conclusao).toFixed(0)}%`, sub: `Ticket médio: ${formatCurrency(kpis.ticket_medio)}`, color: 'amber' },
            ].map(item => (
              <div key={item.label} className={`bg-${item.color}-50 rounded-xl p-4`}>
                <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                <p className={`text-xl font-bold text-${item.color}-700`}>{item.value}</p>
                <p className="text-xs text-gray-400 mt-1">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configurações */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-base font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            Agendamento
          </h2>

          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                className={`w-11 h-6 rounded-full transition-colors relative ${form.is_active ? 'bg-blue-500' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
              <span className="text-sm font-medium text-gray-700">Envio automático ativo</span>
            </label>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Dia da semana</label>
              <select
                value={form.day_of_week}
                onChange={e => setForm(f => ({ ...f, day_of_week: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Horário (Brasília)</label>
              <select
                value={form.hour_of_day}
                onChange={e => setForm(f => ({ ...f, hour_of_day: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                ))}
              </select>
            </div>

            <div className="border-t pt-4 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.send_whatsapp}
                  onChange={e => setForm(f => ({ ...f, send_whatsapp: e.target.checked }))}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-700">Enviar no WhatsApp (grupo configurado)</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.send_email}
                  onChange={e => setForm(f => ({ ...f, send_email: e.target.checked }))}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-gray-700">Enviar por e-mail</span>
                </div>
              </label>

              {form.send_email && (
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={form.email_recipient}
                  onChange={e => setForm(f => ({ ...f, email_recipient: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 ml-7"
                />
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar Configuração'}
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Eye className="h-4 w-4 text-gray-500" />
              Prévia do Relatório
            </h2>
            <button
              onClick={handlePreview}
              disabled={previewLoading}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium"
            >
              {previewLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              Gerar prévia
            </button>
          </div>

          {previewText ? (
            <pre className="text-xs leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-lg p-4 border border-gray-100 max-h-80 overflow-y-auto font-mono text-gray-700">
              {previewText}
            </pre>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-sm gap-2">
              <BarChart2 className="h-8 w-8 text-gray-200" />
              <span>Clique em "Gerar prévia" para ver o relatório desta semana</span>
            </div>
          )}
        </div>
      </div>

      {/* Histórico */}
      {history.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            Histórico de Relatórios
          </h2>
          <div className="space-y-2">
            {history.map(item => (
              <div key={item.id} className="border border-gray-100 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedRow(expandedRow === item.id ? null : item.id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-800">
                      {formatDate(item.week_start)} — {formatDate(item.week_end)}
                    </span>
                    <span className="text-sm text-gray-500">{formatCurrency(item.faturamento)}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${Number(item.margem_pct) >= 30 ? 'bg-emerald-100 text-emerald-700' : Number(item.margem_pct) >= 10 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {Number(item.margem_pct).toFixed(1)}% margem
                    </span>
                    {item.sent_whatsapp
                      ? <CheckCircle className="h-3.5 w-3.5 text-green-500" title="WhatsApp enviado" />
                      : item.whatsapp_status === 'queued'
                        ? <MessageCircle className="h-3.5 w-3.5 text-orange-400" title="WhatsApp pendente" />
                        : null
                    }
                  </div>
                  {expandedRow === item.id ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </button>
                {expandedRow === item.id && item.report_text && (
                  <div className="px-4 pb-4">
                    <pre className="text-xs leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-lg p-4 border border-gray-100 font-mono text-gray-600">
                      {item.report_text}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
