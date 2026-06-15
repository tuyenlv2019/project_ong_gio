// // ĐÃ BÌNH LUẬN (vi) - frontend/ong-gio-web/src/pages/OrderFormPage.tsx - Bình luận tự động tiếng Việt
// Đây là file frontend/ong-gio-web/src/pages/OrderFormPage.tsx
// Trang tạo/sửa đơn hàng: hiển thị form, quản lý dòng sản phẩm, gọi preview tính toán và lưu
import { Button, Card, Col, Form, Input, InputNumber, Row, Select, Space, Statistic, Table, Tag, Typography, message } from 'antd';
// Import thư viện hoặc module cần thiết
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
// Import thư viện hoặc module cần thiết
import { useEffect, useState } from 'react';
// Import thư viện hoặc module cần thiết
import { useNavigate, useParams } from 'react-router-dom';
// Import thư viện hoặc module cần thiết
import {
  createBaoGia,
  formatMoney,
  getBaoGia,
  getLoaiTons,
  getNhomSanPhams,
  previewCalculation,
  updateBaoGia,
} from '../api';
// Import thư viện hoặc module cần thiết
import type { CalculationResult, LineFormValues, LoaiTon, NhomSanPham } from '../types';

const { Title, Text } = Typography;

// Định dạng diện tích hiển thị với 4 chữ số thập phân
function formatArea(value: number) {
  return value.toFixed(4);
}

// Component chính của trang form đơn hàng
export default function OrderFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form] = Form.useForm();
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
        form.setFieldsValue({ tenKhachHang: bg.tenKhachHang, thueSuat: bg.thueSuat });
        const initialLines = (bg.chiTietBaoGias ?? []).map((c) => ({
          nhomSanPhamId: c.nhomSanPham?.id ?? 0,
          loaiTonId: c.loaiTon?.id ?? 0,
          w: c.wInput,
          h: c.hInput,
          soLuong: c.soLuong,
          giaNhanCong: c.giaNhanCong ?? 0,
          phuKien: c.phuKien ?? 0,
          maHang: c.maHang,
          ghiChu: c.ghiChu,
        }));
        form.setFieldsValue({ lineInputs: initialLines.length > 0 ? initialLines : [{}] });
        if (initialLines.length > 0) {
          await refreshPreviews({ lineInputs: initialLines });
        }
      } else if (nhoms[0] && tons[0]) {
        form.setFieldsValue({
          thueSuat: 0.08,
          lineInputs: [{
            nhomSanPhamId: nhoms[0].id,
            loaiTonId: tons[0].id,
            w: 400,
            h: 300,
            soLuong: 1,
            giaNhanCong: 50000,
            phuKien: 10000,
          }],
        });
      }
    })();

    // try to load optional required-columns JSON generated from the Excel
    (async () => {
      try {
        const res = await fetch('/data/BANG_TINH_GIA_2026.xlsx.required.json');
        if (!res.ok) return;
        const json = await res.json();
        if (Array.isArray(json.required)) setRequiredHeaders(json.required.map(String));
      } catch {
        // ignore
      }
    })();
  }, [form, id, isEdit]);

  // Các hàm phụ trợ cho preview và quản lý dòng
  // Nếu dòng cuối đã được điền, tự động thêm 1 dòng rỗng mới
  const ensureNewRowIfNeeded = (allValues: any) => {
    const items = allValues.lineInputs || [];
    if (items.length === 0) {
      form.setFieldsValue({ lineInputs: [{}] });
      return;
    }
    const last = items[items.length - 1];
    const filled = last && last.nhomSanPhamId && last.loaiTonId && last.w > 0 && last.h > 0 && last.soLuong > 0;
    if (filled) {
      form.setFieldsValue({ lineInputs: [...items, {}] });
    }
  };

  // Gọi API preview cho từng dòng hợp lệ và lưu kết quả vào state
  const refreshPreviews = async (allValues: any) => {
    const items: LineFormValues[] = allValues.lineInputs || [];
    const previews: Record<number, CalculationResult> = {};
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      if (item && item.nhomSanPhamId && item.loaiTonId && item.w > 0 && item.h > 0 && item.soLuong > 0) {
        try {
          previews[index] = await previewCalculation(item);
        } catch {
          // ignore preview failure for this row
        }
      }
    }
    setLinePreviews(previews);
  };

  // Tính tổng theo các preview đã có và thuế suất hiện tại
  const calculateTotals = () => {
    let totalThanhTien = 0;
    const items = form.getFieldValue('lineInputs') || [];
    const thueSuat = form.getFieldValue('thueSuat') || 0;

    items.forEach((_: any, index: number) => {
      if (linePreviews[index]) {
        totalThanhTien += linePreviews[index].thanhTien;
      }
    });

    return {
      tongTien: totalThanhTien,
      thueTien: totalThanhTien * thueSuat,
      tongTienSauThue: totalThanhTien + totalThanhTien * thueSuat,
    };
  };

  const isRowIncomplete = (item: any) => {
    return !item || !item.nhomSanPhamId || !item.loaiTonId || !item.w || item.w <= 0 || !item.h || item.h <= 0 || !item.soLuong || item.soLuong <= 0;
  };

  const requiredRulesFor = (title: string) => {
    if (requiredHeaders.includes(title)) return [{ required: true, message: `${title} là bắt buộc` }];
    return undefined;
  };

  // Khi có thay đổi form: cập nhật preview, selected group và tự thêm dòng nếu cần
  const onValuesChange = async (_: any, allValues: any) => {
    try {
      await refreshPreviews(allValues);
      const items = allValues.lineInputs || [];
      const last = items[items.length - 1];
      if (last && last.nhomSanPhamId) {
        const found = nhomList.find((n) => n.id === last.nhomSanPhamId);
        setSelectedNhomRow(found);
      } else {
        setSelectedNhomRow(undefined);
      }
      ensureNewRowIfNeeded(allValues);
    } catch {
      setPreview(null);
    }
  };

  // Xác thực và gửi payload tạo hoặc cập nhật báo giá lên server
  const save = async () => {
    const header = await form.validateFields(['tenKhachHang', 'thueSuat']);
    const allLineInputs: LineFormValues[] = form.getFieldValue('lineInputs') || [];
    const filtered = allLineInputs.filter((l) => l && l.nhomSanPhamId && l.loaiTonId && l.w > 0 && l.h > 0 && l.soLuong > 0);
    if (filtered.length === 0) {
      message.warning('Thêm ít nhất một cụm sản phẩm');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        tenKhachHang: header.tenKhachHang,
        thueSuat: header.thueSuat,
        lines: filtered.map((l) => ({
          nhomSanPhamId: l.nhomSanPhamId,
          loaiTonId: l.loaiTonId,
          w: l.w,
          h: l.h,
          soLuong: l.soLuong,
          giaNhanCong: l.giaNhanCong,
          phuKien: l.phuKien,
          maHang: l.maHang,
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
            <Col span={6}>
              <Form.Item name="thueSuat" label="Thuế VAT">
                <InputNumber min={0} max={1} step={0.01} style={{ width: '100%' }} />
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
                  width: 60,
                  render: (_: any, __: any, idx: number) => idx + 1,
                },
                {
                  title: 'Tên sản phẩm',
                  dataIndex: 'nhomSanPhamId',
                  width: 220,
                  render: (_: any, field: any) => (
                      <Form.Item name={[field.name, 'nhomSanPhamId']} noStyle rules={requiredRulesFor('Tên sản phẩm') ?? [{ required: true, message: 'Chọn nhóm SP' }] }>
                      <Select placeholder="Chọn nhóm" options={nhomList.map((n) => ({ value: n.id, label: n.tenNhom }))} />
                    </Form.Item>
                  ),
                },
                {
                  title: <>
                    Xuất xứ/<br />Độ dày tôn
                  </>,
                  dataIndex: 'loaiTonId',
                  width: 200,
                  render: (_: any, field: any) => (
                      <Form.Item name={[field.name, 'loaiTonId']} noStyle rules={requiredRulesFor('Xuất xứ/Độ dày tôn') ?? [{ required: true, message: 'Chọn loại tôn' }] }>
                      <Select placeholder="Chọn tôn" options={loaiTonList.map((t) => ({ value: t.id, label: `${t.thuongHieu} ${t.doDay}mm` }))} />
                    </Form.Item>
                  ),
                },
                {
                  title: 'Mã hàng',
                  dataIndex: 'maHang',
                  width: 140,
                  render: (_: any, field: any) => (
                    <Form.Item name={[field.name, 'maHang']} noStyle rules={requiredRulesFor('Mã hàng') ? [{ required: true, message: 'Nhập mã hàng' }] : undefined}>
                      <Input placeholder="Mã hàng" />
                    </Form.Item>
                  ),
                },
                {
                  title: <>
                    Diện tích<br/>Sản xuất<br/>( m2 )
                  </>,
                  dataIndex: 'dienTichSx1Cai',
                  width: 120,
                  render: (_: any, field: any) => {
                    const preview = linePreviews[field.name];
                    return preview ? formatArea(preview.dienTichSx1Cai) : '-';
                  },
                },
                {
                  title: <>
                    Diện tích<br/>Sản xuất<br/>( mét tới )
                  </>,
                  dataIndex: 'tongDienTichLo',
                  width: 140,
                  render: (_: any, field: any) => {
                    const preview = linePreviews[field.name];
                    return preview ? formatArea(preview.tongDienTichLo) : '-';
                  },
                },
                {
                  title: <>
                    Trọng lượng<br/>( Kg)
                  </>,
                  dataIndex: 'trongLuongKg',
                  width: 100,
                  render: (_: any, field: any) => {
                    const preview = linePreviews[field.name];
                    return preview ? preview.trongLuongKg.toFixed(2) : '-';
                  },
                },
                {
                  title: <>
                    Giá tôn<br/>( VNĐ)
                  </>,
                  dataIndex: 'thanhTienTon',
                  width: 140,
                  render: (_: any, field: any) => {
                    const preview = linePreviews[field.name];
                    return preview ? formatMoney(preview.thanhTienTon) : '-';
                  },
                },
                {
                  title: <>
                    Giá nhân công<br/>( VNĐ)
                  </>,
                  dataIndex: 'giaNhanCong',
                  width: 140,
                  render: (_: any, field: any) => (
                    <Form.Item name={[field.name, 'giaNhanCong']} noStyle rules={requiredRulesFor('Giá nhân công (VNĐ)') ? [{ required: true, message: 'Nhập giá nhân công' }] : undefined}>
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                  ),
                },
                {
                  title: 'Phụ kiện đi kèm (VNĐ)',
                  dataIndex: 'phuKien',
                  width: 140,
                  render: (_: any, field: any) => (
                    <Form.Item name={[field.name, 'phuKien']} noStyle rules={requiredRulesFor('Phụ kiện đi kèm (VNĐ)') ? [{ required: true, message: 'Nhập phụ kiện' }] : undefined}>
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                  ),
                },
                {
                  title: 'Đơn vị tính',
                  dataIndex: 'donViTinh',
                  width: 100,
                  render: () => 'cái',
                },
                {
                  title: 'Số lượng',
                  dataIndex: 'soLuong',
                  width: 90,
                  render: (_: any, field: any) => (
                      <Form.Item name={[field.name, 'soLuong']} noStyle rules={requiredRulesFor('Số lượng') ?? [{ required: true, message: 'Nhập SL' }]}>
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  ),
                },
                {
                  title: 'Thuế suất',
                  dataIndex: 'thueSuatRow',
                  width: 100,
                  render: () => {
                    const v = form.getFieldValue('thueSuat') || 0;
                    return `${(v * 100).toFixed(0)} %`;
                  },
                },
                {
                  title: <>
                    Đơn giá<br/>(VND)
                  </>,
                  dataIndex: 'donGiaCuoi',
                  width: 120,
                  render: (_: any, field: any) => {
                    const preview = linePreviews[field.name];
                    return preview ? formatMoney(preview.donGiaCuoi) : '-';
                  },
                },
                {
                  title: <>
                    Thành tiền<br/>(VND)
                  </>,
                  dataIndex: 'thanhTien',
                  width: 140,
                  render: (_: any, field: any) => {
                    const preview = linePreviews[field.name];
                    return preview ? formatMoney(preview.thanhTien) : '-';
                  },
                },
                {
                  title: 'Ghi chú/ hình ảnh',
                  dataIndex: 'ghiChu',
                  width: 220,
                  render: (_: any, field: any) => (
                    <Form.Item name={[field.name, 'ghiChu']} noStyle rules={requiredRulesFor('Ghi chú/ hình ảnh') ? [{ required: true, message: 'Nhập ghi chú' }] : undefined}>
                      <Input placeholder="Ghi chú" />
                    </Form.Item>
                  ),
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
                    scroll={{ x: 1400 }}
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
                              {form.getFieldValue('thueSuat') > 0 && (
                                <>
                                  <div style={{ display: 'grid', gridTemplateColumns: '200px auto', gap: '16px', alignItems: 'center', color: '#666' }}>
                                    <span>Thuế VAT ({(form.getFieldValue('thueSuat') * 100).toFixed(0)}%):</span>
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
                  {fields.length === 0 && (
                    <Button type="dashed" icon={<PlusOutlined />} onClick={() => add()} style={{ marginTop: 16, width: '100%' }}>
                      Thêm dòng mới
                    </Button>
                  )}
                  <style>{`
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
              Hằng số: {selectedNhomRow.thamSoCoDinhs.map((t) => `${t.tenThamSo}=${t.giaTriSo}`).join(' | ')}
            </Text>
          )}
          {preview && (
            <Card size="small" style={{ marginTop: 16, background: '#fafafa' }}>
              <Space wrap>
                <Statistic title="S_sx/cái (m²)" value={formatArea(preview.dienTichSx1Cai)} />
                <Statistic title="ΣS_sx (m²)" value={formatArea(preview.tongDienTichLo)} />
                <Statistic title="Kg" value={preview.trongLuongKg.toFixed(2)} />
                <Statistic title="Tiền tôn" value={formatMoney(preview.thanhTienTon)} suffix="đ" />
                <Statistic title="Đơn giá" value={formatMoney(preview.donGiaCuoi)} suffix="đ" />
                <Statistic title="Thành tiền" value={formatMoney(preview.thanhTien)} suffix="đ" />
                {preview.apDungGiaSan && <Tag color="orange">Giá sàn &lt;1m²</Tag>}
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
