# 📋 Sistema de Auditoria e Rastreamento

## 🎯 Visão Geral

Sistema completo de auditoria que rastreia automaticamente **todas as operações** (inserções, edições e exclusões) realizadas em 8 tabelas principais do sistema.

---

## 🗂️ Estrutura do Banco de Dados

### Tabela Principal: `audit_logs`

Armazena todos os logs de auditoria com informações detalhadas.

**Campos:**
- `id` (uuid) - Identificador único do log
- `table_name` (text) - Nome da tabela afetada
- `operation` (text) - Tipo de operação: INSERT, UPDATE, DELETE
- `record_id` (text) - ID do registro afetado
- `old_data` (jsonb) - Dados completos antes da alteração
- `new_data` (jsonb) - Dados completos após a alteração
- `changed_fields` (jsonb) - Array com campos alterados (UPDATE)
- `user_id` (uuid) - ID do usuário que executou
- `user_email` (text) - Email do usuário
- `ip_address` (text) - Endereço IP (futuro)
- `user_agent` (text) - Navegador/cliente (futuro)
- `created_at` (timestamptz) - Data e hora da operação

---

## 🔄 Tabelas Monitoradas (Triggers Ativos)

1. **customers** - Clientes
2. **service_orders** - Ordens de Serviço
3. **agenda** - Eventos e Compromissos
4. **finance_entries** - Lançamentos Financeiros
5. **employees** - Funcionários
6. **materials** - Materiais e Estoque
7. **service_catalog** - Catálogo de Serviços
8. **user_profiles** - Perfis de Usuários

---

## ⚙️ Funcionamento Automático

### Triggers

Cada tabela monitorada possui um trigger que:
1. **Captura** a operação (INSERT/UPDATE/DELETE)
2. **Registra** dados antes e depois
3. **Identifica** campos alterados (UPDATE)
4. **Armazena** informações do usuário
5. **Salva** na tabela `audit_logs`

### Exemplo de Trigger:
```sql
CREATE TRIGGER audit_customers_trigger
  AFTER INSERT OR UPDATE OR DELETE ON customers
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

---

## 📊 Views Disponíveis

### 1. `recent_audit_activity`
Últimas 100 atividades do sistema

**Campos:**
- id, table_name, operation, record_id
- user_email, created_at, fields_changed

### 2. `audit_summary_by_table`
Resumo de operações por tabela

**Campos:**
- table_name, total_operations
- inserts, updates, deletes
- last_activity

### 3. `audit_summary_by_user`
Atividade agrupada por usuário

**Campos:**
- user_email, total_operations
- tables_affected
- first_activity, last_activity

---

## 🖥️ Interface de Visualização

### Localização
**Menu Lateral** → **Auditoria** (ícone de escudo 🛡️)

ou acesse: `/audit-logs`

### Recursos da Interface

#### 1. **Cards de Resumo**
Exibe estatísticas por tabela:
- Total de operações
- Número de criações
- Número de edições
- Número de exclusões

#### 2. **Filtros Avançados**
- **Por Tabela**: Filtrar por tabela específica
- **Por Operação**: INSERT, UPDATE ou DELETE
- **Por Usuário**: Buscar por email
- **Por Data**: Intervalo de datas
- **Busca**: Pesquisa livre

#### 3. **Lista de Logs**
Tabela com todas as operações mostrando:
- Data e hora
- Tabela afetada
- Tipo de operação (com cores)
- Usuário responsável
- Resumo da alteração
- Botão "Ver Detalhes"

#### 4. **Modal de Detalhes**
Ao clicar em "Ver Detalhes", exibe:

**Para UPDATE:**
- Lista de campos alterados
- Valor anterior (vermelho)
- Valor novo (verde)
- Dados completos antes/depois

**Para INSERT:**
- Dados completos do novo registro

**Para DELETE:**
- Dados completos do registro excluído

#### 5. **Exportação**
Botão "Exportar CSV" gera arquivo com:
- Data/Hora, Tabela, Operação
- Usuário, ID do Registro
- Formato: `auditoria_YYYY-MM-DD_HHmmss.csv`

---

## 🎨 Indicadores Visuais

### Cores por Operação:
- 🟢 **INSERT (Criação)**: Verde
- 🔵 **UPDATE (Edição)**: Azul
- 🔴 **DELETE (Exclusão)**: Vermelho

### Ícones:
- ➕ INSERT - Plus
- ✏️ UPDATE - Edit
- 🗑️ DELETE - Trash

---

## 🔐 Segurança (RLS)

### Políticas Ativas:

1. **Leitura**: Usuários autenticados podem ler todos os logs
```sql
"Authenticated users can view audit logs"
```

2. **Inserção**: Sistema pode inserir logs automaticamente
```sql
"System can insert audit logs"
```

**Ninguém pode:** Editar ou deletar logs manualmente

---

## 📈 Índices para Performance

Índices criados para otimizar consultas:
- `idx_audit_logs_table_name` - Por tabela
- `idx_audit_logs_operation` - Por operação
- `idx_audit_logs_user_id` - Por usuário
- `idx_audit_logs_created_at` - Por data (DESC)
- `idx_audit_logs_record_id` - Por ID do registro
- `idx_audit_logs_table_record` - Composto (tabela + record)

---

## 🧹 Manutenção

### Limpeza de Logs Antigos

Função disponível para limpar logs com mais de N dias:

```sql
SELECT cleanup_old_audit_logs(90);  -- Remove logs com mais de 90 dias
```

**Padrão**: 90 dias

---

## 📝 Exemplo de Uso

### Cenário: Cliente Alterado

**Antes:**
```json
{
  "nome_razao": "João Silva",
  "email": "joao@email.com",
  "telefone": "11999999999"
}
```

**Depois:**
```json
{
  "nome_razao": "João Silva Santos",
  "email": "joao.santos@email.com",
  "telefone": "11999999999"
}
```

**Log Gerado:**
- **Tabela**: customers
- **Operação**: UPDATE
- **Usuário**: admin@sistema.com
- **Campos Alterados**: 2
  - `nome_razao`: "João Silva" → "João Silva Santos"
  - `email`: "joao@email.com" → "joao.santos@email.com"

---

## 🚀 Como Funciona na Prática

### 1. Usuário Cria um Cliente
```
✅ Trigger captura automaticamente
✅ Registra INSERT na audit_logs
✅ Armazena dados do novo cliente
✅ Identifica usuário responsável
```

### 2. Usuário Edita uma Ordem de Serviço
```
✅ Trigger captura UPDATE
✅ Compara dados antigos vs novos
✅ Lista campos alterados
✅ Salva tudo no log
```

### 3. Usuário Exclui um Material
```
✅ Trigger captura DELETE
✅ Preserva dados do registro excluído
✅ Registra quem deletou e quando
```

---

## 🎯 Benefícios do Sistema

### ✅ Rastreabilidade Completa
- Saber quem fez o quê, quando e onde
- Histórico completo de alterações

### ✅ Conformidade e Compliance
- Atende requisitos de auditoria
- Evidências de operações

### ✅ Segurança
- Detectar alterações não autorizadas
- Identificar padrões suspeitos

### ✅ Recuperação de Dados
- Ver estado anterior de registros
- Possibilidade de rollback manual

### ✅ Análise de Comportamento
- Identificar usuários mais ativos
- Entender uso do sistema

---

## 📊 Estatísticas em Tempo Real

### Dashboard Mostra:
- Total de operações por tabela
- Últimas atividades
- Usuários mais ativos
- Horários de pico
- Tendências de uso

---

## 🔍 Consultas Úteis

### Ver últimas 10 operações em clientes:
```sql
SELECT * FROM audit_logs
WHERE table_name = 'customers'
ORDER BY created_at DESC
LIMIT 10;
```

### Ver todas as ações de um usuário:
```sql
SELECT * FROM audit_logs
WHERE user_email = 'admin@sistema.com'
ORDER BY created_at DESC;
```

### Ver registros excluídos hoje:
```sql
SELECT * FROM audit_logs
WHERE operation = 'DELETE'
AND created_at >= CURRENT_DATE
ORDER BY created_at DESC;
```

### Contar operações por tipo:
```sql
SELECT
  operation,
  COUNT(*) as total
FROM audit_logs
GROUP BY operation;
```

---

## 🎓 Casos de Uso

### 1. **Investigação de Incidentes**
"Quem alterou o preço deste serviço?"
→ Buscar na auditoria por tabela `service_catalog` + record_id

### 2. **Conformidade Legal**
"Precisamos provar que os dados foram alterados"
→ Exportar CSV filtrado por período

### 3. **Análise de Produtividade**
"Quais usuários estão mais ativos?"
→ Ver resumo por usuário

### 4. **Recuperação de Dados**
"Qual era o telefone antigo do cliente?"
→ Ver old_data no log de UPDATE

### 5. **Detecção de Fraude**
"Houve exclusões suspeitas?"
→ Filtrar por DELETE + horário incomum

---

## 🔮 Melhorias Futuras (Possíveis)

1. **IP Address Tracking** - Capturar IP real do cliente
2. **User Agent Tracking** - Identificar navegador/dispositivo
3. **Rollback Automático** - Desfazer alterações via interface
4. **Notificações** - Alertas para operações críticas
5. **Dashboards Avançados** - Gráficos e análises
6. **Retenção Automática** - Limpeza programada de logs
7. **Auditoria de Auditoria** - Rastrear acessos aos logs

---

## 📚 Tecnologias Utilizadas

- **PostgreSQL** - Banco de dados
- **Triggers** - Captura automática
- **JSONB** - Armazenamento flexível
- **RLS** - Segurança de acesso
- **React** - Interface web
- **TypeScript** - Tipagem forte
- **Tailwind CSS** - Estilização
- **Framer Motion** - Animações

---

## ✨ Conclusão

O sistema de auditoria está **100% funcional** e operando automaticamente. Todas as operações nas 8 tabelas principais são rastreadas sem necessidade de intervenção manual.

**Acesse agora**: Menu → Auditoria 🛡️

---

**Desenvolvido com** ❤️ **para garantir transparência e segurança total!**
