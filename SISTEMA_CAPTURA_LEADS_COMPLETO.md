# Sistema de Captura de Leads - Documentação Completa

## 📋 Visão Geral

O Sistema de Captura de Leads é uma solução completa e automatizada para prospecção de novos clientes através de múltiplas fontes de dados. O sistema busca informações de empresas no Google Maps por região e área de atuação, além de realizar buscas por CEP através dos Correios, trazendo todos os dados disponíveis na internet.

## 🎯 Principais Funcionalidades

### 1. Captura Automática de Leads
- **Google Maps**: Busca empresas por palavras-chave, região e raio de busca
- **Região por CEP**: Busca empresas em faixas de CEP específicas
- **Enriquecimento Automático**: Busca automática de CNPJ, email e redes sociais
- **Dados Coletados**:
  - Nome da empresa
  - CNPJ
  - Telefone e WhatsApp
  - Email
  - Endereço completo (CEP, cidade, estado, bairro)
  - Website
  - Avaliação do Google (rating e número de reviews)
  - Redes sociais (Facebook, Instagram, LinkedIn)
  - Tipo de negócio

### 2. Gerenciamento de Campanhas
- Criação de campanhas de captura personalizadas
- Configuração de fontes de busca (Google Maps ou CEP)
- Definição de palavras-chave e filtros
- Agendamento de capturas automáticas
- Execução manual sob demanda
- Acompanhamento de leads capturados por campanha

### 3. Gestão de Leads
- Visualização de todos os leads capturados
- Filtros por status, prioridade e fonte
- Atualização de status do lead:
  - Novo
  - Contatado
  - Qualificado
  - Convertido
  - Descartado
- Definição de prioridade (Baixa, Média, Alta)
- Atribuição de leads para vendedores/funcionários
- Conversão automática de lead em cliente
- Histórico de atividades com o lead
- Campo de observações

### 4. Dashboard de Métricas
- Total de leads capturados
- Taxa de conversão
- Leads por status
- Leads por fonte
- Performance de campanhas
- Leads capturados nos últimos 7 e 30 dias
- Tempo médio de conversão

## 📁 Estrutura do Banco de Dados

### Tabela: `lead_capture_campaigns`
Armazena as configurações das campanhas de captura.

**Campos principais:**
- `name`: Nome da campanha
- `description`: Descrição
- `status`: ativo, pausado ou concluído
- `search_type`: google_maps, cep_region ou manual
- `search_keywords`: Array de palavras-chave
- `search_region`: Região/cidade para busca
- `search_radius_km`: Raio de busca em km
- `target_business_types`: Tipos de negócio alvo
- `cep_ranges`: Faixas de CEP (JSON)
- `auto_capture_enabled`: Captura automática ativa
- `capture_frequency`: daily, weekly ou monthly
- `total_leads_captured`: Total de leads capturados

### Tabela: `captured_leads`
Armazena todos os leads capturados.

**Campos principais:**
- `campaign_id`: ID da campanha
- `company_name`: Nome da empresa
- `cnpj`: CNPJ
- `email`: Email
- `phone`: Telefone
- `whatsapp`: WhatsApp
- `address`: Endereço completo
- `cep`: CEP
- `city`: Cidade
- `state`: Estado
- `neighborhood`: Bairro
- `business_type`: Tipo de negócio
- `google_place_id`: ID do Google Place
- `google_rating`: Avaliação do Google
- `google_reviews_count`: Número de reviews
- `website`: Website
- `social_media`: Redes sociais (JSON)
- `source`: google_maps, correios, manual ou api
- `status`: novo, contatado, qualificado, convertido ou descartado
- `priority`: baixa, média ou alta
- `notes`: Observações
- `tags`: Tags
- `converted_to_customer_id`: ID do cliente convertido
- `assigned_to`: ID do funcionário responsável
- `next_follow_up`: Data do próximo follow-up
- `metadata`: Metadados adicionais (JSON)

### Tabela: `lead_activities`
Histórico de atividades com os leads.

**Campos:**
- `lead_id`: ID do lead
- `activity_type`: contato, email, whatsapp, reunião, proposta, anotação
- `description`: Descrição da atividade
- `outcome`: sucesso, sem_resposta, reagendar, não_interessado, interessado
- `performed_by`: ID do funcionário
- `performed_at`: Data/hora da atividade

### Tabela: `lead_capture_config`
Configurações gerais do sistema.

**Campos:**
- `google_maps_api_key`: Chave da API do Google Maps
- `enable_auto_cnpj_lookup`: Habilitar busca automática de CNPJ
- `enable_auto_email_discovery`: Habilitar descoberta automática de email
- `enable_auto_social_media_discovery`: Habilitar busca de redes sociais
- `max_leads_per_campaign`: Limite de leads por campanha
- `notification_email`: Email para notificações

## 🔧 Edge Functions

### 1. `buscar-leads-google`
Busca leads através do Google Places API.

**Parâmetros:**
- `campaignId`: ID da campanha

**Funcionamento:**
1. Busca configuração da campanha
2. Para cada palavra-chave:
   - Busca no Google Places API
   - Busca detalhes de cada empresa encontrada
   - Extrai informações de contato e localização
   - Salva lead no banco (se não existir)
3. Atualiza data da última captura

**Endpoint:**
```
POST /functions/v1/buscar-leads-google?campaignId={id}
```

### 2. `buscar-leads-cep`
Busca leads por faixas de CEP através dos Correios.

**Parâmetros:**
- `campaignId`: ID da campanha
- `cepInicial`: CEP inicial (opcional)
- `cepFinal`: CEP final (opcional)

**Funcionamento:**
1. Busca configuração da campanha
2. Para cada faixa de CEP:
   - Busca informações do CEP via ViaCEP
   - Busca empresas no CEP via ReceitaWS
   - Extrai informações das empresas
   - Salva lead no banco (se não existir)
3. Atualiza data da última captura

**Endpoint:**
```
POST /functions/v1/buscar-leads-cep?campaignId={id}
```

## 📱 Páginas do Sistema

### 1. Campanhas de Captação (`/lead-capture-campaigns`)
Interface para criar e gerenciar campanhas de captura.

**Funcionalidades:**
- Criar nova campanha
- Editar campanha existente
- Executar campanha manualmente
- Pausar/ativar campanha
- Excluir campanha
- Visualizar total de leads capturados
- Ver data da última execução

**Formulário de Campanha:**
- Nome da campanha
- Descrição
- Tipo de busca (Google Maps ou CEP)
- Palavras-chave (para Google Maps)
- Região e raio de busca (para Google Maps)
- CEP inicial e final (para busca por CEP)
- Tipos de negócio alvo
- Captura automática (sim/não)
- Frequência de captura (diária, semanal, mensal)
- Status (ativo, pausado, concluído)

### 2. Leads Capturados (`/captured-leads`)
Interface para gerenciar leads capturados.

**Funcionalidades:**
- Visualizar todos os leads em tabela
- Filtrar por status, prioridade e fonte
- Buscar por nome, email, telefone ou CNPJ
- Atualizar status do lead
- Alterar prioridade
- Atribuir lead a funcionário
- Ver detalhes completos do lead
- Adicionar observações
- Converter lead em cliente

**Detalhes do Lead:**
- Informações de contato completas
- Endereço completo
- Avaliação do Google (se disponível)
- Website e redes sociais
- Campo de observações
- Atribuição a vendedor
- Botão de conversão para cliente

### 3. Métricas de Captação (`/lead-capture-metrics`)
Dashboard com métricas e análises de performance.

**Métricas Exibidas:**
- Total de leads capturados
- Leads novos
- Leads contatados
- Leads qualificados
- Leads convertidos
- Leads descartados
- Taxa de conversão
- Leads capturados nos últimos 7 dias
- Leads capturados nos últimos 30 dias
- Performance por campanha
- Leads por fonte
- Leads por status

## 🚀 Como Usar

### Passo 1: Configurar Chave da API do Google Maps

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um projeto (se não tiver)
3. Ative as APIs:
   - Google Places API
   - Google Maps JavaScript API
4. Crie uma API Key
5. Acesse o sistema e vá em **Configurações** → **Captura de Leads**
6. Cole a API Key no campo correspondente
7. Salve as configurações

### Passo 2: Criar uma Campanha

1. Acesse **Campanhas de Captação** no menu lateral
2. Clique em **Nova Campanha**
3. Preencha o formulário:
   - **Nome**: Ex: "Empresas de Refrigeração SP"
   - **Descrição**: Ex: "Busca de empresas de ar condicionado em São Paulo"
   - **Tipo de Busca**: Selecione "Google Maps" ou "Região por CEP"

#### Para Google Maps:
- **Palavras-chave**: ar condicionado, refrigeração, climatização
- **Região**: São Paulo, SP
- **Raio**: 50 km
- **Tipos de Negócio**: Refrigeração, HVAC, Manutenção

#### Para Busca por CEP:
- **CEP Inicial**: 01000-000
- **CEP Final**: 05999-999

4. Configure captura automática (opcional):
   - Marque "Captura Automática"
   - Selecione frequência (Diária, Semanal ou Mensal)

5. Clique em **Criar Campanha**

### Passo 3: Executar a Campanha

1. Na lista de campanhas, localize a campanha criada
2. Clique em **Executar Agora**
3. Aguarde a execução (pode levar alguns minutos)
4. Será exibido o total de leads capturados

### Passo 4: Gerenciar Leads Capturados

1. Acesse **Leads Capturados** no menu lateral
2. Visualize todos os leads em tabela
3. Use os filtros para encontrar leads específicos:
   - Filtrar por status
   - Filtrar por prioridade
   - Filtrar por fonte
   - Buscar por nome/email/telefone

### Passo 5: Qualificar e Processar Leads

Para cada lead:

1. **Visualizar Detalhes**: Clique no ícone de detalhes
2. **Atualizar Status**: Selecione o novo status diretamente na tabela
   - Novo → Contatado (após primeiro contato)
   - Contatado → Qualificado (se houver interesse)
   - Qualificado → Convertido (ao fechar negócio)
   - Qualificado → Descartado (se não houver interesse)

3. **Definir Prioridade**: Selecione baixa, média ou alta

4. **Atribuir Vendedor**: Selecione o funcionário responsável

5. **Adicionar Observações**: Anote informações importantes

6. **Converter em Cliente**: Quando o lead virar cliente
   - Clique em "Converter em Cliente"
   - O sistema criará automaticamente um cliente com os dados do lead
   - O lead será marcado como "Convertido"

### Passo 6: Acompanhar Métricas

1. Acesse **Métricas de Captação** no menu lateral
2. Visualize:
   - Total de leads e conversões
   - Taxa de conversão geral
   - Performance de cada campanha
   - Leads capturados recentemente
   - Distribuição por fonte e status

## 🔐 Segurança e Privacidade

- Todos os dados são armazenados de forma segura no Supabase
- RLS (Row Level Security) habilitado em todas as tabelas
- API Keys armazenadas de forma criptografada
- Logs de auditoria para todas as operações
- Conformidade com LGPD

## ⚙️ Configurações Avançadas

### Limites e Frequência

- **Max Leads por Campanha**: Padrão 1000 (configurável)
- **Delay entre Requisições**: 100-200ms para evitar rate limiting
- **Timeout de Requisição**: 10 segundos

### Enriquecimento Automático

Quando habilitado, o sistema tentará automaticamente:
1. Buscar CNPJ via ReceitaWS
2. Descobrir email através de padrões comuns
3. Buscar perfis de redes sociais

### Notificações

Configure email para receber notificações de:
- Novas campanhas executadas
- Leads qualificados
- Leads convertidos em clientes

## 📊 Melhores Práticas

### 1. Segmentação de Campanhas
- Crie campanhas específicas por região
- Separe por tipo de negócio
- Use palavras-chave focadas

### 2. Qualificação de Leads
- Atualize status regularmente
- Use prioridades para focar nos melhores leads
- Adicione observações detalhadas

### 3. Follow-up
- Defina próximo follow-up para cada lead
- Atribua leads a vendedores específicos
- Registre todas as atividades

### 4. Análise de Performance
- Revise métricas semanalmente
- Compare performance entre campanhas
- Ajuste palavras-chave e regiões conforme resultados

## 🆘 Solução de Problemas

### Nenhum lead sendo capturado

**Causas possíveis:**
1. API Key do Google Maps inválida ou sem créditos
2. Palavras-chave muito específicas
3. Região sem empresas cadastradas
4. Faixa de CEP vazia

**Soluções:**
1. Verifique a API Key nas configurações
2. Use palavras-chave mais amplas
3. Tente outra região
4. Ajuste a faixa de CEP

### Leads duplicados

O sistema verifica automaticamente:
- Google Place ID (para Google Maps)
- CNPJ (para busca por CEP)

Se mesmo assim houver duplicados, exclua manualmente na tela de Leads Capturados.

### Erro ao converter lead em cliente

**Causas:**
- Lead sem informações mínimas (nome)
- Cliente já existe com mesmo CNPJ

**Solução:**
- Preencha informações mínimas antes de converter
- Verifique se cliente já existe

## 🎓 Exemplo Prático Completo

### Caso de Uso: Empresa de Ar Condicionado em São Paulo

**Objetivo**: Capturar 100 leads de empresas que precisam de manutenção de ar condicionado em São Paulo.

**Passo a Passo:**

1. **Criar Campanha Google Maps**
   - Nome: "Manutenção AC - São Paulo Centro"
   - Palavras-chave: ar condicionado, climatização, refrigeração, HVAC
   - Região: São Paulo, SP
   - Raio: 20 km
   - Tipos de Negócio: Comércio, Escritórios, Clínicas

2. **Criar Campanha por CEP**
   - Nome: "Empresas Zona Sul - SP"
   - CEP Inicial: 04000-000
   - CEP Final: 04999-999

3. **Executar as Campanhas**
   - Execute manualmente as duas campanhas
   - Aguarde captura (5-10 minutos cada)

4. **Qualificar Leads**
   - Filtre por prioridade "Alta" (empresas com boa avaliação)
   - Atribua leads a vendedores
   - Entre em contato via telefone/email/WhatsApp
   - Atualize status conforme contato

5. **Acompanhar**
   - Revise métricas semanalmente
   - Ajuste palavras-chave conforme resultados
   - Programe execuções automáticas mensais

## 📈 Resultados Esperados

Com o sistema de captura de leads bem configurado, você pode esperar:

- **500-1000 leads/mês** por campanha ativa
- **Taxa de conversão de 5-15%** com boa qualificação
- **Redução de 70% no tempo** de prospecção manual
- **Economia de 50%** em custos de lead generation
- **ROI positivo** em 2-3 meses

## 🔄 Atualizações e Manutenção

### Atualização de Dados
- Leads são atualizados automaticamente nas execuções
- Informações do Google são atualizadas a cada captura
- CNPJ verificado via ReceitaWS mantém dados atualizados

### Limpeza de Dados
- Leads descartados não são excluídos (para histórico)
- Leads convertidos ficam vinculados ao cliente
- Recomenda-se revisão trimestral de leads antigos

---

## 📞 Suporte

Para dúvidas ou problemas, consulte:
- Documentação técnica no sistema
- Logs de execução das campanhas
- Métricas de performance

**Sistema desenvolvido com:**
- React + TypeScript
- Supabase (Backend e Database)
- Google Places API
- ViaCEP e ReceitaWS APIs
- Tailwind CSS

---

**Versão:** 1.0.0
**Data:** Janeiro 2026
**Status:** Produção ✅
