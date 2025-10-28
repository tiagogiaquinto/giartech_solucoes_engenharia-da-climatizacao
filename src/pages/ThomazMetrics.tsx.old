/**
 * Página de Métricas do ThomazAI
 *
 * Dashboard de performance, saúde e uso do assistente
 */

import React, { useState, useEffect } from 'react'
import {
  Brain,
  Activity,
  TrendingUp,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Database,
  RefreshCw,
  BarChart3
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import Card from '../components/Card'
import { thomazInit } from '../utils/thomazInitializer'

interface HealthMetric {
  metric: string
  value: number
  status: string
  details: string
}

interface UsageStats {
  totalConversations: number
  conversations24h: number
  conversations7d: number
  avgConfidence: number
  highConfidenceRate: number
  totalDocuments: number
  totalChunks: number
}

export default function ThomazMetrics() {
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([])
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [reindexing, setReindexing] = useState(false)

  useEffect(() => {
    loadMetrics()
  }, [])

  const loadMetrics = async () => {
    setLoading(true)
    try {
      // Health Check
      const health = await thomazInit.healthCheck()
      if (health) {
        setHealthMetrics(health)
      }

      // Usage Stats
      const stats = await fetchUsageStats()
      setUsageStats(stats)

    } catch (error) {
      console.error('Erro ao carregar métricas:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsageStats = async (): Promise<UsageStats> => {
    // Total de conversas
    const { data: allConvs } = await supabase
      .from('thomaz_conversations')
      .select('id, confidence', { count: 'exact' })

    // Conversas 24h
    const { data: convs24h } = await supabase
      .from('thomaz_conversations')
      .select('id')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    // Conversas 7d
    const { data: convs7d } = await supabase
      .from('thomaz_conversations')
      .select('id, confidence')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    // Confidence scores
    const avgConfidence = convs7d && convs7d.length > 0
      ? convs7d.reduce((sum, c) => sum + (c.confidence || 0), 0) / convs7d.length
      : 0

    const highConfidence = convs7d && convs7d.length > 0
      ? convs7d.filter(c => c.confidence > 0.85).length
      : 0

    const highConfidenceRate = convs7d && convs7d.length > 0
      ? (highConfidence / convs7d.length) * 100
      : 0

    // Documentos
    const { data: docs } = await supabase
      .from('thomaz_knowledge_sources')
      .select('id', { count: 'exact' })
      .eq('is_active', true)

    // Chunks
    const { data: chunks } = await supabase
      .from('thomaz_document_chunks')
      .select('id', { count: 'exact' })

    return {
      totalConversations: allConvs?.length || 0,
      conversations24h: convs24h?.length || 0,
      conversations7d: convs7d?.length || 0,
      avgConfidence: avgConfidence * 100,
      highConfidenceRate,
      totalDocuments: docs?.length || 0,
      totalChunks: chunks?.length || 0
    }
  }

  const handleReindex = async () => {
    if (!confirm('Reindexar toda a base de conhecimento? Isso pode levar alguns minutos.')) {
      return
    }

    setReindexing(true)
    try {
      await thomazInit.forceReindex()
      alert('Reindexação concluída com sucesso!')
      await loadMetrics()
    } catch (error) {
      alert('Erro na reindexação: ' + error)
    } finally {
      setReindexing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Brain className="w-8 h-8 text-blue-600" />
            ThomazAI - Métricas
          </h1>
          <p className="text-gray-600 mt-1">
            Dashboard de performance e saúde do assistente inteligente
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={loadMetrics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>

          <button
            onClick={handleReindex}
            disabled={reindexing}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50"
          >
            <Database className="w-4 h-4" />
            {reindexing ? 'Reindexando...' : 'Reindexar'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Conversas (24h)</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {usageStats?.conversations24h || 0}
              </p>
            </div>
            <MessageSquare className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Confiança Alta</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {usageStats?.highConfidenceRate.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Meta: &gt; 70%
              </p>
            </div>
            <CheckCircle className={`w-12 h-12 opacity-20 ${
              (usageStats?.highConfidenceRate || 0) >= 70 ? 'text-green-500' : 'text-yellow-500'
            }`} />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Documentos</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {usageStats?.totalDocuments || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {usageStats?.totalChunks || 0} chunks
              </p>
            </div>
            <Database className="w-12 h-12 text-purple-500 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Confiança Média</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {usageStats?.avgConfidence.toFixed(1)}%
              </p>
            </div>
            <Activity className="w-12 h-12 text-indigo-500 opacity-20" />
          </div>
        </Card>
      </div>

      {/* Health Check */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-6 h-6 text-green-600" />
          Health Check
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {healthMetrics.map((metric, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {metric.details}
                </p>
                <p className="text-2xl font-bold text-gray-700 mt-1">
                  {metric.value}
                </p>
              </div>
              {metric.status === 'healthy' ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : metric.status === 'warning' ? (
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              ) : (
                <AlertCircle className="w-8 h-8 text-gray-400" />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Usage Trends */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          Tendências de Uso
        </h2>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Conversas (7 dias)
              </span>
              <span className="text-sm font-bold text-gray-900">
                {usageStats?.conversations7d || 0}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${Math.min((usageStats?.conversations7d || 0) / 100 * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Taxa de Alta Confiança
              </span>
              <span className="text-sm font-bold text-gray-900">
                {usageStats?.highConfidenceRate.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  (usageStats?.highConfidenceRate || 0) >= 70 ? 'bg-green-600' : 'bg-yellow-600'
                }`}
                style={{ width: `${usageStats?.highConfidenceRate || 0}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Base de Conhecimento
              </span>
              <span className="text-sm font-bold text-gray-900">
                {((usageStats?.totalChunks || 0) / ((usageStats?.totalDocuments || 1) * 20) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{ width: `${Math.min(((usageStats?.totalChunks || 0) / ((usageStats?.totalDocuments || 1) * 20) * 100), 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {usageStats?.totalChunks} chunks de {usageStats?.totalDocuments} documentos
            </p>
          </div>
        </div>
      </Card>

      {/* Info */}
      <Card className="p-6 bg-blue-50 border border-blue-200">
        <div className="flex gap-3">
          <BarChart3 className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-blue-900">Sobre as Métricas</h3>
            <p className="text-sm text-blue-800 mt-2">
              As métricas são atualizadas em tempo real e refletem a performance do sistema ThomazAI.
              Uma taxa de alta confiança acima de 70% indica que o assistente está fornecendo respostas
              precisas e bem fundamentadas na base de conhecimento.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
