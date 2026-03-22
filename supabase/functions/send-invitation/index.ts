import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface InvitationRequest {
  email: string;
  token: string;
  role: string;
  method: 'email' | 'whatsapp' | 'both';
  whatsapp?: string;
  companyName?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { email, token, role, method, whatsapp, companyName }: InvitationRequest = await req.json();

    const inviteLink = `${req.headers.get('origin') || 'https://giartech.netlify.app'}/register?token=${token}`;

    const roleNames: Record<string, string> = {
      admin: 'Administrador',
      technician: 'Técnico',
      external: 'Usuário Externo'
    };

    const results = {
      email: false,
      whatsapp: false,
      errors: [] as string[]
    };

    if (method === 'email' || method === 'both') {
      try {
        const emailBody = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Convite de Acesso</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#1e3a5f;padding:36px 40px;text-align:center;">
              <p style="margin:0;color:#93c5fd;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">${companyName || 'Giartech Soluções'}</p>
              <h1 style="margin:12px 0 0;color:#ffffff;font-size:26px;font-weight:700;line-height:1.3;">Você foi convidado!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.7;">
                Você foi convidado para acessar o sistema de gestão da <strong>${companyName || 'Giartech Soluções'}</strong> como <strong>${roleNames[role] || role}</strong>.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7ff;border-radius:10px;border:1px solid #bfdbfe;margin:0 0 24px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#1e3a5f;text-transform:uppercase;letter-spacing:1px;">Informações do Convite</p>
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="font-size:13px;color:#6b7280;padding:4px 0;width:80px;">E-mail:</td>
                        <td style="font-size:14px;color:#111827;font-weight:600;padding:4px 0;">${email}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#6b7280;padding:4px 0;">Função:</td>
                        <td style="font-size:14px;color:#111827;padding:4px 0;">${roleNames[role] || role}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#6b7280;padding:4px 0;">Validade:</td>
                        <td style="padding:4px 0;"><span style="display:inline-block;background:#fef3c7;color:#92400e;font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;">7 dias</span></td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td align="center">
                    <a href="${inviteLink}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:16px 40px;border-radius:10px;">
                      Aceitar Convite
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                Ou acesse: <a href="${inviteLink}" style="color:#2563eb;">${inviteLink}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">
                <strong style="color:#1e3a5f;">Thomaz AI</strong> — Assistente Virtual Giartech
              </p>
              <p style="margin:0;font-size:12px;color:#9ca3af;">Este é um e-mail automático. Não responda esta mensagem.</p>
              <p style="margin:12px 0 0;font-size:11px;color:#d1d5db;">&copy; ${new Date().getFullYear()} ${companyName || 'Giartech Soluções'}. Todos os direitos reservados.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

        const supabaseUrl = Deno.env.get('SUPABASE_URL') || req.headers.get('origin') || '';
        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-giartech-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.get('Authorization') || '',
          },
          body: JSON.stringify({
            to: email,
            subject: `Convite para acessar ${companyName || 'Giartech Soluções'}`,
            htmlContent: emailBody
          })
        });

        if (emailResponse.ok) {
          results.email = true;
        } else {
          results.errors.push('Erro ao enviar email');
        }
      } catch (error) {
        results.errors.push(`Email: ${error.message}`);
      }
    }

    if ((method === 'whatsapp' || method === 'both') && whatsapp) {
      try {
        const whatsappMessage = `
🎉 *Bem-vindo ao ${companyName || 'Giartech Sistema'}!*

Olá! Você foi convidado para acessar nosso sistema de gestão empresarial.

📋 *Informações do Convite:*
• Email: ${email}
• Função: ${roleNames[role] || role}
• Validade: 7 dias

Para criar sua conta e definir sua senha, acesse o link abaixo:

🔗 ${inviteLink}

⏰ *Importante:* Este convite expira em 7 dias.

_Este é um convite automático do sistema._
        `.trim();

        const whatsappResponse = await fetch(`${req.headers.get('origin')}/functions/v1/whatsapp-baileys`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.get('Authorization') || '',
          },
          body: JSON.stringify({
            to: whatsapp.replace(/\D/g, ''),
            message: whatsappMessage
          })
        });

        if (whatsappResponse.ok) {
          results.whatsapp = true;
        } else {
          results.errors.push('Erro ao enviar WhatsApp');
        }
      } catch (error) {
        results.errors.push(`WhatsApp: ${error.message}`);
      }
    }

    const success = results.email || results.whatsapp;

    return new Response(
      JSON.stringify({
        success,
        results,
        message: success
          ? 'Convite enviado com sucesso!'
          : 'Erro ao enviar convite. Tente novamente.'
      }),
      {
        status: success ? 200 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error('Error sending invitation:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});