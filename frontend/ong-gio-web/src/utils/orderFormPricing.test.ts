import { describe, expect, it } from 'vitest';
import { calcLinePricing, computeOrderTotals, EMPTY_ORDER_TOTALS } from './orderFormPricing';
import type { CalculationResult, LineFormValues, LoaiTon } from '../types';

const preview: CalculationResult = {
  dienTichSx1Cai: 1.2,
  dienTichSanXuatMetToi: 1,
  tongDienTichLo: 2,
  trongLuongKg: 4.5,
  thanhTienTon: 222_000,
  donGiaCuoi: 250_000,
  thanhTien: 500_000,
  apDungGiaSan: false,
  trangThaiCongThuc: 'XAC_NHAN',
};

const line: LineFormValues = {
  nhomSanPhamId: 1,
  loaiTonId: 1,
  w: 300,
  h: 300,
  soLuong: 2,
  donViTinh: 'cái',
  thueSuat: 8,
  giaNhanCong: 20_000,
  phuKien: 5_000,
  thamSoNhap: {},
};

describe('orderFormPricing', () => {
  it('calcLinePricing tính đơn giá không phụ thuộc số lượng', () => {
    const ton = { id: 1, donGiaMetToi: 222_000 } as LoaiTon;
    const one = calcLinePricing(preview, { ...line, soLuong: 1 }, ton.donGiaMetToi);
    const two = calcLinePricing(preview, { ...line, soLuong: 2 }, ton.donGiaMetToi);
    expect(one.unitPrice).toBe(two.unitPrice);
    expect(two.lineTotal).toBe(one.unitPrice * 2);
  });

  it('computeOrderTotals nhóm thuế theo mức', () => {
    const loaiTonById = new Map<number, LoaiTon>([[1, { id: 1, donGiaMetToi: 222_000 } as LoaiTon]]);
    const totals = computeOrderTotals([line], { 0: preview }, loaiTonById);
    expect(totals.tongTien).toBeGreaterThan(0);
    expect(totals.thueTheoLoai).toEqual([{ thueSuat: 8, tienThue: totals.tongTien * 0.08 }]);
    expect(totals.tongTienSauThue).toBe(totals.tongTien + totals.thueTien);
  });

  it('EMPTY_ORDER_TOTALS là giá trị khởi tạo rỗng', () => {
    expect(EMPTY_ORDER_TOTALS.tongTien).toBe(0);
    expect(EMPTY_ORDER_TOTALS.thueTheoLoai).toEqual([]);
  });
});
