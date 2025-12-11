# 📋 GUIA COMPLETO: Sistema de Pagamento de Salários

## 🎯 Visão Geral

Sistema completo para gerenciar pagamentos de salários em duas etapas:
- **Dia 20**: Vale/Adiantamento (50% do salário)
- **Dia 5**: Pagamento final (saldo restante após descontar o vale)

---

## 📊 Estrutura do Sistema

### **Tabelas Principais**

#### 1. `salary_payment_schedule` - Configuração do Cronograma
```sql
-- Configuração atual
advance_payment_day: 20    -- Dia do vale
final_payment_day: 5       -- Dia do pagamento final
advance_percentage: 50%    -- Percentual do vale
```

#### 2. `employee_salary_tracking` - Controle Mensal
- Registro do salário base do mês
- Bônus e descontos
- Valor bruto (gross_amount)
- Valor pago (paid_amount)
- Saldo restante (remaining_amount)
- Status do pagamento

#### 3. `salary_advance_payments` - Vales (Dia 20)
- Valor do vale
- Data do pagamento
- Status: pending, deducted, cancelled
- Integração com finance_entries

#### 4. `salary_partial_payments` - Pagamentos Finais (Dia 5)
- Valor do pagamento final
- Data do pagamento
- Referência ao salary_tracking
- Integração com finance_entries

---

## 🔄 Fluxo Completo de Uso

### **PASSO 1: Criar Salário do Mês**

```sql
-- Criar salário para um funcionário no mês
SELECT * FROM create_monthly_salary(
  p_employee_id := 'uuid-do-funcionario',
  p_reference_month := '2025-12-01'::DATE,
  p_bonuses := 500.00,        -- Opcional
  p_discounts := 100.00,      -- Opcional
  p_notes := 'Observações'    -- Opcional
);

-- Retorna:
-- salary_tracking_id: ID do registro criado
-- base_salary: Salário base
-- gross_amount: Valor bruto (base + bônus - descontos)
-- next_advance_amount: Valor do próximo vale (50%)
-- next_advance_date: Data do próximo vale (dia 20)
```

**O que acontece:**
- ✅ Cria registro em `employee_salary_tracking`
- ✅ Calcula valores automaticamente
- ✅ Define status como 'pending'
- ✅ Calcula data do próximo vale

---

### **PASSO 2: Registrar Vale (Dia 20)**

```sql
-- Registrar vale mensal (dia 20)
SELECT * FROM register_monthly_advance(
  p_employee_id := 'uuid-do-funcionario',
  p_reference_month := '2025-12-01'::DATE,
  p_amount := NULL,                    -- NULL = calcula 50% automaticamente
  p_payment_date := '2025-12-20'::DATE,
  p_notes := 'Vale mensal dia 20'
);

-- Retorna:
-- advance_id: ID do vale registrado
-- finance_entry_id: ID do lançamento financeiro criado
-- amount_paid: Valor pago
```

**O que acontece automaticamente:**
- ✅ Calcula 50% do salário (se amount = NULL)
- ✅ Cria lançamento em `finance_entries`
  - Tipo: 'saida'
  - Categoria: 'Salários'
  - Status: 'pago'
  - Forma de pagamento: 'pix'
- ✅ Registra vale em `salary_advance_payments`
  - Status: 'pending' (aguardando desconto)
- ✅ Atualiza `employee_salary_tracking`
  - Incrementa `paid_amount`
  - Decrementa `remaining_amount`

---

### **PASSO 3: Registrar Pagamento Final (Dia 5)**

```sql
-- Registrar pagamento final (dia 5 do mês seguinte)
SELECT * FROM register_final_salary_payment(
  p_employee_id := 'uuid-do-funcionario',
  p_reference_month := '2025-12-01'::DATE,
  p_payment_date := '2026-01-05'::DATE,
  p_notes := 'Pagamento final dia 5'
);

-- Retorna:
-- payment_id: ID do pagamento registrado
-- finance_entry_id: ID do lançamento financeiro criado
-- amount_paid: Valor pago
-- advance_deducted: Valor do vale descontado
```

**O que acontece automaticamente:**
- ✅ Busca todos os vales pendentes do mês
- ✅ Calcula valor final:
  ```
  valor_final = gross_amount + bonuses - discounts - vales
  ```
- ✅ Cria lançamento em `finance_entries`
  - Descrição inclui valor do vale descontado
- ✅ Marca vales como 'deducted'
- ✅ Atualiza `employee_salary_tracking`
  - Status: 'paid'
  - remaining_amount: 0

---

## 📈 Consultas e Relatórios

### **1. Ver Próximos Pagamentos Previstos**

```sql
-- Próximos pagamentos para todos os funcionários
SELECT * FROM v_upcoming_salary_payments;

-- Retorna:
-- employee_name: Nome do funcionário
-- salary: Salário base
-- next_advance_amount: Valor do próximo vale (50%)
-- next_advance_date: Data do próximo vale (dia 20)
-- estimated_final_amount: Valor estimado do pagamento final (50%)
-- next_final_payment_date: Data do próximo pagamento final (dia 5)
```

---

### **2. Resumo Mensal de Pagamentos**

```sql
-- Resumo consolidado do mês
SELECT * FROM get_monthly_payment_summary('2025-12-01'::DATE);

-- Retorna:
-- total_employees: Total de funcionários
-- total_base_salary: Soma de todos os salários base
-- total_advances_paid: Total pago em vales
-- total_final_paid: Total pago em finais
-- total_paid: Total geral pago
-- total_pending: Total pendente
-- employees_with_advance: Funcionários com vale pago
-- employees_with_final: Funcionários com pagamento final
-- employees_fully_paid: Funcionários totalmente pagos
```

**Exemplo de resultado:**
```
total_employees: 6
total_base_salary: R$ 18.300,00
total_advances_paid: R$ 9.150,00  (50%)
total_final_paid: R$ 9.150,00     (50%)
total_paid: R$ 18.300,00          (100%)
total_pending: R$ 0,00
employees_fully_paid: 6
```

---

### **3. Ver Pagamentos Pendentes**

```sql
-- Todos os pagamentos pendentes
SELECT * FROM get_pending_payments('all');

-- Apenas vales pendentes
SELECT * FROM get_pending_payments('advance');

-- Apenas pagamentos finais pendentes
SELECT * FROM get_pending_payments('final');

-- Retorna:
-- employee_name: Nome do funcionário
-- reference_month: Mês de referência
-- pending_type: 'Vale Dia 20' ou 'Pagamento Final Dia 5'
-- expected_amount: Valor esperado
-- expected_date: Data esperada
-- days_overdue: Dias de atraso (negativo se futuro)
```

---

### **4. Histórico Completo de Pagamentos**

```sql
-- Histórico de todos os pagamentos
SELECT * FROM v_complete_payment_history
WHERE employee_id = 'uuid-do-funcionario'
ORDER BY payment_date DESC;

-- Retorna:
-- employee_name: Nome do funcionário
-- payment_date: Data do pagamento
-- reference_month: Mês de referência
-- payment_type: 'Vale Dia 20' ou 'Pagamento Final Dia 5'
-- amount: Valor pago
-- status: Status do pagamento
-- finance_entry_id: ID do lançamento financeiro
```

---

### **5. Detalhes Consolidados por Mês**

```sql
-- Ver status detalhado de todos os funcionários
SELECT * FROM v_salary_payment_schedule_details
WHERE reference_month = '2025-12-01'::DATE
ORDER BY employee_name;

-- Retorna informações completas:
-- employee_name: Nome do funcionário
-- base_salary: Salário base
-- reference_month: Mês de referência
-- bonuses, discounts: Adicionais e descontos
-- advance_amount: Valor do vale pago
-- advance_status: Status do vale
-- final_payment_amount: Valor do pagamento final
-- total_paid: Total pago
-- overall_status: Status geral
```

**Status possíveis:**
- `Pago Completo`: Vale + Final pagos
- `Vale Pago - Aguardando Final`: Só vale foi pago
- `Pendente`: Nenhum pagamento realizado

---

## ⚙️ Funções de Gerenciamento

### **Cancelar Vale**

```sql
-- Cancelar um vale não descontado
SELECT cancel_advance_payment(
  p_advance_id := 'uuid-do-vale',
  p_reason := 'Motivo do cancelamento'
);

-- O que acontece:
-- ✅ Cancela lançamento financeiro
-- ✅ Marca vale como 'cancelled'
-- ✅ Reverte valores no salary_tracking
-- ✅ Adiciona motivo nas observações
```

---

### **Cancelar Pagamento Final**

```sql
-- Cancelar pagamento final
SELECT cancel_final_payment(
  p_payment_id := 'uuid-do-pagamento',
  p_reason := 'Motivo do cancelamento'
);

-- O que acontece:
-- ✅ Cancela lançamento financeiro
-- ✅ Reverte vales para status 'pending'
-- ✅ Reverte valores no salary_tracking
-- ✅ Deleta registro de pagamento
-- ✅ Adiciona motivo nas observações
```

---

## 🔧 Configuração do Sistema

### **Alterar Dias de Pagamento**

```sql
-- Alterar dias de pagamento (padrão: vale dia 20, final dia 5)
UPDATE salary_payment_schedule
SET
  advance_payment_day = 25,  -- Novo dia do vale
  final_payment_day = 10     -- Novo dia do pagamento final
WHERE active = true;
```

---

### **Alterar Percentual do Vale**

```sql
-- Alterar percentual do vale (padrão: 50%)
UPDATE salary_payment_schedule
SET advance_percentage = 40.00  -- 40% do salário
WHERE active = true;
```

---

### **Alterar Formas de Pagamento Padrão**

```sql
-- Alterar formas de pagamento padrão
UPDATE salary_payment_schedule
SET
  advance_payment_method = 'dinheiro',
  final_payment_method = 'transferencia'
WHERE active = true;
```

---

## 📋 Exemplo Prático Completo

### **Cenário: Pagar funcionário no mês de Dezembro/2025**

**Dados:**
- Funcionário: João da Silva
- Salário base: R$ 3.000,00
- Bônus: R$ 500,00 (meta batida)
- Vale: 50% = R$ 1.750,00
- Pagamento final: R$ 1.750,00

---

#### **1. Criar salário do mês (início de dezembro)**

```sql
SELECT * FROM create_monthly_salary(
  p_employee_id := 'uuid-do-joao',
  p_reference_month := '2025-12-01'::DATE,
  p_bonuses := 500.00,
  p_notes := 'Bônus por meta batida'
);

-- Resultado:
-- base_salary: 3000.00
-- gross_amount: 3500.00 (3000 + 500)
-- next_advance_amount: 1750.00 (50%)
-- next_advance_date: 2025-12-20
```

---

#### **2. Registrar vale dia 20/12/2025**

```sql
SELECT * FROM register_monthly_advance(
  p_employee_id := 'uuid-do-joao',
  p_reference_month := '2025-12-01'::DATE,
  p_payment_date := '2025-12-20'::DATE,
  p_notes := 'Vale mensal - Dezembro/2025'
);

-- Resultado:
-- amount_paid: 1750.00
-- finance_entry_id: uuid-do-lancamento
```

**Lançamento financeiro criado:**
```
Descrição: Vale Dia 20 - João da Silva - 12/2025
Valor: R$ 1.750,00
Tipo: Saída
Categoria: Salários
Status: Pago
Data: 20/12/2025
Forma: PIX
```

---

#### **3. Registrar pagamento final dia 05/01/2026**

```sql
SELECT * FROM register_final_salary_payment(
  p_employee_id := 'uuid-do-joao',
  p_reference_month := '2025-12-01'::DATE,
  p_payment_date := '2026-01-05'::DATE,
  p_notes := 'Pagamento final - Dezembro/2025'
);

-- Resultado:
-- amount_paid: 1750.00
-- advance_deducted: 1750.00
```

**Lançamento financeiro criado:**
```
Descrição: Salário Dia 5 - João da Silva - 12/2025
Valor: R$ 1.750,00
Tipo: Saída
Categoria: Salários
Status: Pago
Data: 05/01/2026
Forma: PIX
Observações: Pagamento final - dia 5 (com desconto de vale: R$ 1750.00)
```

---

#### **4. Verificar status final**

```sql
SELECT * FROM v_salary_payment_schedule_details
WHERE employee_id = 'uuid-do-joao'
AND reference_month = '2025-12-01'::DATE;
```

**Resultado:**
```
employee_name: João da Silva
base_salary: 3000.00
bonuses: 500.00
gross_amount: 3500.00
advance_amount: 1750.00 (vale dia 20)
final_payment_amount: 1750.00 (pagamento dia 5)
total_paid: 3500.00
remaining_amount: 0.00
overall_status: Pago Completo
```

---

## 🚨 Validações e Alertas

O sistema possui validações automáticas:

### **1. Duplicidade**
- ❌ Não permite criar dois salários para o mesmo funcionário no mesmo mês
- ❌ Não permite registrar dois vales para o mesmo funcionário no mesmo mês
- ❌ Não permite registrar dois pagamentos finais para o mesmo salário

### **2. Valores**
- ❌ Valor do vale não pode ser maior que o salário base
- ❌ Valor do vale deve ser maior que zero
- ❌ Valor final negativo gera exceção

### **3. Datas**
- ⚠️ Warning se data do vale diferente do dia configurado (20)
- ⚠️ Warning se data do pagamento final diferente do dia configurado (5)

### **4. Status**
- ❌ Apenas vales 'pending' podem ser cancelados
- ❌ Funcionário deve estar ativo

---

## 💡 Dicas e Boas Práticas

### **1. Ordem de Execução**
```
1º → Criar salário do mês (início do mês)
2º → Registrar vale dia 20
3º → Registrar pagamento final dia 5 (mês seguinte)
```

### **2. Valores Automáticos**
- Use `p_amount := NULL` no vale para calcular 50% automaticamente
- Sistema calcula valor final automaticamente descontando vales

### **3. Cancelamentos**
- Sempre informe o motivo do cancelamento
- Cancelamentos revertem valores automaticamente
- Verifique lançamentos financeiros após cancelamento

### **4. Relatórios**
- Use `v_upcoming_salary_payments` para planejamento
- Use `get_pending_payments()` para cobrança
- Use `get_monthly_payment_summary()` para fechamento mensal

### **5. Integração Financeira**
- Todos os pagamentos criam lançamentos em `finance_entries`
- Use `employee_id` para filtrar lançamentos por funcionário
- Status sincronizado: cancelar pagamento cancela lançamento

---

## 📞 Suporte

Para dúvidas ou problemas, consulte:
- Views de resumo: `v_salary_payment_schedule_details`
- Histórico completo: `v_complete_payment_history`
- Próximos pagamentos: `v_upcoming_salary_payments`
- Pendências: `get_pending_payments()`

---

## 🎉 Sistema Completo e Operacional!

O sistema de pagamento de salários está 100% funcional e integrado com:
- ✅ Finance Entries (Lançamentos Financeiros)
- ✅ Bank Accounts (Contas Bancárias)
- ✅ Employees (Funcionários)
- ✅ Auditoria e Rastreamento
- ✅ Validações e Segurança
- ✅ Relatórios e Dashboards

**Tudo pronto para uso em produção!** 🚀
