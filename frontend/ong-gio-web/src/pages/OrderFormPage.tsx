import { Button, Card, Col, Form, Input, InputNumber, Row, Select, Space, Statistic, Tag, Typography, message } from 'antd';
import { MinusCircleOutlined } from '@ant-design/icons';
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

const { Title, Text } = Typography;

function formatArea(value: number) {
  return value.toFixed(4);
}

export default function OrderFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [nhomList, setNhomList] = useState<NhomSanPham[]>([]);
  const [loaiTonList, setLoaiTonList] = useState<LoaiTon[]>([]);
  const [lines, setLines] = useState<LineFormValues[]>([]);
  const [preview, setPreview] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedNhomRow, setSelectedNhomRow] = useState<NhomSanPham | undefined>(undefined);

  useEffect(() => {
    (async () => {
      const [nhoms, tons] = await Promise.all([getNhomSanPhams(), getLoaiTons()]);
      setNhomList(nhoms);
      setLoaiTonList(tons);

      if (isEdit && id) {
        const bg = await getBaoGia(Number(id));
        form.setFieldsValue({ tenKhachHang: bg.tenKhachHang, thueSuat: bg.thueSuat });
        setLines(
          (bg.chiTietBaoGias ?? []).map((c) => ({
            nhomSanPhamId: c.nhomSanPham?.id ?? 0,
            loaiTonId: c.loaiTon?.id ?? 0,
            w: c.wInput,
            h: c.hInput,
            soLuong: c.soLuong,
            giaNhanCong: c.giaNhanCong ?? 0,
            phuKien: c.phuKien ?? 0,
          })),
        );
        form.setFieldsValue({ lineInputs: (bg.chiTietBaoGias ?? []).map((c) => ({
          nhomSanPhamId: c.nhomSanPham?.id ?? 0,
          loaiTonId: c.loaiTon?.id ?? 0,
          w: c.wInput,
          h: c.hInput,
          soLuong: c.soLuong,
          giaNhanCong: c.giaNhanCong ?? 0,
          phuKien: c.phuKien ?? 0,
        })) });
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
  }, [form, id, isEdit]);

  const runPreview = async (values: LineFormValues) => {
    try {
      setPreview(
        await previewCalculation({
          nhomSanPhamId: values.nhomSanPhamId,
          loaiTonId: values.loaiTonId,
          w: values.w,
          h: values.h,
          soLuong: values.soLuong,
          giaNhanCong: values.giaNhanCong,
          phuKien: values.phuKien,
        }),
      );
    } catch {
      setPreview(null);
    }
  };

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

  const onValuesChange = async (_: any, allValues: any) => {
    try {
      const items = allValues.lineInputs || [];
      const lastIdx = items.length - 1;
      const last = items[lastIdx];
      if (last && last.nhomSanPhamId && last.loaiTonId) {
        await runPreview(last as LineFormValues);
        const found = nhomList.find((n) => n.id === last.nhomSanPhamId);
        setSelectedNhomRow(found);
      } else {
        setPreview(null);
        setSelectedNhomRow(undefined);
      }
      ensureNewRowIfNeeded(allValues);
    } catch {
      setPreview(null);
    }
  };

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
            {(fields, { remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, idx) => (
                  <Row gutter={16} key={key} align="middle">
                    <Col span={6}>
                      <Form.Item
                        {...restField}
                        name={[name, 'nhomSanPhamId']}
                        label={`Nhóm SP ${idx + 1}`}
                        rules={[{ required: true }]}
                      >
                        <Select options={nhomList.map((n) => ({ value: n.id, label: n.tenNhom }))} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        {...restField}
                        name={[name, 'loaiTonId']}
                        label="Loại tôn"
                        rules={[{ required: true }]}
                      >
                        <Select options={loaiTonList.map((t) => ({ value: t.id, label: `${t.thuongHieu} ${t.doDay}mm` }))} />
                      </Form.Item>
                    </Col>
                    <Col span={3}><Form.Item {...restField} name={[name, 'w']} label="W (mm)" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item></Col>
                    <Col span={3}><Form.Item {...restField} name={[name, 'h']} label="H (mm)" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item></Col>
                    <Col span={2}><Form.Item {...restField} name={[name, 'soLuong']} label="SL" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item></Col>
                    <Col span={3}><Form.Item {...restField} name={[name, 'giaNhanCong']} label="Nhân công"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
                    <Col span={3}><Form.Item {...restField} name={[name, 'phuKien']} label="Phụ kiện"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
                    <Col span={1}>
                      {fields.length > 1 && (
                        <MinusCircleOutlined onClick={() => remove(name)} style={{ fontSize: 18, color: '#ff4d4f' }} />
                      )}
                    </Col>
                  </Row>
                ))}
              </>
            )}
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

        {lines.length > 0 && (
          <Card title={`${lines.length} cụm đã thêm`} style={{ marginTop: 16 }}>
            {lines.map((l, i) => (
              <div key={i}>
                {i + 1}. {nhomList.find((n) => n.id === l.nhomSanPhamId)?.tenNhom} — W={l.w} H={l.h} SL={l.soLuong}
              </div>
            ))}
          </Card>
        )}

        <Space style={{ marginTop: 16 }}>
          <Button type="primary" size="large" loading={loading} onClick={save}>Lưu đơn hàng</Button>
          <Button onClick={() => navigate('/don-hang')}>Hủy</Button>
        </Space>
      </Form>
    </div>
  );
}
