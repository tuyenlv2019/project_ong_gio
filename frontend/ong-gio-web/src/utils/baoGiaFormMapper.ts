import type { BaoGia, ChiTietBaoGia, LineFormValues } from '../types';

/** Hệ số quy đổi ∑Ssx (m²) sang diện tích sản xuất mét tới: mét tới = m² / 1.2 */
export const SSX_TO_MET_TOI = 1.2;

export function dienTichSxToMetToi(dienTichSx1Cai: number): number {
  return dienTichSx1Cai / SSX_TO_MET_TOI;
}

/**
 * Gợi ý Giá tôn (VNĐ/1 cái) = đơn giá/mét tới × ∑Ssx mét tới — không phụ thuộc số lượng.
 */
export function suggestThanhTienTon(donGiaMetToi: number, metToi: number): number {
  return Math.round(donGiaMetToi * metToi);
}

/** Suy đơn giá tôn đ/mét tới từ tiền tôn 1 cái đã nhập. */
export function thanhTienTonPerPieceToGiaTonMetToi(thanhTienTonPerPiece: number, metToi: number): number {
  return metToi > 0 ? thanhTienTonPerPiece / metToi : 0;
}

/** Chuyển tổng tiền tôn lưu DB sang tiền tôn/1 cái cho form. */
export function thanhTienTonTotalToPerPiece(thanhTienTonTotal: number, soLuong: number): number {
  return soLuong > 0 ? Math.round(thanhTienTonTotal / soLuong) : thanhTienTonTotal;
}

/** Parse `thamSoNhapJson` an toàn — JSON hỏng trả về `{}`. */
export function parseThamSoNhapJson(json?: string | null): Record<string, number> {
  if (!json?.trim()) return {};
  try {
    const parsed: unknown = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed as Record<string, number>;
  } catch {
    return {};
  }
}

export function mapChiTietToLineInput(c: ChiTietBaoGia, bg: BaoGia): LineFormValues {
  return {
    tenSanPham: c.tenSanPham,
    donViTinh: c.donViTinh ?? 'cái',
    thueSuat: (c.thueSuat ?? bg.thueSuat ?? 0.08) * 100,
    nhomSanPhamId: c.nhomSanPham?.id ?? 0,
    loaiTonId: c.loaiTon?.id ?? 0,
    w: c.wInput,
    h: c.hInput,
    thanhTienTon: thanhTienTonTotalToPerPiece(c.thanhTienTon, c.soLuong),
    thanhTienTonManual: true,
    thamSoNhap: parseThamSoNhapJson(c.thamSoNhapJson),
    soLuong: c.soLuong,
    giaNhanCong: c.giaNhanCong ?? 0,
    phuKien: c.phuKien ?? 0,
    ghiChu: c.ghiChu,
  };
}

export function mapBaoGiaToLineInputs(bg: BaoGia): LineFormValues[] {
  return (bg.chiTietBaoGias ?? []).map((c) => mapChiTietToLineInput(c, bg));
}
