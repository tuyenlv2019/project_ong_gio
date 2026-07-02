import { describe, expect, it } from 'vitest';
import {
  buildLinePreviewSignature,
  getLineIndicesNeedingPreviewRefresh,
  nhomSelectionChanged,
  patchHasDimensionChange,
  patchHasLoaiTonChange,
  shouldAutoSuggestThanhTienTon,
} from './orderFormPreview';
import type { LineFormValues } from '../types';

const sampleLine: LineFormValues = {
  nhomSanPhamId: 1,
  loaiTonId: 2,
  w: 300,
  h: 200,
  soLuong: 1,
  giaNhanCong: 0,
  phuKien: 0,
  thamSoNhap: { L: 500 },
};

describe('orderFormPreview', () => {
  it('getLineIndicesNeedingPreviewRefresh trả [] khi chỉ đổi thuế', () => {
    const indices = getLineIndicesNeedingPreviewRefresh({
      lineInputs: [{ thueSuat: 10 }],
    });
    expect(indices).toEqual([]);
  });

  it('getLineIndicesNeedingPreviewRefresh trả index khi đổi kích thước', () => {
    const indices = getLineIndicesNeedingPreviewRefresh({
      lineInputs: [null, { w: 400 }],
    });
    expect(indices).toEqual([1]);
  });

  it('buildLinePreviewSignature ổn định theo tham số tính toán', () => {
    const a = buildLinePreviewSignature(sampleLine);
    const b = buildLinePreviewSignature({ ...sampleLine, giaNhanCong: 99 });
    expect(a).toBe(b);
  });

  it('nhomSelectionChanged nhận diện đổi loại SP', () => {
    expect(nhomSelectionChanged({ lineInputs: [{ nhomSanPhamId: 3 }] })).toBe(true);
    expect(nhomSelectionChanged({ lineInputs: [{ thueSuat: 8 }] })).toBe(false);
  });

  it('getLineIndicesNeedingPreviewRefresh trả all khi lineInputs là mảng đầy đủ (ensureNewRow)', () => {
    const indices = getLineIndicesNeedingPreviewRefresh({
      lineInputs: [sampleLine, { ...sampleLine, soLuong: 2 }],
    });
    expect(indices).toEqual([0, 1]);
  });

  it('shouldAutoSuggestThanhTienTon: dòng mới (không persisted) được gợi ý', () => {
    const persisted = new Set([0, 1]);
    const userEdited = new Set<number>();
    expect(shouldAutoSuggestThanhTienTon(2, userEdited, persisted)).toBe(true);
    expect(shouldAutoSuggestThanhTienTon(0, userEdited, persisted)).toBe(false);
  });

  it('shouldAutoSuggestThanhTienTon: chặn khi user đã sửa Giá tôn', () => {
    const persisted = new Set<number>();
    const userEdited = new Set([1]);
    expect(shouldAutoSuggestThanhTienTon(1, userEdited, persisted)).toBe(false);
  });

  it('patchHasDimensionChange nhận diện đổi W/H/thamSoNhap', () => {
    expect(patchHasDimensionChange({ w: 300 })).toBe(true);
    expect(patchHasDimensionChange({ thamSoNhap: { L: 1 } })).toBe(true);
    expect(patchHasDimensionChange({ loaiTonId: 2 })).toBe(false);
  });

  it('patchHasLoaiTonChange nhận diện đổi loại tôn', () => {
    expect(patchHasLoaiTonChange({ loaiTonId: 3 })).toBe(true);
    expect(patchHasLoaiTonChange({ w: 300 })).toBe(false);
  });
});
