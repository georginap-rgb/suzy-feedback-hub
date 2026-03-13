import { HashRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { FeedbackProvider } from './contexts/FeedbackContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Header from './components/layout/Header'
import AdminGuard from './components/layout/AdminGuard'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import Login from './pages/Login'

function AppRoutes() {
  const { user } = useAuth()

  if (user === undefined) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-950" />
  }

  if (!user) return <Login />

  return (
    <FeedbackProvider>
      <HashRouter>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
          <Header />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/admin" element={<AdminGuard><Admin /></AdminGuard>} />
          </Routes>
        </div>
      </HashRouter>
    </FeedbackProvider>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  )
}
