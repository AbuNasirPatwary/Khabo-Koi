import { useEffect, useState } from 'react'

import { getPlatformAdminProfile } from '../../api/adminApi'
import { getAdminOperationalHistory } from '../../api/historyApi'
import AdminLayout from '../../components/admin/AdminLayout'
import StatusHistoryPage from '../../components/history/StatusHistoryPage'


function AdminStatusHistory() {
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    let isCancelled = false
    getPlatformAdminProfile()
      .then((nextProfile) => {
        if (!isCancelled) setProfile(nextProfile)
      })
      .catch(() => {})
    return () => {
      isCancelled = true
    }
  }, [])

  return (
    <AdminLayout profile={profile}>
      <StatusHistoryPage
        eyebrow="Platform administration"
        title="Operational History"
        description="Review reservation and food pre-order status changes across the platform, including who made each change and when."
        loadHistory={getAdminOperationalHistory}
      />
    </AdminLayout>
  )
}


export default AdminStatusHistory
