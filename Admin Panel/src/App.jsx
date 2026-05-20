/**
 * Main App Component
 * Sets up routing and authentication provider
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { SidebarProvider } from './context/SidebarContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import Login from './pages/Login.jsx';
import DashboardHome from './pages/DashboardHome.jsx';
import Admins from './pages/Admins.jsx';
import Vacancies from './pages/Vacancies.jsx';
import ApplicationSubmissions from './pages/ApplicationSubmissions.jsx';
import Interviews from './pages/Interviews.jsx';
import NotFound from './pages/NotFound.jsx';

function App() {
  return (
    <AuthProvider>
      <SidebarProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes with Layout */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              {/* Default dashboard route */}
              <Route index element={<DashboardHome />} />

              {/* Admins CRUD */}
              <Route path="admins" element={<Admins />} />

              {/* Vacancies CRUD */}
              <Route path="vacancies" element={<Vacancies />} />

              {/* Nomzod arizalari */}
              <Route path="submissions" element={<ApplicationSubmissions />} />

              {/* Nomzod suhbatlari */}
              <Route path="interviews" element={<Interviews />} />
            </Route>

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* 404 Not Found */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SidebarProvider>
    </AuthProvider>
  );
}

export default App;
