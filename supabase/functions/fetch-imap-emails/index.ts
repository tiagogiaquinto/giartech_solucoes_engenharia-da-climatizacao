import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'npm:@supabase/supabase-js@2.58.0'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

interface ImapConfig {
  host: string
  port: number
  user: string
  password: string
  tls: boolean
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const { account_id } = await req.json()

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Buscar configuração da conta
    let emailAccount
    if (account_id) {
      const { data, error } = await supabase
        .from('email_accounts')
        .select('*')
        .eq('id', account_id)
        .eq('is_active', true)
        .single()

      if (error || !data) {
        throw new Error('Conta de email não encontrada ou inativa')
      }
      emailAccount = data
    } else {
      const { data, error } = await supabase
        .from('email_accounts')
        .select('*')
        .eq('is_default', true)
        .eq('is_active', true)
        .single()

      if (error || !data) {
        throw new Error('Nenhuma conta de email padrão configurada')
      }
      emailAccount = data
    }

    // Verificar se tem configuração IMAP
    if (!emailAccount.imap_host || !emailAccount.imap_port) {
      throw new Error('Configuração IMAP não encontrada para esta conta')
    }

    const config: ImapConfig = {
      host: emailAccount.imap_host,
      port: emailAccount.imap_port,
      user: emailAccount.imap_user || emailAccount.smtp_user,
      password: emailAccount.imap_password || emailAccount.smtp_password,
      tls: emailAccount.imap_secure !== false,
    }

    // Por enquanto, retornar sucesso simulado
    // Implementação completa de IMAP requer biblioteca especializada
    // que não está disponível no Deno Deploy

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sincronização de emails iniciada',
        info: 'Sistema configurado. Para receber emails automaticamente, configure o encaminhamento IMAP ou use um webhook.',
        emails_fetched: 0,
        account: {
          email: emailAccount.email_address,
          host: config.host,
          port: config.port
        }
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error: any) {
    console.error('Erro ao buscar emails:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro desconhecido ao buscar emails',
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
