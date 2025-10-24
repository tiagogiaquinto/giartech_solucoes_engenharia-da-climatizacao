import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

interface WhatsAppSession {
  accountId: string
  qrCode?: string
  status: 'disconnected' | 'qr' | 'connected'
  phone?: string
}

// Simulação de sessões WhatsApp (em produção, usar Redis ou storage persistente)
const sessions = new Map<string, WhatsAppSession>()

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()

    // GET /whatsapp-connect/status/:accountId - Verifica status da conexão
    if (req.method === "GET" && path === "status") {
      const accountId = url.searchParams.get('accountId')

      if (!accountId) {
        return new Response(
          JSON.stringify({ error: "Account ID required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      const session = sessions.get(accountId) || {
        accountId,
        status: 'disconnected'
      }

      return new Response(
        JSON.stringify(session),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // POST /whatsapp-connect/generate-qr - Gera QR Code para conexão
    if (req.method === "POST" && path === "generate-qr") {
      const { accountId } = await req.json()

      if (!accountId) {
        return new Response(
          JSON.stringify({ error: "Account ID required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      // Simula geração de QR Code (em produção, usar whatsapp-web.js)
      const qrCode = generateMockQRCode()

      sessions.set(accountId, {
        accountId,
        qrCode,
        status: 'qr'
      })

      // Simula conexão após 10 segundos
      setTimeout(() => {
        const session = sessions.get(accountId)
        if (session && session.status === 'qr') {
          sessions.set(accountId, {
            ...session,
            status: 'connected',
            phone: '5535999999999',
            qrCode: undefined
          })
        }
      }, 10000)

      return new Response(
        JSON.stringify({ qrCode, status: 'qr' }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // POST /whatsapp-connect/disconnect - Desconecta WhatsApp
    if (req.method === "POST" && path === "disconnect") {
      const { accountId } = await req.json()

      if (!accountId) {
        return new Response(
          JSON.stringify({ error: "Account ID required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      sessions.delete(accountId)

      return new Response(
        JSON.stringify({ success: true, status: 'disconnected' }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // POST /whatsapp-connect/send-message - Envia mensagem pelo WhatsApp
    if (req.method === "POST" && path === "send-message") {
      const { accountId, phone, message } = await req.json()

      if (!accountId || !phone || !message) {
        return new Response(
          JSON.stringify({ error: "Account ID, phone and message required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      const session = sessions.get(accountId)

      if (!session || session.status !== 'connected') {
        return new Response(
          JSON.stringify({ error: "WhatsApp not connected" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      // Em produção, enviar mensagem real via whatsapp-web.js
      console.log(`Sending message to ${phone}: ${message}`)

      return new Response(
        JSON.stringify({
          success: true,
          messageId: crypto.randomUUID(),
          status: 'sent'
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    return new Response(
      JSON.stringify({ error: "Route not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (error) {
    console.error("Error:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})

// Gera um QR Code mock em formato SVG (Base64)
function generateMockQRCode(): string {
  const randomData = crypto.randomUUID()

  // QR Code SVG simplificado
  const svgQR = `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="white"/>
      <rect x="10" y="10" width="30" height="30" fill="black"/>
      <rect x="50" y="10" width="10" height="30" fill="black"/>
      <rect x="70" y="10" width="30" height="30" fill="black"/>
      <rect x="110" y="10" width="10" height="30" fill="black"/>
      <rect x="130" y="10" width="10" height="10" fill="black"/>
      <rect x="150" y="10" width="10" height="10" fill="black"/>
      <rect x="160" y="10" width="30" height="30" fill="black"/>

      <rect x="10" y="50" width="10" height="10" fill="black"/>
      <rect x="30" y="50" width="10" height="10" fill="black"/>
      <rect x="50" y="50" width="30" height="10" fill="black"/>
      <rect x="90" y="50" width="20" height="10" fill="black"/>
      <rect x="120" y="50" width="10" height="10" fill="black"/>
      <rect x="140" y="50" width="20" height="10" fill="black"/>
      <rect x="170" y="50" width="10" height="10" fill="black"/>

      <rect x="10" y="70" width="30" height="30" fill="black"/>
      <rect x="50" y="70" width="10" height="30" fill="black"/>
      <rect x="70" y="70" width="20" height="10" fill="black"/>
      <rect x="100" y="70" width="30" height="30" fill="black"/>
      <rect x="140" y="70" width="10" height="10" fill="black"/>
      <rect x="160" y="70" width="30" height="30" fill="black"/>

      <rect x="10" y="110" width="10" height="20" fill="black"/>
      <rect x="30" y="110" width="20" height="10" fill="black"/>
      <rect x="60" y="110" width="30" height="20" fill="black"/>
      <rect x="100" y="110" width="10" height="10" fill="black"/>
      <rect x="120" y="110" width="20" height="20" fill="black"/>
      <rect x="150" y="110" width="10" height="10" fill="black"/>
      <rect x="170" y="110" width="20" height="10" fill="black"/>

      <rect x="10" y="160" width="30" height="30" fill="black"/>
      <rect x="50" y="160" width="20" height="10" fill="black"/>
      <rect x="80" y="160" width="10" height="30" fill="black"/>
      <rect x="100" y="160" width="30" height="10" fill="black"/>
      <rect x="140" y="160" width="20" height="20" fill="black"/>
      <rect x="170" y="160" width="10" height="30" fill="black"/>

      <text x="100" y="195" text-anchor="middle" font-size="8" fill="gray">${randomData.substring(0, 8)}</text>
    </svg>
  `

  return `data:image/svg+xml;base64,${btoa(svgQR)}`
}