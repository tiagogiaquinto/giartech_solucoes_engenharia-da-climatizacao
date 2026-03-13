import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Save, X, Eye, Download, Printer, FileText, Bold, Italic, Underline, ChevronLeft as AlignLeft, AlignCenter as AlignCenter, Highlighter as AlignRight, AlignJustify as AlignJustify, List, ListOrdered, Image as ImageIcon, Table as TableIcon, Link as LinkIcon, Undo, Redo, Copy, Sparkles, Palette, PanelRightOpen, PanelRightClose, Heading1, Heading2, Heading3, Quote, Minus, ZoomIn, ZoomOut, Strikethrough, Subscript, Superscript, Eraser, RotateCcw, Type, Paintbrush, Columns as Columns, LayoutGrid as Layout, PenTool as FileSignature, Highlighter, Layers, Code } from 'lucide-react'
import { supabase } from '../lib/supabase'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { useToast } from '../hooks/useToast'

interface AdvancedDocumentEditorProProps {
  document?: any
  template?: any
  onClose: () => void
  onSave: () => void
  mode: 'create' | 'edit' | 'view'
}

interface TextFormat {
  bold: boolean
  italic: boolean
  underline: boolean
  strikethrough: boolean
  fontSize: number
  fontFamily: string
  color: string
  backgroundColor: string
  align: 'left' | 'center' | 'right' | 'justify'
  lineHeight: number
  letterSpacing: number
}

const fontFamilies = [
  { value: 'Inter', label: 'Inter (Sans-serif)', category: 'modern' },
  { value: 'Roboto', label: 'Roboto (Sans-serif)', category: 'modern' },
  { value: 'Open Sans', label: 'Open Sans', category: 'modern' },
  { value: 'Lato', label: 'Lato', category: 'modern' },
  { value: 'Montserrat', label: 'Montserrat', category: 'modern' },
  { value: 'Poppins', label: 'Poppins', category: 'modern' },
  { value: 'Raleway', label: 'Raleway', category: 'modern' },
  { value: 'Source Sans 3', label: 'Source Sans', category: 'modern' },
  { value: 'Nunito', label: 'Nunito', category: 'modern' },
  { value: 'Rubik', label: 'Rubik', category: 'modern' },
  { value: 'Playfair Display', label: 'Playfair Display (Serif)', category: 'elegant' },
  { value: 'Merriweather', label: 'Merriweather (Serif)', category: 'elegant' },
  { value: 'Libre Baskerville', label: 'Libre Baskerville', category: 'elegant' },
  { value: 'Crimson Text', label: 'Crimson Text', category: 'elegant' },
  { value: 'PT Serif', label: 'PT Serif', category: 'elegant' },
  { value: 'Georgia', label: 'Georgia (Serif)', category: 'classic' },
  { value: 'Times New Roman', label: 'Times New Roman', category: 'classic' },
  { value: 'Arial', label: 'Arial', category: 'classic' },
  { value: 'Courier New', label: 'Courier (Mono)', category: 'mono' },
]

const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 36, 40, 48, 56, 64, 72]

const colorPresets = [
  { name: 'Preto', color: '#000000' },
  { name: 'Cinza Escuro', color: '#374151' },
  { name: 'Cinza', color: '#6b7280' },
  { name: 'Azul', color: '#3b82f6' },
  { name: 'Azul Escuro', color: '#1e40af' },
  { name: 'Verde', color: '#10b981' },
  { name: 'Verde Escuro', color: '#059669' },
  { name: 'Vermelho', color: '#ef4444' },
  { name: 'Laranja', color: '#f97316' },
  { name: 'Amarelo', color: '#eab308' },
  { name: 'Roxo', color: '#8b5cf6' },
  { name: 'Rosa', color: '#ec4899' },
]

const highlightColors = [
  { name: 'Amarelo', color: '#fef08a' },
  { name: 'Verde', color: '#bbf7d0' },
  { name: 'Azul', color: '#bfdbfe' },
  { name: 'Rosa', color: '#fbcfe8' },
  { name: 'Laranja', color: '#fed7aa' },
  { name: 'Roxo', color: '#ddd6fe' },
]

export default function AdvancedDocumentEditorPro({
  document,
  template,
  onClose,
  onSave,
  mode: initialMode
}: AdvancedDocumentEditorProProps) {
  const [mode, setMode] = useState(initialMode)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [rawContent, setRawContent] = useState('')
  const [previewMode, setPreviewMode] = useState<'split' | 'preview' | 'edit'>('split')
  const [saving, setSaving] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [showToolbar, setShowToolbar] = useState(true)
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [selectedFormat, setSelectedFormat] = useState<TextFormat>({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#000000',
    backgroundColor: 'transparent',
    align: 'left',
    lineHeight: 1.6,
    letterSpacing: 0
  })
  const [showFontPicker, setShowFontPicker] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showHighlightPicker, setShowHighlightPicker] = useState(false)
  const [showInsertMenu, setShowInsertMenu] = useState(false)

  const editorRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const { showToast } = useToast()

  useEffect(() => {
    if (document) {
      loadDocument()
    } else if (template) {
      loadTemplate()
    }
  }, [document, template])

  const loadDocument = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', document.id)
        .single()

      if (error) throw error

      setTitle(data.title || '')
      setContent(data.content || '')
      setRawContent(data.content || '')
      addToHistory(data.content || '')
    } catch (error) {
      console.error('Error loading document:', error)
      showToast('Erro ao carregar documento', 'error')
    }
  }

  const loadTemplate = async () => {
    try {
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('id', template.id)
        .single()

      if (error) throw error

      setTitle(data.name || '')
      setContent(data.content_template || '')
      setRawContent(data.content_template || '')
      addToHistory(data.content_template || '')
    } catch (error) {
      console.error('Error loading template:', error)
      showToast('Erro ao carregar template', 'error')
    }
  }

  const addToHistory = (newContent: string) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newContent)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const handleContentChange = (newContent: string) => {
    setRawContent(newContent)
    setContent(newContent)
    addToHistory(newContent)
  }

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      const previousContent = history[newIndex]
      setContent(previousContent)
      setRawContent(previousContent)
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      const nextContent = history[newIndex]
      setContent(nextContent)
      setRawContent(nextContent)
    }
  }

  const applyFormat = (format: string, value?: any) => {
    if (!editorRef.current) return

    document.execCommand('styleWithCSS', false, 'true')

    switch (format) {
      case 'bold':
        document.execCommand('bold', false)
        setSelectedFormat({ ...selectedFormat, bold: !selectedFormat.bold })
        break
      case 'italic':
        document.execCommand('italic', false)
        setSelectedFormat({ ...selectedFormat, italic: !selectedFormat.italic })
        break
      case 'underline':
        document.execCommand('underline', false)
        setSelectedFormat({ ...selectedFormat, underline: !selectedFormat.underline })
        break
      case 'strikethrough':
        document.execCommand('strikeThrough', false)
        setSelectedFormat({ ...selectedFormat, strikethrough: !selectedFormat.strikethrough })
        break
      case 'subscript':
        document.execCommand('subscript', false)
        break
      case 'superscript':
        document.execCommand('superscript', false)
        break
      case 'removeFormat':
        document.execCommand('removeFormat', false)
        break
      case 'alignLeft':
        document.execCommand('justifyLeft', false)
        setSelectedFormat({ ...selectedFormat, align: 'left' })
        break
      case 'alignCenter':
        document.execCommand('justifyCenter', false)
        setSelectedFormat({ ...selectedFormat, align: 'center' })
        break
      case 'alignRight':
        document.execCommand('justifyRight', false)
        setSelectedFormat({ ...selectedFormat, align: 'right' })
        break
      case 'alignJustify':
        document.execCommand('justifyFull', false)
        setSelectedFormat({ ...selectedFormat, align: 'justify' })
        break
      case 'fontSize':
        document.execCommand('fontSize', false, '7')
        const fontElements = editorRef.current.getElementsByTagName('font')
        for (let i = 0; i < fontElements.length; i++) {
          if (fontElements[i].size === '7') {
            fontElements[i].removeAttribute('size')
            fontElements[i].style.fontSize = `${value}px`
          }
        }
        setSelectedFormat({ ...selectedFormat, fontSize: value })
        break
      case 'fontFamily':
        document.execCommand('fontName', false, value)
        setSelectedFormat({ ...selectedFormat, fontFamily: value })
        setShowFontPicker(false)
        break
      case 'color':
        document.execCommand('foreColor', false, value)
        setSelectedFormat({ ...selectedFormat, color: value })
        setShowColorPicker(false)
        break
      case 'highlight':
        document.execCommand('hiliteColor', false, value)
        setSelectedFormat({ ...selectedFormat, backgroundColor: value })
        setShowHighlightPicker(false)
        break
      case 'insertOrderedList':
        document.execCommand('insertOrderedList', false)
        break
      case 'insertUnorderedList':
        document.execCommand('insertUnorderedList', false)
        break
      case 'indent':
        document.execCommand('indent', false)
        break
      case 'outdent':
        document.execCommand('outdent', false)
        break
    }

    if (editorRef.current) {
      handleContentChange(editorRef.current.innerHTML)
    }
  }

  const insertElement = (type: string) => {
    if (!editorRef.current) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    let html = ''
    const range = selection.getRangeAt(0)

    switch (type) {
      case 'heading1':
        html = '<h1 style="font-size: 32px; font-weight: 700; margin: 20px 0 12px 0; line-height: 1.2;">Título Principal</h1>'
        break
      case 'heading2':
        html = '<h2 style="font-size: 24px; font-weight: 600; margin: 18px 0 10px 0; line-height: 1.3;">Subtítulo</h2>'
        break
      case 'heading3':
        html = '<h3 style="font-size: 20px; font-weight: 600; margin: 16px 0 8px 0; line-height: 1.4;">Seção</h3>'
        break
      case 'paragraph':
        html = '<p style="margin: 10px 0; line-height: 1.6;">Novo parágrafo de texto com formatação padrão.</p>'
        break
      case 'table':
        html = `
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
            <thead>
              <tr style="background: linear-gradient(to right, #3b82f6, #1e40af);">
                <th style="border: 1px solid #d1d5db; padding: 12px; color: white; text-align: left; font-weight: 600;">Coluna 1</th>
                <th style="border: 1px solid #d1d5db; padding: 12px; color: white; text-align: left; font-weight: 600;">Coluna 2</th>
                <th style="border: 1px solid #d1d5db; padding: 12px; color: white; text-align: left; font-weight: 600;">Coluna 3</th>
              </tr>
            </thead>
            <tbody>
              <tr style="background-color: #f9fafb;">
                <td style="border: 1px solid #d1d5db; padding: 10px;">Dados</td>
                <td style="border: 1px solid #d1d5db; padding: 10px;">Dados</td>
                <td style="border: 1px solid #d1d5db; padding: 10px;">Dados</td>
              </tr>
              <tr style="background-color: white;">
                <td style="border: 1px solid #d1d5db; padding: 10px;">Dados</td>
                <td style="border: 1px solid #d1d5db; padding: 10px;">Dados</td>
                <td style="border: 1px solid #d1d5db; padding: 10px;">Dados</td>
              </tr>
            </tbody>
          </table>
        `
        break
      case 'divider':
        html = '<hr style="border: none; border-top: 3px solid #e5e7eb; margin: 30px 0; border-radius: 2px;" />'
        break
      case 'quote':
        html = '<blockquote style="border-left: 5px solid #3b82f6; padding: 15px 20px; margin: 20px 0; background-color: #f3f4f6; color: #374151; font-style: italic; border-radius: 4px;">Digite sua citação aqui...</blockquote>'
        break
      case 'code':
        html = '<pre style="background-color: #1f2937; color: #e5e7eb; padding: 16px; border-radius: 8px; overflow-x: auto; font-family: \'Courier New\', monospace; font-size: 13px; line-height: 1.5; margin: 20px 0;"><code>// Digite seu código aqui\nfunction exemplo() {\n  return "código";\n}</code></pre>'
        break
      case 'callout':
        html = '<div style="background: linear-gradient(to right, #dbeafe, #bfdbfe); border-left: 4px solid #3b82f6; padding: 16px 20px; margin: 20px 0; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"><strong style="color: #1e40af;">💡 Destaque:</strong> <span style="color: #1e3a8a;">Informação importante ou nota.</span></div>'
        break
      case 'warning':
        html = '<div style="background: linear-gradient(to right, #fef3c7, #fde68a); border-left: 4px solid #f59e0b; padding: 16px 20px; margin: 20px 0; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"><strong style="color: #92400e;">⚠️ Atenção:</strong> <span style="color: #78350f;">Mensagem de alerta ou aviso.</span></div>'
        break
      case 'success':
        html = '<div style="background: linear-gradient(to right, #d1fae5, #a7f3d0); border-left: 4px solid #10b981; padding: 16px 20px; margin: 20px 0; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"><strong style="color: #065f46;">✓ Sucesso:</strong> <span style="color: #064e3b;">Mensagem de confirmação.</span></div>'
        break
      case 'twoColumns':
        html = `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
            <div style="padding: 15px; background-color: #f9fafb; border-radius: 8px;">
              <h4 style="margin: 0 0 10px 0; color: #1f2937;">Coluna 1</h4>
              <p style="margin: 0; color: #6b7280;">Conteúdo da primeira coluna</p>
            </div>
            <div style="padding: 15px; background-color: #f9fafb; border-radius: 8px;">
              <h4 style="margin: 0 0 10px 0; color: #1f2937;">Coluna 2</h4>
              <p style="margin: 0; color: #6b7280;">Conteúdo da segunda coluna</p>
            </div>
          </div>
        `
        break
      case 'signature':
        html = `
          <div style="margin: 40px 0 20px 0; border-top: 2px solid #e5e7eb; padding-top: 20px;">
            <div style="margin-bottom: 40px;">
              <div style="border-bottom: 2px solid #000; width: 300px; margin-bottom: 8px;"></div>
              <p style="margin: 0; font-size: 14px; color: #6b7280;">Assinatura / Nome Completo</p>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #9ca3af;">Data: ____/____/________</p>
            </div>
          </div>
        `
        break
    }

    if (html) {
      range.deleteContents()
      const fragment = range.createContextualFragment(html)
      range.insertNode(fragment)
      handleContentChange(editorRef.current.innerHTML)
      setShowInsertMenu(false)
    }
  }

  const insertVariable = (variable: string) => {
    if (!editorRef.current) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      editorRef.current.innerHTML += `<span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 3px 8px; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 13px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">{${variable}}</span>&nbsp;`
    } else {
      const range = selection.getRangeAt(0)
      const span = document.createElement('span')
      span.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      span.style.color = 'white'
      span.style.padding = '3px 8px'
      span.style.borderRadius = '6px'
      span.style.fontFamily = '"Courier New", monospace'
      span.style.fontSize = '13px'
      span.style.fontWeight = '600'
      span.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)'
      span.textContent = `{${variable}}`
      range.deleteContents()
      range.insertNode(span)

      const space = document.createTextNode('\u00A0')
      range.collapse(false)
      range.insertNode(space)
    }

    handleContentChange(editorRef.current.innerHTML)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (document) {
        const { error } = await supabase
          .from('documents')
          .update({
            title,
            content: rawContent,
            updated_at: new Date().toISOString()
          })
          .eq('id', document.id)

        if (error) throw error
      } else if (template) {
        const { error } = await supabase
          .from('document_templates')
          .update({
            name: title,
            content_template: rawContent,
            updated_at: new Date().toISOString()
          })
          .eq('id', template.id)

        if (error) throw error
      }

      showToast('Documento salvo com sucesso', 'success')
      onSave()
    } catch (error) {
      console.error('Error saving:', error)
      showToast('Erro ao salvar documento', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleExportPDF = async () => {
    if (!previewRef.current) return

    try {
      showToast('Gerando PDF...', 'info')

      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth * ratio, imgHeight * ratio)
      pdf.save(`${title || 'documento'}.pdf`)

      showToast('PDF gerado com sucesso', 'success')
    } catch (error) {
      console.error('Error generating PDF:', error)
      showToast('Erro ao gerar PDF', 'error')
    }
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title || 'Documento'}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&family=Open+Sans:wght@300;400;600;700&family=Lato:wght@300;400;700&family=Montserrat:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&family=Raleway:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&family=Merriweather:wght@300;400;700&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'Inter', Arial, sans-serif;
              padding: 40px;
              max-width: 210mm;
              margin: 0 auto;
              background: white;
            }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const commonVariables = [
    'cliente_nome',
    'cliente_cpf_cnpj',
    'cliente_email',
    'cliente_telefone',
    'cliente_endereco',
    'cliente_cidade',
    'cliente_estado',
    'empresa_nome',
    'empresa_cnpj',
    'empresa_endereco',
    'empresa_telefone',
    'empresa_email',
    'data_atual',
    'data_vencimento',
    'numero_documento',
    'valor_total',
    'valor_desconto',
    'valor_liquido',
    'forma_pagamento',
    'observacoes'
  ]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-[98vw] h-[95vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6" />
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título do documento"
                className="bg-white/10 text-white placeholder-white/60 px-3 py-1 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 text-lg font-semibold w-96"
              />
              <div className="text-xs text-white/70 mt-1 flex items-center gap-2">
                <Layers className="w-3 h-3" />
                Editor Profissional com {fontFamilies.length} Fontes
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowToolbar(!showToolbar)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Mostrar/Ocultar Toolbar"
            >
              {showToolbar ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              title="Desfazer"
            >
              <Undo className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              title="Refazer"
            >
              <Redo className="w-5 h-5" />
            </motion.button>

            <div className="w-px h-6 bg-white/20" />

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrint}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Imprimir"
            >
              <Printer className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExportPDF}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Exportar PDF"
            >
              <Download className="w-5 h-5" />
            </motion.button>

            <div className="w-px h-6 bg-white/20" />

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors disabled:opacity-50 shadow-lg"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Toolbar */}
        <AnimatePresence>
          {showToolbar && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b bg-gradient-to-r from-gray-50 to-gray-100 overflow-hidden"
            >
              <div className="px-6 py-4">
                {/* Row 1: View Mode & Basic Formatting */}
                <div className="flex items-center gap-4 flex-wrap mb-3">
                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-1 bg-white rounded-lg p-1 border shadow-sm">
                    <button
                      onClick={() => setPreviewMode('edit')}
                      className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                        previewMode === 'edit' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Editor
                    </button>
                    <button
                      onClick={() => setPreviewMode('split')}
                      className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                        previewMode === 'split' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Dividido
                    </button>
                    <button
                      onClick={() => setPreviewMode('preview')}
                      className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                        previewMode === 'preview' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Preview
                    </button>
                  </div>

                  <div className="w-px h-8 bg-gray-300" />

                  {/* Font Family Selector */}
                  <div className="relative">
                    <button
                      onClick={() => setShowFontPicker(!showFontPicker)}
                      className="px-4 py-2 bg-white border rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
                      style={{ fontFamily: selectedFormat.fontFamily }}
                    >
                      <Type className="w-4 h-4" />
                      {selectedFormat.fontFamily}
                    </button>
                    {showFontPicker && (
                      <div className="absolute top-full left-0 mt-2 bg-white border rounded-lg shadow-xl p-3 w-80 max-h-96 overflow-y-auto z-50">
                        <div className="text-xs font-semibold text-gray-500 mb-2 px-2">Fontes Modernas</div>
                        {fontFamilies.filter(f => f.category === 'modern').map((font) => (
                          <button
                            key={font.value}
                            onClick={() => applyFormat('fontFamily', font.value)}
                            className="w-full text-left px-3 py-2.5 rounded hover:bg-blue-50 text-sm transition-colors border-b border-gray-100 last:border-0"
                            style={{ fontFamily: font.value }}
                          >
                            {font.label}
                          </button>
                        ))}
                        <div className="text-xs font-semibold text-gray-500 mb-2 mt-3 px-2">Fontes Elegantes</div>
                        {fontFamilies.filter(f => f.category === 'elegant').map((font) => (
                          <button
                            key={font.value}
                            onClick={() => applyFormat('fontFamily', font.value)}
                            className="w-full text-left px-3 py-2.5 rounded hover:bg-blue-50 text-sm transition-colors border-b border-gray-100 last:border-0"
                            style={{ fontFamily: font.value }}
                          >
                            {font.label}
                          </button>
                        ))}
                        <div className="text-xs font-semibold text-gray-500 mb-2 mt-3 px-2">Fontes Clássicas</div>
                        {fontFamilies.filter(f => f.category === 'classic').map((font) => (
                          <button
                            key={font.value}
                            onClick={() => applyFormat('fontFamily', font.value)}
                            className="w-full text-left px-3 py-2.5 rounded hover:bg-blue-50 text-sm transition-colors border-b border-gray-100 last:border-0"
                            style={{ fontFamily: font.value }}
                          >
                            {font.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Font Size */}
                  <select
                    value={selectedFormat.fontSize}
                    onChange={(e) => applyFormat('fontSize', parseInt(e.target.value))}
                    className="px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  >
                    {fontSizes.map(size => (
                      <option key={size} value={size}>{size}px</option>
                    ))}
                  </select>

                  <div className="w-px h-8 bg-gray-300" />

                  {/* Text Formatting */}
                  <div className="flex items-center gap-1 bg-white rounded-lg p-1 border shadow-sm">
                    <button
                      onClick={() => applyFormat('bold')}
                      className={`p-2 rounded hover:bg-gray-100 transition-colors ${
                        selectedFormat.bold ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
                      }`}
                      title="Negrito"
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => applyFormat('italic')}
                      className={`p-2 rounded hover:bg-gray-100 transition-colors ${
                        selectedFormat.italic ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
                      }`}
                      title="Itálico"
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => applyFormat('underline')}
                      className={`p-2 rounded hover:bg-gray-100 transition-colors ${
                        selectedFormat.underline ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
                      }`}
                      title="Sublinhado"
                    >
                      <Underline className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => applyFormat('strikethrough')}
                      className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-700"
                      title="Tachado"
                    >
                      <Strikethrough className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1 bg-white rounded-lg p-1 border shadow-sm">
                    <button
                      onClick={() => applyFormat('subscript')}
                      className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-700"
                      title="Subscrito"
                    >
                      <Subscript className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => applyFormat('superscript')}
                      className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-700"
                      title="Sobrescrito"
                    >
                      <Superscript className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => applyFormat('removeFormat')}
                      className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-700"
                      title="Limpar Formatação"
                    >
                      <Eraser className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="w-px h-8 bg-gray-300" />

                  {/* Alignment */}
                  <div className="flex items-center gap-1 bg-white rounded-lg p-1 border shadow-sm">
                    <button
                      onClick={() => applyFormat('alignLeft')}
                      className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-700"
                      title="Alinhar à esquerda"
                    >
                      <AlignLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => applyFormat('alignCenter')}
                      className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-700"
                      title="Centralizar"
                    >
                      <AlignCenter className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => applyFormat('alignRight')}
                      className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-700"
                      title="Alinhar à direita"
                    >
                      <AlignRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => applyFormat('alignJustify')}
                      className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-700"
                      title="Justificar"
                    >
                      <AlignJustify className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="w-px h-8 bg-gray-300" />

                  {/* Lists */}
                  <div className="flex items-center gap-1 bg-white rounded-lg p-1 border shadow-sm">
                    <button
                      onClick={() => applyFormat('insertUnorderedList')}
                      className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-700"
                      title="Lista com marcadores"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => applyFormat('insertOrderedList')}
                      className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-700"
                      title="Lista numerada"
                    >
                      <ListOrdered className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="w-px h-8 bg-gray-300" />

                  {/* Colors */}
                  <div className="relative">
                    <button
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      className="px-3 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
                      title="Cor do texto"
                    >
                      <Palette className="w-4 h-4" />
                      <div className="w-5 h-5 rounded border" style={{ backgroundColor: selectedFormat.color }} />
                    </button>
                    {showColorPicker && (
                      <div className="absolute top-full left-0 mt-2 bg-white border rounded-lg shadow-xl p-3 w-64 z-50">
                        <div className="text-xs font-semibold text-gray-500 mb-2">Cores do Texto</div>
                        <div className="grid grid-cols-6 gap-2 mb-3">
                          {colorPresets.map((preset) => (
                            <button
                              key={preset.name}
                              onClick={() => applyFormat('color', preset.color)}
                              className="w-8 h-8 rounded border-2 border-gray-300 hover:scale-110 transition-transform"
                              style={{ backgroundColor: preset.color }}
                              title={preset.name}
                            />
                          ))}
                        </div>
                        <input
                          type="color"
                          value={selectedFormat.color}
                          onChange={(e) => applyFormat('color', e.target.value)}
                          className="w-full h-10 rounded cursor-pointer"
                        />
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setShowHighlightPicker(!showHighlightPicker)}
                      className="px-3 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
                      title="Destacar texto"
                    >
                      <Highlighter className="w-4 h-4" />
                      <div className="w-5 h-5 rounded border" style={{ backgroundColor: selectedFormat.backgroundColor || '#fef08a' }} />
                    </button>
                    {showHighlightPicker && (
                      <div className="absolute top-full left-0 mt-2 bg-white border rounded-lg shadow-xl p-3 w-56 z-50">
                        <div className="text-xs font-semibold text-gray-500 mb-2">Destacar</div>
                        <div className="grid grid-cols-6 gap-2 mb-3">
                          {highlightColors.map((preset) => (
                            <button
                              key={preset.name}
                              onClick={() => applyFormat('highlight', preset.color)}
                              className="w-8 h-8 rounded border-2 border-gray-300 hover:scale-110 transition-transform"
                              style={{ backgroundColor: preset.color }}
                              title={preset.name}
                            />
                          ))}
                        </div>
                        <button
                          onClick={() => applyFormat('highlight', 'transparent')}
                          className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200"
                        >
                          Remover Destaque
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Row 2: Insert Elements */}
                <div className="flex items-center gap-3 flex-wrap pt-3 border-t">
                  {/* Insert Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setShowInsertMenu(!showInsertMenu)}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2 shadow-md"
                    >
                      <Sparkles className="w-4 h-4" />
                      Inserir Elementos
                    </button>
                    {showInsertMenu && (
                      <div className="absolute top-full left-0 mt-2 bg-white border rounded-lg shadow-xl p-2 w-72 z-50 max-h-96 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-1">
                          <button onClick={() => insertElement('heading1')} className="px-3 py-2 text-left rounded hover:bg-blue-50 text-sm flex items-center gap-2">
                            <Heading1 className="w-4 h-4" /> Título 1
                          </button>
                          <button onClick={() => insertElement('heading2')} className="px-3 py-2 text-left rounded hover:bg-blue-50 text-sm flex items-center gap-2">
                            <Heading2 className="w-4 h-4" /> Título 2
                          </button>
                          <button onClick={() => insertElement('heading3')} className="px-3 py-2 text-left rounded hover:bg-blue-50 text-sm flex items-center gap-2">
                            <Heading3 className="w-4 h-4" /> Título 3
                          </button>
                          <button onClick={() => insertElement('paragraph')} className="px-3 py-2 text-left rounded hover:bg-blue-50 text-sm flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Parágrafo
                          </button>
                          <button onClick={() => insertElement('table')} className="px-3 py-2 text-left rounded hover:bg-blue-50 text-sm flex items-center gap-2">
                            <TableIcon className="w-4 h-4" /> Tabela
                          </button>
                          <button onClick={() => insertElement('quote')} className="px-3 py-2 text-left rounded hover:bg-blue-50 text-sm flex items-center gap-2">
                            <Quote className="w-4 h-4" /> Citação
                          </button>
                          <button onClick={() => insertElement('code')} className="px-3 py-2 text-left rounded hover:bg-blue-50 text-sm flex items-center gap-2">
                            <Code className="w-4 h-4" /> Código
                          </button>
                          <button onClick={() => insertElement('divider')} className="px-3 py-2 text-left rounded hover:bg-blue-50 text-sm flex items-center gap-2">
                            <Minus className="w-4 h-4" /> Divisor
                          </button>
                          <button onClick={() => insertElement('callout')} className="px-3 py-2 text-left rounded hover:bg-blue-50 text-sm flex items-center gap-2">
                            <Paintbrush className="w-4 h-4" /> Destaque
                          </button>
                          <button onClick={() => insertElement('warning')} className="px-3 py-2 text-left rounded hover:bg-blue-50 text-sm flex items-center gap-2">
                            <Paintbrush className="w-4 h-4" /> Aviso
                          </button>
                          <button onClick={() => insertElement('success')} className="px-3 py-2 text-left rounded hover:bg-blue-50 text-sm flex items-center gap-2">
                            <Paintbrush className="w-4 h-4" /> Sucesso
                          </button>
                          <button onClick={() => insertElement('twoColumns')} className="px-3 py-2 text-left rounded hover:bg-blue-50 text-sm flex items-center gap-2">
                            <Columns className="w-4 h-4" /> 2 Colunas
                          </button>
                          <button onClick={() => insertElement('signature')} className="px-3 py-2 text-left rounded hover:bg-blue-50 text-sm flex items-center gap-2 col-span-2">
                            <FileSignature className="w-4 h-4" /> Campo de Assinatura
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Variables */}
                  <div className="relative group">
                    <button className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white border rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center gap-2 shadow-md">
                      <Sparkles className="w-4 h-4" />
                      Variáveis Dinâmicas
                    </button>
                    <div className="absolute top-full left-0 mt-2 bg-white border rounded-lg shadow-xl p-2 w-72 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                      <div className="text-xs font-semibold text-gray-500 mb-2 px-2">
                        Clique para inserir
                      </div>
                      <div className="max-h-72 overflow-y-auto space-y-1">
                        {commonVariables.map((variable) => (
                          <button
                            key={variable}
                            onClick={() => insertVariable(variable)}
                            className="w-full text-left px-3 py-2 rounded hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 text-sm font-mono text-gray-700 hover:text-purple-600 transition-all"
                          >
                            {'{' + variable + '}'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="w-px h-8 bg-gray-300" />

                  {/* Zoom Controls */}
                  <div className="flex items-center gap-2 bg-white rounded-lg p-1 border shadow-sm">
                    <button
                      onClick={() => setZoom(Math.max(50, zoom - 10))}
                      className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-700"
                      title="Diminuir zoom"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-semibold text-gray-600 min-w-[60px] text-center">
                      {zoom}%
                    </span>
                    <button
                      onClick={() => setZoom(Math.min(200, zoom + 10))}
                      className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-700"
                      title="Aumentar zoom"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          <div className={`h-full flex ${previewMode === 'split' ? 'divide-x' : ''}`}>
            {/* Editor */}
            {(previewMode === 'edit' || previewMode === 'split') && (
              <div className={`overflow-auto bg-gradient-to-br from-gray-50 to-gray-100 ${previewMode === 'split' ? 'w-1/2' : 'w-full'}`}>
                <div className="p-8 max-w-5xl mx-auto">
                  <div
                    ref={editorRef}
                    contentEditable
                    onInput={(e) => handleContentChange(e.currentTarget.innerHTML)}
                    className="min-h-[1000px] bg-white shadow-2xl rounded-xl p-16 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                    style={{
                      transform: `scale(${zoom / 100})`,
                      transformOrigin: 'top center',
                      lineHeight: '1.6',
                      fontFamily: selectedFormat.fontFamily
                    }}
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                </div>
              </div>
            )}

            {/* Preview */}
            {(previewMode === 'preview' || previewMode === 'split') && (
              <div className={`overflow-auto bg-gradient-to-br from-slate-100 to-slate-200 ${previewMode === 'split' ? 'w-1/2' : 'w-full'}`}>
                <div className="p-8 max-w-5xl mx-auto">
                  <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Eye className="w-5 h-5" />
                        <span className="font-semibold">Visualização do Cliente</span>
                      </div>
                    </div>
                    <div
                      ref={previewRef}
                      className="p-16"
                      style={{
                        transform: `scale(${zoom / 100})`,
                        transformOrigin: 'top center',
                        fontFamily: selectedFormat.fontFamily
                      }}
                      dangerouslySetInnerHTML={{ __html: content }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
