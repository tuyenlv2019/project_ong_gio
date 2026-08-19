/**
 * Trang quản lý nhóm sản phẩm: công thức ∑Ssx và tham số nhập trên form đơn hàng.
 */
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Modal, Popconfirm, Select, Space, Table, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import {
  cleanupUploadedNhomSanPhamImage,
  createNhomSanPham,
  deleteNhomSanPham,
  getNhomSanPhams,
  updateNhomSanPham,
  uploadNhomSanPhamImage,
} from '../api';
import { authService } from '../authService';
import FormulaDisplay from '../components/FormulaDisplay';
import HintInput from '../components/HintInput';
import ProductImageField from '../components/ProductImageField';
import TableSearchBar from '../components/TableSearchBar';
import { useOpenCreateFromNavigation } from '../hooks/useOpenCreateFromNavigation';
import {
  findDuplicateThamSo,
  findMauTenPlaceholdersMissingFromThamSo,
  findSsxAssignmentMissing,
  findThamSoMissingFromFormula,
  sortOrderedThamSoCoDinhs,
} from '../utils/productFormParams';
import { suggestMauTenSanPham } from '../utils/tenSanPhamTemplate';
import { createSttColumn } from '../utils/tableColumns';
import { getAuditSearchText, createAuditColumns } from '../utils/auditDisplay';
import { filterBySearch, joinSearchParts } from '../utils/tableSearch';
import { resolveMasterImageUrl } from '../utils/imageUrl';
import type { NhomSanPham, ThamSoCoDinh } from '../types';

function getProductSearchText(row: NhomSanPham) {
  const thamSo = sortOrderedThamSoCoDinhs(row.thamSoCoDinhs ?? [])
    .map((item) => item.tenThamSo)
    .join(', ');

  return joinSearchParts(
    row.tenNhom,
    row.hinhAnhMinhHoa,
    row.congThucDienTich,
    row.mauTenSanPham,
    thamSo,
    ...getAuditSearchText(row),
  );
}

export default function ProductsPage() {
  const isAdmin = authService.isAdmin();
  const [data, setData] = useState<NhomSanPham[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NhomSanPham | null>(null);
  const [originalImagePath, setOriginalImagePath] = useState<string | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [formulaCopyKey, setFormulaCopyKey] = useState(0);
  const congThucDienTichWatch = Form.useWatch('congThucDienTich', form);

  const reload = () => {
    void getNhomSanPhams().then(setData);
  };

  const clearPendingImage = () => {
    setPendingImageFile(null);
    setPendingImagePreview((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return null;
    });
  };

  useEffect(() => {
    reload();
  }, []);

  const filteredData = useMemo(
    () => filterBySearch(data, search, getProductSearchText),
    [data, search],
  );

  /** Các loại SP khác đang có công thức — dùng cho chức năng sao chép. */
  const formulaCopySources = useMemo(
    () => data.filter((n) => n.congThucDienTich?.trim() && n.id !== editing?.id),
    [data, editing?.id],
  );

  const copyFormulaFromProduct = (sourceId: number) => {
    const source = data.find((n) => n.id === sourceId);
    if (!source?.congThucDienTich?.trim()) return;

    const applyCopy = () => {
      form.setFieldValue('congThucDienTich', source.congThucDienTich);
      setFormulaCopyKey((k) => k + 1);
      message.success(`Đã sao chép công thức từ "${source.tenNhom}"`);
    };

    const currentFormula = String(form.getFieldValue('congThucDienTich') ?? '').trim();
    if (currentFormula) {
      Modal.confirm({
        title: 'Ghi đè công thức hiện tại?',
        content: `Sao chép công thức từ "${source.tenNhom}" vào ô đang nhập.`,
        okText: 'Sao chép',
        cancelText: 'Hủy',
        onOk: applyCopy,
      });
      return;
    }

    applyCopy();
  };

  const openModal = (item?: NhomSanPham) => {
    clearPendingImage();
    setEditing(item ?? null);
    setOriginalImagePath(item?.hinhAnhMinhHoa?.trim() || null);
    const defaultThamSo = item?.thamSoCoDinhs?.map((t) => ({ tenThamSo: t.tenThamSo })) ?? [
      { tenThamSo: 'W' },
      { tenThamSo: 'H' },
      { tenThamSo: 'L' },
    ];
    form.setFieldsValue({
      tenNhom: item?.tenNhom ?? '',
      hinhAnhMinhHoa: item?.hinhAnhMinhHoa ?? '',
      congThucDienTich: item?.congThucDienTich ?? '',
      mauTenSanPham:
        item?.mauTenSanPham ??
        suggestMauTenSanPham(defaultThamSo.map((t) => t.tenThamSo)),
      thamSo: defaultThamSo,
    });
    setFormulaCopyKey((k) => k + 1);
    setOpen(true);
  };

  const closeModal = () => {
    clearPendingImage();
    setOriginalImagePath(null);
    setOpen(false);
  };

  const fillSuggestedMauTen = () => {
    const thamSo = (form.getFieldValue('thamSo') as { tenThamSo?: string }[] | undefined) ?? [];
    const suggested = suggestMauTenSanPham(thamSo.map((t) => String(t.tenThamSo ?? '')));
    form.setFieldValue('mauTenSanPham', suggested);
  };

  useOpenCreateFromNavigation(() => openModal());

  const persistProduct = async (values: {
    tenNhom: string;
    hinhAnhMinhHoa?: string;
    congThucDienTich?: string;
    mauTenSanPham?: string;
    thamSo?: { tenThamSo?: string }[];
  }) => {
    let uploadedImagePath: string | undefined;
    try {
      uploadedImagePath = pendingImageFile ? await uploadNhomSanPhamImage(pendingImageFile) : undefined;
      const nextImagePath =
        uploadedImagePath ?? (String(values.hinhAnhMinhHoa ?? '').trim() || undefined);

      const payload = {
        ...values,
        hinhAnhMinhHoa: nextImagePath,
        thamSo: values.thamSo?.map((item) => ({
          tenThamSo: String(item.tenThamSo ?? '').trim(),
        })),
      };

      if (editing) {
        await updateNhomSanPham(editing.id, payload);
        message.success('Đã cập nhật sản phẩm');
      } else {
        await createNhomSanPham(payload);
        message.success('Đã thêm sản phẩm');
      }

      if (originalImagePath && originalImagePath !== nextImagePath && originalImagePath.includes('res.cloudinary.com')) {
        try {
          await cleanupUploadedNhomSanPhamImage(originalImagePath);
        } catch {
          // Ignore cleanup failures so the save result remains successful.
        }
      }

      closeModal();
      reload();
    } catch (err: unknown) {
      if (uploadedImagePath) {
        try {
          await cleanupUploadedNhomSanPhamImage(uploadedImagePath);
        } catch {
          // Ignore cleanup failures so the original save error is still shown.
        }
      }
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg || 'Lưu thất bại');
    }
  };

  const onSave = async () => {
    const values = await form.validateFields();
    const ssxMissingMsg = findSsxAssignmentMissing(values.congThucDienTich);
    if (ssxMissingMsg) {
      message.warning(ssxMissingMsg);
      return;
    }
    const duplicateMsg = findDuplicateThamSo(values.thamSo ?? []);
    if (duplicateMsg) {
      message.warning(duplicateMsg);
      return;
    }
    const missingInFormulaMsg = findThamSoMissingFromFormula(
      values.thamSo ?? [],
      values.congThucDienTich,
    );
    if (missingInFormulaMsg) {
      message.warning(missingInFormulaMsg);
      return;
    }
    const mauTenMissingMsg = findMauTenPlaceholdersMissingFromThamSo(
      values.mauTenSanPham,
      values.thamSo ?? [],
    );
    if (mauTenMissingMsg) {
      message.warning(mauTenMissingMsg);
      return;
    }

    const nextFormula = String(values.congThucDienTich ?? '').trim();
    const currentEditing = editing;
    const prevFormula = String(currentEditing?.congThucDienTich ?? '').trim();
    const formulaChanged = isAdmin && currentEditing !== null && nextFormula !== prevFormula;

    if (formulaChanged && currentEditing) {
      Modal.confirm({
        title: 'Xác nhận thay đổi công thức?',
        content: `Công thức ∑Ssx của "${currentEditing.tenNhom}" sẽ được cập nhật. Diện tích các đơn hàng mới sẽ tính theo công thức mới.`,
        okText: 'Xác nhận lưu',
        cancelText: 'Hủy',
        onOk: () => persistProduct(values),
      });
      return;
    }

    await persistProduct(values);
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
        scroll={{ x: 1610 }}
        columns={[
          createSttColumn<NhomSanPham>(),
          {
            title: 'Tên nhóm',
            dataIndex: 'tenNhom',
            width: 100,
            render: (value?: string) => value?.trim() || '—',
            onCell: () => ({ style: { whiteSpace: 'normal', wordBreak: 'break-word' } }),
          },
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
            width: 320,
            render: (value: string) => <FormulaDisplay value={value} variant="inline" emptyText="-" />,
          },
          {
            title: 'Mẫu tên SP',
            dataIndex: 'mauTenSanPham',
            width: 120,
            render: (value?: string) => value?.trim() || '—',
            onHeaderCell: () => ({ style: { whiteSpace: 'nowrap' } }),
            onCell: () => ({ style: { whiteSpace: 'normal', overflowWrap: 'anywhere' } }),
          },
          {
            title: 'Tham số nhập trên form',
            dataIndex: 'thamSoCoDinhs',
            width: 190,
            render: (ts: ThamSoCoDinh[]) =>
              sortOrderedThamSoCoDinhs(ts ?? []).map((t) => t.tenThamSo).join(', ') || '—',
            onHeaderCell: () => ({ style: { whiteSpace: 'nowrap' } }),
            onCell: () => ({ style: { whiteSpace: 'normal', overflowWrap: 'anywhere' } }),
          },
          ...createAuditColumns<NhomSanPham>(),
          {
            title: 'Thao tác',
            width: 100,
            onHeaderCell: () => ({ style: { whiteSpace: 'nowrap' } }),
            render: (_, row) => (
              <Space size={4} wrap={false}>
                <Button size="small" icon={<EditOutlined />} onClick={() => openModal(row)} />
                <Popconfirm
                  title="Xóa sản phẩm?"
                  onConfirm={async () => {
                    await deleteNhomSanPham(row.id);
                    message.success('Đã xóa');
                    reload();
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

      <Modal title={editing ? 'Sửa sản phẩm' : 'Thêm sản phẩm'} open={open} onOk={onSave} onCancel={closeModal} width={720}>
        <Form form={form} layout="vertical">
          <Form.Item name="tenNhom" label="Tên nhóm" rules={[{ required: true }]}>
            <HintInput placeholder="Co 90 độ, Ống thẳng..." />
          </Form.Item>
          <Form.Item
            name="hinhAnhMinhHoa"
            label="Ảnh minh họa"
            extra="Tải ảnh từ máy (JPG, PNG, GIF, WEBP — tối đa 5MB) hoặc nhập URL nếu ảnh đã có sẵn."
          >
            <ProductImageField
              previewUrl={pendingImagePreview ?? undefined}
              onRemoveCurrentImage={async (imageUrl) => {
                await cleanupUploadedNhomSanPhamImage(imageUrl);
              }}
              onFileChange={(file) => {
                setPendingImageFile(file);
                setPendingImagePreview((current) => {
                  if (current) {
                    URL.revokeObjectURL(current);
                  }
                  return file ? URL.createObjectURL(file) : null;
                });
              }}
            />
          </Form.Item>
          <Form.Item
            label="Công thức tính diện tích ∑Ssx (m²)"
            required={isAdmin}
            extra={
              isAdmin
                ? 'Mỗi dòng: TênBiến = biểu thức. Dòng cuối: Ssx = ... Dùng tên tham số ở trên (W, H, L, r, ...). Hỗ trợ + - * /, if(), sqrt().'
                : 'Chỉ tài khoản ADMIN được sửa công thức. Bạn chỉ có thể xem.'
            }
          >
            {isAdmin ? (
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Select
                  key={formulaCopyKey}
                  showSearch
                  allowClear
                  placeholder={
                    formulaCopySources.length > 0
                      ? 'Sao chép công thức từ sản phẩm có sẵn...'
                      : 'Chưa có sản phẩm khác có công thức để sao chép'
                  }
                  disabled={formulaCopySources.length === 0}
                  optionFilterProp="label"
                  style={{ width: '100%' }}
                  options={formulaCopySources.map((n) => ({
                    value: n.id,
                    label: n.tenNhom,
                  }))}
                  onChange={(value) => {
                    if (value !== undefined && value !== null) {
                      copyFormulaFromProduct(Number(value));
                    }
                  }}
                />
                <Form.Item
                  name="congThucDienTich"
                  noStyle
                  rules={[{ required: true, message: 'Nhập công thức diện tích' }]}
                >
                  <Input.TextArea
                    rows={6}
                    placeholder={'R = r + W\nS_matcong = (R + 58) * (R + 58) * 2 / 1000000\nSsx = S_matcong + ...'}
                  />
                </Form.Item>
              </Space>
            ) : (
              <>
                <Form.Item name="congThucDienTich" hidden>
                  <Input />
                </Form.Item>
                <div
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #f0f0f0',
                    borderRadius: 6,
                    background: '#fafafa',
                    minHeight: 120,
                  }}
                >
                  <FormulaDisplay
                    value={congThucDienTichWatch}
                    variant="block"
                    emptyText="Chưa có công thức (chỉ Admin được nhập)"
                  />
                </div>
              </>
            )}
          </Form.Item>
          <Form.List name="thamSo">
            {(fields, { add, remove }) => (
              <>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>Tham số người dùng nhập trên form đơn hàng</div>
                <div style={{ marginBottom: 12, color: 'rgba(0,0,0,0.45)', fontSize: 13 }}>
                  Mỗi tham số phải khác nhau (không trùng tên, không trùng ô W/H — ví dụ không thêm cả W và Wmax).
                  Mỗi tham số phải xuất hiện trong công thức ∑Ssx — nếu không có sẽ không cho lưu.
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
          <Form.Item
            label="Mẫu tên sản phẩm mặc định"
            style={{ marginTop: 16 }}
            extra={
              <>
                Dùng khi tạo dòng trên form đơn hàng. Placeholder: {'{TenNhom}'}, {'{W}'}/{'{W1}'}, {'{H}'}/{'{H1}'},{' '}
                {'{W2}'}, {'{H2}'}, {'{L}'}, {'{R}'}, {'{D}'}, {'{N}'}…
                Mỗi placeholder (trừ {'{TenNhom}'}) phải có trong danh sách tham số form — nếu không sẽ không cho lưu.
              </>
            }
          >
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item name="mauTenSanPham" noStyle>
                <HintInput placeholder="Ống gió KT {W}x{H} L{L} mm" style={{ width: '100%' }} />
              </Form.Item>
              <Button onClick={fillSuggestedMauTen}>Gợi ý</Button>
            </Space.Compact>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
