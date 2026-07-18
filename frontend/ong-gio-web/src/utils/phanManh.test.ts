import { describe, expect, it } from 'vitest';
import { computePhanManh, isPhanManhParameter } from './phanManh';

describe('computePhanManh', () => {
  it.each([
    [300, 500, 1],
    [300, 501, 2],
    [400, 400, 1],
  ])('W=%s, H=%s trả về %s mảnh', (w, h, expected) => {
    expect(computePhanManh(w, h)).toBe(expected);
  });

  it('nhận diện tên tham số không phân biệt hoa thường', () => {
    expect(isPhanManhParameter(' PHAN_MANH ')).toBe(true);
  });
});
