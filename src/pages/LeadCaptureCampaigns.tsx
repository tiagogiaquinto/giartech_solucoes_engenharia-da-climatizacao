import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Play, Pause, Edit, Trash2, RefreshCw, Search, Filter } from 'lucide-react';
import { useToast } from '../hooks/useToast';

interface Campaign {
  id: string;
  nome: string;
  descricao: string;
  source_type: string;
  filters: any;
  schedule: string;
  is_active: boolean;
  last_run: string;
  total_leads_captured: number;
  created_at: string;
}

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  campaign?: Campaign | null;
}

const CampaignModal: React.FC<CampaignModalProps> = ({ isOpen, onClose, onSave, campaign }) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    source_type: 'cnpj',
    filters: {},
    schedule: '',
    is_active: true,
  });

  useEffect(() => {
    if (campaign) {
      setFormData({
        nome: campaign.nome,
        descricao: campaign.descricao,
        source_type: campaign.source_type,
        filters: campaign.filters,
        schedule: campaign.schedule,
        is_active: campaign.is_active,
      });
    }
  }, [campaign]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (campaign) {
        await supabase
          .from('lead_capture_campaigns')
          .update(formData)
          .eq('id', campaign.id);
        showToast('Campanha atualizada com sucesso!', 'success');
      } else {
        await supabase
          .from('lead_capture_campaigns')
          .insert([formData]);
        showToast('Campanha criada com sucesso!', 'success');
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar campanha:', error);
      showToast('Erro ao salvar campanha', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {campaign ? 'Editar Campanha' : 'Nova Campanha'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Campanha
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Fonte
            </label>
            <select
              value={formData.source_type}
              onChange={(e) => setFormData({ ...formData, source_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="cnpj">CNPJ (API Receita Federal)</option>
              <option value="linkedin">LinkedIn</option>
              <option value="instagram">Instagram</option>
              <option value="google">Google</option>
              <option value="facebook">Facebook</option>
              <option value="manual">Manual</option>
            </select>
          </div>

          {formData.source_type === 'cnpj' && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Filtros CNPJ</h4>
              <p className="text-sm text-blue-700 mb-3">
                Configure os filtros para captação automática via CNPJ
              </p>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="CNPJs separados por vírgula"
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Agendamento (Opcional)
            </label>
            <input
              type="text"
              value={formData.schedule}
              onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
              placeholder="Ex: 0 9 * * * (todos os dias às 9h)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Formato cron: minuto hora dia mês dia-da-semana
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
              Campanha ativa
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {campaign ? 'Atualizar' : 'Criar Campanha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const LeadCaptureCampaigns: React.FC = () => {
  const { showToast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [executingCampaign, setExecutingCampaign] = useState<string | null>(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lead_capture_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error);
      showToast('Erro ao carregar campanhas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleCampaignStatus = async (campaign: Campaign) => {
    try {
      await supabase
        .from('lead_capture_campaigns')
        .update({ is_active: !campaign.is_active })
        .eq('id', campaign.id);

      showToast(
        `Campanha ${!campaign.is_active ? 'ativada' : 'pausada'} com sucesso!`,
        'success'
      );
      loadCampaigns();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      showToast('Erro ao alterar status da campanha', 'error');
    }
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta campanha?')) return;

    try {
      await supabase
        .from('lead_capture_campaigns')
        .delete()
        .eq('id', id);

      showToast('Campanha excluída com sucesso!', 'success');
      loadCampaigns();
    } catch (error) {
      console.error('Erro ao excluir campanha:', error);
      showToast('Erro ao excluir campanha', 'error');
    }
  };

  const executeCampaign = async (campaign: Campaign) => {
    if (campaign.source_type !== 'cnpj') {
      showToast('No momento, apenas campanhas CNPJ podem ser executadas manualmente', 'info');
      return;
    }

    const cnpjsInput = prompt('Digite os CNPJs separados por vírgula:');
    if (!cnpjsInput) return;

    const cnpjList = cnpjsInput.split(',').map(c => c.trim()).filter(c => c);

    if (cnpjList.length === 0) {
      showToast('Nenhum CNPJ válido fornecido', 'error');
      return;
    }

    setExecutingCampaign(campaign.id);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/captar-leads-cnpj`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            campaign_id: campaign.id,
            cnpj_list: cnpjList,
            auto_enrich: true,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        showToast(
          `${result.captured} leads capturados com sucesso! ${result.errors} erros.`,
          'success'
        );
        loadCampaigns();
      } else {
        showToast('Erro ao executar campanha', 'error');
      }
    } catch (error) {
      console.error('Erro ao executar campanha:', error);
      showToast('Erro ao executar campanha', 'error');
    } finally {
      setExecutingCampaign(null);
    }
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch =
      campaign.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.descricao?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterType === 'all' ||
      (filterType === 'active' && campaign.is_active) ||
      (filterType === 'inactive' && !campaign.is_active) ||
      campaign.source_type === filterType;

    return matchesSearch && matchesFilter;
  });

  const getSourceTypeBadge = (type: string) => {
    const badges: { [key: string]: { color: string; label: string } } = {
      cnpj: { color: 'bg-blue-100 text-blue-800', label: 'CNPJ' },
      linkedin: { color: 'bg-purple-100 text-purple-800', label: 'LinkedIn' },
      instagram: { color: 'bg-pink-100 text-pink-800', label: 'Instagram' },
      google: { color: 'bg-green-100 text-green-800', label: 'Google' },
      facebook: { color: 'bg-indigo-100 text-indigo-800', label: 'Facebook' },
      manual: { color: 'bg-gray-100 text-gray-800', label: 'Manual' },
    };

    const badge = badges[type] || badges.manual;

    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campanhas de Captação</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie suas campanhas de captação automática de leads
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedCampaign(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Nova Campanha
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar campanhas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas</option>
              <option value="active">Ativas</option>
              <option value="inactive">Inativas</option>
              <option value="cnpj">CNPJ</option>
              <option value="linkedin">LinkedIn</option>
              <option value="instagram">Instagram</option>
            </select>
          </div>

          <button
            onClick={loadCampaigns}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            title="Atualizar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lista de Campanhas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCampaigns.map((campaign) => (
          <div
            key={campaign.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex justify-between items-start mb-4">
              {getSourceTypeBadge(campaign.source_type)}
              <div className="flex gap-2">
                <button
                  onClick={() => toggleCampaignStatus(campaign)}
                  className={`p-1 rounded hover:bg-gray-100 ${
                    campaign.is_active ? 'text-green-600' : 'text-gray-400'
                  }`}
                  title={campaign.is_active ? 'Pausar' : 'Ativar'}
                >
                  {campaign.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => {
                    setSelectedCampaign(campaign);
                    setShowModal(true);
                  }}
                  className="p-1 rounded hover:bg-gray-100"
                  title="Editar"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteCampaign(campaign.id)}
                  className="p-1 rounded hover:bg-gray-100 text-red-600"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {campaign.nome}
            </h3>
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {campaign.descricao}
            </p>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Leads Capturados</span>
                <span className="font-semibold text-gray-900">
                  {campaign.total_leads_captured}
                </span>
              </div>
              {campaign.last_run && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Última Execução</span>
                  <span className="text-gray-900">
                    {new Date(campaign.last_run).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => executeCampaign(campaign)}
              disabled={executingCampaign === campaign.id}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {executingCampaign === campaign.id ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Executando...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Executar Agora
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {filteredCampaigns.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {searchTerm || filterType !== 'all'
              ? 'Nenhuma campanha encontrada com os filtros aplicados'
              : 'Nenhuma campanha criada ainda'}
          </p>
          <button
            onClick={() => {
              setSelectedCampaign(null);
              setShowModal(true);
            }}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Criar primeira campanha
          </button>
        </div>
      )}

      {/* Modal */}
      <CampaignModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={loadCampaigns}
        campaign={selectedCampaign}
      />
    </div>
  );
};

export default LeadCaptureCampaigns;
