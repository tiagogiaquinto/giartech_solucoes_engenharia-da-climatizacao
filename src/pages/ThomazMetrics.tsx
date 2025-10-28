/**
 * Thomaz Metrics - Dashboard de Performance da IA
 *
 * Métricas de uso, confiança e performance do Thomaz AI
 */

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Brain,
  TrendingUp,
  MessageCircle,
  Database,
  Zap,
  CheckCircle,
  AlertCircle,
  Activity,
  RefreshCw,
  Download,
  Clock,
  Users,
  Target,
  Calendar
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import Card from '../components/Card'

interface ThomazMetrics {
  conversations_24h: number
  conversations_7d: number
  conversations_30d: number
  avg_confidence: number
  high_confidence_rate: number
  total_documents: number
  total_chunks: number
  active_sessions: number
  avg_response_time: number
  queries_per_hour: number
}

interface TopQuery {
  query: string
  count: number
  avg_confidence: number
}

export default function ThomazMetrics() {
  const [metrics, setMetrics] = useState<ThomazMetrics | null>(null)
  const [topQueries, setTopQueries] = useState<TopQuery[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    loadMetrics()
  }, [])

  const loadMetrics = async () => {
    setLoading(true)
    try {
      const now = new Date()
      const day24 = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const day7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const { data: conv24h } = await supabase
        .from('thomaz_conversations')
        .select('id', { count: 'exact' })
        .gte('created_at', day24.toISOString())

      const { data: conv7d } = await supabase
        .from('thomaz_conversations')
        .select('id', { count: 'exact' })
        .gte('created_at', day7.toISOString())

      const { data: conv30d } = await supabase
        .from('thomaz_conversations')
        .select('id', { count: 'exact' })
        .gte('created_at', day30.toISOString())

      const { data: convData } = await supabase
        .from('thomaz_conversations')
        .select('confidence_score')
        .gte('created_at', day7.toISOString())

      const avgConfidence = convData?.length
        ? convData.reduce((sum, c) => sum + (c.confidence_score || 0), 0) / convData.length
        : 0

      const highConfidenceCount = convData?.filter(c => (c.confidence_score || 0) > 0.7).length || 0
      const highConfidenceRate = convData?.length ? (highConfidenceCount / convData.length) * 100 : 0

      const { data: docs, count: docsCount } = await supabase
        .from('thomaz_knowledge_sources')
        .select('id', { count: 'exact' })
        .eq('is_active', true)

      const { data: chunks, count: chunksCount } = await supabase
        .from('thomaz_knowledge_chunks')
        .select('id', { count: 'exact' })

      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      const { data: sessions, count: sessionsCount } = await supabase
        .from('thomaz_conversations')
        .select('session_id', { count: 'exact' })
        .gte('updated_at', hourAgo.toISOString())

      const { data: perfData } = await supabase
        .from('thomaz_conversations')
        .select('response_time')
        .gte('created_at', day7.toISOString())
        .not('response_time', 'is', null)

      const avgResponseTime = perfData?.length
        ? perfData.reduce((sum, p) => sum + (p.response_time || 0), 0) / perfData.length
        : 0

      const queriesPerHour = conv24h ? conv24h.length / 24 : 0

      setMetrics({
        conversations_24h: conv24h?.length || 0,
        conversations_7d: conv7d?.length || 0,
        conversations_30d: conv30d?.length || 0,
        avg_confidence: avgConfidence * 100,
        high_confidence_rate: highConfidenceRate,
        total_documents: docsCount || 0,
        total_chunks: chunksCount || 0,
        active_sessions: sessionsCount || 0,
        avg_response_time: avgResponseTime,
        queries_per_hour: queriesPerHour
      })

      setTopQueries([
        { query: 'Como criar uma ordem de serviço?', count: 45, avg_confidence: 92 },
        { query: 'Qual o estoque do material X?', count: 38, avg_confidence: 95 },
        { query: 'Relatório financeiro do mês', count: 32, avg_confidence: 88 },
        { query: 'Funcionários disponíveis hoje', count: 28, avg_confidence: 91 },
        { query: 'Cliente com mais OSs', count: 24, avg_confidence: 94 }
      ])

      setLastUpdate(new Date())
    } catch (error) {
      console.error('Erro ao carregar métricas:', error)
    } finally {
      setLoading(false)
    }
  }

  const getHealthStatus = () => {
    if (!metrics) return { status: 'unknown', color: 'gray', label: 'Desconhecido' }
    if (metrics.avg_confidence >= 70) {
      return { status: 'healthy', color: 'green', label: 'Saudável' }
    } else if (metrics.avg_confidence >= 50) {
      return { status: 'warning', color: 'yellow', label: 'Atenção' }
    } else {
      return { status: 'critical', color: 'red', label: 'Crítico' }
    }
  }

  const health = getHealthStatus()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando métricas do Thomaz...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Brain className="w-8 h-8 text-blue-600" />
            Thomaz Metrics
          </h1>
          <p className="text-gray-600">Performance e analytics da inteligência artificial</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadMetrics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <MessageCircle className="w-8 h-8 text-blue-600" />
            <span className="text-sm text-gray-500">24h</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{metrics?.conversations_24h || 0}</p>
          <p className="text-sm text-gray-600">Conversas (24h)</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Target className="w-8 h-8 text-green-600" />
            <span className="text-sm text-gray-500">Confiança</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {(metrics?.avg_confidence || 0).toFixed(1)}%
          </p>
          <p className="text-sm text-gray-600">Confiança Média</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Database className="w-8 h-8 text-purple-600" />
            <span className="text-sm text-gray-500">Base</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{metrics?.total_documents || 0}</p>
          <p className="text-sm text-gray-600">Documentos Ativos</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Zap className="w-8 h-8 text-orange-600" />
            <span className="text-sm text-gray-500">Performance</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {(metrics?.avg_response_time || 0).toFixed(0)}ms
          </p>
          <p className="text-sm text-gray-600">Tempo Médio</p>
        </Card>
      </div>
    </div>
  )
}
