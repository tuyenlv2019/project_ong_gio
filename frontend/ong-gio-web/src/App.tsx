/**
 * Khai báo route chính của client, gồm trang đăng nhập và khu vực được bảo vệ.
 */
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import DashboardPage from './pages/DashboardPage';
import MaterialsPage from './pages/MaterialsPage';
import OrderFormPage from './pages/OrderFormPage';
import OrdersPage from './pages/OrdersPage';
import ProductsPage from './pages/ProductsPage';
import UsersPage from './pages/UsersPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

/**
 * Component router gốc của ứng dụng web.
 * @returns Cây route của frontend.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="don-hang" element={<OrdersPage />} />
          <Route path="don-hang/tao-moi" element={<OrderFormPage />} />
          <Route path="don-hang/:id" element={<OrderFormPage />} />
          <Route path="nguyen-lieu" element={<MaterialsPage />} />
          <Route path="san-pham" element={<ProductsPage />} />
          <Route path="nguoi-dung" element={<AdminRoute><UsersPage /></AdminRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
