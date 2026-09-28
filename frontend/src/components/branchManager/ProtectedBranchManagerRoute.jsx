
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  BRANCH_MANAGER_AUTH_EXPIRED_EVENT,
  getBranchManagerContext,
  getBranchManagerProfile,
} from '../../api/branchManagerApi'

function ProtectedBranchManagerRoute({ children }) {
  const [state, setState] = useState({ checking: true, ok: false, message: '' })

  useEffect(() => {
    let cancelled = false
    const deny = (message) => {
      if (!cancelled) setState({ checking: false, ok: false, message })
    }
    const expired = () => deny('Your Branch Manager session has expired. Please sign in again.')
    window.addEventListener(BRANCH_MANAGER_AUTH_EXPIRED_EVENT, expired)

    Promise.all([getBranchManagerProfile(), getBranchManagerContext()])
      .then(() => {
        if (!cancelled) setState({ checking: false, ok: true, message: '' })
      })
      .catch((error) => deny(error.message))

    return () => {
      cancelled = true
      window.removeEventListener(BRANCH_MANAGER_AUTH_EXPIRED_EVENT, expired)
    }
  }, [])

  if (state.checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FDF8F0]">
        <div className="rounded-2xl bg-white px-8 py-7 text-center shadow-sm">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />
          <p className="mt-4 text-sm font-medium text-slate-600">Verifying Branch Manager access...</p>
        </div>
      </main>
    )
  }

  if (!state.ok) {
    return <Navigate to="/branch-manager/login" replace state={{ message: state.message }} />
  }

  return children
}

export default ProtectedBranchManagerRoute
