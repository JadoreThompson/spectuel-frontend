import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router'
import AuthGuard from './components/AuthGuard'

import CloneTradingPage from './pages/CloneTradingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import TradingPage from './pages/TradingPage'
import UserOverviewPage from './pages/UserOverviewPage'

const queryClient = new QueryClient()

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Routes>
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route
                        path="/user"
                        element={<AuthGuard children={<UserOverviewPage />} />}
                    />
                    <Route path="/spot/:symbol" element={<TradingPage />} />
                    <Route path="/demo" element={<CloneTradingPage />} />
                </Routes>
            </BrowserRouter>
        </QueryClientProvider>
    )
}

export default App
