/**
 * Document Email Service
 *
 * Serviço para envio de documentos por email
 * com tracking e registro no banco
 */

import { supabase } from '../lib/supabase'

export interface SendDocumentEmailParams {
  serviceOrderId: string
  versionId?: string
  recipientEmail: string
  recipientName?: string
  documentType: 'budget' | 'proposal' | 'order' | 'invoice'
  versionNumber?: number
  subject?: string
  body?: string
  attachmentUrl?: string
  attachmentBase64?: string
  attachmentFilename?: string
}

export interface EmailResponse {
  success: boolean
  messageId?: string
  error?: string
  emailRecordId?: string
}

/**
 * Enviar documento por email
 */
export const sendDocumentEmail = async (
  params: SendDocumentEmailParams
): Promise<EmailResponse> => {
  try {
    // 1. Registrar envio no banco (status: pending)
    const { data: emailRecord, error: recordError } = await supabase
      .from('document_emails')
      .insert([{
        service_order_id: params.serviceOrderId,
        version_id: params.versionId || null,
        recipient_email: params.recipientEmail,
        recipient_name: params.recipientName || null,
        email_subject: params.subject || `Documento #${params.serviceOrderId}`,
        email_body: params.body || '',
        document_type: params.documentType,
        version_number: params.versionNumber || 1,
        attachment_url: params.attachmentUrl || null,
        status: 'pending',
        provider: 'smtp'
      }])
      .select()
      .single()

    if (recordError) throw recordError

    // 2. Chamar edge function de envio
    const { data: emailResponse, error: sendError } = await supabase.functions.invoke('send-email', {
      body: {
        to: params.recipientEmail,
        subject: params.subject || `Documento #${params.serviceOrderId}`,
        html: generateEmailHTML(params),
        attachments: params.attachmentBase64 ? [{
          filename: params.attachmentFilename || 'documento.pdf',
          content: params.attachmentBase64,
          encoding: 'base64'
        }] : undefined
      }
    })

    // 3. Atualizar registro com resultado
    if (sendError) {
      // Falhou
      await supabase
        .from('document_emails')
        .update({
          status: 'failed',
          error_message: sendError.message,
          error_details: { error: sendError }
        })
        .eq('id', emailRecord.id)

      return {
        success: false,
        error: sendError.message,
        emailRecordId: emailRecord.id
      }
    } else {
      // Sucesso
      await supabase
        .from('document_emails')
        .update({
          status: 'sent',
          message_id: emailResponse?.messageId || null,
          sent_at: new Date().toISOString()
        })
        .eq('id', emailRecord.id)

      return {
        success: true,
        messageId: emailResponse?.messageId,
        emailRecordId: emailRecord.id
      }
    }
  } catch (error: any) {
    console.error('Erro ao enviar email:', error)
    return {
      success: false,
      error: error.message || 'Erro desconhecido ao enviar email'
    }
  }
}

/**
 * Gerar HTML do email
 */
const generateEmailHTML = (params: SendDocumentEmailParams): string => {
  const documentTypeLabels: Record<string, string> = {
    budget: 'Orçamento',
    proposal: 'Proposta Comercial',
    order: 'Ordem de Serviço',
    invoice: 'Nota Fiscal'
  }

  const docLabel = documentTypeLabels[params.documentType] || 'Documento'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #0F567D 0%, #1976D2 100%);
      color: white;
      padding: 30px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      background: white;
      padding: 30px;
      border: 1px solid #e0e0e0;
      border-top: none;
    }
    .footer {
      background: #f5f5f5;
      padding: 20px;
      border-radius: 0 0 8px 8px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    .button {
      display: inline-block;
      background: #0F567D;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .info-box {
      background: #f0f7ff;
      border-left: 4px solid #0F567D;
      padding: 15px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Giartech Soluções</h1>
    <p>Excelência em Serviços Técnicos</p>
  </div>

  <div class="content">
    <h2>Olá${params.recipientName ? ', ' + params.recipientName : ''}!</h2>

    <p>
      ${params.body || `
        Segue em anexo o ${docLabel.toLowerCase()} solicitado.
      `}
    </p>

    <div class="info-box">
      <strong>Detalhes do Documento:</strong><br>
      Tipo: ${docLabel}<br>
      ${params.versionNumber ? `Versão: ${params.versionNumber}<br>` : ''}
      Data: ${new Date().toLocaleDateString('pt-BR')}
    </div>

    <p>
      O documento está anexado a este email em formato PDF.
    </p>

    <p>
      Em caso de dúvidas, entre em contato conosco através dos canais abaixo.
    </p>

    <p style="margin-top: 30px;">
      Atenciosamente,<br>
      <strong>Equipe Giartech</strong>
    </p>
  </div>

  <div class="footer">
    <p>
      <strong>Giartech Soluções</strong><br>
      Telefone: (11) 1234-5678<br>
      Email: contato@giartech.com.br<br>
      Website: www.giartech.com.br
    </p>
    <p style="margin-top: 15px; font-size: 11px;">
      Este é um email automático. Por favor, não responda a este endereço.
    </p>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Buscar histórico de emails de uma OS
 */
export const getOrderEmailHistory = async (serviceOrderId: string) => {
  try {
    const { data, error } = await supabase
      .from('document_emails')
      .select('*')
      .eq('service_order_id', serviceOrderId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, emails: data }
  } catch (error: any) {
    console.error('Erro ao buscar histórico de emails:', error)
    return { success: false, error: error.message, emails: [] }
  }
}

/**
 * Marcar email como aberto (webhook do provider)
 */
export const markEmailAsOpened = async (emailId: string) => {
  try {
    const { error } = await supabase
      .from('document_emails')
      .update({
        status: 'opened',
        opened_at: new Date().toISOString()
      })
      .eq('id', emailId)

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    console.error('Erro ao marcar email como aberto:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Reenviar email
 */
export const resendEmail = async (emailId: string) => {
  try {
    // Buscar dados do email original
    const { data: originalEmail, error: fetchError } = await supabase
      .from('document_emails')
      .select('*')
      .eq('id', emailId)
      .single()

    if (fetchError) throw fetchError

    // Reenviar com os mesmos dados
    return await sendDocumentEmail({
      serviceOrderId: originalEmail.service_order_id,
      versionId: originalEmail.version_id,
      recipientEmail: originalEmail.recipient_email,
      recipientName: originalEmail.recipient_name,
      documentType: originalEmail.document_type,
      versionNumber: originalEmail.version_number,
      subject: originalEmail.email_subject,
      body: originalEmail.email_body,
      attachmentUrl: originalEmail.attachment_url
    })
  } catch (error: any) {
    console.error('Erro ao reenviar email:', error)
    return { success: false, error: error.message }
  }
}

export default {
  sendDocumentEmail,
  getOrderEmailHistory,
  markEmailAsOpened,
  resendEmail
}
