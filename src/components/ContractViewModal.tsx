import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, Download, Printer, Check } from 'lucide-react'
import { fillContractTemplate, getDefaultTemplate } from '../utils/contractFiller'
import jsPDF from 'jspdf'

interface ContractViewModalProps {
  isOpen: boolean
  onClose: () => void
  serviceOrderId: string
  templateId?: string
}

const ContractViewModal: React.FC<ContractViewModalProps> = ({
  isOpen,
  onClose,
  serviceOrderId,
  templateId
}) => {
  const [loading, setLoading] = useState(true)
  const [contract, setContract] = useState<any>(null)

  useEffect(() => {
    if (isOpen && serviceOrderId) {
      loadContract()
    }
  }, [isOpen, serviceOrderId, templateId])

  const loadContract = async () => {
    try {
      setLoading(true)

      let templateToUse = templateId
      if (!templateToUse) {
        const defaultTemplate = await getDefaultTemplate()
        templateToUse = defaultTemplate?.id
      }

      if (!templateToUse) {
        alert('Nenhum template de contrato disponível')
        onClose()
        return
      }

      const filledContract = await fillContractTemplate(templateToUse, {
        serviceOrderId
      })

      if (!filledContract) {
        alert('Erro ao preencher contrato')
        onClose()
        return
      }

      setContract(filledContract)
    } catch (error) {
      console.error('Error loading contract:', error)
      alert('Erro ao carregar contrato')
    } finally {
      setLoading(false)
    }
  }

  const generatePDF = () => {
    if (!contract) return

    const doc = new jsPDF()
    const margin = 15
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    const maxWidth = pageWidth - 2 * margin
    let yPosition = margin

    const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
      doc.setFontSize(fontSize)
      doc.setFont('helvetica', isBold ? 'bold' : 'normal')

      const lines = doc.splitTextToSize(text, maxWidth)

      lines.forEach((line: string) => {
        if (yPosition > pageHeight - margin) {
          doc.addPage()
          yPosition = margin
        }
        doc.text(line, margin, yPosition)
        yPosition += fontSize * 0.5
      })
      yPosition += 3
    }

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('CONTRATO DE PRESTAÇÃO DE SERVIÇOS', pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 15

    if (contract.contract_text) {
      addText(contract.contract_text, 10)
      yPosition += 5
    }

    if (contract.contract_clauses) {
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('CLÁUSULAS CONTRATUAIS', margin, yPosition)
      yPosition += 7
      addText(contract.contract_clauses, 10)
      yPosition += 5
    }

    if (contract.warranty_terms) {
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('TERMOS DE GARANTIA', margin, yPosition)
      yPosition += 7
      addText(contract.warranty_terms, 10)
      yPosition += 5
    }

    if (contract.payment_conditions) {
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('CONDIÇÕES DE PAGAMENTO', margin, yPosition)
      yPosition += 7
      addText(contract.payment_conditions, 10)
      yPosition += 5
    }

    if (contract.bank_details_template) {
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('DADOS BANCÁRIOS', margin, yPosition)
      yPosition += 7
      addText(contract.bank_details_template, 10)
      yPosition += 10
    }

    if (yPosition > pageHeight - 50) {
      doc.addPage()
      yPosition = margin
    }

    yPosition += 10
    doc.setFontSize(10)
    doc.text('_________________________________________', margin, yPosition)
    doc.text('CONTRATANTE', margin + 30, yPosition + 5)

    doc.text('_________________________________________', pageWidth / 2 + 10, yPosition)
    doc.text('CONTRATADA', pageWidth / 2 + 40, yPosition + 5)

    yPosition += 15
    const currentDate = new Date().toLocaleDateString('pt-BR')
    doc.setFontSize(9)
    doc.text(`Data: ${currentDate}`, pageWidth / 2, yPosition, { align: 'center' })

    doc.save(`contrato-${serviceOrderId.substring(0, 8)}.pdf`)
  }

  const handlePrint = () => {
    window.print()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6" />
              <h2 className="text-xl font-bold">Contrato de Prestação de Serviços</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">Carregando contrato...</p>
            </div>
          ) : contract ? (
            <>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] print:overflow-visible print:max-h-none">
                <div className="prose max-w-none">
                  <div className="bg-gray-50 rounded-lg p-6 mb-6 border-2 border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Contrato Principal
                    </h3>
                    <div className="whitespace-pre-wrap text-sm text-gray-800">
                      {contract.contract_text}
                    </div>
                  </div>

                  {contract.contract_clauses && (
                    <div className="bg-purple-50 rounded-lg p-6 mb-6 border-2 border-purple-200">
                      <h3 className="text-lg font-bold text-purple-900 mb-4">Cláusulas Contratuais</h3>
                      <div className="whitespace-pre-wrap text-sm text-purple-800">
                        {contract.contract_clauses}
                      </div>
                    </div>
                  )}

                  {contract.warranty_terms && (
                    <div className="bg-green-50 rounded-lg p-6 mb-6 border-2 border-green-200">
                      <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                        <Check className="h-5 w-5" />
                        Termos de Garantia
                      </h3>
                      <div className="whitespace-pre-wrap text-sm text-green-800">
                        {contract.warranty_terms}
                      </div>
                    </div>
                  )}

                  {contract.payment_conditions && (
                    <div className="bg-orange-50 rounded-lg p-6 mb-6 border-2 border-orange-200">
                      <h3 className="text-lg font-bold text-orange-900 mb-4">Condições de Pagamento</h3>
                      <div className="whitespace-pre-wrap text-sm text-orange-800">
                        {contract.payment_conditions}
                      </div>
                    </div>
                  )}

                  {contract.bank_details_template && (
                    <div className="bg-blue-50 rounded-lg p-6 mb-6 border-2 border-blue-200">
                      <h3 className="text-lg font-bold text-blue-900 mb-4">Dados Bancários</h3>
                      <div className="whitespace-pre-wrap text-sm text-blue-800">
                        {contract.bank_details_template}
                      </div>
                    </div>
                  )}

                  <div className="mt-8 pt-8 border-t-2 border-gray-300">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="text-center">
                        <div className="border-t-2 border-gray-400 pt-2 mb-2"></div>
                        <p className="text-sm font-semibold text-gray-700">CONTRATANTE</p>
                      </div>
                      <div className="text-center">
                        <div className="border-t-2 border-gray-400 pt-2 mb-2"></div>
                        <p className="text-sm font-semibold text-gray-700">CONTRATADA</p>
                      </div>
                    </div>
                    <p className="text-center text-xs text-gray-500 mt-6">
                      Data: {new Date().toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t print:hidden">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir
                </button>
                <button
                  onClick={generatePDF}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Baixar PDF
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </>
          ) : (
            <div className="p-12 text-center">
              <p className="text-gray-600">Erro ao carregar contrato</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default ContractViewModal
