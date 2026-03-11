import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ArrowRight, Check } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  version: string;
  category: 'new' | 'improved' | 'beta';
  link?: string;
}

const newFeatures: Feature[] = [
  {
    id: 'skeleton-loading',
    title: 'Carregamento Inteligente',
    description: 'Novos indicadores de carregamento com skeleton screens para uma experiência mais fluida.',
    version: '1.0.0',
    category: 'new',
  },
  {
    id: 'haptic-feedback',
    title: 'Feedback Tátil',
    description: 'Vibrações suaves ao realizar ações importantes no aplicativo mobile.',
    version: '1.0.0',
    category: 'new',
  },
  {
    id: 'swipe-gestures',
    title: 'Gestos de Deslize',
    description: 'Navegue entre páginas deslizando para os lados. Experimente na lista de ordens de serviço!',
    version: '1.0.0',
    category: 'new',
  },
  {
    id: 'pull-to-refresh',
    title: 'Puxar para Atualizar',
    description: 'Puxe a tela para baixo em qualquer lista para atualizar os dados.',
    version: '1.0.0',
    category: 'new',
  },
  {
    id: 'tooltips',
    title: 'Dicas Contextuais',
    description: 'Passe o mouse sobre ícones e botões para ver dicas úteis sobre suas funcionalidades.',
    version: '1.0.0',
    category: 'improved',
  },
];

export const FeatureDiscovery: React.FC = () => {
  const [dismissedFeatures, setDismissedFeatures] = useLocalStorage<string[]>('dismissed_features', []);
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const unviewedFeatures = newFeatures.filter((f) => !dismissedFeatures.includes(f.id));

  useEffect(() => {
    if (unviewedFeatures.length > 0) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [unviewedFeatures.length]);

  const handleDismiss = () => {
    const currentFeature = unviewedFeatures[currentFeatureIndex];
    if (currentFeature) {
      setDismissedFeatures([...dismissedFeatures, currentFeature.id]);
    }
    setIsVisible(false);
    setCurrentFeatureIndex(0);
  };

  const handleNext = () => {
    const currentFeature = unviewedFeatures[currentFeatureIndex];
    if (currentFeature) {
      setDismissedFeatures([...dismissedFeatures, currentFeature.id]);
    }

    if (currentFeatureIndex < unviewedFeatures.length - 1) {
      setCurrentFeatureIndex(currentFeatureIndex + 1);
    } else {
      setIsVisible(false);
      setCurrentFeatureIndex(0);
    }
  };

  const handleViewAll = () => {
    setIsVisible(false);
  };

  if (unviewedFeatures.length === 0 || !isVisible) return null;

  const currentFeature = unviewedFeatures[currentFeatureIndex];
  const categoryColors = {
    new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    improved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    beta: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  };

  const categoryLabels = {
    new: 'Novo',
    improved: 'Melhorado',
    beta: 'Beta',
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
            onClick={handleDismiss}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed bottom-4 right-4 md:bottom-8 md:right-8 w-[calc(100%-2rem)] md:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-[9999] overflow-hidden"
          >
            <div className="relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Novidades
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {currentFeatureIndex + 1} de {unviewedFeatures.length}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleDismiss}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="mb-4">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-3 ${
                      categoryColors[currentFeature.category]
                    }`}
                  >
                    {categoryLabels[currentFeature.category]}
                  </span>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {currentFeature.title}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {currentFeature.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  {unviewedFeatures.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1.5 rounded-full flex-1 transition-colors ${
                        index === currentFeatureIndex
                          ? 'bg-blue-600'
                          : index < currentFeatureIndex
                          ? 'bg-green-500'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex gap-3">
                  {currentFeatureIndex < unviewedFeatures.length - 1 ? (
                    <>
                      <button
                        onClick={handleViewAll}
                        className="flex-1 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
                      >
                        Ver tudo
                      </button>
                      <button
                        onClick={handleNext}
                        className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        Próximo
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleNext}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Entendi
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
