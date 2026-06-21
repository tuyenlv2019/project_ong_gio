import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Mở form thêm mới khi điều hướng từ dashboard (hoặc nơi khác) với state.openCreate.
 */
export function useOpenCreateFromNavigation(openCreate: () => void) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const state = location.state as { openCreate?: boolean } | null;
    if (state?.openCreate) {
      openCreate();
      navigate(location.pathname, { replace: true, state: {} });
    }
    // Chỉ chạy một lần khi mount trang.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
