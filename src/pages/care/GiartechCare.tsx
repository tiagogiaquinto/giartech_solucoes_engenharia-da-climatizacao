import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import {
  Shield, CheckCircle, Calendar, User, Wrench,
  AlertTriangle, Loader2, MessageCircle, Phone,
  MapPin, Info, Clock
} from 'lucide-react'

interface AssetData {
  found: boolean
  asset_id?: string
  asset_name?: string
  model?: string
  brand?: string
  serial_number?: string
  location?: string
  last_maintenance?: string
  last_service_date?: string
  last_technician?: string
  next_maintenance?: string
  pmoc_active?: boolean
  asset_health?: string
  customer_name?: string
  qr_code_token?: string
}

const WHATSAPP_NUMBER = '5511555525600'
const COMPANY_NAME = 'Giartech Soluções'

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return 'Não registrado'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function daysSince(dateStr?: string | null): number | null {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  return Math.floor((Date.now() - d.getTime()) / 86400000)
}

function healthColor(health?: string) {
  if (health === 'critical') return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-800' }
  if (health === 'warning') return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800' }
  return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800' }
}

function healthLabel(health?: string) {
  if (health === 'critical') return 'Atenção necessária'
  if (health === 'warning') return 'Verificação recomendada'
  return 'Protegido e em dia'
}

export default function GiartechCare() {
  const { qr_code_id } = useParams<{ qr_code_id: string }>()
  const [asset, setAsset] = useState<AssetData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!qr_code_id) { setLoading(false); return }
      const { data } = await supabase.rpc('get_care_asset_by_token', { p_token: qr_code_id })
      setAsset(data as AssetData || { found: false })
      setLoading(false)
    }
    load()
  }, [qr_code_id])

  function openWhatsApp() {
    const msg = encodeURIComponent(
      `Olá! Preciso de suporte para o equipamento *${asset?.asset_name || 'sem nome'}*`
      + (asset?.model ? ` (${asset.model})` : '')
      + (asset?.location ? ` — Local: ${asset.location}` : '')
      + `\nID: ${qr_code_id}`
    )
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 text-white animate-spin mx-auto" />
          <p className="text-slate-300 text-sm">Carregando informações do equipamento...</p>
        </div>
      </div>
    )
  }

  if (!asset || !asset.found) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="h-10 w-10 text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Equipamento não encontrado</h1>
            <p className="text-slate-400 text-sm mt-2">
              Este QR Code não corresponde a nenhum equipamento registrado.
              Entre em contato com a Giartech.
            </p>
          </div>
          <button
            onClick={openWhatsApp}
            className="w-full flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white font-semibold py-3.5 px-6 rounded-2xl transition-colors shadow-lg"
          >
            <MessageCircle className="h-5 w-5" />
            Falar com a Giartech
          </button>
        </div>
      </div>
    )
  }

  const colors = healthColor(asset.asset_health)
  const daysSinceMaint = daysSince(asset.last_maintenance || asset.last_service_date)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">

      {/* Header */}
      <div className="px-5 pt-10 pb-6 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-5 border border-white/20">
          <Shield className="h-3.5 w-3.5" />
          {COMPANY_NAME}
        </div>
        <h1 className="text-2xl font-bold text-white leading-tight">Giartech Care</h1>
        <p className="text-slate-400 text-sm mt-1">Informações do Equipamento</p>
      </div>

      {/* Card principal */}
      <div className="flex-1 px-4 pb-32 space-y-4 max-w-lg mx-auto w-full">

        {/* Selo de status */}
        <div className={`rounded-2xl border-2 p-5 ${colors.bg} ${colors.border}`}>
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
              asset.asset_health === 'good' || !asset.asset_health ? 'bg-emerald-500' :
              asset.asset_health === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
            }`}>
              <Shield className="h-7 w-7 text-white" />
            </div>
            <div className="min-w-0">
              <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full mb-2 ${colors.badge}`}>
                <CheckCircle className="h-3.5 w-3.5" />
                {healthLabel(asset.asset_health)}
              </div>
              <h2 className={`text-lg font-bold ${colors.text} truncate`}>{asset.asset_name}</h2>
              {asset.model && (
                <p className={`text-sm ${colors.text} opacity-80`}>{asset.brand ? `${asset.brand} · ` : ''}{asset.model}</p>
              )}
            </div>
          </div>
        </div>

        {/* Informações do cliente */}
        {asset.customer_name && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Info className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Propriedade de</p>
                <p className="text-white font-semibold text-sm">{asset.customer_name}</p>
              </div>
            </div>
          </div>
        )}

        {/* Localização */}
        {asset.location && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-500/30 rounded-xl flex items-center justify-center">
                <MapPin className="h-4 w-4 text-slate-300" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Localização</p>
                <p className="text-white font-semibold text-sm">{asset.location}</p>
              </div>
            </div>
          </div>
        )}

        {/* Última higienização / manutenção */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Histórico de Manutenção</h3>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
              <Calendar className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Última manutenção</p>
              <p className="text-white font-semibold text-sm">
                {formatDate(asset.last_maintenance || asset.last_service_date)}
              </p>
              {daysSinceMaint !== null && (
                <p className={`text-xs mt-0.5 font-medium ${
                  daysSinceMaint > 180 ? 'text-red-400' :
                  daysSinceMaint > 90 ? 'text-yellow-400' : 'text-emerald-400'
                }`}>
                  há {daysSinceMaint} dias
                </p>
              )}
            </div>
          </div>

          {asset.last_technician && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Técnico responsável</p>
                <p className="text-white font-semibold text-sm">{asset.last_technician}</p>
              </div>
            </div>
          )}

          {asset.next_maintenance && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-orange-500/20 rounded-xl flex items-center justify-center shrink-0">
                <Clock className="h-4 w-4 text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Próxima manutenção prevista</p>
                <p className="text-white font-semibold text-sm">{formatDate(asset.next_maintenance)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Número de série */}
        {asset.serial_number && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-500/30 rounded-xl flex items-center justify-center">
                <Wrench className="h-4 w-4 text-slate-300" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Número de série</p>
                <p className="text-white font-mono text-sm font-semibold">{asset.serial_number}</p>
              </div>
            </div>
          </div>
        )}

        {/* PMOC ativo */}
        {asset.pmoc_active && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-emerald-300 font-semibold text-sm">PMOC Ativo</p>
                <p className="text-emerald-400/80 text-xs mt-0.5">
                  Este equipamento possui Plano de Manutenção Preventiva ativo.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Rodapé informativo */}
        <div className="text-center pt-2 pb-2">
          <p className="text-slate-500 text-xs">
            Equipamento registrado e monitorado por<br />
            <span className="text-slate-400 font-semibold">{COMPANY_NAME}</span>
          </p>
        </div>
      </div>

      {/* Botão flutuante de emergência */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent">
        <div className="max-w-lg mx-auto">
          <button
            onClick={openWhatsApp}
            className="w-full flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 active:scale-95 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-2xl shadow-green-900/50 text-base"
          >
            <MessageCircle className="h-6 w-6" />
            Solicitar Reparo Agora
          </button>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Phone className="h-3 w-3 text-slate-500" />
            <p className="text-slate-500 text-xs text-center">Atendimento via WhatsApp · Resposta imediata</p>
          </div>
        </div>
      </div>

    </div>
  )
}
