import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { Task, ColumnId, Subtask, Comment } from './types'

export function useTaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from('project_tasks')
      .select(`
        *,
        subtasks:project_task_subtasks(id, completed)
      `)
      .order('position', { ascending: true })

    if (!error && data) {
      const mapped = data.map((t: any) => ({
        ...t,
        tags: t.tags || [],
        subtasks_total: t.subtasks?.length ?? 0,
        subtasks_done: t.subtasks?.filter((s: any) => s.completed).length ?? 0,
      }))
      setTasks(mapped)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTasks()

    const channel = supabase
      .channel('task_board_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_tasks' }, () => {
        fetchTasks()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_task_subtasks' }, () => {
        fetchTasks()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchTasks])

  const moveTask = useCallback(async (taskId: string, newColumn: ColumnId) => {
    setTasks(prev => prev.map(t => t.id === taskId
      ? { ...t, column_id: newColumn, blocked_since: newColumn === 'blocked' ? new Date().toISOString() : undefined }
      : t
    ))

    await supabase
      .from('project_tasks')
      .update({
        column_id: newColumn,
        blocked_since: newColumn === 'blocked' ? new Date().toISOString() : null,
        thomaz_notified: false,
      })
      .eq('id', taskId)
  }, [])

  const createTask = useCallback(async (payload: Partial<Task>) => {
    const colTasks = tasks.filter(t => t.column_id === (payload.column_id || 'todo'))
    const position = colTasks.length

    const { data, error } = await supabase
      .from('project_tasks')
      .insert({ ...payload, position, tags: payload.tags || [] })
      .select()
      .single()

    if (!error && data) {
      setTasks(prev => [...prev, { ...data, tags: data.tags || [], subtasks_total: 0, subtasks_done: 0 }])
    }
    return error
  }, [tasks])

  const updateTask = useCallback(async (taskId: string, payload: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...payload } : t))
    await supabase.from('project_tasks').update(payload).eq('id', taskId)
  }, [])

  const deleteTask = useCallback(async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId))
    await supabase.from('project_tasks').delete().eq('id', taskId)
  }, [])

  return { tasks, loading, moveTask, createTask, updateTask, deleteTask, refetch: fetchTasks }
}

export function useTaskDetail(taskId: string | null) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [task, setTask] = useState<Task | null>(null)

  useEffect(() => {
    if (!taskId) { setSubtasks([]); setComments([]); setTask(null); return }

    const fetchDetail = async () => {
      const [{ data: t }, { data: s }, { data: c }] = await Promise.all([
        supabase.from('project_tasks').select('*').eq('id', taskId).single(),
        supabase.from('project_task_subtasks').select('*').eq('task_id', taskId).order('position'),
        supabase.from('project_task_comments').select('*').eq('task_id', taskId).order('created_at'),
      ])
      if (t) setTask({ ...t, tags: t.tags || [] })
      if (s) setSubtasks(s)
      if (c) setComments(c)
    }

    fetchDetail()
  }, [taskId])

  const toggleSubtask = useCallback(async (subtaskId: string) => {
    const sub = subtasks.find(s => s.id === subtaskId)
    if (!sub) return
    const next = !sub.completed
    setSubtasks(prev => prev.map(s => s.id === subtaskId ? { ...s, completed: next } : s))
    await supabase.from('project_task_subtasks').update({ completed: next }).eq('id', subtaskId)
  }, [subtasks])

  const addSubtask = useCallback(async (title: string) => {
    if (!taskId) return
    const position = subtasks.length
    const { data } = await supabase
      .from('project_task_subtasks')
      .insert({ task_id: taskId, title, position })
      .select().single()
    if (data) setSubtasks(prev => [...prev, data])
  }, [taskId, subtasks])

  const deleteSubtask = useCallback(async (subtaskId: string) => {
    setSubtasks(prev => prev.filter(s => s.id !== subtaskId))
    await supabase.from('project_task_subtasks').delete().eq('id', subtaskId)
  }, [])

  const addComment = useCallback(async (body: string, authorName: string, isThomazMsg = false) => {
    if (!taskId) return
    const { data } = await supabase
      .from('project_task_comments')
      .insert({ task_id: taskId, body, author_name: authorName, is_thomaz: isThomazMsg })
      .select().single()
    if (data) setComments(prev => [...prev, data])
  }, [taskId])

  return { task, subtasks, comments, toggleSubtask, addSubtask, deleteSubtask, addComment, setTask }
}
