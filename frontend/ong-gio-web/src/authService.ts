/**
 * Dịch vụ đăng nhập: captcha, token, user localStorage và logout.
 */
import axios from 'axios';
import { API_BASE } from './types';

interface LoginResponse {
  success: boolean;
  message?: string;
  token: string;
  user: {
    id: number;
    tenDangNhap: string;
    hoTen: string;
    vaiTro: string;
  };
}

interface AuthUser {
  id: number;
  tenDangNhap: string;
  hoTen: string;
  vaiTro: string;
}

interface CaptchaResponse {
  token: string;
  imageBase64: string;
}

const api = axios.create({ baseURL: API_BASE });

/**
 * Tự động gắn token vào header Authorization nếu đã đăng nhập.
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

class AuthService {
  /**
   * Lấy captcha mới từ backend.
   * @returns Thông tin captcha gồm token và ảnh base64.
   */
  async getCaptcha(): Promise<CaptchaResponse> {
    const { data } = await api.get<CaptchaResponse>('/api/auth/captcha');
    return data;
  }

  /**
   * Đăng nhập bằng captcha và lưu token vào localStorage nếu thành công.
   * @param tenDangNhap Tên đăng nhập.
   * @param matKhau Mật khẩu.
   * @param captchaToken Token captcha.
   * @param captchaValue Giá trị captcha người dùng nhập.
   * @returns Kết quả đăng nhập.
   */
  async login(
    tenDangNhap: string,
    matKhau: string,
    captchaToken: string,
    captchaValue: string
  ): Promise<LoginResponse> {
    try {
      const { data } = await api.post<LoginResponse>('/api/auth/login', {
        tenDangNhap,
        matKhau,
        captchaToken,
        captchaValue,
      });

      /**
       * Lưu token và user sau khi đăng nhập thành công.
       */
      if (data.success && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      return data;
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Đăng nhập thất bại';
      return {
        success: false,
        message: msg,
        token: '',
        user: { id: 0, tenDangNhap: '', hoTen: '', vaiTro: '' }
      };
    }
  }

  /**
   * Đổi mật khẩu user đang đăng nhập.
   */
  async changePassword(
    matKhauCu: string,
    matKhauMoi: string,
    xacNhanMatKhauMoi: string
  ): Promise<{ success: boolean; message?: string }> {
    const tenDangNhap = this.getUser()?.tenDangNhap;
    try {
      const { data } = await api.post<{ success: boolean; message?: string }>('/api/auth/change-password', {
        tenDangNhap,
        matKhauCu,
        matKhauMoi,
        xacNhanMatKhauMoi,
      });
      return { success: !!data.success, message: data.message };
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Đổi mật khẩu thất bại';
      return { success: false, message: msg };
    }
  }

  /**
   * Đăng xuất và xóa dữ liệu xác thực khỏi localStorage.
   */
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  /**
   * Lấy token hiện tại từ localStorage.
   * @returns JWT token hoặc null nếu chưa đăng nhập.
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Lấy thông tin user hiện tại từ localStorage.
   * @returns Thông tin user hoặc null.
   */
  getUser(): AuthUser | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  /**
   * Kiểm tra trạng thái đăng nhập.
   * @returns True nếu có token hợp lệ trong localStorage.
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Kiểm tra user hiện tại có vai trò admin.
   */
  isAdmin(): boolean {
    return this.getUser()?.vaiTro === 'ADMIN';
  }
}

export const authService = new AuthService();
