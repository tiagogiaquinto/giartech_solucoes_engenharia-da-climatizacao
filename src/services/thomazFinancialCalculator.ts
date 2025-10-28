/**
 * Thomaz Financial Calculator
 *
 * Calculadora financeira avançada com todos os indicadores empresariais
 * Implementa fórmulas, análises e recomendações estratégicas
 */

export interface FinancialData {
  receita?: number
  custosVariaveis?: number
  custosFixos?: number
  contasReceber?: number
  receitaMensal?: number
  custoVendas?: number
  estoqueInicial?: number
  estoqueFinal?: number
  lucroOperacional?: number
  depreciacao?: number
  amortizacao?: number
  precoVenda?: number
  custoUnitario?: number
}

export interface IndicatorResult {
  name: string
  value: number
  unit: string
  status: 'excellent' | 'good' | 'warning' | 'critical'
  target: number
  interpretation: string
  recommendations: string[]
}

export class ThomazFinancialCalculator {
  /**
   * MARGEM DE CONTRIBUIÇÃO
   * (Receita - Custos Variáveis) / Receita × 100
   */
  calculateMargin(data: FinancialData): IndicatorResult {
    const { receita = 0, custosVariaveis = 0 } = data

    if (receita === 0) {
      throw new Error('Receita não pode ser zero')
    }

    const margem = ((receita - custosVariaveis) / receita) * 100

    let status: IndicatorResult['status'] = 'critical'
    let interpretation = ''
    const recommendations: string[] = []

    if (margem >= 30) {
      status = 'excellent'
      interpretation = 'Margem excelente! Empresa bem posicionada para crescimento.'
    } else if (margem >= 25) {
      status = 'good'
      interpretation = 'Margem saudável. Continue monitorando.'
      recommendations.push('Buscar oportunidades de otimização de custos')
    } else if (margem >= 20) {
      status = 'warning'
      interpretation = 'Margem no limite. Atenção necessária.'
      recommendations.push('Revisar precificação dos 20% produtos mais vendidos')
      recommendations.push('Renegociar com 3 principais fornecedores')
    } else {
      status = 'critical'
      interpretation = 'Margem crítica! Ação imediata necessária.'
      recommendations.push('URGENTE: Revisar toda estrutura de custos e preços')
      recommendations.push('Congelar novos investimentos até estabilizar margem')
      recommendations.push('Analisar produtos/serviços não lucrativos')
    }

    if (margem < 30) {
      recommendations.push('Meta: alcançar 30% em 90 dias')
      recommendations.push('Reduzir retrabalho (meta: <5%)')
    }

    return {
      name: 'Margem de Contribuição',
      value: margem,
      unit: '%',
      status,
      target: 30,
      interpretation,
      recommendations
    }
  }

  /**
   * MARKUP
   * Preço de Venda / Custo
   */
  calculateMarkup(data: FinancialData): IndicatorResult {
    const { precoVenda = 0, custoUnitario = 0 } = data

    if (custoUnitario === 0) {
      throw new Error('Custo unitário não pode ser zero')
    }

    const markup = precoVenda / custoUnitario
    const margemEquivalente = ((markup - 1) / markup) * 100

    let status: IndicatorResult['status'] = 'critical'
    let interpretation = ''
    const recommendations: string[] = []

    if (markup >= 2.5) {
      status = 'excellent'
      interpretation = `Markup excelente (${markup.toFixed(2)}x). Margem equivalente: ${margemEquivalente.toFixed(1)}%`
    } else if (markup >= 2.0) {
      status = 'good'
      interpretation = `Markup bom (${markup.toFixed(2)}x). Margem equivalente: ${margemEquivalente.toFixed(1)}%`
    } else if (markup >= 1.5) {
      status = 'warning'
      interpretation = `Markup baixo (${markup.toFixed(2)}x). Margem equivalente: ${margemEquivalente.toFixed(1)}%`
      recommendations.push('Testar aumento de 10-15% nos preços')
      recommendations.push('Comparar com concorrência')
    } else {
      status = 'critical'
      interpretation = `Markup crítico (${markup.toFixed(2)}x). Margem equivalente: ${margemEquivalente.toFixed(1)}%`
      recommendations.push('URGENTE: Ajustar precificação imediatamente')
      recommendations.push('Risco de prejuízo operacional alto')
    }

    recommendations.push(`Meta: Markup entre 2.0x e 2.5x (Margem 50-60%)`)

    return {
      name: 'Markup',
      value: markup,
      unit: 'x',
      status,
      target: 2.0,
      interpretation,
      recommendations
    }
  }

  /**
   * EBITDA
   * Lucro Operacional + Depreciação + Amortização
   */
  calculateEBITDA(data: FinancialData): IndicatorResult {
    const {
      lucroOperacional = 0,
      depreciacao = 0,
      amortizacao = 0,
      receita = 1
    } = data

    const ebitda = lucroOperacional + depreciacao + amortizacao
    const ebitdaMargin = (ebitda / receita) * 100

    let status: IndicatorResult['status'] = 'critical'
    let interpretation = ''
    const recommendations: string[] = []

    if (ebitdaMargin >= 20) {
      status = 'excellent'
      interpretation = 'EBITDA excelente! Empresa muito eficiente operacionalmente.'
    } else if (ebitdaMargin >= 15) {
      status = 'good'
      interpretation = 'EBITDA saudável. Eficiência operacional adequada.'
    } else if (ebitdaMargin >= 10) {
      status = 'warning'
      interpretation = 'EBITDA baixo. Eficiência operacional precisa melhorar.'
      recommendations.push('Revisar processos operacionais')
      recommendations.push('Identificar desperdícios')
    } else {
      status = 'critical'
      interpretation = 'EBITDA crítico. Problemas sérios de eficiência.'
      recommendations.push('Auditoria operacional urgente')
      recommendations.push('Rever toda estrutura de custos fixos')
    }

    recommendations.push(`Meta: EBITDA > 15% da receita`)

    return {
      name: 'EBITDA',
      value: ebitda,
      unit: 'R$',
      status,
      target: receita * 0.15,
      interpretation,
      recommendations
    }
  }

  /**
   * DSO (Days Sales Outstanding)
   * (Contas a Receber / Receita Mensal) × 30
   */
  calculateDSO(data: FinancialData): IndicatorResult {
    const { contasReceber = 0, receitaMensal = 1 } = data

    const dso = (contasReceber / receitaMensal) * 30

    let status: IndicatorResult['status'] = 'critical'
    let interpretation = ''
    const recommendations: string[] = []

    if (dso <= 30) {
      status = 'excellent'
      interpretation = 'Cobrança excelente! Fluxo de caixa saudável.'
    } else if (dso <= 45) {
      status = 'good'
      interpretation = 'Cobrança adequada. Dentro do padrão.'
    } else if (dso <= 60) {
      status = 'warning'
      interpretation = 'Cobrança lenta. Impacto no fluxo de caixa.'
      recommendations.push('Oferecer 3-5% desconto para pagamento antecipado')
      recommendations.push('Intensificar follow-up de cobranças')
    } else {
      status = 'critical'
      interpretation = 'Cobrança crítica! Risco de inadimplência alto.'
      recommendations.push('URGENTE: Revisar política de crédito')
      recommendations.push('Implementar bloqueio automático após 30 dias')
      recommendations.push('Criar equipe dedicada de cobrança')
      recommendations.push('Considerar factoring/antecipação')
    }

    recommendations.push('Meta: DSO < 45 dias')
    recommendations.push(`Redução de 20% no DSO pode liberar R$ ${(contasReceber * 0.2).toFixed(2)} em caixa`)

    return {
      name: 'DSO (Prazo Médio de Recebimento)',
      value: dso,
      unit: 'dias',
      status,
      target: 45,
      interpretation,
      recommendations
    }
  }

  /**
   * GIRO DE ESTOQUE
   * Custo de Vendas / Estoque Médio
   */
  calculateInventoryTurnover(data: FinancialData): IndicatorResult {
    const { custoVendas = 0, estoqueInicial = 0, estoqueFinal = 0 } = data

    const estoqueMedio = (estoqueInicial + estoqueFinal) / 2

    if (estoqueMedio === 0) {
      throw new Error('Estoque médio não pode ser zero')
    }

    const giro = custoVendas / estoqueMedio

    let status: IndicatorResult['status'] = 'critical'
    let interpretation = ''
    const recommendations: string[] = []

    if (giro >= 8) {
      status = 'excellent'
      interpretation = 'Giro excelente! Estoque muito eficiente.'
    } else if (giro >= 6) {
      status = 'good'
      interpretation = 'Giro saudável. Gestão adequada de estoque.'
    } else if (giro >= 4) {
      status = 'warning'
      interpretation = 'Giro baixo. Capital parado em estoque.'
      recommendations.push('Reduzir níveis de estoque em 20%')
      recommendations.push('Identificar itens de baixo giro')
    } else {
      status = 'critical'
      interpretation = 'Giro crítico! Muito capital imobilizado.'
      recommendations.push('URGENTE: Promoção para reduzir estoque')
      recommendations.push('Rever política de compras')
      recommendations.push('Implementar just-in-time onde possível')
    }

    const diasEstoque = 365 / giro
    recommendations.push(`Meta: Giro > 6x/ano (estoque dura ${diasEstoque.toFixed(0)} dias)`)

    return {
      name: 'Giro de Estoque',
      value: giro,
      unit: 'x/ano',
      status,
      target: 6,
      interpretation,
      recommendations
    }
  }

  /**
   * PONTO DE EQUILÍBRIO
   * Custos Fixos / Margem de Contribuição %
   */
  calculateBreakEven(data: FinancialData): IndicatorResult {
    const { custosFixos = 0, receita = 1, custosVariaveis = 0 } = data

    const margemContribuicao = ((receita - custosVariaveis) / receita)

    if (margemContribuicao <= 0) {
      throw new Error('Margem de contribuição deve ser positiva')
    }

    const pontoEquilibrio = custosFixos / margemContribuicao

    let status: IndicatorResult['status'] = 'good'
    let interpretation = ''
    const recommendations: string[] = []

    const percentualAtual = (receita / pontoEquilibrio) * 100

    if (percentualAtual >= 150) {
      status = 'excellent'
      interpretation = `Excelente! Receita está ${percentualAtual.toFixed(0)}% acima do ponto de equilíbrio.`
    } else if (percentualAtual >= 120) {
      status = 'good'
      interpretation = `Bom! Receita está ${percentualAtual.toFixed(0)}% acima do ponto de equilíbrio.`
    } else if (percentualAtual >= 100) {
      status = 'warning'
      interpretation = `Atenção! Receita está apenas ${percentualAtual.toFixed(0)}% acima do ponto de equilíbrio.`
      recommendations.push('Aumentar margem de segurança')
      recommendations.push('Reduzir custos fixos se possível')
    } else {
      status = 'critical'
      interpretation = `CRÍTICO! Receita está ABAIXO do ponto de equilíbrio (${percentualAtual.toFixed(0)}%).`
      recommendations.push('URGENTE: Empresa está operando com prejuízo')
      recommendations.push('Ação imediata necessária')
    }

    recommendations.push(`Ponto de Equilíbrio: R$ ${pontoEquilibrio.toFixed(2)}/mês`)
    recommendations.push(`Meta: Manter receita 50% acima do ponto de equilíbrio`)

    return {
      name: 'Ponto de Equilíbrio',
      value: pontoEquilibrio,
      unit: 'R$/mês',
      status,
      target: pontoEquilibrio,
      interpretation,
      recommendations
    }
  }

  /**
   * ANÁLISE COMPLETA
   * Retorna todos os indicadores calculados
   */
  async analyzeComplete(data: FinancialData): Promise<{
    indicators: IndicatorResult[]
    overallScore: number
    overallStatus: 'excellent' | 'good' | 'warning' | 'critical'
    priorityActions: string[]
  }> {
    const indicators: IndicatorResult[] = []

    try {
      // Calcular todos indicadores possíveis
      if (data.receita && data.custosVariaveis) {
        indicators.push(this.calculateMargin(data))
      }

      if (data.precoVenda && data.custoUnitario) {
        indicators.push(this.calculateMarkup(data))
      }

      if (data.lucroOperacional !== undefined) {
        indicators.push(this.calculateEBITDA(data))
      }

      if (data.contasReceber && data.receitaMensal) {
        indicators.push(this.calculateDSO(data))
      }

      if (data.custoVendas && data.estoqueInicial !== undefined && data.estoqueFinal !== undefined) {
        indicators.push(this.calculateInventoryTurnover(data))
      }

      if (data.custosFixos && data.receita && data.custosVariaveis) {
        indicators.push(this.calculateBreakEven(data))
      }
    } catch (error) {
      console.error('Indicator calculation error:', error)
    }

    // Calcular score geral
    const statusScores = {
      excellent: 100,
      good: 75,
      warning: 50,
      critical: 25
    }

    const avgScore =
      indicators.reduce((sum, ind) => sum + statusScores[ind.status], 0) /
      indicators.length

    let overallStatus: 'excellent' | 'good' | 'warning' | 'critical' = 'critical'
    if (avgScore >= 90) overallStatus = 'excellent'
    else if (avgScore >= 70) overallStatus = 'good'
    else if (avgScore >= 50) overallStatus = 'warning'

    // Priorizar ações dos indicadores críticos
    const priorityActions = indicators
      .filter(ind => ind.status === 'critical' || ind.status === 'warning')
      .flatMap(ind => ind.recommendations)
      .slice(0, 5)

    return {
      indicators,
      overallScore: avgScore,
      overallStatus,
      priorityActions
    }
  }
}
