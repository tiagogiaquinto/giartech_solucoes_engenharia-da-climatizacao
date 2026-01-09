import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Play, Pause, Edit, Trash2, RefreshCw, Search, Filter } from 'lucide-react';
import { useToast } from '../hooks/useToast';

interface Campaign {
  id: string;
  nome?: string;
  descricao?: string;
  source_type?: string;
  filters?: any;
  schedule?: string;
  is_active?: boolean;
  last_run?: string;
  name?: string;
  description?: string;
  status?: 'ativo' | 'pausado' | 'concluído';
  search_type?: 'google_maps' | 'cep_region' | 'manual';
  search_keywords?: string[];
  search_region?: string;
  search_radius_km?: number;
  target_business_types?: string[];
  cep_ranges?: Array<{ start: string; end: string }>;
  auto_capture_enabled?: boolean;
  capture_frequency?: 'daily' | 'weekly' | 'monthly';
  last_capture_at?: string;
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
    name: '',
    description: '',
    search_type: 'google_maps' as 'google_maps' | 'cep_region' | 'manual',
    search_keywords: '',
    search_region: '',
    search_radius_km: 10,
    target_business_types: '',
    cep_start: '',
    cep_end: '',
    status: 'ativo' as 'ativo' | 'pausado' | 'concluído',
    auto_capture_enabled: false,
    capture_frequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
  });

  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.nome || campaign.name || '',
        description: campaign.descricao || campaign.description || '',
        search_type: campaign.search_type || 'google_maps',
        search_keywords: campaign.search_keywords?.join(', ') || '',
        search_region: campaign.search_region || '',
        search_radius_km: campaign.search_radius_km || 10,
        target_business_types: campaign.target_business_types?.join(', ') || '',
        cep_start: campaign.cep_ranges?.[0]?.start || '',
        cep_end: campaign.cep_ranges?.[0]?.end || '',
        status: campaign.status || 'ativo',
        auto_capture_enabled: campaign.auto_capture_enabled || false,
        capture_frequency: campaign.capture_frequency || 'weekly',
      });
    }
  }, [campaign]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const keywords = formData.search_keywords.split(',').map(k => k.trim()).filter(Boolean);
      const businessTypes = formData.target_business_types.split(',').map(t => t.trim()).filter(Boolean);

      const cepRanges = formData.cep_start && formData.cep_end
        ? [{ start: formData.cep_start, end: formData.cep_end }]
        : [];

      const campaignData = {
        name: formData.name,
        description: formData.description,
        status: formData.status,
        search_type: formData.search_type,
        search_keywords: keywords,
        search_region: formData.search_region,
        search_radius_km: formData.search_radius_km,
        target_business_types: businessTypes,
        cep_ranges: cepRanges,
        auto_capture_enabled: formData.auto_capture_enabled,
        capture_frequency: formData.capture_frequency,
      };

      if (campaign) {
        const { error } = await supabase
          .from('lead_capture_campaigns')
          .update(campaignData)
          .eq('id', campaign.id);

        if (error) throw error;
        showToast('Campanha atualizada com sucesso!', 'success');
      } else {
        const { error } = await supabase
          .from('lead_capture_campaigns')
          .insert([campaignData]);

        if (error) throw error;
        showToast('Campanha criada com sucesso!', 'success');
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar campanha:', error);
      showToast(error.message || 'Erro ao salvar campanha', 'error');
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
              Nome da Campanha *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Busca *
              </label>
              <select
                value={formData.search_type}
                onChange={(e) => setFormData({ ...formData, search_type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="google_maps">Google Maps</option>
                <option value="cep_region">Região por CEP</option>
                <option value="manual">Manual</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="ativo">Ativo</option>
                <option value="pausado">Pausado</option>
                <option value="concluído">Concluído</option>
              </select>
            </div>
          </div>

          {formData.search_type === 'google_maps' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Palavras-chave (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={formData.search_keywords}
                  onChange={(e) => setFormData({ ...formData, search_keywords: e.target.value })}
                  placeholder="Ex: ar condicionado, refrigeração, climatização"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Região
                  </label>
                  <input
                    type="text"
                    value={formData.search_region}
                    onChange={(e) => setFormData({ ...formData, search_region: e.target.value })}
                    placeholder="Ex: São Paulo, SP"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Raio (km)
                  </label>
                  <input
                    type="number"
                    value={formData.search_radius_km}
                    onChange={(e) => setFormData({ ...formData, search_radius_km: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </>
          )}

          {formData.search_type === 'cep_region' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CEP Inicial
                </label>
                <input
                  type="text"
                  value={formData.cep_start}
                  onChange={(e) => setFormData({ ...formData, cep_start: e.target.value })}
                  placeholder="01000-000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CEP Final
                </label>
                <input
                  type="text"
                  value={formData.cep_end}
                  onChange={(e) => setFormData({ ...formData, cep_end: e.target.value })}
                  placeholder="01999-999"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipos de Negócio (separados por vírgula)
            </label>
            <input
              type="text"
              value={formData.target_business_types}
              onChange={(e) => setFormData({ ...formData, target_business_types: e.target.value })}
              placeholder="Ex: Refrigeração, HVAC, Manutenção"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.auto_capture_enabled}
                  onChange={(e) => setFormData({ ...formData, auto_capture_enabled: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">Captura Automática</span>
              </label>
            </div>

            {formData.auto_capture_enabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequência
                </label>
                <select
                  value={formData.capture_frequency}
                  onChange={(e) => setFormData({ ...formData, capture_frequency: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">Diária</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                </select>
              </div>
            )}
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
      const currentStatus = campaign.status || (campaign.is_active ? 'ativo' : 'pausado');
      const newStatus = currentStatus === 'ativo' ? 'pausado' : 'ativo';

      await supabase
        .from('lead_capture_campaigns')
        .update({ status: newStatus })
        .eq('id', campaign.id);

      showToast(
        `Campanha ${newStatus === 'ativo' ? 'ativada' : 'pausada'} com sucesso!`,
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
    const searchType = campaign.search_type || campaign.source_type;

    if (!searchType || searchType === 'manual') {
      showToast('Configure o tipo de busca antes de executar', 'info');
      return;
    }

    setExecutingCampaign(campaign.id);

    try {
      const endpoint = searchType === 'google_maps'
        ? 'buscar-leads-google'
        : 'buscar-leads-cep';

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${endpoint}?campaignId=${campaign.id}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          }
        }
      );

      const result = await response.json();

      if (result.success) {
        showToast(
          `${result.leads_captured} leads capturados com sucesso!`,
          'success'
        );
        loadCampaigns();
      } else {
        throw new Error(result.error || 'Erro ao executar campanha');
      }
    } catch (error: any) {
      console.error('Erro ao executar campanha:', error);
      showToast(error.message || 'Erro ao executar campanha', 'error');
    } finally {
      setExecutingCampaign(null);
    }
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    const campaignName = campaign.name || campaign.nome || '';
    const campaignDesc = campaign.description || campaign.descricao || '';
    const campaignStatus = campaign.status || (campaign.is_active ? 'ativo' : 'pausado');
    const searchType = campaign.search_type || campaign.source_type || '';

    const matchesSearch =
      campaignName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaignDesc.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterType === 'all' ||
      (filterType === 'active' && campaignStatus === 'ativo') ||
      (filterType === 'inactive' && campaignStatus !== 'ativo') ||
      searchType === filterType;

    return matchesSearch && matchesFilter;
  });

  const getSourceTypeBadge = (type: string) => {
    const badges: { [key: string]: { color: string; label: string } } = {
      google_maps: { color: 'bg-green-100 text-green-800', label: 'Google Maps' },
      cep_region: { color: 'bg-blue-100 text-blue-800', label: 'Região CEP' },
      cnpj: { color: 'bg-blue-100 text-blue-800', label: 'CNPJ' },
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
              {getSourceTypeBadge(campaign.search_type || campaign.source_type || 'manual')}
              <div className="flex gap-2">
                <button
                  onClick={() => toggleCampaignStatus(campaign)}
                  className={`p-1 rounded hover:bg-gray-100 ${
                    (campaign.status === 'ativo' || campaign.is_active) ? 'text-green-600' : 'text-gray-400'
                  }`}
                  title={(campaign.status === 'ativo' || campaign.is_active) ? 'Pausar' : 'Ativar'}
                >
                  {(campaign.status === 'ativo' || campaign.is_active) ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
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
              {campaign.name || campaign.nome}
            </h3>
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {campaign.description || campaign.descricao}
            </p>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Leads Capturados</span>
                <span className="font-semibold text-gray-900">
                  {campaign.total_leads_captured}
                </span>
              </div>
              {(campaign.last_capture_at || campaign.last_run) && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Última Execução</span>
                  <span className="text-gray-900">
                    {new Date(campaign.last_capture_at || campaign.last_run).toLocaleDateString('pt-BR')}
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
