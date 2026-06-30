import type { CalculationResult, LineFormValues, LoaiTon } from '../types';
import { thanhTienTonPerPieceToGiaTonMetToi } from './baoGiaFormMapper';

/** Tính đơn giá / thành tiền một dòng từ preview + giá nhập tay. */
export function calcLinePricing(
  preview: CalculationResult,
  item: Partial<LineFormValues>,
  donGiaMetToiFallback?: number,
): { unitPrice: number; lineTotal: number; giaTonMetToi: number } {
  const soLuong = Number(item.soLuong) || 1;
  const metToi = preview.dienTichSanXuatMetToi;
  const giaNhanCong = Number(item.giaNhanCong) || 0;
  const phuKien = Number(item.phuKien) || 0;

  const defaultGiaTonMetToi = donGiaMetToiFallback ?? 0;
  const isManualTon = Boolean(item.thanhTienTonManual);
  const giaTonMetToi =
    isManualTon && item.thanhTienTon != null
      ? thanhTienTonPerPieceToGiaTonMetToi(item.thanhTienTon, metToi)
      : item.thanhTienTon != null && item.thanhTienTon > 0
        ? thanhTienTonPerPieceToGiaTonMetToi(item.thanhTienTon, metToi)
        : defaultGiaTonMetToi;

  const unitPrice = Math.round(giaTonMetToi * metToi + giaNhanCong + phuKien);
  return { unitPrice, lineTotal: unitPrice * soLuong, giaTonMetToi };
}

export type OrderTotals = {
  tongTien: number;
  thueTien: number;
  thueTheoLoai: { thueSuat: number; tienThue: number }[];
  tongTienSauThue: number;
};

export const EMPTY_ORDER_TOTALS: OrderTotals = {
  tongTien: 0,
  thueTien: 0,
  thueTheoLoai: [],
  tongTienSauThue: 0,
};

export function computeOrderTotals(
  items: LineFormValues[],
  linePreviews: Record<number, CalculationResult>,
  loaiTonById: Map<number, LoaiTon>,
): OrderTotals {
  let totalThanhTien = 0;
  const thueByRate = new Map<number, number>();

  items.forEach((item, index) => {
    const preview = linePreviews[index];
    if (!preview) return;
    const ton = loaiTonById.get(Number(item.loaiTonId));
    const { lineTotal } = calcLinePricing(preview, item, ton?.donGiaMetToi);
    totalThanhTien += lineTotal;
    const rate = Number(item?.thueSuat ?? 0);
    thueByRate.set(rate, (thueByRate.get(rate) ?? 0) + lineTotal * (rate / 100));
  });

  const thueTheoLoai = [...thueByRate.entries()]
    .map(([thueSuat, tienThue]) => ({ thueSuat, tienThue }))
    .sort((a, b) => a.thueSuat - b.thueSuat);
  const totalThue = thueTheoLoai.reduce((sum, g) => sum + g.tienThue, 0);

  return {
    tongTien: totalThanhTien,
    thueTien: totalThue,
    thueTheoLoai,
    tongTienSauThue: totalThanhTien + totalThue,
  };
}
