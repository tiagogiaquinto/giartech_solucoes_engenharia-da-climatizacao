# 🎮 Guia: Sistema de Gamificação OPCIONAL

## 📋 Visão Geral

Sistema de gamificação com **controle total** de quais clientes participam e quais OSs geram pontos.

**Você decide:**
- ✅ Quais clientes participam
- ✅ Quais OSs geram pontos
- ✅ Processar OSs antigas ou não
- ✅ Manter ou remover pontos ao desativar

---

## 🚀 Como Acessar

### **Opção 1: Menu Lateral**
```
Menu → Gerenciar Gamificação
```

### **Opção 2: URL Direta**
```
http://localhost:5173/customer-gamification-manager
```

---

## 👥 GERENCIAR CLIENTES

### **Ativar Cliente na Gamificação**

#### **Opção A: Ativar Simples**
1. Acesse a aba "Clientes"
2. Encontre o cliente desejado
3. Clique em "Ativar"
4. ✅ Cliente ativo! Novas OSs dele gerarão pontos automaticamente

**Quando usar:** Cliente novo ou você quer controlar manualmente quais OSs antigas incluir

#### **Opção B: Ativar + Processar OSs Antigas**
1. Acesse a aba "Clientes"
2. Encontre o cliente desejado
3. Clique em "Ativar + Processar OSs"
4. ✅ Cliente ativo + TODAS as OSs concluídas antigas são marcadas para processar!

**Quando usar:** Cliente antigo com histórico de compras que você quer incluir

---

### **Desativar Cliente**

1. Acesse a aba "Clientes"
2. Encontre o cliente ativo
3. Clique em "Desativar"
4. Escolha:
   - **Manter pontos:** Cliente para de ganhar pontos novos, mas mantém os atuais
   - **Remover pontos:** Zera tudo (pontos, histórico, badges)

**Resultado:**
- Novas OSs dele não geram mais pontos
- OSs antigas continuam marcadas como incluídas
- Cliente some do ranking (se removeu pontos)

---

## 📦 GERENCIAR ORDENS DE SERVIÇO

### **Incluir OS Individual**

1. Acesse a aba "Ordens de Serviço"
2. Filtre por "Disponíveis"
3. Encontre a OS desejada
4. Clique em "Incluir"
5. ✅ Pontos gerados imediatamente!

**Requisitos:**
- Cliente deve estar ativo na gamificação
- OS deve estar com status "Concluída"
- OS não pode ter sido incluída antes

---

### **Incluir Múltiplas OSs (Processamento em Lote)**

1. Acesse a aba "Ordens de Serviço"
2. Filtre por "Disponíveis"
3. Marque as checkboxes das OSs desejadas
4. Clique em "Processar Selecionadas"
5. ✅ Todas processadas de uma vez!

**Útil para:**
- Processar todas as OSs antigas de um cliente
- Corrigir OSs que ficaram pendentes
- Atualização em massa

---

## 🎯 FLUXOS DE USO COMUNS

### **Cenário 1: Cliente Novo**

```
1. Cadastra o cliente
2. Ativa ele na gamificação (sem processar OSs antigas)
3. Cria e conclui OSs normalmente
→ OSs futuras geram pontos automaticamente
```

---

### **Cenário 2: Cliente Antigo com Histórico**

```
1. Ativa o cliente + Processa OSs antigas
2. Sistema marca TODAS as OSs concluídas dele
3. Vai em "Ordens de Serviço" → "Disponíveis"
4. Processa em lote ou individualmente
→ Cliente ganha pontos retroativos!
```

---

### **Cenário 3: Cliente Seletivo**

```
1. Ativa o cliente (sem processar antigas)
2. Vai em "Ordens de Serviço"
3. Marca manualmente quais OSs antigas quer incluir
4. Processa selecionadas
→ Controle total de quais compras contam
```

---

### **Cenário 4: Cliente Saiu do Programa**

```
1. Desativa o cliente
2. Escolhe:
   - Manter pontos: Cliente pode voltar depois
   - Remover pontos: Limpeza total
→ Novas OSs não geram mais pontos
```

---

## 📊 FILTROS DISPONÍVEIS

### **Aba Clientes:**
- **Todos:** Todos os clientes
- **Ativos:** Apenas os que participam
- **Inativos:** Apenas os que NÃO participam

### **Aba Ordens de Serviço:**
- **Todas:** Todas as OSs
- **Disponíveis:** OSs que PODEM ser incluídas (cliente ativo + OS concluída + não incluída)
- **Incluídas:** OSs que JÁ foram processadas

---

## 🔍 INFORMAÇÕES EXIBIDAS

### **Card de Cliente:**
```
Nome do Cliente              [NÍVEL: Ouro]

Pontos: 15.420
Compras: 28
Gasto Total: R$ 45.780,00
Desde: 15/01/2024

⚠️ 3 OSs concluídas pendentes de inclusão (R$ 8.500,00)

[Desativar]
```

### **Card de Ordem de Serviço:**
```
☑️ OS #2024-0152        [Disponível]

Cliente Exemplo Ltda
R$ 2.850,00
15/12/2024

[Incluir]
```

---

## ⚡ PROCESSAMENTO AUTOMÁTICO

### **Quando funciona:**

```
Cliente ATIVO + OS Concluída = PONTOS AUTOMÁTICOS
```

### **Como funciona:**

1. Você conclui uma OS (muda status para "Concluída")
2. Sistema verifica:
   - ✅ Cliente está ativo na gamificação?
   - ✅ OS não foi incluída antes?
3. Se SIM:
   - Calcula pontos (R$ 1.000 = 1.000 pontos × multiplicador)
   - Adiciona ao cliente
   - Marca OS como incluída
   - Verifica badges
   - Atualiza nível se necessário

**Tempo:** < 2 segundos

---

## 💡 DICAS E BOAS PRÁTICAS

### **✅ Faça:**

- Ative clientes gradualmente
- Use processamento em lote para OSs antigas
- Verifique OSs pendentes regularmente
- Mantenha poucos clientes ativos inicialmente para testar

### **❌ Evite:**

- Ativar/desativar clientes repetidamente
- Remover pontos sem necessidade (melhor desativar mantendo pontos)
- Processar OSs em andamento (só funciona com concluídas)
- Incluir a mesma OS duas vezes (sistema bloqueia)

---

## 🎨 ESTADOS E BADGES

### **Status de Cliente:**
```
🟢 ATIVO: Participa e ganha pontos
🔴 INATIVO: Não participa
```

### **Status de OS:**
```
🔵 Disponível: Pode ser incluída
🟢 Já incluída: Pontos já foram gerados
⚫ Cliente não participa: Não pode incluir
⚫ OS não concluída: Não pode incluir
```

### **Níveis:**
```
🥉 BRONZE:   0 - 999 pontos
🥈 PRATA:    1.000 - 2.999 pontos
🥇 OURO:     3.000 - 6.999 pontos
💎 DIAMANTE: 7.000 - 14.999 pontos
👑 VIP:      15.000+ pontos
```

---

## 🔧 FUNÇÕES DO BANCO DE DADOS

### **Ativar Cliente:**
```sql
SELECT ativar_gamificacao_cliente(
  'uuid-do-cliente',
  true  -- processar OSs antigas
);
```

### **Desativar Cliente:**
```sql
SELECT desativar_gamificacao_cliente(
  'uuid-do-cliente',
  'Motivo da desativação',
  false  -- remover pontos?
);
```

### **Incluir OS:**
```sql
SELECT incluir_os_na_gamificacao('uuid-da-os');
```

### **Incluir Múltiplas:**
```sql
SELECT incluir_multiplas_os_gamificacao(
  ARRAY['uuid-1', 'uuid-2', 'uuid-3']::uuid[]
);
```

---

## 📈 EXEMPLO PRÁTICO COMPLETO

### **Situação:**
Você tem 3 clientes:
- Cliente A: Novo, sem histórico
- Cliente B: Antigo, 10 OSs concluídas
- Cliente C: Médio, 5 OSs concluídas, mas só quer incluir 3

### **Passo a Passo:**

#### **Cliente A (Novo):**
```
1. Ativar (sem processar antigas)
2. Criar novas OSs
→ Gera pontos automaticamente
```

#### **Cliente B (Antigo - Tudo):**
```
1. Ativar + Processar OSs antigas
2. Ir em OSs → Disponíveis
3. Selecionar todas (10)
4. Processar selecionadas
→ 10 OSs processadas de uma vez
```

#### **Cliente C (Médio - Seletivo):**
```
1. Ativar (sem processar antigas)
2. Ir em OSs → Disponíveis
3. Selecionar as 3 OSs desejadas
4. Processar selecionadas
→ Só as 3 selecionadas geram pontos
```

---

## 🆘 SOLUÇÃO DE PROBLEMAS

### **OS não aparece como disponível:**
- ✅ Cliente está ativo?
- ✅ OS está com status "Concluída"?
- ✅ OS não foi incluída antes?

### **Cliente não ganha pontos automaticamente:**
- ✅ Cliente está ativo na gamificação?
- ✅ Trigger do banco está ativo?
- ✅ Configuração de gamificação existe?

### **Erro ao incluir OS:**
- ✅ OS pertence a cliente ativo?
- ✅ OS já foi processada antes?
- ✅ OS tem valor maior que zero?

---

## 📞 ONDE ENCONTRAR

### **Interface:**
```
Menu → Gerenciar Gamificação
URL: /customer-gamification-manager
```

### **Visualização (Ranking):**
```
Menu → Gamificação de Clientes
URL: /customer-gamification
```

### **Banco de Dados:**
```
Views:
- v_os_disponiveis_gamificacao
- v_relatorio_gamificacao_cliente

Tabelas:
- customers (participa_gamificacao)
- service_orders (incluir_gamificacao)
- customer_points
- customer_badges_earned
```

---

## ✅ CHECKLIST RÁPIDO

Ao iniciar o sistema:

- [ ] Decidir quais clientes participam
- [ ] Ativar clientes selecionados
- [ ] Escolher se processa OSs antigas
- [ ] Processar OSs disponíveis
- [ ] Verificar pontos gerados
- [ ] Testar conclusão de nova OS
- [ ] Confirmar pontos automáticos funcionando

---

**Pronto! Sistema 100% funcional e sob seu controle!** 🎉
