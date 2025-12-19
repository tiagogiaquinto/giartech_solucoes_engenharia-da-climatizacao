# Como Configurar a IA do Thomaz

## 🎯 O Problema que Você Está Enfrentando

Se o Thomaz não está respondendo naturalmente (exemplo: você diz "boa noite" e ele não responde adequadamente), é porque **ele precisa de uma API key de IA configurada**.

Sem a API key, o Thomaz usa apenas respostas pré-programadas básicas. Com a API, ele conversa REALMENTE de forma natural usando modelos de IA avançados.

---

## ✅ Solução: Configurar API Key (2 minutos)

### Opção 1: OpenRouter (Recomendado - Fácil e Barato)

O OpenRouter dá acesso a vários modelos de IA (Claude, GPT-4, Gemini) através de uma única API.

**Passo 1: Obter API Key do OpenRouter**

1. Acesse: https://openrouter.ai/
2. Clique em "Sign In" (pode usar conta Google/GitHub)
3. Vá em "Keys" no menu
4. Clique em "Create Key"
5. Copie a key (começa com `sk-or-v1-...`)

**Passo 2: Adicionar a Key no Sistema**

Execute este SQL no Supabase:

```sql
-- Atualizar o provedor OpenRouter com sua API key
UPDATE ai_providers
SET
  api_key = 'SUA_API_KEY_AQUI',
  active = true
WHERE provider_type = 'openrouter';
```

**Exemplo:**
```sql
UPDATE ai_providers
SET
  api_key = 'sk-or-v1-abc123def456...',
  active = true
WHERE provider_type = 'openrouter';
```

**Pronto!** O Thomaz agora usa IA real para conversar!

---

### Opção 2: Anthropic (Claude - Melhor Qualidade)

Se você quer usar Claude diretamente:

**Passo 1: Obter API Key**

1. Acesse: https://console.anthropic.com/
2. Crie uma conta
3. Vá em "API Keys"
4. Crie uma nova key
5. Copie a key (começa com `sk-ant-...`)

**Passo 2: Configurar no Sistema**

```sql
-- Desativar OpenRouter
UPDATE ai_providers SET active = false WHERE provider_type = 'openrouter';

-- Ativar Anthropic com sua key
UPDATE ai_providers
SET
  api_key = 'SUA_API_KEY_ANTHROPIC',
  active = true
WHERE provider_type = 'anthropic';
```

---

### Opção 3: OpenAI (GPT-4)

**Passo 1: Obter API Key**

1. Acesse: https://platform.openai.com/
2. Faça login
3. Vá em "API Keys"
4. Crie uma nova key
5. Copie a key (começa com `sk-...`)

**Passo 2: Configurar no Sistema**

```sql
-- Desativar outros provedores
UPDATE ai_providers SET active = false;

-- Ativar OpenAI com sua key
UPDATE ai_providers
SET
  api_key = 'SUA_API_KEY_OPENAI',
  active = true
WHERE provider_type = 'openai';
```

---

## 💰 Custos (Muito Baixo)

### OpenRouter (Recomendado para começar)

- **Claude 3.5 Sonnet:** $3 por 1 milhão de tokens
- **GPT-4 Turbo:** $10 por 1 milhão de tokens
- **Gemini Pro:** $0.50 por 1 milhão de tokens

**Na prática:**
- 1 conversa = ~500 tokens
- 2000 conversas = ~$1.50
- Custo por conversa: menos de $0.001 (menos de 1 centavo)

### Anthropic Claude Direto

- **Claude 3.5 Sonnet:** $3 / 1M tokens input, $15 / 1M tokens output
- Mesma economia, mas precisa de mais crédito inicial

### OpenAI GPT-4

- **GPT-4 Turbo:** $10 / 1M tokens input, $30 / 1M tokens output
- Mais caro, mas ainda acessível

---

## 🧪 Como Testar

Depois de configurar a API key:

1. **Limpe o cache do navegador** (Ctrl+Shift+Delete)
2. Recarregue a página (F5)
3. Abra o chat do Thomaz
4. Digite: **"Boa noite"**

**Resposta esperada COM IA:**
```
Boa noite! 👋 Como posso ajudar você hoje?

Posso te auxiliar com análises de estoque, financeiro,
ordens de serviço ou clientes. O que você gostaria de saber?
```

**Resposta SEM IA (antiga):**
```
Olá! Como posso ajudar?
```

5. Teste conversa natural: **"Como está indo o negócio?"**

O Thomaz agora vai analisar seus dados e responder de forma inteligente!

---

## 🔍 Verificar se Está Funcionando

### Método 1: Pelo Console do Navegador

1. Abra o chat do Thomaz
2. Pressione F12 (DevTools)
3. Vá na aba "Console"
4. Envie uma mensagem
5. Procure por: `✅ Response received from AI`

Se aparecer isso, está funcionando!

### Método 2: Pelo Banco de Dados

```sql
-- Ver qual provedor está ativo
SELECT name, provider_type, active,
       CASE WHEN api_key IS NOT NULL THEN '✅ Configurado' ELSE '❌ Sem API Key' END as status
FROM ai_providers
ORDER BY priority;
```

---

## 🎨 O Que Muda Com a IA Configurada

### Antes (Sem API Key) ❌

**Você:** "Boa noite"
**Thomaz:** "Olá! Como posso ajudar?"

**Você:** "Como está o estoque?"
**Thomaz:** [Tabela com dados frios]

**Você:** "Será que devo contratar mais um técnico?"
**Thomaz:** [Sem resposta ou resposta genérica]

### Depois (Com API Key) ✅

**Você:** "Boa noite"
**Thomaz:** "Boa noite! 👋 Como foi seu dia? Posso te ajudar com algo sobre o negócio?"

**Você:** "Como está o estoque?"
**Thomaz:** "Deixa eu te contar sobre seu estoque! 📦

Olha, você tem 5 itens ZERADOS que precisam de atenção urgente:
1. Instalação de bomba de dreno
2. Limpeza de filtros
...

Quer que eu gere uma lista de compras prioritária para você?"

**Você:** "Será que devo contratar mais um técnico?"
**Thomaz:** "Ótima pergunta! Vamos analisar juntos! 🤔

Olhando sua operação:
- 15 OS em andamento
- Taxa de conclusão: 82% (um pouco abaixo do ideal de 85%+)
- Tempo médio: 3,5 dias

**Minha recomendação:** SIM! Com base nos números, contratar mais um técnico pode:
- Melhorar a taxa de conclusão
- Reduzir tempo de espera
- Aumentar capacidade em 33%

Quer ver uma projeção de ROI dessa contratação?"

---

## 🆘 Problemas Comuns

### "Não tenho cartão de crédito para API"

**Solução:** Use OpenRouter com crédito grátis inicial!
- OpenRouter dá alguns créditos grátis para testar
- Você pode testar o Thomaz sem gastar nada

### "Erro: API key inválida"

**Causas:**
1. API key copiada errada (tem espaço no início/fim?)
2. API key não está ativa no provedor
3. Provedor bloqueado por falta de crédito

**Solução:**
```sql
-- Verificar key cadastrada
SELECT provider_type,
       substring(api_key, 1, 20) as key_inicio,
       active
FROM ai_providers;
```

Se a key estiver errada, atualize:
```sql
UPDATE ai_providers
SET api_key = 'SUA_KEY_CORRETA_AQUI'
WHERE provider_type = 'openrouter';
```

### "Thomaz ainda responde igual"

**Solução:**
1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Recarregue a página (F5 ou Ctrl+R)
3. Teste novamente

### "Erro ao chamar edge function"

**Verificar:**
```sql
-- Edge function está deployada?
-- Veja no console do Supabase em "Edge Functions"
```

Se não estiver, rode no terminal:
```bash
supabase functions deploy thomaz-chat
```

---

## 🚀 Recomendação Final

**Para começar (Mais fácil):**

1. Use **OpenRouter** com modelo **Claude 3.5 Sonnet**
2. Crie conta em https://openrouter.ai/
3. Copie a API key
4. Execute o UPDATE no banco
5. Limpe cache e teste

**Custo estimado:** ~$5/mês para uso moderado (500-1000 conversas/mês)

---

## 📊 Comparação de Modelos

| Modelo | Qualidade | Velocidade | Custo | Recomendado Para |
|--------|-----------|------------|-------|------------------|
| Claude 3.5 Sonnet | ⭐⭐⭐⭐⭐ | ⚡⚡⚡⚡ | 💰💰 | **USO GERAL** |
| GPT-4 Turbo | ⭐⭐⭐⭐ | ⚡⚡⚡ | 💰💰💰 | Análises complexas |
| Gemini Pro 1.5 | ⭐⭐⭐⭐ | ⚡⚡⚡⚡⚡ | 💰 | Alta performance |
| Llama 3.1 70B | ⭐⭐⭐ | ⚡⚡⚡⚡ | 💰 | Custo baixo |

**Recomendação:** Comece com **Claude 3.5 Sonnet** via OpenRouter

---

## ✅ Checklist Rápido

- [ ] Criar conta no OpenRouter
- [ ] Copiar API key
- [ ] Executar UPDATE no banco
- [ ] Limpar cache do navegador
- [ ] Recarregar página
- [ ] Testar com "Boa noite"
- [ ] Verificar resposta natural
- [ ] Testar conversa complexa

---

**Tempo total de configuração: 2-5 minutos**

**Depois disso, o Thomaz conversa REALMENTE de forma natural! 🎉**

---

## 📞 SQL para Configuração Rápida

```sql
-- COPIE E COLE ISSO (substitua SUA_KEY pela key real):

UPDATE ai_providers
SET
  api_key = 'SUA_KEY_OPENROUTER_AQUI',
  active = true
WHERE provider_type = 'openrouter';

-- Verificar se funcionou:
SELECT * FROM get_active_ai_provider();
```

Pronto! 🚀
