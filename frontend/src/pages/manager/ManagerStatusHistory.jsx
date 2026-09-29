import { useEffect, useState } from 'react'

import { getManagerOperationalHistory } from '../../api/historyApi'
import { getRestaurantManagerProfile } from '../../api/managerApi'
import StatusHistoryPage from '../../components/history/StatusHistoryPage'
import ManagerLayout from '../../components/manager/ManagerLayout'


function ManagerStatusHistory() {
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    let isCancelled = false
    getRestaurantManagerProfile()
      .then((nextProfile) => {
        if (!isCancelled) setProfile(nextProfile)
      })
      .catch(() => {})
    return () => {
      isCancelled = true
    }
  }, [])

  return (
    <ManagerLayout profile={profile}>
      <StatusHistoryPage
        eyebrow="Restaurant management"
        title="Operational History"
        description="Review status changes only for restaurants assigned to your account."
        loadHistory={getManagerOperationalHistory}
      />
    </ManagerLayout>
  )
}


export default ManagerStatusHistory
