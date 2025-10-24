import { supabase } from '../lib/supabase'

interface WhatsAppMessageData {
  serviceOrderId: string
  recipientPhone: string
  recipientName: string
  templateId?: string
  variables?: Record<string, string>
  customMessage?: string
}

export class WhatsAppService {
  static async sendMessage(data: WhatsAppMessageData): Promise<boolean> {
    try {
      let messageText = data.customMessage || ''

      if (data.templateId) {
        const { data: template, error: templateError } = await supabase
          .from('whatsapp_message_templates')
          .select('*')
          .eq('id', data.templateId)
          .single()

        if (templateError) throw templateError

        messageText = template.message_text

        if (data.variables) {
          Object.entries(data.variables).forEach(([key, value]) => {
            messageText = messageText.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
          })
        }

        await supabase
          .from('whatsapp_message_templates')
          .update({ usage_count: template.usage_count + 1 })
          .eq('id', template.id)
      }

      const { error: logError } = await supabase
        .from('whatsapp_message_log')
        .insert({
          service_order_id: data.serviceOrderId,
          template_id: data.templateId || null,
          recipient_phone: data.recipientPhone,
          recipient_name: data.recipientName,
          message_text: messageText,
          status: 'pending'
        })

      if (logError) throw logError

      const phone = data.recipientPhone.replace(/\D/g, '')
      const encodedMessage = encodeURIComponent(messageText)
      const whatsappUrl = `https://wa.me/55${phone}?text=${encodedMessage}`

      window.open(whatsappUrl, '_blank')

      return true
    } catch (error) {
      console.error('Erro ao enviar mensagem WhatsApp:', error)
      return false
    }
  }

  static async getTemplates(category?: string) {
    try {
      let query = supabase
        .from('whatsapp_message_templates')
        .select('*')
        .eq('is_active', true)

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error } = await query.order('usage_count', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar templates:', error)
      return []
    }
  }

  static async sendOSCreatedNotification(serviceOrder: any, customer: any) {
    const templates = await this.getTemplates('abertura')
    if (templates.length === 0) return false

    return this.sendMessage({
      serviceOrderId: serviceOrder.id,
      recipientPhone: customer.telefone || customer.celular,
      recipientName: customer.nome_razao,
      templateId: templates[0].id,
      variables: {
        cliente_nome: customer.nome_razao,
        os_numero: serviceOrder.order_number,
        descricao: serviceOrder.description,
        data_agendamento: new Date(serviceOrder.scheduled_at).toLocaleDateString('pt-BR'),
        prazo_execucao: String(serviceOrder.prazo_execucao_dias || 15)
      }
    })
  }

  static async sendOSCompletedNotification(serviceOrder: any, customer: any) {
    const templates = await this.getTemplates('conclusao')
    if (templates.length === 0) return false

    return this.sendMessage({
      serviceOrderId: serviceOrder.id,
      recipientPhone: customer.telefone || customer.celular,
      recipientName: customer.nome_razao,
      templateId: templates[0].id,
      variables: {
        cliente_nome: customer.nome_razao,
        os_numero: serviceOrder.order_number,
        valor_total: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(serviceOrder.total_value || 0),
        garantia: `${serviceOrder.warranty_period || 90} dias`
      }
    })
  }

  static async sendApprovalRequest(serviceOrder: any, customer: any) {
    const templates = await this.getTemplates('aprovacao')
    if (templates.length === 0) return false

    return this.sendMessage({
      serviceOrderId: serviceOrder.id,
      recipientPhone: customer.telefone || customer.celular,
      recipientName: customer.nome_razao,
      templateId: templates[0].id,
      variables: {
        cliente_nome: customer.nome_razao,
        os_numero: serviceOrder.order_number,
        valor_total: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(serviceOrder.total_value || 0),
        prazo: String(serviceOrder.prazo_execucao_dias || 15),
        lista_servicos: 'Ver orçamento completo no link'
      }
    })
  }

  static async getMessageHistory(serviceOrderId: string) {
    try {
      const { data, error } = await supabase
        .from('whatsapp_message_log')
        .select('*')
        .eq('service_order_id', serviceOrderId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar histórico:', error)
      return []
    }
  }
}

export default WhatsAppService
