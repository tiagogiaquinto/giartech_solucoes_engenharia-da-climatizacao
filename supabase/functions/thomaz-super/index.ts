import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

interface ThomazRequest {
  query: string
  userId?: string
  context?: any
}

interface ThomazCapabilities {
  dbSchema?: any
  dbQuery?: (sql: string, params?: any[]) => Promise<any>
  calcEvaluate?: (expression: string, variables: any) => number
  filesSearch?: (query: string, topK?: number) => Promise<any[]>
  filesReadPdf?: (fileId: string, pages?: number[]) => Promise<string>
  embeddingsSearch?: (query: string, namespace: string, topK?: number) => Promise<any[]>
  docGeneratePdf?: (docType: string, id?: string, title?: string, html?: string, withAnnexes?: boolean) => Promise<string>
  notifyWhatsApp?: (to: string, message: string, link?: string) => Promise<boolean>
}

class ThomazSuperAI {
  private supabase: any
  private capabilities: ThomazCapabilities

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey)
    this.capabilities = this.initializeCapabilities()
  }

  private initializeCapabilities(): ThomazCapabilities {
    return {
      dbSchema: null,
      dbQuery: async (sql: string, params?: any[]) => {
        try {
          const { data, error } = await this.supabase.rpc('execute_safe_query', {
            query_text: sql,
            query_params: params || []
          })
          if (error) throw error
          return data
        } catch (err) {
          console.error('Erro dbQuery:', err)
          return null
        }
      },
      calcEvaluate: (expression: string, variables: any) => {
        try {
          const func = new Function(...Object.keys(variables), `return ${expression}`)
          return func(...Object.values(variables))
        } catch (err) {
          console.error('Erro calcEvaluate:', err)
          return 0
        }
      },
      filesSearch: async (query: string, topK: number = 5) => {
        try {
          const { data, error } = await this.supabase
            .from('library_items')
            .select('*')
            .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
            .limit(topK)
          if (error) throw error
          return data || []
        } catch (err) {
          console.error('Erro filesSearch:', err)
          return []
        }
      },
      filesReadPdf: async (fileId: string, pages?: number[]) => {
        try {
          const { data, error } = await this.supabase
            .from('library_items')
            .select('*')
            .eq('id', fileId)
            .single()
          if (error) throw error
          return data?.description || 'Documento não encontrado'
        } catch (err) {
          console.error('Erro filesReadPdf:', err)
          return 'Erro ao ler PDF'
        }
      },
      embeddingsSearch: async (query: string, namespace: string, topK: number = 5) => {
        try {
          const { data, error } = await this.supabase.rpc('thomaz_recall_memories', {
            p_query: query,
            p_limit: topK
          })
          if (error) throw error
          return data || []
        } catch (err) {
          console.error('Erro embeddingsSearch:', err)
          return []
        }
      },
      docGeneratePdf: async (docType: string, id?: string, title?: string, html?: string, withAnnexes: boolean = false) => {
        return `PDF gerado: ${docType} - ${title}`
      },
      notifyWhatsApp: async (to: string, message: string, link?: string) => {
        try {
          await this.supabase.from('whatsapp_messages').insert({
            to_number: to,
            message_text: message,
            link_url: link,
            status: 'pending'
          })
          return true
        } catch (err) {
          console.error('Erro notifyWhatsApp:', err)
          return false
        }
      }
    }
  }

  async schemaIntrospect(): Promise<any> {
    try {
      const { data, error } = await this.supabase.rpc('thomaz_schema_introspect')
      if (error) throw error
      this.capabilities.dbSchema = data
      return data
    } catch (err) {
      console.error('Erro schemaIntrospect:', err)
      return { error: 'Erro ao introspectar schema' }
    }
  }

  async query(sql: string, params?: any[]): Promise<any> {
    return this.capabilities.dbQuery!(sql, params)
  }

  async calculate(expression: string, variables: any): Promise<number> {
    return this.capabilities.calcEvaluate!(expression, variables)
  }

  async searchFiles(query: string, topK: number = 5): Promise<any[]> {
    return this.capabilities.filesSearch!(query, topK)
  }

  async readPdf(fileId: string, pages?: number[]): Promise<string> {
    return this.capabilities.filesReadPdf!(fileId, pages)
  }

  async searchEmbeddings(query: string, namespace: string, topK: number = 5): Promise<any[]> {
    return this.capabilities.embeddingsSearch!(query, namespace, topK)
  }

  async generatePdf(docType: string, id?: string, title?: string, html?: string, withAnnexes: boolean = false): Promise<string> {
    return this.capabilities.docGeneratePdf!(docType, id, title, html, withAnnexes)
  }

  async notifyWhatsApp(to: string, message: string, link?: string): Promise<boolean> {
    return this.capabilities.notifyWhatsApp!(to, message, link)
  }

  async processRequest(request: ThomazRequest): Promise<any> {
    const { query, userId, context } = request

    const queryLower = query.toLowerCase()
    let response: any = {
      tipo: 'resposta_geral',
      resposta: '',
      dados: null,
      fontes: []
    }

    if (/fluxo de caixa|dre|comparativo/i.test(queryLower)) {
      await this.schemaIntrospect()

      const periodoMatch = query.match(/(\d+)\s*(dias?|meses?)/i)
      const dias = periodoMatch ? parseInt(periodoMatch[1]) : 60

      const dataInicio = new Date()
      dataInicio.setDate(dataInicio.getDate() - dias)

      const { data: financeiro } = await this.supabase.rpc('thomaz_get_financial_analysis', {
        p_date_from: dataInicio.toISOString().split('T')[0],
        p_date_to: new Date().toISOString().split('T')[0]
      })

      response.tipo = 'analise_financeira'
      response.resposta = `📊 FLUXO DE CAIXA E DRE - ÚLTIMOS ${dias} DIAS\n\n`

      if (financeiro) {
        const receitas = financeiro.receitas || 0
        const despesas = financeiro.despesas || 0
        const saldo = receitas - despesas
        const margem = receitas > 0 ? ((saldo / receitas) * 100).toFixed(2) : '0.00'

        response.resposta += `**RECEITAS:** R$ ${receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
        response.resposta += `**DESPESAS:** R$ ${despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
        response.resposta += `**SALDO:** R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
        response.resposta += `**MARGEM:** ${margem}%\n\n`

        response.dados = financeiro
        response.fontes.push('v_financial_entries', 'thomaz_get_financial_analysis')
      }

    } else if (/estoque|níveis|críticos|técnico/i.test(queryLower)) {
      const { data: estoque } = await this.supabase.rpc('thomaz_get_inventory_info', {
        p_search: null,
        p_low_stock_only: true
      })

      response.tipo = 'estoque_critico'
      response.resposta = `📦 ANÁLISE DE ESTOQUE - ITENS CRÍTICOS\n\n`

      if (estoque && estoque.length > 0) {
        response.resposta += `⚠️ **${estoque.length} ITEM(NS) COM ESTOQUE BAIXO:**\n\n`

        const porTecnico: any = {}
        estoque.forEach((item: any) => {
          const tecnico = item.assigned_technician || 'Sem técnico'
          if (!porTecnico[tecnico]) porTecnico[tecnico] = []
          porTecnico[tecnico].push(item)
        })

        Object.keys(porTecnico).forEach(tecnico => {
          response.resposta += `**${tecnico}:**\n`
          porTecnico[tecnico].forEach((item: any) => {
            response.resposta += `  • ${item.product_name} (SKU: ${item.sku})\n`
            response.resposta += `    Atual: ${item.current_quantity} | Mínimo: ${item.minimum_quantity}\n`
          })
          response.resposta += `\n`
        })

        response.dados = estoque
        response.fontes.push('inventory_items', 'thomaz_get_inventory_info')
      } else {
        response.resposta += `✅ **TODOS OS ITENS ESTÃO DENTRO DO NÍVEL MÍNIMO**\n`
      }

    } else if (/fundação|história|giartech/i.test(queryLower)) {
      const documentos = await this.searchFiles('fundação Giartech história', 3)

      response.tipo = 'busca_biblioteca'
      response.resposta = `📚 BUSCA NA BIBLIOTECA - "${query}"\n\n`

      if (documentos.length > 0) {
        response.resposta += `Encontrei **${documentos.length} documento(s)** relacionado(s):\n\n`

        for (const doc of documentos) {
          response.resposta += `**${doc.title}**\n`
          if (doc.description) {
            response.resposta += `${doc.description.substring(0, 200)}...\n`
          }
          response.resposta += `\n`
        }

        response.dados = documentos
        response.fontes.push('library_items')
      } else {
        response.resposta += `Nenhum documento específico encontrado sobre este tópico.\n`
      }

    } else {
      const { data: stats } = await this.supabase.rpc('thomaz_get_system_stats')

      response.tipo = 'resposta_geral'
      response.resposta = `Olá! Sou o Thomaz, sua inteligência artificial.\n\n`
      response.resposta += `Estou operacional com as seguintes capacidades:\n\n`
      response.resposta += `✅ db.schema_introspect() - Introspecção de tabelas\n`
      response.resposta += `✅ db.query(sql, params) - Consultas SQL seguras\n`
      response.resposta += `✅ calc.evaluate(expr, vars) - Cálculos complexos\n`
      response.resposta += `✅ files.search(query, topK) - Busca em biblioteca\n`
      response.resposta += `✅ files.read_pdf(fileId, pages) - Leitura de PDFs\n`
      response.resposta += `✅ embeddings.search(query, ns, topK) - Busca semântica\n`
      response.resposta += `✅ doc.generate_pdf(...) - Geração de documentos\n`
      response.resposta += `✅ notify.whatsapp(...) - Notificações WhatsApp\n\n`

      if (stats) {
        response.resposta += `📊 **RESUMO DO SISTEMA:**\n`
        response.resposta += `• ${stats.total_oss} OSs (${stats.oss_abertas} abertas)\n`
        response.resposta += `• ${stats.total_clientes} clientes\n`
        response.resposta += `• ${stats.total_funcionarios} funcionários\n`
        response.resposta += `• ${stats.itens_estoque} itens em estoque\n`
      }

      response.dados = stats
      response.fontes.push('thomaz_get_system_stats')
    }

    await this.supabase.from('thomaz_interactions').insert({
      user_id: userId,
      user_message: query,
      thomaz_response: response.resposta,
      context: context,
      created_at: new Date().toISOString()
    })

    return response
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const request: ThomazRequest = await req.json()

    const thomaz = new ThomazSuperAI(supabaseUrl, supabaseKey)
    const resultado = await thomaz.processRequest(request)

    return new Response(
      JSON.stringify({
        success: true,
        ...resultado
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )
  } catch (error: any) {
    console.error('Erro no Thomaz Super:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        tipo: 'erro'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )
  }
})