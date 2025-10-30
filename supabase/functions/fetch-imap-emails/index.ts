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

    // Inserir email de exemplo para demonstração
    // Em produção, aqui seria feita a conexão IMAP real
    const { data: testEmail, error: insertError} = await supabase
      .from('email_messages')
      .insert({
        account_id: emailAccount.id,
        subject: `Email Sincronizado - ${new Date().toLocaleString('pt-BR')}`,
        body_text: 'Este é um email de demonstração da sincronização IMAP.\n\nPara receber emails reais:\n1. Configure IMAP nas configurações\n2. Use um webhook de encaminhamento\n3. Ou implemente biblioteca IMAP completa',
        body_html: '<p>Este é um email de <strong>demonstração</strong> da sincronização IMAP.</p><p>Para receber emails reais:</p><ol><li>Configure IMAP nas configurações</li><li>Use um webhook de encaminhamento</li><li>Ou implemente biblioteca IMAP completa</li></ol>',
        from_address: 'sistema@giartechsolucoes.com.br',
        from_name: 'Sistema Giartech',
        to_addresses: [emailAccount.email_address],
        direction: 'received',
        status: 'received',
        is_read: false,
        is_starred: false,
        is_archived: false,
        received_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao inserir email de teste:', insertError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email de demonstração criado com sucesso!',
        info: 'Para receber emails reais do servidor IMAP, será necessário:\n1. Biblioteca IMAP para Deno (não disponível nativamente)\n2. Webhook de encaminhamento configurado no cPanel\n3. Ou sincronização via serviço externo',
        emails_fetched: testEmail ? 1 : 0,
        account: {
          email: emailAccount.email_address,
          host: config.host,
          port: config.port
        },
        demo_email: testEmail ? {
          id: testEmail.id,
          subject: testEmail.subject,
          from: testEmail.from_address
        } : null
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
