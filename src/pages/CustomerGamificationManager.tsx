import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/useToast';
import { Search, Users, Award, CheckCircle, XCircle, TrendingUp, Filter } from 'lucide-react';

interface Customer {
  id: string;
  nome_razao: string;
  participa_gamificacao: boolean;
  data_adesao_gamificacao: string | null;
  total_points: number;
  current_tier: string;
  os_pendentes_inclusao: number;
  valor_pendente: number;
}

interface ServiceOrder {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  participa_gamificacao: boolean;
  status: string;
  total_value: number;
  created_at: string;
  incluir_gamificacao: boolean;
  pontos_gerados: number;
  status_gamificacao: string;
  pode_incluir: boolean;
}

const TIER_NAMES: Record<string, string> = {
  bronze: 'Bronze',
  silver: 'Prata',
  gold: 'Ouro',
  diamond: 'Diamante',
  vip: 'VIP'
};

const TIER_COLORS: Record<string, string> = {
  bronze: 'bg-orange-100 text-orange-800',
  silver: 'bg-gray-100 text-gray-800',
  gold: 'bg-yellow-100 text-yellow-800',
  diamond: 'bg-blue-100 text-blue-800',
  vip: 'bg-purple-100 text-purple-800'
};

export default function CustomerGamificationManager() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'customers' | 'orders'>('customers');
  const [filterStatus, setFilterStatus] = useState<'all' | 'participants' | 'non_participants'>('all');
  const [filterOrderStatus, setFilterOrderStatus] = useState<'all' | 'available' | 'included'>('all');
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadCustomers(), loadServiceOrders()]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showToast('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    const { data, error } = await supabase
      .from('v_relatorio_gamificacao_cliente')
      .select('*')
      .order('total_points', { ascending: false });

    if (error) throw error;
    setCustomers(data || []);
  };

  const loadServiceOrders = async () => {
    const { data, error } = await supabase
      .from('v_os_disponiveis_gamificacao')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    setServiceOrders(data || []);
  };

  const handleActivateCustomer = async (customerId: string, processOldOrders: boolean) => {
    try {
      const { data, error } = await supabase.rpc('ativar_gamificacao_cliente', {
        p_customer_id: customerId,
        p_processar_os_antigas: processOldOrders
      });

      if (error) throw error;

      showToast(
        processOldOrders
          ? `Cliente ativado! ${data.os_marcadas_para_processar} OSs marcadas para processar.`
          : 'Cliente ativado na gamificação!',
        'success'
      );

      await loadData();
    } catch (error) {
      console.error('Erro ao ativar cliente:', error);
      showToast('Erro ao ativar gamificação', 'error');
    }
  };

  const handleDeactivateCustomer = async (customerId: string, removePoints: boolean) => {
    if (!confirm('Deseja realmente desativar a gamificação para este cliente?')) return;

    try {
      const { error } = await supabase.rpc('desativar_gamificacao_cliente', {
        p_customer_id: customerId,
        p_motivo: 'Desativado pelo usuário',
        p_remover_pontos: removePoints
      });

      if (error) throw error;

      showToast(
        removePoints
          ? 'Cliente desativado e pontos removidos!'
          : 'Cliente desativado. Pontos mantidos.',
        'success'
      );

      await loadData();
    } catch (error) {
      console.error('Erro ao desativar cliente:', error);
      showToast('Erro ao desativar gamificação', 'error');
    }
  };

  const handleIncludeOrder = async (orderId: string) => {
    try {
      const { data, error } = await supabase.rpc('incluir_os_na_gamificacao', {
        p_service_order_id: orderId
      });

      if (error) throw error;

      if (data.success) {
        showToast(`OS incluída! ${data.pontos_gerados} pontos gerados.`, 'success');
        await loadData();
      } else {
        showToast(data.error || 'Erro ao incluir OS', 'error');
      }
    } catch (error) {
      console.error('Erro ao incluir OS:', error);
      showToast('Erro ao incluir OS na gamificação', 'error');
    }
  };

  const handleIncludeMultipleOrders = async () => {
    if (selectedOrders.size === 0) {
      showToast('Selecione pelo menos uma OS', 'error');
      return;
    }

    if (!confirm(`Incluir ${selectedOrders.size} OSs na gamificação?`)) return;

    try {
      const { data, error } = await supabase.rpc('incluir_multiplas_os_gamificacao', {
        p_service_order_ids: Array.from(selectedOrders)
      });

      if (error) throw error;

      showToast(
        `${data.total_processadas} OSs processadas! ${data.total_pontos_gerados} pontos gerados.`,
        'success'
      );

      setSelectedOrders(new Set());
      await loadData();
    } catch (error) {
      console.error('Erro ao processar OSs:', error);
      showToast('Erro ao processar OSs em lote', 'error');
    }
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.nome_razao?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'participants' && c.participa_gamificacao) ||
      (filterStatus === 'non_participants' && !c.participa_gamificacao);
    return matchesSearch && matchesFilter;
  });

  const filteredOrders = serviceOrders.filter(o => {
    const matchesSearch =
      o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.order_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterOrderStatus === 'all' ||
      (filterOrderStatus === 'available' && o.pode_incluir) ||
      (filterOrderStatus === 'included' && o.incluir_gamificacao);
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Gerenciar Gamificação
        </h1>
        <p className="text-gray-600">
          Controle quais clientes participam e quais ordens de serviço geram pontos
        </p>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
        <div className="flex items-start">
          <Award className="w-5 h-5 text-blue-500 mr-3 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">Como Funciona</h3>
            <ul className="text-sm text-blue-800 mt-2 space-y-1">
              <li>• <strong>Ative clientes</strong> para que eles participem da gamificação</li>
              <li>• <strong>Marque OSs</strong> concluídas para gerar pontos</li>
              <li>• <strong>Novas OSs</strong> de clientes ativos geram pontos automaticamente</li>
              <li>• <strong>Clientes inativos</strong> não acumulam pontos mesmo com OSs concluídas</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('customers')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'customers'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Clientes ({customers.filter(c => c.participa_gamificacao).length} ativos)
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'orders'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Award className="w-4 h-4 inline mr-2" />
          Ordens de Serviço ({serviceOrders.filter(o => o.pode_incluir).length} disponíveis)
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {activeTab === 'customers' ? (
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg ${
                  filterStatus === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterStatus('participants')}
                className={`px-4 py-2 rounded-lg ${
                  filterStatus === 'participants'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Ativos
              </button>
              <button
                onClick={() => setFilterStatus('non_participants')}
                className={`px-4 py-2 rounded-lg ${
                  filterStatus === 'non_participants'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Inativos
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setFilterOrderStatus('all')}
                className={`px-4 py-2 rounded-lg ${
                  filterOrderStatus === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setFilterOrderStatus('available')}
                className={`px-4 py-2 rounded-lg ${
                  filterOrderStatus === 'available'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Disponíveis
              </button>
              <button
                onClick={() => setFilterOrderStatus('included')}
                className={`px-4 py-2 rounded-lg ${
                  filterOrderStatus === 'included'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Incluídas
              </button>
            </div>
          )}
        </div>

        {activeTab === 'customers' ? (
          <div className="space-y-4">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className={`border rounded-lg p-4 ${
                  customer.participa_gamificacao
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {customer.nome_razao || 'Cliente sem nome'}
                      </h3>
                      {customer.participa_gamificacao && customer.current_tier && (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${TIER_COLORS[customer.current_tier] || 'bg-gray-100 text-gray-800'}`}>
                          {TIER_NAMES[customer.current_tier] || 'Sem Tier'}
                        </span>
                      )}
                    </div>

                    {customer.participa_gamificacao ? (
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Pontos:</span>
                          <p className="font-semibold text-blue-600">{customer.total_points.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Compras:</span>
                          <p className="font-semibold">{customer.total_purchases}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Gasto Total:</span>
                          <p className="font-semibold">R$ {customer.total_spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Desde:</span>
                          <p className="font-semibold">
                            {customer.data_adesao_gamificacao
                              ? new Date(customer.data_adesao_gamificacao).toLocaleDateString('pt-BR')
                              : '-'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Cliente não participa da gamificação</p>
                    )}

                    {customer.os_pendentes_inclusao > 0 && customer.participa_gamificacao && (
                      <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded p-3">
                        <p className="text-sm text-yellow-800">
                          <strong>{customer.os_pendentes_inclusao}</strong> OSs concluídas pendentes de inclusão
                          (R$ {customer.valor_pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="ml-4 flex gap-2">
                    {customer.participa_gamificacao ? (
                      <button
                        onClick={() => handleDeactivateCustomer(customer.id, false)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Desativar
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleActivateCustomer(customer.id, false)}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Ativar
                        </button>
                        <button
                          onClick={() => handleActivateCustomer(customer.id, true)}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                        >
                          <TrendingUp className="w-4 h-4" />
                          Ativar + Processar OSs
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredCustomers.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Nenhum cliente encontrado
              </div>
            )}
          </div>
        ) : (
          <>
            {selectedOrders.size > 0 && (
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                <p className="text-blue-900">
                  <strong>{selectedOrders.size}</strong> OSs selecionadas
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedOrders(new Set())}
                    className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 border border-gray-300"
                  >
                    Limpar
                  </button>
                  <button
                    onClick={handleIncludeMultipleOrders}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Processar Selecionadas
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className={`border rounded-lg p-4 ${
                    order.incluir_gamificacao
                      ? 'border-green-200 bg-green-50'
                      : order.pode_incluir
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {order.pode_incluir && (
                        <input
                          type="checkbox"
                          checked={selectedOrders.has(order.id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedOrders);
                            if (e.target.checked) {
                              newSelected.add(order.id);
                            } else {
                              newSelected.delete(order.id);
                            }
                            setSelectedOrders(newSelected);
                          }}
                          className="w-4 h-4 text-blue-600"
                        />
                      )}

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-semibold text-gray-900">OS #{order.order_number || 'S/N'}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            order.status_gamificacao === 'Disponível' ? 'bg-blue-100 text-blue-800' :
                            order.status_gamificacao === 'Já incluída' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status_gamificacao || 'Status indefinido'}
                          </span>
                        </div>
                        <div className="flex gap-6 text-sm text-gray-600">
                          <span>{order.customer_name || 'Cliente não informado'}</span>
                          <span>R$ {(order.total_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          <span>{order.created_at ? new Date(order.created_at).toLocaleDateString('pt-BR') : 'Data não informada'}</span>
                          {order.incluir_gamificacao && (order.pontos_gerados || 0) > 0 && (
                            <span className="text-green-600 font-semibold">
                              {order.pontos_gerados || 0} pontos
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {order.pode_incluir && (
                      <button
                        onClick={() => handleIncludeOrder(order.id)}
                        className="ml-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Incluir
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {filteredOrders.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  Nenhuma ordem de serviço encontrada
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
