# 🔑 Guia de Configuração da API Key do Thomaz AI

## 🎯 Objetivo

Configurar uma chave de API para que o Thomaz possa usar modelos de IA externos (Claude, GPT, etc.) e fornecer análises ainda mais elaboradas.

---

## ⚡ Início Rápido (5 minutos)

### 1️⃣ Criar Conta no OpenRouter (Recomendado)

**Por que OpenRouter?**
- ✅ Acesso a múltiplos modelos (Claude, GPT, Gemini, etc.)
- ✅ Preços competitivos
- ✅ Sem compromisso de pagamento mensal
- ✅ Pay-as-you-go (pague apenas o que usar)
- ✅ Créditos grátis para testar

**Como criar:**
1. Acesse: https://openrouter.ai
2. Clique em "Sign Up" (canto superior direito)
3. Use sua conta Google/GitHub ou crie com email
4. Confirme seu email

### 2️⃣ Obter sua API Key

1. Faça login no OpenRouter
2. Vá em: https://openrouter.ai/keys
3. Clique em "Create Key"
4. Dê um nome: "Thomaz AI - Giartech"
5. Copie a chave gerada (começa com `sk-or-v1-...`)

⚠️ **IMPORTANTE:** Guarde essa chave em local seguro. Não será possível vê-la novamente!

### 3️⃣ Adicionar Créditos (Opcional mas Recomendado)

1. Vá em: https://openrouter.ai/credits
2. Adicione US$ 5-10 para começar
3. É suficiente para milhares de conversas

💡 **Custo estimado:**
- Claude 3.5 Sonnet: ~$0.003 por mensagem
- Com $10, você tem ~3.300 mensagens

---

## ⚙️ Configurar no Sistema

### Opção A: Via Interface (Recomendado)

1. Abra o sistema Giartech
2. Vá em **Configurações** → **Provedores de IA**
3. Localize **OpenRouter** na lista
4. Clique em **Editar** (ícone de lápis)
5. Cole sua API Key no campo correspondente
6. Verifique se está marcado como **Ativo**
7. Clique em **Salvar**

### Opção B: Via SQL (Avançado)

```sql
-- Atualizar API Key do OpenRouter
UPDATE ai_providers
SET api_key = 'sk-or-v1-SUA-CHAVE-AQUI'
WHERE provider_type = 'openrouter';

-- Verificar se foi atualizado
SELECT name, provider_type, active,
  CASE
    WHEN api_key IS NOT NULL AND api_key != '' THEN 'CONFIGURADO'
    ELSE 'NAO_CONFIGURADO'
  END as status
FROM ai_providers
WHERE provider_type = 'openrouter';
```

---

## ✅ Testar se Funcionou

### Teste Simples

1. Abra o chat do Thomaz (ícone flutuante ou aba lateral)
2. Pergunte algo como:
   ```
   "Analise minha saúde financeira e me dê 3 recomendações práticas"
   ```
3. Se receber uma resposta elaborada e detalhada = **Funcionou!** 🎉

### Verificar nos Logs

```sql
-- Ver últimas interações do Thomaz
SELECT
  created_at,
  user_message,
  LEFT(thomaz_response, 100) as resposta_preview
FROM thomaz_interactions
ORDER BY created_at DESC
LIMIT 5;
```

---

## 🆚 Comparação: Com vs Sem API Key

| Aspecto | Sem API Key | Com API Key |
|---------|-------------|-------------|
| **Respostas** | Base de conhecimento | IA avançada (Claude/GPT) |
| **Elaboração** | Objetivas e diretas | Detalhadas e contextuais |
| **Análise** | Dados + templates | Análise profunda com raciocínio |
| **Recomendações** | Pré-configuradas | Personalizadas e específicas |
| **Custo** | Grátis | ~$0.003 por mensagem |
| **Qualidade** | Boa (80%) | Excelente (95%+) |

---

## 🌐 Alternativas ao OpenRouter

### Anthropic (Claude Direto)

**Quando usar:** Se quiser acesso direto ao Claude sem intermediários

**Como configurar:**
1. Crie conta em: https://console.anthropic.com
2. Vá em API Keys
3. Crie uma nova chave
4. No sistema, selecione provedor **Anthropic**
5. Cole a chave (começa com `sk-ant-...`)

**Custo:** Similar ao OpenRouter, mas só Claude

### OpenAI (GPT Direto)

**Quando usar:** Se preferir modelos GPT da OpenAI

**Como configurar:**
1. Crie conta em: https://platform.openai.com
2. Vá em API Keys
3. Crie uma nova chave
4. No sistema, selecione provedor **OpenAI**
5. Cole a chave (começa com `sk-proj-...`)

**Custo:** Um pouco mais caro que OpenRouter

---

## 🔒 Segurança da API Key

### ✅ Boas Práticas

1. **Nunca compartilhe** sua chave com ninguém
2. **Não comite** no Git/GitHub
3. **Use .env** para armazenar (já está configurado)
4. **Rotacione** a chave a cada 3-6 meses
5. **Monitore** o uso para detectar anomalias

### ⚠️ Se Sua Chave Vazar

1. Acesse imediatamente o painel do provedor
2. **Revogue** a chave comprometida
3. **Crie** uma nova chave
4. **Atualize** no sistema

---

## 📊 Monitorar Uso e Custos

### OpenRouter

1. Acesse: https://openrouter.ai/activity
2. Veja detalhes de cada request
3. Monitore créditos restantes
4. Configure alertas de limite

### No Sistema

```sql
-- Estatísticas de uso do Thomaz
SELECT
  DATE(created_at) as data,
  COUNT(*) as total_mensagens,
  COUNT(DISTINCT user_id) as usuarios_unicos
FROM thomaz_interactions
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY data DESC;
```

---

## ❓ Troubleshooting

### Problema: "API Key inválida"

**Solução:**
1. Verifique se copiou a chave completa
2. Confira se não há espaços extras
3. Teste a chave diretamente no painel do provedor
4. Gere uma nova chave se necessário

### Problema: "Limite de uso excedido"

**Solução:**
1. Adicione mais créditos na conta
2. Verifique se há uso excessivo suspeito
3. Configure limites de rate no sistema

### Problema: "Resposta muito lenta"

**Solução:**
1. Modelos maiores são mais lentos (trade-off qualidade/velocidade)
2. Considere usar modelo mais rápido nas configurações
3. Verifique latência do provedor

### Problema: "Thomaz ainda usa fallback"

**Solução:**
1. Limpe o cache do navegador (Ctrl+Shift+R)
2. Verifique se a chave está salva no banco
3. Teste fazer logout e login novamente

---

## 💡 Dicas de Otimização

### 1. Escolha o Modelo Certo

**Para consultas simples:**
- `anthropic/claude-3-haiku` (mais rápido e barato)
- `openai/gpt-3.5-turbo`

**Para análises complexas:**
- `anthropic/claude-3.5-sonnet` (recomendado)
- `openai/gpt-4-turbo`

### 2. Seja Específico nas Perguntas

❌ Ruim: "Me fala do financeiro"
✅ Bom: "Analise meu fluxo de caixa dos últimos 3 meses e identifique tendências de queda"

### 3. Use Contexto

❌ Ruim: "E os clientes?"
✅ Bom: "Com base na análise financeira anterior, quais clientes devo priorizar para aumentar receita?"

---

## 🎓 Recursos Adicionais

### Documentação Oficial

- OpenRouter: https://openrouter.ai/docs
- Anthropic: https://docs.anthropic.com
- OpenAI: https://platform.openai.com/docs

### Comunidade

- Discord OpenRouter: https://discord.gg/fVyRaUDgxW
- Reddit r/LocalLLaMA: https://reddit.com/r/LocalLLaMA

---

## 📞 Suporte

Problemas com a configuração?

1. Verifique os logs do sistema
2. Teste a chave diretamente no painel do provedor
3. Consulte este guia novamente
4. Entre em contato com o suporte técnico

---

**🎉 Pronto! Com a API Key configurada, o Thomaz está com 100% de suas capacidades ativadas!**
