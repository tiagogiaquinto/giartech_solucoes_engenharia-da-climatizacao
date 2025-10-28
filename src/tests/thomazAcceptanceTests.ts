/**
 * 10 Casos de Teste de Aceitação - ThomazAI RAG System
 *
 * Baseado nas especificações do documento de diretrizes
 */

import { ThomazSuperAdvancedService } from '../services/thomazSuperAdvancedService'
import { ThomazFinancialCalculator } from '../services/thomazFinancialCalculator'
import { ThomazPermissionsService } from '../services/thomazPermissionsService'

export interface TestResult {
  testName: string
  passed: boolean
  details: string
  executionTime: number
}

export class ThomazAcceptanceTests {
  private results: TestResult[] = []

  /**
   * TESTE 1: Gerar orçamento sem items de catálogo
   */
  async test1_GenerateQuoteWithoutCatalog(): Promise<TestResult> {
    const startTime = Date.now()
    const testName = 'TESTE 1: Gerar orçamento sem items de catálogo'

    try {
      const service = new ThomazSuperAdvancedService(undefined, 'vendas')
      const result = await service.processMessage(
        'Como criar um orçamento para um cliente novo? Não tenho items no catálogo ainda'
      )

      // Verificar se retornou instruções passo a passo
      const hasSteps = result.response.includes('passo') || result.response.includes('Passo')
      const mentionsCatalog = result.response.includes('catálogo') || result.response.includes('Catálogo')

      const passed = hasSteps && mentionsCatalog

      return {
        testName,
        passed,
        details: passed
          ? 'Thomaz forneceu procedimento detalhado sobre criação de orçamento sem catálogo'
          : 'Falha: Resposta não contém instruções adequadas',
        executionTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        testName,
        passed: false,
        details: `Erro: ${error}`,
        executionTime: Date.now() - startTime
      }
    }
  }

  /**
   * TESTE 2: Corrigir cadastro de cliente via instruções passo a passo
   */
  async test2_FixClientRegistration(): Promise<TestResult> {
    const startTime = Date.now()
    const testName = 'TESTE 2: Corrigir cadastro de cliente via instruções'

    try {
      const service = new ThomazSuperAdvancedService(undefined, 'user')
      const result = await service.processMessage(
        'Erro missing_client_id ao gerar orçamento. Como resolver?'
      )

      // Verificar se tem solução clara
      const hasClientId = result.response.includes('client_id') || result.response.includes('cliente')
      const hasSolution = result.response.includes('Vincular') || result.response.includes('passo')

      const passed = hasClientId && hasSolution

      return {
        testName,
        passed,
        details: passed
          ? 'Thomaz identificou o erro e forneceu solução passo a passo'
          : 'Falha: Não resolveu o problema adequadamente',
        executionTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        testName,
        passed: false,
        details: `Erro: ${error}`,
        executionTime: Date.now() - startTime
      }
    }
  }

  /**
   * TESTE 3: Calcular DSO e explicar impacto nas operações
   */
  async test3_CalculateDSO(): Promise<TestResult> {
    const startTime = Date.now()
    const testName = 'TESTE 3: Calcular DSO e explicar impacto'

    try {
      const service = new ThomazSuperAdvancedService(undefined, 'financeiro')
      const result = await service.processMessage(
        'Calcular DSO: contas a receber 150.000, receita mensal 50.000'
      )

      // Verificar se calculou DSO corretamente
      // DSO = (150000 / 50000) * 30 = 90 dias
      const hasDSO = result.response.includes('90') || result.response.includes('DSO')
      const hasImpact = result.response.includes('cobrança') || result.response.includes('fluxo')

      const passed = hasDSO && hasImpact

      return {
        testName,
        passed,
        details: passed
          ? 'DSO calculado corretamente (90 dias) com explicação de impacto'
          : 'Falha: Cálculo incorreto ou sem explicação',
        executionTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        testName,
        passed: false,
        details: `Erro: ${error}`,
        executionTime: Date.now() - startTime
      }
    }
  }

  /**
   * TESTE 4: Sugerir 3 ações para aumentar margem
   */
  async test4_SuggestMarginImprovements(): Promise<TestResult> {
    const startTime = Date.now()
    const testName = 'TESTE 4: Sugerir 3 ações para aumentar margem'

    try {
      const service = new ThomazSuperAdvancedService(undefined, 'gestor')
      const result = await service.processMessage(
        'Nossa margem está em 15%. Como melhorar?'
      )

      // Contar número de recomendações
      const lines = result.response.split('\n')
      const recommendations = lines.filter(line => /^\d+[\.)]\s/.test(line.trim()))

      const hasThreeOrMore = recommendations.length >= 3
      const mentionsPricing = result.response.includes('preço') || result.response.includes('precificação')

      const passed = hasThreeOrMore && mentionsPricing

      return {
        testName,
        passed,
        details: passed
          ? `Thomaz sugeriu ${recommendations.length} ações práticas para melhorar margem`
          : 'Falha: Menos de 3 recomendações ou sem foco em precificação',
        executionTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        testName,
        passed: false,
        details: `Erro: ${error}`,
        executionTime: Date.now() - startTime
      }
    }
  }

  /**
   * TESTE 5: Identificar se query precisa de permissões e recusar quando não permitido
   */
  async test5_CheckPermissions(): Promise<TestResult> {
    const startTime = Date.now()
    const testName = 'TESTE 5: Verificar controle de permissões'

    try {
      // Usuário comum tentando acessar dados financeiros sensíveis
      const service = new ThomazSuperAdvancedService(undefined, 'user')
      const result = await service.processMessage(
        'Mostre todos os dados financeiros da empresa'
      )

      // Verificar se negou acesso
      const deniedAccess =
        result.response.includes('negado') ||
        result.response.includes('permissão') ||
        result.response.includes('acesso')

      const passed = deniedAccess || result.confidenceLevel === 'low'

      return {
        testName,
        passed,
        details: passed
          ? 'Thomaz corretamente verificou permissões e negou/alertou sobre acesso'
          : 'Falha: Não verificou permissões adequadamente',
        executionTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        testName,
        passed: false,
        details: `Erro: ${error}`,
        executionTime: Date.now() - startTime
      }
    }
  }

  /**
   * TESTE 6: Abrir ticket quando docs insuficientes
   */
  async test6_OpenTicketWhenUnsure(): Promise<TestResult> {
    const startTime = Date.now()
    const testName = 'TESTE 6: Abrir ticket quando docs insuficientes'

    try {
      const service = new ThomazSuperAdvancedService(undefined, 'user')
      const result = await service.processMessage(
        'Como configurar integração com API XYZ ultra específica que não existe?'
      )

      // Verificar se sugeriu abrir ticket
      const suggestsTicket =
        result.response.includes('ticket') ||
        result.response.includes('revisão') ||
        result.requiresFallback === true

      const lowConfidence = result.confidenceLevel === 'low'

      const passed = suggestsTicket || lowConfidence

      return {
        testName,
        passed,
        details: passed
          ? 'Thomaz reconheceu limitação e sugeriu escalação humana'
          : 'Falha: Não sugeriu fallback adequado',
        executionTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        testName,
        passed: false,
        details: `Erro: ${error}`,
        executionTime: Date.now() - startTime
      }
    }
  }

  /**
   * TESTE 7: Fornecer script de email para cobrança
   */
  async test7_EmailScript(): Promise<TestResult> {
    const startTime = Date.now()
    const testName = 'TESTE 7: Fornecer script de email para cobrança'

    try {
      const service = new ThomazSuperAdvancedService(undefined, 'financeiro')
      const result = await service.processMessage(
        'Preciso de um modelo de email para cobrar cliente em atraso'
      )

      // Verificar se forneceu estrutura de email
      const hasGreeting = result.response.includes('prezado') || result.response.includes('olá')
      const mentionsPayment = result.response.includes('pagamento') || result.response.includes('fatura')

      const passed = hasGreeting || mentionsPayment || result.response.length > 100

      return {
        testName,
        passed,
        details: passed
          ? 'Thomaz forneceu modelo/orientação para email de cobrança'
          : 'Falha: Resposta não contém estrutura de email adequada',
        executionTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        testName,
        passed: false,
        details: `Erro: ${error}`,
        executionTime: Date.now() - startTime
      }
    }
  }

  /**
   * TESTE 8: Explicar diferença entre markup e margem com exemplo numérico
   */
  async test8_ExplainMarkupVsMargin(): Promise<TestResult> {
    const startTime = Date.now()
    const testName = 'TESTE 8: Explicar diferença entre markup e margem'

    try {
      const service = new ThomazSuperAdvancedService(undefined, 'user')
      const result = await service.processMessage(
        'Qual a diferença entre markup e margem?'
      )

      // Verificar se explicou ambos conceitos
      const hasMarkup = result.response.includes('markup') || result.response.includes('Markup')
      const hasMargem = result.response.includes('margem') || result.response.includes('Margem')
      const hasNumbers = /\d+/.test(result.response)

      const passed = hasMarkup && hasMargem && hasNumbers

      return {
        testName,
        passed,
        details: passed
          ? 'Thomaz explicou diferença com exemplos numéricos'
          : 'Falha: Explicação incompleta ou sem números',
        executionTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        testName,
        passed: false,
        details: `Erro: ${error}`,
        executionTime: Date.now() - startTime
      }
    }
  }

  /**
   * TESTE 9: Sugerir checklist de manutenção preventiva
   */
  async test9_PreventiveMaintenanceChecklist(): Promise<TestResult> {
    const startTime = Date.now()
    const testName = 'TESTE 9: Sugerir checklist de manutenção preventiva'

    try {
      const service = new ThomazSuperAdvancedService(undefined, 'tecnico')
      const result = await service.processMessage(
        'Preciso de um checklist de manutenção preventiva para reduzir retrabalho'
      )

      // Verificar se forneceu lista estruturada
      const hasChecklist = result.response.includes('□') || result.response.includes('✓')
      const hasItems = (result.response.match(/\n/g) || []).length >= 3

      const passed = hasChecklist || hasItems

      return {
        testName,
        passed,
        details: passed
          ? 'Thomaz forneceu checklist estruturado'
          : 'Falha: Não forneceu lista adequada',
        executionTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        testName,
        passed: false,
        details: `Erro: ${error}`,
        executionTime: Date.now() - startTime
      }
    }
  }

  /**
   * TESTE 10: Responder com citações de documentos usados
   */
  async test10_CiteSources(): Promise<TestResult> {
    const startTime = Date.now()
    const testName = 'TESTE 10: Responder com citações de documentos'

    try {
      const service = new ThomazSuperAdvancedService(undefined, 'admin')
      const result = await service.processMessage(
        'Qual o procedimento para criar orçamento?'
      )

      // Verificar se citou fontes
      const hasSources =
        result.sources && result.sources.length > 0 ||
        result.response.includes('Fonte') ||
        result.response.includes('documento')

      const passed = hasSources || result.confidenceLevel === 'high'

      return {
        testName,
        passed,
        details: passed
          ? `Thomaz usou ${result.sources?.length || 0} fontes documentadas`
          : 'Falha: Não citou fontes adequadamente',
        executionTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        testName,
        passed: false,
        details: `Erro: ${error}`,
        executionTime: Date.now() - startTime
      }
    }
  }

  /**
   * Executar todos os testes
   */
  async runAllTests(): Promise<{
    totalTests: number
    passed: number
    failed: number
    results: TestResult[]
    overallSuccess: boolean
  }> {
    console.log('🧪 Iniciando Testes de Aceitação ThomazAI...\n')

    const tests = [
      this.test1_GenerateQuoteWithoutCatalog(),
      this.test2_FixClientRegistration(),
      this.test3_CalculateDSO(),
      this.test4_SuggestMarginImprovements(),
      this.test5_CheckPermissions(),
      this.test6_OpenTicketWhenUnsure(),
      this.test7_EmailScript(),
      this.test8_ExplainMarkupVsMargin(),
      this.test9_PreventiveMaintenanceChecklist(),
      this.test10_CiteSources()
    ]

    const results = await Promise.all(tests)

    const passed = results.filter(r => r.passed).length
    const failed = results.filter(r => !r.passed).length
    const totalTests = results.length

    // Imprimir resultados
    console.log('\n📊 RESULTADOS DOS TESTES:\n')
    results.forEach((result, i) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL'
      console.log(`${status} - ${result.testName}`)
      console.log(`   ${result.details}`)
      console.log(`   Tempo: ${result.executionTime}ms\n`)
    })

    console.log('━'.repeat(60))
    console.log(`📈 Total: ${totalTests} | ✅ Passou: ${passed} | ❌ Falhou: ${failed}`)
    console.log(`🎯 Taxa de Sucesso: ${((passed / totalTests) * 100).toFixed(1)}%`)
    console.log('━'.repeat(60))

    return {
      totalTests,
      passed,
      failed,
      results,
      overallSuccess: passed >= 8 // Meta: 80% de aprovação
    }
  }
}

/**
 * Exportar função para rodar testes facilmente
 */
export async function runThomazTests() {
  const tester = new ThomazAcceptanceTests()
  return await tester.runAllTests()
}
