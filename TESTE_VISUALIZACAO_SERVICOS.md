# 🔍 TESTE DE VISUALIZAÇÃO DOS SERVIÇOS - ORDEM E PDF

## ✅ CORREÇÕES IMPLEMENTADAS

### 1️⃣ **Busca Completa do Catálogo**

**Arquivo:** `src/lib/supabase.ts` (linha 422-440)

**Antes:**
```javascript
supabase.from('service_order_items')
  .select('*, service_catalog:service_catalog_id(id, name, description, base_price)')
```

**Agora:**
```javascript
supabase.from('service_order_items').select(`
  *,
  service_catalog:service_catalog_id(
    id,
    name,
    description,
    base_price,
    category,
    escopo_servico,              ✅
    requisitos_tecnicos,         ✅
    avisos_seguranca,            ✅
    passos_execucao,             ✅
    resultados_esperados,        ✅
    padroes_qualidade,           ✅
    informacoes_garantia,        ✅
    observacoes_tecnicas,        ✅
    tempo_estimado_minutos       ✅
  )
`)
```

---

### 2️⃣ **Mapeamento Completo dos Itens**

**Arquivo:** `src/pages/ServiceOrderView.tsx` (linha 327-358)

Agora cada item busca dados em CASCATA:

```javascript
{
  service_name: item.service_name || catalogData.name || 'Serviço',
  description: item.descricao || catalogData.description || '',
  scope: item.escopo_detalhado || catalogData.escopo_servico || '',
  service_scope: item.escopo_detalhado || catalogData.escopo_servico || '',
  technical_requirements: catalogData.requisitos_tecnicos || '',
  safety_warnings: catalogData.avisos_seguranca || '',
  execution_steps: catalogData.passos_execucao || '',
  expected_results: catalogData.resultados_esperados || '',
  quality_standards: catalogData.padroes_qualidade || '',
  warranty_info: catalogData.informacoes_garantia || '',
  observations: catalogData.observacoes_tecnicas || '',
  unit: item.unit || 'un.',
  unit_price: item.unit_price || catalogData.base_price || 0,
  quantity: item.quantity || 1,
  total_price: item.total_price || (item.quantity * item.unit_price) || 0,
  estimated_duration: catalogData.tempo_estimado_minutos || 0
}
```

---

### 3️⃣ **Logs de Debug Implementados**

Para rastrear os dados, foram adicionados console.logs:

```javascript
console.log('📦 PREPARANDO DADOS GIARTECH')
console.log('📦 Total de itens:', order.items?.length)
console.log('📝 Primeiro item completo:', order.items[0])
console.log('📚 Catálogo do primeiro item:', order.items[0].service_catalog)
console.log('🔧 Mapeando item:', {
  service_name: item.service_name || catalogData.name,
  has_catalog: !!item.service_catalog,
  catalog_fields: Object.keys(catalogData),
  escopo_item: item.escopo_detalhado,
  escopo_catalog: catalogData.escopo_servico
})
```

---

## 🧪 COMO TESTAR

### **PASSO 1: Abrir o Console do Navegador**

1. Acesse o sistema
2. Pressione **F12** (ou Ctrl+Shift+I / Cmd+Option+I)
3. Vá na aba **Console**

---

### **PASSO 2: Abrir uma Ordem de Serviço**

1. Vá em **Ordens de Serviço**
2. Clique em qualquer OS existente
3. Observe os logs no console:

```
📦 PREPARANDO DADOS GIARTECH
📦 Total de itens: 2
📝 Primeiro item completo: {
  id: "...",
  service_name: "Instalação de Split",
  quantity: 2,
  unit_price: 450.00,
  service_catalog: {
    id: "...",
    name: "Instalação de Split 12.000 BTUs",
    description: "Instalação completa...",
    escopo_servico: "• Fixação das unidades\n• Tubulação...",
    requisitos_tecnicos: "• Disjuntor 25A...",
    ...
  }
}
🔧 Mapeando item 1: {
  service_name: "Instalação de Split",
  has_catalog: true,
  catalog_fields: ["id", "name", "description", "escopo_servico", ...],
  escopo_item: null,
  escopo_catalog: "• Fixação das unidades..."
}
```

---

### **PASSO 3: Verificar Visualização na Tela**

Na tela de visualização da OS, você DEVE ver:

```
┌─────────────────────────────────────────────┐
│ SERVIÇOS                                    │
├─────────────────────────────────────────────┤
│                                              │
│ Instalação de Split 12.000 BTUs            │
│                                              │
│ ESCOPO:                                     │
│ • Fixação da unidade evaporadora           │
│ • Fixação da unidade condensadora          │
│ • Tubulação de cobre até 5 metros         │
│ • Instalação elétrica dedicada             │
│ • Sistema de dreno                          │
│ • Teste de funcionamento                    │
│                                              │
│ Unidade: un.    Preço Unitário: R$ 450,00  │
│ Quantidade: 2   Total: R$ 900,00            │
└─────────────────────────────────────────────┘
```

---

### **PASSO 4: Clicar em "Visualizar Giartech"**

1. Clique no botão **"Visualizar Giartech"**
2. A modal deve abrir mostrando a OS formatada
3. Verifique se aparecem:
   - ✅ Nome do serviço
   - ✅ Descrição
   - ✅ Escopo detalhado
   - ✅ Quantidade
   - ✅ Preço unitário
   - ✅ Preço total

---

### **PASSO 5: Gerar PDF**

1. Clique em **"Baixar PDF"**
2. Abra o PDF gerado
3. Verifique se no PDF aparece:

```
┌────────────────────────────────────────────────┐
│ DESCRIÇÃO DO SERVIÇO                           │
├────────────────────────────────────────────────┤
│                                                 │
│ Instalação de Split 12.000 BTUs               │
│                                                 │
│ Instalação completa de ar condicionado tipo    │
│ split, incluindo fixação das unidades interna  │
│ e externa, tubulação e cabeamento completo.    │
│                                                 │
│ ESCOPO DO SERVIÇO:                             │
│ • Fixação da unidade evaporadora (interna)    │
│ • Fixação da unidade condensadora (externa)   │
│ • Tubulação de cobre até 5 metros             │
│ • Instalação elétrica dedicada                │
│ • Sistema de dreno                             │
│ • Carga de gás refrigerante                   │
│ • Teste de vazamento                          │
│ • Teste de funcionamento completo             │
│                                                 │
│ REQUISITOS TÉCNICOS:                           │
│ • Disjuntor dedicado de 25A                   │
│ • Cabo 4mm² para alimentação                  │
│ • Suporte para condensadora                   │
│ • Ponto de dreno disponível                   │
│                                                 │
│ ⏱ Tempo estimado: 180 minutos                │
│                                                 │
├─────────┬──────────┬──────┬───────────────────┤
│ Unidade │ Preço Un.│ Qtd. │ Total             │
├─────────┼──────────┼──────┼───────────────────┤
│ un.     │ R$ 450,00│   2  │ R$ 900,00         │
└─────────┴──────────┴──────┴───────────────────┘
```

---

## 🔍 O QUE VERIFICAR NOS LOGS

### ✅ **Dados CORRETOS:**

```javascript
{
  service_name: "Nome do serviço",  // ✅ TEM valor
  has_catalog: true,                 // ✅ TRUE
  catalog_fields: [                  // ✅ Array grande
    "id", "name", "description",
    "escopo_servico", "requisitos_tecnicos", ...
  ],
  escopo_catalog: "Texto do escopo"  // ✅ TEM conteúdo
}
```

### ❌ **Dados INCORRETOS (problema):**

```javascript
{
  service_name: "Nome do serviço",
  has_catalog: false,                // ❌ FALSE - catálogo não veio!
  catalog_fields: [],                // ❌ Vazio
  escopo_catalog: ""                 // ❌ Vazio
}
```

ou

```javascript
{
  service_name: "Nome do serviço",
  has_catalog: true,
  catalog_fields: ["id", "name"],    // ❌ Só 2 campos! Faltam os outros
  escopo_catalog: ""                 // ❌ Vazio
}
```

---

## 🐛 POSSÍVEIS PROBLEMAS E SOLUÇÕES

### **Problema 1: Catálogo não vem (has_catalog: false)**

**Causa:** Item da OS não tem `service_catalog_id` preenchido

**Solução:**
1. Ao criar/editar OS, garantir que o serviço é selecionado do catálogo
2. Verificar se tabela `service_order_items` tem campo `service_catalog_id` preenchido

---

### **Problema 2: Catálogo vem mas sem campos detalhados**

**Causa:** Campos no catálogo estão NULL

**Solução:**
1. Editar o serviço no **Catálogo de Serviços**
2. Preencher os campos:
   - Escopo do Serviço
   - Requisitos Técnicos
   - Avisos de Segurança
   - etc.

---

### **Problema 3: Visualização mostra mas PDF não**

**Causa:** Erro na geração do PDF

**Solução:**
1. Verificar console do navegador
2. Procurar por erros JavaScript
3. Verificar se `generateServiceOrderPDFGiartech` está recebendo os dados

---

## 📊 EXEMPLO DE TESTE COMPLETO

### **1. Preparar Serviço no Catálogo**

```sql
-- Verificar se serviço tem todos campos
SELECT
  name,
  description,
  escopo_servico,
  requisitos_tecnicos,
  tempo_estimado_minutos
FROM service_catalog
WHERE id = 'SEU_ID';
```

Se algum campo está NULL, preencher:

```sql
UPDATE service_catalog
SET
  escopo_servico = '• Fixação das unidades
• Tubulação de cobre
• Sistema de dreno
• Teste de funcionamento',
  requisitos_tecnicos = '• Disjuntor 25A
• Cabo 4mm²
• Suporte para condensadora',
  tempo_estimado_minutos = 180
WHERE id = 'SEU_ID';
```

---

### **2. Criar/Editar OS com esse serviço**

1. Ir em **Nova Ordem de Serviço**
2. Adicionar serviço do catálogo
3. Definir quantidade (ex: 2)
4. Salvar

---

### **3. Visualizar e Testar**

1. Abrir a OS
2. Ver console - deve mostrar dados completos
3. Clicar "Visualizar Giartech" - deve mostrar tudo
4. Baixar PDF - deve conter todos detalhes

---

## ✅ CHECKLIST DE VALIDAÇÃO

- [ ] Console mostra `has_catalog: true`
- [ ] Console mostra array com 10+ campos em `catalog_fields`
- [ ] Console mostra `escopo_catalog` com conteúdo
- [ ] Tela de visualização mostra ESCOPO
- [ ] Tela mostra quantidade e valores
- [ ] Modal Giartech renderiza completa
- [ ] PDF é gerado sem erros
- [ ] PDF contém nome do serviço
- [ ] PDF contém descrição
- [ ] PDF contém escopo detalhado
- [ ] PDF contém quantidade e valores
- [ ] PDF contém requisitos técnicos (se preenchido)
- [ ] PDF contém tempo estimado (se preenchido)

---

## 🎯 RESULTADO ESPERADO

Ao final, você deve ter:

✅ **Visualização na tela** = Completa com todos detalhes
✅ **Console** = Logs mostrando dados carregados
✅ **PDF gerado** = Documento profissional com tudo

---

**Sistema compilado e pronto para teste! Siga os passos acima e verifique se tudo está funcionando.** 🚀
