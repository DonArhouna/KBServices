import React from 'react'
import ReactDOM from 'react-dom/client'

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>KB&S - Site en cours de maintenance</h1>
      <p>Le site sera bientôt de retour en ligne.</p>
      <p>Pour toute urgence, contactez-nous au : <strong>+221 XX XXX XX XX</strong></p>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)