/**
 * Trang quản lý nhóm sản phẩm: công thức ∑Ssx và tham số nhập trên form đơn hàng.
 */
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Modal, Popconfirm, Space, Table, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { createNhomSanPham, deleteNhomSanPham, getNhomSanPhams, updateNhomSanPham } from '../api';
import FormulaDisplay from '../components/FormulaDisplay';
import HintInput from '../components/HintInput';
import ProductImageField from '../components/ProductImageField';
import TableSearchBar from '../components/TableSearchBar';
import { useOpenCreateFromNavigation } from '../hooks/useOpenCreateFromNavigation';
import { findDuplicateThamSo, sortOrderedThamSoCoDinhs } from '../utils/productFormParams';
import { createSttColumn } from '../utils/tableColumns';
import { getAuditSearchText, createAuditColumns } from '../utils/auditDisplay';
import { renderEllipsisCell } from '../utils/tableCellRender';
import { filterBySearch, joinSearchParts } from '../utils/tableSearch';
import { resolveMasterImageUrl } from '../utils/imageUrl';
import type { NhomSanPham, ThamSoCoDinh } from '../types';

function getProductSearchText(row: NhomSanPham) {
  const thamSo = sortOrderedThamSoCoDinhs(row.thamSoCoDinhs ?? [])
    .map((item) => item.tenThamSo)
    .join(', ');

  return joinSearchParts(row.tenNhom, row.hinhAnhMinhHoa, row.congThucDienTich, thamSo, ...getAuditSearchText(row));
}

export default function ProductsPage() {
  const [data, setData] = useState<NhomSanPham[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NhomSanPham | null>(null);
  const [form] = Form.useForm();

  const load = async () => setData(await getNhomSanPhams());
  useEffect(() => {
    load();
  }, []);

  const filteredData = useMemo(
    () => filterBySearch(data, search, getProductSearchText),
    [data, search],
  );

  const openModal = (item?: NhomSanPham) => {
    setEditing(item ?? null);
    form.setFieldsValue({
      tenNhom: item?.tenNhom ?? '',
      hinhAnhMinhHoa: item?.hinhAnhMinhHoa ?? '',
      congThucDienTich: item?.congThucDienTich ?? '',
      thamSo: item?.thamSoCoDinhs?.map((t) => ({ tenThamSo: t.tenThamSo })) ?? [
        { tenThamSo: 'W' },
        { tenThamSo: 'H' },
        { tenThamSo: 'L' },
      ],
    });
    setOpen(true);
  };

  useOpenCreateFromNavigation(() => openModal());

  const onSave = async () => {
    const values = await form.validateFields();
    const duplicateMsg = findDuplicateThamSo(values.thamSo ?? []);
    if (duplicateMsg) {
      message.warning(duplicateMsg);
      return;
    }
    try {
      if (editing) {
        await updateNhomSanPham(editing.id, values);
        message.success('Đã cập nhật sản phẩm');
      } else {
        await createNhomSanPham(values);
        message.success('Đã thêm sản phẩm');
      }
      setOpen(false);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg || 'Lưu thất bại');
    }
  };

  return (
    <Card
      title="Quản lý sản phẩm"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
          Thêm sản phẩm
        </Button>
      }
    >
      <TableSearchBar value={search} onChange={setSearch} />
      <Table
        className="brand-list-table"
        rowKey="id"
        dataSource={filteredData}
        scroll={{ x: 1520 }}
        columns={[
          createSttColumn<NhomSanPham>(),
          { title: 'Tên nhóm', dataIndex: 'tenNhom', width: 200, ellipsis: true, render: renderEllipsisCell },
          {
            title: 'Hình ảnh',
            dataIndex: 'hinhAnhMinhHoa',
            width: 120,
            align: 'center',
            render: (path: string) => {
              const url = resolveMasterImageUrl(path);
              if (!url) return '-';
              return (
                <img
                  src={url}
                  alt="Ảnh sản phẩm"
                  className="product-table-image"
                />
              );
            },
          },
          {
            title: 'Công thức ∑Ssx (m²)',
            dataIndex: 'congThucDienTich',
            width: 360,
            render: (value: string) => <FormulaDisplay value={value} variant="inline" emptyText="-" />,
          },
          {
            title: 'Tham số nhập trên form',
            dataIndex: 'thamSoCoDinhs',
            width: 220,
            ellipsis: true,
            render: (ts: ThamSoCoDinh[]) =>
              renderEllipsisCell(sortOrderedThamSoCoDinhs(ts ?? []).map((t) => t.tenThamSo).join(', ') || undefined),
          },
          ...createAuditColumns<NhomSanPham>(),
          {
            title: 'Thao tác',
            width: 60,
            render: (_, row) => (
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => openModal(row)} />
                <Popconfirm
                  title="Xóa sản phẩm?"
                  onConfirm={async () => {
                    await deleteNhomSanPham(row.id);
                    message.success('Đã xóa');
                    load();
                  }}
                >
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <style>{`
        .product-table-image {
          display: block;
          width: 100%;
          max-width: 100px;
          max-height: 72px;
          margin-inline: auto;
          object-fit: contain;
          border: 1px solid #f0f0f0;
          border-radius: 4px;
          background: #fafafa;
        }
        .product-image-upload .ant-upload-select {
          width: 128px !important;
          height: 128px !important;
        }
        .product-image-upload-preview {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .product-image-upload-placeholder {
          text-align: center;
          color: rgba(0, 0, 0, 0.45);
        }
      `}</style>

      <Modal title={editing ? 'Sửa sản phẩm' : 'Thêm sản phẩm'} open={open} onOk={onSave} onCancel={() => setOpen(false)} width={720}>
        <Form form={form} layout="vertical">
          <Form.Item name="tenNhom" label="Tên nhóm" rules={[{ required: true }]}>
            <HintInput placeholder="Co 90 độ, Ống thẳng..." />
          </Form.Item>
          <Form.Item
            name="hinhAnhMinhHoa"
            label="Ảnh minh họa"
            extra="Tải ảnh từ máy (JPG, PNG, GIF, WEBP — tối đa 5MB) hoặc nhập URL nếu ảnh đã có sẵn."
          >
            <ProductImageField />
          </Form.Item>
          <Form.Item
            name="congThucDienTich"
            label="Công thức tính diện tích ∑Ssx (m²)"
            rules={[{ required: true, message: 'Nhập công thức diện tích' }]}
            extra="Mỗi dòng: TênBiến = biểu thức. Dòng cuối: Ssx = ... Dùng tên tham số ở trên (W, H, L, r, ...). Hỗ trợ + - * /, if(), sqrt()."
          >
            <Input.TextArea
              rows={6}
              placeholder={'R = r + W\nS_matcong = (R + 58) * (R + 58) * 2 / 1000000\nSsx = S_matcong + ...'}
            />
          </Form.Item>
          <Form.List name="thamSo">
            {(fields, { add, remove }) => (
              <>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>Tham số người dùng nhập trên form đơn hàng</div>
                <div style={{ marginBottom: 12, color: 'rgba(0,0,0,0.45)', fontSize: 13 }}>
                  Mỗi tham số phải khác nhau (không trùng tên, không trùng ô W/H — ví dụ không thêm cả W và Wmax).
                </div>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} align="baseline" style={{ display: 'flex', marginBottom: 8 }}>
                    <Form.Item
                      {...restField}
                      name={[name, 'tenThamSo']}
                      rules={[{ required: true, message: 'Nhập tên tham số' }]}
                      style={{ flex: 1, marginBottom: 0 }}
                    >
                      <HintInput placeholder="W, H, L, R, r..." style={{ width: 280 }} />
                    </Form.Item>
                    <Button danger onClick={() => remove(name)}>
                      Xóa
                    </Button>
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add({ tenThamSo: '' })} block>
                  + Thêm tham số
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </Card>
  );
}
