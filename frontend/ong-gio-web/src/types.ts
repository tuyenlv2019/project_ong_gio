/**
 * Kiểu dữ liệu dùng chung giữa các trang và API client.
 */
export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5273';

export interface ThamSoCoDinh {
  id?: number;
  tenThamSo: string;
  giaTriSo: number;
}

export interface NhomSanPham {
  id: number;
  tenNhom: string;
  hinhAnhMinhHoa?: string;
  thamSoCoDinhs: ThamSoCoDinh[];
}

export interface LoaiTon {
  id: number;
  thuongHieu: string;
  doDay: number;
  donGiaM2: number;
  kgMoiMetToi: number;
}

export interface BaoGia {
  id: number;
  maBaoGia: string;
  tenKhachHang: string;
  ngayTao: string;
  thueSuat: number;
  tongTienTruocThue: number;
  tongTienSauThue: number;
  trangThai: string;
  chiTietBaoGias?: ChiTietBaoGia[];
}

export interface ChiTietBaoGia {
  id: number;
  tenSanPham?: string;
  donViTinh?: string;
  ghiChu?: string;
  wInput: number;
  hInput: number;
  thamSoNhapJson?: string;
  soLuong: number;
  thueSuat: number;
  giaNhanCong: number;
  phuKien: number;
  dienTichSx1Cai: number;
  tongDienTichLo: number;
  trongLuongKg: number;
  thanhTienTon: number;
  donGiaCuoi: number;
  thanhTien: number;
  nhomSanPham?: NhomSanPham;
  loaiTon?: LoaiTon;
}

export interface NguoiDung {
  id: number;
  tenDangNhap: string;
  hoTen: string;
  vaiTro: string;
  dangHoatDong: boolean;
  createdAt?: string;
}

export interface DashboardStats {
  tongDonHang: number;
  donHangDangXuLy: number;
  donHangHoanThanh: number;
  tongTienNguyenLieu: number;
  tongDoanhThu: number;
  tongSanPham: number;
  tongLoaiTon: number;
  tongNguoiDung: number;
}

export interface CalculationRequest {
  tenSanPham?: string;
  donViTinh?: string;
  thueSuat?: number;
  nhomSanPhamId: number;
  loaiTonId: number;
  w: number;
  h: number;
  soLuong: number;
  giaNhanCong: number;
  phuKien: number;
  thamSoNhap?: Record<string, number>;
}

export interface CalculationResult {
  dienTichSx1Cai: number;
  dienTichSanXuatMetToi: number;
  tongDienTichLo: number;
  trongLuongKg: number;
  thanhTienTon: number;
  donGiaCuoi: number;
  thanhTien: number;
  apDungGiaSan: boolean;
  trangThaiCongThuc: string;
}

export interface LineFormValues {
  tenSanPham?: string;
  donViTinh?: string;
  thueSuat?: number;
  nhomSanPhamId: number;
  loaiTonId: number;
  w: number;
  h: number;
  soLuong: number;
  giaNhanCong: number;
  phuKien: number;
  thamSoNhap?: Record<string, number>;
  ghiChu?: string;
}
