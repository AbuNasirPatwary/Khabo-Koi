import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'

import { getPlatformAdminProfile } from '../../api/adminApi'


function ProtectedAdminRoute({ children }) {
  const [accessState, setAccessState] = useState({
    isChecking: true,
    isAuthorized: false,
    message: '',
  })

  useEffect(() => {
    let isCancelled = false

    getPlatformAdminProfile()
      .then(() => {
        if (!isCancelled) {
          setAccessState({
            isChecking: false,
            isAuthorized: true,
            message: '',
          })
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          setAccessState({
            isChecking: false,
            isAuthorized: false,
            message: error.message,
          })
        }
      })

    return () => {
      isCancelled = true
    }
  }, [])

  if (accessState.isChecking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f2e9]">
        <div className="rounded-2xl bg-white px-8 py-7 text-center shadow-sm">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />
          <p className="mt-4 text-sm font-medium text-slate-600">
            Verifying Platform Admin access...
          </p>
        </div>
      </main>
    )
  }

  if (!accessState.isAuthorized) {
    return (
      <Navigate
        to="/platform-admin/login"
        replace
        state={{ message: accessState.message }}
      />
    )
  }

  return children
}


export default ProtectedAdminRoute
