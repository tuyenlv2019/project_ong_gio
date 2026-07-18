/**
 * Trang quản lý loại tôn và các thông số giá.
 */
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Space, Table, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { createLoaiTon, deleteLoaiTon, formatMoney, getLoaiTons, moneyInputNumberProps, updateLoaiTon } from '../api';
import TableSearchBar from '../components/TableSearchBar';
import { useOpenCreateFromNavigation } from '../hooks/useOpenCreateFromNavigation';
import type { LoaiTon } from '../types';
import { getApiErrorMessage } from '../utils/apiError';
import { createSttColumn } from '../utils/tableColumns';
import { getAuditSearchText, createAuditColumns } from '../utils/auditDisplay';
import { renderEllipsisCell } from '../utils/tableCellRender';
import { filterBySearch, joinSearchParts } from '../utils/tableSearch';

function formatKgMetToi(value: number) {
  return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value)} kg/1mét tới`;
}

function getMaterialSearchText(row: LoaiTon) {
  return joinSearchParts(
    row.thuongHieu,
    row.doDay,
    row.doMaVatLieu,
    formatMoney(row.donGiaMetToi),
    row.donGiaMetToi,
    formatKgMetToi(row.kgMoiMetToi),
    row.kgMoiMetToi,
    ...getAuditSearchText(row),
  );
}

export default function MaterialsPage() {
  const [data, setData] = useState<LoaiTon[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LoaiTon | null>(null);
  const [form] = Form.useForm();

  const reload = () => {
    void getLoaiTons().then(setData);
  };

  useEffect(() => {
    reload();
  }, []);

  const filteredData = useMemo(
    () => filterBySearch(data, search, getMaterialSearchText),
    [data, search],
  );

  const openModal = (item?: LoaiTon) => {
    setEditing(item ?? null);
    form.setFieldsValue(
      item ?? { thuongHieu: '', doDay: 0.58, doMaVatLieu: '', donGiaMetToi: 222000, kgMoiMetToi: 4.5 },
    );
    setOpen(true);
  };

  useOpenCreateFromNavigation(() => openModal());

  const onSave = async () => {
    const values = await form.validateFields();
    const thuongHieu = String(values.thuongHieu ?? '').trim().toLowerCase();
    const doMaVatLieu = String(values.doMaVatLieu ?? '').trim().toLowerCase();
    const doDay = Number(values.doDay);
    const duplicated = data.some(
      (row) =>
        (!editing || row.id !== editing.id)
        && String(row.thuongHieu ?? '').trim().toLowerCase() === thuongHieu
        && Number(row.doDay) === doDay
        && String(row.doMaVatLieu ?? '').trim().toLowerCase() === doMaVatLieu,
    );
    if (duplicated) {
      message.error('Đã tồn tại loại tôn trùng Thương hiệu, Độ dày (mm) và Độ mạ vật liệu.');
      return;
    }

    try {
      if (editing) {
        await updateLoaiTon(editing.id, values);
        message.success('Đã cập nhật');
      } else {
        await createLoaiTon(values);
        message.success('Đã thêm loại tôn');
      }
      setOpen(false);
      reload();
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Không lưu được loại tôn.'));
    }
  };

  return (
    <Card
      title="Quản lý nguyên liệu (Tôn)"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
          Thêm loại tôn
        </Button>
      }
    >
      <TableSearchBar value={search} onChange={setSearch} />
      <Table
        className="brand-list-table"
        rowKey="id"
        dataSource={filteredData}
        scroll={{ x: 1180 }}
        columns={[
          createSttColumn<LoaiTon>(),
          { title: 'Thương hiệu', dataIndex: 'thuongHieu', width: 140, ellipsis: true, render: renderEllipsisCell },
          { title: 'Độ dày (mm)', dataIndex: 'doDay', width: 110, ellipsis: true, render: renderEllipsisCell },
          {
            title: 'Độ mạ vật liệu',
            dataIndex: 'doMaVatLieu',
            width: 140,
            ellipsis: true,
            render: renderEllipsisCell,
          },
          {
            title: 'Đơn giá/mét tới (VND)',
            dataIndex: 'donGiaMetToi',
            width: 170,
            ellipsis: true,
            render: (v) => renderEllipsisCell(`${formatMoney(v)} VND`),
          },
          {
            title: 'Khối lượng (kg/1mét tới)',
            dataIndex: 'kgMoiMetToi',
            width: 170,
            ellipsis: true,
            render: (v) => renderEllipsisCell(formatKgMetToi(v)),
          },
          ...createAuditColumns<LoaiTon>(),
          {
            title: 'Thao tác',
            width: 100,
            onHeaderCell: () => ({ style: { whiteSpace: 'nowrap' } }),
            render: (_, row) => (
              <Space size={4} wrap={false}>
                <Button size="small" icon={<EditOutlined />} onClick={() => openModal(row)} />
                <Popconfirm
                  title="Xóa loại tôn?"
                  onConfirm={async () => {
                    await deleteLoaiTon(row.id);
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

      <Modal
        title={editing ? 'Sửa loại tôn' : 'Thêm loại tôn'}
        open={open}
        onOk={onSave}
        onCancel={() => setOpen(false)}
        okText="Lưu"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="thuongHieu" label="Thương hiệu" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="doDay" label="Độ dày (mm)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} step={0.01} />
          </Form.Item>
          <Form.Item
            name="doMaVatLieu"
            label="Độ mạ vật liệu"
            rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập độ mạ vật liệu' }]}
          >
            <Input placeholder="Nhập độ mạ (vd. Z120, Z275)" />
          </Form.Item>
          <Form.Item name="donGiaMetToi" label="Đơn giá/mét tới (VND)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} precision={0} addonAfter="VND" {...moneyInputNumberProps} />
          </Form.Item>
          <Form.Item
            name="kgMoiMetToi"
            label="Khối lượng (kg/1mét tới)"
            tooltip="Số kg tôn tương ứng với 1 mét tới (chiều dài triển khai tôn)"
            rules={[{ required: true }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} step={0.01} addonAfter="kg/1mét tới" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
