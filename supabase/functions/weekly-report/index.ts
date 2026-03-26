import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Gerar texto do relatório
    const { data: reportData, error: reportError } = await supabase
      .rpc("generate_weekly_report_text");

    if (reportError) throw new Error(`generate_weekly_report_text: ${reportError.message}`);

    const reportText: string = reportData as string;

    // 2. Buscar configuração de agendamento
    const { data: schedule } = await supabase
      .from("weekly_report_schedules")
      .select("*")
      .eq("is_active", true)
      .maybeSingle();

    // 3. Buscar group_id do WhatsApp
    const { data: groupIdRow } = await supabase
      .from("company_settings")
      .select("value")
      .eq("key", "whatsapp_group_id")
      .maybeSingle();

    const whatsappGroupId: string | null = groupIdRow?.value ?? null;

    // 4. Buscar KPIs para salvar no histórico
    const { data: kpis } = await supabase
      .from("v_weekly_performance_summary")
      .select("*")
      .maybeSingle();

    // 5. Salvar no histórico
    const { data: historyRow } = await supabase
      .from("weekly_report_history")
      .insert({
        week_start: kpis?.semana_inicio ?? new Date().toISOString().split("T")[0],
        week_end: kpis?.semana_fim ?? new Date().toISOString().split("T")[0],
        total_oss: Number(kpis?.total_oss ?? 0),
        faturamento: Number(kpis?.faturamento ?? 0),
        custos_totais: Number(kpis?.custo_total ?? 0),
        lucro_liquido: Number(kpis?.lucro_liquido ?? 0),
        margem_pct: Number(kpis?.margem_pct ?? 0),
        taxa_conclusao: Number(kpis?.taxa_conclusao ?? 0),
        var_faturamento: Number(kpis?.variacao_faturamento_pct ?? 0),
        report_text: reportText,
        sent_whatsapp: false,
        whatsapp_status: whatsappGroupId ? "queued" : "no_whatsapp",
      })
      .select("id")
      .maybeSingle();

    // 6. Marcar fechamentos financeiros pendentes com a mensagem
    if (whatsappGroupId) {
      await supabase
        .from("weekly_report_history")
        .update({ whatsapp_status: "queued" })
        .eq("id", historyRow?.id);
    }

    // 7. Enviar email se configurado
    let emailSent = false;
    if (schedule?.send_email && schedule?.email_recipient) {
      try {
        await supabase.functions.invoke("send-smtp-email", {
          body: {
            to: schedule.email_recipient,
            subject: `Relatório Semanal Giartech — ${kpis?.semana_inicio ?? ""}`,
            html: `<pre style="font-family:monospace;font-size:14px;line-height:1.6">${reportText}</pre>`,
          },
        });
        emailSent = true;
        await supabase
          .from("weekly_report_history")
          .update({ sent_email: true, sent_at: new Date().toISOString() })
          .eq("id", historyRow?.id);
      } catch (_e) {
        // email falhou mas não bloqueia
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        report_id: historyRow?.id,
        whatsapp_queued: !!whatsappGroupId,
        whatsapp_group_id: whatsappGroupId,
        email_sent: emailSent,
        report_preview: reportText.slice(0, 200) + "...",
        message: "Relatório gerado com sucesso.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
