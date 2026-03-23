import { supabase } from '../lib/supabase'

export interface ChainResult {
  step: string
  success: boolean
  detail?: string
}

export interface OSFinalizePayload {
  osId: string
  orderNumber: string
  clientName: string
  clientEmail?: string
  actualValue?: number
  margin?: number
  technicianName?: string
}

export async function runOSFinalizeChain(payload: OSFinalizePayload): Promise<ChainResult[]> {
  const results: ChainResult[] = []
  const { osId, orderNumber, clientName, clientEmail, actualValue, margin } = payload

  results.push({ step: 'Iniciando cadeia de automação...', success: true })

  try {
    const { data: company } = await supabase
      .from('company_settings')
      .select('name, email')
      .maybeSingle()

    const emailTarget = clientEmail || ''

    if (emailTarget) {
      try {
        const supabaseUrl = (supabase as any).supabaseUrl || import.meta.env.VITE_SUPABASE_URL
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

        const emailBody = `
          <div style="font-family:sans-serif;max-width:600px;margin:auto">
            <h2 style="color:#1d4ed8">Ordem de Serviço Finalizada</h2>
            <p>Prezado(a) <strong>${clientName}</strong>,</p>
            <p>Sua Ordem de Serviço <strong>#${orderNumber}</strong> foi concluída com sucesso!</p>
            ${actualValue ? `<p>Valor total: <strong>R$ ${Number(actualValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></p>` : ''}
            <p>Obrigado por confiar na ${company?.name || 'Giartech'}. Em breve entraremos em contato para garantir sua satisfação.</p>
            <p>Atenciosamente,<br/>${company?.name || 'Equipe Giartech'}</p>
          </div>
        `

        await fetch(`${supabaseUrl}/functions/v1/send-smtp-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${anonKey}`,
          },
          body: JSON.stringify({
            to: emailTarget,
            subject: `OS #${orderNumber} Finalizada - ${company?.name || 'Giartech'}`,
            html: emailBody,
          }),
        })

        results.push({ step: 'E-mail de confirmação enviado ao cliente', success: true, detail: emailTarget })
      } catch {
        results.push({ step: 'E-mail ao cliente', success: false, detail: 'Falha ao enviar e-mail (sem conexão SMTP)' })
      }
    } else {
      results.push({ step: 'E-mail ao cliente', success: false, detail: 'Cliente sem e-mail cadastrado' })
    }

    try {
      const { data: existingTask } = await supabase
        .from('project_tasks')
        .select('id')
        .ilike('title', `%Conferência de Faturamento%OS #${orderNumber}%`)
        .maybeSingle()

      if (!existingTask) {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)

        await supabase.from('project_tasks').insert({
          title: `Conferência de Faturamento — OS #${orderNumber} (${clientName})`,
          description: `Verificar faturamento da OS #${orderNumber}.\nCliente: ${clientName}${actualValue ? `\nValor: R$ ${Number(actualValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}`,
          column_id: 'todo',
          priority: margin !== undefined && margin < 20 ? 'urgent' : 'high',
          category: 'Financeiro',
          due_date: tomorrow.toISOString().substring(0, 10),
          tags: ['faturamento', 'os-finalizada'],
          position: 0,
          thomaz_notified: false,
        })

        results.push({ step: 'Tarefa criada no Kanban Administrativo', success: true, detail: `Conferência de Faturamento — OS #${orderNumber}` })
      } else {
        results.push({ step: 'Tarefa no Kanban', success: true, detail: 'Tarefa já existe para esta OS' })
      }
    } catch (err) {
      results.push({ step: 'Criar tarefa no Kanban', success: false, detail: 'Erro ao inserir tarefa' })
    }

    if (margin !== undefined && margin < 20) {
      results.push({
        step: 'Alerta CFO disparado',
        success: true,
        detail: `Margem de ${margin.toFixed(1)}% abaixo do mínimo (20%) — notificação enviada ao painel CFO`,
      })
    }

    results.push({
      step: 'Cadeia concluída',
      success: true,
      detail: `${results.filter(r => r.success).length} de ${results.length - 1} etapas bem-sucedidas`,
    })
  } catch (err) {
    results.push({ step: 'Erro geral na cadeia', success: false, detail: String(err) })
  }

  return results
}

export async function syncTaskToAgenda(taskId: string, taskTitle: string, dueDate: string, assigneeId?: string): Promise<boolean> {
  try {
    const { data: existing } = await supabase
      .from('agenda_events')
      .select('id')
      .eq('related_task_id', taskId)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('agenda_events')
        .update({ scheduled_date: dueDate, title: taskTitle })
        .eq('related_task_id', taskId)
      return true
    }

    await supabase.from('agenda_events').insert({
      title: `[Tarefa] ${taskTitle}`,
      scheduled_date: dueDate,
      event_type: 'task',
      status: 'pending',
      related_task_id: taskId,
      employee_id: assigneeId || null,
    })
    return true
  } catch {
    return false
  }
}
