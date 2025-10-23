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
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { message, context, systemData }: ChatRequest = await req.json();

    const systemPrompt = `Você é o Thomaz, um assistente inteligente brasileiro de um sistema de gestão empresarial.

PERSONALIDADE:
- Fale de forma natural e amigável
- Use linguagem brasileira (pode usar "tá", "pra", gírias)
- Seja direto e objetivo
- Use emojis de forma moderada
- Seja prestativo e educado

CONHECIMENTO:
Você tem acesso a dados sobre:
- Ordens de Serviço (OS)
- Clientes
- Estoque e Materiais
- Financeiro (receitas, despesas, lucros)
- Agenda e Eventos
- Funcionários e Equipe
- Fornecedores
- Equipamentos
- Manuais do sistema

REGRAS:
1. Se a pergunta é sobre dados do sistema, SEMPRE indique que você vai buscar os dados reais
2. Responda em português brasileiro
3. Seja conversacional mas profissional
4. Se não souber algo específico, seja honesto e sugira alternativas
5. Para perguntas sobre "como fazer", mencione que você tem manuais disponíveis

CONTEXTO ATUAL:
${context || 'Nenhum contexto adicional'}

${systemData ? `DADOS DO SISTEMA:
${JSON.stringify(systemData, null, 2)}` : ''}

Responda a mensagem do usuário de forma natural e útil.`;

    const response = await fetch(
      "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: `${systemPrompt}\n\nUsuário: ${message}\nThomazAI:`,
          parameters: {
            max_length: 200,
            temperature: 0.7,
            top_p: 0.9,
            do_sample: true,
          },
        }),
      }
    );

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          response: generateFallbackResponse(message),
          source: "fallback",
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const result = await response.json();
    let aiResponse = "";

    if (Array.isArray(result) && result[0]?.generated_text) {
      aiResponse = result[0].generated_text
        .split("ThomazAI:")[1]
        ?.trim() || result[0].generated_text;
    } else {
      aiResponse = generateFallbackResponse(message);
    }

    return new Response(
      JSON.stringify({
        response: aiResponse,
        source: "huggingface",
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
        response: "Desculpe, tive um problema ao processar sua mensagem. Mas estou aqui pra ajudar! Pode tentar perguntar de novo? 😊",
        source: "error",
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

function generateFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("oi") ||
    lowerMessage.includes("olá") ||
    lowerMessage.includes("ola") ||
    lowerMessage.includes("bom dia") ||
    lowerMessage.includes("boa tarde") ||
    lowerMessage.includes("boa noite")
  ) {
    const greetings = [
      "E aí! 👋 Sou o Thomaz, como posso ajudar?",
      "Olá! 😊 Thomaz aqui, pronto pra te ajudar!",
      "Fala! 🤖 O que você precisa saber?",
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  if (
    lowerMessage.includes("obrigad") ||
    lowerMessage.includes("valeu") ||
    lowerMessage.includes("thanks")
  ) {
    return "Por nada! 😊 Tô aqui pra isso. Precisa de mais alguma coisa?";
  }

  if (
    lowerMessage.includes("como tá") ||
    lowerMessage.includes("como está") ||
    lowerMessage.includes("como anda")
  ) {
    return "Vou buscar os dados atualizados do seu negócio pra você! Um momento... 📊";
  }

  if (lowerMessage.includes("como") && lowerMessage.includes("?")) {
    return "Boa pergunta! Tenho manuais completos sobre isso. Vou buscar as informações pra você! 📖";
  }

  if (lowerMessage.includes("ajuda") || lowerMessage.includes("help")) {
    return "Claro! Posso te ajudar com dados do sistema, manuais de uso, análises financeiras e muito mais. O que você quer saber? 🚀";
  }

  return "Entendi! Deixa eu processar isso e buscar as informações certas pra você... 🤔";
}