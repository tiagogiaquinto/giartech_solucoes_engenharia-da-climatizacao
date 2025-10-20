# 🔄 SISTEMA DE MÚLTIPLOS SERVIÇOS, MATERIAIS E MÃO DE OBRA

## ✅ 100% FUNCIONAL E ATIVADO

---

## 🎯 CAPACIDADES DO SISTEMA

### **O sistema suporta ILIMITADOS:**
- ✅ **Serviços** (1, 2, 3, 4, 5+...)
- ✅ **Materiais por serviço** (0, 1, 2, 3+...)
- ✅ **Funcionários por serviço** (0, 1, 2, 3+...)

### **Cada serviço é INDEPENDENTE:**
- Tem seus próprios materiais
- Tem sua própria equipe
- Tem seus próprios custos
- Tem seu próprio lucro

---

## 📐 ESTRUTURA VISUAL

```
┌─────────────────────────────────────────────┐
│ ORDEM DE SERVIÇO                            │
├─────────────────────────────────────────────┤
│                                             │
│ [Cliente: João Silva]                       │
│ [Data Agendada: 15/10/2025]                 │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│ ┌─ SERVIÇO #1 ──────────────────────── [X] │
│ │                                           │
│ │ 🔍 Buscar Catálogo → [Instalação AC]     │
│ │                                           │
│ │ Descrição: Instalação AC Split 12k       │
│ │ Qtd: 2 | Preço: R$ 500 | Tempo: 120min   │
│ │                                           │
│ │ ┌─ Materiais ──────────────── [+ Mat]─┐  │
│ │ │ 🔍 Buscar Estoque                    │  │
│ │ │ • Suporte Parede - 2 UN - R$ 90      │  │
│ │ │ • Tubo Cobre - 5 M - R$ 120          │  │
│ │ └──────────────────────────────────────┘  │
│ │                                           │
│ │ ┌─ Mão de Obra ────────────── [+ Func]┐  │
│ │ │ 🔍 Buscar Funcionário                │  │
│ │ │ • João Silva - 120min - R$ 100       │  │
│ │ │ • Pedro Costa - 120min - R$ 60       │  │
│ │ └──────────────────────────────────────┘  │
│ │                                           │
│ │ Custo Mat: R$210 | Mão Obra: R$160       │
│ │ Lucro: R$630 | Margem: 63%               │
│ └───────────────────────────────────────────┘
│                                             │
│ ┌─ SERVIÇO #2 ──────────────────────── [X] │
│ │                                           │
│ │ 🔍 Buscar Catálogo → [Manutenção]        │
│ │                                           │
│ │ Descrição: Manutenção Preventiva         │
│ │ Qtd: 1 | Preço: R$ 200 | Tempo: 60min    │
│ │                                           │
│ │ ┌─ Materiais ──────────────── [+ Mat]─┐  │
│ │ │ • Filtro AC - 2 UN - R$ 30           │  │
│ │ │ • Óleo Lubrif. - 1 L - R$ 45         │  │
│ │ └──────────────────────────────────────┘  │
│ │                                           │
│ │ ┌─ Mão de Obra ────────────── [+ Func]┐  │
│ │ │ • Maria Santos - 60min - R$ 45       │  │
│ │ └──────────────────────────────────────┘  │
│ │                                           │
│ │ Custo Mat: R$75 | Mão Obra: R$45         │
│ │ Lucro: R$80 | Margem: 40%                │
│ └───────────────────────────────────────────┘
│                                             │
│ ┌─ SERVIÇO #3 ──────────────────────── [X] │
│ │ Descrição: Limpeza Completa              │
│ │ Qtd: 1 | Preço: R$ 100 | Tempo: 90min    │
│ │                                           │
│ │ [Sem materiais]                          │
│ │                                           │
│ │ ┌─ Mão de Obra ────────────── [+ Func]┐  │
│ │ │ • Ana Paula - 90min - R$ 40          │  │
│ │ └──────────────────────────────────────┘  │
│ │                                           │
│ │ Lucro: R$60 | Margem: 60%                │
│ └───────────────────────────────────────────┘
│                                             │
│ [+ Adicionar Outro Serviço]                 │
│                                             │
├─────────────────────────────────────────────┤
│ RESUMO FINANCEIRO                           │
│                                             │
│ Subtotal:           R$ 2.200,00             │
│ Desconto 5%:        R$  -110,00             │
│ ─────────────────────────────────           │
│ TOTAL:              R$ 2.090,00             │
│                                             │
│ Custo Total:        R$  635,00              │
│ Lucro Total:        R$ 1.455,00             │
│ Margem Média:       69,6%                   │
└─────────────────────────────────────────────┘
```

---

## 🔄 FUNCIONALIDADES POR CATEGORIA

### **1. SERVIÇOS MÚLTIPLOS**

#### **Adicionar Serviço:**
```
Botão: [+ Adicionar Outro Serviço]
Localização: Abaixo do último serviço
Ação: Cria novo card de serviço vazio

Cada serviço tem:
✓ Descrição única
✓ Quantidade própria
✓ Preço próprio
✓ Tempo estimado próprio
✓ Lista de materiais própria
✓ Lista de funcionários própria
✓ Cálculos independentes
```

#### **Remover Serviço:**
```
Botão: [X] (canto superior direito do card)
Ação: Remove o serviço completo
Validação: Mantém pelo menos 1 serviço

Ao remover:
✓ Remove serviço
✓ Remove todos materiais do serviço
✓ Remove todos funcionários do serviço
✓ Recalcula totais automaticamente
```

#### **Buscar do Catálogo:**
```
Cada serviço tem seu próprio dropdown azul:
🔍 Buscar do Catálogo de Serviços

Ao selecionar:
✓ Preenche descrição
✓ Preenche preço
✓ Preenche tempo
✓ Adiciona TODOS os materiais do catálogo
✓ Adiciona TODOS os funcionários do catálogo
✓ Calcula custos automaticamente
```

---

### **2. MATERIAIS MÚLTIPLOS (POR SERVIÇO)**

#### **Adicionar Material:**
```
Botão: [+ Material]
Localização: Dentro de cada serviço
Ação: Adiciona linha vazia de material

Materiais SÃO INDEPENDENTES entre serviços:
Serviço #1 pode ter: Tubo, Parafuso, Suporte
Serviço #2 pode ter: Filtro, Óleo
Serviço #3 pode ter: Nenhum material
```

#### **Remover Material:**
```
Botão: [🗑️] (ícone lixeira)
Ação: Remove apenas aquele material
Não afeta: Outros materiais do mesmo serviço
```

#### **Buscar do Estoque:**
```
Cada serviço tem seu dropdown verde:
🔍 Buscar do Inventário/Estoque

Preenche o último material vazio:
✓ Nome do material
✓ Quantidade: 1 (padrão)
✓ Preço de compra
✓ Preço de venda
✓ Unidade de medida
✓ Cálculos automáticos
```

#### **Editar Material:**
```
Campos editáveis:
├─ Seleção do material (dropdown)
├─ Quantidade (número + unidade)
├─ Preço de compra (opcional)
├─ Preço de venda
├─ Markup (%)
└─ Observações

Ao editar quantidade:
✓ Recalcula valor total
✓ Recalcula custo do serviço
✓ Recalcula lucro do serviço
✓ Recalcula total da OS
```

---

### **3. MÃO DE OBRA MÚLTIPLA (POR SERVIÇO)**

#### **Adicionar Funcionário:**
```
Botão: [+ Funcionário]
Localização: Dentro de cada serviço
Ação: Adiciona linha vazia de funcionário

Funcionários SÃO INDEPENDENTES entre serviços:
Serviço #1 pode ter: João, Pedro
Serviço #2 pode ter: Maria
Serviço #3 pode ter: Ana Paula, João
```

#### **Remover Funcionário:**
```
Botão: [🗑️] (ícone lixeira)
Ação: Remove apenas aquele funcionário
Não afeta: Outros funcionários do mesmo serviço
```

#### **Buscar Funcionário:**
```
Cada serviço tem seu dropdown roxo:
🔍 Buscar Funcionário Cadastrado

Preenche o último funcionário vazio:
✓ Nome do funcionário
✓ Custo por hora
✓ Tempo: 60min (padrão, 1h)
✓ Cargo/função
✓ Cálculo do custo total
```

#### **Editar Mão de Obra:**
```
Campos editáveis:
├─ Seleção do funcionário (dropdown)
├─ Tempo em minutos
├─ Custo por hora
└─ Custo total (calculado)

Ao editar tempo:
✓ Recalcula custo do funcionário
✓ Recalcula custo de mão de obra do serviço
✓ Recalcula lucro do serviço
✓ Recalcula total da OS
```

---

## 💰 CÁLCULOS AUTOMÁTICOS

### **Por Serviço:**
```javascript
CUSTO MATERIAIS = Σ(qtd × preço_compra)
CUSTO MÃO OBRA = Σ((tempo/60) × custo_hora)
CUSTO TOTAL = CUSTO MATERIAIS + CUSTO MÃO OBRA
PREÇO TOTAL = quantidade × preço_unitário
LUCRO = PREÇO TOTAL - CUSTO TOTAL
MARGEM = (LUCRO / PREÇO TOTAL) × 100
```

### **Totais da OS:**
```javascript
SUBTOTAL = Σ(PREÇO TOTAL de todos serviços)
DESCONTO = SUBTOTAL × (desconto_% / 100)
       ou = desconto_valor
TOTAL = SUBTOTAL - DESCONTO

CUSTO TOTAL OS = Σ(CUSTO TOTAL de todos serviços)
LUCRO TOTAL OS = TOTAL - CUSTO TOTAL OS
MARGEM MÉDIA = (LUCRO TOTAL / TOTAL) × 100
```

---

## 🔄 FLUXOS DE USO

### **Cenário 1: OS Simples - 1 Serviço**
```
1. Criar OS
2. Selecionar cliente
3. 🔍 Buscar serviço do catálogo
4. Ajustar se necessário
5. Salvar

Resultado:
✓ 1 serviço
✓ 3 materiais (do catálogo)
✓ 2 funcionários (do catálogo)
✓ Todos os cálculos automáticos
```

### **Cenário 2: OS Média - 3 Serviços**
```
1. Criar OS
2. Selecionar cliente

SERVIÇO #1:
3. 🔍 Buscar "Instalação AC"
4. Ajustar quantidade: 1 → 2

SERVIÇO #2:
5. [+ Adicionar Outro Serviço]
6. 🔍 Buscar "Manutenção"
7. Adicionar material extra:
   - [+ Material] → 🔍 "Filtro Extra"

SERVIÇO #3:
8. [+ Adicionar Outro Serviço]
9. Digitar descrição: "Limpeza"
10. [+ Funcionário] → 🔍 "Ana Paula"

11. Configurar pagamento e garantia
12. Salvar

Resultado:
✓ 3 serviços diferentes
✓ 10+ materiais no total
✓ 5+ funcionários no total
✓ Cálculos precisos por serviço
✓ Total geral consolidado
```

### **Cenário 3: OS Complexa - 5+ Serviços**
```
1. Criar OS
2. Cliente: "Empresa Grande Ltda"

SERVIÇOS:
3. Instalação de 5 ACs (catálogo)
4. Instalação Elétrica (catálogo)
5. Instalação Hidráulica (manual)
6. Pintura (catálogo)
7. Limpeza Final (manual)

AJUSTES:
8. Adicionar materiais extras em cada serviço
9. Adicionar funcionários especializados
10. Ajustar tempos estimados
11. Configurar desconto 10%
12. Pagamento: 5x no cartão

13. [Gerar PDF] → Documento profissional
14. Salvar

Resultado:
✓ 5 serviços completos
✓ 20+ materiais
✓ 10+ funcionários
✓ PDF de 4-5 páginas
✓ Todos os cálculos corretos
✓ Margem por serviço e total
```

---

## 🎯 RECURSOS INTELIGENTES

### **1. Busca do Catálogo (por serviço):**
```
Ao selecionar serviço do catálogo:
✓ Preenche descrição, preço, tempo
✓ IMPORTA todos materiais vinculados
✓ IMPORTA toda mão de obra vinculada
✓ Mantém editável para ajustes
✓ Não afeta outros serviços
```

### **2. Busca do Estoque (por serviço):**
```
Ao buscar material do estoque:
✓ Preenche no serviço atual
✓ Mostra quantidade disponível
✓ Preços atualizados
✓ Não afeta outros serviços
```

### **3. Busca de Funcionários (por serviço):**
```
Ao buscar funcionário:
✓ Adiciona no serviço atual
✓ Mesmo funcionário pode estar em N serviços
✓ Custos calculados independentemente
✓ Tempo individual por serviço
```

### **4. Remoção Inteligente:**
```
Ao remover serviço:
✓ Remove serviço completo
✓ Remove todos materiais associados
✓ Remove todos funcionários associados
✓ Recalcula totais da OS
✓ Mantém outros serviços intactos
```

---

## 📊 VALIDAÇÕES

### **Serviços:**
```
✓ Mínimo: 1 serviço obrigatório
✓ Máximo: Ilimitado
✓ Descrição: Obrigatória (se preenchido)
✓ Quantidade: Mínimo 1
✓ Preço: Pode ser 0 (serviço gratuito)
```

### **Materiais:**
```
✓ Mínimo por serviço: 0 (opcional)
✓ Máximo por serviço: Ilimitado
✓ Quantidade: Maior que 0
✓ Preço: Obrigatório se material selecionado
```

### **Funcionários:**
```
✓ Mínimo por serviço: 0 (opcional)
✓ Máximo por serviço: Ilimitado
✓ Tempo: Maior que 0
✓ Custo/hora: Obrigatório se funcionário selecionado
```

---

## 🎨 INDICADORES VISUAIS

### **Cards de Serviço:**
```
Cor de fundo por estado:
├─ Branco: Normal
├─ Azul claro: Ao passar mouse
└─ Vermelho claro: Erro de validação

Header do card:
├─ "Serviço #1" (numeração automática)
└─ Botão [X] se houver mais de 1 serviço
```

### **Resumo por Serviço:**
```
Indicadores coloridos:
├─ Laranja: Custo de Materiais
├─ Azul: Custo de Mão de Obra
├─ Verde: Lucro
└─ Roxo: Margem de Lucro (%)
```

### **Botões:**
```
Cores por tipo:
├─ Verde: Adicionar material
├─ Azul: Adicionar funcionário
├─ Cinza: Adicionar serviço (borda tracejada)
└─ Vermelho: Remover (lixeira)
```

---

## ✅ CHECKLIST DE FUNCIONALIDADES

### **Serviços:**
☑️ Adicionar múltiplos serviços
☑️ Remover serviços (exceto o último)
☑️ Buscar do catálogo
☑️ Preencher manualmente
☑️ Editar descrição, qtd, preço, tempo
☑️ Cálculos independentes por serviço
☑️ Numeração automática

### **Materiais:**
☑️ Adicionar múltiplos materiais por serviço
☑️ Remover materiais individualmente
☑️ Buscar do estoque
☑️ Preencher manualmente
☑️ Editar quantidade e preços
☑️ Cálculos automáticos por material
☑️ Subtotal por serviço

### **Funcionários:**
☑️ Adicionar múltiplos funcionários por serviço
☑️ Remover funcionários individualmente
☑️ Buscar cadastro
☑️ Preencher manualmente
☑️ Editar tempo e custo
☑️ Cálculos automáticos por funcionário
☑️ Subtotal de mão de obra por serviço

### **Totais:**
☑️ Subtotal por serviço
☑️ Subtotal geral da OS
☑️ Desconto (% ou valor)
☑️ Total final
☑️ Custo total
☑️ Lucro total
☑️ Margem média

---

## 📈 EXEMPLO PRÁTICO COMPLETO

### **OS: Reforma Completa de Escritório**

```
CLIENTE: Tech Solutions Ltda

SERVIÇO #1: Instalação de Climatização
├─ Descrição: Instalação de 3 ACs Split 18k BTU
├─ Quantidade: 3 unidades
├─ Preço Unitário: R$ 800,00
├─ Materiais:
│  ├─ Suporte de parede - 6 UN - R$ 270,00
│  ├─ Tubo de cobre - 15 M - R$ 360,00
│  └─ Parafusos e buchas - 3 KIT - R$ 45,00
├─ Funcionários:
│  ├─ João Silva (Instalador) - 360 min - R$ 300,00
│  └─ Pedro Costa (Auxiliar) - 360 min - R$ 180,00
├─ Custo Total: R$ 1.155,00
├─ Preço Total: R$ 2.400,00
├─ Lucro: R$ 1.245,00
└─ Margem: 51,9%

SERVIÇO #2: Instalação Elétrica
├─ Descrição: Rede elétrica completa
├─ Quantidade: 1 projeto
├─ Preço Unitário: R$ 1.500,00
├─ Materiais:
│  ├─ Fio 2.5mm - 200 M - R$ 760,00
│  ├─ Disjuntores - 15 UN - R$ 675,00
│  └─ Tomadas e interruptores - 30 UN - R$ 450,00
├─ Funcionários:
│  ├─ Carlos Eletricista - 480 min - R$ 400,00
│  └─ Roberto Auxiliar - 480 min - R$ 240,00
├─ Custo Total: R$ 2.525,00
├─ Preço Total: R$ 1.500,00
├─ Lucro: R$ -1.025,00 ⚠️
└─ Margem: -68,3% ⚠️

AJUSTE NECESSÁRIO:
Preço Unitário: R$ 1.500,00 → R$ 3.500,00
Novo Lucro: R$ 975,00 ✓
Nova Margem: 27,9% ✓

SERVIÇO #3: Pintura
├─ Descrição: Pintura completa 200m²
├─ Quantidade: 1 projeto
├─ Preço Unitário: R$ 2.000,00
├─ Materiais:
│  ├─ Tinta branca - 40 L - R$ 800,00
│  ├─ Massa corrida - 10 KG - R$ 150,00
│  └─ Rolo e pincéis - 1 KIT - R$ 80,00
├─ Funcionários:
│  ├─ José Pintor - 960 min - R$ 640,00
│  └─ Manuel Auxiliar - 960 min - R$ 480,00
├─ Custo Total: R$ 2.150,00
├─ Preço Total: R$ 2.000,00
├─ Lucro: R$ -150,00 ⚠️
└─ Margem: -7,5% ⚠️

AJUSTE NECESSÁRIO:
Preço Unitário: R$ 2.000,00 → R$ 2.800,00
Novo Lucro: R$ 650,00 ✓
Nova Margem: 23,2% ✓

SERVIÇO #4: Limpeza Pós-Obra
├─ Descrição: Limpeza final completa
├─ Quantidade: 1 projeto
├─ Preço Unitário: R$ 500,00
├─ Materiais:
│  └─ Produtos de limpeza - 1 KIT - R$ 120,00
├─ Funcionários:
│  ├─ Ana Paula - 240 min - R$ 160,00
│  └─ Carla Santos - 240 min - R$ 160,00
├─ Custo Total: R$ 440,00
├─ Preço Total: R$ 500,00
├─ Lucro: R$ 60,00
└─ Margem: 12,0%

═══════════════════════════════════════
RESUMO FINANCEIRO DA OS:

Subtotal: R$ 9.200,00
Desconto 5%: R$ -460,00
─────────────────────────────────────
TOTAL: R$ 8.740,00

Custo Total: R$ 6.270,00
Lucro Total: R$ 2.470,00
Margem Média: 28,3%
═══════════════════════════════════════
```

---

## 🚀 VANTAGENS DO SISTEMA

### **Flexibilidade:**
```
✓ Serviços simples (1 serviço)
✓ Serviços médios (2-3 serviços)
✓ Serviços complexos (5+ serviços)
✓ Combinação livre de materiais
✓ Combinação livre de funcionários
```

### **Precisão:**
```
✓ Cálculos por serviço
✓ Cálculos totais
✓ Margens individuais
✓ Margem média geral
✓ Alerta de lucro negativo (vermelho)
```

### **Produtividade:**
```
✓ Busca do catálogo (tudo preenchido)
✓ Busca do estoque (materiais rápidos)
✓ Busca de funcionários (equipe rápida)
✓ Copiar de serviços anteriores
✓ Templates do catálogo
```

---

## ✅ STATUS FINAL

**SISTEMA 100% FUNCIONAL!**

✅ Múltiplos serviços
✅ Múltiplos materiais por serviço
✅ Múltiplos funcionários por serviço
✅ Buscas inteligentes em todos
✅ Cálculos automáticos precisos
✅ Interface intuitiva
✅ Validações completas
✅ PDF profissional de tudo

**PRONTO PARA PRODUÇÃO! 🚀**

---

**Última Atualização:** 2025-10-12 23:45
**Versão:** 3.2.0
**Status:** PRODUÇÃO COMPLETA
