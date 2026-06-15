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

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

class AuthService {
  async getCaptcha(): Promise<CaptchaResponse> {
    const { data } = await api.get<CaptchaResponse>('/api/auth/captcha');
    return data;
  }

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

      // Store token and user info
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

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUser(): AuthUser | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const authService = new AuthService();
