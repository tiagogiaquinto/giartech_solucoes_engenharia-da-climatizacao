import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CNPJData {
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  email?: string;
  telefone?: string;
  municipio?: string;
  uf?: string;
  porte?: string;
}

interface CaptureRequest {
  campaign_id: string;
  cnpj_list?: string[];
  filters?: {
    estados?: string[];
    setores?: string[];
    porte?: string[];
  };
  auto_enrich?: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const requestData: CaptureRequest = await req.json();
    const { campaign_id, cnpj_list = [], auto_enrich = true } = requestData;

    if (!campaign_id) {
      return new Response(
        JSON.stringify({ error: 'campaign_id é obrigatório' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const captured_leads: any[] = [];
    const errors: any[] = [];

    // Buscar dados da campanha
    const { data: campaign } = await supabase
      .from('lead_capture_campaigns')
      .select('*')
      .eq('id', campaign_id)
      .single();

    if (!campaign) {
      return new Response(
        JSON.stringify({ error: 'Campanha não encontrada' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Processar cada CNPJ
    for (const cnpj of cnpj_list) {
      try {
        // Buscar dados do CNPJ
        const cnpjResponse = await fetch(
          `${supabaseUrl}/functions/v1/buscar-cnpj?cnpj=${cnpj}`,
          {
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
            },
          }
        );

        if (!cnpjResponse.ok) {
          errors.push({ cnpj, error: 'Erro ao buscar CNPJ' });
          continue;
        }

        const cnpjData: CNPJData = await cnpjResponse.json();

        // Verificar se lead já existe
        const { data: existingLead } = await supabase
          .from('crm_leads')
          .select('id')
          .or(`company.eq.${cnpjData.razao_social},company.eq.${cnpjData.nome_fantasia}`)
          .single();

        if (existingLead) {
          errors.push({ cnpj, error: 'Lead já existe no sistema' });
          continue;
        }

        // Criar lead
        const leadData = {
          name: cnpjData.nome_fantasia || cnpjData.razao_social,
          company: cnpjData.razao_social,
          email: cnpjData.email || null,
          phone: cnpjData.telefone || null,
          source: 'cnpj',
          status: 'new',
          capture_campaign_id: campaign_id,
          location: cnpjData.municipio && cnpjData.uf ? `${cnpjData.municipio}, ${cnpjData.uf}` : null,
          company_size: cnpjData.porte || null,
          enrichment_status: 'completed',
          last_enrichment: new Date().toISOString(),
        };

        const { data: newLead, error: insertError } = await supabase
          .from('crm_leads')
          .insert(leadData)
          .select()
          .single();

        if (insertError) {
          errors.push({ cnpj, error: insertError.message });
          continue;
        }

        // Registrar enriquecimento
        await supabase
          .from('lead_enrichment_log')
          .insert({
            lead_id: newLead.id,
            source: 'cnpj_api',
            data_added: cnpjData,
            success: true,
          });

        captured_leads.push(newLead);
      } catch (error) {
        errors.push({ cnpj, error: error.message });
      }
    }

    // Atualizar contador da campanha
    await supabase
      .from('lead_capture_campaigns')
      .update({
        total_leads_captured: campaign.total_leads_captured + captured_leads.length,
        last_run: new Date().toISOString(),
      })
      .eq('id', campaign_id);

    return new Response(
      JSON.stringify({
        success: true,
        captured: captured_leads.length,
        errors: errors.length,
        leads: captured_leads,
        error_details: errors,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Erro ao captar leads:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno ao captar leads' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});