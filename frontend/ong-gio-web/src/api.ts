/**
 * Lớp hàm gọi API cho dashboard, báo giá, master data và preview tính toán.
 */
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
import { sortOrderedThamSoCoDinhs } from './utils/productFormParams';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Lấy thống kê dashboard từ backend.
 * @returns Dữ liệu thống kê dashboard.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>('/api/dashboard');
  return data;
}

/**
 * Lấy danh sách nhóm sản phẩm.
 * @returns Danh sách nhóm sản phẩm.
 */
export async function getNhomSanPhams(): Promise<NhomSanPham[]> {
  const { data } = await api.get<NhomSanPham[]>('/api/nhom-san-pham');
  return data.map((nhom) => ({
    ...nhom,
    thamSoCoDinhs: sortOrderedThamSoCoDinhs(nhom.thamSoCoDinhs ?? []),
  }));
}

/**
 * Tạo nhóm sản phẩm mới.
 * @param payload Dữ liệu nhóm sản phẩm cần tạo.
 * @returns Dữ liệu nhóm sản phẩm vừa tạo.
 */
export async function createNhomSanPham(payload: {
  tenNhom: string;
  hinhAnhMinhHoa?: string;
  congThucDienTich?: string;
  thamSo?: { tenThamSo: string }[];
}) {
  const { data } = await api.post('/api/nhom-san-pham', payload);
  return data;
}

/**
 * Cập nhật nhóm sản phẩm.
 * @param id Mã nhóm sản phẩm.
 * @param payload Dữ liệu cần cập nhật.
 * @returns Dữ liệu sau khi cập nhật.
 */
export async function updateNhomSanPham(
  id: number,
  payload: { tenNhom: string; hinhAnhMinhHoa?: string; congThucDienTich?: string; thamSo?: { tenThamSo: string }[] },
) {
  const { data } = await api.put(`/api/nhom-san-pham/${id}`, payload);
  return data;
}

/**
 * Xóa nhóm sản phẩm theo id.
 * @param id Mã nhóm sản phẩm.
 */
export async function deleteNhomSanPham(id: number) {
  await api.delete(`/api/nhom-san-pham/${id}`);
}

/**
 * Lấy danh sách loại tôn.
 * @returns Danh sách loại tôn.
 */
export async function getLoaiTons(): Promise<LoaiTon[]> {
  const { data } = await api.get<LoaiTon[]>('/api/loai-ton');
  return data;
}

/**
 * Tạo loại tôn mới.
 * @param payload Dữ liệu loại tôn cần tạo.
 * @returns Dữ liệu vừa tạo.
 */
export async function createLoaiTon(payload: Omit<LoaiTon, 'id'>) {
  const { data } = await api.post('/api/loai-ton', payload);
  return data;
}

/**
 * Cập nhật loại tôn.
 * @param id Mã loại tôn.
 * @param payload Dữ liệu cần cập nhật.
 * @returns Dữ liệu sau khi cập nhật.
 */
export async function updateLoaiTon(id: number, payload: Omit<LoaiTon, 'id'>) {
  const { data } = await api.put(`/api/loai-ton/${id}`, payload);
  return data;
}

/**
 * Xóa loại tôn theo id.
 * @param id Mã loại tôn.
 */
export async function deleteLoaiTon(id: number) {
  await api.delete(`/api/loai-ton/${id}`);
}

/**
 * Lấy danh sách báo giá.
 * @returns Danh sách báo giá.
 */
export async function getBaoGias(): Promise<BaoGia[]> {
  const { data } = await api.get<BaoGia[]>('/api/bao-gia');
  return data;
}

/**
 * Lấy chi tiết báo giá theo id.
 * @param id Mã báo giá.
 * @returns Chi tiết báo giá.
 */
export async function getBaoGia(id: number): Promise<BaoGia> {
  const { data } = await api.get<BaoGia>(`/api/bao-gia/${id}`);
  return data;
}

/**
 * Tạo báo giá mới.
 * @param payload Dữ liệu báo giá cần tạo.
 * @returns Báo giá vừa tạo.
 */
export async function createBaoGia(payload: {
  tenKhachHang: string;
  thueSuat: number;
  trangThai?: string;
  lines: CalculationRequest[];
}) {
  const { data } = await api.post('/api/bao-gia', payload);
  return data;
}

/**
 * Cập nhật báo giá.
 * @param id Mã báo giá.
 * @param payload Dữ liệu cần cập nhật.
 * @returns Báo giá sau khi cập nhật.
 */
export async function updateBaoGia(
  id: number,
  payload: { tenKhachHang: string; thueSuat: number; trangThai?: string; lines: CalculationRequest[] },
) {
  const { data } = await api.put(`/api/bao-gia/${id}`, payload);
  return data;
}

/**
 * Xóa báo giá theo id.
 * @param id Mã báo giá.
 */
export async function deleteBaoGia(id: number) {
  await api.delete(`/api/bao-gia/${id}`);
}

/**
 * Cập nhật trạng thái báo giá.
 * @param id Mã báo giá.
 * @param trangThai Trạng thái mới.
 * @returns Báo giá sau khi cập nhật trạng thái.
 */
export async function updateBaoGiaStatus(id: number, trangThai: string) {
  const { data } = await api.patch(`/api/bao-gia/${id}/trang-thai`, { trangThai });
  return data;
}

/**
 * Tạo URL export Excel của báo giá.
 * @param id Mã báo giá.
 * @returns URL tải file Excel.
 */
export function getBaoGiaExportUrl(id: number) {
  return `${API_BASE}/api/bao-gia/${id}/export-excel`;
}

/**
 * Gọi API preview tính toán cho một dòng báo giá.
 * @param request Dữ liệu đầu vào tính toán.
 * @returns Kết quả preview.
 */
export async function previewCalculation(request: CalculationRequest): Promise<CalculationResult> {
  const { data } = await api.post<CalculationResult>('/api/calculation/preview', request);
  return data;
}

/**
 * Lấy danh sách người dùng.
 * @returns Danh sách người dùng.
 */
export async function getNguoiDungs(): Promise<NguoiDung[]> {
  const { data } = await api.get<NguoiDung[]>('/api/nguoi-dung');
  return data;
}

/**
 * Tạo người dùng mới.
 * @param payload Dữ liệu người dùng cần tạo.
 * @returns Dữ liệu vừa tạo.
 */
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

/**
 * Cập nhật người dùng.
 * @param id Mã user.
 * @param payload Dữ liệu cần cập nhật.
 * @returns Dữ liệu sau khi cập nhật.
 */
export async function updateNguoiDung(
  id: number,
  payload: { tenDangNhap: string; hoTen: string; matKhau?: string; vaiTro: string; dangHoatDong: boolean },
) {
  const { data } = await api.put(`/api/nguoi-dung/${id}`, payload);
  return data;
}

/**
 * Xóa người dùng theo id.
 * @param id Mã user.
 */
export async function deleteNguoiDung(id: number) {
  await api.delete(`/api/nguoi-dung/${id}`);
}

/**
 * Định dạng số tiền — làm tròn số nguyên, ngăn cách hàng nghìn bằng dấu phẩy.
 * @param value Giá trị cần định dạng.
 * @returns Chuỗi tiền tệ đã làm tròn.
 */
export function formatMoney(value: number) {
  return Math.round(Number(value) || 0).toLocaleString('en-US');
}

/** Hiển thị số trong ô nhập tiền (1,234,567). */
export function formatMoneyInput(value: number | string | undefined) {
  if (value === undefined || value === null || value === '') return '';
  const digits = `${value}`.replace(/[^\d-]/g, '');
  if (!digits || digits === '-') return digits;
  const negative = digits.startsWith('-');
  const normalized = negative ? digits.slice(1) : digits;
  const formatted = normalized.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return negative ? `-${formatted}` : formatted;
}

/** Parse chuỗi tiền từ ô nhập về số. */
export function parseMoneyInput(value: string | undefined) {
  const parsed = Number(value?.replace(/,/g, '') ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

const moneyInputNumberProps = {
  formatter: (value: number | string | undefined) => formatMoneyInput(value),
  parser: (value: string | undefined) => parseMoneyInput(value),
} as const;

export { moneyInputNumberProps };

export const TRANG_THAI_DON: Record<string, { label: string; color: string }> = {
  CHUA_XU_LY: { label: 'Chưa xử lý', color: 'default' },
  DANG_XU_LY: { label: 'Đang xử lý', color: 'processing' },
  HOAN_THANH: { label: 'Hoàn Thành', color: 'success' },
};
