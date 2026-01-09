import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { searchParams } = new URL(req.url)
    const campaignId = searchParams.get('campaignId')
    const cepInicial = searchParams.get('cepInicial')
    const cepFinal = searchParams.get('cepFinal')

    if (!campaignId) {
      return new Response(
        JSON.stringify({ error: 'Campaign ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: campaign } = await supabase
      .from('lead_capture_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (!campaign) {
      return new Response(
        JSON.stringify({ error: 'Campaign not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const cepRanges = campaign.cep_ranges || []
    const leads: any[] = []

    for (const range of cepRanges) {
      const startCep = range.start || cepInicial
      const endCep = range.end || cepFinal

      if (!startCep || !endCep) continue

      const startNum = parseInt(startCep.replace(/\D/g, ''))
      const endNum = parseInt(endCep.replace(/\D/g, ''))

      const samplesToSearch = Math.min(50, Math.floor((endNum - startNum) / 100))

      for (let i = 0; i < samplesToSearch; i++) {
        const cepNum = startNum + Math.floor((endNum - startNum) * (i / samplesToSearch))
        const cep = cepNum.toString().padStart(8, '0')
        const cepFormatted = `${cep.substring(0, 5)}-${cep.substring(5)}`

        try {
          const cepResponse = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
          const cepData = await cepResponse.json()

          if (!cepData.erro) {
            const receitaResponse = await fetch(
              `https://www.receitaws.com.br/v1/cnpj?cep=${cep}`
            )

            if (receitaResponse.ok) {
              const companies = await receitaResponse.json()
              
              if (Array.isArray(companies)) {
                for (const company of companies.slice(0, 10)) {
                  const leadData = {
                    campaign_id: campaignId,
                    company_name: company.nome || company.fantasia || 'Empresa sem nome',
                    cnpj: company.cnpj || '',
                    phone: company.telefone || '',
                    email: company.email || '',
                    address: `${company.logradouro || ''}, ${company.numero || ''}`,
                    cep: cepFormatted,
                    city: cepData.localidade || '',
                    state: cepData.uf || '',
                    neighborhood: cepData.bairro || '',
                    business_type: company.atividade_principal?.[0]?.text || '',
                    source: 'correios',
                    status: 'novo',
                    priority: 'média',
                    metadata: {
                      situacao: company.situacao,
                      porte: company.porte,
                      capital_social: company.capital_social,
                      abertura: company.abertura,
                      cep_range: range
                    },
                    captured_at: new Date().toISOString()
                  }

                  const { data: existing } = await supabase
                    .from('captured_leads')
                    .select('id')
                    .eq('cnpj', company.cnpj)
                    .single()

                  if (!existing && company.cnpj) {
                    const { data: inserted, error } = await supabase
                      .from('captured_leads')
                      .insert(leadData)
                      .select()
                      .single()

                    if (!error && inserted) {
                      leads.push(inserted)
                    }
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching CEP ${cep}:`, error)
        }

        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }

    await supabase
      .from('lead_capture_campaigns')
      .update({ last_capture_at: new Date().toISOString() })
      .eq('id', campaignId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        leads_captured: leads.length,
        leads: leads 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})