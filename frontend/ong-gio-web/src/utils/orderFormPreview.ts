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
