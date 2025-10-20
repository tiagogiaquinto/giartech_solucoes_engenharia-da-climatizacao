import { createClient } from 'npm:@supabase/supabase-js@2.58.0'
import nodemailer from 'npm:nodemailer@6.9.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

interface EmailRequest {
  account_id?: string
  to: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  subject: string
  body_text?: string
  body_html?: string
  reply_to?: string
  customer_id?: string
  service_order_id?: string
  attachments?: Array<{
    filename: string
    content: string
    contentType?: string
  }>
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const requestData: EmailRequest = await req.json()
    const { account_id, to, cc, bcc, subject, body_text, body_html, reply_to, customer_id, service_order_id, attachments } = requestData

    if (!to || !subject || (!body_text && !body_html)) {
      throw new Error('Campos obrigatórios: to, subject, e body_text ou body_html')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

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

    const transporter = nodemailer.createTransport({
      host: emailAccount.smtp_host,
      port: emailAccount.smtp_port,
      secure: emailAccount.smtp_secure,
      auth: {
        user: emailAccount.smtp_user,
        pass: emailAccount.smtp_password,
      },
    })

    const toAddresses = Array.isArray(to) ? to : [to]
    const ccAddresses = cc ? (Array.isArray(cc) ? cc : [cc]) : undefined
    const bccAddresses = bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined

    const emailBody = body_html || body_text?.replace(/\n/g, '<br>')
    const fullHtml = emailAccount.signature
      ? `${emailBody}<br><br>---<br>${emailAccount.signature.replace(/\n/g, '<br>')}`
      : emailBody

    const mailOptions: any = {
      from: `${emailAccount.sender_name} <${emailAccount.email_address}>`,
      to: toAddresses,
      subject: subject,
      text: body_text,
      html: fullHtml,
    }

    if (ccAddresses) mailOptions.cc = ccAddresses
    if (bccAddresses) mailOptions.bcc = bccAddresses
    if (reply_to) mailOptions.replyTo = reply_to

    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments.map(att => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType,
      }))
    }

    const info = await transporter.sendMail(mailOptions)

    const { data: messageData, error: messageError } = await supabase
      .from('email_messages')
      .insert({
        account_id: emailAccount.id,
        message_id: info.messageId,
        subject: subject,
        body_text: body_text,
        body_html: body_html,
        from_address: emailAccount.email_address,
        from_name: emailAccount.sender_name,
        to_addresses: toAddresses,
        cc_addresses: ccAddresses,
        bcc_addresses: bccAddresses,
        reply_to: reply_to,
        direction: 'sent',
        status: 'sent',
        customer_id: customer_id,
        service_order_id: service_order_id,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (messageError) {
      console.error('Erro ao salvar mensagem no banco:', messageError)
    }

    if (attachments && attachments.length > 0 && messageData) {
      const attachmentRecords = attachments.map(att => ({
        message_id: messageData.id,
        filename: att.filename,
        content_type: att.contentType || 'application/octet-stream',
        size_bytes: Math.round(att.content.length * 0.75),
      }))

      await supabase.from('email_attachments').insert(attachmentRecords)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email enviado com sucesso',
        messageId: info.messageId,
        recipients: toAddresses.length,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error: any) {
    console.error('Erro ao enviar email:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro desconhecido ao enviar email',
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
