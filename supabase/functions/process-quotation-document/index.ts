import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

interface ExtractedItem {
  description: string
  quantity: number
  unit: string
  unit_cost: number
  quote_date?: string
}

interface ExtractionResult {
  supplier: string
  quote_date: string
  items: ExtractedItem[]
  raw_text: string
  confidence: number
}

async function extractWithOpenAI(text: string, apiKey: string): Promise<ExtractionResult> {
  const prompt = `Você é um especialista em leitura de cotações de fornecedores brasileiros.
Analise o texto abaixo e extraia as informações estruturadas.

TEXTO DA COTAÇÃO:
${text}

Retorne um JSON válido com esta estrutura exata:
{
  "supplier": "nome do fornecedor",
  "quote_date": "YYYY-MM-DD ou null",
  "confidence": 0.0 a 1.0,
  "items": [
    {
      "description": "descrição do item",
      "quantity": número,
      "unit": "unidade (un, kg, m, L, etc)",
      "unit_cost": valor numérico sem símbolo,
      "quote_date": "YYYY-MM-DD ou null"
    }
  ]
}

Regras:
- Extraia TODOS os itens com preços encontrados
- Converta valores com vírgula para ponto (1.250,00 -> 1250.00)
- Se não encontrar data, use null
- Se não identificar fornecedor, use "Fornecedor não identificado"
- confidence: 1.0 = texto claro, 0.5 = parcialmente legível, 0.1 = muito difícil de ler`

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Você extrai dados de cotações de fornecedores. Retorne apenas JSON válido." },
        { role: "user", content: prompt }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    })
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content
  return JSON.parse(content)
}

async function matchInventoryItems(supabase: any, items: ExtractedItem[]) {
  const matched = []

  for (const item of items) {
    const searchTerm = item.description.toLowerCase().split(' ').slice(0, 3).join(' & ')

    const { data: inventoryMatches } = await supabase
      .from('inventory_items')
      .select('id, name, average_cost, last_purchase_price, unit')
      .textSearch('name', searchTerm)
      .limit(3)

    let bestMatch = null
    let matchConfidence = 0

    if (inventoryMatches && inventoryMatches.length > 0) {
      const descWords = item.description.toLowerCase().split(' ')
      for (const inv of inventoryMatches) {
        const invWords = inv.name.toLowerCase().split(' ')
        const commonWords = descWords.filter(w => w.length > 3 && invWords.includes(w))
        const conf = commonWords.length / Math.max(descWords.length, invWords.length)
        if (conf > matchConfidence) {
          matchConfidence = conf
          bestMatch = inv
        }
      }
    }

    matched.push({
      ...item,
      matched_inventory_id: bestMatch ? bestMatch.id : null,
      match_confidence: matchConfidence,
      match_status: bestMatch ? (matchConfidence > 0.5 ? 'matched' : 'unmatched') : 'new_item',
      current_avg_cost: bestMatch ? (bestMatch.average_cost || 0) : 0,
      price_change_pct: bestMatch && bestMatch.average_cost > 0
        ? ((item.unit_cost - bestMatch.average_cost) / bestMatch.average_cost) * 100
        : 0
    })
  }

  return matched
}

async function generateMarginAlerts(supabase: any, proposals: any[], marginThreshold: number) {
  for (const proposal of proposals) {
    if (!proposal.inventory_item_id || proposal.cost_change_pct <= 0) continue

    const { data: serviceItems } = await supabase
      .from('service_order_items')
      .select(`
        id,
        service_catalog_id,
        service_catalogs!inner(id, name, price, cost)
      `)
      .limit(50)

    const affectedServices: any[] = []
    const marginImpacts: any[] = []

    if (serviceItems) {
      for (const si of serviceItems) {
        const svc = (si as any).service_catalogs
        if (!svc) continue
        const currentCost = svc.cost || 0
        const newCost = currentCost * (1 + proposal.cost_change_pct / 100)
        const currentMargin = svc.price > 0 ? ((svc.price - currentCost) / svc.price) * 100 : 0
        const newMargin = svc.price > 0 ? ((svc.price - newCost) / svc.price) * 100 : 0

        if (newMargin < marginThreshold) {
          affectedServices.push({ id: svc.id, name: svc.name })
          marginImpacts.push({
            service_id: svc.id,
            service_name: svc.name,
            current_margin: currentMargin,
            new_margin: newMargin,
            suggested_price: newCost / (1 - marginThreshold / 100)
          })
        }
      }
    }

    if (affectedServices.length > 0) {
      const severity = marginImpacts.some(m => m.new_margin < 0) ? 'critical' : 'warning'
      const serviceNames = affectedServices.slice(0, 3).map(s => s.name).join(', ')

      await supabase.from('margin_alerts').insert({
        alert_type: 'margin_warning',
        severity,
        title: `Custo de "${proposal.item_name}" subiu ${proposal.cost_change_pct.toFixed(1)}%`,
        description: `O aumento de custo afeta a margem dos serviços: ${serviceNames}. Considere reajustar os preços de venda.`,
        material_id: proposal.inventory_item_id,
        material_name: proposal.item_name,
        service_name: serviceNames,
        current_margin_pct: marginImpacts[0]?.current_margin || 0,
        threshold_pct: marginThreshold,
        suggested_price: marginImpacts[0]?.suggested_price || 0,
        price_update_proposal_id: proposal.id
      })
    }
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const body = await req.json()
    const {
      extraction_id,
      file_content_base64,
      file_name,
      file_type,
      service_order_id,
      margin_threshold = 20
    } = body

    if (!extraction_id && !file_content_base64) {
      return new Response(
        JSON.stringify({ error: 'extraction_id ou file_content_base64 é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const { data: aiSettings } = await supabase
      .from('ai_providers')
      .select('api_key, provider_name')
      .eq('is_active', true)
      .in('provider_name', ['openai', 'OpenAI'])
      .limit(1)
      .maybeSingle()

    let extractionRecord: any

    if (extraction_id) {
      const { data } = await supabase
        .from('quotation_extractions')
        .select('*')
        .eq('id', extraction_id)
        .maybeSingle()
      extractionRecord = data
    } else {
      const { data, error } = await supabase
        .from('quotation_extractions')
        .insert({
          service_order_id,
          file_name: file_name || 'cotacao.pdf',
          extraction_status: 'processing'
        })
        .select()
        .single()
      if (error) throw error
      extractionRecord = data
    }

    await supabase
      .from('quotation_extractions')
      .update({ extraction_status: 'processing' })
      .eq('id', extractionRecord.id)

    let rawText = ''
    if (file_content_base64) {
      const decoded = atob(file_content_base64)
      rawText = decoded.replace(/[^\x20-\x7E\n\r\t\u00C0-\u024F]/g, ' ').trim()
      if (rawText.length < 20) {
        rawText = `Arquivo: ${file_name}\nTipo: ${file_type}\nConteúdo binário detectado - extração manual necessária`
      }
    }

    let extraction: ExtractionResult

    if (aiSettings?.api_key) {
      try {
        extraction = await extractWithOpenAI(rawText || `Arquivo: ${file_name}`, aiSettings.api_key)
      } catch (aiError) {
        extraction = {
          supplier: 'Extração manual necessária',
          quote_date: new Date().toISOString().split('T')[0],
          items: [],
          raw_text: rawText,
          confidence: 0.1
        }
      }
    } else {
      extraction = {
        supplier: 'Configure uma chave OpenAI em Configurações > Provedores de IA',
        quote_date: new Date().toISOString().split('T')[0],
        items: [],
        raw_text: rawText,
        confidence: 0
      }
    }

    await supabase
      .from('quotation_extractions')
      .update({
        supplier_detected: extraction.supplier,
        quote_date: extraction.quote_date || null,
        raw_text: extraction.raw_text || rawText,
        ai_confidence: extraction.confidence * 100,
        items_count: extraction.items.length,
        extraction_status: 'completed'
      })
      .eq('id', extractionRecord.id)

    const matchedItems = await matchInventoryItems(supabase, extraction.items || [])

    const insertedItems: any[] = []
    for (const item of matchedItems) {
      const { data: insertedItem } = await supabase
        .from('quotation_extracted_items')
        .insert({
          extraction_id: extractionRecord.id,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit || 'un',
          unit_cost: item.unit_cost,
          quote_date: extraction.quote_date || null,
          matched_inventory_id: item.matched_inventory_id,
          match_confidence: item.match_confidence * 100,
          match_status: item.match_status,
          current_avg_cost: item.current_avg_cost,
          price_change_pct: item.price_change_pct
        })
        .select()
        .single()
      if (insertedItem) insertedItems.push(insertedItem)
    }

    const proposals: any[] = []
    for (const item of insertedItems) {
      if (item.match_status === 'matched' && item.matched_inventory_id) {
        const { data: { data: invItem } } = await supabase
          .from('inventory_items')
          .select('id, name, average_cost')
          .eq('id', item.matched_inventory_id)
          .maybeSingle()
          .then((r: any) => ({ data: r }))

        const currentCost = invItem?.average_cost || 0
        const costChangePct = currentCost > 0
          ? ((item.unit_cost - currentCost) / currentCost) * 100
          : 0

        const { data: proposal } = await supabase
          .from('price_update_proposals')
          .insert({
            extraction_id: extractionRecord.id,
            extracted_item_id: item.id,
            inventory_item_id: item.matched_inventory_id,
            item_name: item.description,
            current_cost: currentCost,
            proposed_cost: item.unit_cost,
            cost_change_pct: costChangePct,
            affected_services: [],
            margin_impact: [],
            status: 'pending'
          })
          .select()
          .single()

        if (proposal) proposals.push(proposal)
      }
    }

    if (proposals.length > 0) {
      await generateMarginAlerts(supabase, proposals, margin_threshold)
    }

    return new Response(
      JSON.stringify({
        success: true,
        extraction_id: extractionRecord.id,
        supplier: extraction.supplier,
        quote_date: extraction.quote_date,
        confidence: extraction.confidence,
        items_extracted: matchedItems.length,
        proposals_created: proposals.length,
        items: insertedItems
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error('Error processing quotation:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
