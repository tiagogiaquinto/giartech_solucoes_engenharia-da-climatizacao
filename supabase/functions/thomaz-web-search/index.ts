import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SearchRequest {
  query: string;
  saveToKnowledge?: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { query, saveToKnowledge = true }: SearchRequest = await req.json();

    if (!query || query.trim().length < 3) {
      return new Response(
        JSON.stringify({
          error: "Query muito curta. Use pelo menos 3 caracteres.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 1. Buscar na Wikipedia em português
    let searchResults: any[] = [];
    let mainContent = "";
    let source = "unknown";

    try {
      const wikiResponse = await fetch(
        `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=3&utf8=1`,
        { signal: AbortSignal.timeout(8000) }
      );

      if (wikiResponse.ok) {
        const wikiData = await wikiResponse.json();
        
        if (wikiData?.query?.search && wikiData.query.search.length > 0) {
          searchResults = wikiData.query.search;
          source = "wikipedia";
          
          // Buscar conteúdo do primeiro resultado
          const firstTitle = searchResults[0].title;
          const contentResponse = await fetch(
            `https://pt.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(firstTitle)}&format=json`,
            { signal: AbortSignal.timeout(8000) }
          );
          
          if (contentResponse.ok) {
            const contentData = await contentResponse.json();
            const pages = contentData?.query?.pages;
            if (pages) {
              const pageId = Object.keys(pages)[0];
              mainContent = pages[pageId]?.extract || "";
            }
          }
        }
      }
    } catch (e) {
      console.log("Wikipedia falhou:", e);
    }

    // 2. Se Wikipedia não retornou nada, buscar em APIs alternativas
    if (!mainContent) {
      try {
        // Buscar em API de notícias ou conhecimento geral
        const duckResponse = await fetch(
          `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
          { signal: AbortSignal.timeout(8000) }
        );
        
        if (duckResponse.ok) {
          const duckData = await duckResponse.json();
          mainContent = duckData?.Abstract || duckData?.AbstractText || "";
          source = "duckduckgo";
          
          if (duckData?.RelatedTopics && duckData.RelatedTopics.length > 0) {
            searchResults = duckData.RelatedTopics.slice(0, 3).map((item: any) => ({
              title: item.Text?.split(' - ')[0] || '',
              snippet: item.Text || '',
              url: item.FirstURL || ''
            }));
          }
        }
      } catch (e) {
        console.log("DuckDuckGo falhou:", e);
      }
    }

    // 3. Salvar conhecimento adquirido no banco de dados
    if (saveToKnowledge && mainContent && mainContent.length > 50) {
      try {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        await supabaseClient.from('thomaz_web_knowledge').insert({
          query: query,
          content: mainContent,
          source: source,
          results: searchResults,
          relevance_score: 0.8,
          accessed_at: new Date().toISOString()
        });

        // Também salvar na memória de longo prazo
        await supabaseClient.from('thomaz_long_term_memory').insert({
          fact: `Sobre ${query}: ${mainContent.substring(0, 500)}`,
          source: `web_search_${source}`,
          confidence: 0.85,
          category: 'knowledge',
          tags: query.toLowerCase().split(' ').filter(w => w.length > 3)
        });
      } catch (e) {
        console.log("Erro ao salvar conhecimento:", e);
      }
    }

    // 4. Gerar resumo inteligente
    const summary = mainContent 
      ? mainContent.substring(0, 800) + (mainContent.length > 800 ? '...' : '')
      : 'Não encontrei informações específicas sobre isso.';

    return new Response(
      JSON.stringify({
        success: true,
        query: query,
        source: source,
        content: mainContent,
        summary: summary,
        results: searchResults,
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
    console.error("Erro na busca web:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "Erro ao buscar informações na internet",
        details: String(error),
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
