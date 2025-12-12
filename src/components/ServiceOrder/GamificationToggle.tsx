import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/useToast';
import { Award, CheckCircle, XCircle, AlertCircle, Star } from 'lucide-react';

interface GamificationToggleProps {
  serviceOrderId: string;
  customerId: string;
  status: string;
  totalValue: number;
  orderNumber: string;
  onUpdate?: () => void;
  variant?: 'button' | 'card' | 'inline';
}

interface GamificationStatus {
  customerActive: boolean;
  customerName: string;
  osIncluded: boolean;
  pointsGenerated: number;
  canInclude: boolean;
  statusMessage: string;
}

export function GamificationToggle({
  serviceOrderId,
  customerId,
  status,
  totalValue,
  orderNumber,
  onUpdate,
  variant = 'button'
}: GamificationToggleProps) {
  const [gamificationStatus, setGamificationStatus] = useState<GamificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (serviceOrderId && customerId) {
      loadGamificationStatus();
    } else {
      setLoading(false);
    }
  }, [serviceOrderId, customerId]);

  const loadGamificationStatus = async () => {
    if (!serviceOrderId || !customerId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('nome_razao, participa_gamificacao')
        .eq('id', customerId)
        .maybeSingle();

      if (customerError) {
        console.error('Erro ao buscar cliente:', customerError);
        setLoading(false);
        return;
      }

      if (!customer) {
        setLoading(false);
        return;
      }

      const { data: serviceOrder, error: osError } = await supabase
        .from('service_orders')
        .select('incluir_gamificacao, pontos_gerados')
        .eq('id', serviceOrderId)
        .maybeSingle();

      if (osError) {
        console.error('Erro ao buscar OS:', osError);
        setLoading(false);
        return;
      }

      const canInclude =
        customer.participa_gamificacao &&
        status === 'concluida' &&
        !serviceOrder?.incluir_gamificacao;

      let statusMessage = '';
      if (!customer.participa_gamificacao) {
        statusMessage = 'Cliente não participa da gamificação';
      } else if (serviceOrder?.incluir_gamificacao) {
        statusMessage = `Incluída - ${serviceOrder.pontos_gerados || 0} pontos gerados`;
      } else if (status !== 'concluida') {
        statusMessage = 'Só pode incluir OSs concluídas';
      } else {
        statusMessage = 'Disponível para incluir';
      }

      setGamificationStatus({
        customerActive: customer.participa_gamificacao,
        customerName: customer.nome_razao,
        osIncluded: serviceOrder?.incluir_gamificacao || false,
        pointsGenerated: serviceOrder?.pontos_gerados || 0,
        canInclude,
        statusMessage
      });
    } catch (error) {
      console.error('Erro ao carregar status da gamificação:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInclude = async () => {
    if (!gamificationStatus?.canInclude) return;

    try {
      setProcessing(true);

      const { data, error } = await supabase.rpc('incluir_os_na_gamificacao', {
        p_service_order_id: serviceOrderId
      });

      if (error) throw error;

      if (data.success) {
        showToast(`OS incluída! ${data.pontos_gerados} pontos gerados para ${gamificationStatus.customerName}`, 'success');
        await loadGamificationStatus();
        onUpdate?.();
      } else {
        showToast(data.error || 'Erro ao incluir OS', 'error');
      }
    } catch (error) {
      console.error('Erro ao incluir OS na gamificação:', error);
      showToast('Erro ao processar', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleActivateCustomer = async () => {
    try {
      setProcessing(true);

      const { data, error } = await supabase.rpc('ativar_gamificacao_cliente', {
        p_customer_id: customerId,
        p_processar_os_antigas: false
      });

      if (error) throw error;

      showToast(`${gamificationStatus?.customerName} ativado na gamificação!`, 'success');
      await loadGamificationStatus();
      onUpdate?.();
    } catch (error) {
      console.error('Erro ao ativar cliente:', error);
      showToast('Erro ao ativar cliente', 'error');
    } finally {
      setProcessing(false);
    }
  };

  if (!serviceOrderId || !customerId) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400" />
        <span className="text-sm">Verificando...</span>
      </div>
    );
  }

  if (!gamificationStatus) return null;

  // Variante Card (maior, com mais detalhes)
  if (variant === 'card') {
    return (
      <div className={`rounded-lg border p-4 ${
        gamificationStatus.osIncluded
          ? 'bg-green-50 border-green-200'
          : gamificationStatus.canInclude
          ? 'bg-blue-50 border-blue-200'
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {gamificationStatus.osIncluded ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : gamificationStatus.canInclude ? (
                <Award className="w-5 h-5 text-blue-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-gray-400" />
              )}
              <h3 className="font-semibold text-gray-900">
                Sistema de Gamificação
              </h3>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${
                  gamificationStatus.osIncluded
                    ? 'text-green-600'
                    : gamificationStatus.canInclude
                    ? 'text-blue-600'
                    : 'text-gray-500'
                }`}>
                  {gamificationStatus.statusMessage}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-gray-600">Cliente:</span>
                <span className="font-medium">
                  {gamificationStatus.customerName}
                  {gamificationStatus.customerActive && (
                    <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                      Participante
                    </span>
                  )}
                  {!gamificationStatus.customerActive && (
                    <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                      Não Participa
                    </span>
                  )}
                </span>
              </div>

              {gamificationStatus.osIncluded && gamificationStatus.pointsGenerated > 0 && (
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-gray-600">Pontos Gerados:</span>
                  <span className="font-bold text-yellow-600">
                    {gamificationStatus.pointsGenerated.toLocaleString()}
                  </span>
                </div>
              )}

              {gamificationStatus.canInclude && (
                <div className="mt-3 p-3 bg-blue-100 rounded">
                  <p className="text-xs text-blue-800">
                    💡 Esta OS pode gerar aproximadamente <strong>{Math.round(totalValue)}</strong> pontos para o cliente
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="ml-4">
            {!gamificationStatus.customerActive ? (
              <button
                onClick={handleActivateCustomer}
                disabled={processing}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {processing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Award className="w-4 h-4" />
                )}
                Ativar Cliente
              </button>
            ) : gamificationStatus.canInclude ? (
              <button
                onClick={handleInclude}
                disabled={processing}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {processing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Incluir na Gamificação
              </button>
            ) : gamificationStatus.osIncluded ? (
              <div className="flex items-center gap-2 text-green-600 font-medium">
                <CheckCircle className="w-5 h-5" />
                Incluída
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  // Variante Inline (compacta, uma linha)
  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-3">
        {gamificationStatus.osIncluded ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">
              Gamificação: {gamificationStatus.pointsGenerated} pontos
            </span>
          </div>
        ) : gamificationStatus.canInclude ? (
          <button
            onClick={handleInclude}
            disabled={processing}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm"
          >
            {processing ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
            ) : (
              <Award className="w-4 h-4" />
            )}
            Incluir na Gamificação
          </button>
        ) : !gamificationStatus.customerActive ? (
          <button
            onClick={handleActivateCustomer}
            disabled={processing}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 text-sm"
          >
            {processing ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            Cliente não participa
          </button>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4" />
            {gamificationStatus.statusMessage}
          </div>
        )}
      </div>
    );
  }

  // Variante Button (padrão - botão compacto)
  return (
    <div className="flex items-center gap-2">
      {gamificationStatus.osIncluded ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <div className="text-sm">
            <span className="text-green-700 font-medium">Incluída na Gamificação</span>
            <p className="text-green-600 text-xs">{gamificationStatus.pointsGenerated} pontos gerados</p>
          </div>
        </div>
      ) : gamificationStatus.canInclude ? (
        <button
          onClick={handleInclude}
          disabled={processing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          ) : (
            <Award className="w-5 h-5" />
          )}
          <div className="text-left">
            <div className="font-medium">Incluir na Gamificação</div>
            <div className="text-xs opacity-90">~{Math.round(totalValue)} pontos</div>
          </div>
        </button>
      ) : !gamificationStatus.customerActive ? (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
            <AlertCircle className="w-4 h-4" />
            Cliente não participa
          </div>
          <button
            onClick={handleActivateCustomer}
            disabled={processing}
            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm"
          >
            {processing ? 'Ativando...' : 'Ativar Cliente'}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
          <AlertCircle className="w-4 h-4" />
          {gamificationStatus.statusMessage}
        </div>
      )}
    </div>
  );
}
