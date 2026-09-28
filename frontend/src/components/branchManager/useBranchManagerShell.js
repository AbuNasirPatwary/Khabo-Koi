
import { useEffect, useState } from 'react'
import {
  getBranchManagerContext,
  getBranchManagerProfile,
} from '../../api/branchManagerApi'

export default function useBranchManagerShell() {
  const [profile, setProfile] = useState(null)
  const [branch, setBranch] = useState(null)
  const [shellError, setShellError] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([getBranchManagerProfile(), getBranchManagerContext()])
      .then(([profileData, branchData]) => {
        if (!cancelled) {
          setProfile(profileData)
          setBranch(branchData)
        }
      })
      .catch((error) => {
        if (!cancelled) setShellError(error.message)
      })
    return () => { cancelled = true }
  }, [])

  return { profile, branch, setBranch, shellError }
}
