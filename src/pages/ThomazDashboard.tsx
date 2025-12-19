import { useState, useEffect } from 'react'
import Card from '../components/Card'
import { Brain, TrendingUp, AlertTriangle, Lightbulb, Target, Activity } from 'lucide-react'
import ThomazSuperAdvancedService from '../services/thomazSuperAdvancedService'

export default function ThomazDashboard() {
  const [businessHealth, setBusinessHealth] = useState<any>(null)
  const [insights, setInsights] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState<any>(null)
  const [analyzing, setAnalyzing] = useState(false)

  const thomaz = new ThomazSuperAdvancedService()

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const health = await thomaz.analyzeBusinessHealth()
      setBusinessHealth(health)

      const proactiveInsights = await thomaz.generateProactiveInsights({})
      setInsights(proactiveInsights)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    }
    setLoading(false)
  }

  const handleAsk = async () => {
    if (!query.trim()) return

    setAnalyzing(true)
    try {
      const result = await thomaz.sendMessage(query)
      setResponse(result)
    } catch (error) {
      console.error('Error asking Thomaz:', error)
    }
    setAnalyzing(false)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500'
      case 'warning': return 'bg-yellow-500'
      case 'info': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600'
    if (score >= 70) return 'text-blue-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Brain className="w-16 h-16 text-blue-500 animate-pulse mx-auto mb-4" />
          <p className="text-lg text-gray-600">Thomaz Ultra está analisando seu negócio...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Brain className="w-8 h-8 text-blue-600" />
            Thomaz Ultra Intelligence
          </h1>
          <p className="text-gray-600 mt-2">
            Sistema avançado de análise e inteligência artificial empresarial
          </p>
        </div>
        <button
          onClick={loadDashboard}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Atualizar Análise
        </button>
      </div>

      {businessHealth && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Saúde do Negócio</h2>
              <Activity className="w-6 h-6 text-blue-600" />
            </div>

            <div className="text-center py-6">
              <div className={`text-6xl font-bold ${getScoreColor(businessHealth.overallScore)} mb-2`}>
                {businessHealth.overallScore}
              </div>
              <div className="text-2xl font-semibold text-gray-700 mb-4">
                {businessHealth.scoreLabel}
              </div>
              <div className="text-sm text-gray-500">
                Score Geral de Saúde (0-100)
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Financeiro</div>
                <div className={`text-2xl font-bold ${getScoreColor(businessHealth.details.financial.score)}`}>
                  {businessHealth.details.financial.score}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Margem: {businessHealth.details.financial.margem}%
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Operacional</div>
                <div className={`text-2xl font-bold ${getScoreColor(businessHealth.details.operational.score)}`}>
                  {businessHealth.details.operational.score}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Taxa: {businessHealth.details.operational.taxaConclusao}%
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Clientes</div>
                <div className={`text-2xl font-bold ${getScoreColor(businessHealth.details.customer.score)}`}>
                  {businessHealth.details.customer.score}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Champions: {businessHealth.details.customer.champions}
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Estoque</div>
                <div className={`text-2xl font-bold ${getScoreColor(businessHealth.details.inventory.score)}`}>
                  {businessHealth.details.inventory.score}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Saúde: {businessHealth.details.inventory.healthPercentage}%
                </div>
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            {businessHealth.criticalIssues?.length > 0 && (
              <Card className="bg-red-50 border-red-200">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h3 className="font-semibold text-red-900">Problemas Críticos</h3>
                </div>
                <ul className="space-y-2">
                  {businessHealth.criticalIssues.map((issue: string, idx: number) => (
                    <li key={idx} className="text-sm text-red-800 flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {businessHealth.opportunities?.length > 0 && (
              <Card className="bg-green-50 border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">Oportunidades</h3>
                </div>
                <ul className="space-y-2">
                  {businessHealth.opportunities.map((opp: string, idx: number) => (
                    <li key={idx} className="text-sm text-green-800 flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span>{opp}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        </div>
      )}

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Perguntar ao Thomaz Ultra</h2>
        </div>

        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
            placeholder="Ex: Como está minha situação financeira?"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={analyzing}
          />
          <button
            onClick={handleAsk}
            disabled={analyzing || !query.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {analyzing ? 'Analisando...' : 'Perguntar'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => setQuery('Como está minha situação financeira?')}
            className="text-left px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Como está minha situação financeira?
          </button>
          <button
            onClick={() => setQuery('Quais OS estão atrasadas?')}
            className="text-left px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Quais OS estão atrasadas?
          </button>
          <button
            onClick={() => setQuery('Quantos clientes estão em risco?')}
            className="text-left px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Quantos clientes estão em risco?
          </button>
          <button
            onClick={() => setQuery('Quais itens precisam de reposição?')}
            className="text-left px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Quais itens precisam de reposição?
          </button>
        </div>

        {response && (
          <div className="mt-6 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <Brain className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-gray-800">{response.response}</div>
                  </div>
                </div>
              </div>

              {response.reasoning && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="text-sm font-semibold text-blue-900 mb-2">
                    Raciocínio ({response.reasoning.steps.length} etapas):
                  </div>
                  <div className="space-y-2">
                    {response.reasoning.steps.map((step: any, idx: number) => (
                      <div key={idx} className="text-sm text-gray-700 flex gap-2">
                        <span className="font-semibold text-blue-600">{step.step}.</span>
                        <span>
                          {step.thought}
                          <span className="text-gray-500 ml-2">
                            ({(step.confidence * 100).toFixed(0)}% confiança)
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {response.suggestedActions && response.suggestedActions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Ações Sugeridas:
                  </div>
                  <div className="space-y-2">
                    {response.suggestedActions.map((action: any, idx: number) => (
                      <div
                        key={idx}
                        className={`text-sm p-2 rounded ${
                          action.priority === 'high'
                            ? 'bg-red-100 text-red-800'
                            : action.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        <div className="font-semibold">{action.title}</div>
                        <div className="text-xs mt-1">{action.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {insights.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">Insights Proativos</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {insight.type === 'alert' && <AlertTriangle className="w-5 h-5 text-red-500" />}
                    {insight.type === 'opportunity' && <Lightbulb className="w-5 h-5 text-yellow-500" />}
                    {insight.type === 'trend' && <TrendingUp className="w-5 h-5 text-blue-500" />}
                    {insight.type === 'recommendation' && <Target className="w-5 h-5 text-green-500" />}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full text-white ${getSeverityColor(insight.severity)}`}>
                    {insight.severity}
                  </span>
                </div>

                <h3 className="font-semibold text-gray-900 mb-1">{insight.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{insight.description}</p>

                {insight.suggestedAction && (
                  <div className="bg-gray-50 rounded px-3 py-2 text-xs text-gray-700">
                    <span className="font-semibold">Ação:</span> {insight.suggestedAction}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
