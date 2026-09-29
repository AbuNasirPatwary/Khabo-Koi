import { getBranchManagerOperationalHistory } from '../../api/historyApi'
import BranchManagerLayout from '../../components/branchManager/BranchManagerLayout'
import useBranchManagerShell from '../../components/branchManager/useBranchManagerShell'
import StatusHistoryPage from '../../components/history/StatusHistoryPage'


function BranchManagerStatusHistory() {
  const { profile, branch } = useBranchManagerShell()

  return (
    <BranchManagerLayout profile={profile} branch={branch}>
      <StatusHistoryPage
        eyebrow="Branch management"
        title="Operational History"
        description="Review reservation and pre-order status changes only for your assigned branch."
        loadHistory={getBranchManagerOperationalHistory}
      />
    </BranchManagerLayout>
  )
}


export default BranchManagerStatusHistory
