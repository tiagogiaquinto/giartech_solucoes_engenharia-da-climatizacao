import React, { useState } from 'react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'
import { Edit, Save, X, RefreshCw } from 'lucide-react'
import { useUser } from '../contexts/UserContext'

interface FinancialData {
  month: string
  income: number
  expense: number
}

interface ProjectData {
  name: string
  value: number
}

interface TransactionData {
  name: string
  value: number
}

interface DashboardChartsProps {
  financialData: FinancialData[]
  projectData: ProjectData[]
  transactionData: TransactionData[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

const DashboardCharts: React.FC<DashboardChartsProps> = ({ 
  financialData: initialFinancialData, 
  projectData: initialProjectData,
  transactionData: initialTransactionData
}) => {
  const [financialData, setFinancialData] = useState(initialFinancialData)
  const [projectData, setProjectData] = useState(initialProjectData)
  const [transactionData, setTransactionData] = useState(initialTransactionData)
  
  const [editingChart, setEditingChart] = useState<string | null>(null)
  const [editData, setEditData] = useState<any>(null)

  const startEditing = (chartType: string, data: any) => {
    setEditingChart(chartType)
    setEditData(JSON.parse(JSON.stringify(data))) // Deep copy
  }

  const handleDataChange = (index: number, field: string, value: string) => {
    const numValue = parseFloat(value)
    if (isNaN(numValue) && field !== 'month' && field !== 'name') return

    const newData = [...editData]
    if (field === 'month' || field === 'name') {
      newData[index][field] = value
    } else {
      newData[index][field] = numValue
    }
    setEditData(newData)
  }

  const saveChanges = () => {
    if (!editingChart || !editData) return

    switch (editingChart) {
      case 'financial':
        setFinancialData(editData)
        break
      case 'project':
        setProjectData(editData)
        break
      case 'transaction':
        setTransactionData(editData)
        break
    }

    setEditingChart(null)
    setEditData(null)
  }

  const cancelEditing = () => {
    setEditingChart(null)
    setEditData(null)
  }

  return (
    <div className="space-y-8">
      {/* Financial Chart */}
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Receitas vs Despesas</h3>
          {editingChart === 'financial' ? (
            <div className="flex space-x-2">
              <button 
                onClick={saveChanges}
                className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center space-x-1"
              >
                <Save className="h-4 w-4" />
                <span>Salvar</span>
              </button>
              <button 
                onClick={cancelEditing}
                className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center space-x-1"
              >
                <X className="h-4 w-4" />
                <span>Cancelar</span>
              </button>
            </div>
          ) : (
            <button 
              onClick={() => startEditing('financial', financialData)}
              className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-1"
            >
              <Edit className="h-4 w-4" />
              <span>Editar</span>
            </button>
          )}
        </div>
        
        {editingChart === 'financial' ? (
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mês</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receitas (R$)</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Despesas (R$)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {editData.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={item.month}
                        onChange={(e) => handleDataChange(index, 'month', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={item.income}
                        onChange={(e) => handleDataChange(index, 'income', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={item.expense}
                        onChange={(e) => handleDataChange(index, 'expense', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={financialData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
                labelFormatter={(label) => `Mês: ${label}`}
              />
              <Legend />
              <Bar dataKey="income" name="Receitas" fill="#4ade80" />
              <Bar dataKey="expense" name="Despesas" fill="#f87171" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Project Status Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Status dos Projetos</h3>
            {editingChart === 'project' ? (
              <div className="flex space-x-2">
                <button 
                  onClick={saveChanges}
                  className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center space-x-1"
                >
                  <Save className="h-4 w-4" />
                  <span>Salvar</span>
                </button>
                <button 
                  onClick={cancelEditing}
                  className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center space-x-1"
                >
                  <X className="h-4 w-4" />
                  <span>Cancelar</span>
                </button>
              </div>
            ) : (
              <button 
                onClick={() => startEditing('project', projectData)}
                className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-1"
              >
                <Edit className="h-4 w-4" />
                <span>Editar</span>
              </button>
            )}
          </div>
          
          {editingChart === 'project' ? (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantidade</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {editData.map((item: any, index: number) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleDataChange(index, 'name', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={item.value}
                          onChange={(e) => handleDataChange(index, 'value', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {projectData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} projetos`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transaction Categories Chart */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Categorias de Transações</h3>
            {editingChart === 'transaction' ? (
              <div className="flex space-x-2">
                <button 
                  onClick={saveChanges}
                  className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center space-x-1"
                >
                  <Save className="h-4 w-4" />
                  <span>Salvar</span>
                </button>
                <button 
                  onClick={cancelEditing}
                  className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center space-x-1"
                >
                  <X className="h-4 w-4" />
                  <span>Cancelar</span>
                </button>
              </div>
            ) : (
              <button 
                onClick={() => startEditing('transaction', transactionData)}
                className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-1"
              >
                <Edit className="h-4 w-4" />
                <span>Editar</span>
              </button>
            )}
          </div>
          
          {editingChart === 'transaction' ? (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor (R$)</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {editData.map((item: any, index: number) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleDataChange(index, 'name', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={item.value}
                          onChange={(e) => handleDataChange(index, 'value', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={transactionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {transactionData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Cash Flow Trend */}
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Tendência de Fluxo de Caixa</h3>
          <button 
            onClick={() => startEditing('financial', financialData)}
            className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-1"
          >
            <Edit className="h-4 w-4" />
            <span>Editar</span>
          </button>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={financialData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
                labelFormatter={(label) => `Mês: ${label}`}
              />
              <Legend />
              <Area type="monotone" dataKey="income" name="Receitas" stroke="#4ade80" fill="#4ade8080" />
              <Area type="monotone" dataKey="expense" name="Despesas" stroke="#f87171" fill="#f8717180" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default DashboardCharts