/**
 * Chặn truy cập khi user không phải admin.
 */
import { Navigate } from 'react-router-dom';
import { authService } from '../authService';

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (!authService.isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
