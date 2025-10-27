import { supabase } from '../lib/supabase'

interface AIProvider {
  name: string
  apiKey?: string
  endpoint: string
  model: string
  maxTokens: number
  temperature: number
  available: boolean
  freeLimit?: number
  priority: number
}

interface AIRequest {
  prompt: string
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
  context?: any
}

interface AIResponse {
  success: boolean
  content: string
  provider: string
  model: string
  tokens?: number
  error?: string
}

/**
 * Serviço de integração com múltiplas APIs de IA gratuitas
 *
 * APIs Gratuitas Implementadas:
 * 1. Groq (Llama 3.1, Mixtral) - 14,400 requests/day
 * 2. Together AI (Llama, Mistral) - Free tier generoso
 * 3. Hugging Face Inference API (Múltiplos modelos) - Grátis
 * 4. Google Gemini API - Free tier generoso
 * 5. Cohere AI - Free tier disponível
 * 6. Anthropic Claude (se tiver créditos)
 */
export class AIProvidersService {
  private providers: AIProvider[] = []
  private currentProviderIndex = 0

  constructor() {
    this.initializeProviders()
  }

  /**
   * Inicializar provedores de IA
   */
  private initializeProviders() {
    this.providers = [
      {
        name: 'groq',
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        model: 'llama-3.1-70b-versatile',
        maxTokens: 8000,
        temperature: 0.7,
        available: true,
        freeLimit: 14400,
        priority: 1
      },
      {
        name: 'together',
        endpoint: 'https://api.together.xyz/v1/chat/completions',
        model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
        maxTokens: 4096,
        temperature: 0.7,
        available: true,
        priority: 2
      },
      {
        name: 'huggingface',
        endpoint: 'https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-70B-Instruct',
        model: 'meta-llama/Meta-Llama-3-70B-Instruct',
        maxTokens: 2048,
        temperature: 0.7,
        available: true,
        priority: 3
      },
      {
        name: 'gemini',
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
        model: 'gemini-1.5-flash',
        maxTokens: 8192,
        temperature: 0.7,
        available: true,
        priority: 4
      },
      {
        name: 'cohere',
        endpoint: 'https://api.cohere.ai/v1/chat',
        model: 'command',
        maxTokens: 4096,
        temperature: 0.7,
        available: true,
        priority: 5
      }
    ]

    // Carregar API keys do banco de dados
    this.loadApiKeysFromDatabase()
  }

  /**
   * Carregar API keys do banco de dados
   */
  private async loadApiKeysFromDatabase() {
    try {
      const { data: keys } = await supabase
        .from('ai_provider_keys')
        .select('*')
        .eq('active', true)

      if (keys && keys.length > 0) {
        keys.forEach(key => {
          const provider = this.providers.find(p => p.name === key.provider_name)
          if (provider) {
            provider.apiKey = key.api_key
            provider.available = true
            console.log(`✅ API Key carregada para ${key.provider_name}`)
          }
        })
      }
    } catch (err) {
      console.error('Erro ao carregar API keys:', err)
    }
  }

  /**
   * Obter melhor provedor disponível
   */
  private getBestProvider(): AIProvider | null {
    // Ordenar por prioridade e disponibilidade
    const available = this.providers
      .filter(p => p.available && p.apiKey)
      .sort((a, b) => a.priority - b.priority)

    if (available.length === 0) {
      console.warn('⚠️ Nenhum provedor de IA disponível com API key')
      return null
    }

    // Retornar o de maior prioridade
    return available[0]
  }

  /**
   * Fazer requisição para Groq
   */
  private async requestGroq(request: AIRequest): Promise<AIResponse> {
    const provider = this.providers.find(p => p.name === 'groq')
    if (!provider || !provider.apiKey) {
      throw new Error('Groq API key não configurada')
    }

    try {
      const response = await fetch(provider.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [
            {
              role: 'system',
              content: request.systemPrompt || 'Você é Thomaz, um assistente inteligente.'
            },
            {
              role: 'user',
              content: request.prompt
            }
          ],
          max_tokens: request.maxTokens || provider.maxTokens,
          temperature: request.temperature || provider.temperature
        })
      })

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.statusText}`)
      }

      const data = await response.json()

      return {
        success: true,
        content: data.choices[0]?.message?.content || '',
        provider: 'groq',
        model: provider.model,
        tokens: data.usage?.total_tokens
      }
    } catch (error: any) {
      return {
        success: false,
        content: '',
        provider: 'groq',
        model: provider.model,
        error: error.message
      }
    }
  }

  /**
   * Fazer requisição para Together AI
   */
  private async requestTogether(request: AIRequest): Promise<AIResponse> {
    const provider = this.providers.find(p => p.name === 'together')
    if (!provider || !provider.apiKey) {
      throw new Error('Together AI API key não configurada')
    }

    try {
      const response = await fetch(provider.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [
            {
              role: 'system',
              content: request.systemPrompt || 'Você é Thomaz, um assistente inteligente.'
            },
            {
              role: 'user',
              content: request.prompt
            }
          ],
          max_tokens: request.maxTokens || provider.maxTokens,
          temperature: request.temperature || provider.temperature
        })
      })

      if (!response.ok) {
        throw new Error(`Together AI error: ${response.statusText}`)
      }

      const data = await response.json()

      return {
        success: true,
        content: data.choices[0]?.message?.content || '',
        provider: 'together',
        model: provider.model,
        tokens: data.usage?.total_tokens
      }
    } catch (error: any) {
      return {
        success: false,
        content: '',
        provider: 'together',
        model: provider.model,
        error: error.message
      }
    }
  }

  /**
   * Fazer requisição para Hugging Face
   */
  private async requestHuggingFace(request: AIRequest): Promise<AIResponse> {
    const provider = this.providers.find(p => p.name === 'huggingface')
    if (!provider || !provider.apiKey) {
      throw new Error('Hugging Face API key não configurada')
    }

    try {
      const response = await fetch(provider.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`
        },
        body: JSON.stringify({
          inputs: request.prompt,
          parameters: {
            max_new_tokens: request.maxTokens || provider.maxTokens,
            temperature: request.temperature || provider.temperature,
            return_full_text: false
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Hugging Face error: ${response.statusText}`)
      }

      const data = await response.json()

      return {
        success: true,
        content: data[0]?.generated_text || '',
        provider: 'huggingface',
        model: provider.model
      }
    } catch (error: any) {
      return {
        success: false,
        content: '',
        provider: 'huggingface',
        model: provider.model,
        error: error.message
      }
    }
  }

  /**
   * Fazer requisição para Google Gemini
   */
  private async requestGemini(request: AIRequest): Promise<AIResponse> {
    const provider = this.providers.find(p => p.name === 'gemini')
    if (!provider || !provider.apiKey) {
      throw new Error('Google Gemini API key não configurada')
    }

    try {
      const url = `${provider.endpoint}?key=${provider.apiKey}`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${request.systemPrompt || 'Você é Thomaz, um assistente inteligente.'}\n\n${request.prompt}`
                }
              ]
            }
          ],
          generationConfig: {
            maxOutputTokens: request.maxTokens || provider.maxTokens,
            temperature: request.temperature || provider.temperature
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`)
      }

      const data = await response.json()

      return {
        success: true,
        content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
        provider: 'gemini',
        model: provider.model
      }
    } catch (error: any) {
      return {
        success: false,
        content: '',
        provider: 'gemini',
        model: provider.model,
        error: error.message
      }
    }
  }

  /**
   * Fazer requisição para Cohere
   */
  private async requestCohere(request: AIRequest): Promise<AIResponse> {
    const provider = this.providers.find(p => p.name === 'cohere')
    if (!provider || !provider.apiKey) {
      throw new Error('Cohere API key não configurada')
    }

    try {
      const response = await fetch(provider.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`
        },
        body: JSON.stringify({
          model: provider.model,
          message: request.prompt,
          preamble: request.systemPrompt || 'Você é Thomaz, um assistente inteligente.',
          max_tokens: request.maxTokens || provider.maxTokens,
          temperature: request.temperature || provider.temperature
        })
      })

      if (!response.ok) {
        throw new Error(`Cohere API error: ${response.statusText}`)
      }

      const data = await response.json()

      return {
        success: true,
        content: data.text || '',
        provider: 'cohere',
        model: provider.model
      }
    } catch (error: any) {
      return {
        success: false,
        content: '',
        provider: 'cohere',
        model: provider.model,
        error: error.message
      }
    }
  }

  /**
   * Processar requisição com fallback automático
   */
  async processRequest(request: AIRequest): Promise<AIResponse> {
    const provider = this.getBestProvider()

    if (!provider) {
      return {
        success: false,
        content: '',
        provider: 'none',
        model: 'none',
        error: 'Nenhum provedor de IA disponível. Configure uma API key.'
      }
    }

    console.log(`🤖 Usando provedor: ${provider.name} (${provider.model})`)

    let response: AIResponse

    try {
      switch (provider.name) {
        case 'groq':
          response = await this.requestGroq(request)
          break
        case 'together':
          response = await this.requestTogether(request)
          break
        case 'huggingface':
          response = await this.requestHuggingFace(request)
          break
        case 'gemini':
          response = await this.requestGemini(request)
          break
        case 'cohere':
          response = await this.requestCohere(request)
          break
        default:
          throw new Error(`Provedor ${provider.name} não implementado`)
      }

      // Se falhou, tentar próximo provedor
      if (!response.success) {
        console.warn(`⚠️ Provedor ${provider.name} falhou, tentando próximo...`)
        provider.available = false
        return this.processRequest(request)
      }

      // Salvar uso no banco
      await this.saveUsage(response)

      return response

    } catch (error: any) {
      console.error(`❌ Erro ao processar com ${provider.name}:`, error)
      provider.available = false
      return this.processRequest(request)
    }
  }

  /**
   * Salvar uso no banco de dados
   */
  private async saveUsage(response: AIResponse) {
    try {
      await supabase.from('ai_provider_usage').insert({
        provider_name: response.provider,
        model_name: response.model,
        tokens_used: response.tokens || 0,
        success: response.success,
        error_message: response.error,
        created_at: new Date().toISOString()
      })
    } catch (err) {
      console.error('Erro ao salvar uso:', err)
    }
  }

  /**
   * Obter estatísticas de uso
   */
  async getUsageStats(days: number = 7): Promise<any> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await supabase
        .from('ai_provider_usage')
        .select('*')
        .gte('created_at', startDate.toISOString())

      if (error) throw error

      // Agrupar por provedor
      const stats: any = {}
      data?.forEach(usage => {
        if (!stats[usage.provider_name]) {
          stats[usage.provider_name] = {
            total_requests: 0,
            total_tokens: 0,
            success_rate: 0,
            errors: 0
          }
        }
        stats[usage.provider_name].total_requests++
        stats[usage.provider_name].total_tokens += usage.tokens_used || 0
        if (usage.success) {
          stats[usage.provider_name].success_rate++
        } else {
          stats[usage.provider_name].errors++
        }
      })

      // Calcular taxa de sucesso
      Object.keys(stats).forEach(provider => {
        const total = stats[provider].total_requests
        stats[provider].success_rate = ((stats[provider].success_rate / total) * 100).toFixed(2)
      })

      return stats
    } catch (err) {
      console.error('Erro ao obter estatísticas:', err)
      return {}
    }
  }

  /**
   * Adicionar nova API key
   */
  async addApiKey(provider: string, apiKey: string): Promise<boolean> {
    try {
      await supabase.from('ai_provider_keys').upsert({
        provider_name: provider,
        api_key: apiKey,
        active: true,
        created_at: new Date().toISOString()
      })

      // Atualizar provider local
      const p = this.providers.find(pr => pr.name === provider)
      if (p) {
        p.apiKey = apiKey
        p.available = true
      }

      console.log(`✅ API Key adicionada para ${provider}`)
      return true
    } catch (err) {
      console.error('Erro ao adicionar API key:', err)
      return false
    }
  }

  /**
   * Listar provedores disponíveis
   */
  getProviders(): AIProvider[] {
    return this.providers.map(p => ({
      ...p,
      apiKey: p.apiKey ? '***' : undefined // Ocultar API key
    }))
  }

  /**
   * Testar provedor específico
   */
  async testProvider(providerName: string): Promise<AIResponse> {
    const provider = this.providers.find(p => p.name === providerName)
    if (!provider) {
      return {
        success: false,
        content: '',
        provider: providerName,
        model: 'unknown',
        error: 'Provedor não encontrado'
      }
    }

    const testRequest: AIRequest = {
      prompt: 'Responda apenas "OK" se você estiver funcionando.',
      systemPrompt: 'Você é um assistente de teste.',
      maxTokens: 10,
      temperature: 0.1
    }

    switch (providerName) {
      case 'groq':
        return this.requestGroq(testRequest)
      case 'together':
        return this.requestTogether(testRequest)
      case 'huggingface':
        return this.requestHuggingFace(testRequest)
      case 'gemini':
        return this.requestGemini(testRequest)
      case 'cohere':
        return this.requestCohere(testRequest)
      default:
        return {
          success: false,
          content: '',
          provider: providerName,
          model: 'unknown',
          error: 'Provedor não implementado'
        }
    }
  }
}

export default AIProvidersService
