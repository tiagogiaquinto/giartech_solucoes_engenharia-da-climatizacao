import { motion } from 'framer-motion';
import { Calendar, User, DollarSign, AlertCircle } from 'lucide-react';

interface ServiceOrder {
  id: number;
  customer_name: string;
  service_type: string;
  status: string;
  total_value: number;
  created_at: string;
}

interface MobileServiceOrderCardProps {
  order: ServiceOrder;
  onClick: () => void;
}

export default function MobileServiceOrderCard({ order, onClick }: MobileServiceOrderCardProps) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'in_progress': 'bg-blue-100 text-blue-800 border-blue-300',
      'completed': 'bg-green-100 text-green-800 border-green-300',
      'cancelled': 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pending': 'Pendente',
      'in_progress': 'Em Andamento',
      'completed': 'Concluída',
      'cancelled': 'Cancelada'
    };
    return labels[status] || status;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3 active:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg mb-1">
            OS #{order.id}
          </h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
            {getStatusLabel(order.status)}
          </span>
        </div>
        {order.status === 'pending' && (
          <AlertCircle className="w-5 h-5 text-yellow-500 ml-2" />
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center text-sm text-gray-600">
          <User className="w-4 h-4 mr-2 text-gray-400" />
          <span className="truncate">{order.customer_name}</span>
        </div>

        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
          <span>{new Date(order.created_at).toLocaleDateString('pt-BR')}</span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-sm font-medium text-gray-700">{order.service_type}</span>
          <div className="flex items-center text-lg font-bold text-sky-600">
            <DollarSign className="w-5 h-5" />
            <span>{order.total_value.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
