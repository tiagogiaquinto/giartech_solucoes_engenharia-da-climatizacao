import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Users, UserPlus, Shield, Wrench, UserCheck } from 'lucide-react'
import { getServiceOrderTeam, addTeamMember, removeTeamMember, updateTeamMemberRole, getEmployees, type ServiceOrderTeamMember, type Employee } from '../lib/database-services'

interface ServiceOrderTeamManagerProps {
  serviceOrderId: string
  onUpdate?: () => void
}

const ServiceOrderTeamManager = ({ serviceOrderId, onUpdate }: ServiceOrderTeamManagerProps) => {
  const [team, setTeam] = useState<ServiceOrderTeamMember[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [selectedRole, setSelectedRole] = useState<'leader' | 'technician' | 'assistant' | 'supervisor'>('technician')

  useEffect(() => {
    loadData()
  }, [serviceOrderId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [teamData, employeesData] = await Promise.all([
        getServiceOrderTeam(serviceOrderId),
        getEmployees()
      ])
      setTeam(teamData)
      setEmployees(employeesData)
    } catch (error) {
      console.error('Error loading team:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async () => {
    if (!selectedEmployee) return

    const alreadyInTeam = team.some((m: any) => m.employee_id === selectedEmployee)
    if (alreadyInTeam) {
      alert('Este funcionário já está na equipe!')
      return
    }

    try {
      await addTeamMember({
        service_order_id: serviceOrderId,
        employee_id: selectedEmployee,
        role: selectedRole
      })
      setSelectedEmployee('')
      setSelectedRole('technician')
      await loadData()
      onUpdate?.()
    } catch (error) {
      console.error('Error adding team member:', error)
    }
  }

  const handleRemoveMember = async (id: string) => {
    try {
      await removeTeamMember(id)
      await loadData()
      onUpdate?.()
    } catch (error) {
      console.error('Error removing team member:', error)
    }
  }

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      await updateTeamMemberRole(id, newRole)
      await loadData()
      onUpdate?.()
    } catch (error) {
      console.error('Error updating role:', error)
    }
  }

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'leader': return <Shield className="h-4 w-4" />
      case 'supervisor': return <UserCheck className="h-4 w-4" />
      case 'technician': return <Wrench className="h-4 w-4" />
      case 'assistant': return <UserPlus className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'leader': return 'Líder'
      case 'supervisor': return 'Supervisor'
      case 'technician': return 'Técnico'
      case 'assistant': return 'Assistente'
      default: return 'Membro'
    }
  }

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'leader': return 'bg-purple-100 text-purple-800'
      case 'supervisor': return 'bg-blue-100 text-blue-800'
      case 'technician': return 'bg-green-100 text-green-800'
      case 'assistant': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <div className="text-center py-8">Carregando equipe...</div>
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          Equipe da Ordem de Serviço
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Funcionário
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione um funcionário</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} {emp.role ? `- ${emp.role}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Função na Equipe
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="technician">Técnico</option>
                <option value="leader">Líder</option>
                <option value="supervisor">Supervisor</option>
                <option value="assistant">Assistente</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleAddMember}
            disabled={!selectedEmployee}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            <UserPlus className="h-5 w-5" />
            Adicionar à Equipe
          </button>
        </div>
      </div>

      {team.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Membros da Equipe ({team.length})
              </h4>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            <AnimatePresence>
              {team.map((member: any) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 100 }}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-900">
                          {member.employee?.name || 'Funcionário'}
                        </h5>
                        <div className="flex items-center gap-2 mt-1">
                          {member.employee?.email && (
                            <span className="text-xs text-gray-500">{member.employee.email}</span>
                          )}
                          {member.employee?.phone && (
                            <span className="text-xs text-gray-500">{member.employee.phone}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <select
                        value={member.role || 'technician'}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)} border-0 focus:ring-2 focus:ring-blue-500`}
                      >
                        <option value="technician">Técnico</option>
                        <option value="leader">Líder</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="assistant">Assistente</option>
                      </select>

                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {member.assigned_at && (
                    <div className="mt-2 text-xs text-gray-500">
                      Atribuído em: {new Date(member.assigned_at).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {team.length === 0 && (
        <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Nenhum membro na equipe</p>
          <p className="text-sm text-gray-500 mt-1">Adicione funcionários para trabalhar nesta ordem de serviço</p>
        </div>
      )}
    </div>
  )
}

export default ServiceOrderTeamManager
