import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Save, X, Eye, EyeOff, Download, Printer, FileText, Settings, Type, Bold, Italic, Underline, ChevronLeft as AlignLeft, TextAlignCenter as AlignCenter, Highlighter as AlignRight, TextAlignJustify as AlignJustify, List, ListOrdered, Image as ImageIcon, Table as TableIcon, Code, Link as LinkIcon, Maximize2, Minimize2, Undo, Redo, Trash2, Copy, ClipboardPaste, Sparkles, Palette, Columns2 as Columns, PanelRightOpen, PanelRightClose, Heading1, Heading2, Heading3, Quote, Minus, Plus, ZoomIn, ZoomOut } from 'lucide-react'
import { supabase } from '../lib/supabase'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { useToast } from '../hooks/useToast'

interface AdvancedDocumentEditorProps {
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
  fontSize: number
  fontFamily: string
  color: string
  backgroundColor: string
  align: 'left' | 'center' | 'right' | 'justify'
}

export default function AdvancedDocumentEditor({
  document,
  template,
  onClose,
  onSave,
  mode: initialMode
}: AdvancedDocumentEditorProps) {
  const [mode, setMode] = useState(initialMode)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [rawContent, setRawContent] = useState('')
  const [showPreview, setShowPreview] = useState(true)
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
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#000000',
    backgroundColor: 'transparent',
    align: 'left'
  })

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
      setContent(data.content || '')
      setRawContent(data.content || '')
      addToHistory(data.content || '')
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

  const applyFormat = (format: keyof TextFormat, value?: any) => {
    if (!editorRef.current) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

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
      case 'align':
        const alignCommand = value === 'left' ? 'justifyLeft' :
                            value === 'center' ? 'justifyCenter' :
                            value === 'right' ? 'justifyRight' : 'justifyFull'
        document.execCommand(alignCommand, false)
        setSelectedFormat({ ...selectedFormat, align: value })
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
      case 'color':
        document.execCommand('foreColor', false, value)
        setSelectedFormat({ ...selectedFormat, color: value })
        break
      case 'backgroundColor':
        document.execCommand('hiliteColor', false, value)
        setSelectedFormat({ ...selectedFormat, backgroundColor: value })
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
        html = '<h1 style="font-size: 28px; font-weight: bold; margin: 16px 0;">Título Principal</h1>'
        break
      case 'heading2':
        html = '<h2 style="font-size: 22px; font-weight: bold; margin: 14px 0;">Subtítulo</h2>'
        break
      case 'heading3':
        html = '<h3 style="font-size: 18px; font-weight: bold; margin: 12px 0;">Seção</h3>'
        break
      case 'paragraph':
        html = '<p style="margin: 8px 0;">Novo parágrafo</p>'
        break
      case 'list':
        document.execCommand('insertUnorderedList', false)
        return
      case 'orderedList':
        document.execCommand('insertOrderedList', false)
        return
      case 'table':
        html = `
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <thead>
              <tr>
                <th style="border: 1px solid #ddd; padding: 8px; background-color: #f3f4f6;">Coluna 1</th>
                <th style="border: 1px solid #ddd; padding: 8px; background-color: #f3f4f6;">Coluna 2</th>
                <th style="border: 1px solid #ddd; padding: 8px; background-color: #f3f4f6;">Coluna 3</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">Dados</td>
                <td style="border: 1px solid #ddd; padding: 8px;">Dados</td>
                <td style="border: 1px solid #ddd; padding: 8px;">Dados</td>
              </tr>
            </tbody>
          </table>
        `
        break
      case 'divider':
        html = '<hr style="border: none; border-top: 2px solid #e5e7eb; margin: 24px 0;" />'
        break
      case 'quote':
        html = '<blockquote style="border-left: 4px solid #3b82f6; padding-left: 16px; margin: 16px 0; color: #6b7280; font-style: italic;">Citação</blockquote>'
        break
      case 'code':
        html = '<pre style="background-color: #f3f4f6; padding: 12px; border-radius: 6px; overflow-x: auto; font-family: monospace;"><code>código</code></pre>'
        break
    }

    if (html) {
      range.deleteContents()
      const fragment = range.createContextualFragment(html)
      range.insertNode(fragment)
      handleContentChange(editorRef.current.innerHTML)
    }
  }

  const insertVariable = (variable: string) => {
    if (!editorRef.current) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      editorRef.current.innerHTML += `<span style="background-color: #dbeafe; color: #1e40af; padding: 2px 6px; border-radius: 4px; font-family: monospace;">{${variable}}</span>`
    } else {
      const range = selection.getRangeAt(0)
      const span = document.createElement('span')
      span.style.backgroundColor = '#dbeafe'
      span.style.color = '#1e40af'
      span.style.padding = '2px 6px'
      span.style.borderRadius = '4px'
      span.style.fontFamily = 'monospace'
      span.textContent = `{${variable}}`
      range.deleteContents()
      range.insertNode(span)
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
            content: rawContent,
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
        logging: false
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
      const imgX = (pdfWidth - imgWidth * ratio) / 2
      const imgY = 0

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio)
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
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              max-width: 210mm;
              margin: 0 auto;
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
    'empresa_nome',
    'empresa_cnpj',
    'data_atual',
    'valor_total',
    'valor_desconto',
    'forma_pagamento'
  ]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-[95vw] h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6" />
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título do documento"
                className="bg-white/10 text-white placeholder-white/60 px-3 py-1 rounded border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 text-lg font-semibold"
              />
              <div className="text-xs text-white/70 mt-1">
                {mode === 'create' ? 'Novo Documento' : mode === 'edit' ? 'Editando' : 'Visualizando'}
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
              className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors disabled:opacity-50"
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
              className="border-b bg-gray-50 overflow-hidden"
            >
              <div className="px-6 py-3 flex items-center gap-4 flex-wrap">
                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 bg-white rounded-lg p-1 border">
                  <button
                    onClick={() => setPreviewMode('edit')}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      previewMode === 'edit' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Editor
                  </button>
                  <button
                    onClick={() => setPreviewMode('split')}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      previewMode === 'split' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Dividido
                  </button>
                  <button
                    onClick={() => setPreviewMode('preview')}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      previewMode === 'preview' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Preview
                  </button>
                </div>

                <div className="w-px h-8 bg-gray-300" />

                {/* Text Formatting */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => applyFormat('bold')}
                    className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                      selectedFormat.bold ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
                    }`}
                    title="Negrito"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => applyFormat('italic')}
                    className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                      selectedFormat.italic ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
                    }`}
                    title="Itálico"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => applyFormat('underline')}
                    className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                      selectedFormat.underline ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
                    }`}
                    title="Sublinhado"
                  >
                    <Underline className="w-4 h-4" />
                  </button>
                </div>

                <div className="w-px h-8 bg-gray-300" />

                {/* Alignment */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => applyFormat('align', 'left')}
                    className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700"
                    title="Alinhar à esquerda"
                  >
                    <AlignLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => applyFormat('align', 'center')}
                    className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700"
                    title="Centralizar"
                  >
                    <AlignCenter className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => applyFormat('align', 'right')}
                    className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700"
                    title="Alinhar à direita"
                  >
                    <AlignRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => applyFormat('align', 'justify')}
                    className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700"
                    title="Justificar"
                  >
                    <AlignJustify className="w-4 h-4" />
                  </button>
                </div>

                <div className="w-px h-8 bg-gray-300" />

                {/* Font Size */}
                <select
                  value={selectedFormat.fontSize}
                  onChange={(e) => applyFormat('fontSize', parseInt(e.target.value))}
                  className="px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="10">10px</option>
                  <option value="12">12px</option>
                  <option value="14">14px</option>
                  <option value="16">16px</option>
                  <option value="18">18px</option>
                  <option value="20">20px</option>
                  <option value="24">24px</option>
                  <option value="28">28px</option>
                  <option value="32">32px</option>
                </select>

                {/* Color Picker */}
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <Palette className="w-4 h-4 text-gray-600" />
                    <input
                      type="color"
                      value={selectedFormat.color}
                      onChange={(e) => applyFormat('color', e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer"
                      title="Cor do texto"
                    />
                  </label>
                </div>

                <div className="w-px h-8 bg-gray-300" />

                {/* Insert Elements */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => insertElement('heading1')}
                    className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700"
                    title="Título 1"
                  >
                    <Heading1 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => insertElement('heading2')}
                    className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700"
                    title="Título 2"
                  >
                    <Heading2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => insertElement('heading3')}
                    className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700"
                    title="Título 3"
                  >
                    <Heading3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => insertElement('list')}
                    className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700"
                    title="Lista"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => insertElement('orderedList')}
                    className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700"
                    title="Lista Numerada"
                  >
                    <ListOrdered className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => insertElement('quote')}
                    className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700"
                    title="Citação"
                  >
                    <Quote className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => insertElement('table')}
                    className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700"
                    title="Tabela"
                  >
                    <TableIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => insertElement('divider')}
                    className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700"
                    title="Divisor"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>

                <div className="w-px h-8 bg-gray-300" />

                {/* Variables */}
                <div className="relative group">
                  <button className="px-3 py-1.5 bg-white border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Variáveis
                  </button>
                  <div className="absolute top-full left-0 mt-2 bg-white border rounded-lg shadow-lg p-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    <div className="text-xs font-medium text-gray-500 mb-2 px-2">
                      Clique para inserir
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {commonVariables.map((variable) => (
                        <button
                          key={variable}
                          onClick={() => insertVariable(variable)}
                          className="w-full text-left px-3 py-2 rounded hover:bg-blue-50 text-sm font-mono text-gray-700 hover:text-blue-600 transition-colors"
                        >
                          {'{' + variable + '}'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="w-px h-8 bg-gray-300" />

                {/* Zoom Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setZoom(Math.max(50, zoom - 10))}
                    className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700"
                    title="Diminuir zoom"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-medium text-gray-600 min-w-[60px] text-center">
                    {zoom}%
                  </span>
                  <button
                    onClick={() => setZoom(Math.min(200, zoom + 10))}
                    className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700"
                    title="Aumentar zoom"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
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
              <div className={`overflow-auto bg-gray-50 ${previewMode === 'split' ? 'w-1/2' : 'w-full'}`}>
                <div className="p-8 max-w-4xl mx-auto">
                  <div
                    ref={editorRef}
                    contentEditable
                    onInput={(e) => handleContentChange(e.currentTarget.innerHTML)}
                    className="min-h-[800px] bg-white shadow-lg rounded-lg p-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{
                      transform: `scale(${zoom / 100})`,
                      transformOrigin: 'top center',
                      lineHeight: '1.6'
                    }}
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                </div>
              </div>
            )}

            {/* Preview */}
            {(previewMode === 'preview' || previewMode === 'split') && (
              <div className={`overflow-auto bg-gray-100 ${previewMode === 'split' ? 'w-1/2' : 'w-full'}`}>
                <div className="p-8 max-w-4xl mx-auto">
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3">
                      <div className="flex items-center gap-2">
                        <Eye className="w-5 h-5" />
                        <span className="font-medium">Visualização do Cliente</span>
                      </div>
                    </div>
                    <div
                      ref={previewRef}
                      className="p-12"
                      style={{
                        transform: `scale(${zoom / 100})`,
                        transformOrigin: 'top center'
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
