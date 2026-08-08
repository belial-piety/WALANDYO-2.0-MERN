import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';

import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import RoleRoute from './components/common/RoleRoute';

import LoginPage from './pages/auth/LoginPage';
import CounterPage from './pages/counter/CounterPage';
import OrdersPage from './pages/orders/OrdersPage';
import MenuPage from './pages/menu/MenuPage';
import InventoryPage from './pages/inventory/InventoryPage';
import ReportsPage from './pages/reports/ReportsPage';
import BranchesPage from './pages/branches/BranchesPage';
import StaffPage from './pages/staff/StaffPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import ForbiddenPage from './pages/errors/ForbiddenPage';
import NotFoundPage from './pages/errors/NotFoundPage';
import getDefaultRoute from './utils/roleRoutes';
import { useAuth } from './contexts/AuthContext';

const HomeRedirect = () => {
  const { user } = useAuth();
  return <Navigate to={getDefaultRoute(user?.role)} replace />;
};

export const App = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes inside App Shell */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<HomeRedirect />} />

              {/* POS Counter: Admin, Manager, Cashier */}
              <Route element={<RoleRoute allowedRoles={['admin', 'manager', 'cashier']} />}>
                <Route path="/counter" element={<CounterPage />} />
                <Route path="/orders" element={<OrdersPage />} />
              </Route>

              {/* Menu Items: Admin, Manager */}
              <Route element={<RoleRoute allowedRoles={['admin', 'manager']} />}>
                <Route path="/menu" element={<MenuPage />} />
              </Route>

              {/* Inventory: Admin, Manager, Inventory Clerk */}
              <Route element={<RoleRoute allowedRoles={['admin', 'manager', 'inventory']} />}>
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
              </Route>

              {/* Reports: Admin, Manager */}
              <Route element={<RoleRoute allowedRoles={['admin', 'manager']} />}>
                <Route path="/reports" element={<ReportsPage />} />
              </Route>

              {/* System Admin Routes: Admin only */}
              <Route element={<RoleRoute allowedRoles={['admin']} />}>
                <Route path="/branches" element={<BranchesPage />} />
                <Route path="/staff" element={<StaffPage />} />
              </Route>

              {/* Error pages */}
              <Route path="/403" element={<ForbiddenPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
        </Routes>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
