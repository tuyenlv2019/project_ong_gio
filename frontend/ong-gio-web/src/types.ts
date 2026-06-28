/**
 * Kiểu dữ liệu dùng chung giữa các trang và API client.
 */
export const API_BASE =
  import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:5273' : '');

export interface ThamSoCoDinh {
  id?: number;
  tenThamSo: string;
  giaTriSo: number;
  thuTu?: number;
}

export interface NhomSanPham {
  id: number;
  tenNhom: string;
  hinhAnhMinhHoa?: string;
  congThucDienTich?: string;
  thamSoCoDinhs: ThamSoCoDinh[];
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface LoaiTon {
  id: number;
  thuongHieu: string;
  doDay: number;
  donGiaM2: number;
  kgMoiMetToi: number;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface BaoGia {
  id: number;
  maBaoGia: string;
  tenKhachHang: string;
  ngayTao: string;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
  thueSuat: number;
  tongTienTruocThue: number;
  tongTienSauThue: number;
  trangThai: string;
  tongSoSanPham?: number;
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
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface DashboardStats {
  tongDonHang: number;
  donHangChuaXuLy: number;
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
  ghiChu?: string;
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

export interface BaoGiaLineHistory {
  id: number;
  tenSanPham: string;
  maBaoGia: string;
  tenKhachHang: string;
  ngayTao: string;
  nhomSanPhamId: number;
  tenNhom: string;
  loaiTonId: number;
  loaiTonLabel: string;
  w: number;
  h: number;
  thamSoNhapJson?: string | null;
  soLuong: number;
  donViTinh: string;
  thueSuat: number;
  giaNhanCong: number;
  phuKien: number;
  thanhTienTon: number;
  ghiChu?: string | null;
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
  thanhTienTon?: number;
}
