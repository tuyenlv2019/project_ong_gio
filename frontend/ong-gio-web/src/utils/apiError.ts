/** Lấy message lỗi từ response Axios hoặc Error. */
export function getApiErrorMessage(err: unknown, fallback: string) {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const response = (err as { response?: { status?: number; data?: { message?: string; title?: string } } }).response;
    if (response?.data?.message) return response.data.message;
    if (response?.status === 401) return 'Phiên đăng nhập hết hạn hoặc không hợp lệ (401)';
    if (response?.status === 403) return 'Bạn không có quyền thực hiện thao tác này (403)';
    if (response?.data?.title) return response.data.title;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
