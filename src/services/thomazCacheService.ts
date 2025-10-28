/**
 * Thomaz Cache & Session Service
 *
 * Gerencia cache de contexto por usuário e sessão
 * Mantém memória de conversas anteriores
 */

import { supabase } from '../lib/supabase'

export interface SessionContext {
  sessionId: string
  userId?: string
  userRole: string
  companyId?: string
  recentTopics: string[]
  conversationSummary: string
  lastActivity: Date
  metadata: Record<string, any>
}

export interface CachedData {
  key: string
  value: any
  expiresAt: Date
}

export class ThomazCacheService {
  private memoryCache: Map<string, CachedData> = new Map()
  private sessionContexts: Map<string, SessionContext> = new Map()
  private readonly CACHE_TTL = 15 * 60 * 1000 // 15 minutos
  private readonly SESSION_TTL = 60 * 60 * 1000 // 1 hora

  /**
   * Obter contexto da sessão
   */
  async getSessionContext(sessionId: string): Promise<SessionContext | null> {
    // Tentar cache em memória primeiro
    if (this.sessionContexts.has(sessionId)) {
      const context = this.sessionContexts.get(sessionId)!

      // Verificar se expirou
      if (Date.now() - context.lastActivity.getTime() < this.SESSION_TTL) {
        return context
      }
    }

    // Buscar no banco
    try {
      const { data, error } = await supabase
        .from('thomaz_conversations')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      if (!data || data.length === 0) return null

      // Construir contexto
      const recentTopics = this.extractTopics(data)
      const conversationSummary = this.summarizeConversation(data)

      const context: SessionContext = {
        sessionId,
        userId: data[0].user_id,
        userRole: data[0].user_role || 'user',
        companyId: data[0].company_id,
        recentTopics,
        conversationSummary,
        lastActivity: new Date(),
        metadata: {}
      }

      // Atualizar cache
      this.sessionContexts.set(sessionId, context)

      return context
    } catch (error) {
      console.error('Get Session Context Error:', error)
      return null
    }
  }

  /**
   * Atualizar contexto da sessão
   */
  async updateSessionContext(
    sessionId: string,
    updates: Partial<SessionContext>
  ): Promise<void> {
    const existing = await this.getSessionContext(sessionId)

    const updated: SessionContext = {
      ...(existing || {
        sessionId,
        userRole: 'user',
        recentTopics: [],
        conversationSummary: '',
        lastActivity: new Date(),
        metadata: {}
      }),
      ...updates,
      lastActivity: new Date()
    }

    this.sessionContexts.set(sessionId, updated)
  }

  /**
   * Extrair tópicos recentes das conversas
   */
  private extractTopics(conversations: any[]): string[] {
    const topics = new Set<string>()

    for (const conv of conversations) {
      if (conv.intent) {
        topics.add(conv.intent)
      }

      // Extrair palavras-chave do conteúdo
      const content = conv.content?.toLowerCase() || ''
      const keywords = [
        'orçamento',
        'financeiro',
        'margem',
        'estoque',
        'cliente',
        'os',
        'ordem de serviço',
        'relatório',
        'dashboard'
      ]

      for (const keyword of keywords) {
        if (content.includes(keyword)) {
          topics.add(keyword)
        }
      }
    }

    return Array.from(topics).slice(0, 5)
  }

  /**
   * Resumir conversação
   */
  private summarizeConversation(conversations: any[]): string {
    if (conversations.length === 0) return 'Nova conversa'

    const userMessages = conversations.filter(c => c.role === 'user')

    if (userMessages.length === 0) return 'Aguardando primeira mensagem'

    const lastUserMessage = userMessages[0].content
    const truncated = lastUserMessage.substring(0, 100)

    return `Contexto recente: ${truncated}${lastUserMessage.length > 100 ? '...' : ''}`
  }

  /**
   * Cache genérico
   */
  set(key: string, value: any, ttl: number = this.CACHE_TTL): void {
    const expiresAt = new Date(Date.now() + ttl)

    this.memoryCache.set(key, {
      key,
      value,
      expiresAt
    })
  }

  /**
   * Obter do cache
   */
  get<T = any>(key: string): T | null {
    const cached = this.memoryCache.get(key)

    if (!cached) return null

    // Verificar expiração
    if (cached.expiresAt < new Date()) {
      this.memoryCache.delete(key)
      return null
    }

    return cached.value as T
  }

  /**
   * Limpar cache expirado
   */
  cleanExpired(): void {
    const now = new Date()

    // Limpar memory cache
    for (const [key, cached] of this.memoryCache.entries()) {
      if (cached.expiresAt < now) {
        this.memoryCache.delete(key)
      }
    }

    // Limpar sessões expiradas
    for (const [sessionId, context] of this.sessionContexts.entries()) {
      if (now.getTime() - context.lastActivity.getTime() > this.SESSION_TTL) {
        this.sessionContexts.delete(sessionId)
      }
    }
  }

  /**
   * Iniciar limpeza automática
   */
  startAutoCleanup(): void {
    setInterval(() => {
      this.cleanExpired()
    }, 5 * 60 * 1000) // A cada 5 minutos
  }

  /**
   * Cache de documentos recuperados
   */
  cacheRetrievedDocs(query: string, docs: any[]): void {
    const key = `retrieved_docs:${query}`
    this.set(key, docs, this.CACHE_TTL)
  }

  /**
   * Obter documentos do cache
   */
  getCachedRetrievedDocs(query: string): any[] | null {
    const key = `retrieved_docs:${query}`
    return this.get(key)
  }
}
