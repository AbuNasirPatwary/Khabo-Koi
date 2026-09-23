// =============================================================================
// ManagerLayout — Root layout for all manager portal pages
// Wraps pages with persistent Sidebar + Header
// =============================================================================

import { useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'

import Sidebar from './Sidebar'
import Header from './Header'
import { ToastProvider } from '../components/ui/Toast'


export default function ManagerLayout() {
    const [collapsed, setCollapsed] = useState(false)

    // Guard — redirect to login if no manager token
    const token = localStorage.getItem('manager_token')
    if (!token) {
        return <Navigate to="/manager/login" replace />
    }

    return (
        <ToastProvider>
            <div className="flex min-h-screen bg-[#f8f7f4]">

                {/* Sidebar */}
                <Sidebar
                    collapsed={collapsed}
                    onToggle={() => setCollapsed(v => !v)}
                />

                {/* Main area */}
                <div className="flex flex-col flex-1 min-w-0">

                    {/* Top header */}
                    <Header />

                    {/* Page content */}
                    <main className="flex-1 p-6 overflow-auto">
                        <Outlet />
                    </main>

                </div>
            </div>
        </ToastProvider>
    )
}
