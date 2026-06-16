/**
 * Chặn truy cập khi chưa đăng nhập.
 */
import { Navigate } from 'react-router-dom';
import { authService } from '../authService';

/**
 * Props của route bảo vệ.
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Wrapper route chỉ cho phép truy cập khi đã đăng nhập.
 * @param children Nội dung cần bảo vệ.
 * @returns Component con hoặc redirect sang login.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
