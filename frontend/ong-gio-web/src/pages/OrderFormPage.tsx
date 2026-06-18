/**
 * Trang tạo/sửa báo giá với preview tính toán theo từng dòng.
 */

import { Button, Card, Col, Form, Input, InputNumber, Row, Select, Space, Statistic, Table, Tag, Typography, message } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createBaoGia,
  formatMoney,
  getBaoGia,
  getLoaiTons,
  getNhomSanPhams,
  previewCalculation,
  updateBaoGia,
} from '../api';
import type { CalculationResult, LineFormValues, LoaiTon, NhomSanPham } from '../types';
import { API_BASE } from '../types';

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

/**
 * Chuẩn hóa chuỗi để so khớp tên nhóm sản phẩm.
 * @param value Chuỗi gốc.
 * @returns Chuỗi đã chuẩn hóa.
 */
function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toUpperCase();
}

/**
 * Xác định các ô kích thước cần nhập theo từng nhóm sản phẩm.
 * @param nhom Nhóm sản phẩm đang chọn.
 * @returns Danh sách field kích thước cần render.
 */
function getDimensionFields(nhom?: NhomSanPham): DimensionField[] {
  const name = normalizeText(nhom?.tenNhom ?? '');

  if (name.includes('CO 90') || name.includes('CO90') || name.includes('CO 45') || name.includes('CO45')) {
    return [
      { key: 'w', label: 'W', target: 'w' },
      { key: 'h', label: 'H', target: 'h' },
      { key: 'r', label: 'r', target: 'thamSoNhap', paramKey: 'r' },
      { key: 'R', label: 'R', target: 'thamSoNhap', paramKey: 'R' },
    ];
  }

  if (name.includes('GIAM') || name.includes('CON THU')) {
    return [
      { key: 'w', label: 'Wmax', target: 'w' },
      { key: 'h', label: 'Hmax', target: 'h' },
      { key: 'L', label: 'L', target: 'thamSoNhap', paramKey: 'L' },
    ];
  }

  if (name.includes('BIT 01') || name.includes('BIT 1') || name.includes('BIT 02') || name.includes('BIT 2') || name.includes('ONG THANG') || name.includes('ONG GIO THANG')) {
    return [
      { key: 'w', label: 'W', target: 'w' },
      { key: 'h', label: 'H', target: 'h' },
      { key: 'L', label: 'L', target: 'thamSoNhap', paramKey: 'L' },
      { key: 'phan_manh', label: 'Mảnh', target: 'thamSoNhap', paramKey: 'phan_manh' },
    ];
  }

  if (name.includes('BZ') || name.includes('LECH TAM') || name.includes('CO NGONG')) {
    return [
      { key: 'w', label: 'W', target: 'w' },
      { key: 'h', label: 'H', target: 'h' },
      { key: 'L', label: 'L', target: 'thamSoNhap', paramKey: 'L' },
      { key: 'DO_LECH', label: 'Độ lệch', target: 'thamSoNhap', paramKey: 'DO_LECH' },
    ];
  }

  if (name.includes('TE CUT')) {
    return [
      { key: 'Wmax', label: 'Wmax', target: 'thamSoNhap', paramKey: 'Wmax' },
      { key: 'w', label: 'W', target: 'w' },
      { key: 'h', label: 'H', target: 'h' },
      { key: 'r', label: 'r', target: 'thamSoNhap', paramKey: 'r' },
    ];
  }

  if (name.includes('TE RE')) {
    return [
      { key: 'Wp', label: "W'", target: 'thamSoNhap', paramKey: 'Wp' },
      { key: 'w', label: 'W', target: 'w' },
      { key: 'h', label: 'H', target: 'h' },
      { key: 'r', label: 'r', target: 'thamSoNhap', paramKey: 'r' },
    ];
  }

  if (name.includes('HOP') || name.includes('PLENUM') || name.includes('ZIGZAC')) {
    return [
      { key: 'SO_LO', label: 'Số lỗ', target: 'thamSoNhap', paramKey: 'SO_LO' },
      { key: 'w', label: 'W', target: 'w' },
      { key: 'h', label: 'H', target: 'h' },
      { key: 'L', label: 'L', target: 'thamSoNhap', paramKey: 'L' },
      { key: 'D', label: 'Ø', target: 'thamSoNhap', paramKey: 'D' },
    ];
  }

  if (name.includes('CHAN RE') || name.includes('GIAY KHOI HANH') || name.includes('COLLAR')) {
    return [
      { key: 'w', label: 'W', target: 'w' },
      { key: 'h', label: 'H', target: 'h' },
      { key: 'L', label: 'L', target: 'thamSoNhap', paramKey: 'L' },
    ];
  }

  if (name.includes('CHAC')) {
    return [
      { key: 'Wmax', label: 'Wmax', target: 'thamSoNhap', paramKey: 'Wmax' },
      { key: 'R', label: 'R', target: 'thamSoNhap', paramKey: 'R' },
      { key: 'w1', label: 'w1', target: 'thamSoNhap', paramKey: 'w1' },
      { key: 'W3', label: 'W3', target: 'thamSoNhap', paramKey: 'W3' },
      { key: 'L', label: 'L', target: 'thamSoNhap', paramKey: 'L' },
      { key: 'h', label: 'H', target: 'h' },
    ];
  }

  return [
    { key: 'w', label: 'W', target: 'w' },
    { key: 'h', label: 'H', target: 'h' },
    { key: 'L', label: 'L', target: 'thamSoNhap', paramKey: 'L' },
  ];
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

function hasAnyLineInput(item: Partial<LineFormValues> | undefined) {
  if (!item) return false;
  return Boolean(
    item.nhomSanPhamId ||
      item.loaiTonId ||
      item.tenSanPham?.trim() || // This line is not needed for the fix, but it's part of the original code.
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
        form.setFieldsValue({ tenKhachHang: bg.tenKhachHang });
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
        form.setFieldsValue({ lineInputs });
        if (initialLines.length > 0) {
          await refreshPreviews({ lineInputs }, nhoms);
        }
      } else if (nhoms[0] && tons[0]) {
        form.setFieldsValue({
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
      last.w > 0 &&
      last.h > 0 &&
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
            form.setFieldValue(['lineInputs', index, 'thanhTienTon'], res.thanhTienTon);
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
        const lineThanhTien = preview.thanhTien + (currentThanhTienTon - preview.thanhTienTon);
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

  const isRowIncomplete = (item: any) => {
    const nhom = nhomList.find((n) => n.id === Number(item?.nhomSanPhamId));
    if (!hasAnyLineInput(item)) return false;
    
    return (
      !item?.tenSanPham || 
      !item?.nhomSanPhamId || 
      !item?.loaiTonId || 
      !item?.soLuong || item.soLuong <= 0 || 
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
      const last = items[items.length - 1];
      if (last && last.nhomSanPhamId) {
        const found = nhomList.find((n) => n.id === Number(last.nhomSanPhamId));
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
    const header = await form.validateFields(['tenKhachHang']);
    const allLineInputs: LineFormValues[] = form.getFieldValue('lineInputs') || [];
    const partialLines = allLineInputs.filter((l) => {
      if (!hasAnyLineInput(l)) return false;
      const nhom = nhomList.find((n) => n.id === l?.nhomSanPhamId);
      return isRowIncomplete(l);
    });
    if (partialLines.length > 0) {
      message.warning('Nhập đủ kích thước (mm) cho từng dòng trước khi tính công thức');
      return;
    }
    const filtered = allLineInputs.filter((l) => {
      const nhom = nhomList.find((n) => n.id === l?.nhomSanPhamId);
      return l && l.nhomSanPhamId && l.loaiTonId && l.soLuong > 0 && hasAllDimensions(l, nhom);
    });

    if (filtered.length === 0) {
      message.warning('Thêm ít nhất một cụm sản phẩm');
      return;
    }
    if (filtered.some((l) => !l.tenSanPham?.trim())) {
      message.warning('Nhập tên sản phẩm cho từng dòng');
      return;
    }
    if (filtered.some((l) => !l.donViTinh?.trim() || l.thueSuat === undefined || l.thueSuat === null)) {
      message.warning('Nhập đơn vị tính và thuế suất cho từng dòng');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        tenKhachHang: header.tenKhachHang,
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
      <Form form={form} layout="vertical" onValuesChange={onValuesChange}>
        <Card title="Thông tin đơn hàng" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="tenKhachHang" label="Tên khách hàng" rules={[{ required: true }]}>
                <Input />
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
                        <Form.Item name={[field.name, 'tenSanPham']} noStyle rules={[{ required: true, message: 'Nhập tên sản phẩm' }]}>
                          <Input placeholder="Nhập tên" />
                        </Form.Item>
                      </div>
                    </div>
                  ),
                },
                {
                  title: 'Kích thước (mm)',
                  dataIndex: 'kichThuoc',
                  width: 293,
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
                  align: 'center' as const,
                  render: (_: any, field: any) => {
                    const preview = linePreviews[field.name];
                    if (!preview) return '-';
                    return (
                      <div className="price-fields-stack">
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
                          <InputNumber min={0} step={1000} controls={false} style={{ width: '100%' }} />
                        </Form.Item>
                      </div>
                      <div className="price-field-row">
                        <span className="price-field-label">Giá nhân công (VNĐ)</span>
                        <Form.Item
                          name={[field.name, 'giaNhanCong']}
                          noStyle
                          rules={requiredRulesFor('Giá nhân công (VNĐ)') ? [{ required: true, message: 'Nhập giá nhân công' }] : undefined}
                        >
                          <InputNumber min={0} controls={false} style={{ width: '100%' }} />
                        </Form.Item>
                      </div>
                      <div className="price-field-row">
                        <span className="price-field-label">Phụ kiện đi kèm (VNĐ)</span>
                        <Form.Item
                          name={[field.name, 'phuKien']}
                          noStyle
                          rules={requiredRulesFor('Phụ kiện đi kèm (VNĐ)') ? [{ required: true, message: 'Nhập phụ kiện' }] : undefined}
                        >
                          <InputNumber min={0} controls={false} style={{ width: '100%' }} />
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
                  align: 'center' as const,
                  render: (_: any, field: any) => {
                    const preview = linePreviews[field.name];
                    if (!preview) return '-';
                    const item = form.getFieldValue(['lineInputs', field.name]);
                    const currentThanhTienTon = item?.thanhTienTon ?? preview.thanhTienTon;
                    const adjustedTotal = preview.thanhTien + (currentThanhTienTon - preview.thanhTienTon);
                    const soLuong = item?.soLuong || 1;
                    return (
                      <div className="price-fields-stack">
                        <div className="price-field-row">
                          <span className="price-field-label">Đơn giá (VND)</span>
                          <span className="display-value">{formatMoney(adjustedTotal / soLuong)}</span>
                        </div>
                        <div className="price-field-row">
                          <span className="price-field-label">Thành tiền (VND)</span>
                          <span className="display-value">{formatMoney(adjustedTotal)}</span>
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
                      return isRowIncomplete(item) ? 'error-row' : '';
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
                    .display-value {
                      display: block;
                      line-height: 1.3;
                    }
                    .display-value-stack {
                      display: grid;
                      gap: 4px;
                      line-height: 1.3;
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
                      padding-inline: 8px;
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
          {selectedNhomRow && (
            <Text type="secondary">
              Kích thước tiêu chuẩn: {selectedNhomRow.thamSoCoDinhs.map((t) => `${t.tenThamSo}=${t.giaTriSo}`).join(' | ')}
            </Text>
          )}
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
