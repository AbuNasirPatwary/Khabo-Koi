import RestaurantDetails from './pages/RestaurantDetails'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import Home from './pages/Home'
import Restaurants from './pages/Restaurants'
import BrowseFood from './pages/BrowseFood'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import MyBookings from './pages/MyBookings'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminLogin from './pages/admin/AdminLogin'
import AdminUsers from './pages/admin/AdminUsers'
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute'


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

      </Routes>

    </BrowserRouter>
  )
}


export default App
