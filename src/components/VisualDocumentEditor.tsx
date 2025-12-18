import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
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
  X
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import jsPDF from 'jspdf'

interface CanvasElement {
  id: string
  element_type: 'text' | 'image' | 'shape' | 'icon' | 'line'
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
  document?: any
  onClose: () => void
  onSave: () => void
}

export default function VisualDocumentEditor({ document, onClose, onSave }: VisualDocumentEditorProps) {
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
  const [zoom, setZoom] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [history, setHistory] = useState<any[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [showBackgroundPanel, setShowBackgroundPanel] = useState(false)
  const [showElementPanel, setShowElementPanel] = useState(false)
  const [fonts, setFonts] = useState<any[]>([])

  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadFonts()
    if (document) {
      loadDesign()
    } else {
      addToHistory()
    }
  }, [document])

  const loadFonts = async () => {
    const { data } = await supabase
      .from('design_fonts')
      .select('*')
      .eq('is_active', true)
      .order('name')
    setFonts(data || [])
  }

  const loadDesign = async () => {
    if (!document) return

    const { data: design } = await supabase
      .from('document_canvas_designs')
      .select('*')
      .eq('document_id', document.id)
      .single()

    if (design) {
      setCanvasDesign(design)

      const { data: elementsData } = await supabase
        .from('document_canvas_elements')
        .select('*')
        .eq('design_id', design.id)
        .order('z_index')

      setElements(elementsData || [])
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
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1]
      setCanvasDesign(nextState.canvasDesign)
      setElements(nextState.elements)
      setHistoryIndex(historyIndex + 1)
    }
  }

  const addElement = (type: 'text' | 'shape' | 'image') => {
    const newElement: CanvasElement = {
      id: `elem-${Date.now()}`,
      element_type: type,
      x: 100,
      y: 100,
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
      text_align: 'left',
      fill_color: type === 'text' ? '#000000' : '#2563eb',
      border_radius: 0,
      shape_type: type === 'shape' ? 'rectangle' : undefined
    }

    setElements([...elements, newElement])
    setSelectedElement(newElement.id)
    addToHistory()
  }

  const updateElement = (id: string, updates: Partial<CanvasElement>) => {
    setElements(elements.map(el =>
      el.id === id ? { ...el, ...updates } : el
    ))
    addToHistory()
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

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (tool !== 'select' && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / zoom
      const y = (e.clientY - rect.top) / zoom

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

  const handleElementMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation()
    setSelectedElement(elementId)
    setIsDragging(true)
    setDragStart({
      x: e.clientX,
      y: e.clientY
    })
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
    setIsDragging(false)
    setIsResizing(false)
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

    const style: React.CSSProperties = {
      position: 'absolute',
      left: element.x,
      top: element.y,
      width: element.width,
      height: element.height,
      transform: `rotate(${element.rotation}deg)`,
      opacity: element.opacity,
      zIndex: element.z_index,
      cursor: element.locked ? 'not-allowed' : 'move',
      border: selectedElement === element.id ? '2px solid #2563eb' : 'none',
      boxSizing: 'border-box'
    }

    if (element.element_type === 'text') {
      return (
        <div
          key={element.id}
          style={{
            ...style,
            fontFamily: element.font_family,
            fontSize: element.font_size,
            fontWeight: element.font_weight,
            fontStyle: element.font_style,
            textAlign: element.text_align as any,
            lineHeight: element.line_height,
            color: element.fill_color,
            padding: '8px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}
          onMouseDown={(e) => handleElementMouseDown(e, element.id)}
          contentEditable={selectedElement === element.id && !element.locked}
          suppressContentEditableWarning
          onBlur={(e) => updateElement(element.id, { content: e.currentTarget.textContent || '' })}
        >
          {element.content}
        </div>
      )
    } else if (element.element_type === 'shape') {
      const shapeStyle: React.CSSProperties = {
        ...style,
        backgroundColor: element.fill_color,
        borderRadius: element.border_radius,
        border: element.border_width ? `${element.border_width}px solid ${element.border_color}` : 'none'
      }

      if (element.shadow_enabled) {
        shapeStyle.boxShadow = `${element.shadow_x}px ${element.shadow_y}px ${element.shadow_blur}px ${element.shadow_color}`
      }

      if (element.fill_gradient) {
        const grad = element.fill_gradient
        if (grad.type === 'linear') {
          const stops = grad.stops.map((s: any) => `${s.color} ${s.position}%`).join(', ')
          shapeStyle.background = `linear-gradient(${grad.angle}deg, ${stops})`
        }
      }

      return (
        <div
          key={element.id}
          style={shapeStyle}
          onMouseDown={(e) => handleElementMouseDown(e, element.id)}
        />
      )
    }

    return null
  }

  const handleSave = async () => {
    try {
      let designId = canvasDesign.id

      if (!designId) {
        const { data: newDesign, error: designError } = await supabase
          .from('document_canvas_designs')
          .insert([{
            document_id: document?.id,
            ...canvasDesign
          }])
          .select()
          .single()

        if (designError) throw designError
        designId = newDesign.id
        setCanvasDesign({ ...canvasDesign, id: designId })
      } else {
        await supabase
          .from('document_canvas_designs')
          .update(canvasDesign)
          .eq('id', designId)
      }

      await supabase
        .from('document_canvas_elements')
        .delete()
        .eq('design_id', designId)

      if (elements.length > 0) {
        await supabase
          .from('document_canvas_elements')
          .insert(elements.map(el => ({
            ...el,
            design_id: designId,
            id: undefined
          })))
      }

      alert('Design salvo com sucesso!')
      onSave()
    } catch (error) {
      console.error('Error saving design:', error)
      alert('Erro ao salvar design')
    }
  }

  const handleExportPDF = () => {
    const doc = new jsPDF({
      unit: 'pt',
      format: [canvasDesign.canvas_width, canvasDesign.canvas_height],
      orientation: canvasDesign.page_orientation
    })

    alert('Exportação de PDF em desenvolvimento')
  }

  const selectedEl = elements.find(el => el.id === selectedElement)

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col z-50">
      {/* Top Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 p-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onClose} className="text-white hover:text-gray-300">
            <X className="w-6 h-6" />
          </button>
          <h2 className="text-white font-bold text-lg">Editor Visual</h2>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="p-2 text-white hover:bg-gray-700 rounded disabled:opacity-50"
            title="Desfazer"
          >
            <Undo className="w-5 h-5" />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 text-white hover:bg-gray-700 rounded disabled:opacity-50"
            title="Refazer"
          >
            <Redo className="w-5 h-5" />
          </button>

          <div className="w-px h-8 bg-gray-700 mx-2"></div>

          <button
            onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
            className="p-2 text-white hover:bg-gray-700 rounded"
            title="Diminuir zoom"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-white text-sm px-2">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(Math.min(2, zoom + 0.25))}
            className="p-2 text-white hover:bg-gray-700 rounded"
            title="Aumentar zoom"
          >
            <ZoomIn className="w-5 h-5" />
          </button>

          <div className="w-px h-8 bg-gray-700 mx-2"></div>

          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Save className="w-5 h-5 mr-2" />
            Salvar
          </button>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
          >
            <Download className="w-5 h-5 mr-2" />
            PDF
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Tools */}
        <div className="w-20 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-4 space-y-2">
          <button
            onClick={() => setTool('select')}
            className={`p-3 rounded-lg ${tool === 'select' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
            title="Selecionar"
          >
            <Move className="w-6 h-6" />
          </button>
          <button
            onClick={() => setTool('text')}
            className={`p-3 rounded-lg ${tool === 'text' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
            title="Adicionar Texto"
          >
            <Type className="w-6 h-6" />
          </button>
          <button
            onClick={() => setTool('shape')}
            className={`p-3 rounded-lg ${tool === 'shape' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
            title="Adicionar Forma"
          >
            <Square className="w-6 h-6" />
          </button>
          <button
            onClick={() => setTool('image')}
            className={`p-3 rounded-lg ${tool === 'image' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
            title="Adicionar Imagem"
          >
            <ImageIcon className="w-6 h-6" />
          </button>

          <div className="h-px w-12 bg-gray-700 my-2"></div>

          <button
            onClick={() => setShowBackgroundPanel(!showBackgroundPanel)}
            className="p-3 rounded-lg text-gray-400 hover:bg-gray-700"
            title="Fundo"
          >
            <Palette className="w-6 h-6" />
          </button>
          <button
            onClick={() => setCanvasDesign({ ...canvasDesign, grid_enabled: !canvasDesign.grid_enabled })}
            className={`p-3 rounded-lg ${canvasDesign.grid_enabled ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
            title="Grade"
          >
            <Grid3x3 className="w-6 h-6" />
          </button>
          <button
            onClick={() => setShowElementPanel(!showElementPanel)}
            className="p-3 rounded-lg text-gray-400 hover:bg-gray-700"
            title="Camadas"
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
              width: canvasDesign.canvas_width * zoom,
              height: canvasDesign.canvas_height * zoom,
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
                    repeating-linear-gradient(0deg, transparent, transparent ${canvasDesign.grid_size - 1}px, rgba(0,0,0,0.1) ${canvasDesign.grid_size - 1}px, rgba(0,0,0,0.1) ${canvasDesign.grid_size}px),
                    repeating-linear-gradient(90deg, transparent, transparent ${canvasDesign.grid_size - 1}px, rgba(0,0,0,0.1) ${canvasDesign.grid_size - 1}px, rgba(0,0,0,0.1) ${canvasDesign.grid_size}px)
                  `
                }}
              />
            )}

            {elements.map(renderElement)}
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto">
          {selectedEl ? (
            <div className="p-4 space-y-4">
              <h3 className="text-white font-bold text-lg mb-4">Propriedades</h3>

              {/* Position & Size */}
              <div className="space-y-2">
                <label className="text-gray-300 text-sm font-medium block">Posição e Tamanho</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-400 text-xs">X</label>
                    <input
                      type="number"
                      value={selectedEl.x}
                      onChange={(e) => updateElement(selectedEl.id, { x: parseInt(e.target.value) })}
                      className="w-full px-2 py-1 bg-gray-700 text-white rounded border border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs">Y</label>
                    <input
                      type="number"
                      value={selectedEl.y}
                      onChange={(e) => updateElement(selectedEl.id, { y: parseInt(e.target.value) })}
                      className="w-full px-2 py-1 bg-gray-700 text-white rounded border border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs">Largura</label>
                    <input
                      type="number"
                      value={selectedEl.width}
                      onChange={(e) => updateElement(selectedEl.id, { width: parseInt(e.target.value) })}
                      className="w-full px-2 py-1 bg-gray-700 text-white rounded border border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs">Altura</label>
                    <input
                      type="number"
                      value={selectedEl.height}
                      onChange={(e) => updateElement(selectedEl.id, { height: parseInt(e.target.value) })}
                      className="w-full px-2 py-1 bg-gray-700 text-white rounded border border-gray-600"
                    />
                  </div>
                </div>
              </div>

              {/* Text Properties */}
              {selectedEl.element_type === 'text' && (
                <>
                  <div className="space-y-2">
                    <label className="text-gray-300 text-sm font-medium block">Fonte</label>
                    <select
                      value={selectedEl.font_family}
                      onChange={(e) => updateElement(selectedEl.id, { font_family: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
                    >
                      {fonts.map(font => (
                        <option key={font.id} value={font.font_family}>{font.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-gray-300 text-sm font-medium block">Tamanho</label>
                    <input
                      type="range"
                      min="8"
                      max="120"
                      value={selectedEl.font_size}
                      onChange={(e) => updateElement(selectedEl.id, { font_size: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <div className="text-gray-400 text-xs text-center">{selectedEl.font_size}px</div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-gray-300 text-sm font-medium block">Estilo</label>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => updateElement(selectedEl.id, {
                          font_weight: selectedEl.font_weight === 'bold' ? 'normal' : 'bold'
                        })}
                        className={`flex-1 p-2 rounded ${selectedEl.font_weight === 'bold' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                      >
                        <Bold className="w-4 h-4 mx-auto" />
                      </button>
                      <button
                        onClick={() => updateElement(selectedEl.id, {
                          font_style: selectedEl.font_style === 'italic' ? 'normal' : 'italic'
                        })}
                        className={`flex-1 p-2 rounded ${selectedEl.font_style === 'italic' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                      >
                        <Italic className="w-4 h-4 mx-auto" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-gray-300 text-sm font-medium block">Alinhamento</label>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => updateElement(selectedEl.id, { text_align: 'left' })}
                        className={`flex-1 p-2 rounded ${selectedEl.text_align === 'left' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                      >
                        <AlignLeft className="w-4 h-4 mx-auto" />
                      </button>
                      <button
                        onClick={() => updateElement(selectedEl.id, { text_align: 'center' })}
                        className={`flex-1 p-2 rounded ${selectedEl.text_align === 'center' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                      >
                        <AlignCenter className="w-4 h-4 mx-auto" />
                      </button>
                      <button
                        onClick={() => updateElement(selectedEl.id, { text_align: 'right' })}
                        className={`flex-1 p-2 rounded ${selectedEl.text_align === 'right' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                      >
                        <AlignRight className="w-4 h-4 mx-auto" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-gray-300 text-sm font-medium block">Cor do Texto</label>
                    <input
                      type="color"
                      value={selectedEl.fill_color}
                      onChange={(e) => updateElement(selectedEl.id, { fill_color: e.target.value })}
                      className="w-full h-10 rounded cursor-pointer"
                    />
                  </div>
                </>
              )}

              {/* Shape Properties */}
              {selectedEl.element_type === 'shape' && (
                <>
                  <div className="space-y-2">
                    <label className="text-gray-300 text-sm font-medium block">Cor de Preenchimento</label>
                    <input
                      type="color"
                      value={selectedEl.fill_color}
                      onChange={(e) => updateElement(selectedEl.id, { fill_color: e.target.value })}
                      className="w-full h-10 rounded cursor-pointer"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-gray-300 text-sm font-medium block">Raio da Borda</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={selectedEl.border_radius}
                      onChange={(e) => updateElement(selectedEl.id, { border_radius: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <div className="text-gray-400 text-xs text-center">{selectedEl.border_radius}px</div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center text-gray-300 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={selectedEl.shadow_enabled}
                        onChange={(e) => updateElement(selectedEl.id, { shadow_enabled: e.target.checked })}
                        className="mr-2"
                      />
                      Sombra
                    </label>
                  </div>
                </>
              )}

              {/* Common Properties */}
              <div className="space-y-2">
                <label className="text-gray-300 text-sm font-medium block">Rotação</label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={selectedEl.rotation}
                  onChange={(e) => updateElement(selectedEl.id, { rotation: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="text-gray-400 text-xs text-center">{selectedEl.rotation}°</div>
              </div>

              <div className="space-y-2">
                <label className="text-gray-300 text-sm font-medium block">Opacidade</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={selectedEl.opacity}
                  onChange={(e) => updateElement(selectedEl.id, { opacity: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <div className="text-gray-400 text-xs text-center">{Math.round(selectedEl.opacity * 100)}%</div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-gray-700 space-y-2">
                <button
                  onClick={() => duplicateElement(selectedEl.id)}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 flex items-center justify-center"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicar
                </button>
                <button
                  onClick={() => updateElement(selectedEl.id, { locked: !selectedEl.locked })}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 flex items-center justify-center"
                >
                  {selectedEl.locked ? <Unlock className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                  {selectedEl.locked ? 'Desbloquear' : 'Bloquear'}
                </button>
                <button
                  onClick={() => deleteElement(selectedEl.id)}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-gray-400">
              <p className="mb-4">Selecione um elemento para editar</p>
              <p className="text-sm">ou</p>
              <p className="text-sm mt-2">Clique em uma ferramenta e no canvas para adicionar</p>
            </div>
          )}
        </div>
      </div>

      {/* Background Panel */}
      {showBackgroundPanel && (
        <div className="absolute top-16 left-24 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-4 z-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold">Fundo do Canvas</h3>
            <button onClick={() => setShowBackgroundPanel(false)} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-gray-300 text-sm font-medium block mb-2">Tipo de Fundo</label>
              <select
                value={canvasDesign.background_type}
                onChange={(e) => setCanvasDesign({ ...canvasDesign, background_type: e.target.value as any })}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
              >
                <option value="solid">Cor Sólida</option>
                <option value="gradient">Degradê</option>
                <option value="image">Imagem</option>
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
                    className="w-full px-4 py-2 bg-gradient-to-br from-white to-gray-100 text-gray-800 rounded border border-gray-300"
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
                    className="w-full px-4 py-2 bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded"
                  >
                    Azul
                  </button>
                  <button
                    onClick={() => setCanvasDesign({
                      ...canvasDesign,
                      background_gradient: {
                        type: 'linear',
                        angle: 135,
                        stops: [
                          { color: '#10b981', position: 0 },
                          { color: '#059669', position: 100 }
                        ]
                      }
                    })}
                    className="w-full px-4 py-2 bg-gradient-to-br from-green-500 to-green-600 text-white rounded"
                  >
                    Verde
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
