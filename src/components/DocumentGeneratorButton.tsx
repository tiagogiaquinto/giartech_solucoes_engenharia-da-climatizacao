import { useState } from 'react'
import { FileText } from 'lucide-react'
import TemplateSelectorModal from './TemplateSelectorModal'
import { TemplateData } from '../services/templateFillService'

interface DocumentGeneratorButtonProps {
  templateType: string
  data: TemplateData
  onGenerate?: (html: string, template: any) => void
  label?: string
  className?: string
  disabled?: boolean
}

const DocumentGeneratorButton = ({
  templateType,
  data,
  onGenerate,
  label = 'Gerar Documento',
  className = '',
  disabled = false
}: DocumentGeneratorButtonProps) => {
  const [showSelector, setShowSelector] = useState(false)

  const handleSelect = (filledHtml: string, template: any) => {
    if (onGenerate) {
      onGenerate(filledHtml, template)
    } else {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${template.name}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                @media print { body { margin: 0; } }
              </style>
            </head>
            <body>
              ${filledHtml}
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    }
    setShowSelector(false)
  }

  return (
    <>
      <button
        onClick={() => setShowSelector(true)}
        disabled={disabled}
        className={className || 'px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'}
      >
        <FileText className="w-4 h-4" />
        <span>{label}</span>
      </button>

      {showSelector && (
        <TemplateSelectorModal
          isOpen={showSelector}
          onClose={() => setShowSelector(false)}
          templateType={templateType}
          data={data}
          onSelect={handleSelect}
        />
      )}
    </>
  )
}

export default DocumentGeneratorButton
