import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/system/ErrorBoundary'
import './index.css'
import './i18n'

import { GlobalErrorProvider } from './context/GlobalErrorContext'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <GlobalErrorProvider>
                <App />
            </GlobalErrorProvider>
        </ErrorBoundary>
    </React.StrictMode>,
)
