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
        const emailBody = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
              .info-box { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 5px; }
              .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Bem-vindo ao ${companyName || 'Giartech Sistema'}!</h1>
              </div>
              <div class="content">
                <p>Olá!</p>
                <p>Você foi convidado para acessar nosso sistema de gestão empresarial como <strong>${roleNames[role] || role}</strong>.</p>

                <div class="info-box">
                  <h3>📋 Informações do Convite:</h3>
                  <p><strong>Email:</strong> ${email}</p>
                  <p><strong>Função:</strong> ${roleNames[role] || role}</p>
                  <p><strong>Validade:</strong> 7 dias</p>
                </div>

                <p>Para criar sua conta e definir sua senha, clique no botão abaixo:</p>

                <center>
                  <a href="${inviteLink}" class="button">Aceitar Convite</a>
                </center>

                <p style="color: #6b7280; font-size: 14px;">Ou copie e cole este link no navegador:<br>
                <code style="background: #e5e7eb; padding: 5px; display: inline-block; margin-top: 5px;">${inviteLink}</code></p>

                <p><strong>⏰ Importante:</strong> Este convite expira em 7 dias.</p>

                <div class="footer">
                  <p>Este é um email automático. Não responda esta mensagem.</p>
                  <p>© ${new Date().getFullYear()} ${companyName || 'Giartech Sistema'}. Todos os direitos reservados.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;

        const emailResponse = await fetch(`${req.headers.get('origin')}/functions/v1/send-smtp-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.get('Authorization') || '',
          },
          body: JSON.stringify({
            to: email,
            subject: `Convite para acessar ${companyName || 'Giartech Sistema'}`,
            html: emailBody
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