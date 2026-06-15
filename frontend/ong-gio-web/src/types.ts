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
  giaSanCoDinh: number;
  bangBaremJson: string;
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
  wInput: number;
  hInput: number;
  soLuong: number;
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
  nhomSanPhamId: number;
  loaiTonId: number;
  w: number;
  h: number;
  soLuong: number;
  giaNhanCong: number;
  phuKien: number;
}

export interface CalculationResult {
  dienTichSx1Cai: number;
  tongDienTichLo: number;
  trongLuongKg: number;
  thanhTienTon: number;
  donGiaCuoi: number;
  thanhTien: number;
  apDungGiaSan: boolean;
  trangThaiCongThuc: string;
}

export interface LineFormValues {
  nhomSanPhamId: number;
  loaiTonId: number;
  w: number;
  h: number;
  soLuong: number;
  giaNhanCong: number;
  phuKien: number;
}
