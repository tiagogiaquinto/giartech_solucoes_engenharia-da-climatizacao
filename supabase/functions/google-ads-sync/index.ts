import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

interface GoogleAdsConfig {
  customer_id: string
  access_token: string
  refresh_token?: string
  developer_token?: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { account_id, force_sync } = await req.json()

    if (!account_id) {
      throw new Error('account_id é obrigatório')
    }

    // Buscar configuração da conta
    const { data: account, error: accountError } = await supabase
      .from('google_ads_accounts')
      .select('*')
      .eq('id', account_id)
      .single()

    if (accountError || !account) {
      throw new Error('Conta não encontrada')
    }

    // Verificar se precisa sincronizar
    const lastSync = account.last_sync_at ? new Date(account.last_sync_at) : null
    const now = new Date()
    const minutesSinceLastSync = lastSync
      ? Math.floor((now.getTime() - lastSync.getTime()) / 60000)
      : 999999

    if (!force_sync && minutesSinceLastSync < account.sync_frequency_minutes) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Sincronização não necessária',
          minutes_until_next_sync: account.sync_frequency_minutes - minutesSinceLastSync
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const startTime = Date.now()
    let recordsSynced = 0
    let syncStatus = 'success'
    let errorMessage = null

    try {
      // Buscar campanhas da API do Google Ads
      // Nota: Esta é uma implementação simulada
      // Em produção, você deve usar a Google Ads API oficial
      const campaigns = await fetchGoogleAdsCampaigns(account)

      // Inserir/Atualizar campanhas
      for (const campaign of campaigns) {
        const { error: campaignError } = await supabase
          .from('google_ads_campaigns')
          .upsert({
            account_id: account.id,
            campaign_id: campaign.id,
            campaign_name: campaign.name,
            campaign_status: campaign.status,
            campaign_type: campaign.type,
            budget_amount: campaign.budget,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'account_id,campaign_id'
          })

        if (!campaignError) {
          recordsSynced++
        }
      }

      // Buscar métricas do dia
      const metrics = await fetchGoogleAdsMetrics(account, campaigns)

      // Inserir métricas
      for (const metric of metrics) {
        await supabase
          .from('google_ads_metrics')
          .upsert({
            campaign_id: metric.campaign_id,
            metric_date: metric.date,
            metric_hour: metric.hour,
            impressions: metric.impressions,
            clicks: metric.clicks,
            conversions: metric.conversions,
            cost: metric.cost,
            revenue: metric.revenue,
            ctr: metric.ctr,
            cpc: metric.cpc,
            cpa: metric.cpa,
            roas: metric.roas
          }, {
            onConflict: 'campaign_id,metric_date,metric_hour'
          })

        recordsSynced++
      }

      // Atualizar last_sync_at
      await supabase
        .from('google_ads_accounts')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', account.id)

    } catch (error: any) {
      syncStatus = 'error'
      errorMessage = error.message
      console.error('Erro na sincronização:', error)
    }

    // Registrar log de sincronização
    const syncDuration = Math.floor((Date.now() - startTime) / 1000)

    await supabase
      .from('google_ads_sync_log')
      .insert({
        account_id: account.id,
        sync_status: syncStatus,
        records_synced: recordsSynced,
        error_message: errorMessage,
        sync_duration_seconds: syncDuration
      })

    return new Response(
      JSON.stringify({
        success: syncStatus === 'success',
        records_synced: recordsSynced,
        sync_duration_seconds: syncDuration,
        error: errorMessage
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Erro geral:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Funções auxiliares para buscar dados do Google Ads
async function fetchGoogleAdsCampaigns(account: any): Promise<any[]> {
  // Implementação simulada
  // Em produção, usar Google Ads API oficial
  // https://developers.google.com/google-ads/api/docs/start

  console.log('Buscando campanhas para customer_id:', account.customer_id)

  // Simulação de dados
  return [
    {
      id: 'campaign_1',
      name: 'Campanha de Busca',
      status: 'ENABLED',
      type: 'SEARCH',
      budget: 500.00
    },
    {
      id: 'campaign_2',
      name: 'Campanha Display',
      status: 'ENABLED',
      type: 'DISPLAY',
      budget: 300.00
    }
  ]
}

async function fetchGoogleAdsMetrics(account: any, campaigns: any[]): Promise<any[]> {
  // Implementação simulada
  // Em produção, usar Google Ads API para buscar métricas reais

  const metrics: any[] = []
  const today = new Date().toISOString().split('T')[0]
  const currentHour = new Date().getHours()

  for (const campaign of campaigns) {
    metrics.push({
      campaign_id: campaign.id,
      date: today,
      hour: currentHour,
      impressions: Math.floor(Math.random() * 1000) + 500,
      clicks: Math.floor(Math.random() * 50) + 10,
      conversions: Math.floor(Math.random() * 5),
      cost: parseFloat((Math.random() * 50 + 10).toFixed(2)),
      revenue: parseFloat((Math.random() * 200 + 50).toFixed(2)),
      ctr: parseFloat((Math.random() * 5).toFixed(2)),
      cpc: parseFloat((Math.random() * 2).toFixed(2)),
      cpa: parseFloat((Math.random() * 50).toFixed(2)),
      roas: parseFloat((Math.random() * 4 + 1).toFixed(2))
    })
  }

  return metrics
}
