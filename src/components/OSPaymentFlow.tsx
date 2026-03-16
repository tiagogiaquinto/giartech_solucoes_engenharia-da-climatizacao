import React, { useState } from 'react'
import {
  Banknote, FileCheck, Receipt, ChevronRight, Loader2,
  CheckCircle, AlertCircle, X, CreditCard
} from 'lucide-react'
import { supabase } from '../lib/supabase'

interface OSPaymentFlowProps {
  orderId: string
  orderNumber: string
  totalValue: number
  sinalPago?: number
  paymentStatus?: string
  nfStatus?: string
  reciboEmitido?: boolean
  onUpdate: () => void
}

type Step = 'sinal' | 'recibo' | 'nf'

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

const PAYMENT_METHODS = [
  { value: 'pix', label: 'PIX' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao_debito', label: 'Cartão Débito' },
  { value: 'cartao_credito', label: 'Cartão Crédito' },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'boleto', label: 'Boleto' },
]

export const OSPaymentFlow: React.FC<OSPaymentFlowProps> = ({
  orderId,
  orderNumber,
  totalValue,
  sinalPago = 0,
  paymentStatus = 'pendente',
  nfStatus = 'nao_emitida',
  reciboEmitido = false,
  onUpdate,
}) => {
  const [activeStep, setActiveStep] = useState<Step | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Sinal form state
  const [sinalValor, setSinalValor] = useState(Math.round(totalValue * 0.3 * 100) / 100)
  const [sinalMetodo, setSinalMetodo] = useState('pix')
  const [sinalObs, setSinalObs] = useState('')

  // NF form state
  const [nfNumero, setNfNumero] = useState('')
  const [nfObs, setNfObs] = useState('')

  const saldo = totalValue - sinalPago
  const isTotallyPaid = paymentStatus === 'pago'

  const handleRegistrarSinal = async () => {
    if (sinalValor <= 0) return
    setLoading(true)
    setError(null)
    try {
      const { error: err } = await supabase.rpc('fn_registrar_sinal_os', {
        p_os_id: orderId,
        p_valor: sinalValor,
        p_metodo: sinalMetodo,
        p_observacao: sinalObs || null,
      })
      if (err) throw err
      setSuccess(`Sinal de ${fmt(sinalValor)} registrado com sucesso!`)
      setActiveStep(null)
      onUpdate()
    } catch (e: any) {
      setError(e.message || 'Erro ao registrar sinal')
    } finally {
      setLoading(false)
    }
  }

  const handleEmitirRecibo = async () => {
    setLoading(true)
    setError(null)
    try {
      const reciboNum = `REC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${orderId.slice(0, 6).toUpperCase()}`
      const amount = isTotallyPaid ? sinalPago : totalValue

      const { error: err } = await supabase
        .from('os_receipts')
        .insert({
          service_order_id: orderId,
          receipt_type: isTotallyPaid ? 'recibo_total' : sinalPago > 0 ? 'recibo_parcial' : 'recibo_sinal',
          receipt_number: reciboNum,
          amount,
          issued_by: 'sistema',
          notes: `Recibo ${isTotallyPaid ? 'total' : 'parcial'} - OS ${orderNumber}`,
        })
      if (err) throw err

      await supabase
        .from('service_orders')
        .update({ recibo_emitido: true, recibo_emitido_em: new Date().toISOString() })
        .eq('id', orderId)

      setSuccess(`Recibo ${reciboNum} gerado com sucesso!`)
      setActiveStep(null)
      onUpdate()
    } catch (e: any) {
      setError(e.message || 'Erro ao emitir recibo')
    } finally {
      setLoading(false)
    }
  }

  const handleEmitirNF = async () => {
    setLoading(true)
    setError(null)
    try {
      const { error: err } = await supabase
        .from('service_orders')
        .update({
          nf_status: 'emitida',
          nf_numero: nfNumero || `NF-${Date.now()}`,
        })
        .eq('id', orderId)
      if (err) throw err

      await supabase.from('os_receipts').insert({
        service_order_id: orderId,
        receipt_type: 'nf_simulada',
        receipt_number: nfNumero || `NF-${Date.now()}`,
        amount: totalValue,
        issued_by: 'sistema',
        notes: nfObs || `NF emitida - OS ${orderNumber}`,
      })

      setSuccess(`NF ${nfNumero || 'simulada'} registrada com sucesso!`)
      setActiveStep(null)
      onUpdate()
    } catch (e: any) {
      setError(e.message || 'Erro ao emitir NF')
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    {
      key: 'sinal' as Step,
      label: 'Cobrar Sinal',
      sublabel: sinalPago > 0 ? `Recebido: ${fmt(sinalPago)}` : `Sugestão: ${fmt(sinalValor)}`,
      icon: <Banknote className="h-5 w-5" />,
      done: sinalPago > 0,
      disabled: isTotallyPaid,
      color: 'blue',
    },
    {
      key: 'recibo' as Step,
      label: 'Emitir Recibo',
      sublabel: reciboEmitido ? 'Recibo emitido' : 'Quitação parcial ou total',
      icon: <Receipt className="h-5 w-5" />,
      done: reciboEmitido,
      disabled: false,
      color: 'amber',
    },
    {
      key: 'nf' as Step,
      label: 'Emitir Nota Fiscal',
      sublabel: nfStatus === 'emitida' ? 'NF emitida' : 'Simular emissão NF-e',
      icon: <FileCheck className="h-5 w-5" />,
      done: nfStatus === 'emitida',
      disabled: false,
      color: 'green',
    },
  ]

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    amber: 'bg-amber-500 hover:bg-amber-600',
    green: 'bg-green-600 hover:bg-green-700',
  }
  const colorBorderMap: Record<string, string> = {
    blue: 'border-blue-200 bg-blue-50',
    amber: 'border-amber-200 bg-amber-50',
    green: 'border-green-200 bg-green-50',
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow">
            <CreditCard className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">Esteira de Pagamento</p>
            <p className="text-xs text-gray-500">
              Total: {fmt(totalValue)} · Saldo: {fmt(saldo)}
            </p>
          </div>
        </div>
      </div>

      {/* Feedback messages */}
      {success && (
        <div className="mx-4 mt-3 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {success}
          <button onClick={() => setSuccess(null)} className="ml-auto">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      {error && (
        <div className="mx-4 mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Step buttons */}
      <div className="p-4 space-y-2">
        {steps.map((step, idx) => (
          <div key={step.key}>
            <button
              onClick={() => setActiveStep(activeStep === step.key ? null : step.key)}
              disabled={step.disabled}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                step.done
                  ? 'border-green-200 bg-green-50'
                  : step.disabled
                    ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                    : activeStep === step.key
                      ? colorBorderMap[step.color]
                      : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                step.done ? 'bg-green-100 text-green-600' : `${colorMap[step.color]} text-white`
              }`}>
                {step.done ? <CheckCircle className="h-4 w-4" /> : step.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-400">Passo {idx + 1}</span>
                  {step.done && (
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                      Concluído
                    </span>
                  )}
                </div>
                <p className="font-semibold text-gray-800 text-sm">{step.label}</p>
                <p className="text-xs text-gray-500 truncate">{step.sublabel}</p>
              </div>
              {!step.done && !step.disabled && (
                <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${
                  activeStep === step.key ? 'rotate-90' : ''
                }`} />
              )}
            </button>

            {/* Expanded panel for Sinal */}
            {activeStep === 'sinal' && step.key === 'sinal' && (
              <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
                <p className="text-sm font-semibold text-blue-800">Registrar Sinal</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-600 font-medium">Valor (R$)</label>
                    <input
                      type="number"
                      value={sinalValor}
                      onChange={e => setSinalValor(parseFloat(e.target.value) || 0)}
                      className="mt-1 w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 bg-white"
                      min="1"
                      max={saldo}
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 font-medium">Forma</label>
                    <select
                      value={sinalMetodo}
                      onChange={e => setSinalMetodo(e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 bg-white"
                    >
                      {PAYMENT_METHODS.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Observação (opcional)"
                  value={sinalObs}
                  onChange={e => setSinalObs(e.target.value)}
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white"
                />
                <button
                  onClick={handleRegistrarSinal}
                  disabled={loading || sinalValor <= 0}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
                  Confirmar Sinal de {fmt(sinalValor)}
                </button>
              </div>
            )}

            {/* Expanded panel for Recibo */}
            {activeStep === 'recibo' && step.key === 'recibo' && (
              <div className="mt-2 p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                <p className="text-sm font-semibold text-amber-800">Emitir Recibo de Quitação</p>
                <div className="bg-white border border-amber-200 rounded-lg p-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valor Total</span>
                    <span className="font-semibold">{fmt(totalValue)}</span>
                  </div>
                  {sinalPago > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sinal Recebido</span>
                      <span className="font-medium text-green-600">{fmt(sinalPago)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-1.5 font-bold">
                    <span>Tipo</span>
                    <span>{isTotallyPaid ? 'Quitação Total' : sinalPago > 0 ? 'Quitação Parcial' : 'Recibo de Sinal'}</span>
                  </div>
                </div>
                <button
                  onClick={handleEmitirRecibo}
                  disabled={loading}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
                  Gerar Recibo
                </button>
              </div>
            )}

            {/* Expanded panel for NF */}
            {activeStep === 'nf' && step.key === 'nf' && (
              <div className="mt-2 p-4 bg-green-50 border border-green-200 rounded-xl space-y-3">
                <p className="text-sm font-semibold text-green-800">Registrar Nota Fiscal</p>
                <div>
                  <label className="text-xs text-gray-600 font-medium">Número da NF (opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: 001234 (deixe vazio para simular)"
                    value={nfNumero}
                    onChange={e => setNfNumero(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-green-200 rounded-lg text-sm bg-white"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Observação (opcional)"
                  value={nfObs}
                  onChange={e => setNfObs(e.target.value)}
                  className="w-full px-3 py-2 border border-green-200 rounded-lg text-sm bg-white"
                />
                <div className="bg-white border border-green-200 rounded-lg p-3 text-xs text-gray-600 space-y-1">
                  <p className="font-semibold text-gray-700">Resumo Fiscal (Lucro Presumido)</p>
                  <div className="flex justify-between">
                    <span>Valor Serviços</span>
                    <span>{fmt(totalValue)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>ISS (5%)</span>
                    <span>- {fmt(totalValue * 0.05)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>PIS + COFINS (3.65%)</span>
                    <span>- {fmt(totalValue * 0.0365)}</span>
                  </div>
                </div>
                <button
                  onClick={handleEmitirNF}
                  disabled={loading}
                  className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck className="h-4 w-4" />}
                  Registrar NF
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
