import { useRef, useState, useEffect } from 'react'
import { X, Printer, Loader2, CheckCircle } from 'lucide-react'
import OSPrintDocument, { OSPrintData } from './OSPrintDocument'
import { supabase } from '../lib/supabase'

interface OSPrintPreviewModalProps {
  orderId: string
  onClose: () => void
}

export default function OSPrintPreviewModal({ orderId, onClose }: OSPrintPreviewModalProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<OSPrintData | null>(null)
  const [loading, setLoading] = useState(true)
  const [printing, setPrinting] = useState(false)

  useEffect(() => {
    loadData()
  }, [orderId])

  const loadData = async () => {
    try {
      setLoading(true)

      const [
        { data: order },
        { data: settings },
      ] = await Promise.all([
        supabase
          .from('service_orders')
          .select(`
            *,
            service_order_items(*, service_catalog:service_catalog_id(name, unit)),
            service_order_materials(*, inventory_items(name, unit)),
            service_order_labor(*, employees(name, cargo))
          `)
          .eq('id', orderId)
          .maybeSingle(),
        supabase.from('company_settings').select('*').maybeSingle(),
      ])

      if (!order) return

      const customerId = order.customer_id || order.client_id
      const { data: customer } = customerId
        ? await supabase
            .from('customers')
            .select('*, customer_addresses(*)')
            .eq('id', customerId)
            .maybeSingle()
        : { data: null }

      const { data: addresses } = await supabase
        .from('service_order_addresses')
        .select('*')
        .eq('service_order_id', orderId)
        .order('is_primary', { ascending: false })

      const addr = customer?.customer_addresses?.[0]
      const primaryAddr = addresses?.[0]

      const addressLine = primaryAddr
        ? [primaryAddr.street || primaryAddr.logradouro, primaryAddr.number, primaryAddr.neighborhood || primaryAddr.bairro].filter(Boolean).join(', ')
        : [addr?.logradouro, addr?.numero, addr?.bairro].filter(Boolean).join(', ')

      const cityState = primaryAddr
        ? [primaryAddr.city || primaryAddr.cidade, primaryAddr.state || primaryAddr.estado].filter(Boolean).join(' — ')
        : [addr?.cidade, addr?.estado].filter(Boolean).join(' — ')

      const items = (order.service_order_items || []).map((i: any) => {
        const qty = Number(i.quantity || i.quantidade || 1)
        const price = Number(i.unit_price || i.preco_unitario || 0)
        return {
          name: i.service_catalog?.name || i.name || i.descricao || '—',
          description: i.escopo_detalhado || i.escopo || '',
          quantity: qty,
          unit: i.service_catalog?.unit || i.unit || 'un',
          unit_price: price,
          total: Number(i.total_price || i.preco_total || qty * price),
        }
      })

      const materials = (order.service_order_materials || []).map((m: any) => ({
        name: m.inventory_items?.name || m.name || '—',
        quantity: Number(m.quantity || 0),
        unit: m.inventory_items?.unit || 'un',
        unit_cost: Number(m.unit_cost || m.preco_unitario || 0),
        total_cost: Number(m.total_cost || m.valor_total || 0),
      }))

      const team = (order.service_order_labor || []).map((l: any) => ({
        name: l.employees?.name || l.name || '—',
        role: l.employees?.cargo || l.role || '',
      }))

      const discount = Number(order.discount_amount || order.desconto_valor || 0)
      const itemsTotal = items.reduce((s: number, i: any) => s + i.total, 0)
      const storedTotal = Number(order.total_value || order.final_total || order.net_value || 0)
      const finalTotal = itemsTotal > 0 ? itemsTotal - discount : storedTotal

      const printData: OSPrintData = {
        order_number: order.order_number || 'N/A',
        status: order.status,
        created_at: order.created_at,
        scheduled_date: order.service_date || order.scheduled_date || order.due_date,
        execution_deadline: order.execution_deadline,
        priority: order.priority || 'Normal',
        description: order.description || '',
        instructions: order.instructions || '',
        report: order.report || order.relatorio_tecnico || '',
        customer_name: order.client_name || customer?.nome_razao || customer?.name || 'Cliente',
        customer_phone: order.client_phone || customer?.telefone || customer?.phone || '',
        customer_email: order.client_email || customer?.email || '',
        customer_cpf_cnpj: order.client_cnpj || order.client_cpf || customer?.cnpj_cpf || '',
        address: addressLine,
        city: cityState,
        items,
        materials,
        team,
        labor_value: Number(order.labor_value || order.valor_mao_de_obra || 0) || undefined,
        materials_value: Number(order.materials_value || order.valor_materiais || 0) || undefined,
        discount: discount > 0 ? discount : undefined,
        total_value: finalTotal,
        net_value: finalTotal,
        payment_method: order.payment_method || order.forma_pagamento || '',
        payment_installments: Number(order.payment_installments || 1),
        payment_conditions: order.payment_conditions || order.condicoes_pagamento || '',
        pix_key: order.pix_key || order.payment_pix || settings?.pix_key || '',
        company: settings ? {
          name: settings.company_name,
          cnpj: settings.cnpj,
          address: settings.address,
          city: settings.city,
          state: settings.state,
          zip: settings.zip_code,
          phone: settings.phone,
          email: settings.email,
          website: settings.website,
          logo_url: settings.logo_url,
        } : undefined,
      }

      setData(printData)
    } catch (err) {
      console.error('Erro ao carregar dados para impressão:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    if (!printRef.current) return
    setPrinting(true)

    const docHTML = printRef.current.innerHTML
    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:none;'
    document.body.appendChild(iframe)

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (!iframeDoc) { setPrinting(false); return }

    iframeDoc.open()
    iframeDoc.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: white; }
        @media print {
          @page { margin: 0; size: A4 portrait; }
          body { margin: 0; }
        }
      </style>
    </head><body>${docHTML}</body></html>`)
    iframeDoc.close()

    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
        setTimeout(() => {
          document.body.removeChild(iframe)
          setPrinting(false)
        }, 500)
      }, 200)
    }
  }

  return (
    <>
      {/* Modal visível na tela — oculto na impressão */}
      <div className="fixed inset-0 z-50 flex items-start justify-center no-print" style={{ background: 'rgba(0,0,0,0.6)', overflowY: 'auto', padding: '24px 16px' }}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl">

          {/* Header do modal */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Printer className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Pré-visualização para Impressão</h2>
                {data && <p className="text-sm text-gray-500">OS #{data.order_number} — {data.customer_name}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                disabled={loading || printing}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {printing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Printer className="h-4 w-4" />
                )}
                {printing ? 'Abrindo impressora...' : 'Imprimir / Salvar PDF'}
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Dica */}
          <div className="mx-6 mt-4 flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
            <CheckCircle className="h-4 w-4 text-blue-500 shrink-0" />
            Para salvar como PDF, selecione "Salvar como PDF" na janela da impressora. Menus e botões do sistema serão ocultados automaticamente.
          </div>

          {/* Conteúdo do documento */}
          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-sm">Carregando dados da OS...</span>
              </div>
            ) : data ? (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', background: '#f8fafc', padding: '4px' }}>
                <div style={{ background: 'white', borderRadius: '6px', padding: '2px' }}>
                  <OSPrintDocument ref={printRef} data={data} />
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400">
                <p>Não foi possível carregar os dados da OS.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo que aparece APENAS na impressão */}
      {data && (
        <div className="print-only" style={{ display: 'none' }}>
          <OSPrintDocument data={data} />
        </div>
      )}
    </>
  )
}
