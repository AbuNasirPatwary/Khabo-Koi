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
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminBookings from './pages/admin/AdminBookings'
import AdminLogin from './pages/admin/AdminLogin'
import AdminManagerAssignments from './pages/admin/AdminManagerAssignments'
import AdminRestaurants from './pages/admin/AdminRestaurants'
import AdminUsers from './pages/admin/AdminUsers'
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute'
import ManagerDashboard from './pages/manager/ManagerDashboard'
import ManagerLogin from './pages/manager/ManagerLogin'
import ManagerRestaurantProfile from './pages/manager/ManagerRestaurantProfile'
import ManagerReservations from './pages/manager/ManagerReservations'
import ManagerTables from './pages/manager/ManagerTables'
import ManagerMenu from './pages/manager/ManagerMenu'
import ManagerBranches from './pages/manager/ManagerBranches'
import ProtectedManagerRoute from './components/manager/ProtectedManagerRoute'


function App() {
  return (
    <BrowserRouter>

      {/* APP ROUTES:
                Each URL below displays a different React page.
                Later we will add restaurant details, booking,
                confirmation, profile and dashboard routes here. */}
      <Routes>
        <Route
          path="/restaurants/:id"
          element={<RestaurantDetails />}
        />
        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/restaurants"
          element={<Restaurants />}
        />

        <Route
          path="/browse-food"
          element={<BrowseFood />}
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
          path="/my-bookings"
          element={<MyBookings />}
        />

        <Route
          path="/profile"
          element={<Profile />}
        />

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
          path="/manager/login"
          element={<ManagerLogin />}
        />

        <Route
          path="/manager"
          element={<Navigate to="/manager/dashboard" replace />}
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
          element={<ProtectedManagerRoute><ManagerReservations /></ProtectedManagerRoute>}
        />

        <Route
          path="/manager/tables"
          element={<ProtectedManagerRoute><ManagerTables /></ProtectedManagerRoute>}
        />

        <Route
          path="/manager/menu"
          element={<ProtectedManagerRoute><ManagerMenu /></ProtectedManagerRoute>}
        />

        <Route
          path="/manager/branches"
          element={<ProtectedManagerRoute><ManagerBranches /></ProtectedManagerRoute>}
        />

      </Routes>

    </BrowserRouter>
  )
}


export default App
