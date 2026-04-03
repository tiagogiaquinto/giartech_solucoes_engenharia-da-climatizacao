import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Users, UserPlus, Shield, Wrench, UserCheck, Clock, DollarSign } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getServiceOrderTeam, addTeamMember, removeTeamMember, updateTeamMemberRole, getEmployees, type ServiceOrderTeamMember, type Employee } from '../lib/database-services'
import { formatDateSafe } from '../utils/format'

interface ServiceOrderTeamManagerProps {
  serviceOrderId: string
  onUpdate?: () => void
}

const fmt = (n: number) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const ServiceOrderTeamManager = ({ serviceOrderId, onUpdate }: ServiceOrderTeamManagerProps) => {
  const [team, setTeam] = useState<any[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [selectedRole, setSelectedRole] = useState<'leader' | 'technician' | 'assistant' | 'supervisor'>('technician')
  const [hoursInput, setHoursInput] = useState<Record<string, string>>({})
  const [savingHours, setSavingHours] = useState<Record<string, boolean>>({})

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
      const initHours: Record<string, string> = {}
      teamData.forEach((m: any) => {
        initHours[m.id] = String(m.hours_worked ?? m.hours ?? 1)
      })
      setHoursInput(initHours)
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

    const emp = employees.find(e => e.id === selectedEmployee)
    const hourlyRate = (emp as any)?.hourly_rate || 0

    try {
      await supabase.from('service_order_labor').insert({
        service_order_id: serviceOrderId,
        employee_id: selectedEmployee,
        role: selectedRole,
        hours_worked: 1,
        hourly_rate_used: hourlyRate,
        labor_cost: hourlyRate,
        employee_name: emp?.name || '',
        description: emp?.name ? `Mão de obra — ${emp.name}` : 'Mão de obra',
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
      // fallback: direct delete from service_order_labor
      await supabase.from('service_order_labor').delete().eq('id', id)
      await loadData()
      onUpdate?.()
    }
  }

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      await updateTeamMemberRole(id, newRole)
      await loadData()
    } catch {
      await supabase.from('service_order_labor').update({ role: newRole }).eq('id', id)
      await loadData()
    }
  }

  const handleHoursBlur = async (member: any) => {
    const hrs = parseFloat(hoursInput[member.id] || '1') || 1
    setSavingHours(s => ({ ...s, [member.id]: true }))

    const hourlyRate = member.hourly_rate_used
      || member.employees?.hourly_rate
      || member.custo_hora
      || member.hourly_rate
      || 0

    const laborCost = Math.round(hrs * hourlyRate * 100) / 100

    await supabase.from('service_order_labor').update({
      hours_worked: hrs,
      hours: hrs,
      hourly_rate_used: hourlyRate,
      labor_cost: laborCost,
      custo_hora: hourlyRate,
      custo_total: laborCost,
      total_cost: laborCost,
    }).eq('id', member.id)

    setSavingHours(s => ({ ...s, [member.id]: false }))
    await loadData()
    onUpdate?.()
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
    const labels: Record<string, string> = {
      leader: 'Líder', supervisor: 'Supervisor', technician: 'Técnico', assistant: 'Assistente'
    }
    return labels[role || ''] || 'Membro'
  }

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'leader': return 'bg-blue-100 text-blue-800'
      case 'supervisor': return 'bg-sky-100 text-sky-800'
      case 'technician': return 'bg-green-100 text-green-800'
      case 'assistant': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const totalLabor = team.reduce((sum, m) => sum + parseFloat(m.labor_cost || m.custo_total || 0), 0)

  const selectedEmpData = employees.find(e => e.id === selectedEmployee) as any

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Carregando equipe...</div>
  }

  return (
    <div className="space-y-6">
      {/* Add Member Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          Adicionar Membro à Equipe
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Funcionário</label>
              <select
                value={selectedEmployee}
                onChange={e => setSelectedEmployee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione um funcionário</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}{emp.role ? ` — ${emp.role}` : ''}
                    {(emp as any).hourly_rate ? ` · R$/h ${fmt((emp as any).hourly_rate)}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Função na Equipe</label>
              <select
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="technician">Técnico</option>
                <option value="leader">Líder</option>
                <option value="supervisor">Supervisor</option>
                <option value="assistant">Assistente</option>
              </select>
            </div>
          </div>

          {selectedEmpData && (
            <div className="grid grid-cols-3 gap-3 p-3 bg-blue-50 rounded-lg text-sm">
              <div>
                <p className="text-xs text-gray-500">Salário/mês</p>
                <p className="font-semibold text-gray-800">R$ {fmt(selectedEmpData.salary || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Encargos</p>
                <p className="font-semibold text-gray-800">{selectedEmpData.encargos_pct || 70}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Custo/hora (c/ encargos)</p>
                <p className="font-bold text-blue-700">R$ {fmt(selectedEmpData.hourly_rate || 0)}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleAddMember}
            disabled={!selectedEmployee}
            className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Adicionar à Equipe
          </button>
        </div>
      </div>

      {/* Team List */}
      {team.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-3.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              Equipe Alocada ({team.length})
            </h4>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              Custo total: <span className="text-emerald-700">R$ {fmt(totalLabor)}</span>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            <AnimatePresence>
              {team.map((member: any) => {
                const empData = member.employees as any
                const hourlyRate = member.hourly_rate_used || empData?.hourly_rate || member.custo_hora || member.hourly_rate || 0
                const hrs = parseFloat(hoursInput[member.id] || '1') || 1
                const previewCost = Math.round(hrs * hourlyRate * 100) / 100

                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    className="px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          {getRoleIcon(member.role)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {empData?.name || member.employee_name || member.nome_funcionario || 'Funcionário'}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                              {getRoleLabel(member.role)}
                            </span>
                            {hourlyRate > 0 && (
                              <span className="text-xs text-gray-500">
                                R$ {fmt(hourlyRate)}/h
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        {/* Hours worked input */}
                        <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-3 py-1.5">
                          <Clock className="h-3.5 w-3.5 text-gray-500" />
                          <input
                            type="number"
                            min="0.5"
                            max="999"
                            step="0.5"
                            value={hoursInput[member.id] ?? '1'}
                            onChange={e => setHoursInput(s => ({ ...s, [member.id]: e.target.value }))}
                            onBlur={() => handleHoursBlur(member)}
                            className="w-14 bg-transparent text-sm font-medium text-gray-800 text-center focus:outline-none"
                          />
                          <span className="text-xs text-gray-500">h</span>
                          {savingHours[member.id] && (
                            <span className="text-xs text-blue-500 animate-pulse">...</span>
                          )}
                        </div>

                        {/* Labor cost */}
                        <div className="text-right min-w-[90px]">
                          <p className="text-xs text-gray-500">Custo</p>
                          <p className="text-sm font-bold text-emerald-700">R$ {fmt(previewCost)}</p>
                        </div>

                        {/* Role selector */}
                        <select
                          value={member.role || 'technician'}
                          onChange={e => handleRoleChange(member.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="technician">Técnico</option>
                          <option value="leader">Líder</option>
                          <option value="supervisor">Supervisor</option>
                          <option value="assistant">Assistente</option>
                        </select>

                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-red-400 hover:text-red-700 transition-colors p-1 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {member.assigned_at && (
                      <p className="mt-1.5 text-xs text-gray-400 pl-12">
                        Atribuído em {formatDateSafe(member.assigned_at)}
                      </p>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          <div className="px-6 py-3 bg-emerald-50 border-t border-emerald-100 flex justify-between items-center">
            <span className="text-sm text-emerald-700">
              Total de horas: {team.reduce((s, m) => s + parseFloat(m.hours_worked || m.hours || 1), 0).toFixed(1)}h
            </span>
            <span className="text-sm font-bold text-emerald-800">
              Custo total M.O.: R$ {fmt(totalLabor)}
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">
          <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-600">Nenhum membro na equipe</p>
          <p className="text-xs text-gray-400 mt-1">Adicione funcionários para calcular o custo de mão de obra</p>
        </div>
      )}
    </div>
  )
}

export default ServiceOrderTeamManager
