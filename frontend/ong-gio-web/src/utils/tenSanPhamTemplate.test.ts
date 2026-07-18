import { describe, expect, it } from 'vitest';
import {
  buildTenSanPhamFromTemplate,
  shouldApplyAutoTenSanPham,
  suggestMauTenSanPham,
} from './tenSanPhamTemplate';

describe('buildTenSanPhamFromTemplate', () => {
  it('map theo ví dụ ống bịt 1 đầu', () => {
    const name = buildTenSanPhamFromTemplate('Ống gió KT {W}x{H} L{L} mm, bịt 1 đầu', {
      tenNhom: 'Ống gió bít 01 đầu',
      w: 300,
      h: 300,
      thamSoNhap: { L: 1120 },
    });
    expect(name).toBe('Ống gió KT 300x300 L1120 mm, bịt 1 đầu');
  });

  it('map W1/H1 từ ô W/H và côn giảm 2 đầu', () => {
    const name = buildTenSanPhamFromTemplate('Côn giảm KT {W1}x{H1} - {W2}x{H2} L{L} mm', {
      tenNhom: 'Côn giảm',
      w: 300,
      h: 300,
      thamSoNhap: { W2: 200, H2: 200, L: 300 },
    });
    expect(name).toBe('Côn giảm KT 300x300 - 200x200 L300 mm');
  });

  it('map Co 90 và lệch tâm N', () => {
    expect(
      buildTenSanPhamFromTemplate('{TenNhom} KT {W}x{H} R{R} mm', {
        tenNhom: 'Co 90 độ',
        w: 300,
        h: 300,
        thamSoNhap: { R: 150 },
      }),
    ).toBe('Co 90 độ KT 300x300 R150 mm');

    expect(
      buildTenSanPhamFromTemplate('Ống gió KT {W}x{H} L{L} mm lệch tâm {N} mm', {
        tenNhom: 'BZ',
        w: 300,
        h: 300,
        thamSoNhap: { L: 1120, N: 200 },
      }),
    ).toBe('Ống gió KT 300x300 L1120 mm lệch tâm 200 mm');
  });

  it('trả rỗng khi không có mẫu', () => {
    expect(buildTenSanPhamFromTemplate('', { tenNhom: 'A', w: 1, h: 1 })).toBe('');
  });
});

describe('shouldApplyAutoTenSanPham', () => {
  it('không ghi đè khi user đã sửa', () => {
    expect(
      shouldApplyAutoTenSanPham({
        currentName: 'Tên tay',
        lastAutoName: 'Tên auto',
        userEdited: true,
      }),
    ).toBe(false);
  });

  it('ghi đè khi tên vẫn là giá trị auto cũ', () => {
    expect(
      shouldApplyAutoTenSanPham({
        currentName: 'Tên auto',
        lastAutoName: 'Tên auto',
        userEdited: false,
      }),
    ).toBe(true);
  });
});

describe('suggestMauTenSanPham', () => {
  it('gợi ý theo tham số L sát ví dụ thương mại', () => {
    expect(suggestMauTenSanPham(['W', 'H', 'L'])).toBe('{TenNhom} KT {W}x{H} L{L} mm');
  });
});
