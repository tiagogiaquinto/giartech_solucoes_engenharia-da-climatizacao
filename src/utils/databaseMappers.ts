export const mapServiceOrderFromDB = (data: any) => data
export const mapServiceOrderToDB = (data: any) => data

export const getServiceOrderStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'cotacao': 'Cotação',
    'orcamento': 'Orçamento',
    'quote': 'Cotação',
    'budget': 'Orçamento',
    'pendente': 'Pendente',
    'aberta': 'Aberta',
    'pending': 'Pendente',
    'open': 'Aberta',
    'em_andamento': 'Em Andamento',
    'pausado': 'Pausado',
    'in_progress': 'Em Andamento',
    'paused': 'Pausado',
    'concluido': 'Concluído',
    'finalizada': 'Finalizada',
    'completed': 'Concluído',
    'finished': 'Finalizada',
    'cancelada': 'Cancelada',
    'cancelado': 'Cancelado',
    'cancelled': 'Cancelada'
  }
  return labels[status] || status
}

export const getServiceOrderStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'cotacao': 'bg-purple-100 text-purple-800 border-purple-200',
    'orcamento': 'bg-purple-100 text-purple-800 border-purple-200',
    'quote': 'bg-purple-100 text-purple-800 border-purple-200',
    'budget': 'bg-purple-100 text-purple-800 border-purple-200',
    'pendente': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'aberta': 'bg-blue-100 text-blue-800 border-blue-200',
    'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'open': 'bg-blue-100 text-blue-800 border-blue-200',
    'em_andamento': 'bg-blue-100 text-blue-800 border-blue-200',
    'pausado': 'bg-orange-100 text-orange-800 border-orange-200',
    'in_progress': 'bg-blue-100 text-blue-800 border-blue-200',
    'paused': 'bg-orange-100 text-orange-800 border-orange-200',
    'concluido': 'bg-green-100 text-green-800 border-green-200',
    'finalizada': 'bg-green-100 text-green-800 border-green-200',
    'completed': 'bg-green-100 text-green-800 border-green-200',
    'finished': 'bg-green-100 text-green-800 border-green-200',
    'cancelada': 'bg-red-100 text-red-800 border-red-200',
    'cancelado': 'bg-red-100 text-red-800 border-red-200',
    'cancelled': 'bg-red-100 text-red-800 border-red-200'
  }
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
}

export const getPriorityLabel = (priority: string) => priority
