import { describe, expect, it } from 'vitest';
import { parseThamSoNhapJson, suggestThanhTienTonFromPreview } from './baoGiaFormMapper';

describe('parseThamSoNhapJson', () => {
  it('trả {} khi rỗng hoặc null', () => {
    expect(parseThamSoNhapJson()).toEqual({});
    expect(parseThamSoNhapJson('')).toEqual({});
    expect(parseThamSoNhapJson('   ')).toEqual({});
  });

  it('parse object hợp lệ', () => {
    expect(parseThamSoNhapJson('{"L":500,"R":200}')).toEqual({ L: 500, R: 200 });
  });

  it('JSON hỏng hoặc không phải object → {}', () => {
    expect(parseThamSoNhapJson('{bad json')).toEqual({});
    expect(parseThamSoNhapJson('[1,2]')).toEqual({});
    expect(parseThamSoNhapJson('"text"')).toEqual({});
  });
});

describe('suggestThanhTienTonFromPreview', () => {
  it('dùng đơn giá tôn khi có loại tôn', () => {
    const value = suggestThanhTienTonFromPreview(
      { soLuong: 2 },
      { dienTichSanXuatMetToi: 1.5, thanhTienTon: 300_000 },
      { donGiaMetToi: 100_000 },
    );
    expect(value).toBe(150_000);
  });
});
