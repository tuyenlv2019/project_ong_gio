/**
 * Sinh tên sản phẩm mặc định từ mẫu cấu hình trên nhóm SP.
 * Placeholder: {TenNhom}, {W}/{W1}, {H}/{H1}, {W2}, {H2}, {L}, {R}, {D}, {N}...
 */

export type TenSanPhamTemplateContext = {
  tenNhom: string;
  w?: number | null;
  h?: number | null;
  thamSoNhap?: Record<string, number | null | undefined> | null;
};

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '';
  if (Number.isInteger(value)) return String(value);
  return String(Number(value.toFixed(3))).replace(/\.?0+$/, '');
}

function readThamSo(
  thamSo: Record<string, number | null | undefined>,
  ...keys: string[]
): number | undefined {
  for (const key of keys) {
    const direct = thamSo[key];
    if (direct != null && Number.isFinite(Number(direct))) return Number(direct);
    const matchKey = Object.keys(thamSo).find((k) => k.toLowerCase() === key.toLowerCase());
    if (matchKey != null && thamSo[matchKey] != null && Number.isFinite(Number(thamSo[matchKey]))) {
      return Number(thamSo[matchKey]);
    }
  }
  return undefined;
}

function resolvePlaceholderValue(key: string, ctx: TenSanPhamTemplateContext): string {
  const normalized = key.trim();
  if (!normalized) return '';

  if (normalized.toLowerCase() === 'tennhom') {
    return (ctx.tenNhom ?? '').trim();
  }

  const lower = normalized.toLowerCase();
  const thamSo = ctx.thamSoNhap ?? {};

  // W / W1 / Wmax → ô W trên form
  if (lower === 'w' || lower === 'w1' || lower === 'wmax') {
    const v = Number(ctx.w);
    if (Number.isFinite(v)) return formatNumber(v);
    const fromThamSo = readThamSo(thamSo, 'W', 'W1', 'Wmax');
    return fromThamSo != null ? formatNumber(fromThamSo) : '';
  }

  // H / H1 / Hmax → ô H trên form
  if (lower === 'h' || lower === 'h1' || lower === 'hmax') {
    const v = Number(ctx.h);
    if (Number.isFinite(v)) return formatNumber(v);
    const fromThamSo = readThamSo(thamSo, 'H', 'H1', 'Hmax');
    return fromThamSo != null ? formatNumber(fromThamSo) : '';
  }

  // N (độ lệch tâm) ↔ DO_LECH
  if (lower === 'n' || lower === 'do_lech') {
    const v = readThamSo(thamSo, 'N', 'DO_LECH');
    return v != null ? formatNumber(v) : '';
  }

  const direct = readThamSo(thamSo, normalized);
  return direct != null ? formatNumber(direct) : '';
}

/** Áp mẫu tên → chuỗi tên sản phẩm (rỗng nếu không có mẫu). */
export function buildTenSanPhamFromTemplate(
  template: string | null | undefined,
  ctx: TenSanPhamTemplateContext,
): string {
  if (!template?.trim()) return '';

  const filled = template.replace(/\{([^{}]+)\}/g, (_full, rawKey: string) =>
    resolvePlaceholderValue(rawKey, ctx),
  );

  return filled.replace(/\s+/g, ' ').trim();
}

/** Có nên ghi đè tên hiện tại bằng tên auto hay không. */
export function shouldApplyAutoTenSanPham(options: {
  currentName?: string | null;
  lastAutoName?: string | null;
  userEdited: boolean;
  force?: boolean;
}): boolean {
  if (options.force) return true;
  if (options.userEdited) return false;
  const current = options.currentName?.trim() ?? '';
  if (!current) return true;
  const lastAuto = options.lastAutoName?.trim() ?? '';
  return !lastAuto || current === lastAuto;
}

/** Gợi ý mẫu mặc định theo danh sách tham số form (theo convention VD thương mại). */
export function suggestMauTenSanPham(paramNames: string[]): string {
  const names = paramNames.map((p) => p.trim()).filter(Boolean);
  const has = (key: string) => names.some((n) => n.toLowerCase() === key.toLowerCase());

  if (has('W2') && has('H2') && has('W3') && has('H3') && has('W4') && has('H4') && has('L')) {
    return '{TenNhom} KT {W1}x{H1}/ {W2}x{H2}/ {W3}x{H3}/ {W4}x{H4} L{L} mm';
  }
  if (has('W2') && has('H2') && has('W3') && has('H3') && has('L')) {
    return '{TenNhom} KT {W1}x{H1}/ {W2}x{H2}/ {W3}x{H3} L{L} mm';
  }
  if (has('W2') && has('H2') && has('L') && (has('W') || has('W1'))) {
    return '{TenNhom} KT {W1}x{H1} - {W2}x{H2} L{L} mm';
  }
  if (has('D') && has('L') && (has('W') || has('W1')) && (has('H') || has('H1'))) {
    return '{TenNhom} KT {W}x{H} - D{D} L{L} mm';
  }
  if ((has('N') || has('DO_LECH')) && has('L') && (has('W') || has('W1'))) {
    return 'Ống gió KT {W}x{H} L{L} mm lệch tâm {N} mm';
  }
  if (has('R') && (has('W') || has('W1')) && (has('H') || has('H1'))) {
    return '{TenNhom} KT {W}x{H} R{R} mm';
  }
  if (has('D') && has('L') && !has('W') && !has('W1')) {
    return '{TenNhom} KT D{D} L{L} mm';
  }
  if (has('L') && (has('W') || has('W1')) && (has('H') || has('H1'))) {
    return '{TenNhom} KT {W}x{H} L{L} mm';
  }
  if ((has('W') || has('W1')) && (has('H') || has('H1'))) {
    return '{TenNhom} KT {W}x{H} mm';
  }
  return '{TenNhom}';
}
