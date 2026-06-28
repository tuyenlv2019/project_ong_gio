import type { BaoGia, ChiTietBaoGia, LineFormValues } from '../types';

export function mapChiTietToLineInput(c: ChiTietBaoGia, bg: BaoGia): LineFormValues {
  return {
    tenSanPham: c.tenSanPham,
    donViTinh: c.donViTinh ?? 'cái',
    thueSuat: (c.thueSuat ?? bg.thueSuat ?? 0.08) * 100,
    nhomSanPhamId: c.nhomSanPham?.id ?? 0,
    loaiTonId: c.loaiTon?.id ?? 0,
    w: c.wInput,
    h: c.hInput,
    thanhTienTon: c.thanhTienTon,
    thamSoNhap: c.thamSoNhapJson ? JSON.parse(c.thamSoNhapJson) : {},
    soLuong: c.soLuong,
    giaNhanCong: c.giaNhanCong ?? 0,
    phuKien: c.phuKien ?? 0,
    ghiChu: c.ghiChu,
  };
}

export function mapBaoGiaToLineInputs(bg: BaoGia): LineFormValues[] {
  return (bg.chiTietBaoGias ?? []).map((c) => mapChiTietToLineInput(c, bg));
}
