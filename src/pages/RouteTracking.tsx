import { useState } from 'react'
import { Navigation, MapPin, TrendingUp } from 'lucide-react'
import RouteManager from '../components/RouteManager'

const RouteTracking = () => {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-600 rounded-lg">
              <Navigation className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Rastreamento e Gestão de Rotas</h1>
              <p className="text-gray-600">Planeje, acompanhe e gerencie as rotas da equipe em tempo real</p>
            </div>
          </div>
        </div>

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Rotas Hoje</p>
                <p className="text-3xl font-bold text-gray-900">0</p>
              </div>
              <MapPin className="h-12 w-12 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Em Andamento</p>
                <p className="text-3xl font-bold text-blue-600">0</p>
              </div>
              <Navigation className="h-12 w-12 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">KM Hoje</p>
                <p className="text-3xl font-bold text-green-600">0</p>
              </div>
              <TrendingUp className="h-12 w-12 text-green-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Gerenciador de Rotas */}
        <RouteManager onRouteSelect={setSelectedRouteId} />

        {/* Informações sobre Rastreamento */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            📱 Como funciona o rastreamento em tempo real?
          </h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              <strong>1. Planejamento:</strong> Crie rotas e adicione as paradas (ordens de serviço) em sequência
            </p>
            <p>
              <strong>2. Atribuição:</strong> Designe um funcionário e veículo para cada rota
            </p>
            <p>
              <strong>3. Rastreamento:</strong> Quando a rota é iniciada, o sistema registra a localização em tempo real
            </p>
            <p>
              <strong>4. Otimização:</strong> Visualize o progresso, distância percorrida e tempo estimado
            </p>
            <p>
              <strong>5. Histórico:</strong> Todo o trajeto fica registrado para análise posterior
            </p>
          </div>
        </div>

        {/* Recursos Futuros */}
        <div className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-purple-900 mb-3">
            🚀 Recursos Disponíveis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-800">
            <div>
              <p className="font-semibold mb-1">✅ Gestão de Rotas</p>
              <p className="text-purple-700">Criar, editar e gerenciar rotas diárias</p>
            </div>
            <div>
              <p className="font-semibold mb-1">✅ Paradas Sequenciais</p>
              <p className="text-purple-700">Adicionar ordens de serviço em ordem</p>
            </div>
            <div>
              <p className="font-semibold mb-1">✅ Cálculo de Distância</p>
              <p className="text-purple-700">Distância total calculada automaticamente</p>
            </div>
            <div>
              <p className="font-semibold mb-1">✅ Status em Tempo Real</p>
              <p className="text-purple-700">Acompanhe o progresso de cada rota</p>
            </div>
            <div>
              <p className="font-semibold mb-1">✅ Histórico Completo</p>
              <p className="text-purple-700">Registros de todas as movimentações</p>
            </div>
            <div>
              <p className="font-semibold mb-1">✅ Otimização de Rotas</p>
              <p className="text-purple-700">Sugestões de melhor sequência</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RouteTracking
