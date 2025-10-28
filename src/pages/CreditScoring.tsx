import { useState, useEffect } from 'react';
import { Shield, TrendingUp, AlertTriangle, CheckCircle, RefreshCw, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';

interface CustomerCredit {
  customer_id: string;
  customer_name: string;
  customer_type: string;
  credit_score: number;
  risk_category: string;
  suggested_credit_limit: number;
  total_purchases: number;
  payment_history_score: number;
  last_updated: string;
}

export default function CreditScoring() {
  const [customers, setCustomers] = useState<CustomerCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    loadCreditScores();
  }, []);

  const loadCreditScores = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('v_customer_credit_scoring')
        .select('*')
        .order('credit_score', { ascending: false });

      if (error) throw error;

      setCustomers(data || []);
    } catch (error) {
      console.error('Erro ao carregar credit scoring:', error);
    } finally {
      setLoading(false);
    }
  };

  const recalculateAllScores = async () => {
    try {
      setLoading(true);

      const { error } = await supabase.rpc('recalculate_all_credit_scores');

      if (error) throw error;

      await loadCreditScores();

      alert('Scores recalculados com sucesso!');
    } catch (error) {
      console.error('Erro ao recalcular scores:', error);
      alert('Erro ao recalcular scores. Tente novamente.');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getRiskColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Excelente': 'bg-green-100 text-green-800 border-green-300',
      'Bom': 'bg-blue-100 text-blue-800 border-blue-300',
      'Médio': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Alto Risco': 'bg-orange-100 text-orange-800 border-orange-300',
      'Bloqueado': 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getRiskIcon = (category: string) => {
    if (category === 'Excelente' || category === 'Bom') {
      return <CheckCircle className="h-5 w-5" />;
    } else if (category === 'Bloqueado' || category === 'Alto Risco') {
      return <AlertTriangle className="h-5 w-5" />;
    }
    return <Shield className="h-5 w-5" />;
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || customer.risk_category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: customers.length,
    excelente: customers.filter(c => c.risk_category === 'Excelente').length,
    bom: customers.filter(c => c.risk_category === 'Bom').length,
    medio: customers.filter(c => c.risk_category === 'Médio').length,
    alto: customers.filter(c => c.risk_category === 'Alto Risco').length,
    bloqueado: customers.filter(c => c.risk_category === 'Bloqueado').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Credit Scoring</h1>
            <p className="text-gray-600">Análise de risco e crédito de clientes</p>
          </div>
          <button
            onClick={recalculateAllScores}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg"
          >
            <RefreshCw className="h-5 w-5" />
            Recalcular Todos
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-md"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Total</span>
              <Shield className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 shadow-md text-white cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setFilterCategory(filterCategory === 'Excelente' ? 'all' : 'Excelente')}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium opacity-90">Excelente</span>
              <CheckCircle className="h-5 w-5" />
            </div>
            <p className="text-3xl font-bold">{stats.excelente}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-6 shadow-md text-white cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setFilterCategory(filterCategory === 'Bom' ? 'all' : 'Bom')}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium opacity-90">Bom</span>
              <TrendingUp className="h-5 w-5" />
            </div>
            <p className="text-3xl font-bold">{stats.bom}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-6 shadow-md text-white cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setFilterCategory(filterCategory === 'Médio' ? 'all' : 'Médio')}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium opacity-90">Médio</span>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <p className="text-3xl font-bold">{stats.medio}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-red-500 to-pink-600 rounded-xl p-6 shadow-md text-white cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setFilterCategory(filterCategory === 'Alto Risco' || filterCategory === 'Bloqueado' ? 'all' : 'Alto Risco')}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium opacity-90">Risco Alto</span>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <p className="text-3xl font-bold">{stats.alto + stats.bloqueado}</p>
          </motion.div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Cliente</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Tipo</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-700">Score</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-700">Categoria</th>
                  <th className="text-right py-4 px-4 font-semibold text-gray-700">Limite Sugerido</th>
                  <th className="text-right py-4 px-4 font-semibold text-gray-700">Total Compras</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.customer_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-900">{customer.customer_name}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-600">{customer.customer_type}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-2xl font-bold text-gray-900">{customer.credit_score}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold border ${getRiskColor(customer.risk_category)}`}>
                        {getRiskIcon(customer.risk_category)}
                        {customer.risk_category}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-semibold text-gray-900">
                      {formatCurrency(customer.suggested_credit_limit)}
                    </td>
                    <td className="py-4 px-4 text-right text-gray-600">
                      {formatCurrency(customer.total_purchases)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredCustomers.length === 0 && (
              <div className="text-center py-12">
                <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum cliente encontrado</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
