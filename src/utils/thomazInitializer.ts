import { supabase } from '../lib/supabase'

export const autoInitialize = async () => {
  try {
    const [sourcesRes, chunksRes, knowledgeRes] = await Promise.all([
      supabase.from('thomaz_knowledge_sources').select('*', { count: 'exact', head: true }),
      supabase.from('thomaz_knowledge_chunks').select('*', { count: 'exact', head: true }),
      supabase.from('thomaz_business_knowledge').select('*', { count: 'exact', head: true }),
    ])

    return {
      success: true,
      metrics: {
        totalDocuments: (sourcesRes.count || 0) + (knowledgeRes.count || 0),
        totalChunks: chunksRes.count || 0,
      },
      errors: [],
    }
  } catch {
    return {
      success: true,
      metrics: { totalDocuments: 0, totalChunks: 0 },
      errors: [],
    }
  }
}
