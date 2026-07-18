export const PHAN_MANH_PARAMETER = 'phan_manh';
export const PHAN_MANH_PERIMETER_THRESHOLD_MM = 1600;

export function isPhanManhParameter(name: string | undefined) {
  return name?.trim().toLowerCase() === PHAN_MANH_PARAMETER;
}

/** Chu vi tiết diện > 1600 mm dùng 2 mảnh; bằng hoặc nhỏ hơn dùng 1 mảnh. */
export function computePhanManh(w: unknown, h: unknown) {
  const width = Number(w) || 0;
  const height = Number(h) || 0;
  return 2 * width + 2 * height > PHAN_MANH_PERIMETER_THRESHOLD_MM ? 2 : 1;
}
