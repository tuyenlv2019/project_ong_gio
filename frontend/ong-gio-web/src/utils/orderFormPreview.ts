import type { FormInstance } from 'antd';
import type { LineFormValues } from '../types';

/** Các field ảnh hưởng kết quả tính toán preview (diện tích, khối lượng...). */
export const PREVIEW_AFFECTING_LINE_FIELDS = new Set([
  'nhomSanPhamId',
  'loaiTonId',
  'w',
  'h',
  'soLuong',
  'thamSoNhap',
]);

export function lineNeedsPreviewRefresh(changedLinePatch?: Record<string, unknown> | null) {
  if (!changedLinePatch) return false;
  return Object.keys(changedLinePatch).some((key) => PREVIEW_AFFECTING_LINE_FIELDS.has(key));
}

/** Patch onValuesChange có đổi loại tôn. */
export function patchHasLoaiTonChange(changedLinePatch?: Record<string, unknown> | null) {
  if (!changedLinePatch) return false;
  return Object.prototype.hasOwnProperty.call(changedLinePatch, 'loaiTonId');
}

/** Patch onValuesChange có đổi kích thước (W/H/thamSoNhap). */
export function patchHasDimensionChange(changedLinePatch?: Record<string, unknown> | null) {
  if (!changedLinePatch) return false;
  return (
    Object.prototype.hasOwnProperty.call(changedLinePatch, 'w')
    || Object.prototype.hasOwnProperty.call(changedLinePatch, 'h')
    || Object.prototype.hasOwnProperty.call(changedLinePatch, 'thamSoNhap')
  );
}

/** Trả về index dòng cần gọi lại API preview; `all` khi không xác định được; `[]` khi không cần API. */
export function getLineIndicesNeedingPreviewRefresh(
  changedValues: Record<string, unknown>,
): number[] | 'all' {
  const changedLines = changedValues.lineInputs as Array<Record<string, unknown> | null> | undefined;
  if (!Array.isArray(changedLines)) {
    return changedValues.lineInputs !== undefined ? 'all' : [];
  }
  const indices: number[] = [];
  changedLines.forEach((patch, index) => {
    if (lineNeedsPreviewRefresh(patch ?? undefined)) {
      indices.push(index);
    }
  });
  return indices;
}

export function buildLinePreviewSignature(item: LineFormValues) {
  return JSON.stringify({
    n: item.nhomSanPhamId,
    t: item.loaiTonId,
    w: item.w,
    h: item.h,
    s: item.soLuong,
    p: item.thamSoNhap ?? {},
  });
}

/** Trả về true nếu thay đổi liên quan đến loại SP (cần cập nhật panel công thức). */
export function nhomSelectionChanged(changedValues: Record<string, unknown>) {
  const changedLines = changedValues.lineInputs as Array<Record<string, unknown> | null> | undefined;
  if (!Array.isArray(changedLines)) {
    return changedValues.lineInputs !== undefined;
  }
  return changedLines.some((patch) => patch && Object.prototype.hasOwnProperty.call(patch, 'nhomSanPhamId'));
}

export const PREVIEW_DEBOUNCE_MS = 350;

/** Có được tự gợi ý Giá tôn cho dòng `index` hay không. */
export function shouldAutoSuggestThanhTienTon(
  index: number,
  userEdited: ReadonlySet<number>,
  persisted: ReadonlySet<number>,
): boolean {
  return !userEdited.has(index) && !persisted.has(index);
}

/** Đọc đầy đủ một dòng từ form (kể cả field lồng `thamSoNhap`). */
export function getLineFromForm(form: FormInstance, index: number): LineFormValues {
  const base = (form.getFieldValue(['lineInputs', index]) as LineFormValues | undefined) ?? ({} as LineFormValues);
  return {
    ...base,
    nhomSanPhamId: form.getFieldValue(['lineInputs', index, 'nhomSanPhamId']) ?? base.nhomSanPhamId,
    loaiTonId: form.getFieldValue(['lineInputs', index, 'loaiTonId']) ?? base.loaiTonId,
    w: form.getFieldValue(['lineInputs', index, 'w']) ?? base.w,
    h: form.getFieldValue(['lineInputs', index, 'h']) ?? base.h,
    soLuong: form.getFieldValue(['lineInputs', index, 'soLuong']) ?? base.soLuong,
    thamSoNhap: form.getFieldValue(['lineInputs', index, 'thamSoNhap']) ?? base.thamSoNhap ?? {},
    thanhTienTon: form.getFieldValue(['lineInputs', index, 'thanhTienTon']) ?? base.thanhTienTon,
    thanhTienTonManual: form.getFieldValue(['lineInputs', index, 'thanhTienTonManual']) ?? base.thanhTienTonManual,
  };
}
