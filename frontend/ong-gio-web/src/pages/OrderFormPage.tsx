/**
 * Trang tạo/sửa báo giá (đơn hàng) với preview tính toán theo từng dòng.
 *
 * Chức năng chính:
 * - Tạo mới / sửa / sao chép đơn hàng (`?copyFrom=id`)
 * - Nhập nhiều dòng sản phẩm trong bảng Form.List
 * - Preview diện tích, khối lượng, giá trị qua API `/api/calculation/preview`
 * - F4 tại Tên sản phẩm: chọn dòng từ đơn hàng cũ
 * - Di chuyển / xóa dòng; header sticky khi cuộn trang
 */

// --- Thư viện UI & routing ---
import { Alert, Button, Card, Col, Collapse, Form, InputNumber, Popconfirm, Popover, Row, Space, Statistic, Table, Typography, message } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined, CopyOutlined, MinusCircleOutlined, PlusOutlined, SwapOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  createBaoGia,
  formatMoney,
  getBaoGia,
  getLoaiTons,
  getNhomSanPhams,
  moneyInputNumberProps,
  previewCalculation,
  TRANG_THAI_DON,
  updateBaoGia,
} from '../api';
// --- Kiểu dữ liệu ---
import type { BaoGiaLineHistory, CalculationResult, LineFormValues, LoaiTon, NhomSanPham } from '../types';
// --- Component & util nội bộ ---
import FormulaDisplay from '../components/FormulaDisplay';
import EllipsisText from '../components/EllipsisText';
import HintInput from '../components/HintInput';
import HintInputNumber from '../components/HintInputNumber';
import HintSelect from '../components/HintSelect';
import LineHistoryPickerModal from '../components/LineHistoryPickerModal';
import { findDuplicateThamSo, getParamBindingKey, sortOrderedThamSoCoDinhs } from '../utils/productFormParams';
import {
  mapBaoGiaToLineInputs,
  suggestThanhTienTon,
  thanhTienTonPerPieceToGiaTonMetToi,
  thanhTienTonTotalToPerPiece,
} from '../utils/baoGiaFormMapper';
import { resolveMasterImageUrl } from '../utils/imageUrl';

const { Title, Text } = Typography;

/** Tổng chiều rộng tối thiểu bảng cụm sản phẩm (sum width các cột). */
const ORDER_PRODUCT_TABLE_SCROLL_X = 1379;

// =============================================================================
// Helper UI nhỏ
// =============================================================================

/** Nhãn cột con trong ô bảng — rút gọn bằng ellipsis khi chật. */
function FieldLabel({ children }: { children: string }) {
  return <EllipsisText className="price-field-label">{children}</EllipsisText>;
}

/**
 * Định dạng diện tích hiển thị với 6 chữ số thập phân.
 */
function formatArea(value: number) {
  return value.toFixed(6);
}

// =============================================================================
// Helper kích thước & validation dòng
// =============================================================================

/** Mô tả một ô kích thước map vào field form (`w`, `h` hoặc `thamSoNhap`). */
type DimensionField = {
  key: string;
  label: string;
  target: 'w' | 'h' | 'thamSoNhap';
  paramKey?: string;
};

/**
 * Map tên tham số DB sang field form.
 * W/Wmax → `w`, H/Hmax → `h`, còn lại → `thamSoNhap[key]`.
 */
function mapParamToDimensionField(tenThamSo: string): DimensionField {
  const label = tenThamSo;
  const normalized = tenThamSo.trim().toLowerCase();
  if (normalized === 'w' || normalized === 'wmax') {
    return { key: tenThamSo, label, target: 'w' };
  }
  if (normalized === 'h' || normalized === 'hmax') {
    return { key: tenThamSo, label, target: 'h' };
  }
  return { key: tenThamSo, label, target: 'thamSoNhap', paramKey: tenThamSo };
}

/**
 * Xác định các ô kích thước cần nhập theo tham số cấu hình của nhóm sản phẩm (từ DB).
 */
function getDimensionFields(nhom?: NhomSanPham): DimensionField[] {
  const seen = new Set<string>();
  const fields: DimensionField[] = [];

  for (const ten of sortOrderedThamSoCoDinhs(nhom?.thamSoCoDinhs ?? [])
    .map((t) => t.tenThamSo)
    .filter(Boolean)) {
    const bindingKey = getParamBindingKey(ten);
    if (seen.has(bindingKey)) continue;
    seen.add(bindingKey);
    fields.push(mapParamToDimensionField(ten));
  }

  return fields;
}

/** Loại sản phẩm đủ điều kiện nhập đơn: đã có công thức diện tích trong master. */
function hasCongThucDienTich(nhom?: Pick<NhomSanPham, 'congThucDienTich'> | null) {
  return Boolean(nhom?.congThucDienTich?.trim());
}

function filterOrderableNhoms(nhoms: NhomSanPham[]) {
  return nhoms.filter(hasCongThucDienTich);
}

/** Lấy giá trị kích thước từ dòng form theo cấu hình DimensionField. */
function getDimensionValue(item: Partial<LineFormValues>, field: DimensionField) {
  if (field.target === 'thamSoNhap') {
    return item.thamSoNhap?.[field.paramKey ?? field.key];
  }

  return field.target === 'w' ? item.w : item.h;
}

/** Kiểm tra giá trị số đã nhập và > 0. */
function isFilledNumber(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0;
}

/** Dòng đã nhập đủ mọi tham số kích thước theo loại sản phẩm. */
function hasAllDimensions(item: Partial<LineFormValues> | undefined, nhom?: NhomSanPham) {
  if (!item || !nhom) return false;
  const dimensionFields = getDimensionFields(nhom);
  return dimensionFields.every((field) => isFilledNumber(getDimensionValue(item, field)));
}

/** Danh sách thông báo thiếu sót của một dòng (dùng khi validate trước lưu). */
function getMissingLineMessages(item: Partial<LineFormValues>, nhom?: NhomSanPham): string[] {
  const messages: string[] = [];
  if (!item.tenSanPham?.trim()) messages.push('chưa nhập Tên sản phẩm');
  if (!item.nhomSanPhamId) messages.push('chưa chọn Loại sản phẩm');
  if (!item.loaiTonId) messages.push('chưa chọn Loại tôn');
  if (!item.soLuong || item.soLuong <= 0) messages.push('chưa nhập Số lượng');
  if (!item.donViTinh?.trim()) messages.push('chưa nhập Đơn vị tính');
  if (item.thueSuat === undefined || item.thueSuat === null) messages.push('chưa nhập Thuế suất');

  if (nhom) {
    const missingDimensions = getDimensionFields(nhom)
      .filter((field) => !isFilledNumber(getDimensionValue(item, field)))
      .map((field) => field.label);
    if (missingDimensions.length > 0) {
      messages.push(`chưa nhập Kích thước ${missingDimensions.join(', ')}`);
    }
  }

  return messages;
}

/** Gộp thông báo thiếu sót thành một chuỗi hiển thị cho dòng `lineIndex`. */
function describeIncompleteLine(
  lineIndex: number,
  item: Partial<LineFormValues>,
  nhom?: NhomSanPham,
): string {
  const missingMessages = getMissingLineMessages(item, nhom);
  const displayName = item.tenSanPham?.trim() || nhom?.tenNhom || 'chưa đặt tên';
  return `Dòng ${lineIndex + 1} (${displayName}): ${missingMessages.join('; ')}`;
}

/** Hiển thị toast cảnh báo nhiều dòng — font lớn cho dễ đọc trên form rộng. */
function showMultiLineWarning(messages: string[]) {
  message.warning({
    className: 'order-form-validation-message',
    content: (
      <div style={{ textAlign: 'left', maxWidth: 1040, fontSize: 28, lineHeight: 1.4 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ marginTop: i > 0 ? 12 : 0 }}>
            {msg}
          </div>
        ))}
      </div>
    ),
    duration: Math.min(4 + messages.length * 2, 12),
  });
}

/** Hiển thị toast cảnh báo một dòng — font lớn. */
function showLargeWarning(text: string) {
  message.warning({
    className: 'order-form-validation-message',
    content: <div style={{ fontSize: 28, lineHeight: 1.4 }}>{text}</div>,
    duration: 6,
  });
}

/** Dòng có bất kỳ dữ liệu nhập nào (dùng phân biệt dòng trống vs dòng đang nhập dở). */
function hasAnyLineInput(item: Partial<LineFormValues> | undefined) {
  if (!item) return false;
  return Boolean(
    item.nhomSanPhamId ||
      item.loaiTonId ||
      item.tenSanPham?.trim() ||
      item.donViTinh?.trim() ||
      item.w ||
      item.h ||
      item.soLuong ||
      item.giaNhanCong ||
      item.phuKien ||
      item.ghiChu?.trim() ||
      Object.keys(item.thamSoNhap ?? {}).length > 0,
  );
}

/** Dòng cuối chưa có tên sản phẩm — coi là dòng đệm, không bắt buộc nhập. */
function isSkippedTrailingLine(
  lineIndex: number,
  item: Partial<LineFormValues> | undefined,
  totalLines: number,
) {
  return lineIndex === totalLines - 1 && !item?.tenSanPham?.trim();
}

/** Số dòng thật (không tính dòng đệm trống cuối bảng). */
function getMovableRowCount(items: Partial<LineFormValues>[]) {
  if (items.length === 0) return 0;
  const lastIsBuffer = isSkippedTrailingLine(items.length - 1, items[items.length - 1], items.length);
  return lastIsBuffer ? items.length - 1 : items.length;
}

/**
 * Tính đơn giá / thành tiền dòng.
 * Đơn giá = giá tôn (đ/mét tới) × ∑Ssx mét tới + nhân công + phụ kiện.
 * Ô Giá tôn = tiền tôn/1 cái (không đổi khi đổi số lượng).
 */
function calcLinePricing(
  preview: CalculationResult,
  item: Partial<LineFormValues>,
  donGiaMetToiFallback?: number,
): { unitPrice: number; lineTotal: number; giaTonMetToi: number } {
  const soLuong = Number(item.soLuong) || 1;
  const metToi = preview.dienTichSanXuatMetToi;
  const giaNhanCong = Number(item.giaNhanCong) || 0;
  const phuKien = Number(item.phuKien) || 0;

  const defaultGiaTonMetToi = donGiaMetToiFallback ?? 0;
  const isManualTon = Boolean(item.thanhTienTonManual);
  const giaTonMetToi =
    isManualTon && item.thanhTienTon != null
      ? thanhTienTonPerPieceToGiaTonMetToi(item.thanhTienTon, metToi)
      : item.thanhTienTon != null && item.thanhTienTon > 0
        ? thanhTienTonPerPieceToGiaTonMetToi(item.thanhTienTon, metToi)
        : defaultGiaTonMetToi;

  const unitPrice = Math.round(giaTonMetToi * metToi + giaNhanCong + phuKien);
  return { unitPrice, lineTotal: unitPrice * soLuong, giaTonMetToi };
}

/** Cập nhật index trong Set sau khi Form.List move dòng. */
function remapIndexSetAfterMove(indices: Set<number>, fromIndex: number, toIndex: number) {
  const next = new Set<number>();
  indices.forEach((index) => {
    if (index === fromIndex) {
      next.add(toIndex);
      return;
    }
    if (fromIndex < toIndex && index > fromIndex && index <= toIndex) {
      next.add(index - 1);
      return;
    }
    if (fromIndex > toIndex && index >= toIndex && index < fromIndex) {
      next.add(index + 1);
      return;
    }
    next.add(index);
  });
  return next;
}

/** Giá trị mặc định khi thêm dòng sản phẩm mới. */
const defaultLineValues = { donViTinh: 'cái', thueSuat: 8, thamSoNhap: {} };

/**
 * Tạo object dòng rỗng; nếu có master data thì gán loại SP/tôn đầu tiên.
 */
function createEmptyLine(nhoms?: NhomSanPham[], tons?: LoaiTon[]) {
  if (nhoms?.[0] && tons?.[0]) {
    return {
      ...defaultLineValues,
      nhomSanPhamId: nhoms[0].id,
      loaiTonId: tons[0].id,
      w: 0,
      h: 0,
      soLuong: 1,
      giaNhanCong: 0,
      phuKien: 0,
    };
  }
  return { ...defaultLineValues };
}

/**
 * Component chính của trang form đơn hàng.
 * @returns Giao diện tạo hoặc sửa báo giá.
 */
export default function OrderFormPage() {
  // --- Routing: sửa theo id hoặc sao chép từ ?copyFrom= ---
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id);
  const copyFromId = useMemo(() => {
    if (isEdit) return null;
    const raw = searchParams.get('copyFrom');
    if (!raw || !/^\d+$/.test(raw)) return null;
    return Number(raw);
  }, [isEdit, searchParams]);
  const navigate = useNavigate();

  // --- Form Ant Design & theo dõi dòng sản phẩm ---
  const [form] = Form.useForm();
  const lineInputs = Form.useWatch('lineInputs', form);

  // --- Master data & kết quả tính toán ---
  const [nhomList, setNhomList] = useState<NhomSanPham[]>([]);
  const orderableNhomList = useMemo(() => filterOrderableNhoms(nhomList), [nhomList]);
  const [loaiTonList, setLoaiTonList] = useState<LoaiTon[]>([]);
  const [preview, setPreview] = useState<CalculationResult | null>(null);
  const [linePreviews, setLinePreviews] = useState<Record<number, CalculationResult>>({});

  // --- UI state ---
  const [loading, setLoading] = useState(false);
  const [selectedNhomRow, setSelectedNhomRow] = useState<NhomSanPham | undefined>(undefined);
  const [requiredHeaders] = useState<string[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLineIndex, setHistoryLineIndex] = useState<number | null>(null);
  const [movePopoverIndex, setMovePopoverIndex] = useState<number | null>(null);
  const [moveTargetStt, setMoveTargetStt] = useState<number>(1);
  const [copySourceMa, setCopySourceMa] = useState<string | null>(null);

  // --- Sticky header: đo chiều cao khối Thông tin đơn + Cụm SP cho offset bảng ---
  const stickyHeaderRef = useRef<HTMLDivElement>(null);
  const [productTableStickyOffset, setProductTableStickyOffset] = useState(180);
  /** Tránh đánh dấu Giá tôn là nhập thủ công khi form tự cập nhật từ preview. */
  const isAutoUpdatingThanhTienTonRef = useRef(false);
  /** Dòng user đã sửa Giá tôn — cập nhật đồng bộ, tránh bị preview ghi đè. */
  const thanhTienTonManualLinesRef = useRef<Set<number>>(new Set());

  const isThanhTienTonManual = (line: Partial<LineFormValues> | undefined, index: number) =>
    Boolean(line?.thanhTienTonManual) || thanhTienTonManualLinesRef.current.has(index);

  const markManualTonFromChange = (changedValues: { lineInputs?: Array<Partial<LineFormValues> | null> }) => {
    const changedLines = changedValues?.lineInputs;
    if (!Array.isArray(changedLines)) return;
    changedLines.forEach((patch, index) => {
      if (patch && Object.prototype.hasOwnProperty.call(patch, 'thanhTienTon')) {
        thanhTienTonManualLinesRef.current.add(index);
        form.setFieldValue(['lineInputs', index, 'thanhTienTonManual'], true);
      }
    });
  };

  const markManualTonLine = (lineIndex: number) => {
    thanhTienTonManualLinesRef.current.add(lineIndex);
    form.setFieldValue(['lineInputs', lineIndex, 'thanhTienTonManual'], true);
  };

  const withManualTonFlags = (items: LineFormValues[]) =>
    items.map((line, index) => ({
      ...line,
      thanhTienTonManual: isThanhTienTonManual(line, index),
    }));

  /** Options loại SP cho dropdown: chỉ SP có công thức; giữ lựa chọn cũ khi sửa đơn. */
  const getNhomSelectOptions = (lineIndex: number) => {
    const options = orderableNhomList.map((n) => ({ value: n.id, label: n.tenNhom }));
    const currentId = Number(lineInputs?.[lineIndex]?.nhomSanPhamId);
    if (currentId && !orderableNhomList.some((n) => n.id === currentId)) {
      const legacy = nhomList.find((n) => n.id === currentId);
      if (legacy) {
        options.push({ value: legacy.id, label: `${legacy.tenNhom} (chưa có công thức)` });
      }
    }
    return options;
  };

  /** Cập nhật offset header bảng khi khối sticky đổi kích thước (resize / copy banner). */
  useEffect(() => {
    const stickyHeader = stickyHeaderRef.current;
    if (!stickyHeader) return;

    const updateStickyOffset = () => {
      setProductTableStickyOffset(stickyHeader.offsetHeight);
    };

    updateStickyOffset();
    const observer = new ResizeObserver(updateStickyOffset);
    observer.observe(stickyHeader);
    window.addEventListener('resize', updateStickyOffset);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateStickyOffset);
    };
  }, [copySourceMa]);

  /**
   * Load master data và khởi tạo form:
   * - Sửa: nạp báo giá theo `id`
   * - Sao chép: nạp từ `copyFromId`, bỏ tên KH, reset trạng thái
   * - Tạo mới: một dòng rỗng
   */
  useEffect(() => {
    (async () => {
      const [nhoms, tons] = await Promise.all([getNhomSanPhams(), getLoaiTons()]);
      const orderableNhoms = filterOrderableNhoms(nhoms);
      setNhomList(nhoms);
      setLoaiTonList(tons);

      if (isEdit && id) {
        const bg = await getBaoGia(Number(id));
        const initialLines = mapBaoGiaToLineInputs(bg);
        const lineInputs = initialLines.length > 0
          ? [...initialLines, createEmptyLine(orderableNhoms, tons)]
          : [createEmptyLine(orderableNhoms, tons)];
        form.setFieldsValue({
          tenKhachHang: bg.tenKhachHang,
          trangThai: bg.trangThai || 'CHUA_XU_LY',
          lineInputs,
        });
        if (initialLines.length > 0) {
          await refreshPreviews({ lineInputs }, nhoms);
        }
      } else if (copyFromId) {
        try {
          const bg = await getBaoGia(copyFromId);
          setCopySourceMa(bg.maBaoGia);
          const initialLines = mapBaoGiaToLineInputs(bg);
          const lineInputs = initialLines.length > 0
            ? [...initialLines, createEmptyLine(orderableNhoms, tons)]
            : [createEmptyLine(orderableNhoms, tons)];
          form.setFieldsValue({
            tenKhachHang: '',
            trangThai: 'CHUA_XU_LY',
            lineInputs,
          });
          if (initialLines.length > 0) {
            await refreshPreviews({ lineInputs }, nhoms);
          }
        } catch {
          message.error('Không tải được đơn hàng để sao chép');
          navigate('/don-hang/tao-moi', { replace: true });
        }
      } else if (orderableNhoms[0] && tons[0]) {
        form.setFieldsValue({
          trangThai: 'CHUA_XU_LY',
          lineInputs: [createEmptyLine(orderableNhoms, tons)],
        });
      }
    })();
  }, [form, id, isEdit, copyFromId, navigate]);

  /**
   * Nếu dòng cuối đã được điền, tự động thêm một dòng rỗng mới.
   * @param allValues Toàn bộ giá trị hiện tại của form.
   */
  const ensureNewRowIfNeeded = (allValues: any) => {
    const items = allValues.lineInputs || [];
    if (items.length === 0) {
      form.setFieldsValue({ lineInputs: [createEmptyLine(orderableNhomList, loaiTonList)] });
      return;
    }
    const last = items[items.length - 1];
    const lastNhom = nhomList.find((n) => n.id === Number(last?.nhomSanPhamId));
    const filled =
      last &&
      last.tenSanPham &&
      last.nhomSanPhamId &&
      last.loaiTonId &&
      last.soLuong > 0 &&
      hasAllDimensions(last, lastNhom);
    if (filled) {
      form.setFieldsValue({ lineInputs: [...items, createEmptyLine(orderableNhomList, loaiTonList)] });
    }
  };

  /**
   * Gọi API preview cho từng dòng hợp lệ và lưu kết quả vào state.
   * @param allValues Toàn bộ giá trị form hiện tại.
   * @param customNhomList Danh sách nhóm sản phẩm (dùng khi state chưa cập nhật kịp).
   */
  const refreshPreviews = async (allValues: any, customNhomList?: NhomSanPham[]) => {
    const items: LineFormValues[] = withManualTonFlags(allValues.lineInputs || []);
    const previews: Record<number, CalculationResult> = {};
    const currentNhomList = customNhomList || nhomList;
    isAutoUpdatingThanhTienTonRef.current = true;
    try {
      for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        const nhom = currentNhomList.find((n) => n.id === Number(item?.nhomSanPhamId));
        const canPreview = item && item.nhomSanPhamId && item.loaiTonId && Number(item.soLuong) > 0 && hasAllDimensions(item, nhom);
        if (canPreview) {
          try {
            const res = await previewCalculation({
              ...item,
              thueSuat: (item.thueSuat ?? 0) / 100,
            } as any);
            previews[index] = res;

            // Giá tôn = tiền tôn/1 cái; gợi ý = đơn giá/mét tới × ∑Ssx mét tới (không × SL)
            const ton = loaiTonList.find((t) => t.id === Number(item.loaiTonId));
            if (!isThanhTienTonManual(item, index) && ton) {
              form.setFieldValue(
                ['lineInputs', index, 'thanhTienTon'],
                suggestThanhTienTon(ton.donGiaMetToi, res.dienTichSanXuatMetToi),
              );
            }
          } catch {
            // Bỏ qua lỗi preview của dòng này để không làm hỏng toàn bộ form.
          }
        }
      }
    } finally {
      isAutoUpdatingThanhTienTonRef.current = false;
    }
    setLinePreviews(previews);
    return previews;
  };

  /** Mở modal F4 chọn dòng từ đơn hàng cũ cho dòng `lineIndex`. */
  const openLineHistory = (lineIndex: number) => {
    setHistoryLineIndex(lineIndex);
    setHistoryOpen(true);
  };

  /** Đồng bộ `linePreviews` sau khi Form.List move (index preview theo dòng). */
  const remapLinePreviewsAfterMove = (fromIndex: number, toIndex: number) => {
    setLinePreviews((prev) => {
      const len = Math.max(
        Object.keys(prev).reduce((max, key) => Math.max(max, Number(key) + 1), 0),
        fromIndex + 1,
        toIndex + 1,
      );
      const arr: (CalculationResult | undefined)[] = Array.from({ length: len }, (_, i) => prev[i]);
      const [moved] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, moved);
      const next: Record<number, CalculationResult> = {};
      arr.forEach((preview, index) => {
        if (preview !== undefined) next[index] = preview;
      });
      return next;
    });
    thanhTienTonManualLinesRef.current = remapIndexSetAfterMove(
      thanhTienTonManualLinesRef.current,
      fromIndex,
      toIndex,
    );
  };

  /** Di chuyển dòng từ `fromIndex` sang `toIndex`, cập nhật preview và dòng đệm. */
  const handleMoveLineTo = async (
    fromIndex: number,
    toIndex: number,
    move: (from: number, to: number) => void,
  ) => {
    const items: LineFormValues[] = form.getFieldValue('lineInputs') || [];
    const movableCount = getMovableRowCount(items);
    if (
      fromIndex === toIndex
      || fromIndex < 0
      || toIndex < 0
      || fromIndex >= items.length
      || toIndex >= movableCount
      || isSkippedTrailingLine(fromIndex, items[fromIndex], items.length)
    ) {
      return;
    }

    move(fromIndex, toIndex);
    remapLinePreviewsAfterMove(fromIndex, toIndex);

    const linesAfterMove = form.getFieldValue('lineInputs') || [];
    ensureNewRowIfNeeded({ lineInputs: linesAfterMove });
    const finalLines = form.getFieldValue('lineInputs') || [];
    await refreshPreviews({ lineInputs: finalLines });
  };

  /** Di chuyển lên/xuống một bậc. */
  const handleMoveLine = async (
    fromIndex: number,
    direction: 'up' | 'down',
    move: (from: number, to: number) => void,
  ) => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    await handleMoveLineTo(fromIndex, toIndex, move);
  };

  /** Xác nhận di chuyển dòng đến STT người dùng nhập trong popover. */
  const confirmMoveToStt = async (
    fromIndex: number,
    move: (from: number, to: number) => void,
  ) => {
    const items: LineFormValues[] = form.getFieldValue('lineInputs') || [];
    const movableCount = getMovableRowCount(items);
    const targetStt = Math.round(moveTargetStt);

    if (!Number.isFinite(targetStt) || targetStt < 1 || targetStt > movableCount) {
      showLargeWarning(`Vui lòng nhập STT từ 1 đến ${movableCount}.`);
      return;
    }

    const toIndex = targetStt - 1;
    if (toIndex === fromIndex) {
      setMovePopoverIndex(null);
      return;
    }

    await handleMoveLineTo(fromIndex, toIndex, move);
    setMovePopoverIndex(null);
  };

  /** Áp dụng dòng lịch sử (F4) vào dòng form hiện tại. */
  const applyHistoryLine = async (lineIndex: number, item: BaoGiaLineHistory) => {
    const historyTonTotal = item.thanhTienTon;
    const lines = [...(form.getFieldValue('lineInputs') || [])];
    lines[lineIndex] = {
      ...lines[lineIndex],
      tenSanPham: item.tenSanPham,
      nhomSanPhamId: item.nhomSanPhamId,
      loaiTonId: item.loaiTonId,
      w: item.w,
      h: item.h,
      thamSoNhap: item.thamSoNhapJson ? JSON.parse(item.thamSoNhapJson) : {},
      soLuong: item.soLuong,
      donViTinh: item.donViTinh ?? 'cái',
      thueSuat: (item.thueSuat ?? 0.08) * 100,
      giaNhanCong: item.giaNhanCong ?? 0,
      phuKien: item.phuKien ?? 0,
      ghiChu: item.ghiChu ?? undefined,
      thanhTienTonManual: false,
    };
    form.setFieldsValue({ lineInputs: lines });
    setHistoryOpen(false);
    ensureNewRowIfNeeded({ lineInputs: lines });
    const previews = await refreshPreviews({ lineInputs: form.getFieldValue('lineInputs') || lines });
    const preview = previews[lineIndex];
    if (preview && historyTonTotal > 0) {
      isAutoUpdatingThanhTienTonRef.current = true;
      form.setFieldValue(['lineInputs', lineIndex, 'thanhTienTon'], thanhTienTonTotalToPerPiece(historyTonTotal, item.soLuong));
      markManualTonLine(lineIndex);
      isAutoUpdatingThanhTienTonRef.current = false;
    }
  };

  /**
   * Tính tổng theo các preview đã có và thuế suất hiện tại.
   * Thuế VAT được nhóm theo từng mức % (mỗi loại một dòng).
   */
  const calculateTotals = () => {
    let totalThanhTien = 0;
    const items = withManualTonFlags(form.getFieldValue('lineInputs') || []);
    const thueByRate = new Map<number, number>();

    items.forEach((item: LineFormValues, index: number) => {
      const preview = linePreviews[index];
      if (preview) {
        const ton = loaiTonList.find((t) => t.id === Number(item.loaiTonId));
        const { lineTotal } = calcLinePricing(preview, item, ton?.donGiaMetToi);
        totalThanhTien += lineTotal;
        const rate = Number(item?.thueSuat ?? 0);
        const lineThue = lineTotal * (rate / 100);
        thueByRate.set(rate, (thueByRate.get(rate) ?? 0) + lineThue);
      }
    });

    const thueTheoLoai = [...thueByRate.entries()]
      .map(([thueSuat, tienThue]) => ({ thueSuat, tienThue }))
      .sort((a, b) => a.thueSuat - b.thueSuat);
    const totalThue = thueTheoLoai.reduce((sum, g) => sum + g.tienThue, 0);

    return {
      tongTien: totalThanhTien,
      thueTien: totalThue,
      thueTheoLoai,
      tongTienSauThue: totalThanhTien + totalThue,
    };
  };

  /**
   * Kiểm tra dòng chưa đủ thông tin để highlight đỏ trên bảng.
   * Bỏ qua dòng đệm cuối và dòng hoàn toàn trống.
   */
  const isRowIncomplete = (item: any, lineIndex?: number, totalLines?: number) => {
    if (
      lineIndex !== undefined &&
      totalLines !== undefined &&
      isSkippedTrailingLine(lineIndex, item, totalLines)
    ) {
      return false;
    }
    const nhom = nhomList.find((n) => n.id === Number(item?.nhomSanPhamId));
    if (!hasAnyLineInput(item)) return false;
    
    return (
      !item?.tenSanPham?.trim() ||
      !item?.nhomSanPhamId ||
      !item?.loaiTonId ||
      !item?.soLuong ||
      item.soLuong <= 0 ||
      !item?.donViTinh?.trim() ||
      item?.thueSuat === undefined ||
      item?.thueSuat === null ||
      !hasAllDimensions(item, nhom)
    );
  };

  /**
   * Sinh rule bắt buộc cho từng cột nếu file Excel yêu cầu.
   * @param title Tên cột.
   * @returns Rule validation hoặc undefined.
   */
  const requiredRulesFor = (title: string) => {
    if (requiredHeaders.includes(title)) return [{ required: true, message: `${title} là bắt buộc` }];
    return undefined;
  };

  /**
   * Khi form thay đổi: cập nhật preview, nhóm đang chọn và tự thêm dòng nếu cần.
   * @param _ Giá trị thay đổi, không dùng trực tiếp.
   * @param allValues Toàn bộ giá trị form hiện tại.
   */
  const onValuesChange = async (changedValues: any, allValues: any) => {
    try {
      markManualTonFromChange(changedValues);
      const lineInputs = withManualTonFlags(allValues.lineInputs || []);
      await refreshPreviews({ ...allValues, lineInputs });
      const items = allValues.lineInputs || [];
      const rowWithNhom = [...items].reverse().find((item) => item?.nhomSanPhamId);
      if (rowWithNhom?.nhomSanPhamId) {
        const found = nhomList.find((n) => n.id === Number(rowWithNhom.nhomSanPhamId));
        setSelectedNhomRow(found);
      } else {
        setSelectedNhomRow(undefined);
      }
      ensureNewRowIfNeeded(allValues);
    } catch {
      setPreview(null);
    }
  };

  /**
   * Xác thực form và gửi payload tạo hoặc cập nhật báo giá lên server.
   */
  const save = async () => {
    let header: { tenKhachHang: string; trangThai: string };
    try {
      header = await form.validateFields(['tenKhachHang', 'trangThai']);
    } catch (err: unknown) {
      const firstError = (err as { errorFields?: { errors?: string[] }[] })?.errorFields?.[0]?.errors?.[0];
      showLargeWarning(firstError ?? 'Vui lòng nhập tên khách hàng');
      return;
    }
    const allLineInputs: LineFormValues[] = form.getFieldValue('lineInputs') || [];
    const incompleteMessages = allLineInputs
      .map((line, index) => {
        if (isSkippedTrailingLine(index, line, allLineInputs.length)) return null;
        if (!hasAnyLineInput(line)) return null;
        const nhom = nhomList.find((n) => n.id === Number(line?.nhomSanPhamId));
        if (!isRowIncomplete(line, index, allLineInputs.length)) return null;
        return describeIncompleteLine(index, line, nhom);
      })
      .filter((msg): msg is string => Boolean(msg));

    if (incompleteMessages.length > 0) {
      showMultiLineWarning(incompleteMessages);
      return;
    }
    const filtered = allLineInputs.filter((l, index) => {
      if (isSkippedTrailingLine(index, l, allLineInputs.length)) return false;
      const nhom = nhomList.find((n) => n.id === Number(l?.nhomSanPhamId));
      return (
        l &&
        l.tenSanPham?.trim() &&
        l.nhomSanPhamId &&
        l.loaiTonId &&
        l.soLuong > 0 &&
        hasAllDimensions(l, nhom)
      );
    });

    if (filtered.length === 0) {
      showLargeWarning('Thêm ít nhất một cụm sản phẩm');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        tenKhachHang: header.tenKhachHang,
        trangThai: header.trangThai,
        thueSuat: (filtered[0]?.thueSuat ?? 0) / 100,
        lines: filtered.map((l) => ({
          tenSanPham: l.tenSanPham,
          donViTinh: l.donViTinh,
          thueSuat: (l.thueSuat ?? 0) / 100,
          nhomSanPhamId: l.nhomSanPhamId,
          loaiTonId: l.loaiTonId,
          w: l.w,
          h: l.h,
          thanhTienTon: l.thanhTienTon,
          thamSoNhap: l.thamSoNhap,
          soLuong: l.soLuong,
          giaNhanCong: l.giaNhanCong,
          phuKien: l.phuKien,
          ghiChu: l.ghiChu,
        })),
      };
      if (isEdit && id) {
        await updateBaoGia(Number(id), payload);
        message.success('Đã cập nhật đơn hàng');
      } else {
        await createBaoGia(payload);
        message.success('Đã tạo đơn hàng');
      }
      navigate('/don-hang');
    } catch {
      message.error('Lưu thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Tiêu đề trang + nút sao chép khi đang sửa */}
      <Space align="center" style={{ marginBottom: copySourceMa ? 0 : 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          {isEdit ? 'Sửa đơn hàng' : copySourceMa ? 'Tạo đơn hàng mới (sao chép)' : 'Tạo đơn hàng mới'}
        </Title>
        {isEdit && id && (
          <Button
            icon={<CopyOutlined />}
            onClick={() => navigate(`/don-hang/tao-moi?copyFrom=${id}`)}
          >
            Sao chép đơn
          </Button>
        )}
      </Space>
      {/* Banner khi đang tạo đơn từ sao chép */}
      {copySourceMa && (
        <Alert
          type="info"
          showIcon
          style={{ margin: '16px 0' }}
          message={`Đang tạo đơn mới từ ${copySourceMa}. Vui lòng nhập lại tên khách hàng. Trạng thái đặt lại "Chưa xử lý"; mã báo giá mới sẽ được tạo khi lưu.`}
        />
      )}
      <Form
        form={form}
        layout="vertical"
        onValuesChange={onValuesChange}
        validateMessages={{
          required: 'Vui lòng nhập ${label}',
        }}
      >
        {/* Khối sticky: Thông tin đơn hàng + tiêu đề Cụm sản phẩm */}
        <div ref={stickyHeaderRef} className="order-form-sticky-header">
          <Card title="Thông tin đơn hàng" className="order-order-info-card">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="tenKhachHang"
                  label="Tên khách hàng"
                  rules={[{ required: true, message: 'Vui lòng nhập tên khách hàng' }]}
                >
                  <HintInput placeholder="Nhập tên khách hàng" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="trangThai"
                  label="Trạng thái đơn hàng"
                  rules={[{ required: true, message: 'Vui lòng chọn trạng thái đơn hàng' }]}
                >
                  <HintSelect
                    placeholder="Chọn trạng thái đơn hàng"
                    options={Object.entries(TRANG_THAI_DON).map(([value, opt]) => ({
                      value,
                      label: opt.label,
                    }))}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
          <div className="order-product-cluster-bar">
            <span className="order-product-cluster-bar-title">Cụm sản phẩm</span>
          </div>
        </div>

        {/* Bảng nhập dòng sản phẩm (Form.List + Table) */}
        <Card className="order-product-cluster-card">
          <Form.List name="lineInputs">
            {(fields, { add, remove, move }) => {
              /** Định nghĩa cột bảng cụm sản phẩm — mỗi cột render Form.Item theo field.name */
              const columns: any[] = [
                // Cột STT (tự tính từ index)
                {
                  title: 'STT',
                  dataIndex: 'stt',
                  width: 44,
                  align: 'center' as const,
                  onHeaderCell: () => ({ className: 'order-stt-column' }),
                  onCell: () => ({ className: 'order-stt-column' }),
                  render: (_: any, __: any, idx: number) => idx + 1,
                },
                // Cột loại SP + tên SP (F4 mở lịch sử)
                {
                  title: 'Sản phẩm',
                  dataIndex: 'sanPham',
                  width: 260,
                  render: (_: any, field: any) => (
                    <div className="price-fields-stack">
                      <div className="price-field-row">
                        <FieldLabel>Loại sản phẩm</FieldLabel>
                        <Form.Item name={[field.name, 'nhomSanPhamId']} noStyle rules={requiredRulesFor('Loại sản phẩm') ?? [{ required: true, message: 'Chọn loại SP' }]}>
                          <HintSelect placeholder="Chọn loại" options={getNhomSelectOptions(field.name)} />
                        </Form.Item>
                      </div>
                      <div className="price-field-row">
                        <FieldLabel>Tên sản phẩm</FieldLabel>
                        <Form.Item
                          name={[field.name, 'tenSanPham']}
                          noStyle
                          rules={
                            field.name === fields.length - 1
                              ? undefined
                              : [{ required: true, message: 'Nhập tên sản phẩm' }]
                          }
                        >
                          <HintInput
                            placeholder="Nhập tên sản phẩm (F4: chọn từ đơn cũ)"
                            onFocus={() => setHistoryLineIndex(field.name)}
                            onKeyDown={(event) => {
                              if (event.key === 'F4') {
                                event.preventDefault();
                                openLineHistory(field.name);
                              }
                            }}
                          />
                        </Form.Item>
                      </div>
                    </div>
                  ),
                },
                // Cột kích thước động theo tham số loại SP (DB)
                {
                  title: 'Kích thước (mm)',
                  dataIndex: 'kichThuoc',
                  width: 293,
                  align: 'center' as const,
                  onCell: () => ({ className: 'dimension-column-cell' }),
                  onHeaderCell: () => ({ className: 'dimension-column-cell' }),
                  render: (_: any, field: any) => {
                    const nhomId = form.getFieldValue(['lineInputs', field.name, 'nhomSanPhamId']);
                    const nhom = nhomList.find((n) => n.id === nhomId);
                    const dimensionFields = getDimensionFields(nhom);

                    return (
                      <div className="dimension-fields-grid">
                        {dimensionFields.map((dimension) => {
                          const name = dimension.target === 'thamSoNhap'
                            ? [field.name, 'thamSoNhap', dimension.paramKey ?? dimension.key]
                            : [field.name, dimension.target];

                          return (
                            <Form.Item
                              key={dimension.key}
                              name={name}
                              noStyle
                              rules={[{ required: true, message: `Nhập ${dimension.label}` }]}
                            >
                              <HintInputNumber
                                className="dimension-field-input"
                                min={dimension.key === 'phan_manh' ? 1 : 0}
                                step={dimension.key === 'phan_manh' ? 1 : 10}
                                placeholder={dimension.label}
                                tooltip={dimension.label}
                                addonBefore={dimension.label}
                                controls={false}
                                style={{ width: '100%' }}
                              />
                            </Form.Item>
                          );
                        })}
                      </div>
                    );
                  },
                },
                // Cột loại tôn + khối lượng (preview)
                {
                  title: 'Thông tin tôn',
                  dataIndex: 'loaiTonTrongLuong',
                  width: 150,
                  onHeaderCell: () => ({ className: 'order-ton-column' }),
                  onCell: () => ({ className: 'order-ton-column' }),
                  render: (_: any, field: any) => {
                    const preview = linePreviews[field.name];
                    return (
                      <div className="price-fields-stack ton-fields-stack">
                        <div className="price-field-row">
                          <FieldLabel>Loại Tôn</FieldLabel>
                          <Form.Item
                            name={[field.name, 'loaiTonId']}
                            noStyle
                            rules={requiredRulesFor('Loại tôn') ?? requiredRulesFor('Xuất xứ/Độ dày tôn') ?? [{ required: true, message: 'Chọn loại tôn' }]}
                          >
                            <HintSelect
                              className="ton-field-select"
                              placeholder="Chọn tôn"
                              tooltip="Loại tôn"
                              options={loaiTonList.map((t) => ({ value: t.id, label: `${t.thuongHieu} ${t.doDay}mm` }))}
                            />
                          </Form.Item>
                        </div>
                        <div className="price-field-row">
                          <FieldLabel>Khối lượng(Kg)</FieldLabel>
                          <span className="display-value ton-display-value" title={preview ? `${preview.trongLuongKg.toFixed(1)} kg` : undefined}>
                            {preview ? `${preview.trongLuongKg.toFixed(1)} kg` : '-'}
                          </span>
                        </div>
                      </div>
                    );
                  },
                },
                // Cột diện tích sản xuất (chỉ đọc từ preview)
                {
                  title: 'Diện tích Sx',
                  dataIndex: 'dienTichSx',
                  width: 100,
                  align: 'left' as const,
                  onHeaderCell: () => ({ className: 'order-area-column' }),
                  onCell: () => ({ className: 'order-area-column' }),
                  render: (_: any, field: any) => {
                    const preview = linePreviews[field.name];
                    if (!preview) return '-';
                    return (
                      <div className="price-fields-stack area-fields-stack">
                        <div className="price-field-row">
                          <FieldLabel>Ssx (m²)</FieldLabel>
                          <span className="display-value area-display-value" title={`∑Ssx 1 cái: ${formatArea(preview.dienTichSx1Cai)} m²`}>
                            {formatArea(preview.dienTichSx1Cai)}
                          </span>
                        </div>
                        <div className="price-field-row">
                          <FieldLabel>Ssx (mét tới)</FieldLabel>
                          <span className="display-value area-display-value" title={`∑Ssx mét tới: ${formatArea(preview.dienTichSanXuatMetToi)} m`}>
                            {formatArea(preview.dienTichSanXuatMetToi)}
                          </span>
                        </div>
                      </div>
                    );
                  },
                },
                // Cột chi phí nhập tay: giá tôn, nhân công, phụ kiện
                {
                  title: 'Chi phí (VNĐ)',
                  dataIndex: 'giaTri',
                  width: 120,
                  render: (_: any, field: any) => (
                    <div className="price-fields-stack">
                      <div className="price-field-row">
                        <FieldLabel>Giá tôn</FieldLabel>
                        <Form.Item name={[field.name, 'thanhTienTon']} noStyle>
                          <HintInputNumber
                            min={0}
                            step={1000}
                            precision={0}
                            controls={false}
                            style={{ width: '100%' }}
                            tooltip="Tiền tôn cho 1 cái (có thể sửa). Gợi ý tự động khi đổi loại tôn/kích thước nếu chưa nhập tay"
                            {...moneyInputNumberProps}
                            onChange={() => {
                              if (!isAutoUpdatingThanhTienTonRef.current) {
                                markManualTonLine(field.name);
                              }
                            }}
                          />
                        </Form.Item>
                      </div>
                      <div className="price-field-row">
                        <FieldLabel>Giá nhân công</FieldLabel>
                        <Form.Item
                          name={[field.name, 'giaNhanCong']}
                          noStyle
                          rules={requiredRulesFor('Giá nhân công (VNĐ)') ? [{ required: true, message: 'Nhập giá nhân công' }] : undefined}
                        >
                          <HintInputNumber min={0} precision={0} controls={false} style={{ width: '100%' }} tooltip="Giá nhân công (VNĐ)" {...moneyInputNumberProps} />
                          </Form.Item>
                      </div>
                      <div className="price-field-row">
                        <FieldLabel>Phụ kiện đi kèm</FieldLabel>
                        <Form.Item
                          name={[field.name, 'phuKien']}
                          noStyle
                          rules={requiredRulesFor('Phụ kiện đi kèm (VNĐ)') ? [{ required: true, message: 'Nhập phụ kiện' }] : undefined}
                        >
                          <HintInputNumber min={0} precision={0} controls={false} style={{ width: '100%' }} tooltip="Phụ kiện đi kèm (VNĐ)" {...moneyInputNumberProps} />
                        </Form.Item>
                      </div>
                    </div>
                  ),
                },
                // Cột đơn vị, số lượng, thuế suất
                {
                  title: 'Thông tin dòng',
                  dataIndex: 'donViSoLuongThue',
                  width: 125,
                  onHeaderCell: () => ({ className: 'order-line-info-column' }),
                  onCell: () => ({ className: 'order-line-info-column' }),
                  render: (_: any, field: any) => (
                    <div className="price-fields-stack line-info-fields-stack">
                      <div className="price-field-row">
                        <FieldLabel>Đơn vị tính</FieldLabel>
                        <Form.Item name={[field.name, 'donViTinh']} noStyle rules={requiredRulesFor('Đơn vị tính') ?? [{ required: true, message: 'Nhập đơn vị tính' }]}>
                          <HintInput placeholder="cái" tooltip="Đơn vị tính (ví dụ: cái, m², bộ...)" />
                        </Form.Item>
                      </div>
                      <div className="price-field-row">
                        <FieldLabel>Số lượng</FieldLabel>
                        <Form.Item name={[field.name, 'soLuong']} noStyle rules={requiredRulesFor('Số lượng') ?? [{ required: true, message: 'Nhập SL' }]}>
                          <HintInputNumber min={1} controls={false} style={{ width: '100%' }} placeholder="SL" tooltip="Số lượng" />
                        </Form.Item>
                      </div>
                      <div className="price-field-row">
                        <FieldLabel>Thuế</FieldLabel>
                        <Form.Item name={[field.name, 'thueSuat']} noStyle rules={requiredRulesFor('Thuế suất') ?? [{ required: true, message: 'Nhập thuế suất' }]}>
                          <HintInputNumber min={0} max={100} step={1} controls={false} addonAfter="%" style={{ width: '100%' }} placeholder="%" tooltip="Thuế suất (%)" />
                        </Form.Item>
                      </div>
                    </div>
                  ),
                },
                // Cột đơn giá / thành tiền (tính từ preview, có thể điều chỉnh qua giá tôn)
                {
                  title: 'Giá trị (VNĐ)',
                  dataIndex: 'donGiaThanhTien',
                  width: 112,
                  align: 'left' as const,
                  onHeaderCell: () => ({ className: 'order-value-column' }),
                  onCell: () => ({ className: 'order-value-column' }),
                  render: (_: any, field: any) => {
                    const preview = linePreviews[field.name];
                    if (!preview) return '-';
                    const lines = withManualTonFlags(form.getFieldValue('lineInputs') || []);
                    const item = lines[field.name];
                    const ton = loaiTonList.find((t) => t.id === Number(item?.loaiTonId));
                    const { unitPrice, lineTotal } = calcLinePricing(preview, item ?? {}, ton?.donGiaMetToi);
                    const unitPriceText = formatMoney(unitPrice);
                    const lineTotalText = formatMoney(lineTotal);
                    return (
                      <div className="price-fields-stack area-fields-stack value-fields-stack">
                        <div className="price-field-row">
                          <FieldLabel>Đơn giá(VND)</FieldLabel>
                          <span className="display-value value-display-value" title={`Đơn giá: ${unitPriceText} đ`}>
                            {unitPriceText}
                          </span>
                        </div>
                        <div className="price-field-row">
                          <FieldLabel>Thành tiền(VND)</FieldLabel>
                          <span className="display-value value-display-value" title={`Thành tiền: ${lineTotalText} đ`}>
                            {lineTotalText}
                          </span>
                        </div>
                      </div>
                    );
                  },
                },
                // Cột ghi chú + ảnh minh họa master loại SP
                {
                  title: 'Ghi chú & hình ảnh',
                  dataIndex: 'ghiChuHinhAnh',
                  width: 180,
                  render: (_: any, field: any) => {
                    const nhomId = lineInputs?.[field.name]?.nhomSanPhamId
                      ?? form.getFieldValue(['lineInputs', field.name, 'nhomSanPhamId']);
                    const nhom = nhomList.find((n) => n.id === Number(nhomId));
                    const imageUrl = resolveMasterImageUrl(nhom?.hinhAnhMinhHoa);

                    return (
                      <div className="price-fields-stack">
                        <div className="price-field-row">
                          <FieldLabel>Ghi chú</FieldLabel>
                          <Form.Item
                            name={[field.name, 'ghiChu']}
                            noStyle
                            rules={
                              requiredRulesFor('Ghi chú')
                              ?? (requiredRulesFor('Ghi chú/ hình ảnh') ? [{ required: true, message: 'Nhập ghi chú' }] : undefined)
                            }
                          >
                            <HintInput placeholder="Nhập ghi chú" />
                          </Form.Item>
                        </div>
                        <div className="price-field-row">
                          <FieldLabel>Hình ảnh</FieldLabel>
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={nhom?.tenNhom ?? 'Minh họa sản phẩm'}
                              className="product-master-image"
                            />
                          ) : (
                            <span className="display-value">-</span>
                          )}
                        </div>
                      </div>
                    );
                  },
                },
                // Cột di chuyển / xóa dòng
                {
                  title: 'Thao tác',
                  dataIndex: 'action',
                  width: 76,
                  align: 'center' as const,
                  onHeaderCell: () => ({ className: 'order-action-column' }),
                  onCell: () => ({ className: 'order-action-column' }),
                  render: (_: any, field: any, index: number) => {
                    const items: LineFormValues[] = form.getFieldValue('lineInputs') || [];
                    const isBuffer = isSkippedTrailingLine(index, items[index], items.length);
                    const lastIsBuffer = items.length > 0
                      && isSkippedTrailingLine(items.length - 1, items[items.length - 1], items.length);
                    const movableCount = getMovableRowCount(items);
                    const canMoveUp = index > 0 && !isBuffer;
                    const canMoveDown = index < fields.length - 1 && !isBuffer && !(lastIsBuffer && index >= items.length - 2);

                    return (
                      <Space direction="vertical" size={0}>
                        <Button
                          type="text"
                          size="small"
                          icon={<ArrowUpOutlined />}
                          title="Di chuyển lên"
                          disabled={!canMoveUp}
                          onClick={() => void handleMoveLine(index, 'up', move)}
                        />
                        <Button
                          type="text"
                          size="small"
                          icon={<ArrowDownOutlined />}
                          title="Di chuyển xuống"
                          disabled={!canMoveDown}
                          onClick={() => void handleMoveLine(index, 'down', move)}
                        />
                        <Popover
                          title="Di chuyển đến dòng"
                          trigger="click"
                          open={movePopoverIndex === index}
                          onOpenChange={(open) => {
                            if (open) {
                              setMoveTargetStt(index + 1);
                              setMovePopoverIndex(index);
                            } else if (movePopoverIndex === index) {
                              setMovePopoverIndex(null);
                            }
                          }}
                          content={(
                            <Space direction="vertical" size={8} style={{ width: 160 }}>
                              <InputNumber
                                min={1}
                                max={movableCount}
                                precision={0}
                                controls
                                addonBefore="STT"
                                value={moveTargetStt}
                                onChange={(value) => setMoveTargetStt(value ?? index + 1)}
                                onPressEnter={() => void confirmMoveToStt(index, move)}
                                style={{ width: '100%' }}
                              />
                              <Button
                                type="primary"
                                size="small"
                                block
                                onClick={() => void confirmMoveToStt(index, move)}
                              >
                                Di chuyển
                              </Button>
                            </Space>
                          )}
                        >
                          <Button
                            type="text"
                            size="small"
                            icon={<SwapOutlined />}
                            title="Di chuyển đến dòng (nhập STT)"
                            disabled={isBuffer || movableCount <= 1}
                          />
                        </Popover>
                        <Popconfirm
                          title="Xóa dòng sản phẩm?"
                          description={
                            items[index]?.tenSanPham?.trim()
                              ? `Dòng ${index + 1}: ${items[index].tenSanPham}`
                              : `Dòng ${index + 1}`
                          }
                          okText="Xóa"
                          cancelText="Hủy"
                          okButtonProps={{ danger: true }}
                          disabled={fields.length === 1}
                          onConfirm={() => remove(field.name)}
                        >
                          <Button
                            type="text"
                            size="small"
                            danger
                            icon={<MinusCircleOutlined />}
                            title="Xóa dòng"
                            disabled={fields.length === 1}
                          />
                        </Popconfirm>
                      </Space>
                    );
                  },
                },
              ];

              // Tổng tiền footer bảng + highlight dòng lỗi
              const totals = calculateTotals();
              const items = form.getFieldValue('lineInputs') || [];

              return (
                <>
                  <Table
                    className="order-product-table"
                    rowKey="key"
                    dataSource={fields}
                    columns={columns}
                    pagination={false}
                    tableLayout="fixed"
                    sticky={{ offsetHeader: productTableStickyOffset }}
                    scroll={{ x: ORDER_PRODUCT_TABLE_SCROLL_X }}
                    locale={{ emptyText: 'Chưa có dòng sản phẩm' }}
                    rowClassName={(_, __, index) => {
                      const item = items[index];
                      return isRowIncomplete(item, index, items.length) ? 'error-row' : '';
                    }}
                    footer={() => (
                      <div style={{ padding: '12px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', justifyItems: 'end' }}>
                          <div />
                          <div style={{ minWidth: '450px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '200px auto', gap: '16px', alignItems: 'center' }}>
                                <span style={{ fontWeight: 'bold' }}>Tổng trước thuế:</span>
                                <span style={{ fontWeight: 'bold', color: '#1677ff', textAlign: 'right' }}>{formatMoney(totals.tongTien)} đ</span>
                              </div>
                              {totals.thueTheoLoai
                                .filter((group) => group.tienThue > 0)
                                .map((group) => (
                                  <div
                                    key={group.thueSuat}
                                    style={{
                                      display: 'grid',
                                      gridTemplateColumns: '200px auto',
                                      gap: '16px',
                                      alignItems: 'center',
                                      color: '#666',
                                    }}
                                  >
                                    <span>Thuế VAT {group.thueSuat}%:</span>
                                    <span style={{ textAlign: 'right' }}>{formatMoney(Math.round(group.tienThue))} đ</span>
                                  </div>
                                ))}
                              {totals.thueTien > 0 && (
                                <div style={{ display: 'grid', gridTemplateColumns: '200px auto', gap: '16px', alignItems: 'center', paddingTop: '8px', borderTop: '2px solid #ff7a45', fontWeight: 'bold', color: '#ff7a45', fontSize: '16px' }}>
                                  <span>Tổng sau thuế:</span>
                                  <span style={{ textAlign: 'right' }}>{formatMoney(Math.round(totals.tongTienSauThue))} đ</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  />
                  <Button type="dashed" icon={<PlusOutlined />} onClick={() => add(createEmptyLine(orderableNhomList, loaiTonList))} style={{ marginTop: 16, width: '100%' }}>
                    Thêm dòng mới
                  </Button>
                  {/* CSS cục bộ cho bảng cụm sản phẩm (layout cột, ellipsis, sticky) */}
                  <style>{`
                    .order-product-table .price-fields-stack {
                      display: grid;
                      gap: 10px;
                      min-width: 0;
                      max-width: 100%;
                    }
                    .price-field-row {
                      display: grid;
                      gap: 4px;
                      min-width: 0;
                    }
                    .price-field-label {
                      font-size: 12px;
                      font-weight: 600;
                      color: rgba(0, 0, 0, 0.65);
                      line-height: 1.3;
                    }
                    .product-master-image {
                      display: block;
                      width: 100%;
                      max-width: 140px;
                      max-height: 100px;
                      margin-inline: auto;
                      object-fit: contain;
                      border: 1px solid #f0f0f0;
                      border-radius: 4px;
                      background: #fafafa;
                    }
                    .display-value,
                    .display-value-stack {
                      text-align: center;
                    }
                    .area-fields-stack {
                      min-width: 0;
                      gap: 6px;
                    }
                    .area-fields-stack .display-value {
                      text-align: left;
                    }
                    .order-area-column,
                    .order-ton-column,
                    .order-line-info-column,
                    .order-value-column {
                      overflow: hidden;
                    }
                    .ton-fields-stack {
                      min-width: 0;
                      max-width: 100%;
                      gap: 6px;
                    }
                    .order-ton-column .price-field-label {
                      font-size: 11px;
                    }
                    .order-ton-column .ton-display-value {
                      display: block;
                      font-size: 12px;
                      font-variant-numeric: tabular-nums;
                      text-align: left;
                      overflow: hidden;
                      text-overflow: ellipsis;
                      white-space: nowrap;
                    }
                    .order-ton-column .hint-control-wrap,
                    .order-ton-column .ton-field-select {
                      max-width: 100%;
                      min-width: 0;
                    }
                    .order-ton-column .ton-field-select .ant-select-selector {
                      overflow: hidden;
                    }
                    .order-ton-column .ton-field-select .ant-select-selection-item {
                      overflow: hidden;
                      text-overflow: ellipsis;
                      white-space: nowrap;
                    }
                    .order-line-info-column {
                      overflow: hidden;
                    }
                    .line-info-fields-stack {
                      gap: 6px;
                    }
                    .order-line-info-column .price-field-label {
                      font-size: 11px;
                    }
                    .order-line-info-column .ant-input-number-group-addon {
                      padding-inline: 4px;
                    }
                    .order-area-column .price-field-label {
                      font-size: 11px;
                    }
                    .order-area-column .area-display-value {
                      display: block;
                      font-size: 12px;
                      font-variant-numeric: tabular-nums;
                      line-height: 1.25;
                      overflow: hidden;
                      text-overflow: ellipsis;
                      white-space: nowrap;
                    }
                    .order-value-column {
                      overflow: hidden;
                    }
                    .value-fields-stack {
                      gap: 6px;
                    }
                    .order-value-column .price-field-label {
                      font-size: 11px;
                    }
                    .order-value-column .value-display-value {
                      display: block;
                      font-size: 12px;
                      font-variant-numeric: tabular-nums;
                      line-height: 1.25;
                      text-align: left;
                      overflow: hidden;
                      text-overflow: ellipsis;
                      white-space: nowrap;
                    }
                    .display-value {
                      display: block;
                      line-height: 1.3;
                    }
                    .display-value-stack {
                      display: grid;
                      gap: 4px;
                      line-height: 1.3;
                    }
                    .dimension-column-cell {
                      padding: 0 !important;
                      text-align: center;
                    }
                    .dimension-fields-grid {
                      display: inline-grid;
                      grid-template-columns: repeat(2, minmax(103px, 1fr));
                      gap: 8px;
                      margin-inline: auto;
                      max-width: 100%;
                      text-align: left;
                    }
                    .dimension-field-input.ant-input-number-group,
                    .dimension-field-input.ant-input-number-group-wrapper {
                      width: 100%;
                    }
                    .dimension-field-input .ant-input-number-group-addon {
                      padding-inline: 6px;
                      flex-shrink: 0;
                    }
                    .dimension-field-input .ant-input-number {
                      flex: 1 1 auto;
                      min-width: 0;
                    }
                    .dimension-field-input .ant-input-number-input {
                      min-width: 3.5ch;
                      padding-inline: 0;
                    }
                    .error-row {
                      background-color: #fff2f0 !important;
                    }
                    .error-row:hover {
                      background-color: #ffe7e0 !important;
                    }
                    .error-row td {
                      padding-inline: 1px !important;
                    }
                    .order-product-table td:not(.order-stt-column):not(.order-action-column) {
                      padding-inline: 1px !important;
                    }
                    .order-product-table .order-stt-column,
                    .order-product-table .order-action-column {
                      white-space: nowrap;
                    }
                    .order-product-table .order-stt-column {
                      padding-inline: 4px !important;
                    }
                    .order-product-table .order-action-column {
                      padding-inline: 8px !important;
                    }
                    .order-product-table .order-action-column .ant-space {
                      width: 100%;
                      justify-content: center;
                    }
                  `}</style>
                </>
              );
            }}
          </Form.List>
          {/* Công thức ∑Ssx của loại SP đang chọn (collapse) */}
          {selectedNhomRow && (() => {
            const thamSoItems =
              selectedNhomRow.thamSoCoDinhs?.map((t) => ({ tenThamSo: t.tenThamSo })) ?? [];
            const duplicateThamSoMsg = findDuplicateThamSo(thamSoItems);

            return (
            <Collapse
              size="small"
              style={{ marginTop: 12 }}
              items={[
                {
                  key: 'cong-thuc',
                  label: `Công thức ∑Ssx (m²) — ${selectedNhomRow.tenNhom}`,
                  children: (
                    <div>
                      <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                        Tham số form: {sortOrderedThamSoCoDinhs(selectedNhomRow.thamSoCoDinhs ?? []).map((t) => t.tenThamSo).join(', ') || '—'}
                      </Text>
                      {duplicateThamSoMsg && (
                        <Text type="danger" style={{ display: 'block', marginBottom: 8 }}>
                          {duplicateThamSoMsg}
                        </Text>
                      )}
                      <FormulaDisplay value={selectedNhomRow.congThucDienTich} variant="block" />
                    </div>
                  ),
                },
              ]}
            />
            );
          })()}
          {/* Preview tổng hợp một dòng (legacy block — hiếm khi hiển thị) */}
          {preview && (
            <Card size="small" style={{ marginTop: 16, background: '#fafafa' }}>
              <Space wrap>
                <Statistic title="S_sx/cái (m²)" value={formatArea(preview.dienTichSx1Cai)} />
                <Statistic title="S_sx mét tới" value={formatArea(preview.dienTichSanXuatMetToi)} />
                <Statistic title="ΣS_sx (m²)" value={formatArea(preview.tongDienTichLo)} />
                <Statistic title="Kg" value={preview.trongLuongKg.toFixed(2)} />
                <Statistic title="Tiền tôn" value={formatMoney(preview.thanhTienTon)} suffix="đ" />
                <Statistic title="Đơn giá" value={formatMoney(preview.donGiaCuoi)} suffix="đ" />
                <Statistic title="Thành tiền" value={formatMoney(preview.thanhTien)} suffix="đ" />
              </Space>
            </Card>
          )}
        </Card>

        {/* Nút lưu / hủy */}
        <Space style={{ marginTop: 16 }}>
          <Button type="primary" size="large" loading={loading} onClick={save}>Lưu đơn hàng</Button>
          <Button onClick={() => navigate('/don-hang')}>Hủy</Button>
        </Space>
      </Form>

      {/* Modal F4: chọn sản phẩm từ đơn hàng cũ */}
      <LineHistoryPickerModal
        open={historyOpen}
        initialSearch={
          historyLineIndex !== null
            ? form.getFieldValue(['lineInputs', historyLineIndex, 'tenSanPham']) ?? ''
            : ''
        }
        onClose={() => setHistoryOpen(false)}
        onSelect={(item) => {
          if (historyLineIndex !== null) {
            void applyHistoryLine(historyLineIndex, item);
          }
        }}
      />
    </div>
  );
}   
