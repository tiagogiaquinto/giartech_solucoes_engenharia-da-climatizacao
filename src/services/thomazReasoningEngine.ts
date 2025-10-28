/**
 * Thomaz Reasoning Engine - Motor de Raciocínio Avançado
 *
 * Capacidades:
 * - Interpretação contextual profunda
 * - Raciocínio multi-etapa
 * - Análise de intenção do usuário
 * - Formulação de respostas inteligentes
 * - Conexão de conceitos
 * - Consulta de dados reais da empresa
 */

import { supabase } from '../lib/supabase'
import { ThomazDataService, DataQueryResult } from './thomazDataService'

export interface ReasoningContext {
  userMessage: string
  conversationHistory: Array<{ role: string; content: string }>
  userRole?: string
  companyContext?: any
  currentPage?: string
  recentActions?: string[]
}

export interface ReasoningResult {
  interpretation: {
    mainIntent: string
    subIntents: string[]
    entities: Record<string, any>
    sentiment: 'positive' | 'neutral' | 'negative' | 'urgent'
    complexity: 'simple' | 'moderate' | 'complex'
  }
  reasoning: {
    thoughtProcess: string[]
    relevantContext: string[]
    connectionsFound: string[]
    missingInformation: string[]
  }
  response: {
    answer: string
    confidence: number
    shouldAskForClarification: boolean
    suggestedFollowUps: string[]
    actionableSteps?: string[]
  }
  realData?: DataQueryResult
}

export class ThomazReasoningEngine {
  private dataService: ThomazDataService

  constructor() {
    this.dataService = new ThomazDataService()
  }
  /**
   * NÚCLEO DO RACIOCÍNIO: Processar e entender mensagem
   */
  async reason(context: ReasoningContext): Promise<ReasoningResult> {
    const { userMessage, conversationHistory, userRole, companyContext } = context

    // Etapa 1: Interpretar intenção
    const interpretation = await this.interpretIntent(userMessage, conversationHistory)

    // Etapa 2: Raciocinar sobre o contexto
    const reasoning = await this.reasonAboutContext(interpretation, context)

    // Etapa 3: Buscar dados reais (NOVO!)
    const realData = await this.queryRealData(interpretation, reasoning, userMessage)

    // Etapa 4: Buscar conhecimento relevante
    const knowledge = await this.retrieveRelevantKnowledge(interpretation, reasoning)

    // Etapa 5: Formular resposta inteligente com dados reais
    const response = await this.formulateResponse(
      interpretation,
      reasoning,
      knowledge,
      context,
      realData
    )

    return {
      interpretation,
      reasoning,
      response,
      realData
    }
  }

  /**
   * ETAPA 1: Interpretar Intenção do Usuário
   */
  private async interpretIntent(
    userMessage: string,
    history: Array<{ role: string; content: string }>
  ): Promise<ReasoningResult['interpretation']> {
    const lowerMessage = userMessage.toLowerCase()

    // Detectar entidades (números, datas, nomes, etc)
    const entities = this.extractEntities(userMessage)

    // Detectar sentimento
    const sentiment = this.detectSentiment(lowerMessage)

    // Detectar complexidade
    const complexity = this.assessComplexity(userMessage, history)

    // Detectar intenções principais e secundárias
    const intents = this.detectIntents(lowerMessage)

    return {
      mainIntent: intents.main,
      subIntents: intents.sub,
      entities,
      sentiment,
      complexity
    }
  }

  /**
   * ETAPA 2: Raciocinar sobre Contexto
   */
  private async reasonAboutContext(
    interpretation: ReasoningResult['interpretation'],
    context: ReasoningContext
  ): Promise<ReasoningResult['reasoning']> {
    const thoughtProcess: string[] = []
    const relevantContext: string[] = []
    const connectionsFound: string[] = []
    const missingInformation: string[] = []

    // Processo de pensamento
    thoughtProcess.push(`Usuário quer: ${interpretation.mainIntent}`)

    if (interpretation.subIntents.length > 0) {
      thoughtProcess.push(`Também envolve: ${interpretation.subIntents.join(', ')}`)
    }

    // Analisar histórico de conversa
    if (context.conversationHistory.length > 0) {
      const recentContext = context.conversationHistory.slice(-3)
      const topics = recentContext.map(m => this.extractMainTopic(m.content))

      if (topics.length > 0) {
        relevantContext.push(`Tópicos recentes: ${topics.join(' → ')}`)
        thoughtProcess.push('Continuando conversa anterior')
      }
    }

    // Identificar conexões
    const { mainIntent, subIntents } = interpretation

    if (mainIntent.includes('financeiro')) {
      if (subIntents.some(s => s.includes('cliente'))) {
        connectionsFound.push('Financeiro + Cliente = Análise de recebíveis ou faturamento')
      }
      if (subIntents.some(s => s.includes('projeto') || s.includes('ordem'))) {
        connectionsFound.push('Financeiro + Projeto = Rentabilidade e custos')
      }
    }

    if (mainIntent.includes('documento')) {
      if (subIntents.some(s => s.includes('gerar') || s.includes('criar'))) {
        connectionsFound.push('Documento + Gerar = Sistema de geração de PDFs')
        thoughtProcess.push('Posso usar generateDocumentPDFUnified')
      }
    }

    if (mainIntent.includes('orçamento') || mainIntent.includes('proposta')) {
      connectionsFound.push('Relacionado a Ordem de Serviço')
      thoughtProcess.push('Dados estão em service_orders e service_order_items')
    }

    // Identificar informações faltantes
    const { entities } = interpretation

    if (mainIntent.includes('calcular') || mainIntent.includes('analisar')) {
      if (!entities.numbers || entities.numbers.length === 0) {
        missingInformation.push('Valores numéricos necessários')
      }
    }

    if (mainIntent.includes('cliente')) {
      if (!entities.names || entities.names.length === 0) {
        missingInformation.push('Nome ou identificação do cliente')
      }
    }

    return {
      thoughtProcess,
      relevantContext,
      connectionsFound,
      missingInformation
    }
  }

  /**
   * ETAPA 3: Consultar Dados Reais da Empresa (NOVO!)
   */
  private async queryRealData(
    interpretation: ReasoningResult['interpretation'],
    reasoning: ReasoningResult['reasoning'],
    userMessage: string
  ): Promise<DataQueryResult | undefined> {
    const { mainIntent, subIntents } = interpretation

    // Detectar se usuário está pedindo dados reais
    const isDataQuery =
      /quantos|quanto|qual|mostre|liste|busque|consulte|dados|informa[çc][õo]es/i.test(userMessage) ||
      mainIntent.includes('consulta') ||
      mainIntent.includes('análise de dados') ||
      mainIntent.includes('dashboard')

    if (!isDataQuery) {
      return undefined
    }

    try {
      // Usar query inteligente do DataService
      const result = await this.dataService.intelligentQuery(userMessage)

      if (result.success && result.data.length > 0) {
        return result
      }

      return undefined
    } catch (error) {
      console.error('Real data query error:', error)
      return undefined
    }
  }

  /**
   * ETAPA 4: Buscar Conhecimento Relevante
   */
  private async retrieveRelevantKnowledge(
    interpretation: ReasoningResult['interpretation'],
    reasoning: ReasoningResult['reasoning']
  ): Promise<any[]> {
    const { mainIntent, subIntents } = interpretation
    const allIntents = [mainIntent, ...subIntents]

    try {
      // Buscar na knowledge_base
      const keywords = this.extractSearchKeywords(allIntents)

      const { data: knowledge, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .or(keywords.map(k => `keywords.cs.{${k}}`).join(','))
        .limit(5)

      if (error) {
        console.error('Knowledge retrieval error:', error)
        return []
      }

      return knowledge || []
    } catch (error) {
      console.error('Knowledge search error:', error)
      return []
    }
  }

  /**
   * ETAPA 5: Formular Resposta Inteligente com Dados Reais
   */
  private async formulateResponse(
    interpretation: ReasoningResult['interpretation'],
    reasoning: ReasoningResult['reasoning'],
    knowledge: any[],
    context: ReasoningContext,
    realData?: DataQueryResult
  ): Promise<ReasoningResult['response']> {
    const { mainIntent } = interpretation
    const { missingInformation, connectionsFound } = reasoning

    // Se falta informação, pedir esclarecimento
    if (missingInformation.length > 0) {
      return {
        answer: this.generateClarificationRequest(interpretation, missingInformation),
        confidence: 0.7,
        shouldAskForClarification: true,
        suggestedFollowUps: []
      }
    }

    // PRIORIDADE: Se temos dados reais, usá-los!
    if (realData && realData.success) {
      return {
        answer: realData.summary,
        confidence: 0.95,
        shouldAskForClarification: false,
        suggestedFollowUps: realData.insights || [
          'Quer mais detalhes sobre algum item?',
          'Posso fazer outra análise?',
          'Precisa exportar esses dados?'
        ],
        actionableSteps: realData.insights
      }
    }

    // Construir resposta baseada no conhecimento
    let answer = ''
    let confidence = 0.8
    const suggestedFollowUps: string[] = []
    const actionableSteps: string[] = []

    // Resposta baseada em intenção
    if (mainIntent.includes('ajuda') || mainIntent.includes('como')) {
      answer = this.generateHelpResponse(interpretation, knowledge)
      suggestedFollowUps.push(
        'Quer ver um exemplo prático?',
        'Precisa de mais detalhes sobre algum passo?'
      )
    }

    else if (mainIntent.includes('calcular') || mainIntent.includes('analisar')) {
      answer = this.generateAnalyticalResponse(interpretation, reasoning, knowledge)
      confidence = 0.9
      actionableSteps.push(
        'Revisar os cálculos apresentados',
        'Comparar com períodos anteriores',
        'Implementar recomendações prioritárias'
      )
    }

    else if (mainIntent.includes('documento') || mainIntent.includes('pdf')) {
      answer = this.generateDocumentResponse(interpretation, knowledge)
      confidence = 0.95
      suggestedFollowUps.push(
        'Quer que eu gere um exemplo?',
        'Precisa personalizar o template?'
      )
    }

    else if (mainIntent.includes('problema') || mainIntent.includes('erro')) {
      answer = this.generateTroubleshootingResponse(interpretation, knowledge)
      confidence = 0.75
      actionableSteps.push(
        'Verificar logs de erro',
        'Testar em ambiente controlado',
        'Aplicar solução sugerida'
      )
    }

    else {
      // Resposta genérica inteligente
      answer = this.generateGenericIntelligentResponse(
        interpretation,
        reasoning,
        knowledge,
        context
      )
      confidence = 0.7
    }

    // Adicionar conexões encontradas
    if (connectionsFound.length > 0 && !answer.includes('Conexões')) {
      answer += `\n\n**Conexões relevantes:**\n${connectionsFound.map(c => `• ${c}`).join('\n')}`
    }

    // Adicionar fontes de conhecimento
    if (knowledge.length > 0 && !answer.includes('baseado em')) {
      answer += `\n\n*Resposta baseada em ${knowledge.length} fonte(s) de conhecimento interno.*`
    }

    return {
      answer,
      confidence,
      shouldAskForClarification: false,
      suggestedFollowUps,
      actionableSteps: actionableSteps.length > 0 ? actionableSteps : undefined
    }
  }

  /**
   * HELPERS: Detecção de Intenções
   */
  private detectIntents(message: string): { main: string; sub: string[] } {
    const intents: { [key: string]: RegExp } = {
      'ajuda/tutorial': /(como|ajuda|tutorial|ensina|explica|guia)/,
      'cálculo financeiro': /(calcul|margem|lucro|dso|markup|roi|rentabilidade)/,
      'análise de dados': /(analis|relat[oó]rio|estat[ií]stic|dashboard|indicador)/,
      'geração de documento': /(gera|cria|pdf|documento|orçamento|proposta|contrato)/,
      'consulta de cliente': /(cliente|customer|consumidor)/,
      'consulta de projeto': /(projeto|obra|ordem.*servi[cç]o|os\s)/,
      'consulta de estoque': /(estoque|material|invent[aá]rio|produto)/,
      'consulta de funcionário': /(funcion[aá]rio|colaborador|equipe|time)/,
      'problema/erro': /(problema|erro|bug|n[aã]o.*funciona|quebr)/,
      'configuração': /(config|ajust|personaliz)/,
      'estratégia de negócio': /(estrat[eé]gi|oportunidade|crescimento|expans[aã]o)/,
    }

    const detected: string[] = []

    for (const [intent, regex] of Object.entries(intents)) {
      if (regex.test(message)) {
        detected.push(intent)
      }
    }

    const main = detected[0] || 'conversa geral'
    const sub = detected.slice(1)

    return { main, sub }
  }

  /**
   * HELPERS: Extração de Entidades
   */
  private extractEntities(message: string): Record<string, any> {
    const entities: Record<string, any> = {}

    // Números
    const numbers = message.match(/\d+([.,]\d+)?/g)
    if (numbers) {
      entities.numbers = numbers.map(n => parseFloat(n.replace(',', '.')))
    }

    // Datas
    const dates = message.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/g)
    if (dates) {
      entities.dates = dates
    }

    // Emails
    const emails = message.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)
    if (emails) {
      entities.emails = emails
    }

    // Nomes próprios (palavras capitalizadas)
    const names = message.match(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/g)
    if (names && names.length > 0) {
      entities.names = names.filter(n => n.length > 2)
    }

    return entities
  }

  /**
   * HELPERS: Detecção de Sentimento
   */
  private detectSentiment(message: string): 'positive' | 'neutral' | 'negative' | 'urgent' {
    const urgent = /(urgente|imediato|r[aá]pido|agora|j[aá])/i
    if (urgent.test(message)) return 'urgent'

    const negative = /(problema|erro|ruim|péssimo|horrível|não funciona|quebrado)/i
    if (negative.test(message)) return 'negative'

    const positive = /(ótimo|excelente|perfeito|obrigado|valeu|top)/i
    if (positive.test(message)) return 'positive'

    return 'neutral'
  }

  /**
   * HELPERS: Avaliar Complexidade
   */
  private assessComplexity(
    message: string,
    history: Array<{ role: string; content: string }>
  ): 'simple' | 'moderate' | 'complex' {
    const words = message.split(/\s+/).length
    const hasMultipleQuestions = (message.match(/\?/g) || []).length > 1
    const hasNumbers = /\d/.test(message)
    const isFollowUp = history.length > 0

    if (words < 10 && !hasMultipleQuestions) {
      return 'simple'
    }

    if (words > 50 || hasMultipleQuestions || (hasNumbers && isFollowUp)) {
      return 'complex'
    }

    return 'moderate'
  }

  /**
   * HELPERS: Extrair Tópico Principal
   */
  private extractMainTopic(message: string): string {
    const topics = {
      'Finanças': /(financ|lucr|custo|receita|faturamento)/i,
      'Clientes': /(cliente|customer)/i,
      'Projetos': /(projeto|obra|ordem)/i,
      'Documentos': /(documento|pdf|orçamento|proposta)/i,
      'Estoque': /(estoque|material|produto)/i,
    }

    for (const [topic, regex] of Object.entries(topics)) {
      if (regex.test(message)) {
        return topic
      }
    }

    return 'Geral'
  }

  /**
   * HELPERS: Extrair Keywords para Busca
   */
  private extractSearchKeywords(intents: string[]): string[] {
    const keywords: string[] = []

    const intentKeywordMap: Record<string, string[]> = {
      'cálculo financeiro': ['financeiro', 'cálculo', 'margem', 'lucro'],
      'geração de documento': ['pdf', 'documento', 'gerador', 'template'],
      'consulta de cliente': ['cliente', 'customer'],
      'consulta de projeto': ['projeto', 'ordem', 'serviço'],
      'ajuda/tutorial': ['tutorial', 'guia', 'como usar'],
      'problema/erro': ['problema', 'erro', 'solução'],
    }

    for (const intent of intents) {
      const mapped = intentKeywordMap[intent]
      if (mapped) {
        keywords.push(...mapped)
      }
    }

    return [...new Set(keywords)] // Remove duplicatas
  }

  /**
   * GENERATORS: Respostas Específicas
   */
  private generateClarificationRequest(
    interpretation: ReasoningResult['interpretation'],
    missing: string[]
  ): string {
    const { mainIntent } = interpretation

    return `Entendi que você quer ${mainIntent}, mas preciso de mais informações:

${missing.map((m, i) => `${i + 1}. ${m}`).join('\n')}

Pode fornecer esses dados para eu te ajudar melhor?`
  }

  private generateHelpResponse(
    interpretation: ReasoningResult['interpretation'],
    knowledge: any[]
  ): string {
    if (knowledge.length > 0) {
      const mostRelevant = knowledge[0]
      return `**${mostRelevant.title}**

${mostRelevant.summary}

${mostRelevant.content.substring(0, 500)}...

Quer que eu detalhe algum ponto específico?`
    }

    return `Posso ajudar com isso! Sobre ${interpretation.mainIntent}, tenho conhecimento extenso.

O que especificamente você gostaria de saber?`
  }

  private generateAnalyticalResponse(
    interpretation: ReasoningResult['interpretation'],
    reasoning: ReasoningResult['reasoning'],
    knowledge: any[]
  ): string {
    return `Vou analisar isso para você.

**Meu raciocínio:**
${reasoning.thoughtProcess.map((t, i) => `${i + 1}. ${t}`).join('\n')}

**Contexto relevante:**
${reasoning.relevantContext.map(c => `• ${c}`).join('\n') || 'Nenhum contexto anterior'}

Baseado nessa análise, recomendo que você considere os seguintes pontos...`
  }

  private generateDocumentResponse(
    interpretation: ReasoningResult['interpretation'],
    knowledge: any[]
  ): string {
    const docKnowledge = knowledge.find(k =>
      k.keywords?.includes('pdf') || k.keywords?.includes('documento')
    )

    if (docKnowledge) {
      return `**Sistema de Documentos Giartech**

${docKnowledge.summary}

**Como usar:**
\`\`\`typescript
${docKnowledge.content.match(/```[\s\S]*?```/)?.[0] || 'Ver documentação completa'}
\`\`\`

Precisa de ajuda com algum passo específico?`
    }

    return `Para gerar documentos, nosso sistema usa o **Gerador PDF Unificado**.

Posso te ensinar como usar. Qual tipo de documento você precisa gerar?
• Orçamento
• Proposta
• Ordem de Serviço
• Contrato`
  }

  private generateTroubleshootingResponse(
    interpretation: ReasoningResult['interpretation'],
    knowledge: any[]
  ): string {
    return `Vamos resolver esse problema juntos.

**Análise inicial:**
${interpretation.mainIntent}

**Sentimento detectado:** ${interpretation.sentiment === 'urgent' ? '🚨 Urgente' : '⚠️ Requer atenção'}

**Passos para diagnóstico:**
1. Identificar a origem do problema
2. Verificar logs e mensagens de erro
3. Testar possíveis soluções
4. Aplicar correção

Pode me dar mais detalhes sobre o erro que está acontecendo?`
  }

  private generateGenericIntelligentResponse(
    interpretation: ReasoningResult['interpretation'],
    reasoning: ReasoningResult['reasoning'],
    knowledge: any[],
    context: ReasoningContext
  ): string {
    const { mainIntent, complexity } = interpretation
    const { thoughtProcess } = reasoning

    let response = `Entendi sua solicitação sobre ${mainIntent}.`

    if (complexity === 'complex') {
      response += `\n\nÉ uma questão complexa que envolve:\n${thoughtProcess.map(t => `• ${t}`).join('\n')}`
    }

    if (knowledge.length > 0) {
      response += `\n\nEncontrei ${knowledge.length} referência(s) relevante(s) na minha base de conhecimento.`
    }

    response += `\n\nComo posso ajudar especificamente? Pode detalhar um pouco mais sua necessidade?`

    return response
  }
}
