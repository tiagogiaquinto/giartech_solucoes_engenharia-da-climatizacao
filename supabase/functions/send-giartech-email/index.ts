import { createClient } from 'npm:@supabase/supabase-js@2.58.0'
import nodemailer from 'npm:nodemailer@6.9.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

interface GiartechEmailRequest {
  to: string | string[]
  subject: string
  htmlContent: string
  textContent?: string
  attachments?: Array<{
    filename: string
    content: string
    contentType?: string
    encoding?: string
  }>
  replyTo?: string
  logRecipient?: string
}

function buildTransporter() {
  const smtpUser = Deno.env.get('SMTP_USER')
  const smtpPass = Deno.env.get('SMTP_PASSWORD')

  if (!smtpUser || !smtpPass) {
    throw new Error('Credenciais SMTP não configuradas. Configure SMTP_USER e SMTP_PASSWORD nas secrets do projeto.')
  }

  return nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      rejectUnauthorized: true,
    },
  })
}

function buildWelcomeEmail(clientName: string, portalUrl: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bem-vindo à Giartech Soluções</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#1e3a5f;padding:36px 40px;text-align:center;">
              <p style="margin:0;color:#93c5fd;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">Giartech Soluções</p>
              <h1 style="margin:12px 0 0;color:#ffffff;font-size:26px;font-weight:700;line-height:1.3;">Seu Portal está pronto!</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 20px;font-size:16px;color:#374151;line-height:1.6;">
                Olá, <strong>${clientName}</strong>.
              </p>
              <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.7;">
                É um prazer ter você conosco. A partir de agora, a gestão dos seus ativos de climatização está sob nossa responsabilidade técnica.
              </p>
              <!-- Features Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7ff;border-radius:10px;border:1px solid #bfdbfe;margin:24px 0;">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 16px;font-size:14px;font-weight:700;color:#1e3a5f;text-transform:uppercase;letter-spacing:1px;">O que você pode fazer agora:</p>
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding:6px 0;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width:24px;color:#2563eb;font-size:16px;vertical-align:top;padding-top:2px;">&#10003;</td>
                              <td style="font-size:14px;color:#374151;line-height:1.6;padding-left:8px;">Acessar o seu <strong>Portal do Cliente</strong> para ver o histórico de ordens de serviço.</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width:24px;color:#2563eb;font-size:16px;vertical-align:top;padding-top:2px;">&#10003;</td>
                              <td style="font-size:14px;color:#374151;line-height:1.6;padding-left:8px;">Acompanhar a <strong>saúde dos seus equipamentos</strong> em tempo real.</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width:24px;color:#2563eb;font-size:16px;vertical-align:top;padding-top:2px;">&#10003;</td>
                              <td style="font-size:14px;color:#374151;line-height:1.6;padding-left:8px;">Baixar seus <strong>laudos técnicos em PDF</strong> com validade jurídica.</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr>
                  <td align="center">
                    <a href="${portalUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:16px 40px;border-radius:10px;letter-spacing:0.3px;">
                      Acessar Meu Portal
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;">
                Ou acesse diretamente: <a href="${portalUrl}" style="color:#2563eb;">${portalUrl}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">
                <strong style="color:#1e3a5f;">Thomaz AI</strong> — Assistente Virtual Giartech
              </p>
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                Este é um e-mail automático. Caso tenha dúvidas, entre em contato com nossa equipe.
              </p>
              <p style="margin:12px 0 0;font-size:11px;color:#d1d5db;">
                &copy; ${new Date().getFullYear()} Giartech Soluções. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function buildOSConcludedEmail(clientName: string, osNumber: string, osTitle: string, portalUrl: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ordem de Serviço Concluída</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#15803d;padding:36px 40px;text-align:center;">
              <p style="margin:0;color:#86efac;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">Giartech Soluções</p>
              <h1 style="margin:12px 0 0;color:#ffffff;font-size:26px;font-weight:700;line-height:1.3;">OS Concluída com Sucesso</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 20px;font-size:16px;color:#374151;line-height:1.6;">
                Olá, <strong>${clientName}</strong>.
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.7;">
                Temos o prazer de informar que sua Ordem de Serviço foi concluída pela nossa equipe técnica.
              </p>
              <!-- OS Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:10px;border:1px solid #bbf7d0;margin:0 0 24px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:1px;">Detalhes da OS</p>
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="font-size:13px;color:#6b7280;padding:4px 0;width:120px;">Número:</td>
                        <td style="font-size:14px;color:#111827;font-weight:600;padding:4px 0;">${osNumber}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#6b7280;padding:4px 0;">Serviço:</td>
                        <td style="font-size:14px;color:#111827;padding:4px 0;">${osTitle}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#6b7280;padding:4px 0;">Status:</td>
                        <td style="padding:4px 0;"><span style="display:inline-block;background:#dcfce7;color:#15803d;font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;">Concluído</span></td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 24px;font-size:14px;color:#4b5563;line-height:1.7;">
                O laudo técnico completo está disponível no seu portal. Você também pode assinar digitalmente o documento de entrega diretamente pela plataforma.
              </p>
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td align="center">
                    <a href="${portalUrl}" style="display:inline-block;background:#15803d;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:16px 40px;border-radius:10px;">
                      Ver Laudo e Assinar OS
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">
                <strong style="color:#1e3a5f;">Thomaz AI</strong> — Assistente Virtual Giartech
              </p>
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                Este é um e-mail automático. Caso tenha dúvidas, entre em contato com nossa equipe.
              </p>
              <p style="margin:12px 0 0;font-size:11px;color:#d1d5db;">
                &copy; ${new Date().getFullYear()} Giartech Soluções. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)
  const smtpUser = Deno.env.get('SMTP_USER') || ''

  try {
    const body = await req.json()
    const { type } = body

    let emailData: { to: string; subject: string; html: string; logRecipient?: string } | null = null

    if (type === 'welcome') {
      const { clientName, clientEmail, portalUrl } = body
      if (!clientEmail) throw new Error('clientEmail obrigatorio para email de boas-vindas')
      const url = portalUrl || `${supabaseUrl.replace('supabase.co', 'netlify.app')}/portal/login`
      emailData = {
        to: clientEmail,
        subject: 'Bem-vindo à Giartech Soluções - Seu Portal está pronto!',
        html: buildWelcomeEmail(clientName || 'Cliente', url),
        logRecipient: clientEmail,
      }
    } else if (type === 'os_concluida') {
      const { clientEmail, clientName, osNumber, osTitle, portalUrl } = body
      if (!clientEmail) throw new Error('clientEmail obrigatorio para notificacao de OS')
      const url = portalUrl || `${supabaseUrl.replace('supabase.co', 'netlify.app')}/portal/login`
      emailData = {
        to: clientEmail,
        subject: `OS ${osNumber} Concluída - Giartech Soluções`,
        html: buildOSConcludedEmail(clientName || 'Cliente', osNumber || '', osTitle || 'Serviço', url),
        logRecipient: clientEmail,
      }
    } else {
      const { to, subject, htmlContent, textContent, attachments, replyTo } = body as GiartechEmailRequest
      if (!to || !subject || !htmlContent) {
        throw new Error('Campos obrigatorios: to, subject, htmlContent')
      }
      const toList = Array.isArray(to) ? to : [to]
      const transporter = buildTransporter()
      const mailOptions: any = {
        from: `Giartech Soluções <${smtpUser}>`,
        to: toList,
        subject,
        html: htmlContent,
        text: textContent,
      }
      if (replyTo) mailOptions.replyTo = replyTo
      if (attachments?.length) {
        mailOptions.attachments = attachments.map(a => ({
          filename: a.filename,
          content: Buffer.from(a.content, (a.encoding as BufferEncoding) || 'base64'),
          contentType: a.contentType,
        }))
      }
      const info = await transporter.sendMail(mailOptions)

      await supabase.from('email_logs').insert({
        recipient_email: toList.join(', '),
        subject,
        status: 'sent',
      })

      return new Response(JSON.stringify({ success: true, messageId: info.messageId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const transporter = buildTransporter()
    const info = await transporter.sendMail({
      from: `Giartech Soluções <${smtpUser}>`,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
    })

    await supabase.from('email_logs').insert({
      recipient_email: emailData.logRecipient || emailData.to,
      subject: emailData.subject,
      status: 'sent',
    })

    return new Response(JSON.stringify({ success: true, messageId: info.messageId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Erro ao enviar email Giartech:', error)

    await supabase.from('email_logs').insert({
      recipient_email: 'erro',
      subject: 'Falha no envio',
      status: 'failed',
      error_message: error.message,
    }).catch(() => {})

    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
