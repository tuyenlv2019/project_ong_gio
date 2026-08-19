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

const FORMULA_KEYWORDS = new Set([
  'if',
  'sqrt',
  'min',
  'max',
  'abs',
  'and',
  'or',
  'not',
  'true',
  'false',
]);

/** Công thức hợp lệ tối thiểu phải có dòng gán kết quả vào Ssx. */
export function hasSsxAssignment(formula: string | null | undefined): boolean {
  const text = formula?.trim() ?? '';
  if (!text) return false;

  return /(^|\r?\n)\s*Ssx\s*=/i.test(text);
}

export function findSsxAssignmentMissing(formula: string | null | undefined): string | null {
  const text = formula?.trim() ?? '';
  if (!text) return null;
  if (hasSsxAssignment(formula)) return null;
  return 'Công thức phải có dòng gán kết quả vào Ssx, ví dụ: Ssx = ...';
}

/** Lấy danh sách định danh dùng trong công thức ∑Ssx (chữ thường). */
export function extractFormulaIdentifiers(formula: string): Set<string> {
  const ids = new Set<string>();
  const re = /[A-Za-z_][A-Za-z0-9_]*/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(formula)) !== null) {
    const id = match[0].toLowerCase();
    if (!FORMULA_KEYWORDS.has(id)) {
      ids.add(id);
    }
  }
  return ids;
}

function isParamUsedInFormula(tenThamSo: string, formulaIds: Set<string>): boolean {
  const name = tenThamSo.trim().toLowerCase();
  if (!name) return true;
  if (name === 'w' || name === 'wmax') {
    return formulaIds.has('w') || formulaIds.has('wmax');
  }
  if (name === 'h' || name === 'hmax') {
    return formulaIds.has('h') || formulaIds.has('hmax');
  }
  return formulaIds.has(name);
}

/**
 * Kiểm tra mọi tham số form đều xuất hiện trong công thức.
 * Trả về thông báo lỗi nếu có tham số thừa (không dùng trong công thức).
 */
export function findThamSoMissingFromFormula(
  thamSo: { tenThamSo?: string }[],
  formula: string | null | undefined,
): string | null {
  const names = thamSo
    .map((item) => item.tenThamSo?.trim())
    .filter((name): name is string => Boolean(name));

  if (names.length === 0) return null;

  const formulaText = formula?.trim() ?? '';
  if (!formulaText) {
    return `Các tham số chưa có trong công thức: ${names.join(', ')}. Mỗi tham số trên form phải xuất hiện trong công thức ∑Ssx.`;
  }

  const formulaIds = extractFormulaIdentifiers(formulaText);
  const missing = names.filter((name) => !isParamUsedInFormula(name, formulaIds));
  if (missing.length === 0) return null;

  return `Tham số không có trong công thức ∑Ssx: ${missing.join(', ')}. Bỏ khỏi form hoặc bổ sung vào công thức.`;
}

/** Placeholder đặc biệt luôn hợp lệ trong mẫu tên (không cần khai báo trên form). */
const MAU_TEN_BUILTIN = new Set(['tennhom']);

/** Trích placeholder `{...}` từ mẫu tên sản phẩm. */
export function extractMauTenPlaceholders(template: string): string[] {
  const found: string[] = [];
  const re = /\{([^{}]+)\}/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(template)) !== null) {
    const key = match[1].trim();
    if (key) found.push(key);
  }
  return found;
}

function buildThamSoLookup(thamSo: { tenThamSo?: string }[]) {
  const names = new Set<string>();
  for (const item of thamSo) {
    const name = item.tenThamSo?.trim();
    if (!name) continue;
    names.add(name.toLowerCase());
  }
  return names;
}

/** Placeholder mẫu tên có tương ứng trên danh sách tham số form không. */
export function isMauTenPlaceholderAvailable(
  placeholder: string,
  formParamNames: Set<string>,
): boolean {
  const key = placeholder.trim().toLowerCase();
  if (!key) return true;
  if (MAU_TEN_BUILTIN.has(key)) return true;

  // W / W1 / Wmax → ô W trên form
  if (key === 'w' || key === 'w1' || key === 'wmax') {
    return formParamNames.has('w') || formParamNames.has('wmax') || formParamNames.has('w1');
  }
  // H / H1 / Hmax → ô H trên form
  if (key === 'h' || key === 'h1' || key === 'hmax') {
    return formParamNames.has('h') || formParamNames.has('hmax') || formParamNames.has('h1');
  }
  // N ↔ DO_LECH
  if (key === 'n' || key === 'do_lech') {
    return formParamNames.has('n') || formParamNames.has('do_lech');
  }

  return formParamNames.has(key);
}

/**
 * Placeholder trong mẫu tên phải tồn tại trong tham số form (trừ {TenNhom}).
 * Trả về thông báo lỗi nếu có placeholder không hợp lệ.
 */
export function findMauTenPlaceholdersMissingFromThamSo(
  mauTenSanPham: string | null | undefined,
  thamSo: { tenThamSo?: string }[],
): string | null {
  const template = mauTenSanPham?.trim() ?? '';
  if (!template) return null;

  const placeholders = extractMauTenPlaceholders(template);
  if (placeholders.length === 0) return null;

  const formParams = buildThamSoLookup(thamSo);
  const missing = placeholders.filter(
    (p) => !isMauTenPlaceholderAvailable(p, formParams),
  );
  if (missing.length === 0) return null;

  const unique = [...new Set(missing.map((p) => p.trim()))];
  return `Mẫu tên dùng tham số không có trên form: ${unique.map((p) => `{${p}}`).join(', ')}. Thêm vào "Tham số người dùng nhập" hoặc sửa mẫu tên.`;
}
