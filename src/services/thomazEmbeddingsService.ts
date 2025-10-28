/**
 * Thomaz Embeddings Service
 *
 * Gerencia geração de embeddings e indexação de documentos
 * Suporta múltiplos providers (OpenAI, HuggingFace, local)
 */

import { supabase } from '../lib/supabase'

export interface EmbeddingProvider {
  name: string
  dimension: number
  generateEmbedding: (text: string) => Promise<number[]>
}

export interface ChunkingConfig {
  chunkSize: number
  chunkOverlap: number
  separators: string[]
}

export class ThomazEmbeddingsService {
  private provider: EmbeddingProvider
  private chunkingConfig: ChunkingConfig

  constructor() {
    // Configuração padrão de chunking
    this.chunkingConfig = {
      chunkSize: 500, // ~500 palavras por chunk
      chunkOverlap: 50, // 50 palavras de overlap
      separators: ['\n\n', '\n', '. ', '! ', '? ']
    }

    // Por enquanto, usa provider mock (TODO: integrar OpenAI/HuggingFace)
    this.provider = this.createMockProvider()
  }

  /**
   * Indexar documento completo
   */
  async indexDocument(sourceId: string): Promise<void> {
    try {
      // 1. Buscar documento
      const { data: source, error: sourceError } = await supabase
        .from('thomaz_knowledge_sources')
        .select('*')
        .eq('id', sourceId)
        .single()

      if (sourceError) throw sourceError

      // 2. Dividir em chunks
      const chunks = this.chunkText(source.content)

      // 3. Gerar embeddings para cada chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        const embedding = await this.provider.generateEmbedding(chunk)

        // 4. Salvar chunk com embedding
        await supabase.from('thomaz_document_chunks').insert({
          source_id: sourceId,
          chunk_index: i,
          chunk_text: chunk,
          chunk_size: chunk.length,
          embedding: embedding,
          metadata: {
            source_title: source.title,
            source_type: source.source_type,
            category: source.category
          }
        })
      }

      console.log(`✅ Indexed ${chunks.length} chunks for document: ${source.title}`)
    } catch (error) {
      console.error('Index Document Error:', error)
      throw error
    }
  }

  /**
   * Indexar todos documentos sem embeddings
   */
  async indexAllDocuments(): Promise<void> {
    try {
      // Buscar documentos ativos
      const { data: sources, error } = await supabase
        .from('thomaz_knowledge_sources')
        .select('id, title')
        .eq('is_active', true)

      if (error) throw error

      console.log(`📚 Indexando ${sources?.length || 0} documentos...`)

      for (const source of sources || []) {
        // Verificar se já tem chunks
        const { data: existingChunks } = await supabase
          .from('thomaz_document_chunks')
          .select('id')
          .eq('source_id', source.id)
          .limit(1)

        if (!existingChunks || existingChunks.length === 0) {
          console.log(`📄 Indexando: ${source.title}`)
          await this.indexDocument(source.id)
        } else {
          console.log(`⏭️  Pulando: ${source.title} (já indexado)`)
        }
      }

      console.log('✅ Indexação completa!')
    } catch (error) {
      console.error('Index All Documents Error:', error)
      throw error
    }
  }

  /**
   * Dividir texto em chunks com overlap
   */
  private chunkText(text: string): string[] {
    const chunks: string[] = []
    const words = text.split(/\s+/)
    const { chunkSize, chunkOverlap } = this.chunkingConfig

    let i = 0
    while (i < words.length) {
      const chunk = words.slice(i, i + chunkSize).join(' ')
      chunks.push(chunk)
      i += chunkSize - chunkOverlap
    }

    return chunks
  }

  /**
   * Buscar chunks similares usando embeddings
   */
  async searchSimilar(
    query: string,
    options: {
      threshold?: number
      limit?: number
      sourceType?: string
      sensitivity?: string
    } = {}
  ): Promise<any[]> {
    try {
      const {
        threshold = 0.7,
        limit = 5,
        sourceType,
        sensitivity = 'public'
      } = options

      // Gerar embedding da query
      const queryEmbedding = await this.provider.generateEmbedding(query)

      // Buscar usando função do Supabase
      const { data, error } = await supabase.rpc('thomaz_search_similar_chunks', {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: limit,
        filter_source_type: sourceType,
        filter_sensitivity: sensitivity
      })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Search Similar Error:', error)
      return []
    }
  }

  /**
   * Provider mock para desenvolvimento
   * TODO: Substituir por OpenAI ou HuggingFace
   */
  private createMockProvider(): EmbeddingProvider {
    return {
      name: 'mock',
      dimension: 1536,
      generateEmbedding: async (text: string): Promise<number[]> => {
        // Gerar embedding simples baseado em hash do texto
        const embedding = new Array(1536).fill(0)
        const hash = this.simpleHash(text)

        for (let i = 0; i < 1536; i++) {
          embedding[i] = Math.sin(hash * (i + 1)) * 0.5 + 0.5
        }

        return embedding
      }
    }
  }

  /**
   * Hash simples para mock
   */
  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return Math.abs(hash) / 2147483647
  }

  /**
   * Configurar provider OpenAI (quando disponível)
   */
  async configureOpenAIProvider(apiKey: string): Promise<void> {
    // TODO: Implementar quando houver API key
    console.log('OpenAI provider configuration pending')
  }

  /**
   * Atualizar embeddings de um documento
   */
  async reindexDocument(sourceId: string): Promise<void> {
    // Deletar chunks antigos
    await supabase
      .from('thomaz_document_chunks')
      .delete()
      .eq('source_id', sourceId)

    // Reindexar
    await this.indexDocument(sourceId)
  }
}
