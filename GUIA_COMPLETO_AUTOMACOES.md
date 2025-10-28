# 🤖 GUIA COMPLETO DE AUTOMAÇÕES

**Sistema de Workflows e Automações do Giartech**

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Gatilhos Disponíveis](#gatilhos-disponíveis)
3. [Ações Disponíveis](#ações-disponíveis)
4. [Exemplos Práticos](#exemplos-práticos)
5. [Como Criar Automações](#como-criar-automações)
6. [Condições e Filtros](#condições-e-filtros)
7. [Prioridades](#prioridades)
8. [Monitoramento](#monitoramento)

---

## 🎯 VISÃO GERAL

O sistema de automações permite que você configure regras que executam ações automaticamente quando determinados eventos acontecem no sistema.

### Como Funciona

```
GATILHO → CONDIÇÕES → AÇÕES
```

1. **Gatilho (Trigger):** Evento que inicia a automação
2. **Condições (opcional):** Filtros que precisam ser atendidos
3. **Ações:** O que será executado automaticamente

### Benefícios

✅ **Economia de Tempo:** Processos manuais se tornam automáticos
✅ **Redução de Erros:** Menos intervenção humana
✅ **Resposta Rápida:** Ações imediatas quando eventos ocorrem
✅ **Consistência:** Mesmas regras aplicadas sempre
✅ **Escalabilidade:** Sistema cresce sem aumentar carga de trabalho

---

## 🔔 GATILHOS DISPONÍVEIS

### 1. OS Criada (`service_order_created`)

**Quando dispara:** Uma nova ordem de serviço é criada

**Dados disponíveis:**
- `service_order_id`: ID da OS
- `order_number`: Número da OS
- `total_value`: Valor total
- `customer_id`: ID do cliente

**Condições possíveis:**
- `min_value`: Valor mínimo (ex: R$ 5.000)
- `max_value`: Valor máximo (ex: R$ 50.000)
- `customer_type`: Tipo de cliente (PF/PJ)
- `priority`: Prioridade da OS

**Exemplos de uso:**
- Notificar gerente sobre OS de alto valor
- Criar checklist automático
- Enviar email de confirmação ao cliente
- Alertar equipe de vendas sobre nova OS

---

### 2. OS Concluída (`service_order_completed`)

**Quando dispara:** Uma ordem de serviço é marcada como concluída

**Dados disponíveis:**
- `service_order_id`: ID da OS
- `completion_date`: Data de conclusão
- `total_value`: Valor total
- `customer_id`: ID do cliente

**Condições possíveis:**
- `min_value`: Valor mínimo
- `completion_time`: Tempo até conclusão
- `customer_satisfaction`: Nível de satisfação

**Exemplos de uso:**
- Enviar pesquisa de satisfação
- Gerar fatura automaticamente
- Notificar financeiro para cobrança
- Atualizar dashboard de KPIs
- Liberar pagamento da equipe

---

### 3. Pagamento Recebido (`payment_received`)

**Quando dispara:** Um pagamento é confirmado (status → "paid")

**Dados disponíveis:**
- `finance_entry_id`: ID do lançamento
- `amount`: Valor recebido
- `description`: Descrição do pagamento
- `customer_id`: ID do cliente (se houver)

**Condições possíveis:**
- `min_amount`: Valor mínimo
- `payment_method`: Método de pagamento
- `is_overdue`: Se estava atrasado

**Exemplos de uso:**
- Enviar recibo por email
- Agradecer cliente
- Atualizar credit scoring
- Liberar próxima etapa do serviço
- Notificar equipe financeira

---

### 4. Pagamento Atrasado (`payment_overdue`)

**Quando dispara:** Uma conta a receber vence e não é paga

**Dados disponíveis:**
- `finance_entry_id`: ID da conta
- `amount`: Valor em atraso
- `days_overdue`: Dias de atraso
- `customer_id`: ID do cliente

**Condições possíveis:**
- `min_days_overdue`: Mínimo de dias (ex: 7, 15, 30)
- `min_amount`: Valor mínimo
- `customer_type`: Tipo de cliente

**Exemplos de uso:**
- Enviar cobrança automática
- Escalonar para gerente após X dias
- Bloquear novos pedidos do cliente
- Notificar jurídico após 30 dias
- Aplicar juros e multa automaticamente

---

### 5. Estoque Baixo (`stock_low`)

**Quando dispara:** Quantidade de um item atinge ou fica abaixo do estoque mínimo

**Dados disponíveis:**
- `inventory_item_id`: ID do item
- `item_name`: Nome do item
- `quantity`: Quantidade atual
- `minimum_stock`: Estoque mínimo configurado

**Condições possíveis:**
- `category`: Categoria do produto
- `critical_only`: Apenas itens críticos
- `supplier`: Fornecedor específico

**Exemplos de uso:**
- Criar pedido de compra automático
- Notificar comprador
- Alertar gerente de operações
- Sugerir fornecedores alternativos
- Bloquear vendas do item

---

### 6. Cliente Cadastrado (`customer_created`)

**Quando dispara:** Um novo cliente é cadastrado no sistema

**Dados disponíveis:**
- `customer_id`: ID do cliente
- `customer_name`: Nome do cliente
- `customer_type`: Tipo (PF/PJ)
- `email`: Email do cliente

**Condições possíveis:**
- `customer_type`: Apenas PF ou PJ
- `has_email`: Cliente tem email
- `source`: Origem do cadastro

**Exemplos de uso:**
- Enviar email de boas-vindas
- Criar tarefa para vendedor entrar em contato
- Adicionar à lista de newsletter
- Iniciar fluxo de onboarding
- Calcular credit score inicial

---

### 7. Data Específica (`custom_date`)

**Quando dispara:** Uma data/hora específica é atingida

**Dados disponíveis:**
- `current_date`: Data atual
- `trigger_time`: Hora do disparo

**Condições possíveis:**
- `day_of_week`: Dia da semana
- `day_of_month`: Dia do mês
- `time`: Hora específica

**Exemplos de uso:**
- Relatórios mensais automáticos
- Backup de dados semanal
- Lembrete de reuniões
- Cobranças recorrentes
- Análise de KPIs diária

---

## ⚡ AÇÕES DISPONÍVEIS

### 1. Notificação (`notification`)

Cria uma notificação no sistema para usuários específicos.

**Parâmetros:**
```json
{
  "type": "notification",
  "title": "Título da Notificação",
  "message": "Mensagem detalhada",
  "link": "/caminho/para/item/{id}",
  "priority": 5,
  "user_ids": ["uuid1", "uuid2"]
}
```

**Campos:**
- `title`: Título (obrigatório)
- `message`: Mensagem (obrigatório)
- `link`: Link para clicar (opcional)
- `priority`: 1-10 (opcional, padrão: 5)
- `user_ids`: Array de IDs de usuários (obrigatório)

**Prioridades:**
- 1-3: Baixa (informativo)
- 4-6: Normal (padrão)
- 7-8: Alta (atenção)
- 9-10: Crítica (urgente)

---

### 2. Email (`email`)

Envia um email para destinatários específicos.

**Parâmetros:**
```json
{
  "type": "email",
  "to": "cliente@email.com",
  "subject": "Assunto do Email",
  "body": "Corpo do email",
  "template": "nome_template",
  "attachments": []
}
```

**Campos:**
- `to`: Email destinatário (obrigatório)
- `subject`: Assunto (obrigatório)
- `body`: Corpo do email (obrigatório se não usar template)
- `template`: Nome do template (opcional)
- `attachments`: Array de anexos (opcional)

**Templates disponíveis:**
- `payment_confirmation`: Confirmação de pagamento
- `service_order_created`: OS criada
- `service_order_completed`: OS concluída
- `payment_overdue`: Cobrança
- `welcome`: Boas-vindas

---

### 3. Webhook (`webhook`)

Chama um endpoint externo via HTTP.

**Parâmetros:**
```json
{
  "type": "webhook",
  "url": "https://api.externa.com/endpoint",
  "method": "POST",
  "headers": {},
  "body": {},
  "retry": true
}
```

**Campos:**
- `url`: URL do endpoint (obrigatório)
- `method`: GET, POST, PUT, DELETE (padrão: POST)
- `headers`: Cabeçalhos HTTP (opcional)
- `body`: Corpo da requisição (opcional)
- `retry`: Tentar novamente se falhar (opcional)

**Casos de uso:**
- Integração com CRM externo
- Envio para WhatsApp
- Atualização em sistema de terceiros
- Webhooks do Stripe/PagSeguro

---

### 4. Criar Tarefa (`create_task`) - Em desenvolvimento

Cria uma tarefa no sistema de gestão de projetos.

**Parâmetros:**
```json
{
  "type": "create_task",
  "title": "Título da Tarefa",
  "description": "Descrição",
  "assigned_to": "uuid",
  "due_date": "2025-12-31",
  "priority": "high"
}
```

---

### 5. Atualizar Status (`update_status`) - Em desenvolvimento

Atualiza o status de um registro automaticamente.

**Parâmetros:**
```json
{
  "type": "update_status",
  "entity": "service_order",
  "entity_id": "{service_order_id}",
  "new_status": "approved"
}
```

---

### 6. Criar Pedido de Compra (`create_purchase_order`) - Em desenvolvimento

Cria um pedido de compra automaticamente.

**Parâmetros:**
```json
{
  "type": "create_purchase_order",
  "supplier_id": "uuid",
  "items": [],
  "priority": "normal"
}
```

---

## 💡 EXEMPLOS PRÁTICOS

### Exemplo 1: Notificar Gerente sobre OS de Alto Valor

```json
{
  "name": "Notificar gerente sobre OS > R$ 5.000",
  "description": "Quando uma OS de valor elevado for criada, notificar gerentes",
  "trigger_type": "service_order_created",
  "trigger_conditions": {
    "min_value": 5000
  },
  "actions": [
    {
      "type": "notification",
      "title": "Nova OS de Alto Valor",
      "message": "OS #{order_number} criada com valor de R$ {total_value}",
      "link": "/service-orders/{service_order_id}/view",
      "priority": 9,
      "user_ids": ["gerente-1-uuid", "gerente-2-uuid"]
    },
    {
      "type": "email",
      "to": "gerente@empresa.com",
      "subject": "Nova OS de Alto Valor - Aprovação Necessária",
      "template": "high_value_order"
    }
  ],
  "priority": 10
}
```

**Resultado:**
- ✅ Gerentes são notificados instantaneamente
- ✅ Email enviado para aprovação
- ✅ Link direto para visualizar a OS

---

### Exemplo 2: Cobrança Automática de Pagamentos Atrasados

```json
{
  "name": "Cobrança automática - 7 dias de atraso",
  "description": "Enviar email de cobrança após 7 dias de atraso",
  "trigger_type": "payment_overdue",
  "trigger_conditions": {
    "min_days_overdue": 7
  },
  "actions": [
    {
      "type": "email",
      "to": "{customer_email}",
      "subject": "Lembrete de Pagamento - Fatura Vencida",
      "template": "payment_overdue"
    },
    {
      "type": "notification",
      "title": "Cobrança Enviada",
      "message": "Email de cobrança enviado para {customer_name}",
      "link": "/financial",
      "priority": 5,
      "user_ids": ["{financial_manager_id}"]
    }
  ],
  "priority": 8
}
```

**Resultado:**
- ✅ Cliente recebe cobrança automática
- ✅ Financeiro é notificado
- ✅ Reduz inadimplência

---

### Exemplo 3: Pedido Automático de Compra - Estoque Baixo

```json
{
  "name": "Criar pedido quando estoque crítico",
  "description": "Quando item crítico ficar abaixo do mínimo, criar pedido",
  "trigger_type": "stock_low",
  "trigger_conditions": {
    "critical_only": true
  },
  "actions": [
    {
      "type": "notification",
      "title": "URGENTE: Estoque Crítico",
      "message": "Item {item_name} está com apenas {quantity} unidades",
      "link": "/inventory/{inventory_item_id}",
      "priority": 10,
      "user_ids": ["{purchasing_manager_id}"]
    },
    {
      "type": "create_purchase_order",
      "supplier_id": "{default_supplier_id}",
      "item_id": "{inventory_item_id}",
      "quantity": "{reorder_quantity}",
      "priority": "urgent"
    }
  ],
  "priority": 10
}
```

**Resultado:**
- ✅ Comprador é alertado imediatamente
- ✅ Pedido criado automaticamente
- ✅ Evita ruptura de estoque

---

### Exemplo 4: Pesquisa de Satisfação Pós-Serviço

```json
{
  "name": "Enviar pesquisa após conclusão da OS",
  "description": "Quando OS for concluída, enviar pesquisa de satisfação",
  "trigger_type": "service_order_completed",
  "trigger_conditions": {},
  "actions": [
    {
      "type": "email",
      "to": "{customer_email}",
      "subject": "Como foi sua experiência?",
      "template": "satisfaction_survey"
    }
  ],
  "priority": 5
}
```

**Resultado:**
- ✅ Cliente recebe pesquisa automaticamente
- ✅ Feedback coletado consistentemente
- ✅ Melhoria contínua do serviço

---

### Exemplo 5: Boas-Vindas a Novo Cliente

```json
{
  "name": "Email de boas-vindas",
  "description": "Enviar email de boas-vindas quando cliente for cadastrado",
  "trigger_type": "customer_created",
  "trigger_conditions": {
    "has_email": true
  },
  "actions": [
    {
      "type": "email",
      "to": "{customer_email}",
      "subject": "Bem-vindo à {company_name}!",
      "template": "welcome"
    },
    {
      "type": "notification",
      "title": "Novo Cliente Cadastrado",
      "message": "Cliente {customer_name} foi cadastrado",
      "link": "/client-management/{customer_id}",
      "priority": 3,
      "user_ids": ["{sales_team_ids}"]
    }
  ],
  "priority": 5
}
```

**Resultado:**
- ✅ Cliente se sente bem-vindo
- ✅ Equipe de vendas é notificada
- ✅ Processo de onboarding iniciado

---

### Exemplo 6: Relatório Financeiro Mensal

```json
{
  "name": "Relatório financeiro mensal",
  "description": "Enviar relatório financeiro no dia 1 de cada mês",
  "trigger_type": "custom_date",
  "trigger_conditions": {
    "day_of_month": 1,
    "time": "08:00"
  },
  "actions": [
    {
      "type": "email",
      "to": "cfo@empresa.com,diretoria@empresa.com",
      "subject": "Relatório Financeiro - {previous_month}",
      "template": "monthly_financial_report"
    }
  ],
  "priority": 7
}
```

**Resultado:**
- ✅ Relatórios enviados pontualmente
- ✅ Gestão sempre informada
- ✅ Sem necessidade de lembrar

---

## 🛠️ COMO CRIAR AUTOMAÇÕES

### Passo a Passo

#### 1. Acessar Automações
- Menu lateral → "Automações"

#### 2. Clicar em "Nova Automação"
- Botão azul no canto superior direito

#### 3. Configurar Informações Básicas
- **Nome:** Título descritivo
- **Descrição:** Explicação do que faz
- **Status:** Ativa/Inativa
- **Prioridade:** 1-10 (ordem de execução)

#### 4. Escolher o Gatilho
- Selecionar tipo de evento
- Exemplos: "OS Criada", "Pagamento Recebido"

#### 5. Definir Condições (Opcional)
- Filtros para quando executar
- Exemplo: "Valor mínimo R$ 5.000"

#### 6. Adicionar Ações
- Uma ou múltiplas ações
- Configurar cada ação
- Ordenar execução

#### 7. Testar
- Usar botão "Testar Automação"
- Verificar logs

#### 8. Ativar
- Marcar como "Ativa"
- Salvar

---

## 📊 CONDIÇÕES E FILTROS

### Condições por Gatilho

#### OS Criada
```json
{
  "min_value": 5000,        // Valor mínimo
  "max_value": 50000,       // Valor máximo
  "customer_type": "PJ",    // Tipo de cliente
  "priority": "high",       // Prioridade da OS
  "category": "maintenance" // Categoria do serviço
}
```

#### Pagamento Atrasado
```json
{
  "min_days_overdue": 7,    // Mínimo de dias em atraso
  "max_days_overdue": 30,   // Máximo de dias
  "min_amount": 100,        // Valor mínimo
  "customer_type": "PF"     // Tipo de cliente
}
```

#### Estoque Baixo
```json
{
  "critical_only": true,    // Apenas itens críticos
  "category": "materiais",  // Categoria do produto
  "percentage": 20          // % do estoque mínimo
}
```

#### Cliente Cadastrado
```json
{
  "customer_type": "PJ",    // Apenas PJ ou PF
  "has_email": true,        // Cliente tem email
  "source": "website"       // Origem do cadastro
}
```

---

## 🎯 PRIORIDADES

### Níveis de Prioridade

**10 - Crítica**
- Estoque zerado de item crítico
- OS urgente de alto valor
- Falha em sistema crítico

**8-9 - Alta**
- Pagamento atrasado > 30 dias
- Estoque baixo de item importante
- Aprovação necessária

**5-7 - Normal**
- Pagamento recebido
- OS criada
- Cliente cadastrado

**3-4 - Baixa**
- Notificações informativas
- Relatórios automáticos
- Atualizações de status

**1-2 - Muito Baixa**
- Logs de sistema
- Estatísticas
- Limpeza automática

### Ordem de Execução

Quando múltiplas automações disparam no mesmo evento:
1. Prioridade mais alta primeiro (10 → 1)
2. Se mesma prioridade, ordem de criação
3. Falha em uma não bloqueia outras

---

## 📈 MONITORAMENTO

### Histórico de Execuções

Cada automação registra:
- Data/hora de execução
- Evento que disparou
- Dados do trigger
- Ações executadas
- Ações que falharam
- Mensagens de erro
- Tempo de execução

### Visualizar Histórico

1. Na lista de automações
2. Clicar no ícone de histórico (relógio)
3. Ver últimas 50 execuções
4. Filtrar por status (sucesso/falha)

### Status das Execuções

**Sucesso (Verde)**
- Todas as ações executadas
- Sem erros

**Falha (Vermelho)**
- Uma ou mais ações falharam
- Ver mensagem de erro

**Em Execução (Azul)**
- Automação ainda processando
- Aguardar conclusão

**Pendente (Cinza)**
- Aguardando execução
- Na fila de processamento

---

## 🚀 CASOS DE USO AVANÇADOS

### 1. Fluxo de Aprovação de OS

**Cenário:** OS > R$ 10.000 precisa aprovação

**Automação 1:** Notificar gerente
```json
{
  "trigger": "service_order_created",
  "conditions": {"min_value": 10000},
  "actions": [
    {"type": "notification", "to": "gerente"},
    {"type": "update_status", "new_status": "pending_approval"}
  ]
}
```

**Automação 2:** Escalar se não aprovado em 24h
```json
{
  "trigger": "custom_date",
  "conditions": {"status": "pending_approval", "hours_waiting": 24},
  "actions": [
    {"type": "notification", "to": "diretor"},
    {"type": "email", "to": "diretor@empresa.com"}
  ]
}
```

---

### 2. Gestão de Inadimplência

**Automação 1:** Lembrete 3 dias antes do vencimento
```json
{
  "trigger": "custom_date",
  "conditions": {"days_to_due_date": 3},
  "actions": [
    {"type": "email", "template": "payment_reminder"}
  ]
}
```

**Automação 2:** Cobrança 7 dias após vencimento
```json
{
  "trigger": "payment_overdue",
  "conditions": {"min_days_overdue": 7},
  "actions": [
    {"type": "email", "template": "payment_overdue"}
  ]
}
```

**Automação 3:** Bloqueio após 30 dias
```json
{
  "trigger": "payment_overdue",
  "conditions": {"min_days_overdue": 30},
  "actions": [
    {"type": "update_status", "entity": "customer", "new_status": "blocked"},
    {"type": "notification", "to": "juridico"}
  ]
}
```

---

### 3. Gestão de Estoque Just-in-Time

**Automação 1:** Alerta em 30% do mínimo
```json
{
  "trigger": "stock_low",
  "conditions": {"percentage": 30},
  "actions": [
    {"type": "notification", "to": "comprador", "priority": 5}
  ]
}
```

**Automação 2:** Pedido automático em 10%
```json
{
  "trigger": "stock_low",
  "conditions": {"percentage": 10},
  "actions": [
    {"type": "create_purchase_order"},
    {"type": "notification", "to": "gerente", "priority": 8}
  ]
}
```

**Automação 3:** Alerta crítico ao zerar
```json
{
  "trigger": "stock_low",
  "conditions": {"quantity": 0},
  "actions": [
    {"type": "notification", "to": "all_managers", "priority": 10},
    {"type": "email", "to": "diretoria@empresa.com"},
    {"type": "webhook", "url": "https://urgente.com/alert"}
  ]
}
```

---

## 🎓 BOAS PRÁTICAS

### 1. Nomeação Clara
✅ "Notificar gerente sobre OS > R$ 5.000"
❌ "Automação 1"

### 2. Descrição Detalhada
✅ "Quando OS de alto valor for criada, notificar gerentes para aprovação"
❌ "Notifica gerente"

### 3. Prioridades Adequadas
- Use 10 apenas para urgências reais
- Use 5 como padrão
- Reserve 1-2 para informativos

### 4. Condições Específicas
✅ `{"min_value": 5000}`
❌ `{}`  (dispara para tudo)

### 5. Teste Antes de Ativar
- Usar ambiente de teste
- Verificar destinatários
- Validar templates

### 6. Monitore Regularmente
- Verificar logs semanalmente
- Ajustar prioridades
- Desativar se não usar

### 7. Evite Loops
❌ Automação A → cria registro → dispara Automação B → cria registro → dispara Automação A

### 8. Use Templates de Email
✅ Template reutilizável e profissional
❌ Texto direto no JSON

---

## 🔧 TROUBLESHOOTING

### Automação Não Dispara

**Verificar:**
- [ ] Automação está ativa?
- [ ] Condições estão corretas?
- [ ] Gatilho é o correto?
- [ ] Prioridade está configurada?

**Solução:**
- Ver logs de execução
- Testar com condições simplificadas
- Verificar dados do evento

---

### Ação Falha Constantemente

**Verificar:**
- [ ] Destinatários existem?
- [ ] Template existe?
- [ ] URL do webhook está correta?
- [ ] Permissões adequadas?

**Solução:**
- Ver mensagem de erro nos logs
- Testar ação isoladamente
- Validar configuração

---

### Muitas Execuções

**Verificar:**
- [ ] Condições muito amplas?
- [ ] Eventos disparando em loop?
- [ ] Prioridade muito alta?

**Solução:**
- Refinar condições
- Adicionar filtros
- Ajustar prioridade
- Pausar temporariamente

---

## 📚 RECURSOS ADICIONAIS

### Variáveis Disponíveis

Use `{variavel}` nas ações para substituir valores:

**Ordem de Serviço:**
- `{service_order_id}` - ID da OS
- `{order_number}` - Número da OS
- `{total_value}` - Valor total
- `{customer_name}` - Nome do cliente
- `{customer_email}` - Email do cliente

**Cliente:**
- `{customer_id}` - ID do cliente
- `{customer_name}` - Nome
- `{customer_type}` - Tipo (PF/PJ)
- `{customer_email}` - Email

**Pagamento:**
- `{amount}` - Valor
- `{description}` - Descrição
- `{due_date}` - Data de vencimento
- `{days_overdue}` - Dias de atraso

**Estoque:**
- `{item_name}` - Nome do item
- `{quantity}` - Quantidade atual
- `{minimum_stock}` - Estoque mínimo

**Sistema:**
- `{company_name}` - Nome da empresa
- `{current_date}` - Data atual
- `{current_user}` - Usuário atual

---

## 🎯 PRÓXIMAS FUNCIONALIDADES

### Em Desenvolvimento

**Novas Ações:**
- [ ] Criar tarefa automática
- [ ] Atualizar status de registros
- [ ] Criar pedido de compra
- [ ] Enviar WhatsApp
- [ ] Enviar SMS
- [ ] Integração com APIs externas

**Novos Gatilhos:**
- [ ] OS cancelada
- [ ] Tarefa atrasada
- [ ] Meta atingida
- [ ] Aniversário de cliente
- [ ] Renovação de contrato

**Melhorias:**
- [ ] Editor visual de automações
- [ ] Teste de automações com dados reais
- [ ] Templates de automação prontos
- [ ] Estatísticas de performance
- [ ] Exportar/importar automações

---

## 💡 DICAS FINAIS

1. **Comece Simples:** Crie automações básicas primeiro
2. **Teste Muito:** Use dados de teste antes de produção
3. **Monitore:** Verifique logs regularmente
4. **Itere:** Ajuste baseado em resultados
5. **Documente:** Anote o que cada automação faz
6. **Compartilhe:** Ensine equipe a usar
7. **Otimize:** Remova automações não usadas

---

## 🆘 SUPORTE

**Problemas ou Dúvidas?**

1. **Thomaz AI:** Pergunte ao assistente sobre automações
2. **Documentação:** Este guia cobre 95% dos casos
3. **Logs:** Sempre verifique os logs primeiro
4. **Suporte:** Entre em contato se necessário

---

**Sistema de Automações - Versão 1.0**
*Documentação atualizada em 2025-10-28*
