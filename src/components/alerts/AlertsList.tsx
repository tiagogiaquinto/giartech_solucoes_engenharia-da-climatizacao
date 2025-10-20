import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  AlertTriangle, 
  X, 
  ChevronDown, 
  Check, 
  ArrowUpRight, 
  Trash2,
  Search,
  User,
  Calendar,
  Clock as ClockIcon,
  Flag
} from 'lucide-react';

interface Alert {
  id: string;
  departmentId: string;
  title: string;
  description: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
  status: 'new' | 'viewed' | 'resolved';
}

interface Department {
  id: string;
  name: string;
  color: string;
}

interface Employee {
  id: string;
  name: string;
  department: string;
  role: string;
  avatar?: string;
}

interface AlertsListProps {
  alerts: Alert[];
  departments: Department[];
  onResolve: (alertId: string) => void;
  onEscalate: (alertId: string) => void;
  onIgnore: (alertId: string) => void;
}

const AlertsList: React.FC<AlertsListProps> = ({
  alerts,
  departments,
  onResolve,
  onEscalate,
  onIgnore
}) => {
  const [sortBy, setSortBy] = useState<'date' | 'severity'>('severity');
  const [filterDepartment, setFilterDepartment] = useState<string | 'all'>('all');
  const [expandedAlerts, setExpandedAlerts] = useState<string[]>([]);
  const [showEscalateModal, setShowEscalateModal] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // Sample employees data
  const employees: Employee[] = [
    { id: '1', name: 'João Silva', department: 'operations', role: 'Supervisor' },
    { id: '2', name: 'Maria Santos', department: 'operations', role: 'Técnico' },
    { id: '3', name: 'Carlos Oliveira', department: 'technical', role: 'Técnico Sênior' },
    { id: '4', name: 'Ana Pereira', department: 'technical', role: 'Técnico' },
    { id: '5', name: 'Pedro Costa', department: 'commercial', role: 'Gerente' },
    { id: '6', name: 'Lúcia Ferreira', department: 'financial', role: 'Analista' },
    { id: '7', name: 'Roberto Almeida', department: 'administrative', role: 'Coordenador' }
  ];

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return '#f59e0b'; // Yellow
      case 'medium': return '#f97316'; // Orange
      case 'high': return '#ef4444'; // Red
      default: return '#6b7280'; // Gray
    }
  };

  // Get severity icon
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low': return <Clock className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <X className="h-4 w-4" />;
      default: return null;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Toggle alert expansion
  const toggleAlertExpansion = (alertId: string) => {
    setExpandedAlerts(prev => 
      prev.includes(alertId)
        ? prev.filter(id => id !== alertId)
        : [...prev, alertId]
    );
  };

  // Handle escalation
  const handleEscalate = (alertId: string) => {
    setShowEscalateModal(alertId);
  };

  // Complete escalation
  const completeEscalation = () => {
    if (!showEscalateModal || !selectedEmployee || !dueDate) return;
    
    // Create task in employee's calendar
    console.log('Creating task for employee:', selectedEmployee);
    console.log('Due date:', dueDate);
    console.log('Priority:', priority);
    
    // Call the original escalate function
    onEscalate(showEscalateModal);
    
    // Reset and close modal
    setShowEscalateModal(null);
    setSelectedEmployee(null);
    setDueDate('');
    setPriority('medium');
  };

  // Filter employees based on search term
  const filteredEmployees = employees.filter(employee => 
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort and filter alerts
  const sortedAndFilteredAlerts = [...alerts]
    .filter(alert => filterDepartment === 'all' || alert.departmentId === filterDepartment)
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      } else {
        const severityOrder = { high: 0, medium: 1, low: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
    });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Ordenar por:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'severity')}
            className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="severity">Severidade</option>
            <option value="date">Data</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Departamento:</span>
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">Todos</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {sortedAndFilteredAlerts.length > 0 ? (
          sortedAndFilteredAlerts.map((alert) => {
            const department = departments.find(d => d.id === alert.departmentId);
            const isExpanded = expandedAlerts.includes(alert.id);
            
            return (
              <motion.div 
                key={alert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden"
              >
                {/* Alert Header */}
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleAlertExpansion(alert.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}
                      style={{ backgroundColor: `${getSeverityColor(alert.severity)}20` }}
                    >
                      {getSeverityIcon(alert.severity)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 text-base">{alert.title}</h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">{formatDate(alert.timestamp)}</span>
                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          </motion.div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-1">
                        <div 
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ 
                            backgroundColor: `${getSeverityColor(alert.severity)}20`,
                            color: getSeverityColor(alert.severity)
                          }}
                        >
                          {alert.severity === 'low' ? 'Baixa' : alert.severity === 'medium' ? 'Média' : 'Alta'}
                        </div>
                        
                        {department && (
                          <div className="flex items-center space-x-1">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: department.color }}
                            />
                            <span className="text-xs text-gray-500">{department.name}</span>
                          </div>
                        )}
                        
                        {alert.status === 'new' && (
                          <div className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            Novo
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Alert Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-gray-200 overflow-hidden"
                    >
                      <div className="p-4 bg-gray-50">
                        <p className="text-sm text-gray-700 mb-4">{alert.description}</p>
                        
                        <div className="flex flex-wrap justify-center gap-2">
                          <button 
                            onClick={() => onResolve(alert.id)}
                            className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm flex items-center space-x-1"
                          >
                            <Check className="h-4 w-4" />
                            <span>Resolver</span>
                          </button>
                          <button 
                            onClick={() => handleEscalate(alert.id)}
                            className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm flex items-center space-x-1"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                            <span>Escalar</span>
                          </button>
                          <button 
                            onClick={() => onIgnore(alert.id)}
                            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center space-x-1"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Ignorar</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <Check className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-600">Não há alertas para exibir com os filtros atuais</p>
          </div>
        )}
      </div>

      {/* Escalation Modal */}
      <AnimatePresence>
        {showEscalateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEscalateModal(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Escalar Alerta</h2>
                <button onClick={() => setShowEscalateModal(null)}>
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Search for employee */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Responsável
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por nome ou setor..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Employee list */}
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                  {filteredEmployees.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {filteredEmployees.map(employee => (
                        <div 
                          key={employee.id}
                          onClick={() => setSelectedEmployee(employee.id)}
                          className={`p-3 cursor-pointer transition-colors ${
                            selectedEmployee === employee.id 
                              ? 'bg-blue-50' 
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            {employee.avatar ? (
                              <img 
                                src={employee.avatar} 
                                alt={employee.name} 
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-gray-500" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{employee.name}</p>
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <span>{employee.role}</span>
                                <span>•</span>
                                <span>{departments.find(d => d.id === employee.department)?.name || employee.department}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      Nenhum funcionário encontrado
                    </div>
                  )}
                </div>

                {/* Due date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prazo
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prioridade
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPriority('low')}
                      className={`flex items-center justify-center space-x-1 p-2 rounded-lg border ${
                        priority === 'low'
                          ? 'bg-green-50 border-green-300 text-green-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Flag className="h-4 w-4" />
                      <span>Baixa</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPriority('medium')}
                      className={`flex items-center justify-center space-x-1 p-2 rounded-lg border ${
                        priority === 'medium'
                          ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Flag className="h-4 w-4" />
                      <span>Média</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPriority('high')}
                      className={`flex items-center justify-center space-x-1 p-2 rounded-lg border ${
                        priority === 'high'
                          ? 'bg-red-50 border-red-300 text-red-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Flag className="h-4 w-4" />
                      <span>Alta</span>
                    </button>
                  </div>
                </div>

                {/* Task info */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <ClockIcon className="h-4 w-4 text-blue-500" />
                    <p className="text-sm font-medium text-blue-700">Tarefa será criada na agenda</p>
                  </div>
                  <p className="text-xs text-blue-600">
                    Uma tarefa será automaticamente criada na agenda do responsável selecionado com o prazo e prioridade definidos.
                  </p>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowEscalateModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={completeEscalation}
                  disabled={!selectedEmployee || !dueDate}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  Escalar Alerta
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AlertsList;