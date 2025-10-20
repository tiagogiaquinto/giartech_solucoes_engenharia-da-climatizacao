import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const cnpj = url.searchParams.get("cnpj");

    if (!cnpj) {
      return new Response(
        JSON.stringify({ error: "CNPJ não fornecido" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const cleanCnpj = cnpj.replace(/\D/g, "");

    if (cleanCnpj.length !== 14) {
      return new Response(
        JSON.stringify({ error: "CNPJ deve conter 14 dígitos" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const response = await fetch(
      `https://publica.cnpj.ws/cnpj/${cleanCnpj}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Limite de consultas atingido. Tente novamente em alguns segundos.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 404) {
        return new Response(
          JSON.stringify({ error: "CNPJ não encontrado na base de dados." }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      return new Response(
        JSON.stringify({ error: "Erro ao buscar CNPJ" }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();

    if (data.status === "ERROR") {
      return new Response(
        JSON.stringify({ error: data.message || "CNPJ não encontrado" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const formattedData = {
      cnpj: data.estabelecimento?.cnpj || cleanCnpj,
      razao_social: data.razao_social || "",
      nome_fantasia: data.estabelecimento?.nome_fantasia || "",
      natureza_juridica: data.natureza_juridica?.descricao || "",
      capital_social: data.capital_social || 0,
      porte: data.porte?.descricao || "",
      abertura: data.estabelecimento?.data_inicio_atividade || "",
      situacao: data.estabelecimento?.situacao_cadastral || "",
      tipo: data.estabelecimento?.tipo || "",
      email: data.estabelecimento?.email || "",
      telefone:
        data.estabelecimento?.ddd1 && data.estabelecimento?.telefone1
          ? `(${data.estabelecimento.ddd1}) ${data.estabelecimento.telefone1}`
          : "",
      logradouro: data.estabelecimento?.logradouro || "",
      numero: data.estabelecimento?.numero || "",
      complemento: data.estabelecimento?.complemento || "",
      bairro: data.estabelecimento?.bairro || "",
      municipio: data.estabelecimento?.cidade?.nome || "",
      uf: data.estabelecimento?.estado?.sigla || "",
      cep: data.estabelecimento?.cep || "",
      status: "OK",
    };

    return new Response(JSON.stringify(formattedData), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro ao buscar CNPJ:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno ao buscar CNPJ" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});