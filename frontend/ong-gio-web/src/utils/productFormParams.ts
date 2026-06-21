/**
 * Ánh xạ tên tham số → ô nhập trên form đơn hàng (W/H hoặc thamSoNhap).
 */
export function getParamBindingKey(tenThamSo: string): string {
  const normalized = tenThamSo.trim().toLowerCase();
  if (normalized === 'w' || normalized === 'wmax') return 'w';
  if (normalized === 'h' || normalized === 'hmax') return 'h';
  return `thamSoNhap:${normalized}`;
}

/** Sắp xếp tham số theo thứ tự cấu hình ở mục sản phẩm. */
export function sortOrderedThamSoCoDinhs<T extends { thuTu?: number; id?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const orderA = a.thuTu ?? a.id ?? 0;
    const orderB = b.thuTu ?? b.id ?? 0;
    return orderA - orderB;
  });
}

/**
 * Trả về thông báo lỗi nếu danh sách tham số có tên trùng (không phân biệt hoa thường
 * hoặc cùng map vào một ô trên form, ví dụ W và Wmax).
 */
export function findDuplicateThamSo(thamSo: { tenThamSo?: string }[]): string | null {
  const seen = new Map<string, string>();

  for (const item of thamSo) {
    const name = item.tenThamSo?.trim();
    if (!name) continue;

    const bindingKey = getParamBindingKey(name);
    const existing = seen.get(bindingKey);
    if (existing) {
      return `Tham số "${name}" trùng với "${existing}" trên form đơn hàng`;
    }
    seen.set(bindingKey, name);
  }

  return null;
}
