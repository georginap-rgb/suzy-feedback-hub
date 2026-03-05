import { HashRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { FeedbackProvider } from './contexts/FeedbackContext'
import Header from './components/layout/Header'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'

export default function App() {
  return (
    <ThemeProvider>
      <FeedbackProvider>
        <HashRouter>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
            <Header />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </div>
        </HashRouter>
      </FeedbackProvider>
    </ThemeProvider>
  )
}
