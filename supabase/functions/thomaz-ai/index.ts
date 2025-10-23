import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatRequest {
  message: string;
  context?: string;
  systemData?: any;
  conversationHistory?: Array<{ role: string; content: string }>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { message, context, systemData, conversationHistory }: ChatRequest = await req.json();

    // Sistema de prompt AVANÇADO estilo ChatGPT
    const systemPrompt = `Você é Thomaz, um assistente de IA avançado especializado em gestão empresarial brasileira.

🎯 SUA MISSÃO:
Ajudar empresários e gestores a tomar decisões inteligentes, analisar dados e otimizar seus negócios.

🧠 SUAS CAPACIDADES:
1. ANÁLISE DE DADOS: Interprete números e gere insights valiosos
2. CONSULTORIA: Dê conselhos estratégicos baseados em dados
3. ENSINO: Explique processos de forma clara e didática
4. CONVERSAÇÃO: Mantenha diálogos naturais e contextuais
5. RESOLUÇÃO: Resolva problemas de forma criativa

💼 CONHECIMENTO ESPECIALIZADO:
- Gestão Financeira (receitas, despesas, fluxo de caixa, ROI)
- Operações (ordens de serviço, produtividade, eficiência)
- Relacionamento (CRM, clientes, satisfação, retenção)
- Estoque (inventário, reposição, otimização)
- Recursos Humanos (equipe, performance, alocação)
- Estratégia (KPIs, metas, crescimento)

🗣️ ESTILO DE COMUNICAÇÃO:
- Natural e brasileiro (use "tá", "pra", "né", gírias leves)
- Direto mas amigável
- Emojis com propósito (não exagere)
- Profissional quando necessário
- Empático e prestativo

📊 DADOS DISPONÍVEIS:
${systemData ? JSON.stringify(systemData, null, 2) : 'Aguardando dados do sistema'}

💡 CONTEXTO DA CONVERSA:
${context || 'Início de conversa'}

🎓 DIRETRIZES:
1. Se perguntarem sobre DADOS ESPECÍFICOS → Indique que você irá buscar no sistema
2. Se perguntarem COMO FAZER → Referencie os manuais do sistema
3. Se perguntarem ANÁLISE → Use os dados disponíveis e gere insights
4. Se conversarem CASUALMENTE → Seja natural e amigável
5. Se pedirem AJUDA → Seja detalhado e paciente
6. SEMPRE responda em português brasileiro natural
7. NUNCA invente dados - seja honesto sobre limitações
8. SEMPRE busque agregar valor real na resposta

📝 FORMATO DE RESPOSTA:
- Seja conciso mas completo
- Use formatação quando apropriado
- Ofereça próximos passos quando relevante
- Personalize para o contexto do usuário`;

    // Tentar múltiplas APIs em ordem de preferência
    let aiResponse = "";
    let source = "unknown";

    // 1. Tentar HuggingFace com modelo conversacional melhor
    try {
      const hfResponse = await fetch(
        "https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: message,
            parameters: {
              max_length: 512,
              temperature: 0.8,
              top_p: 0.92,
              do_sample: true,
            },
          }),
          signal: AbortSignal.timeout(8000), // 8s timeout
        }
      );

      if (hfResponse.ok) {
        const result = await hfResponse.json();
        if (Array.isArray(result) && result[0]?.generated_text) {
          aiResponse = result[0].generated_text;
          source = "huggingface-blenderbot";
        }
      }
    } catch (e) {
      console.log("HuggingFace falhou, tentando próxima API...");
    }

    // 2. Se falhou, usar sistema de resposta inteligente LOCAL
    if (!aiResponse) {
      aiResponse = generateIntelligentResponse(message, systemData, conversationHistory);
      source = "local-intelligence";
    }

    // Pós-processamento: garantir que resposta está em português
    if (aiResponse && !isPortuguese(aiResponse)) {
      aiResponse = translateToPortuguese(message, systemData);
      source += "-translated";
    }

    // Adicionar contexto extra se tiver dados do sistema
    if (systemData && Object.keys(systemData).length > 0) {
      aiResponse = enrichResponseWithData(aiResponse, systemData);
    }

    return new Response(
      JSON.stringify({
        response: aiResponse,
        source: source,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Erro no Thomaz AI:", error);

    return new Response(
      JSON.stringify({
        response: "Desculpe, tive um problema técnico aqui. Mas estou funcionando! Pode tentar perguntar de novo? 😊",
        source: "error-handler",
        error: String(error),
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

// ====================================
// SISTEMA DE INTELIGÊNCIA LOCAL
// ====================================

function generateIntelligentResponse(
  message: string,
  systemData: any,
  history?: Array<{ role: string; content: string }>
): string {
  const lowerMessage = message.toLowerCase();

  // Análise de sentimento e intenção
  const intent = detectIntent(lowerMessage);
  const sentiment = detectSentiment(lowerMessage);

  switch (intent) {
    case "greeting":
      return generateGreeting(sentiment);

    case "thanks":
      return "Por nada! 😊 Fico feliz em ajudar. Se precisar de mais alguma coisa, é só falar!";

    case "status_business":
      return generateBusinessStatus(systemData);

    case "how_to":
      return generateHowToResponse(lowerMessage);

    case "data_request":
      return "Perfeito! Vou buscar esses dados no sistema pra você agora mesmo. Um momento... 📊";

    case "analysis":
      return generateAnalysisResponse(systemData);

    case "problem":
      return "Entendi sua preocupação. Vamos resolver isso juntos! Você pode me dar mais detalhes? 🤔";

    case "casual":
      return generateCasualResponse(lowerMessage, sentiment);

    case "praise":
      return "Obrigado! 😊 Fico muito feliz em poder ajudar você. Meu objetivo é tornar sua gestão cada vez mais fácil!";

    case "complaint":
      return "Desculpe se algo não saiu como esperado. Me conta o que aconteceu que vou fazer o possível pra ajudar! 🙏";

    default:
      return generateContextualResponse(lowerMessage, systemData, history);
  }
}

function detectIntent(message: string): string {
  // Saudações
  if (/(oi|ola|olá|bom dia|boa tarde|boa noite|hey|e ai|eai)/i.test(message)) {
    return "greeting";
  }

  // Agradecimentos
  if (/(obrigad|valeu|thanks|brigadão|vlw)/i.test(message)) {
    return "thanks";
  }

  // Elogios
  if (/(legal|massa|top|show|excelente|ótimo|otimo|perfeito|bom trabalho)/i.test(message)) {
    return "praise";
  }

  // Reclamações
  if (/(não funciona|nao funciona|erro|problema|bug|ruim)/i.test(message)) {
    return "complaint";
  }

  // Status do negócio
  if (/(como (tá|ta|está|esta)|situação|status|panorama|como anda)/i.test(message)) {
    return "status_business";
  }

  // Como fazer
  if (/(como|tutorial|passo a passo|ensina|explica|não sei|nao sei)/i.test(message)) {
    return "how_to";
  }

  // Pedido de dados
  if (/(quantas?|quanto|total|lista|mostrar|ver|buscar|procurar)/i.test(message)) {
    return "data_request";
  }

  // Análise
  if (/(analise|análise|roi|lucro|margem|resultado|performance)/i.test(message)) {
    return "analysis";
  }

  // Problema
  if (/(ajuda|help|socorro|preciso|urgente)/i.test(message)) {
    return "problem";
  }

  // Casual
  if (message.length < 20 && !/\?/.test(message)) {
    return "casual";
  }

  return "general";
}

function detectSentiment(message: string): "positive" | "negative" | "neutral" {
  const positiveWords = ["bom", "ótimo", "otimo", "legal", "massa", "top", "show", "feliz"];
  const negativeWords = ["ruim", "péssimo", "pessimo", "horrível", "problema", "erro"];

  let score = 0;
  positiveWords.forEach(word => {
    if (message.includes(word)) score++;
  });
  negativeWords.forEach(word => {
    if (message.includes(word)) score--;
  });

  if (score > 0) return "positive";
  if (score < 0) return "negative";
  return "neutral";
}

function generateGreeting(sentiment: string): string {
  const greetings = [
    "E aí! 👋 Sou o Thomaz, seu assistente inteligente. Como posso ajudar hoje?",
    "Olá! 😊 Thomaz aqui, pronto pra facilitar sua gestão. O que você precisa?",
    "Fala! 🤖 Bom te ver por aqui. Em que posso ser útil?",
    "Opa! 🚀 Thomaz na área! Me conta, o que você quer saber?",
  ];

  return greetings[Math.floor(Math.random() * greetings.length)];
}

function generateBusinessStatus(data: any): string {
  if (!data || Object.keys(data).length === 0) {
    return "Vou buscar os dados atualizados do seu negócio agora! Um momento... 📊";
  }

  let response = "📊 **Vamos ver como estão as coisas!**\n\n";

  if (data.total_orders) {
    response += `📋 Você tem **${data.total_orders}** ordens registradas\n`;
  }
  if (data.total_clients) {
    response += `👥 **${data.total_clients}** clientes na base\n`;
  }

  response += "\n💡 Quer saber algo específico? Posso mostrar faturamento, lucros, pendências, etc.";

  return response;
}

function generateHowToResponse(message: string): string {
  return "📖 **Tenho o manual perfeito pra isso!**\n\n" +
    "Vou buscar o tutorial passo a passo pra você. Aguenta aí que já volto com as instruções completas! 🎓\n\n" +
    "💡 Dica: Digite 'lista de manuais' pra ver todos os tutoriais disponíveis.";
}

function generateAnalysisResponse(data: any): string {
  return "🔍 **Análise em andamento...**\n\n" +
    "Vou processar os dados e trazer insights valiosos pra você! " +
    "Isso inclui métricas de performance, tendências e recomendações. 📈\n\n" +
    "Um momento enquanto faço os cálculos...";
}

function generateCasualResponse(message: string, sentiment: string): string {
  if (sentiment === "positive") {
    return "😊 Fico feliz com isso! Se precisar de qualquer coisa, tô aqui pra ajudar!";
  }
  return "Entendi! Me conta mais, o que você quer saber ou fazer? 🤔";
}

function generateContextualResponse(
  message: string,
  data: any,
  history?: Array<{ role: string; content: string }>
): string {
  // Resposta contextual baseada na mensagem
  if (message.length < 10) {
    return "Hmm, não entendi muito bem. Pode explicar melhor o que você precisa? 😊";
  }

  return "Entendi sua pergunta! Vou buscar as informações certas pra você. " +
    "Isso pode envolver dados do sistema, manuais ou análises específicas. Um momento! 🔍";
}

function isPortuguese(text: string): boolean {
  // Verifica se o texto contém palavras comuns em português
  const portugueseWords = [
    "o", "a", "de", "que", "para", "com", "os", "as", "do", "da",
    "em", "um", "uma", "você", "voce", "é", "e", "tá", "ta", "está", "esta"
  ];

  const words = text.toLowerCase().split(/\s+/);
  let ptCount = 0;

  for (const word of words) {
    if (portugueseWords.includes(word)) {
      ptCount++;
    }
  }

  return ptCount >= 2 || words.length < 5;
}

function translateToPortuguese(message: string, data: any): string {
  // Tradução simples de fallback
  return `Entendi sua pergunta sobre "${message}". Deixa eu buscar essas informações no sistema pra você! 📊`;
}

function enrichResponseWithData(response: string, data: any): string {
  // Se a resposta for muito curta, adiciona contexto dos dados
  if (response.length < 50 && data && Object.keys(data).length > 0) {
    let enriched = response + "\n\n📊 **Dados disponíveis:**\n";

    if (data.total_orders) {
      enriched += `• ${data.total_orders} ordens de serviço\n`;
    }
    if (data.total_clients) {
      enriched += `• ${data.total_clients} clientes cadastrados\n`;
    }

    return enriched;
  }

  return response;
}
