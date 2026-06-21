/**
 * Trang tạo/sửa báo giá với preview tính toán theo từng dòng.
 */

import { Button, Card, Col, Collapse, Form, Input, InputNumber, Row, Select, Space, Statistic, Table, Typography, message } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import type { CalculationResult, LineFormValues, LoaiTon, NhomSanPham } from '../types';
import { API_BASE } from '../types';
import FormulaDisplay from '../components/FormulaDisplay';
import { findDuplicateThamSo, getParamBindingKey, sortOrderedThamSoCoDinhs } from '../utils/productFormParams';

const { Title, Text } = Typography;

/**
 * Định dạng diện tích hiển thị với 6 chữ số thập phân.
 */
function formatArea(value: number) {
  return value.toFixed(6);
}

function resolveMasterImageUrl(path?: string) {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('/')) return `${API_BASE}${path}`;
  return path;
}

type DimensionField = {
  key: string;
  label: string;
  target: 'w' | 'h' | 'thamSoNhap';
  paramKey?: string;
};

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

function getDimensionValue(item: Partial<LineFormValues>, field: DimensionField) {
  if (field.target === 'thamSoNhap') {
    return item.thamSoNhap?.[field.paramKey ?? field.key];
  }

  return field.target === 'w' ? item.w : item.h;
}

function isFilledNumber(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0;
}

function hasAllDimensions(item: Partial<LineFormValues> | undefined, nhom?: NhomSanPham) {
  if (!item || !nhom) return false;
  const dimensionFields = getDimensionFields(nhom);
  return dimensionFields.every((field) => isFilledNumber(getDimensionValue(item, field)));
}

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

function describeIncompleteLine(
  lineIndex: number,
  item: Partial<LineFormValues>,
  nhom?: NhomSanPham,
): string {
  const missingMessages = getMissingLineMessages(item, nhom);
  const displayName = item.tenSanPham?.trim() || nhom?.tenNhom || 'chưa đặt tên';
  return `Dòng ${lineIndex + 1} (${displayName}): ${missingMessages.join('; ')}`;
}

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

function showLargeWarning(text: string) {
  message.warning({
    className: 'order-form-validation-message',
    content: <div style={{ fontSize: 28, lineHeight: 1.4 }}>{text}</div>,
    duration: 6,
  });
}

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

const defaultLineValues = { donViTinh: 'cái', thueSuat: 8, thamSoNhap: {} };

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
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const lineInputs = Form.useWatch('lineInputs', form);
  const [nhomList, setNhomList] = useState<NhomSanPham[]>([]);
  const [loaiTonList, setLoaiTonList] = useState<LoaiTon[]>([]);
  const [preview, setPreview] = useState<CalculationResult | null>(null);
  const [linePreviews, setLinePreviews] = useState<Record<number, CalculationResult>>({});
  const [loading, setLoading] = useState(false);
  const [selectedNhomRow, setSelectedNhomRow] = useState<NhomSanPham | undefined>(undefined);
  const [requiredHeaders, setRequiredHeaders] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const [nhoms, tons] = await Promise.all([getNhomSanPhams(), getLoaiTons()]);
      setNhomList(nhoms);
      setLoaiTonList(tons);

      if (isEdit && id) {
        const bg = await getBaoGia(Number(id));
        const initialLines = (bg.chiTietBaoGias ?? []).map((c) => ({
          tenSanPham: c.tenSanPham,
          donViTinh: c.donViTinh ?? 'cái',
          thueSuat: (c.thueSuat ?? bg.thueSuat ?? 0.08) * 100,
          nhomSanPhamId: c.nhomSanPham?.id ?? 0,
          loaiTonId: c.loaiTon?.id ?? 0,
          w: c.wInput,
          h: c.hInput,
          thanhTienTon: c.thanhTienTon,
          thamSoNhap: c.thamSoNhapJson ? JSON.parse(c.thamSoNhapJson) : {},
          soLuong: c.soLuong,
          giaNhanCong: c.giaNhanCong ?? 0,
          phuKien: c.phuKien ?? 0,
          ghiChu: c.ghiChu,
        }));
        const lineInputs = initialLines.length > 0
          ? [...initialLines, createEmptyLine(nhoms, tons)]
          : [createEmptyLine(nhoms, tons)];
        form.setFieldsValue({
          tenKhachHang: bg.tenKhachHang,
          trangThai: bg.trangThai || 'CHUA_XU_LY',
          lineInputs,
        });
        if (initialLines.length > 0) {
          await refreshPreviews({ lineInputs }, nhoms);
        }
      } else if (nhoms[0] && tons[0]) {
        form.setFieldsValue({
          trangThai: 'CHUA_XU_LY',
          lineInputs: [createEmptyLine(nhoms, tons)],
        });
      }
    })();
  }, [form, id, isEdit]);

  /**
   * Nếu dòng cuối đã được điền, tự động thêm một dòng rỗng mới.
   * @param allValues Toàn bộ giá trị hiện tại của form.
   */
  const ensureNewRowIfNeeded = (allValues: any) => {
    const items = allValues.lineInputs || [];
    if (items.length === 0) {
      form.setFieldsValue({ lineInputs: [createEmptyLine(nhomList, loaiTonList)] });
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
      form.setFieldsValue({ lineInputs: [...items, createEmptyLine(nhomList, loaiTonList)] });
    }
  };

  /**
   * Gọi API preview cho từng dòng hợp lệ và lưu kết quả vào state.
   * @param allValues Toàn bộ giá trị form hiện tại.
   * @param customNhomList Danh sách nhóm sản phẩm (dùng khi state chưa cập nhật kịp).
   */
  const refreshPreviews = async (allValues: any, customNhomList?: NhomSanPham[]) => {
    const items: LineFormValues[] = allValues.lineInputs || [];
    const previews: Record<number, CalculationResult> = {};
    const currentNhomList = customNhomList || nhomList;
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      const nhom = currentNhomList.find((n) => n.id === Number(item?.nhomSanPhamId));
      const canPreview = item && item.nhomSanPhamId && item.loaiTonId && Number(item.soLuong) > 0 && hasAllDimensions(item, nhom);
      if (canPreview) {
        try {
          // Chuẩn hóa payload tương đương logic khi lưu
          const res = await previewCalculation({
            ...item,
            thueSuat: (item.thueSuat ?? 0) / 100,
          } as any);
          previews[index] = res;

          // Tự động điền Giá tôn từ kết quả tính toán nếu người dùng chưa nhập thủ công
          if (item.thanhTienTon === undefined || item.thanhTienTon === null) {
            form.setFieldValue(['lineInputs', index, 'thanhTienTon'], Math.round(res.thanhTienTon));
          }
        } catch {
          // Bỏ qua lỗi preview của dòng này để không làm hỏng toàn bộ form.
        }
      }
    }
    setLinePreviews(previews);
  };

  /**
   * Tính tổng theo các preview đã có và thuế suất hiện tại.
   * @returns Tổng tiền trước thuế, tiền thuế và tổng sau thuế.
   */
  const calculateTotals = () => {
    let totalThanhTien = 0;
    const items = form.getFieldValue('lineInputs') || [];
    let totalThue = 0;

    items.forEach((item: LineFormValues, index: number) => {
      const preview = linePreviews[index];
      if (preview) {
        // Tính lại tổng dòng dựa trên giá trị Giá tôn thực tế trong form (có thể đã bị ghi đè)
        const currentThanhTienTon = item.thanhTienTon ?? preview.thanhTienTon;
        const adjustedTotal = preview.thanhTien + (currentThanhTienTon - preview.thanhTienTon);
        const soLuong = item.soLuong || 1;
        const unitPrice = soLuong > 0 ? Math.round(adjustedTotal / soLuong) : 0;
        const lineThanhTien = unitPrice * soLuong;
        totalThanhTien += lineThanhTien;
        totalThue += lineThanhTien * ((item?.thueSuat ?? 0) / 100);
      }
    });

    return {
      tongTien: totalThanhTien,
      thueTien: totalThue,
      tongTienSauThue: totalThanhTien + totalThue,
    };
  };

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
  const onValuesChange = async (_: any, allValues: any) => {
    try {
      await refreshPreviews(allValues);
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
      <Title level={3}>{isEdit ? 'Sửa đơn hàng' : 'Tạo đơn hàng mới'}</Title>
      <Form
        form={form}
        layout="vertical"
        onValuesChange={onValuesChange}
        validateMessages={{
          required: 'Vui lòng nhập ${label}',
        }}
      >
        <Card title="Thông tin đơn hàng" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="tenKhachHang"
                label="Tên khách hàng"
                rules={[{ required: true, message: 'Vui lòng nhập tên khách hàng' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="trangThai"
                label="Trạng thái đơn hàng"
                rules={[{ required: true, message: 'Vui lòng chọn trạng thái đơn hàng' }]}
              >
                <Select
                  options={Object.entries(TRANG_THAI_DON).map(([value, opt]) => ({
                    value,
                    label: opt.label,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card title="Cụm sản phẩm">
          <Form.List name="lineInputs">
            {(fields, { add, remove }) => {
              const columns: any[] = [
                {
                  title: 'STT',
                  dataIndex: 'stt',
                  width: 40,
                  align: 'center' as const,
                  render: (_: any, __: any, idx: number) => idx + 1,
                },
                {
                  title: 'Sản phẩm',
                  dataIndex: 'sanPham',
                  width: 260,
                  render: (_: any, field: any) => (
                    <div className="price-fields-stack">
                      <div className="price-field-row">
                        <span className="price-field-label">Loại sản phẩm</span>
                        <Form.Item name={[field.name, 'nhomSanPhamId']} noStyle rules={requiredRulesFor('Loại sản phẩm') ?? [{ required: true, message: 'Chọn loại SP' }]}>
                          <Select placeholder="Chọn loại" options={nhomList.map((n) => ({ value: n.id, label: n.tenNhom }))} />
                        </Form.Item>
                      </div>
                      <div className="price-field-row">
                        <span className="price-field-label">Tên sản phẩm</span>
                        <Form.Item
                          name={[field.name, 'tenSanPham']}
                          noStyle
                          rules={
                            field.name === fields.length - 1
                              ? undefined
                              : [{ required: true, message: 'Nhập tên sản phẩm' }]
                          }
                        >
                          <Input placeholder="Nhập tên sản phẩm" />
                        </Form.Item>
                      </div>
                    </div>
                  ),
                },
                {
                  title: 'Kích thước (mm)',
                  dataIndex: 'kichThuoc',
                  width: 293,
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
                              <InputNumber
                                className="dimension-field-input"
                                min={dimension.key === 'phan_manh' ? 1 : 0}
                                step={dimension.key === 'phan_manh' ? 1 : 10}
                                placeholder={dimension.label}
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
                {
                  title: 'Thông tin tôn',
                  dataIndex: 'loaiTonTrongLuong',
                  width: 150,
                  render: (_: any, field: any) => {
                    const preview = linePreviews[field.name];
                    return (
                      <div className="price-fields-stack">
                        <div className="price-field-row">
                          <span className="price-field-label">Loại tôn</span>
                          <Form.Item
                            name={[field.name, 'loaiTonId']}
                            noStyle
                            rules={requiredRulesFor('Loại tôn') ?? requiredRulesFor('Xuất xứ/Độ dày tôn') ?? [{ required: true, message: 'Chọn loại tôn' }]}
                          >
                            <Select placeholder="Chọn tôn" options={loaiTonList.map((t) => ({ value: t.id, label: `${t.thuongHieu} ${t.doDay}mm` }))} />
                          </Form.Item>
                        </div>
                        <div className="price-field-row">
                          <span className="price-field-label">Trọng lượng (Kg)</span>
                          <span className="display-value">{preview ? preview.trongLuongKg.toFixed(2) : '-'}</span>
                        </div>
                      </div>
                    );
                  },
                },
                {
                  title: 'Diện tích Sx',
                  dataIndex: 'dienTichSx',
                  width: 150,
                  align: 'left' as const,
                  render: (_: any, field: any) => {
                    const preview = linePreviews[field.name];
                    if (!preview) return '-';
                    return (
                      <div className="price-fields-stack area-fields-stack">
                        <div className="price-field-row">
                          <span className="price-field-label">∑Ssx (m²)</span>
                          <span className="display-value">{formatArea(preview.dienTichSx1Cai)}</span>
                        </div>
                        <div className="price-field-row">
                          <span className="price-field-label">∑Ssx (mét tới)</span>
                          <span className="display-value">{formatArea(preview.dienTichSanXuatMetToi)}</span>
                        </div>
                      </div>
                    );
                  },
                },
                {
                  title: 'Chi phí (VNĐ)',
                  dataIndex: 'giaTri',
                  width: 150,
                  render: (_: any, field: any) => (
                    <div className="price-fields-stack">
                      <div className="price-field-row">
                        <span className="price-field-label">Giá tôn (VNĐ)</span>
                        <Form.Item name={[field.name, 'thanhTienTon']} noStyle>
                          <InputNumber min={0} step={1000} precision={0} controls={false} style={{ width: '100%' }} {...moneyInputNumberProps} />
                        </Form.Item>
                      </div>
                      <div className="price-field-row">
                        <span className="price-field-label">Giá nhân công (VNĐ)</span>
                        <Form.Item
                          name={[field.name, 'giaNhanCong']}
                          noStyle
                          rules={requiredRulesFor('Giá nhân công (VNĐ)') ? [{ required: true, message: 'Nhập giá nhân công' }] : undefined}
                        >
                          <InputNumber min={0} precision={0} controls={false} style={{ width: '100%' }} {...moneyInputNumberProps} />
                          </Form.Item>
                      </div>
                      <div className="price-field-row">
                        <span className="price-field-label">Phụ kiện đi kèm (VNĐ)</span>
                        <Form.Item
                          name={[field.name, 'phuKien']}
                          noStyle
                          rules={requiredRulesFor('Phụ kiện đi kèm (VNĐ)') ? [{ required: true, message: 'Nhập phụ kiện' }] : undefined}
                        >
                          <InputNumber min={0} precision={0} controls={false} style={{ width: '100%' }} {...moneyInputNumberProps} />
                        </Form.Item>
                      </div>
                    </div>
                  ),
                },
                {
                  title: 'Thông tin dòng',
                  dataIndex: 'donViSoLuongThue',
                  width: 150,
                  render: (_: any, field: any) => (
                    <div className="price-fields-stack">
                      <div className="price-field-row">
                        <span className="price-field-label">Đơn vị tính</span>
                        <Form.Item name={[field.name, 'donViTinh']} noStyle rules={requiredRulesFor('Đơn vị tính') ?? [{ required: true, message: 'Nhập đơn vị tính' }]}>
                          <Input placeholder="cái" />
                        </Form.Item>
                      </div>
                      <div className="price-field-row">
                        <span className="price-field-label">Số lượng</span>
                        <Form.Item name={[field.name, 'soLuong']} noStyle rules={requiredRulesFor('Số lượng') ?? [{ required: true, message: 'Nhập SL' }]}>
                          <InputNumber min={1} controls={false} style={{ width: '100%' }} />
                        </Form.Item>
                      </div>
                      <div className="price-field-row">
                        <span className="price-field-label">Thuế suất</span>
                        <Form.Item name={[field.name, 'thueSuat']} noStyle rules={requiredRulesFor('Thuế suất') ?? [{ required: true, message: 'Nhập thuế suất' }]}>
                          <InputNumber min={0} max={100} step={1} controls={false} addonAfter="%" style={{ width: '100%' }} />
                        </Form.Item>
                      </div>
                    </div>
                  ),
                },
                {
                  title: 'Giá trị (VNĐ)',
                  dataIndex: 'donGiaThanhTien',
                  width: 130,
                  align: 'left' as const,
                  render: (_: any, field: any) => {
                    const preview = linePreviews[field.name];
                    if (!preview) return '-';
                    const item = form.getFieldValue(['lineInputs', field.name]);
                    const currentThanhTienTon = item?.thanhTienTon ?? preview.thanhTienTon;
                    const adjustedTotal = preview.thanhTien + (currentThanhTienTon - preview.thanhTienTon);
                    const soLuong = item?.soLuong || 1;
                    const unitPrice = soLuong > 0 ? Math.round(adjustedTotal / soLuong) : 0;
                    const lineTotal = unitPrice * soLuong;
                    return (
                      <div className="price-fields-stack area-fields-stack">
                        <div className="price-field-row">
                          <span className="price-field-label">Đơn giá (VND)</span>
                          <span className="display-value">{formatMoney(unitPrice)}</span>
                        </div>
                        <div className="price-field-row">
                          <span className="price-field-label">Thành tiền (VND)</span>
                          <span className="display-value">{formatMoney(lineTotal)}</span>
                        </div>
                      </div>
                    );
                  },
                },
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
                          <span className="price-field-label">Ghi chú</span>
                          <Form.Item
                            name={[field.name, 'ghiChu']}
                            noStyle
                            rules={
                              requiredRulesFor('Ghi chú')
                              ?? (requiredRulesFor('Ghi chú/ hình ảnh') ? [{ required: true, message: 'Nhập ghi chú' }] : undefined)
                            }
                          >
                            <Input placeholder="Nhập ghi chú" />
                          </Form.Item>
                        </div>
                        <div className="price-field-row">
                          <span className="price-field-label">Hình ảnh</span>
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
                {
                  title: 'Xóa',
                  dataIndex: 'action',
                  width: 80,
                  align: 'center' as const,
                  render: (_: any, field: any) => (
                    <Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => remove(field.name)} disabled={fields.length === 1} />
                  ),
                },
              ];

              const totals = calculateTotals();
              const items = form.getFieldValue('lineInputs') || [];

              return (
                <>
                  <Table
                    rowKey="key"
                    dataSource={fields}
                    columns={columns}
                    pagination={false}
                    scroll={{ x: 873 }}
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
                              {totals.thueTien > 0 && (
                                <>
                                  <div style={{ display: 'grid', gridTemplateColumns: '200px auto', gap: '16px', alignItems: 'center', color: '#666' }}>
                                    <span>Thuế VAT:</span>
                                    <span style={{ textAlign: 'right' }}>{formatMoney(totals.thueTien)} đ</span>
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: '200px auto', gap: '16px', alignItems: 'center', paddingTop: '8px', borderTop: '2px solid #ff7a45', fontWeight: 'bold', color: '#ff7a45', fontSize: '16px' }}>
                                    <span>Tổng sau thuế:</span>
                                    <span style={{ textAlign: 'right' }}>{formatMoney(totals.tongTienSauThue)} đ</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  />
                  <Button type="dashed" icon={<PlusOutlined />} onClick={() => add(createEmptyLine(nhomList, loaiTonList))} style={{ marginTop: 16, width: '100%' }}>
                    Thêm dòng mới
                  </Button>
                  <style>{`
                    .price-fields-stack {
                      display: grid;
                      gap: 10px;
                      min-width: 140px;
                    }
                    .price-field-row {
                      display: grid;
                      gap: 4px;
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
                    .area-fields-stack .display-value {
                      text-align: left;
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
                    }
                    .dimension-fields-grid {
                      display: grid;
                      grid-template-columns: repeat(2, minmax(103px, 1fr));
                      gap: 8px;
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
                    td {
                      padding-inline: 1px !important;
                    }
                  `}</style>
                </>
              );
            }}
          </Form.List>
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


        <Space style={{ marginTop: 16 }}>
          <Button type="primary" size="large" loading={loading} onClick={save}>Lưu đơn hàng</Button>
          <Button onClick={() => navigate('/don-hang')}>Hủy</Button>
        </Space>
      </Form>
    </div>
  );
}   
