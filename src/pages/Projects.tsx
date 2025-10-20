import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FolderOpen, 
  Plus, 
  Users, 
  Calendar, 
  X, 
  Save, 
  Trash2,
  CheckSquare,
  Clock,
  BarChart3,
  Lock
} from 'lucide-react'
import { useUser } from '../contexts/UserContext'

interface Project {
  id: number
  name: string
  status: string
  team: number
  deadline: string
  progress: number
  color: string
  description?: string
  tasks?: ProjectTask[]
}

interface ProjectTask {
  id: number
  title: string
  completed: boolean
  dueDate: string
}

interface ProjectsProps {
  onPremiumFeature: (feature: string) => void
  onEnterpriseFeature?: (feature: string) => void
}

const Projects: React.FC<ProjectsProps> = ({ onPremiumFeature, onEnterpriseFeature }) => {
  const { isPremium, isEnterprise } = useUser()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [projects, setProjects] = useState<Project[]>([
    {
      id: 1,
      name: 'App Mobile GiarTech',
      status: 'Em Progresso',
      team: 4,
      deadline: '2024-01-15',
      progress: 75,
      color: 'from-blue-500 to-cyan-500',
      description: 'Desenvolvimento do aplicativo mobile principal da empresa',
      tasks: [
        { id: 1, title: 'Design de interface', completed: true, dueDate: '2023-12-10' },
        { id: 2, title: 'Desenvolvimento frontend', completed: true, dueDate: '2023-12-20' },
        { id: 3, title: 'Integração com API', completed: false, dueDate: '2024-01-05' },
        { id: 4, title: 'Testes e QA', completed: false, dueDate: '2024-01-10' },
        { id: 5, title: 'Lançamento', completed: false, dueDate: '2024-01-15' }
      ]
    },
    {
      id: 2,
      name: 'Website Corporativo',
      status: 'Concluído',
      team: 3,
      deadline: '2024-01-10',
      progress: 100,
      color: 'from-green-500 to-emerald-500',
      description: 'Novo site institucional com design moderno',
      tasks: [
        { id: 1, title: 'Wireframes e protótipos', completed: true, dueDate: '2023-11-15' },
        { id: 2, title: 'Design de páginas', completed: true, dueDate: '2023-11-30' },
        { id: 3, title: 'Desenvolvimento frontend', completed: true, dueDate: '2023-12-15' },
        { id: 4, title: 'Desenvolvimento backend', completed: true, dueDate: '2023-12-30' },
        { id: 5, title: 'Testes e lançamento', completed: true, dueDate: '2024-01-10' }
      ]
    },
    {
      id: 3,
      name: 'Sistema de CRM',
      status: 'Planejamento',
      team: 5,
      deadline: '2024-01-30',
      progress: 25,
      color: 'from-purple-500 to-pink-500',
      description: 'Sistema de gestão de relacionamento com clientes',
      tasks: [
        { id: 1, title: 'Levantamento de requisitos', completed: true, dueDate: '2023-12-15' },
        { id: 2, title: 'Modelagem de dados', completed: true, dueDate: '2023-12-30' },
        { id: 3, title: 'Prototipagem de interface', completed: false, dueDate: '2024-01-10' },
        { id: 4, title: 'Desenvolvimento', completed: false, dueDate: '2024-01-25' },
        { id: 5, title: 'Testes e implantação', completed: false, dueDate: '2024-01-30' }
      ]
    }
  ])

  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    deadline: '',
    team: 1,
    status: 'Planejamento'
  })

  const [newTask, setNewTask] = useState({
    title: '',
    dueDate: ''
  })

  const colors = [
    'from-blue-500 to-cyan-500',
    'from-green-500 to-emerald-500',
    'from-purple-500 to-pink-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-purple-500',
    'from-yellow-500 to-orange-500'
  ]

  const handleCreateProject = () => {
    if (!isPremium && projects.length >= 3) {
      onPremiumFeature('Projetos Ilimitados')
      return
    }

    if (newProject.name.trim()) {
      const project: Project = {
        id: Date.now(),
        name: newProject.name,
        status: newProject.status,
        team: newProject.team,
        deadline: newProject.deadline,
        progress: 0,
        color: colors[Math.floor(Math.random() * colors.length)],
        description: newProject.description,
        tasks: []
      }
      
      setProjects([...projects, project])
      setNewProject({ name: '', description: '', deadline: '', team: 1, status: 'Planejamento' })
      setShowCreateModal(false)
    }
  }

  const handleAddTask = () => {
    if (!isPremium && selectedProject && selectedProject.tasks && selectedProject.tasks.length >= 5) {
      onPremiumFeature('Tarefas Ilimitadas')
      return
    }
    
    if (selectedProject && newTask.title && newTask.dueDate) {
      const task: ProjectTask = {
        id: Date.now(),
        title: newTask.title,
        completed: false,
        dueDate: newTask.dueDate
      }
      
      const updatedProject = {
        ...selectedProject,
        tasks: [...(selectedProject.tasks || []), task]
      }
      
      setProjects(projects.map(p => p.id === selectedProject.id ? updatedProject : p))
      setSelectedProject(updatedProject)
      setNewTask({ title: '', dueDate: '' })
      setShowTaskModal(false)
    }
  }

  const handleToggleTask = (projectId: number, taskId: number) => {
    const project = projects.find(p => p.id === projectId)
    if (project && project.tasks) {
      const updatedTasks = project.tasks.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
      
      // Calculate new progress
      const completedTasks = updatedTasks.filter(t => t.completed).length
      const totalTasks = updatedTasks.length
      const newProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      
      const updatedProject = {
        ...project,
        tasks: updatedTasks,
        progress: newProgress
      }
      
      setProjects(projects.map(p => p.id === projectId ? updatedProject : p))
      if (selectedProject && selectedProject.id === projectId) {
        setSelectedProject(updatedProject)
      }
    }
  }

  const handleDeleteProject = (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este projeto?')) {
      setProjects(projects.filter(p => p.id !== id))
      if (selectedProject && selectedProject.id === id) {
        setSelectedProject(null)
      }
    }
  }

  const handleUpdateProgress = (id: number, progress: number) => {
    setProjects(projects.map(p => 
      p.id === id ? { ...p, progress } : p
    ))
  }
  
  const handleAdvancedAnalytics = () => {
    if (!isEnterprise) {
      onEnterpriseFeature && onEnterpriseFeature('Análise Avançada de Projetos')
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Meus Projetos ({projects.length})
            </h1>
            <p className="text-gray-600">
              Gerencie todos os seus projetos em um só lugar
            </p>
          </div>
          <button 
            onClick={() => {
              if (!isPremium && projects.length >= 3) {
                onPremiumFeature('Projetos Ilimitados')
                return
              }
              setShowCreateModal(true)
            }}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
        
        {/* Free Plan Limitation Notice */}
        {!isPremium && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-sm text-blue-700 flex items-center">
              <FolderOpen className="h-4 w-4 mr-2" />
              Plano Básico: Limitado a 3 projetos e 5 tarefas por projeto. Faça upgrade para projetos ilimitados.
            </p>
          </div>
        )}
      </motion.div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-4 shadow-md border border-gray-100 col-span-2"
        >
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Status dos Projetos</h3>
          <div className="flex justify-between">
            <div className="text-center">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-lg font-bold text-gray-900">{projects.length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Concluídos</p>
              <p className="text-lg font-bold text-green-600">{projects.filter(p => p.progress === 100).length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Em Progresso</p>
              <p className="text-lg font-bold text-blue-600">{projects.filter(p => p.progress > 0 && p.progress < 100).length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Planejados</p>
              <p className="text-lg font-bold text-purple-600">{projects.filter(p => p.progress === 0).length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-4 shadow-md border border-gray-100"
        >
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Progresso Médio</h3>
          <div className="flex flex-col justify-between h-full">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / (projects.length || 1))}%
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / (projects.length || 1))}%` }}
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-4 shadow-md border border-gray-100"
        >
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Próximos Prazos</h3>
          <div className="flex flex-col justify-between h-full">
            <div className="space-y-2">
              {projects
                .filter(p => p.progress < 100)
                .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
                .slice(0, 2)
                .map(project => (
                  <div key={project.id} className="flex justify-between items-center">
                    <span className="text-xs truncate max-w-[120px]">{project.name}</span>
                    <span className="text-xs font-medium">{new Date(project.deadline).toLocaleDateString('pt-BR')}</span>
                  </div>
                ))
              }
              
              {/* Enterprise Feature Teaser */}
              {!isEnterprise && (
                <div 
                  className="mt-2 flex items-center justify-between text-xs text-gray-500 cursor-pointer hover:text-blue-600"
                  onClick={handleAdvancedAnalytics}
                >
                  <span>Análise avançada</span>
                  <Lock className="h-3 w-3" />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Projects List */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Todos os Projetos</h3>
            <div className="space-y-4">
              {projects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer"
                  onClick={() => setSelectedProject(project)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 bg-gradient-to-r ${project.color} rounded-lg flex items-center justify-center`}>
                        <FolderOpen className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{project.name}</h3>
                        <p className="text-xs text-gray-500">{project.status}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {new Date(project.deadline).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Progresso</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          project.progress === 100 ? 'bg-green-500' : 
                          project.progress > 50 ? 'bg-blue-500' : 'bg-yellow-500'
                        }`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Project Info */}
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Users className="h-3 w-3" />
                      <span>{project.team} membros</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckSquare className="h-3 w-3" />
                      <span>{project.tasks ? project.tasks.filter(t => t.completed).length : 0}/{project.tasks ? project.tasks.length : 0} tarefas</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Project Details */}
        <div className="md:col-span-1">
          {selectedProject ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl p-4 shadow-md border border-gray-100 h-full"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 bg-gradient-to-r ${selectedProject.color} rounded-lg flex items-center justify-center`}>
                    <FolderOpen className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900">{selectedProject.name}</h3>
                </div>
                <button
                  onClick={() => handleDeleteProject(selectedProject.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Descrição</p>
                  <p className="text-sm text-gray-700">{selectedProject.description || 'Sem descrição'}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Status</p>
                    <p className="text-sm font-medium text-gray-900">{selectedProject.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Prazo</p>
                    <p className="text-sm font-medium text-gray-900">{new Date(selectedProject.deadline).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Equipe</p>
                    <p className="text-sm font-medium text-gray-900">{selectedProject.team} membros</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Progresso</p>
                    <p className="text-sm font-medium text-gray-900">{selectedProject.progress}%</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-500">Tarefas</p>
                    <button
                      onClick={() => {
                        if (!isPremium && selectedProject.tasks && selectedProject.tasks.length >= 5) {
                          onPremiumFeature('Tarefas Ilimitadas')
                          return
                        }
                        setShowTaskModal(true)
                      }}
                      className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Adicionar
                    </button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedProject.tasks && selectedProject.tasks.length > 0 ? (
                      selectedProject.tasks.map(task => (
                        <div 
                          key={task.id} 
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleToggleTask(selectedProject.id, task.id)}
                              className={`w-4 h-4 rounded border flex items-center justify-center ${
                                task.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
                              }`}
                            >
                              {task.completed && <CheckSquare className="h-3 w-3" />}
                            </button>
                            <span className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                              {task.title}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">
                              {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">Nenhuma tarefa adicionada</p>
                    )}
                  </div>
                </div>
                
                {/* Enterprise Feature Teaser */}
                {!isEnterprise && (
                  <div 
                    className="mt-4 p-3 bg-purple-50 border border-purple-100 rounded-lg cursor-pointer"
                    onClick={handleAdvancedAnalytics}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <BarChart3 className="h-4 w-4 text-purple-600 mr-2" />
                        <p className="text-sm text-purple-700">Análise avançada de projetos</p>
                      </div>
                      <Lock className="h-4 w-4 text-purple-600" />
                    </div>
                    <p className="text-xs text-purple-600 mt-1">Disponível no plano Enterprise</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 h-full flex items-center justify-center">
              <div className="text-center">
                <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">Selecione um projeto para ver os detalhes</p>
                <button
                  onClick={() => {
                    if (!isPremium && projects.length >= 3) {
                      onPremiumFeature('Projetos Ilimitados')
                      return
                    }
                    setShowCreateModal(true)
                  }}
                  className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                >
                  <Plus className="h-4 w-4 mr-2 inline" />
                  Novo Projeto
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Novo Projeto</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Projeto
                  </label>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Digite o nome do projeto"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Descreva o projeto"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prazo
                    </label>
                    <input
                      type="date"
                      value={newProject.deadline}
                      onChange={(e) => setNewProject({...newProject, deadline: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Equipe
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newProject.team}
                      onChange={(e) => setNewProject({...newProject, team: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={newProject.status}
                    onChange={(e) => setNewProject({...newProject, status: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Planejamento">Planejamento</option>
                    <option value="Em Progresso">Em Progresso</option>
                    <option value="Em Revisão">Em Revisão</option>
                    <option value="Concluído">Concluído</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateProject}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Criar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Task Modal */}
      <AnimatePresence>
        {showTaskModal && selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTaskModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Nova Tarefa</h2>
                <button
                  onClick={() => setShowTaskModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Projeto
                  </label>
                  <input
                    type="text"
                    value={selectedProject.name}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título da Tarefa
                  </label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Digite o título da tarefa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Vencimento
                  </label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowTaskModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddTask}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Adicionar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Projects