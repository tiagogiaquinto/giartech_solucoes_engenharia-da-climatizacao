import { useState, useEffect } from 'react'
import { Settings, Save, RefreshCw, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { type FiscalConfig, type RegimeTributario, DEFAULT_FISCAL_CONFIG, REGIME_LABELS, invalidateFiscalConfigCache } from '../utils/fiscalEngine'

interface FiscalConfigPanelProps {
  readOnly?: boolean
}

const FIELDS: Array<{
  key: keyof FiscalConfig
  label: string
  hint: string
  min: number
  max: number
  step: number
}> = [
  { key: 'iss_pct',         label: 'ISS (%)',              hint: 'Imposto Sobre Serviços — varia por município',          min: 2,   max: 5,   step: 0.1 },
  { key: 'pis_pct',         label: 'PIS (%)',              hint: 'Programa de Integração Social',                         min: 0,   max: 5,   step: 0.01 },
  { key: 'cofins_pct',      label: 'COFINS (%)',           hint: 'Contribuição para o Financiamento da Seguridade Social', min: 0,   max: 10,  step: 0.01 },
  { key: 'irpj_pct',        label: 'IRPJ — Resultado (%)', hint: 'Imposto de Renda Pessoa Jurídica sobre resultado presumido', min: 0, max: 15, step: 0.01 },
  { key: 'csll_pct',        label: 'CSLL — Resultado (%)', hint: 'Contribuição Social sobre Lucro Líquido presumida',     min: 0,   max: 10,  step: 0.01 },
  { key: 'encargos_clt_pct',label: 'Encargos CLT (%)',     hint: 'INSS + FGTS + benefícios sobre o salário bruto',        min: 0,   max: 120, step: 1 },
  { key: 'margem_alerta_pct',label: 'Margem de Alerta (%)', hint: 'Margem abaixo desta % dispara alerta vermelho',        min: 5,   max: 50,  step: 1 },
  { key: 'margem_boa_pct',   label: 'Margem Saudável (%)',  hint: 'Margem acima desta % exibe indicador verde',           min: 10,  max: 80,  step: 1 },
]

export function FiscalConfigPanel({ readOnly = false }: FiscalConfigPanelProps) {
  const [config, setConfig] = useState<FiscalConfig>(DEFAULT_FISCAL_CONFIG)
  const [configId, setConfigId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('fiscal_config')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (data) {
      setConfigId(data.id)
      setConfig({
        regime_tributario: data.regime_tributario as RegimeTributario,
        iss_pct: Number(data.iss_pct),
        pis_pct: Number(data.pis_pct),
        cofins_pct: Number(data.cofins_pct),
        irpj_pct: Number(data.irpj_pct),
        csll_pct: Number(data.csll_pct),
        encargos_clt_pct: Number(data.encargos_clt_pct),
        margem_alerta_pct: Number(data.margem_alerta_pct),
        margem_boa_pct: Number(data.margem_boa_pct),
      })
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const payload = { ...config, updated_at: new Date().toISOString() }
    let error

    if (configId) {
      ;({ error } = await supabase.from('fiscal_config').update(payload).eq('id', configId))
    } else {
      const res = await supabase.from('fiscal_config').insert(payload).select('id').single()
      error = res.error
      if (res.data) setConfigId(res.data.id)
    }

    setSaving(false)
    if (!error) {
      invalidateFiscalConfigCache()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const taxTotal = config.iss_pct + config.pis_pct + config.cofins_pct + config.irpj_pct + config.csll_pct

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <Settings className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900">Configuração Fiscal</p>
            <p className="text-xs text-gray-500">
              {REGIME_LABELS[config.regime_tributario]} · Carga tributária total: {taxTotal.toFixed(2)}%
            </p>
          </div>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>

      {open && (
        <div className="border-t border-gray-200 px-5 pb-5 pt-4 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {!readOnly && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex gap-2 text-sm text-amber-800">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Alterações afetam o cálculo de margem de <strong>todas as OS</strong>. Consulte seu contador antes de modificar.</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                  Regime Tributário
                </label>
                <select
                  value={config.regime_tributario}
                  onChange={e => setConfig(c => ({ ...c, regime_tributario: e.target.value as RegimeTributario }))}
                  disabled={readOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                >
                  {(Object.keys(REGIME_LABELS) as RegimeTributario[]).map(r => (
                    <option key={r} value={r}>{REGIME_LABELS[r]}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {FIELDS.map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{f.label}</label>
                    <div className="relative">
                      <input
                        type="number"
                        min={f.min}
                        max={f.max}
                        step={f.step}
                        value={config[f.key] as number}
                        onChange={e => setConfig(c => ({ ...c, [f.key]: parseFloat(e.target.value) || 0 }))}
                        disabled={readOnly}
                        className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{f.hint}</p>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 rounded-lg px-4 py-3 grid grid-cols-3 gap-3 text-center text-sm">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Total de Impostos</p>
                  <p className="font-bold text-red-600">{taxTotal.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Alerta de Margem</p>
                  <p className="font-bold text-amber-600">&lt;{config.margem_alerta_pct}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Margem Saudável</p>
                  <p className="font-bold text-emerald-600">&ge;{config.margem_boa_pct}%</p>
                </div>
              </div>

              {!readOnly && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    saved
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300'
                  }`}
                >
                  {saving ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saved ? 'Configuração salva!' : saving ? 'Salvando...' : 'Salvar Configuração Fiscal'}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
