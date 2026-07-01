import { describe, expect, it } from 'vitest';
import { getApiErrorMessage } from './apiError';

describe('apiError', () => {
  it('getApiErrorMessage đọc message từ response Axios', () => {
    const err = { response: { data: { message: 'Lỗi từ server' } } };
    expect(getApiErrorMessage(err, 'fallback')).toBe('Lỗi từ server');
  });

  it('getApiErrorMessage fallback khi không nhận dạng được', () => {
    expect(getApiErrorMessage('x', 'fallback')).toBe('fallback');
  });
});
