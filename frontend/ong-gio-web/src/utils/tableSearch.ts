/**
 * Lọc danh sách theo chuỗi tìm kiếm (không phân biệt hoa thường).
 */
export function filterBySearch<T>(
  items: T[],
  query: string,
  getSearchText: (item: T) => string,
): T[] {
  const keyword = query.trim().toLowerCase();
  if (!keyword) return items;

  return items.filter((item) => getSearchText(item).toLowerCase().includes(keyword));
}

export function joinSearchParts(...parts: Array<string | number | boolean | null | undefined>) {
  return parts
    .filter((part) => part !== null && part !== undefined && part !== '')
    .map((part) => String(part))
    .join(' ');
}
