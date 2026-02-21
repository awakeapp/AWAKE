import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/system/ErrorBoundary'
import './index.css'

import { GlobalErrorProvider } from './context/GlobalErrorContext'

console.log("BUILD VERIFICATION:", { commit: "ef51132", timestamp: new Date().toISOString() });


ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <GlobalErrorProvider>
                <App />
            </GlobalErrorProvider>
        </ErrorBoundary>
    </React.StrictMode>,
)
