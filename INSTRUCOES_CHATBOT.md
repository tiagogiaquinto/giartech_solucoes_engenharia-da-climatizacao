# 🤖 CHATBOT IA - INSTRUÇÕES DE TESTE

## ✅ VERIFICAR SE ESTÁ FUNCIONANDO

### 1. **Limpar Cache do Navegador**
```
CTRL + SHIFT + R (Windows/Linux)
CMD + SHIFT + R (Mac)
```

### 2. **Atualizar Página**
Recarregue completamente a aplicação para garantir que está usando o novo build.

### 3. **Procurar o Botão**
O botão do chatbot deve aparecer:
- **Localização:** Canto inferior direito da tela
- **Aparência:** Círculo azul com ícone de mensagem
- **Cor:** Azul (#2563eb)
- **Tamanho:** 56x56 pixels (incluindo padding)

### 4. **Verificar Console**
Abra o console do navegador (F12) e procure por:
```
🤖 AIChatbot montado e ativo!
```

Se essa mensagem aparecer, o componente está carregado corretamente.

---

## 🔍 POSSÍVEIS PROBLEMAS E SOLUÇÕES

### Problema 1: Botão não aparece
**Solução:**
1. Limpe o cache (CTRL + SHIFT + DELETE)
2. Limpe o localStorage
3. Feche e abra o navegador novamente

**No console do navegador:**
```javascript
localStorage.clear()
location.reload()
```

### Problema 2: Erro no console
**Verifique se há erros relacionados a:**
- Import do componente
- Supabase connection
- Permissões RLS

**Para debug:**
```javascript
// No console
console.log('Testando chatbot...')
```

### Problema 3: Tabelas não existem
**Execute no SQL Editor do Supabase:**
```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'chat_%';
```

Deve retornar:
- chat_conversations
- chat_intents
- chat_messages

---

## 🧪 TESTAR O CHATBOT

### Teste 1: Abrir o Chat
1. Clique no botão azul no canto inferior direito
2. A janela do chat deve abrir
3. Deve aparecer uma mensagem de boas-vindas

### Teste 2: Criar Conversa
1. Se não houver conversas, clique no botão "+"
2. Uma nova conversa deve ser criada
3. A área de mensagens deve ficar ativa

### Teste 3: Enviar Mensagem
**Digite:** `oi`
**Resposta esperada:**
```
👋 Olá! Como posso ajudar você hoje?

Você pode me perguntar sobre:
• Ordens de serviço abertas
• Estoque de materiais
• Agenda do dia
• Informações de clientes
• Resumo financeiro
• Últimas vendas
```

### Teste 4: Comando Funcional
**Digite:** `ajuda`
**Resposta esperada:**
```
🤖 Posso ajudar você com:

📋 Ordens de Serviço
   • "OS abertas"
   • "Últimas vendas"
...
```

### Teste 5: Consulta Real
**Digite:** `OS abertas`
**Resposta esperada:**
- Lista de ordens de serviço em aberto
- Ou mensagem "Não há ordens de serviço abertas"

---

## 📊 COMANDOS DISPONÍVEIS

### Ordens de Serviço
- `OS abertas`
- `ordens abertas`
- `serviços pendentes`

### Estoque
- `estoque baixo`
- `materiais acabando`
- `estoque crítico`

### Agenda
- `agenda hoje`
- `compromissos hoje`
- `eventos hoje`

### Clientes
- `buscar cliente [nome]`
- `informações do cliente`

### Financeiro
- `resumo financeiro`
- `contas a pagar`

### Vendas
- `últimas vendas`
- `vendas recentes`

### Análises
- `materiais mais usados`
- `top materiais`

---

## 🛠️ TROUBLESHOOTING AVANÇADO

### Verificar se as tabelas existem
```sql
SELECT * FROM chat_intents LIMIT 5;
```

### Verificar se há conversas
```sql
SELECT * FROM chat_conversations;
```

### Criar conversa manualmente (se necessário)
```sql
INSERT INTO chat_conversations (title)
VALUES ('Teste Manual')
RETURNING *;
```

### Verificar RLS
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'chat_%';
```

Todas devem ter `rowsecurity = true`

---

## 🎯 CHECKLIST FINAL

- [ ] Cache do navegador limpo
- [ ] Página recarregada com CTRL + SHIFT + R
- [ ] Console aberto (F12)
- [ ] Mensagem "🤖 AIChatbot montado e ativo!" aparece
- [ ] Botão azul visível no canto direito inferior
- [ ] Botão responde ao clique
- [ ] Janela do chat abre
- [ ] É possível criar nova conversa
- [ ] É possível enviar mensagem
- [ ] Bot responde às mensagens

---

## 📞 SE AINDA NÃO FUNCIONAR

**Envie as seguintes informações:**

1. **Screenshot da tela completa**
2. **Console do navegador (F12 > Console)**
3. **Erros que aparecem no console**
4. **Resultado desta query no Supabase:**
```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'chat_%';
```

---

## ✅ CONFIRMAÇÃO DE SUCESSO

Quando funcionar, você verá:
- ✅ Botão azul flutuante no canto inferior direito
- ✅ Janela de chat abre ao clicar
- ✅ Bot responde "Olá!" quando você diz "oi"
- ✅ Bot lista OS quando você pergunta "OS abertas"
- ✅ Histórico de conversas salvo

**O chatbot está pronto e funcionando! 🎉**
