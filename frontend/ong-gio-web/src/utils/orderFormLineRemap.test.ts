import { describe, expect, it } from 'vitest';
import {
  remapIndexSetAfterMove,
  remapIndexSetAfterRemove,
  remapRecordKeysAfterMove,
  remapRecordKeysAfterRemove,
} from './orderFormLineRemap';

describe('orderFormLineRemap', () => {
  it('remapRecordKeysAfterRemove dịch preview sau khi xóa dòng giữa', () => {
    const previews = { 0: 'a', 1: 'b', 2: 'c' } as Record<number, string>;
    expect(remapRecordKeysAfterRemove(previews, 1)).toEqual({ 0: 'a', 1: 'c' });
  });

  it('remapIndexSetAfterRemove bỏ index đã xóa và lùi các index sau', () => {
    expect(remapIndexSetAfterRemove(new Set([0, 1, 2]), 1)).toEqual(new Set([0, 1]));
  });

  it('remapRecordKeysAfterMove chuyển preview khi move dòng', () => {
    const previews = { 0: 'a', 1: 'b', 2: 'c' } as Record<number, string>;
    expect(remapRecordKeysAfterMove(previews, 0, 2)).toEqual({ 0: 'b', 1: 'c', 2: 'a' });
  });

  it('remapIndexSetAfterMove cập nhật manual-ton indices', () => {
    expect(remapIndexSetAfterMove(new Set([0, 2]), 0, 2)).toEqual(new Set([1, 2]));
  });

  it('remapRecordKeysAfterMove giữ nguyên dữ liệu theo dòng khi move lên', () => {
    const rows = {
      0: { w: 100, h: 200, thamSoNhap: { a: 1 } },
      1: { w: 300, h: 400, thamSoNhap: { b: 2 } },
      2: { w: 500, h: 600, thamSoNhap: { c: 3 } },
    } as Record<number, { w: number; h: number; thamSoNhap: Record<string, number> }>;

    expect(remapRecordKeysAfterMove(rows, 2, 0)).toEqual({
      0: { w: 500, h: 600, thamSoNhap: { c: 3 } },
      1: { w: 100, h: 200, thamSoNhap: { a: 1 } },
      2: { w: 300, h: 400, thamSoNhap: { b: 2 } },
    });
  });
});
