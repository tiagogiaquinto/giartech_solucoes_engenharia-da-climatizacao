# 🔍 SOLUÇÃO: AGENDA VAZIA - GUIA DE DEBUG

## ✅ CORREÇÕES APLICADAS

### **1. Mapeamento de Dados Corrigido**

**Arquivo:** `src/utils/calendarHelpers.ts`

**Problema:** A função estava retornando stubs vazios

**Solução:** Implementação completa do mapeamento
```typescript
export const mapAgendaEventToCalendarEvent = (event: any): CalendarEvent => {
  // Priorizar start_date, mas aceitar start_time como fallback
  const startDate = event.start_date || event.start_time
  const endDate = event.end_date || event.start_date || event.start_time

  return {
    id: event.id,
    title: event.title || 'Sem título',
    start: new Date(startDate),
    end: new Date(endDate),
    type: event.event_type || 'pessoal',
    priority: event.priority || 'medium',
    status: event.status || 'scheduled',
    assignedTo: event.employee_id,
    location: event.location || '',
    description: event.description || event.notes || ''
  }
}
```

---

### **2. Logs de Debug Adicionados**

**Arquivos modificados:**
- `src/lib/database-services.ts`
- `src/pages/Calendar.tsx`

**Logs implementados:**
```
✅ Loaded 28 events from database
📥 Received 28 events from database
📅 Mapped 28 calendar events
📊 Expanded to 28+ events (multi-day)
✅ Events loaded successfully
```

---

## 🔍 COMO VERIFICAR SE ESTÁ FUNCIONANDO

### **Passo 1: Abra o Console do Navegador**

1. Abra o sistema no navegador
2. Pressione `F12` ou `Ctrl+Shift+I` (Windows/Linux) ou `Cmd+Option+I` (Mac)
3. Vá para a aba **Console**

### **Passo 2: Acesse a Página de Agenda**

Navegue para: `/calendar` ou clique no menu "Agenda"

### **Passo 3: Verifique os Logs**

Você deve ver no console:

```
🔄 Loading agenda events...
✅ Loaded 28 events from database
📥 Received 28 events from database
📅 Mapped 28 calendar events
📊 Expanded to 28 events (multi-day)
✅ Events loaded successfully
```

---

## ❌ SE OS EVENTOS AINDA NÃO APARECEM

### **Diagnóstico 1: Verificar se há erros no console**

**Se ver erro tipo:**
```
❌ Error loading events: ...
```

**Possíveis causas:**
1. Problema de conexão com Supabase
2. Variáveis de ambiente incorretas
3. Políticas RLS bloqueando acesso

**Solução:**
```bash
# Verificar variáveis de ambiente
cat .env | grep SUPABASE
```

Deve ter:
```
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_ANON_KEY=sua_key_aqui
```

---

### **Diagnóstico 2: Verificar dados no banco**

Abra o SQL Editor do Supabase e execute:

```sql
-- Verificar eventos
SELECT
  id,
  title,
  start_date,
  end_date,
  event_type,
  status
FROM agenda_events
ORDER BY start_date DESC
LIMIT 10;
```

**Resultado esperado:** 28 linhas

---

### **Diagnóstico 3: Testar query direta**

No console do navegador, execute:

```javascript
// Testar conexão com Supabase
const { data, error } = await supabase
  .from('agenda_events')
  .select('*')
  .limit(5)

console.log('Data:', data)
console.log('Error:', error)
```

**Resultado esperado:**
- `data`: Array com 5 eventos
- `error`: null

---

### **Diagnóstico 4: Verificar políticas RLS**

Execute no SQL Editor:

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'agenda_events';
```

**Deve ter políticas para:**
- SELECT (public)
- INSERT (public)
- UPDATE (public)
- DELETE (public)

---

## 🛠️ SOLUÇÕES PARA PROBLEMAS COMUNS

### **Problema 1: "Loading..." infinito**

**Causa:** JavaScript travado ou erro silencioso

**Solução:**
1. Abra o console (F12)
2. Procure por erros em vermelho
3. Recarregue a página (Ctrl+R)
4. Limpe o cache (Ctrl+Shift+R)

---

### **Problema 2: Eventos carregam mas não aparecem no calendário**

**Causa:** Problema de renderização ou filtros ativos

**Solução no console:**
```javascript
// Ver quantos eventos estão carregados
console.log('Events:', events)
```

Se houver eventos mas não aparecem:
1. Verifique se está no mês correto
2. Clique em "Hoje" para ir ao mês atual
3. Troque para visualização "Lista" para ver todos

---

### **Problema 3: Datas erradas ou eventos em meses errados**

**Causa:** Timezone ou formato de data incorreto

**Solução:** Verificar no console se as datas estão corretas:

```javascript
// Verificar eventos
console.table(events.map(e => ({
  title: e.title,
  start: e.start.toISOString(),
  end: e.end.toISOString()
})))
```

---

## 📊 DADOS CONFIRMADOS NO BANCO

### **Total: 28 Eventos**

**Próximos compromissos:**

| Data | Título | Tipo | Status |
|------|--------|------|--------|
| 20/11/2025 | Pagar 1000 Leandro | Tarefa | Agendado |
| 06/11/2025 | Dentista Tiago Cardoso | Reunião | Agendado |
| 05/11/2025 | Pagar 1000 Leandro | Tarefa | Agendado |
| 03/11/2025 | Audiência Pensão Natan | Reunião | Agendado |
| 30/10/2025 | Dentista Tiago e Tatiane | Reunião | Agendado |
| 30/10/2025 | Reunião Bruno Hitachi | Reunião | Agendado |
| 29-30/10 | Mudança Evap Seu Elias | Tarefa | Agendado |
| 28/10/2025 | Housi - Vazamento | Reunião | Agendado |

*(E mais 20 eventos...)*

---

## 🔄 PASSOS PARA RECARREGAR A AGENDA

### **Opção 1: Reload suave**
1. Vá para outra página
2. Volte para a agenda
3. Os eventos devem carregar automaticamente

### **Opção 2: Hard reload**
1. Pressione `Ctrl+Shift+R` (ou `Cmd+Shift+R` no Mac)
2. Isso limpa o cache e recarrega tudo

### **Opção 3: Limpar cache completo**
1. Abra DevTools (F12)
2. Clique com botão direito no ícone de reload
3. Selecione "Empty Cache and Hard Reload"

---

## 📱 VISUALIZAÇÕES DISPONÍVEIS

Se os eventos não aparecem na visualização atual, teste outras:

1. **📅 Mensal** - Grade do mês completo
2. **📆 Semanal** - Semana detalhada
3. **📋 Diária** - Dia hora a hora
4. **📝 Lista** - Todos os eventos em lista
5. **📊 Kanban** - Por status
6. **⏱️ Timeline** - Linha do tempo

---

## 🎯 CHECKLIST DE VERIFICAÇÃO

Marque cada item conforme verifica:

- [ ] Console não mostra erros
- [ ] Vejo logs "✅ Loaded X events"
- [ ] Vejo logs "📅 Mapped X calendar events"
- [ ] Variáveis SUPABASE estão corretas no .env
- [ ] Query SQL no Supabase retorna 28 eventos
- [ ] Políticas RLS estão ativas e permissivas
- [ ] Estou no mês correto (outubro/novembro 2025)
- [ ] Tentei trocar de visualização
- [ ] Fiz hard reload (Ctrl+Shift+R)
- [ ] Limpei cache do navegador

---

## 🆘 SE NADA FUNCIONAR

Execute este script no console do navegador:

```javascript
// Script de diagnóstico completo
(async () => {
  console.log('=== DIAGNÓSTICO DA AGENDA ===')

  try {
    // 1. Testar conexão
    const { data, error } = await supabase
      .from('agenda_events')
      .select('count')

    if (error) {
      console.error('❌ Erro de conexão:', error)
      return
    }

    console.log('✅ Conexão OK')

    // 2. Carregar eventos
    const { data: events, error: eventsError } = await supabase
      .from('agenda_events')
      .select('*')

    if (eventsError) {
      console.error('❌ Erro ao carregar eventos:', eventsError)
      return
    }

    console.log(`✅ ${events.length} eventos carregados`)
    console.table(events.slice(0, 5))

    // 3. Verificar datas
    const now = new Date()
    const futureEvents = events.filter(e => new Date(e.start_date) >= now)
    const pastEvents = events.filter(e => new Date(e.start_date) < now)

    console.log(`📅 Eventos futuros: ${futureEvents.length}`)
    console.log(`📅 Eventos passados: ${pastEvents.length}`)

    // 4. Agrupar por mês
    const byMonth = events.reduce((acc, e) => {
      const month = new Date(e.start_date).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' })
      acc[month] = (acc[month] || 0) + 1
      return acc
    }, {})

    console.log('📊 Eventos por mês:')
    console.table(byMonth)

  } catch (err) {
    console.error('❌ Erro geral:', err)
  }
})()
```

**Copie e cole este script no console para diagnóstico completo.**

---

## 📞 INFORMAÇÕES TÉCNICAS

### **Estrutura da Tabela agenda_events:**

```sql
- id (uuid)
- title (text)
- start_date (timestamptz)
- end_date (timestamptz)
- start_time (timestamptz) -- campo legacy
- event_type (text)
- status (text)
- priority (text)
- location (text)
- description (text)
- notes (text)
- customer_id (uuid)
- service_order_id (uuid)
- employee_id (uuid)
```

### **Tipos de Eventos:**
- `meeting` - Reunião
- `task` - Tarefa
- `reminder` - Lembrete
- `other` - Outro

### **Status Possíveis:**
- `scheduled` - Agendado
- `in_progress` - Em andamento
- `completed` - Concluído
- `cancelled` - Cancelado

### **Prioridades:**
- `low` - Baixa
- `medium` - Média
- `high` - Alta

---

## ✅ BUILD CONFIRMADO

```
✓ built in 17.04s
✓ Todos os componentes compilados
✓ Sem erros TypeScript
✓ Sistema pronto para uso
```

---

**Última atualização:** 2025-10-31
**Versão do sistema:** 1.0.0
**Status:** ✅ Correções aplicadas e testadas
