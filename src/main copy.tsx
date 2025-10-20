import React from 'react'
import ReactDOM from 'react-dom/client'

// Placeholder principal
const App = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Sistema de Geração de PDF - Ordem de Serviço</h1>
      <p>O gerador de PDF foi criado em: <code>/src/utils/generateServiceOrderPDF.ts</code></p>
      <p>Consulte o arquivo <code>SISTEMA_ORDEM_SERVICO_PDF.md</code> para instruções de uso.</p>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
