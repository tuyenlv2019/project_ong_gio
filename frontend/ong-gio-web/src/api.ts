import axios from 'axios';
import { API_BASE } from './types';
import type {
  BaoGia,
  CalculationRequest,
  CalculationResult,
  DashboardStats,
  LoaiTon,
  NguoiDung,
  NhomSanPham,
} from './types';

const api = axios.create({ baseURL: API_BASE });

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>('/api/dashboard');
  return data;
}

export async function getNhomSanPhams(): Promise<NhomSanPham[]> {
  const { data } = await api.get<NhomSanPham[]>('/api/nhom-san-pham');
  return data;
}

export async function createNhomSanPham(payload: {
  tenNhom: string;
  hinhAnhMinhHoa?: string;
  thamSo?: { tenThamSo: string; giaTriSo: number }[];
}) {
  const { data } = await api.post('/api/nhom-san-pham', payload);
  return data;
}

export async function updateNhomSanPham(
  id: number,
  payload: { tenNhom: string; hinhAnhMinhHoa?: string; thamSo?: { tenThamSo: string; giaTriSo: number }[] },
) {
  const { data } = await api.put(`/api/nhom-san-pham/${id}`, payload);
  return data;
}

export async function deleteNhomSanPham(id: number) {
  await api.delete(`/api/nhom-san-pham/${id}`);
}

export async function getLoaiTons(): Promise<LoaiTon[]> {
  const { data } = await api.get<LoaiTon[]>('/api/loai-ton');
  return data;
}

export async function createLoaiTon(payload: Omit<LoaiTon, 'id'>) {
  const { data } = await api.post('/api/loai-ton', payload);
  return data;
}

export async function updateLoaiTon(id: number, payload: Omit<LoaiTon, 'id'>) {
  const { data } = await api.put(`/api/loai-ton/${id}`, payload);
  return data;
}

export async function deleteLoaiTon(id: number) {
  await api.delete(`/api/loai-ton/${id}`);
}

export async function getBaoGias(): Promise<BaoGia[]> {
  const { data } = await api.get<BaoGia[]>('/api/bao-gia');
  return data;
}

export async function getBaoGia(id: number): Promise<BaoGia> {
  const { data } = await api.get<BaoGia>(`/api/bao-gia/${id}`);
  return data;
}

export async function createBaoGia(payload: {
  tenKhachHang: string;
  thueSuat: number;
  lines: CalculationRequest[];
}) {
  const { data } = await api.post('/api/bao-gia', payload);
  return data;
}

export async function updateBaoGia(
  id: number,
  payload: { tenKhachHang: string; thueSuat: number; lines: CalculationRequest[] },
) {
  const { data } = await api.put(`/api/bao-gia/${id}`, payload);
  return data;
}

export async function deleteBaoGia(id: number) {
  await api.delete(`/api/bao-gia/${id}`);
}

export async function updateBaoGiaStatus(id: number, trangThai: string) {
  const { data } = await api.patch(`/api/bao-gia/${id}/trang-thai`, { trangThai });
  return data;
}

export function getBaoGiaExportUrl(id: number) {
  return `${API_BASE}/api/bao-gia/${id}/export-excel`;
}

export async function previewCalculation(request: CalculationRequest): Promise<CalculationResult> {
  const { data } = await api.post<CalculationResult>('/api/calculation/preview', request);
  return data;
}

export async function getNguoiDungs(): Promise<NguoiDung[]> {
  const { data } = await api.get<NguoiDung[]>('/api/nguoi-dung');
  return data;
}

export async function createNguoiDung(payload: {
  tenDangNhap: string;
  hoTen: string;
  matKhau: string;
  vaiTro: string;
  dangHoatDong: boolean;
}) {
  const { data } = await api.post('/api/nguoi-dung', payload);
  return data;
}

export async function updateNguoiDung(
  id: number,
  payload: { tenDangNhap: string; hoTen: string; matKhau?: string; vaiTro: string; dangHoatDong: boolean },
) {
  const { data } = await api.put(`/api/nguoi-dung/${id}`, payload);
  return data;
}

export async function deleteNguoiDung(id: number) {
  await api.delete(`/api/nguoi-dung/${id}`);
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat('vi-VN').format(Math.round(value));
}

export const TRANG_THAI_DON: Record<string, { label: string; color: string }> = {
  DANG_XU_LY: { label: 'Đang xử lý', color: 'processing' },
  HOAN_THANH: { label: 'Hoàn thành', color: 'success' },
};
