import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/system/ErrorBoundary'
import './index.css'

import { GlobalErrorProvider } from './context/GlobalErrorContext'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        {console.log("VERSION: DEBUG_001_FIXED_CONTEXTS")}
        <ErrorBoundary>
            <GlobalErrorProvider>
                <App />
            </GlobalErrorProvider>
        </ErrorBoundary>
    </React.StrictMode>,
)
