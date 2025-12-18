import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Type,
  Image as ImageIcon,
  Square,
  Circle,
  Minus,
  Edit3,
  Trash2,
  Copy,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Save,
  Download,
  Settings,
  Layers,
  Palette,
  Grid3x3,
  RotateCw,
  Move,
  X,
  Upload,
  FileText,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import jsPDF from 'jspdf'

interface CanvasElement {
  id: string
  element_type: 'text' | 'image' | 'shape' | 'logo' | 'header' | 'footer' | 'field'
  content?: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  z_index: number
  locked: boolean
  visible: boolean
  opacity: number
  font_family?: string
  font_size?: number
  font_weight?: string
  font_style?: string
  text_align?: string
  line_height?: number
  fill_color?: string
  fill_gradient?: any
  stroke_color?: string
  stroke_width?: number
  border_radius?: number
  border_color?: string
  border_width?: number
  shadow_enabled?: boolean
  shadow_x?: number
  shadow_y?: number
  shadow_blur?: number
  shadow_color?: string
  image_url?: string
  shape_type?: string
  padding?: number
  field_name?: string
  is_header?: boolean
  is_footer?: boolean
  background_color?: string
}

interface CanvasDesign {
  id?: string
  canvas_width: number
  canvas_height: number
  background_type: 'solid' | 'gradient' | 'image' | 'pattern'
  background_color: string
  background_gradient?: any
  background_image?: string
  grid_enabled: boolean
  grid_size: number
  snap_to_grid: boolean
  margin_top: number
  margin_bottom: number
  margin_left: number
  margin_right: number
  page_orientation: 'portrait' | 'landscape'
}

interface VisualDocumentEditorProps {
  template?: any
  onClose: () => void
  onSave: () => void
}

export default function VisualDocumentEditor({ template, onClose, onSave }: VisualDocumentEditorProps) {
  const [canvasDesign, setCanvasDesign] = useState<CanvasDesign>({
    canvas_width: 794,
    canvas_height: 1123,
    background_type: 'solid',
    background_color: '#ffffff',
    grid_enabled: false,
    grid_size: 10,
    snap_to_grid: true,
    margin_top: 60,
    margin_bottom: 60,
    margin_left: 60,
    margin_right: 60,
    page_orientation: 'portrait'
  })

  const [elements, setElements] = useState<CanvasElement[]>([])
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [tool, setTool] = useState<'select' | 'text' | 'shape' | 'image'>('select')
  const [zoom, setZoom] = useState(0.8)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [history, setHistory] = useState<any[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [showBackgroundPanel, setShowBackgroundPanel] = useState(false)
  const [showLayersPanel, setShowLayersPanel] = useState(false)
  const [fonts, setFonts] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadFonts()
    if (template) {
      loadTemplateAsElements()
    } else {
      setLoading(false)
      addToHistory()
    }
  }, [template])

  const loadFonts = async () => {
    const { data } = await supabase
      .from('design_fonts')
      .select('*')
      .eq('is_active', true)
      .order('name')

    const defaultFonts = [
      { id: '1', name: 'Inter', font_family: 'Inter, sans-serif' },
      { id: '2', name: 'Roboto', font_family: 'Roboto, sans-serif' },
      { id: '3', name: 'Montserrat', font_family: 'Montserrat, sans-serif' },
      { id: '4', name: 'Open Sans', font_family: 'Open Sans, sans-serif' },
      { id: '5', name: 'Lato', font_family: 'Lato, sans-serif' }
    ]

    setFonts(data && data.length > 0 ? data : defaultFonts)
  }

  const parseTemplateToElements = () => {
    const elementsArray: CanvasElement[] = []
    let yPos = 80
    let elementCounter = 0

    if (!template) {
      console.error('❌ Template is undefined or null')
      return elementsArray
    }

    console.log('🔍 Parsing template:', template.name)
    console.log('📊 Has content_template:', !!template.content_template, 'length:', template.content_template?.length || 0)
    console.log('📊 Has header_text:', !!template.header_text)
    console.log('📊 Has footer_text:', !!template.footer_text)
    console.log('📊 Has logo_url:', !!template.logo_url)

    if (template.logo_url && template.show_logo !== false) {
      console.log('➕ Adding logo element')
      elementsArray.push({
        id: `elem-logo-${elementCounter++}`,
        element_type: 'logo',
        x: 60,
        y: 40,
        width: 150,
        height: 80,
        rotation: 0,
        z_index: elementsArray.length,
        locked: false,
        visible: true,
        opacity: 1,
        image_url: template.logo_url
      })
      yPos = 140
    }

    if (template.header_text && template.show_header !== false) {
      console.log('➕ Adding header element:', template.header_text.substring(0, 30))
      elementsArray.push({
        id: `elem-header-${elementCounter++}`,
        element_type: 'header',
        content: template.header_text,
        x: 60,
        y: yPos,
        width: 674,
        height: 60,
        rotation: 0,
        z_index: elementsArray.length,
        locked: false,
        visible: true,
        opacity: 1,
        font_family: 'Montserrat',
        font_size: 24,
        font_weight: 'bold',
        text_align: 'center',
        fill_color: '#1f2937',
        is_header: true,
        background_color: '#f3f4f6',
        padding: 16,
        border_radius: 8
      })
      yPos += 80
    }

    const contentTemplate = template.content_template || template.contract_text || ''
    console.log('📄 Content template length:', contentTemplate.length)

    if (contentTemplate.length === 0) {
      console.warn('⚠️ Content template is empty!')
    }

    const lines = contentTemplate.split('\n')
    console.log('📝 Total lines:', lines.length)

    let processedLines = 0
    lines.forEach((line: string, index: number) => {
      const trimmed = line.trim()
      if (!trimmed) return

      processedLines++
      let elementType: 'text' | 'field' = 'text'
      let content = trimmed
      let fontSize = 14
      let fontWeight = 'normal'
      let height = 40
      let fieldName = ''

      if (trimmed.startsWith('#')) {
        fontSize = trimmed.startsWith('##') ? 20 : 28
        fontWeight = 'bold'
        content = trimmed.replace(/^#+\s*/, '')
        height = fontSize === 28 ? 50 : 40
      } else if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        fontWeight = 'bold'
        content = trimmed.replace(/\*\*/g, '')
      } else if (trimmed.includes('{{') && trimmed.includes('}}')) {
        elementType = 'field'
        const match = trimmed.match(/\{\{([^}]+)\}\}/)
        if (match) {
          fieldName = match[1]
          content = `[${match[1].replace(/_/g, ' ').toUpperCase()}]`
        }
      } else if (trimmed.includes('[') && trimmed.includes(']')) {
        elementType = 'field'
        const match = trimmed.match(/\[([^\]]+)\]/)
        if (match) {
          fieldName = match[1]
          content = `[${match[1].toUpperCase()}]`
        }
      }

      elementsArray.push({
        id: `elem-text-${elementCounter++}`,
        element_type: elementType,
        content: content,
        x: 60,
        y: yPos,
        width: 674,
        height: height,
        rotation: 0,
        z_index: elementsArray.length,
        locked: false,
        visible: true,
        opacity: 1,
        font_family: 'Inter',
        font_size: fontSize,
        font_weight: fontWeight,
        text_align: 'left',
        line_height: 1.6,
        fill_color: '#374151',
        field_name: fieldName,
        padding: 8
      })

      yPos += height + 10
    })

    console.log('✅ Processed', processedLines, 'lines from content')

    if (template.footer_text && template.show_footer !== false) {
      console.log('➕ Adding footer element:', template.footer_text.substring(0, 30))
      elementsArray.push({
        id: `elem-footer-${elementCounter++}`,
        element_type: 'footer',
        content: template.footer_text,
        x: 60,
        y: Math.max(yPos + 40, 1000),
        width: 674,
        height: 60,
        rotation: 0,
        z_index: elementsArray.length,
        locked: false,
        visible: true,
        opacity: 1,
        font_family: 'Inter',
        font_size: 10,
        font_weight: 'normal',
        text_align: 'center',
        fill_color: '#6b7280',
        is_footer: true,
        background_color: '#f9fafb',
        padding: 12,
        border_radius: 4
      })
    }

    if (template.custom_styles) {
      try {
        const styles = typeof template.custom_styles === 'string'
          ? JSON.parse(template.custom_styles)
          : template.custom_styles

        if (styles.header) {
          const headerEl = elementsArray.find(el => el.is_header)
          if (headerEl) {
            Object.assign(headerEl, styles.header)
          }
        }

        if (styles.footer) {
          const footerEl = elementsArray.find(el => el.is_footer)
          if (footerEl) {
            Object.assign(footerEl, styles.footer)
          }
        }

        if (styles.body) {
          elementsArray
            .filter(el => el.element_type === 'text' && !el.is_header && !el.is_footer)
            .forEach(el => {
              if (styles.body.font_family) el.font_family = styles.body.font_family
              if (styles.body.font_size) el.font_size = styles.body.font_size
              if (styles.body.fill_color) el.fill_color = styles.body.fill_color
            })
        }
      } catch (e) {
        console.error('Error parsing custom styles:', e)
      }
    }

    console.log('✨ Created', elementsArray.length, 'total elements')
    console.log('📋 Element types:', elementsArray.reduce((acc, el) => {
      acc[el.element_type] = (acc[el.element_type] || 0) + 1
      return acc
    }, {} as Record<string, number>))

    return elementsArray
  }

  const loadTemplateAsElements = async () => {
    try {
      setLoading(true)
      console.log('📋 Loading template as elements...')
      const parsedElements = parseTemplateToElements()
      console.log(`✅ Parsed ${parsedElements.length} elements from template`)
      setElements(parsedElements)
      addToHistory()
    } catch (error) {
      console.error('❌ Error loading template:', error)
    } finally {
      setLoading(false)
    }
  }

  const addToHistory = () => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push({
      canvasDesign: { ...canvasDesign },
      elements: JSON.parse(JSON.stringify(elements))
    })
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const undo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1]
      setCanvasDesign(prevState.canvasDesign)
      setElements(prevState.elements)
      setHistoryIndex(historyIndex - 1)
      setSelectedElement(null)
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1]
      setCanvasDesign(nextState.canvasDesign)
      setElements(nextState.elements)
      setHistoryIndex(historyIndex + 1)
      setSelectedElement(null)
    }
  }

  const addElement = (type: 'text' | 'shape' | 'image') => {
    const newElement: CanvasElement = {
      id: `elem-${Date.now()}`,
      element_type: type,
      x: 150,
      y: 150,
      width: type === 'text' ? 300 : 200,
      height: type === 'text' ? 60 : 200,
      rotation: 0,
      z_index: elements.length,
      locked: false,
      visible: true,
      opacity: 1,
      content: type === 'text' ? 'Clique para editar' : undefined,
      font_family: 'Inter',
      font_size: 18,
      font_weight: 'normal',
      font_style: 'normal',
      text_align: 'left',
      line_height: 1.5,
      fill_color: type === 'text' ? '#000000' : '#2563eb',
      border_radius: type === 'shape' ? 8 : 0,
      shape_type: type === 'shape' ? 'rectangle' : undefined,
      shadow_enabled: false,
      padding: 8
    }

    const newElements = [...elements, newElement]
    setElements(newElements)
    setSelectedElement(newElement.id)
    setTimeout(() => addToHistory(), 50)
  }

  const updateElement = (id: string, updates: Partial<CanvasElement>) => {
    setElements(elements.map(el =>
      el.id === id ? { ...el, ...updates } : el
    ))
  }

  const commitUpdate = () => {
    setTimeout(() => addToHistory(), 50)
  }

  const deleteElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id))
    setSelectedElement(null)
    addToHistory()
  }

  const duplicateElement = (id: string) => {
    const element = elements.find(el => el.id === id)
    if (element) {
      const newElement = {
        ...element,
        id: `elem-${Date.now()}`,
        x: element.x + 20,
        y: element.y + 20,
        z_index: elements.length
      }
      setElements([...elements, newElement])
      setSelectedElement(newElement.id)
      addToHistory()
    }
  }

  const moveLayerUp = (id: string) => {
    const index = elements.findIndex(el => el.id === id)
    if (index < elements.length - 1) {
      const newElements = [...elements]
      const temp = newElements[index + 1]
      newElements[index + 1] = newElements[index]
      newElements[index] = temp
      newElements.forEach((el, i) => el.z_index = i)
      setElements(newElements)
      addToHistory()
    }
  }

  const moveLayerDown = (id: string) => {
    const index = elements.findIndex(el => el.id === id)
    if (index > 0) {
      const newElements = [...elements]
      const temp = newElements[index - 1]
      newElements[index - 1] = newElements[index]
      newElements[index] = temp
      newElements.forEach((el, i) => el.z_index = i)
      setElements(newElements)
      addToHistory()
    }
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === canvasRef.current) {
      if (tool !== 'select') {
        if (tool === 'text') {
          addElement('text')
        } else if (tool === 'shape') {
          addElement('shape')
        }
        setTool('select')
      } else {
        setSelectedElement(null)
      }
    }
  }

  const handleElementMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation()
    const element = elements.find(el => el.id === elementId)
    if (element && !element.locked) {
      setSelectedElement(elementId)
      setIsDragging(true)
      setDragStart({
        x: e.clientX,
        y: e.clientY
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && selectedElement) {
      const element = elements.find(el => el.id === selectedElement)
      if (element && !element.locked) {
        const deltaX = (e.clientX - dragStart.x) / zoom
        const deltaY = (e.clientY - dragStart.y) / zoom

        let newX = element.x + deltaX
        let newY = element.y + deltaY

        if (canvasDesign.snap_to_grid) {
          newX = Math.round(newX / canvasDesign.grid_size) * canvasDesign.grid_size
          newY = Math.round(newY / canvasDesign.grid_size) * canvasDesign.grid_size
        }

        updateElement(selectedElement, { x: newX, y: newY })
        setDragStart({ x: e.clientX, y: e.clientY })
      }
    }
  }

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false)
      commitUpdate()
    }
  }

  const renderBackground = () => {
    if (canvasDesign.background_type === 'solid') {
      return { backgroundColor: canvasDesign.background_color }
    } else if (canvasDesign.background_type === 'gradient' && canvasDesign.background_gradient) {
      const grad = canvasDesign.background_gradient
      if (grad.type === 'linear') {
        const stops = grad.stops.map((s: any) => `${s.color} ${s.position}%`).join(', ')
        return {
          background: `linear-gradient(${grad.angle}deg, ${stops})`
        }
      }
    } else if (canvasDesign.background_type === 'image' && canvasDesign.background_image) {
      return {
        backgroundImage: `url(${canvasDesign.background_image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }
    }
    return { backgroundColor: '#ffffff' }
  }

  const renderElement = (element: CanvasElement) => {
    if (!element.visible) return null

    const isSelected = selectedElement === element.id

    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: element.x,
      top: element.y,
      width: element.width,
      height: element.height,
      transform: `rotate(${element.rotation}deg)`,
      opacity: element.opacity,
      zIndex: element.z_index + 1000,
      cursor: element.locked ? 'not-allowed' : 'move',
      border: isSelected ? '2px solid #3b82f6' : '1px dashed transparent',
      boxShadow: isSelected ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
      boxSizing: 'border-box'
    }

    if (element.element_type === 'text' || element.element_type === 'field' ||
        element.element_type === 'header' || element.element_type === 'footer') {
      const textStyle: React.CSSProperties = {
        ...baseStyle,
        fontFamily: element.font_family,
        fontSize: element.font_size,
        fontWeight: element.font_weight,
        fontStyle: element.font_style,
        textAlign: element.text_align as any,
        lineHeight: element.line_height,
        color: element.fill_color,
        padding: element.padding || 8,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        backgroundColor: element.background_color || 'transparent',
        borderRadius: element.border_radius || 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: element.text_align === 'center' ? 'center' : element.text_align === 'right' ? 'flex-end' : 'flex-start'
      }

      if (element.shadow_enabled) {
        textStyle.boxShadow = `${element.shadow_x}px ${element.shadow_y}px ${element.shadow_blur}px ${element.shadow_color}`
      }

      return (
        <div
          key={element.id}
          style={textStyle}
          onMouseDown={(e) => handleElementMouseDown(e, element.id)}
          contentEditable={isSelected && !element.locked}
          suppressContentEditableWarning
          onBlur={(e) => {
            updateElement(element.id, { content: e.currentTarget.textContent || '' })
            commitUpdate()
          }}
          onClick={(e) => {
            if (isSelected) {
              e.stopPropagation()
            }
          }}
        >
          {element.content}
        </div>
      )
    } else if (element.element_type === 'shape') {
      const shapeStyle: React.CSSProperties = {
        ...baseStyle,
        backgroundColor: element.fill_color,
        borderRadius: element.border_radius,
        border: element.border_width ? `${element.border_width}px solid ${element.border_color}` : 'none'
      }

      if (element.shadow_enabled) {
        shapeStyle.boxShadow = `${element.shadow_x}px ${element.shadow_y}px ${element.shadow_blur}px ${element.shadow_color}`
      }

      return (
        <div
          key={element.id}
          style={shapeStyle}
          onMouseDown={(e) => handleElementMouseDown(e, element.id)}
        />
      )
    } else if (element.element_type === 'logo' && element.image_url) {
      const imageStyle: React.CSSProperties = {
        ...baseStyle,
        backgroundImage: `url(${element.image_url})`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center'
      }

      return (
        <div
          key={element.id}
          style={imageStyle}
          onMouseDown={(e) => handleElementMouseDown(e, element.id)}
        />
      )
    }

    return null
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      const updatedTemplate = {
        ...template,
        custom_styles: JSON.stringify({
          header: elements.find(el => el.is_header),
          footer: elements.find(el => el.is_footer),
          body: {
            font_family: elements.find(el => el.element_type === 'text')?.font_family,
            font_size: elements.find(el => el.element_type === 'text')?.font_size,
            fill_color: elements.find(el => el.element_type === 'text')?.fill_color
          }
        }),
        layout_config: JSON.stringify({
          canvas: canvasDesign,
          elements: elements
        })
      }

      const { error } = await supabase
        .from('document_templates')
        .update(updatedTemplate)
        .eq('id', template.id)

      if (error) throw error

      alert('Template salvo com sucesso!')
      onSave()
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Erro ao salvar template')
    } finally {
      setSaving(false)
    }
  }

  const selectedEl = elements.find(el => el.id === selectedElement)

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Carregando template...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col z-50">
      {/* Top Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 p-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onClose} className="text-white hover:text-gray-300 transition-colors">
            <X className="w-6 h-6" />
          </button>
          <h2 className="text-white font-bold text-lg">
            Editor Visual Pro - {template?.name || 'Novo Documento'}
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="p-2 text-white hover:bg-gray-700 rounded disabled:opacity-30 transition-all"
            title="Desfazer (Ctrl+Z)"
          >
            <Undo className="w-5 h-5" />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 text-white hover:bg-gray-700 rounded disabled:opacity-30 transition-all"
            title="Refazer (Ctrl+Y)"
          >
            <Redo className="w-5 h-5" />
          </button>

          <div className="w-px h-8 bg-gray-700 mx-2"></div>

          <button
            onClick={() => setZoom(Math.max(0.25, zoom - 0.1))}
            className="p-2 text-white hover:bg-gray-700 rounded transition-all"
            title="Diminuir zoom"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-white text-sm px-3 font-medium min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(Math.min(2, zoom + 0.1))}
            className="p-2 text-white hover:bg-gray-700 rounded transition-all"
            title="Aumentar zoom"
          >
            <ZoomIn className="w-5 h-5" />
          </button>

          <div className="w-px h-8 bg-gray-700 mx-2"></div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center transition-all disabled:opacity-50"
          >
            <Save className="w-5 h-5 mr-2" />
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Tools */}
        <div className="w-20 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-4 space-y-2">
          <button
            onClick={() => setTool('select')}
            className={`p-3 rounded-lg transition-all ${
              tool === 'select'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
            title="Selecionar e Mover (V)"
          >
            <Move className="w-6 h-6" />
          </button>

          <button
            onClick={() => {
              setTool('text')
              addElement('text')
            }}
            className={`p-3 rounded-lg transition-all ${
              tool === 'text'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
            title="Adicionar Texto (T)"
          >
            <Type className="w-6 h-6" />
          </button>

          <button
            onClick={() => {
              setTool('shape')
              addElement('shape')
            }}
            className={`p-3 rounded-lg transition-all ${
              tool === 'shape'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
            title="Adicionar Forma (R)"
          >
            <Square className="w-6 h-6" />
          </button>

          <div className="h-px w-12 bg-gray-700 my-2"></div>

          <button
            onClick={() => setShowBackgroundPanel(!showBackgroundPanel)}
            className={`p-3 rounded-lg transition-all ${
              showBackgroundPanel
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
            title="Configurar Fundo"
          >
            <Palette className="w-6 h-6" />
          </button>

          <button
            onClick={() => setCanvasDesign({ ...canvasDesign, grid_enabled: !canvasDesign.grid_enabled })}
            className={`p-3 rounded-lg transition-all ${
              canvasDesign.grid_enabled
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
            title="Grade de Alinhamento"
          >
            <Grid3x3 className="w-6 h-6" />
          </button>

          <button
            onClick={() => setShowLayersPanel(!showLayersPanel)}
            className={`p-3 rounded-lg transition-all ${
              showLayersPanel
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
            title="Gerenciar Camadas"
          >
            <Layers className="w-6 h-6" />
          </button>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-gray-700 overflow-auto flex items-center justify-center p-8">
          <div
            ref={canvasRef}
            className="shadow-2xl relative"
            style={{
              width: canvasDesign.canvas_width,
              height: canvasDesign.canvas_height,
              transform: `scale(${zoom})`,
              transformOrigin: 'center',
              ...renderBackground()
            }}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {canvasDesign.grid_enabled && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `
                    repeating-linear-gradient(0deg, transparent, transparent ${canvasDesign.grid_size - 1}px, rgba(100,116,139,0.2) ${canvasDesign.grid_size - 1}px, rgba(100,116,139,0.2) ${canvasDesign.grid_size}px),
                    repeating-linear-gradient(90deg, transparent, transparent ${canvasDesign.grid_size - 1}px, rgba(100,116,139,0.2) ${canvasDesign.grid_size - 1}px, rgba(100,116,139,0.2) ${canvasDesign.grid_size}px)
                  `
                }}
              />
            )}

            {elements.map(renderElement)}

            {elements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center text-gray-400">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Template carregado</p>
                  <p className="text-sm mt-2">Clique nos elementos para editar</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto">
          {selectedEl ? (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg">Propriedades</h3>
                <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                  {selectedEl.element_type === 'header' ? 'Cabeçalho' :
                   selectedEl.element_type === 'footer' ? 'Rodapé' :
                   selectedEl.element_type === 'logo' ? 'Logo' :
                   selectedEl.element_type === 'field' ? 'Campo' :
                   selectedEl.element_type === 'text' ? 'Texto' : 'Forma'}
                </span>
              </div>

              {/* Position & Size */}
              <div className="space-y-3 p-3 bg-gray-700 rounded-lg">
                <label className="text-gray-300 text-sm font-medium block">Posição e Tamanho</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">X</label>
                    <input
                      type="number"
                      value={Math.round(selectedEl.x)}
                      onChange={(e) => {
                        updateElement(selectedEl.id, { x: parseInt(e.target.value) || 0 })
                        commitUpdate()
                      }}
                      className="w-full px-2 py-1.5 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Y</label>
                    <input
                      type="number"
                      value={Math.round(selectedEl.y)}
                      onChange={(e) => {
                        updateElement(selectedEl.id, { y: parseInt(e.target.value) || 0 })
                        commitUpdate()
                      }}
                      className="w-full px-2 py-1.5 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Largura</label>
                    <input
                      type="number"
                      value={Math.round(selectedEl.width)}
                      onChange={(e) => {
                        updateElement(selectedEl.id, { width: parseInt(e.target.value) || 10 })
                        commitUpdate()
                      }}
                      className="w-full px-2 py-1.5 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Altura</label>
                    <input
                      type="number"
                      value={Math.round(selectedEl.height)}
                      onChange={(e) => {
                        updateElement(selectedEl.id, { height: parseInt(e.target.value) || 10 })
                        commitUpdate()
                      }}
                      className="w-full px-2 py-1.5 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Text/Header/Footer/Field Properties */}
              {(selectedEl.element_type === 'text' || selectedEl.element_type === 'field' ||
                selectedEl.element_type === 'header' || selectedEl.element_type === 'footer') && (
                <>
                  <div className="space-y-3 p-3 bg-gray-700 rounded-lg">
                    <label className="text-gray-300 text-sm font-medium block">Fonte</label>
                    <select
                      value={selectedEl.font_family}
                      onChange={(e) => {
                        updateElement(selectedEl.id, { font_family: e.target.value })
                        commitUpdate()
                      }}
                      className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
                    >
                      {fonts.map(font => (
                        <option key={font.id} value={font.font_family}>{font.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3 p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <label className="text-gray-300 text-sm font-medium">Tamanho</label>
                      <span className="text-blue-400 font-bold">{selectedEl.font_size}px</span>
                    </div>
                    <input
                      type="range"
                      min="8"
                      max="72"
                      value={selectedEl.font_size}
                      onChange={(e) => {
                        updateElement(selectedEl.id, { font_size: parseInt(e.target.value) })
                      }}
                      onMouseUp={commitUpdate}
                      className="w-full accent-blue-600"
                    />
                  </div>

                  <div className="space-y-3 p-3 bg-gray-700 rounded-lg">
                    <label className="text-gray-300 text-sm font-medium block">Estilo</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          updateElement(selectedEl.id, {
                            font_weight: selectedEl.font_weight === 'bold' ? 'normal' : 'bold'
                          })
                          commitUpdate()
                        }}
                        className={`p-2 rounded transition-all ${
                          selectedEl.font_weight === 'bold'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        }`}
                      >
                        <Bold className="w-4 h-4 mx-auto" />
                      </button>
                      <button
                        onClick={() => {
                          updateElement(selectedEl.id, {
                            font_style: selectedEl.font_style === 'italic' ? 'normal' : 'italic'
                          })
                          commitUpdate()
                        }}
                        className={`p-2 rounded transition-all ${
                          selectedEl.font_style === 'italic'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        }`}
                      >
                        <Italic className="w-4 h-4 mx-auto" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 p-3 bg-gray-700 rounded-lg">
                    <label className="text-gray-300 text-sm font-medium block">Alinhamento</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => {
                          updateElement(selectedEl.id, { text_align: 'left' })
                          commitUpdate()
                        }}
                        className={`p-2 rounded transition-all ${
                          selectedEl.text_align === 'left'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        }`}
                      >
                        <AlignLeft className="w-4 h-4 mx-auto" />
                      </button>
                      <button
                        onClick={() => {
                          updateElement(selectedEl.id, { text_align: 'center' })
                          commitUpdate()
                        }}
                        className={`p-2 rounded transition-all ${
                          selectedEl.text_align === 'center'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        }`}
                      >
                        <AlignCenter className="w-4 h-4 mx-auto" />
                      </button>
                      <button
                        onClick={() => {
                          updateElement(selectedEl.id, { text_align: 'right' })
                          commitUpdate()
                        }}
                        className={`p-2 rounded transition-all ${
                          selectedEl.text_align === 'right'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        }`}
                      >
                        <AlignRight className="w-4 h-4 mx-auto" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 p-3 bg-gray-700 rounded-lg">
                    <label className="text-gray-300 text-sm font-medium block">Cor do Texto</label>
                    <input
                      type="color"
                      value={selectedEl.fill_color}
                      onChange={(e) => updateElement(selectedEl.id, { fill_color: e.target.value })}
                      onBlur={commitUpdate}
                      className="w-full h-12 rounded cursor-pointer"
                    />
                  </div>

                  <div className="space-y-3 p-3 bg-gray-700 rounded-lg">
                    <label className="text-gray-300 text-sm font-medium block">Cor de Fundo</label>
                    <input
                      type="color"
                      value={selectedEl.background_color || '#ffffff'}
                      onChange={(e) => updateElement(selectedEl.id, { background_color: e.target.value })}
                      onBlur={commitUpdate}
                      className="w-full h-12 rounded cursor-pointer"
                    />
                    <button
                      onClick={() => {
                        updateElement(selectedEl.id, { background_color: 'transparent' })
                        commitUpdate()
                      }}
                      className="w-full px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-500"
                    >
                      Transparente
                    </button>
                  </div>

                  <div className="space-y-3 p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <label className="text-gray-300 text-sm font-medium">Padding</label>
                      <span className="text-blue-400 font-bold">{selectedEl.padding || 8}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={selectedEl.padding || 8}
                      onChange={(e) => updateElement(selectedEl.id, { padding: parseInt(e.target.value) })}
                      onMouseUp={commitUpdate}
                      className="w-full accent-blue-600"
                    />
                  </div>

                  <div className="space-y-3 p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <label className="text-gray-300 text-sm font-medium">Raio da Borda</label>
                      <span className="text-blue-400 font-bold">{selectedEl.border_radius || 0}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={selectedEl.border_radius || 0}
                      onChange={(e) => updateElement(selectedEl.id, { border_radius: parseInt(e.target.value) })}
                      onMouseUp={commitUpdate}
                      className="w-full accent-blue-600"
                    />
                  </div>

                  <div className="space-y-3 p-3 bg-gray-700 rounded-lg">
                    <label className="flex items-center text-gray-300 text-sm font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedEl.shadow_enabled || false}
                        onChange={(e) => {
                          updateElement(selectedEl.id, {
                            shadow_enabled: e.target.checked,
                            shadow_x: 0,
                            shadow_y: 4,
                            shadow_blur: 8,
                            shadow_color: 'rgba(0,0,0,0.1)'
                          })
                          commitUpdate()
                        }}
                        className="mr-2 w-4 h-4 accent-blue-600"
                      />
                      Sombra
                    </label>
                    {selectedEl.shadow_enabled && (
                      <div className="space-y-2 mt-2">
                        <div>
                          <label className="text-gray-400 text-xs block mb-1">Distância Y</label>
                          <input
                            type="range"
                            min="0"
                            max="20"
                            value={selectedEl.shadow_y || 4}
                            onChange={(e) => updateElement(selectedEl.id, { shadow_y: parseInt(e.target.value) })}
                            onMouseUp={commitUpdate}
                            className="w-full accent-blue-600"
                          />
                        </div>
                        <div>
                          <label className="text-gray-400 text-xs block mb-1">Desfoque</label>
                          <input
                            type="range"
                            min="0"
                            max="30"
                            value={selectedEl.shadow_blur || 8}
                            onChange={(e) => updateElement(selectedEl.id, { shadow_blur: parseInt(e.target.value) })}
                            onMouseUp={commitUpdate}
                            className="w-full accent-blue-600"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Shape Properties */}
              {selectedEl.element_type === 'shape' && (
                <>
                  <div className="space-y-3 p-3 bg-gray-700 rounded-lg">
                    <label className="text-gray-300 text-sm font-medium block">Cor de Preenchimento</label>
                    <input
                      type="color"
                      value={selectedEl.fill_color}
                      onChange={(e) => updateElement(selectedEl.id, { fill_color: e.target.value })}
                      onBlur={commitUpdate}
                      className="w-full h-12 rounded cursor-pointer"
                    />
                  </div>

                  <div className="space-y-3 p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <label className="text-gray-300 text-sm font-medium">Raio da Borda</label>
                      <span className="text-blue-400 font-bold">{selectedEl.border_radius}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={selectedEl.border_radius}
                      onChange={(e) => updateElement(selectedEl.id, { border_radius: parseInt(e.target.value) })}
                      onMouseUp={commitUpdate}
                      className="w-full accent-blue-600"
                    />
                  </div>

                  <div className="space-y-3 p-3 bg-gray-700 rounded-lg">
                    <label className="flex items-center text-gray-300 text-sm font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedEl.shadow_enabled}
                        onChange={(e) => {
                          updateElement(selectedEl.id, { shadow_enabled: e.target.checked })
                          commitUpdate()
                        }}
                        className="mr-2 w-4 h-4 accent-blue-600"
                      />
                      Sombra
                    </label>
                  </div>
                </>
              )}

              {/* Common Properties */}
              <div className="space-y-3 p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <label className="text-gray-300 text-sm font-medium">Opacidade</label>
                  <span className="text-blue-400 font-bold">{Math.round(selectedEl.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={selectedEl.opacity}
                  onChange={(e) => updateElement(selectedEl.id, { opacity: parseFloat(e.target.value) })}
                  onMouseUp={commitUpdate}
                  className="w-full accent-blue-600"
                />
              </div>

              {/* Layers */}
              <div className="space-y-2 p-3 bg-gray-700 rounded-lg">
                <label className="text-gray-300 text-sm font-medium block">Ordem (Camadas)</label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => moveLayerUp(selectedEl.id)}
                    className="flex-1 px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 flex items-center justify-center transition-all"
                  >
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Frente
                  </button>
                  <button
                    onClick={() => moveLayerDown(selectedEl.id)}
                    className="flex-1 px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 flex items-center justify-center transition-all"
                  >
                    <ChevronDown className="w-4 h-4 mr-1" />
                    Trás
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-gray-700 space-y-2">
                <button
                  onClick={() => duplicateElement(selectedEl.id)}
                  className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center transition-all"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicar
                </button>
                <button
                  onClick={() => {
                    updateElement(selectedEl.id, { locked: !selectedEl.locked })
                    commitUpdate()
                  }}
                  className="w-full px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-500 flex items-center justify-center transition-all"
                >
                  {selectedEl.locked ? <Unlock className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                  {selectedEl.locked ? 'Desbloquear' : 'Bloquear'}
                </button>
                <button
                  onClick={() => deleteElement(selectedEl.id)}
                  className="w-full px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center transition-all"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400 flex flex-col items-center justify-center h-full">
              <FileText className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg font-medium mb-2">Selecione um elemento</p>
              <p className="text-sm text-gray-500">
                Clique em qualquer elemento para editá-lo
              </p>
              <div className="mt-6 text-left text-xs text-gray-500 space-y-1 bg-gray-700 p-4 rounded-lg">
                <p className="font-bold text-gray-300 mb-2">Elementos disponíveis:</p>
                <p>📝 {elements.filter(e => e.element_type === 'text').length} Textos</p>
                <p>📋 {elements.filter(e => e.element_type === 'field').length} Campos</p>
                <p>📊 {elements.filter(e => e.is_header).length} Cabeçalhos</p>
                <p>🦶 {elements.filter(e => e.is_footer).length} Rodapés</p>
                <p>🖼️ {elements.filter(e => e.element_type === 'logo').length} Logos</p>
                <p>📐 {elements.filter(e => e.element_type === 'shape').length} Formas</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Background Panel */}
      <AnimatePresence>
        {showBackgroundPanel && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute top-16 left-24 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-4 z-50"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold">Fundo do Canvas</h3>
              <button
                onClick={() => setShowBackgroundPanel(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-2">Tipo de Fundo</label>
                <select
                  value={canvasDesign.background_type}
                  onChange={(e) => setCanvasDesign({ ...canvasDesign, background_type: e.target.value as any })}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                >
                  <option value="solid">Cor Sólida</option>
                  <option value="gradient">Degradê</option>
                </select>
              </div>

              {canvasDesign.background_type === 'solid' && (
                <div>
                  <label className="text-gray-300 text-sm font-medium block mb-2">Cor</label>
                  <input
                    type="color"
                    value={canvasDesign.background_color}
                    onChange={(e) => setCanvasDesign({ ...canvasDesign, background_color: e.target.value })}
                    className="w-full h-12 rounded cursor-pointer"
                  />
                </div>
              )}

              {canvasDesign.background_type === 'gradient' && (
                <div>
                  <label className="text-gray-300 text-sm font-medium block mb-2">Degradê</label>
                  <div className="space-y-2">
                    <button
                      onClick={() => setCanvasDesign({
                        ...canvasDesign,
                        background_gradient: {
                          type: 'linear',
                          angle: 135,
                          stops: [
                            { color: '#ffffff', position: 0 },
                            { color: '#f3f4f6', position: 100 }
                          ]
                        }
                      })}
                      className="w-full px-4 py-3 bg-gradient-to-br from-white to-gray-100 text-gray-800 rounded border border-gray-300 hover:shadow-lg transition-all font-medium"
                    >
                      Branco → Cinza
                    </button>
                    <button
                      onClick={() => setCanvasDesign({
                        ...canvasDesign,
                        background_gradient: {
                          type: 'linear',
                          angle: 135,
                          stops: [
                            { color: '#2563eb', position: 0 },
                            { color: '#1e40af', position: 100 }
                          ]
                        }
                      })}
                      className="w-full px-4 py-3 bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded hover:shadow-lg transition-all font-medium"
                    >
                      Azul Corporativo
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Layers Panel */}
      <AnimatePresence>
        {showLayersPanel && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute top-16 left-24 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-4 z-50 max-h-96 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold">Camadas ({elements.length})</h3>
              <button
                onClick={() => setShowLayersPanel(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {elements.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">Nenhum elemento</p>
              ) : (
                [...elements].reverse().map((el) => {
                  const getIcon = () => {
                    if (el.element_type === 'header') return '📊'
                    if (el.element_type === 'footer') return '🦶'
                    if (el.element_type === 'logo') return '🖼️'
                    if (el.element_type === 'field') return '📋'
                    if (el.element_type === 'text') return '📝'
                    if (el.element_type === 'shape') return '📐'
                    return '❓'
                  }

                  const getLabel = () => {
                    if (el.is_header) return 'Cabeçalho'
                    if (el.is_footer) return 'Rodapé'
                    if (el.element_type === 'logo') return 'Logo'
                    if (el.element_type === 'field') return `Campo: ${el.field_name}`
                    if (el.content) return el.content.substring(0, 30)
                    return el.element_type
                  }

                  return (
                    <div
                      key={el.id}
                      onClick={() => setSelectedElement(el.id)}
                      className={`p-3 rounded cursor-pointer transition-all ${
                        selectedElement === el.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <span>{getIcon()}</span>
                          <span className="text-sm font-medium truncate">
                            {getLabel()}
                          </span>
                        </div>
                        {el.locked && <Lock className="w-3 h-3 flex-shrink-0" />}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
