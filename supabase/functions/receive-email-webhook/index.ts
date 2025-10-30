import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'npm:@supabase/supabase-js@2.58.0'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

interface WebhookEmail {
  subject: string
  from_address: string
  from_name?: string
  to_address: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  body_text?: string
  body_html?: string
  received_at?: string
  message_id?: string
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const emailData: WebhookEmail = await req.json()

    if (!emailData.subject || !emailData.from_address || !emailData.to_address) {
      throw new Error('Campos obrigatórios faltando: subject, from_address, to_address')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Determinar conta de destino
    const toAddresses = Array.isArray(emailData.to_address)
      ? emailData.to_address
      : [emailData.to_address]

    // Buscar conta de email correspondente
    const { data: emailAccount, error: accountError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('email_address', toAddresses[0])
      .eq('is_active', true)
      .maybeSingle()

    // Se não encontrar conta específica, usar conta padrão
    let accountId
    if (!emailAccount) {
      const { data: defaultAccount } = await supabase
        .from('email_accounts')
        .select('id')
        .eq('is_default', true)
        .eq('is_active', true)
        .single()

      if (!defaultAccount) {
        throw new Error('Nenhuma conta de email configurada')
      }
      accountId = defaultAccount.id
    } else {
      accountId = emailAccount.id
    }

    // Inserir email no banco
    const { data: insertedEmail, error: insertError } = await supabase
      .from('email_messages')
      .insert({
        account_id: accountId,
        message_id: emailData.message_id || `webhook-${Date.now()}`,
        subject: emailData.subject,
        body_text: emailData.body_text,
        body_html: emailData.body_html || emailData.body_text?.replace(/\n/g, '<br>'),
        from_address: emailData.from_address,
        from_name: emailData.from_name,
        to_addresses: toAddresses,
        cc_addresses: emailData.cc ? (Array.isArray(emailData.cc) ? emailData.cc : [emailData.cc]) : null,
        bcc_addresses: emailData.bcc ? (Array.isArray(emailData.bcc) ? emailData.bcc : [emailData.bcc]) : null,
        direction: 'received',
        status: 'received',
        is_read: false,
        is_starred: false,
        is_archived: false,
        received_at: emailData.received_at || new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      throw new Error(`Erro ao inserir email: ${insertError.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email recebido e salvo com sucesso',
        email_id: insertedEmail.id,
        subject: insertedEmail.subject,
        from: insertedEmail.from_address,
        to: toAddresses,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error: any) {
    console.error('Erro ao processar webhook de email:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro desconhecido ao processar email',
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})
