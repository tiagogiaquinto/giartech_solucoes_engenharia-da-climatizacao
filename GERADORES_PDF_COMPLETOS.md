# 📄 Geradores de PDF Completos

## ✅ Implementação Concluída

Foram criados **dois novos geradores de PDF** seguindo o modelo profissional da **Ordem de Serviço**.

---

## 📑 1. GERADOR DE ORDEM DE SERVIÇO COMPLETA

**Arquivo:** `src/utils/generateServiceOrderPDFComplete.ts`

### 📋 Estrutura do Documento

#### **Página 1: Ordem de Serviço**

1. **Cabeçalho da Empresa** (fundo cinza claro)
   - Logo circular com inicial
   - Nome da empresa (destaque)
   - Dados completos (CNPJ, endereço, contatos)
   - Data e hora de geração

2. **Título da Ordem de Serviço** (fundo azul/teal)
   - Número da OS
   - Tipo de serviço (opcional)

3. **Dados do Cliente**
   - Nome/Razão Social
   - CNPJ (se aplicável)
   - Endereço completo
   - Telefone destacado

4. **Tabela de Serviços**
   - Descrição completa
   - Unidade de medida
   - Preço unitário
   - Quantidade
   - Total por serviço

5. **Tabela de Materiais** (se houver)
   - Descrição completa
   - Unidade
   - Preço unitário
   - Quantidade
   - Total por material

6. **Resumo Financeiro**
   - Subtotal de serviços
   - Subtotal de materiais
   - Subtotal geral
   - Desconto (se aplicável)
   - **TOTAL FINAL** (destaque)

7. **Formas de Pagamento**
   - Métodos aceitos
   - PIX (CNPJ)
   - Dados bancários completos:
     - Banco
     - Agência
     - Conta
     - Tipo de conta
     - Titular (CNPJ)
   - Condições de pagamento

8. **Informações Adicionais**
   - Observações
   - Prazos
   - Condições especiais

#### **Rodapé** (todas as páginas)
   - Dados de contato da empresa
   - Redes sociais
   - Número da página

9. **Assinaturas**
   - Empresa (nome e responsável)
   - Cliente (nome e CNPJ/CPF)
   - Data e local

---

## 📄 2. GERADOR DE PROPOSTA COMERCIAL COMPLETA

**Arquivo:** `src/utils/generateProposalPDFComplete.ts`

### 📋 Estrutura do Documento

#### **Página 1: Proposta Comercial**

1. **Cabeçalho Profissional** (fundo azul)
   - Logo circular
   - Nome da empresa
   - Dados completos
   - Data de geração

2. **Título da Proposta** (destaque)
   - Número da proposta

3. **Dados do Cliente**
   - Nome/Razão Social
   - Endereço completo formatado

4. **Informações do Serviço**
   - Prazo de execução
   - Data de início (opcional)
   - Descrição geral

5. **Tabela de Serviços e Produtos**
   - **Serviços:**
     - Descrição
     - Unidade
     - Quantidade
     - Preço unitário
     - Total
   - **Materiais:**
     - Mesma estrutura
   - **Mão de obra:**
     - Valor separado (mesmo que R$ 0,00)

6. **Totais Detalhados**
   - Subtotal
   - Desconto
   - **TOTAL FINAL** (destaque visual)

7. **Formas de Pagamento Completas**
   - Todos os métodos aceitos:
     - Transferência bancária
     - Dinheiro
     - Cartão de crédito
     - Cartão de débito
     - PIX
   - Chave PIX
   - Dados bancários completos
   - Condições de pagamento
   - Informações de desconto

#### **Página 2: Garantia e Contrato**

8. **Termo de Garantia Detalhado**
   - Período de garantia
   - Condições específicas:
     - Garantia em tubulações antigas
     - Garantia de equipamentos novos (5-10 anos)
     - Garantia estendida (até 12 meses)
     - Necessidade de manutenção semestral
     - Laudo técnico obrigatório

9. **Contrato de Prestação de Serviços**
   - **CLÁUSULA 1ª:** Objeto do contrato
   - **CLÁUSULA 2ª:** Valor e forma de pagamento (por extenso)
   - **CLÁUSULA 3ª:** Prazo de execução
   - **CLÁUSULA 4ª:** Obrigações da contratada:
     - Executar com qualidade
     - Fornecer materiais
     - Manter equipe qualificada
     - Respeitar prazos
   - **CLÁUSULA 5ª:** Obrigações do contratante:
     - Efetuar pagamento
     - Fornecer informações
     - Garantir acesso
     - Comunicar problemas
   - **CLÁUSULA 6ª:** Garantia dos serviços
   - **CLÁUSULA 7ª:** Rescisão contratual
   - **CLÁUSULA 8ª:** Foro (cidade/estado)

10. **Observações Finais**
    - Mensagens personalizadas
    - Agradecimentos

---

## 🎯 Como Usar

### **Para Ordem de Serviço:**

```typescript
import { generateServiceOrderPDFComplete } from './utils/generateServiceOrderPDFComplete'

const orderData = {
  order_number: '201-2025',
  service_type: 'Retrofit',
  client: {
    name: 'Juliano, Construindo Sonhos',
    company_name: 'TERAPIAS RAZAO DE SER LTDA.',
    cnpj: '38.129.627/0001-10',
    phone: '+55 (11) 99644-7161',
    address_street: 'Avenida Sagitário',
    address_number: '717',
    address_neighborhood: 'Terreo1, Sítio Tamboré Alphaville',
    address_city: 'Barueri',
    address_state: 'SP',
    address_zipcode: '06473-073'
  },
  services: [
    {
      service_name: 'Desinstalação',
      description: 'Desinstalar, limpar a linha',
      unit: 'un.',
      unit_price: 450.00,
      quantity: 2,
      total_price: 900.00
    },
    {
      service_name: 'Acoplamento',
      description: 'Acoplar, vácuo, testes de funcionamento',
      unit: 'un.',
      unit_price: 600.00,
      quantity: 2,
      total_price: 1200.00
    }
  ],
  materials: [
    {
      material_name: 'Infraestrutura quarto',
      description: '3 metros de infraestrutura',
      unit_price: 600.00,
      quantity: 1,
      total_price: 600.00
    },
    {
      material_name: 'Infraestrutura sala',
      description: '2 metros de infraestrutura',
      unit: 'un.',
      unit_price: 300.00,
      quantity: 1,
      total_price: 300.00
    }
  ],
  subtotal_services: 2100.00,
  subtotal_materials: 900.00,
  subtotal: 3000.00,
  discount: 165.00,
  final_total: 2835.00,
  payment_method: 'PIX',
  payment_terms: 'À vista.',
  additional_info: 'Trabalhamos para que seus projetos, se tornem realidade.. Obrigado pela confiança',
  created_at: new Date().toISOString()
}

const doc = await generateServiceOrderPDFComplete(orderData)
doc.save(`OS_${orderData.order_number}.pdf`)
```

### **Para Proposta Comercial:**

```typescript
import { generateProposalPDFComplete } from './utils/generateProposalPDFComplete'

const proposalData = {
  proposal_number: '02/2025',
  client: {
    name: 'Aldo Camargo Mancini Neto',
    address_street: 'Alameda Gregorio Bogossian Sobrinho',
    address_number: '69',
    address_neighborhood: 'Casa 238 Tamboré 5',
    address_city: 'Santana de Parnaiba',
    address_state: 'SP',
    address_zipcode: '06543-385'
  },
  service_info: {
    deadline: '3 DIAS'
  },
  services: [
    {
      service_name: 'Instalação de Ar Condicionado',
      unit: 'un.',
      unit_price: 1500.00,
      quantity: 2,
      total_price: 3000.00
    }
  ],
  materials: [],
  labor_cost: 0, // Aparece mesmo se for zero
  subtotal_services: 3000.00,
  subtotal_materials: 0.00,
  subtotal: 3000.00,
  discount: 165.00,
  final_total: 2835.00,
  payment_methods: ['PIX', 'Transferência', 'Cartão'],
  payment_terms: 'PIX',
  payment_discount_info: 'Pagamento à vista com 5% de desconto',
  warranty_period: '3 meses',
  warranty_terms: 'Garantia conforme especificações técnicas...',
  additional_info: 'Trabalhamos para que seus projetos se tornem realidade.',
  created_at: new Date().toISOString()
}

const doc = await generateProposalPDFComplete(proposalData)
doc.save(`Proposta_${proposalData.proposal_number}.pdf`)
```

---

## ✨ Diferenciais dos Geradores

### ✅ **Ordem de Serviço:**
- Layout profissional baseado no modelo fornecido
- Dados bancários completos
- Seção de assinaturas
- Rodapé em todas as páginas
- Informações de contato completas

### ✅ **Proposta Comercial:**
- Contrato completo integrado
- Termo de garantia detalhado
- Cláusulas contratuais profissionais
- Valores por extenso
- Múltiplas formas de pagamento
- Informações de desconto destacadas

### ✅ **Ambos incluem:**
- ✅ Todos os serviços listados
- ✅ Todos os materiais (se houver)
- ✅ Mão de obra (mesmo que R$ 0,00)
- ✅ Subtotais separados
- ✅ Descontos destacados
- ✅ Formas de pagamento completas
- ✅ Dados bancários
- ✅ Informações adicionais
- ✅ Garantias
- ✅ Design profissional

---

## 🎨 Cores e Design

**Paleta de cores:**
- **Primária:** Teal (#17A2B8) - Azul esverdeado profissional
- **Texto:** Cinza escuro (#343A40)
- **Fundo:** Cinza claro (#F8F9FA)
- **Destaques:** Branco (#FFFFFF)

**Tipografia:**
- Fonte: Helvetica
- Títulos: Bold, tamanhos 11-18pt
- Corpo: Normal, 8-10pt
- Rodapé: 7pt

---

## 📊 Exemplo de Saída

**Ordem de Serviço:**
```
┌─────────────────────────────────────────┐
│   [G]  Giartech Soluções                │
│        Tiago Bruno Giaquinto            │
│        CNPJ: 37.509.897/0001-93        │
│        Rua Quito, 14                    │
│        São Paulo-SP • CEP 02734-010     │
│                                         │
│   [Ordem de serviço 201-2025]          │
│            retrofit                     │
│                                         │
│   Cliente: Juliano, Construindo Sonhos │
│   TERAPIAS RAZAO DE SER LTDA.          │
│   ...                                   │
│                                         │
│   Serviços                             │
│   ┌──────────────────────────────┐     │
│   │ Desinstalação   │ R$ 900,00  │     │
│   │ Acoplamento     │ R$ 1.200,00│     │
│   └──────────────────────────────┘     │
│                                         │
│   Materiais                            │
│   ┌──────────────────────────────┐     │
│   │ Infraestrutura  │ R$ 900,00  │     │
│   └──────────────────────────────┘     │
│                                         │
│   Total: R$ 2.835,00                   │
│                                         │
│   Pagamento: PIX - À vista             │
└─────────────────────────────────────────┘
```

---

## 🚀 Build

**Compilado com sucesso:** ✅
- Tempo: 13.91s
- Tamanho: 2,753.72 kB
- Sem erros TypeScript

---

## 📝 Notas Importantes

1. **Materiais opcionais:** Se não houver materiais, a seção não aparece
2. **Mão de obra:** Sempre exibida, mesmo com valor R$ 0,00
3. **Garantia personalizada:** Texto pode ser customizado
4. **Contrato:** Cláusulas padrão, ajustáveis
5. **Dados bancários:** Vêm das configurações da empresa
6. **Múltiplas páginas:** Rodapé aparece em todas

---

**Desenvolvido seguindo o modelo profissional da Giartech Soluções** ✨
