import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, Check, Save, ArrowLeft, ArrowRight } from 'lucide-react';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  title: string;
  children: React.ReactNode;
  showControls?: boolean;
  currentStep?: number;
  totalSteps?: number;
  onPrevStep?: () => void;
  onNextStep?: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  onSave,
  title,
  children,
  showControls = true,
  currentStep,
  totalSteps,
  onPrevStep,
  onNextStep
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white rounded-xl p-6 w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-blue-500" />
                <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              </div>
              <button onClick={onClose}>
                <X className="h-6 w-6 text-gray-400" />
              </button>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-6">
              {children}
            </div>
            
            {showControls && (
              <div className="flex justify-between items-center">
                {currentStep !== undefined && totalSteps !== undefined ? (
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={onPrevStep}
                      disabled={currentStep <= 0}
                      className={`flex items-center space-x-1 px-4 py-2 rounded-lg ${
                        currentStep <= 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Anterior</span>
                    </button>
                    
                    <div className="text-sm text-gray-500">
                      Passo {currentStep + 1} de {totalSteps}
                    </div>
                    
                    <button
                      onClick={onNextStep}
                      disabled={currentStep >= totalSteps - 1}
                      className={`flex items-center space-x-1 px-4 py-2 rounded-lg ${
                        currentStep >= totalSteps - 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span>Próximo</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div></div>
                )}
                
                <div className="flex space-x-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Fechar
                  </button>
                  
                  {onSave && (
                    <button
                      onClick={onSave}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
                    >
                      <Save className="h-4 w-4" />
                      <span>Salvar Alterações</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PreviewModal;