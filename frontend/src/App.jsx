import RestaurantDetails from './pages/RestaurantDetails'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import Home from './pages/Home'
import Restaurants from './pages/Restaurants'
import BrowseFood from './pages/BrowseFood'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import MyBookings from './pages/MyBookings'
import FoodPreorderPayment from './pages/FoodPreorderPayment'
import BookingConfirmation from './pages/BookingConfirmation'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import NotFound from './pages/NotFound'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminBookings from './pages/admin/AdminBookings'
import AdminLogin from './pages/admin/AdminLogin'
import AdminManagerAssignments from './pages/admin/AdminManagerAssignments'
import AdminRestaurants from './pages/admin/AdminRestaurants'
import AdminUsers from './pages/admin/AdminUsers'
import AdminStatusHistory from './pages/admin/AdminStatusHistory'
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute'

import ManagerDashboard from './pages/manager/ManagerDashboard'
import ManagerLogin from './pages/manager/ManagerLogin'
import ManagerRestaurantProfile from './pages/manager/ManagerRestaurantProfile'
import ManagerReservations from './pages/manager/ManagerReservations'
import ManagerTables from './pages/manager/ManagerTables'
import ManagerMenu from './pages/manager/ManagerMenu'
import ManagerBranches from './pages/manager/ManagerBranches'
import ManagerStatusHistory from './pages/manager/ManagerStatusHistory'
import ProtectedManagerRoute from './components/manager/ProtectedManagerRoute'
import AdminBranchManagerAssignments from './pages/admin/AdminBranchManagerAssignments'
import BranchManagerLogin from './pages/branchManager/BranchManagerLogin'
import BranchManagerDashboard from './pages/branchManager/BranchManagerDashboard'
import BranchManagerReservations from './pages/branchManager/BranchManagerReservations'
import BranchManagerPreorders from './pages/branchManager/BranchManagerPreorders'
import BranchManagerTables from './pages/branchManager/BranchManagerTables'
import BranchManagerMenu from './pages/branchManager/BranchManagerMenu'
import BranchManagerProfile from './pages/branchManager/BranchManagerProfile'
import BranchManagerNotifications from './pages/branchManager/BranchManagerNotifications'
import BranchManagerStatusHistory from './pages/branchManager/BranchManagerStatusHistory'
import ProtectedBranchManagerRoute from './components/branchManager/ProtectedBranchManagerRoute'
import AIDiningAssistant from './pages/AIDiningAssistant'


function App() {

  return (

    <BrowserRouter>

      <Routes>

        {/* CUSTOMER */}

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/restaurants"
          element={<Restaurants />}
        />

        <Route
          path="/restaurants/:id"
          element={<RestaurantDetails />}
        />

        <Route
          path="/browse-food"
          element={<BrowseFood />}
        />

        <Route
          path="/ai-assistant"
          element={<AIDiningAssistant />}
        />

        <Route
          path="/booking/:bookingId/preorder"
          element={<FoodPreorderPayment />}
        />

        <Route
          path="/booking/:bookingId/confirmation"
          element={<BookingConfirmation />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        <Route
          path="/verify-email"
          element={<VerifyEmail />}
        />

        <Route
          path="/my-bookings"
          element={<MyBookings />}
        />

        <Route
          path="/profile"
          element={<Profile />}
        />


        {/* PLATFORM ADMIN */}

        <Route
          path="/platform-admin/login"
          element={<AdminLogin />}
        />

        <Route
          path="/platform-admin/dashboard"
          element={(
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          )}
        />

        <Route
          path="/platform-admin/users"
          element={(
            <ProtectedAdminRoute>
              <AdminUsers />
            </ProtectedAdminRoute>
          )}
        />

        <Route
          path="/platform-admin/restaurants"
          element={(
            <ProtectedAdminRoute>
              <AdminRestaurants />
            </ProtectedAdminRoute>
          )}
        />

        <Route
          path="/platform-admin/manager-assignments"
          element={(
            <ProtectedAdminRoute>
              <AdminManagerAssignments />
            </ProtectedAdminRoute>
          )}
        />

        <Route
          path="/platform-admin/bookings"
          element={(
            <ProtectedAdminRoute>
              <AdminBookings />
            </ProtectedAdminRoute>
          )}
        />

        <Route
          path="/platform-admin/operations/history"
          element={(
            <ProtectedAdminRoute>
              <AdminStatusHistory />
            </ProtectedAdminRoute>
          )}
        />


        {/* RESTAURANT MANAGER */}

        <Route
          path="/manager/login"
          element={<ManagerLogin />}
        />

        <Route
          path="/manager"
          element={
            <Navigate
              to="/manager/dashboard"
              replace
            />
          }
        />

        <Route
          path="/manager/dashboard"
          element={(
            <ProtectedManagerRoute>
              <ManagerDashboard />
            </ProtectedManagerRoute>
          )}
        />

        <Route
          path="/manager/restaurant-profile"
          element={(
            <ProtectedManagerRoute>
              <ManagerRestaurantProfile />
            </ProtectedManagerRoute>
          )}
        />

        <Route
          path="/manager/reservations"
          element={(
            <ProtectedManagerRoute>
              <ManagerReservations />
            </ProtectedManagerRoute>
          )}
        />

        <Route
          path="/manager/tables"
          element={(
            <ProtectedManagerRoute>
              <ManagerTables />
            </ProtectedManagerRoute>
          )}
        />

        <Route
          path="/manager/menu"
          element={(
            <ProtectedManagerRoute>
              <ManagerMenu />
            </ProtectedManagerRoute>
          )}
        />

        <Route
          path="/manager/branches"
          element={(
            <ProtectedManagerRoute>
              <ManagerBranches />
            </ProtectedManagerRoute>
          )}
        />

        <Route
          path="/manager/operations/history"
          element={(
            <ProtectedManagerRoute>
              <ManagerStatusHistory />
            </ProtectedManagerRoute>
          )}
        />


        {/* BRANCH MANAGER */}

        <Route path="/branch-manager/login" element={<BranchManagerLogin />} />
        <Route path="/branch-manager" element={<Navigate to="/branch-manager/dashboard" replace />} />
        <Route path="/branch-manager/dashboard" element={<ProtectedBranchManagerRoute><BranchManagerDashboard /></ProtectedBranchManagerRoute>} />
        <Route path="/branch-manager/reservations" element={<ProtectedBranchManagerRoute><BranchManagerReservations /></ProtectedBranchManagerRoute>} />
        <Route path="/branch-manager/preorders" element={<ProtectedBranchManagerRoute><BranchManagerPreorders /></ProtectedBranchManagerRoute>} />
        <Route path="/branch-manager/tables" element={<ProtectedBranchManagerRoute><BranchManagerTables /></ProtectedBranchManagerRoute>} />
        <Route path="/branch-manager/menu" element={<ProtectedBranchManagerRoute><BranchManagerMenu /></ProtectedBranchManagerRoute>} />
        <Route path="/branch-manager/profile" element={<ProtectedBranchManagerRoute><BranchManagerProfile /></ProtectedBranchManagerRoute>} />
        <Route path="/branch-manager/notifications" element={<ProtectedBranchManagerRoute><BranchManagerNotifications /></ProtectedBranchManagerRoute>} />
        <Route path="/branch-manager/operations/history" element={<ProtectedBranchManagerRoute><BranchManagerStatusHistory /></ProtectedBranchManagerRoute>} />

        <Route
          path="/platform-admin/branch-manager-assignments"
          element={<ProtectedAdminRoute><AdminBranchManagerAssignments /></ProtectedAdminRoute>}
        />

        <Route path="*" element={<NotFound />} />

      </Routes>

    </BrowserRouter>

  )

}


export default App
