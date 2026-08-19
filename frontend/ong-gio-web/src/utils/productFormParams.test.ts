import { describe, expect, it } from 'vitest';
import {
  extractFormulaIdentifiers,
  findMauTenPlaceholdersMissingFromThamSo,
  findSsxAssignmentMissing,
  findThamSoMissingFromFormula,
} from './productFormParams';

describe('extractFormulaIdentifiers', () => {
  it('lấy biến, bỏ qua if/sqrt', () => {
    const ids = extractFormulaIdentifiers('R = r + W\nSsx = if(phan_manh >= 2, W, H)');
    expect(ids.has('r')).toBe(true);
    expect(ids.has('w')).toBe(true);
    expect(ids.has('phan_manh')).toBe(true);
    expect(ids.has('if')).toBe(false);
  });
});

describe('findThamSoMissingFromFormula', () => {
  it('cho phép khi mọi tham số có trong công thức', () => {
    expect(
      findThamSoMissingFromFormula(
        [{ tenThamSo: 'W' }, { tenThamSo: 'H' }, { tenThamSo: 'L' }],
        'Ssx = (W + H) * L / 1000000',
      ),
    ).toBeNull();
  });

  it('W form khớp Wmax trong công thức', () => {
    expect(
      findThamSoMissingFromFormula([{ tenThamSo: 'W' }], 'Ssx = Wmax * H'),
    ).toBeNull();
  });

  it('cảnh báo tham số không dùng trong công thức', () => {
    const msg = findThamSoMissingFromFormula(
      [{ tenThamSo: 'W' }, { tenThamSo: 'H' }, { tenThamSo: 'W2' }],
      'Ssx = W * H',
    );
    expect(msg).toContain('W2');
    expect(msg).not.toContain('W,');
  });

  it('cảnh báo khi công thức trống', () => {
    const msg = findThamSoMissingFromFormula([{ tenThamSo: 'W' }], '');
    expect(msg).toContain('W');
  });
});

describe('findSsxAssignmentMissing', () => {
  it('cho phép công thức có dòng gán Ssx', () => {
    expect(findSsxAssignmentMissing('R = r + W\nSsx = R * H / 1000000')).toBeNull();
  });

  it('báo lỗi khi không có Ssx', () => {
    const msg = findSsxAssignmentMissing('R = r + W\nArea = R * H / 1000000');
    expect(msg).toContain('Ssx');
  });
});

describe('findMauTenPlaceholdersMissingFromThamSo', () => {
  it('cho phép TenNhom và W/H/L có trên form', () => {
    expect(
      findMauTenPlaceholdersMissingFromThamSo(
        '{TenNhom} KT {W}x{H} L{L} mm',
        [{ tenThamSo: 'W' }, { tenThamSo: 'H' }, { tenThamSo: 'L' }],
      ),
    ).toBeNull();
  });

  it('W1 hợp lệ khi form có W', () => {
    expect(
      findMauTenPlaceholdersMissingFromThamSo('Côn giảm KT {W1}x{H1} - {W2}x{H2} L{L} mm', [
        { tenThamSo: 'W' },
        { tenThamSo: 'H' },
        { tenThamSo: 'W2' },
        { tenThamSo: 'H2' },
        { tenThamSo: 'L' },
      ]),
    ).toBeNull();
  });

  it('cảnh báo placeholder không có trên form', () => {
    const msg = findMauTenPlaceholdersMissingFromThamSo('{TenNhom} R{R} mm', [
      { tenThamSo: 'W' },
      { tenThamSo: 'H' },
    ]);
    expect(msg).toContain('{R}');
  });
});
