const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

interface EmailAttachment {
  filename: string
  content: string
}

interface EmailRequest {
  to: string | string[]
  subject: string
  message: string
  html?: string
  attachments?: EmailAttachment[]
  from?: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const { to, subject, message, html, attachments, from }: EmailRequest = await req.json()

    if (!to || !subject || !message) {
      throw new Error('Campos obrigatórios: to, subject, message')
    }

    const recipients = Array.isArray(to) ? to : [to]
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

    if (!RESEND_API_KEY) {
      console.log('RESEND_API_KEY não configurada, usando modo mock')
      console.log('Enviando email para:', recipients)
      console.log('Assunto:', subject)
      console.log('Mensagem:', message)
      console.log('Anexos:', attachments ? attachments.length : 0)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email enviado com sucesso (MODO MOCK)',
          recipients,
          subject,
          attachments: attachments?.length || 0,
          note: 'Configure RESEND_API_KEY para envio real. Obtenha em https://resend.com'
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      )
    }

    const emailData: any = {
      from: from || 'noreply@giartechsolucoes.com.br',
      to: recipients,
      subject: subject,
      text: message,
      html: html || `<div style="font-family: sans-serif; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</div>`,
    }

    if (attachments && attachments.length > 0) {
      emailData.attachments = attachments
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao enviar email')
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email enviado com sucesso',
        recipients,
        subject,
        emailId: data.id,
        attachments: attachments?.length || 0
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
        error: error.message
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
