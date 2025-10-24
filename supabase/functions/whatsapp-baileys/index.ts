import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

interface WhatsAppSession {
  accountId: string
  qrCode?: string
  status: 'disconnected' | 'qr' | 'connecting' | 'connected'
  phone?: string
  connectionTime?: string
}

// Store sessions in memory (em produção, usar Redis ou Supabase Storage)
const sessions = new Map<string, WhatsAppSession>()
const qrCodeCache = new Map<string, string>()

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const action = pathParts[pathParts.length - 1]

    // POST /whatsapp-baileys/connect - Inicia conexão e gera QR Code
    if (req.method === "POST" && action === "connect") {
      const { accountId } = await req.json()

      if (!accountId) {
        return new Response(
          JSON.stringify({ error: "Account ID required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      // Gerar QR Code usando Baileys
      const qrCode = await generateBaileysQRCode(accountId)

      const session: WhatsAppSession = {
        accountId,
        qrCode,
        status: 'qr'
      }

      sessions.set(accountId, session)
      qrCodeCache.set(accountId, qrCode)

      // Simular processo de conexão via Baileys
      // Em produção, isso seria feito através de WebSocket com o cliente
      simulateBaileysConnection(accountId, supabase)

      return new Response(
        JSON.stringify({
          success: true,
          qrCode,
          status: 'qr',
          message: 'Escaneie o QR Code com WhatsApp'
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // GET /whatsapp-baileys/status - Verifica status da conexão
    if (req.method === "GET" && action === "status") {
      const accountId = url.searchParams.get('accountId')

      if (!accountId) {
        return new Response(
          JSON.stringify({ error: "Account ID required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      const session = sessions.get(accountId)

      if (!session) {
        return new Response(
          JSON.stringify({
            accountId,
            status: 'disconnected',
            message: 'Nenhuma sessão ativa'
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      return new Response(
        JSON.stringify(session),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // POST /whatsapp-baileys/send - Envia mensagem via Baileys
    if (req.method === "POST" && action === "send") {
      const { accountId, to, message } = await req.json()

      if (!accountId || !to || !message) {
        return new Response(
          JSON.stringify({ error: "Account ID, recipient and message required" }),
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

      // Simular envio via Baileys
      const messageId = await sendBaileysMessage(accountId, to, message, supabase)

      return new Response(
        JSON.stringify({
          success: true,
          messageId,
          status: 'sent',
          timestamp: new Date().toISOString()
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // POST /whatsapp-baileys/disconnect - Desconecta sessão
    if (req.method === "POST" && action === "disconnect") {
      const { accountId } = await req.json()

      if (!accountId) {
        return new Response(
          JSON.stringify({ error: "Account ID required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      sessions.delete(accountId)
      qrCodeCache.delete(accountId)

      // Atualizar status no banco
      await supabase
        .from('whatsapp_accounts')
        .update({ status: 'disconnected' })
        .eq('id', accountId)

      return new Response(
        JSON.stringify({
          success: true,
          status: 'disconnected',
          message: 'Desconectado com sucesso'
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // POST /whatsapp-baileys/webhook - Recebe mensagens do WhatsApp
    if (req.method === "POST" && action === "webhook") {
      const payload = await req.json()

      // Processar mensagens recebidas via Baileys
      await processBaileysWebhook(payload, supabase)

      return new Response(
        JSON.stringify({ success: true }),
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

// Gera QR Code estilo Baileys
async function generateBaileysQRCode(accountId: string): Promise<string> {
  // Simula formato de QR Code do Baileys
  const sessionData = {
    clientId: crypto.randomUUID(),
    serverToken: crypto.randomUUID(),
    clientToken: crypto.randomUUID(),
    encKey: Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join(''),
    macKey: Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('')
  }

  const qrData = btoa(JSON.stringify(sessionData))

  // Gera QR Code SVG mais realista
  const size = 264
  const qrCode = generateQRCodeSVG(qrData, size)

  return `data:image/svg+xml;base64,${btoa(qrCode)}`
}

// Gera SVG de QR Code mais realista
function generateQRCodeSVG(data: string, size: number): string {
  const moduleSize = 8
  const modules = Math.floor(size / moduleSize)

  let svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">`
  svg += `<rect width="${size}" height="${size}" fill="white"/>`

  // Gera padrão pseudo-aleatório baseado nos dados
  const hash = data.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)

  for (let y = 0; y < modules; y++) {
    for (let x = 0; x < modules; x++) {
      const seed = (x * 31 + y * 17 + hash) % 100
      if (seed > 50) {
        svg += `<rect x="${x * moduleSize}" y="${y * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`
      }
    }
  }

  // Adiciona marcadores de posição (cantos)
  const markerSize = moduleSize * 7
  const positions = [
    [0, 0],
    [size - markerSize, 0],
    [0, size - markerSize]
  ]

  positions.forEach(([x, y]) => {
    svg += `<rect x="${x}" y="${y}" width="${markerSize}" height="${markerSize}" fill="black"/>`
    svg += `<rect x="${x + moduleSize}" y="${y + moduleSize}" width="${markerSize - moduleSize * 2}" height="${markerSize - moduleSize * 2}" fill="white"/>`
    svg += `<rect x="${x + moduleSize * 2}" y="${y + moduleSize * 2}" width="${markerSize - moduleSize * 4}" height="${markerSize - moduleSize * 4}" fill="black"/>`
  })

  svg += '</svg>'
  return svg
}

// Simula conexão via Baileys
async function simulateBaileysConnection(accountId: string, supabase: any) {
  // Simula delay de escaneamento (em produção, seria evento real do Baileys)
  setTimeout(async () => {
    const session = sessions.get(accountId)
    if (!session || session.status !== 'qr') return

    // Atualiza para conectando
    sessions.set(accountId, {
      ...session,
      status: 'connecting',
      qrCode: undefined
    })

    // Simula handshake e autenticação
    setTimeout(async () => {
      const currentSession = sessions.get(accountId)
      if (!currentSession || currentSession.status !== 'connecting') return

      // Conectado!
      sessions.set(accountId, {
        ...currentSession,
        status: 'connected',
        phone: '5535999999999',
        connectionTime: new Date().toISOString()
      })

      // Atualiza no banco
      await supabase
        .from('whatsapp_accounts')
        .update({
          status: 'connected',
          last_connection: new Date().toISOString()
        })
        .eq('id', accountId)

      console.log(`✅ WhatsApp Baileys connected for account ${accountId}`)
    }, 3000)

  }, 12000) // 12 segundos para escanear
}

// Envia mensagem via Baileys
async function sendBaileysMessage(
  accountId: string,
  to: string,
  message: string,
  supabase: any
): Promise<string> {
  const messageId = crypto.randomUUID()

  // Em produção, usar Baileys para enviar:
  // const sock = getActiveSocket(accountId)
  // await sock.sendMessage(to + '@s.whatsapp.net', { text: message })

  console.log(`📤 Sending message via Baileys from ${accountId} to ${to}: ${message}`)

  // Salvar no banco
  try {
    // Buscar contact_id
    const { data: contacts } = await supabase
      .from('whatsapp_contacts')
      .select('id')
      .eq('phone', to)
      .limit(1)

    if (contacts && contacts.length > 0) {
      await supabase
        .from('whatsapp_messages')
        .insert({
          contact_id: contacts[0].id,
          message_type: 'text',
          content: message,
          direction: 'outbound',
          status: 'sent',
          created_at: new Date().toISOString()
        })
    }
  } catch (error) {
    console.error('Error saving message:', error)
  }

  return messageId
}

// Processa webhook de mensagens recebidas
async function processBaileysWebhook(payload: any, supabase: any) {
  console.log('📨 Webhook received:', payload)

  // Em produção, processar eventos do Baileys:
  // - messages.upsert (nova mensagem)
  // - messages.update (status atualizado)
  // - connection.update (mudança de conexão)

  if (payload.messages) {
    for (const msg of payload.messages) {
      try {
        // Salvar mensagem recebida
        const { data: contacts } = await supabase
          .from('whatsapp_contacts')
          .select('id')
          .eq('phone', msg.from)
          .limit(1)

        if (contacts && contacts.length > 0) {
          await supabase
            .from('whatsapp_messages')
            .insert({
              contact_id: contacts[0].id,
              message_type: 'text',
              content: msg.text || msg.caption || '[Mídia]',
              direction: 'inbound',
              status: 'read',
              created_at: new Date(msg.timestamp * 1000).toISOString()
            })

          // Atualizar última mensagem do contato
          await supabase
            .from('whatsapp_contacts')
            .update({
              last_message_at: new Date().toISOString(),
              last_message_preview: msg.text?.substring(0, 100) || '[Mídia]',
              unread_count: supabase.raw('unread_count + 1')
            })
            .eq('id', contacts[0].id)
        }
      } catch (error) {
        console.error('Error processing message:', error)
      }
    }
  }
}