# 🧠 Thomaz Ultra - Guia Completo de Uso

## Como Testar as Novas Capacidades AGORA

### 1. Teste no Console do Navegador (F12)

Abra o console e execute estes comandos para ver as capacidades em ação:

```javascript
// Importar o serviço
import ThomazSuperAdvancedService from './services/thomazSuperAdvancedService'
const thomaz = new ThomazSuperAdvancedService()

// ====================================
// TESTE 1: Análise de Saúde do Negócio
// ====================================
const health = await thomaz.analyzeBusinessHealth()
console.log('📊 SAÚDE DO NEGÓCIO:', health)
console.log('Score Geral:', health.overallScore, '/ 100')
console.log('Classificação:', health.scoreLabel)
console.log('🚨 Problemas Críticos:', health.criticalIssues)
console.log('💡 Oportunidades:', health.opportunities)

// ====================================
// TESTE 2: Fazer Pergunta Inteligente
// ====================================
const result = await thomaz.sendMessage('Como está minha situação financeira?')
console.log('🤖 RESPOSTA THOMAZ:', result.response)
console.log('🧠 RACIOCÍNIO (', result.reasoning.steps.length, 'etapas):')
result.reasoning.steps.forEach(step => {
  console.log(`  ${step.step}. ${step.thought} (${(step.confidence * 100).toFixed(0)}% confiança)`)
})
console.log('✅ RECOMENDAÇÕES:', result.reasoning.recommendations)
console.log('📚 FONTES:', result.reasoning.sources)

// ====================================
// TESTE 3: Insights Proativos
// ====================================
const insights = await thomaz.generateProactiveInsights({})
console.log('💡 INSIGHTS PROATIVOS GERADOS:', insights.length)
insights.forEach(insight => {
  const icon = insight.type === 'alert' ? '🚨' : '💡'
  console.log(`${icon} [${insight.severity}] ${insight.title}:`, insight.description)
  if (insight.suggestedAction) {
    console.log('   → Ação sugerida:', insight.suggestedAction)
  }
})

// ====================================
// TESTE 4: Previsão de Receitas
// ====================================
const prediction = await thomaz.predictFutureMetrics('receita', 30)
console.log('🔮 PREVISÃO DE RECEITA (30 dias):', prediction)
console.log('Tendência:', prediction.trend)
console.log('Confiança:', (prediction.confidence * 100).toFixed(0), '%')
```

### 2. Testar Via Supabase SQL

Execute estas queries diretamente no Supabase para ver os dados:

```sql
-- Ver estatísticas de aprendizado do Thomaz
SELECT * FROM get_thomaz_learning_stats();

-- Ver score de saúde do negócio
SELECT * FROM calculate_business_health_score();

-- Ver insights proativos gerados
SELECT
  insight_type,
  severity,
  title,
  description,
  status,
  created_at
FROM thomaz_proactive_insights
ORDER BY created_at DESC
LIMIT 10;

-- Ver ações sugeridas
SELECT
  action_title,
  priority,
  category,
  status,
  created_at
FROM thomaz_suggested_actions
ORDER BY
  CASE priority
    WHEN 'high' THEN 1
    WHEN 'medium' THEN 2
    ELSE 3
  END,
  created_at DESC
LIMIT 10;

-- Ver feedback de aprendizado
SELECT
  query,
  helpful,
  created_at
FROM thomaz_learning_feedback
ORDER BY created_at DESC
LIMIT 20;
```

### 3. Exemplos de Perguntas Poderosas

Faça estas perguntas ao Thomaz e veja a diferença:

#### Perguntas Financeiras:
- "Como está minha margem de lucro?"
- "Quais são minhas maiores despesas este mês?"
- "Tenho dinheiro suficiente em caixa?"
- "Qual minha receita prevista para próximo mês?"

#### Perguntas Operacionais:
- "Quantas OS estão atrasadas?"
- "Qual a taxa de conclusão das ordens de serviço?"
- "Quais são os gargalos operacionais?"
- "Como melhorar a eficiência da equipe?"

#### Perguntas sobre Clientes:
- "Quantos clientes estão em risco?"
- "Quem são meus melhores clientes?"
- "Como aumentar a retenção de clientes?"
- "Quais clientes devo contatar hoje?"

#### Perguntas sobre Estoque:
- "Quais itens precisam de reposição?"
- "Tenho estoque suficiente para esta semana?"
- "Qual o valor total do meu estoque?"
- "Quais itens estão parados há mais tempo?"

### 4. API de Integração

Você pode integrar o Thomaz em qualquer lugar do sistema:

```typescript
// Em qualquer componente React
import { sendMessage } from '@/services/thomazSuperAdvancedService'

const handleAskThomaz = async (question: string) => {
  const result = await sendMessage(question, userId)

  // Mostrar resposta
  setResponse(result.response)

  // Mostrar ações sugeridas
  if (result.suggestedActions?.length > 0) {
    setActions(result.suggestedActions)
  }

  // Mostrar nível de confiança
  setConfidence(result.confidence)

  // Ver raciocínio completo (debug)
  console.log('Raciocínio:', result.reasoning)
}
```

## Diferenças Visíveis vs Thomaz Antigo

### ANTES (Thomaz Básico):
```
Usuário: "Como está meu financeiro?"
Thomaz: "Desculpe, não tenho essa informação."
```

### DEPOIS (Thomaz Ultra):
```
Usuário: "Como está meu financeiro?"

Thomaz: **Análise Completa: Como está meu financeiro?**

**📊 Raciocínio (4 etapas):**
1. Analisando intenção do usuário e identificando tipo de pergunta (Confiança: 95%)
2. Pergunta classificada como: financial. Coletando dados relevantes. (Confiança: 90%)
3. Realizando análise profunda dos dados coletados (Confiança: 88%)
4. Gerando insights e recomendações acionáveis (Confiança: 92%)

**💡 Insights e Recomendações:**
• ✅ Margem saudável! Considere investir em crescimento ou reserva de caixa.
• Margem atual: 32.5%
• Total em receitas: R$ 45.820,00
• Total em despesas: R$ 30.928,50
• Saldo positivo: R$ 14.891,50

**📚 Fontes Consultadas:**
• Análise de Finance Entries (últimos 30 dias)
• KPIs do Dashboard Executivo

**🎯 Próximas Ações:**
• Revisar maiores despesas do mês
• Considerar investimento em marketing
• Manter reserva de emergência de 3 meses

**🔔 Insights Proativos:**
🚨 Itens com estoque baixo: 3 itens precisam de reposição urgente
💡 Clientes em risco: 5 clientes podem ser reativados
📊 Crescimento detectado: 12 OS concluídas esta semana (Ticket médio: R$ 3.820,00)
```

## Métricas de Melhoria

| Capacidade | Antes | Depois |
|------------|-------|--------|
| Análise de dados | ❌ Não | ✅ 6 tipos de análise |
| Raciocínio explicado | ❌ Não | ✅ Multi-etapa com confiança |
| Insights proativos | ❌ Não | ✅ 4 tipos automáticos |
| Previsões | ❌ Não | ✅ 30 dias à frente |
| Ações sugeridas | ❌ Não | ✅ Priorizadas automaticamente |
| Aprendizado | ❌ Não | ✅ Feedback loop ativo |
| Cache de performance | ❌ Não | ✅ 1 hora de cache |
| Consulta ao banco | ❌ Limitada | ✅ Acesso completo integrado |

## Próximos Passos

1. **Teste imediatamente** usando os comandos acima
2. **Veja os dados** nas tabelas do Supabase
3. **Faça perguntas** complexas ao Thomaz
4. **Compare** com o comportamento anterior
5. **Dê feedback** para o sistema aprender

## Suporte

Se algo não funcionar, verifique:
- Console do navegador (F12) para erros
- Conexão com Supabase está ativa
- Tabelas foram criadas corretamente
- Edge functions estão deployadas

Execute este teste rápido:
```javascript
// Teste de conectividade
import { supabase } from './lib/supabase'
const { data, error } = await supabase.from('thomaz_proactive_insights').select('*').limit(1)
console.log('Thomaz conectado:', !error)
```
