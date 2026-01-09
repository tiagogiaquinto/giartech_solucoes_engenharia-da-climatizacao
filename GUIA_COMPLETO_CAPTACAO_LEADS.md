# 📊 Guia Completo - Sistema de Captação de Leads

## ✅ O Que Foi Implementado

### 1. **Página de Gerenciamento de Leads Capturados**
- Localização: Menu > Marketing > Leads Capturados
- Funcionalidades:
  - ✅ Botão "Novo Lead" para cadastro manual
  - ✅ Formulário completo com todos os campos
  - ✅ Busca por CNPJ com preenchimento automático
  - ✅ Edição de leads existentes
  - ✅ Filtros por status, prioridade e fonte
  - ✅ Conversão de lead em cliente
  - ✅ Atribuição de leads para vendedores
  - ✅ Campos completos igual cadastro de clientes

### 2. **Campanhas de Captação com KPIs**
- Localização: Menu > Marketing > Campanhas de Captação
- KPIs implementados:
  - Total de Campanhas
  - Campanhas Ativas
  - Total de Leads
  - Leads Esta Semana
  - Leads Este Mês
  - Média por Campanha

### 3. **Formulário de Lead Completo**
Campos disponíveis:
- Nome da Empresa *
- CNPJ (com busca automática)
- Tipo de Negócio
- Email
- Telefone
- WhatsApp
- Website
- CEP
- Endereço
- Bairro
- Cidade
- Estado
- Status (Novo, Contatado, Qualificado, Convertido, Descartado)
- Prioridade (Baixa, Média, Alta)
- Fonte (Manual, Google Maps, Correios, API)
- Observações

## 📝 Como Usar

### Cadastrar Lead Manualmente

1. Acesse: **Marketing > Leads Capturados**
2. Clique no botão **"Novo Lead"**
3. Preencha os dados:
   - **Opção 1**: Digite o CNPJ e clique em buscar (preenche automaticamente)
   - **Opção 2**: Preencha manualmente todos os campos
4. Clique em **"Salvar Lead"**

### Editar Lead

1. Na lista de leads, clique no ícone de **Editar** (lápis)
2. Modifique os campos desejados
3. Clique em **"Atualizar"**

### Gerenciar Status e Prioridade

- **Status**: Selecione diretamente na tabela
  - Novo → Lead recém capturado
  - Contatado → Já houve primeiro contato
  - Qualificado → Lead validado e interessado
  - Convertido → Virou cliente
  - Descartado → Não qualificado

- **Prioridade**: Selecione diretamente na tabela
  - Alta → Atender urgentemente
  - Média → Atender em breve
  - Baixa → Pode aguardar

### Converter Lead em Cliente

1. Clique no ícone verde **"Converter em Cliente"**
2. Confirme a conversão
3. O lead será automaticamente criado como cliente
4. Status muda para "Convertido"

### Atribuir Lead para Vendedor

1. Clique em **"Ver Detalhes"** no lead
2. No modal, selecione o vendedor no campo **"Atribuir a:"**
3. Lead fica disponível para o vendedor

## 🎯 Sistema de Campanhas

### Criar Campanha

1. Acesse: **Marketing > Campanhas de Captação**
2. Clique em **"Nova Campanha"**
3. Configure:
   - Nome da campanha
   - Descrição
   - Tipo de busca (Google Maps ou Região CEP)
   - Palavras-chave (separadas por vírgula)
   - Região de busca
   - Raio em km
   - Tipos de negócio alvo
   - Ativar captura automática (opcional)
   - Frequência (Diária, Semanal, Mensal)

### Executar Campanha

1. Na lista de campanhas, clique em **"Executar Agora"**
2. Sistema irá buscar leads automaticamente
3. Leads capturados aparecem em "Leads Capturados"
4. Contador de leads é atualizado automaticamente

### Visualizar KPIs

Os KPIs são atualizados automaticamente e mostram:
- Performance geral das campanhas
- Leads capturados no período
- Taxa de sucesso
- Campanhas mais efetivas

## 📊 Dados de Teste Criados

Foram criados 3 leads de exemplo:

1. **Empresa Exemplo 1 Ltda**
   - CNPJ: 12.345.678/0001-90
   - Cidade: São Paulo, SP
   - Status: Novo
   - Prioridade: Alta

2. **Restaurante Sabor do Brasil**
   - CNPJ: 23.456.789/0001-01
   - Cidade: São Paulo, SP
   - Status: Novo
   - Prioridade: Média
   - Fonte: Google Maps

3. **Tech Solutions Informática**
   - CNPJ: 34.567.890/0001-12
   - Cidade: Rio de Janeiro, RJ
   - Status: Contatado
   - Prioridade: Alta

## 🔧 Troubleshooting

### Campanhas não capturam leads automaticamente

**Causas possíveis:**
1. API do Google Maps não configurada
2. Palavras-chave muito genéricas
3. Região de busca muito ampla

**Solução:**
- Configure a API do Google Maps nas configurações
- Use palavras-chave mais específicas
- Reduza o raio de busca
- OU cadastre leads manualmente usando o formulário

### Leads duplicados

O sistema verifica automaticamente por:
- CNPJ duplicado
- Google Place ID duplicado

Leads duplicados não são inseridos novamente.

### Erro ao converter lead em cliente

Verifique se:
- Todos os campos obrigatórios estão preenchidos
- CNPJ está no formato correto
- Email é válido

## 📱 Recursos Disponíveis

### Filtros Avançados
- Status
- Prioridade
- Fonte
- Busca por nome, email, telefone ou CNPJ

### Exportação
- Dados podem ser exportados via relatórios
- Integração com CRM

### Automação
- Captura automática programada
- Notificações de novos leads
- Follow-up automático

## 🎓 Melhores Práticas

1. **Cadastro Manual**
   - Use quando receber leads de eventos, indicações
   - Sempre use busca por CNPJ para dados corretos

2. **Campanhas**
   - Teste primeiro com raio pequeno (5-10km)
   - Use palavras-chave específicas do seu negócio
   - Ative captura automática após ajustes

3. **Qualificação**
   - Atualize status conforme contato
   - Use prioridade para organizar fila
   - Adicione observações importantes

4. **Conversão**
   - Só converta leads realmente qualificados
   - Verifique dados antes de converter
   - Cliente criado herda todos os dados do lead

## 📞 Próximos Passos

Para melhorar ainda mais:
1. Configure API do Google Maps para captação automática
2. Treine equipe para usar filtros e prioridades
3. Estabeleça processo de qualificação
4. Monitore KPIs semanalmente
5. Ajuste campanhas baseado nos resultados
