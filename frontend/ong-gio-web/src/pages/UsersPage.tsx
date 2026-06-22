/**
 * Trang quản lý người dùng nội bộ và phân quyền.
 */
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Modal, Popconfirm, Select, Space, Switch, Table, Tag, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { createNguoiDung, deleteNguoiDung, getNguoiDungs, updateNguoiDung } from '../api';
import TableSearchBar from '../components/TableSearchBar';
import { useOpenCreateFromNavigation } from '../hooks/useOpenCreateFromNavigation';
import type { NguoiDung } from '../types';
import { createSttColumn } from '../utils/tableColumns';
import { getAuditSearchText, createAuditColumns } from '../utils/auditDisplay';
import { renderEllipsisCell } from '../utils/tableCellRender';
import { filterBySearch, joinSearchParts } from '../utils/tableSearch';

function getUserSearchText(row: NguoiDung) {
  return joinSearchParts(
    row.tenDangNhap,
    row.hoTen,
    row.vaiTro,
    row.vaiTro === 'ADMIN' ? 'Admin' : 'Nhân viên',
    row.dangHoatDong ? 'Hoạt động' : 'Khóa',
    ...getAuditSearchText(row),
  );
}

export default function UsersPage() {
  const [data, setData] = useState<NguoiDung[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NguoiDung | null>(null);
  const [form] = Form.useForm();

  const load = async () => setData(await getNguoiDungs());
  useEffect(() => {
    load();
  }, []);

  const filteredData = useMemo(
    () => filterBySearch(data, search, getUserSearchText),
    [data, search],
  );

  const openModal = (item?: NguoiDung) => {
    setEditing(item ?? null);
    form.setFieldsValue(
      item
        ? { ...item, matKhau: '' }
        : { tenDangNhap: '', hoTen: '', matKhau: '', vaiTro: 'NHAN_VIEN', dangHoatDong: true },
    );
    setOpen(true);
  };

  useOpenCreateFromNavigation(() => openModal());

  const onSave = async () => {
    const values = await form.validateFields();
    if (editing) {
      await updateNguoiDung(editing.id, values);
      message.success('Đã cập nhật user');
    } else {
      await createNguoiDung(values);
      message.success('Đã thêm user');
    }
    setOpen(false);
    load();
  };

  return (
    <Card
      title="Quản lý user"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
          Thêm user
        </Button>
      }
    >
      <TableSearchBar value={search} onChange={setSearch} />
      <Table
        className="brand-list-table"
        rowKey="id"
        dataSource={filteredData}
        scroll={{ x: 1040 }}
        columns={[
          createSttColumn<NguoiDung>(),
          { title: 'Tên đăng nhập', dataIndex: 'tenDangNhap', width: 140, ellipsis: true, render: renderEllipsisCell },
          { title: 'Họ tên', dataIndex: 'hoTen', width: 160, ellipsis: true, render: renderEllipsisCell },
          {
            title: 'Vai trò',
            dataIndex: 'vaiTro',
            width: 110,
            render: (v) => <Tag color={v === 'ADMIN' ? 'red' : 'blue'}>{v}</Tag>,
          },
          {
            title: 'Trạng thái',
            dataIndex: 'dangHoatDong',
            width: 120,
            render: (v) => (v ? <Tag color="success">Hoạt động</Tag> : <Tag>Khóa</Tag>),
          },
          ...createAuditColumns<NguoiDung>(),
          {
            title: 'Thao tác',
            width: 100,
            fixed: 'right' as const,
            render: (_, row) => (
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => openModal(row)} />
                <Popconfirm
                  title="Xóa user?"
                  onConfirm={async () => {
                    await deleteNguoiDung(row.id);
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

      <Modal title={editing ? 'Sửa user' : 'Thêm user'} open={open} onOk={onSave} onCancel={() => setOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="tenDangNhap" label="Tên đăng nhập" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="hoTen" label="Họ tên" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="matKhau"
            label={editing ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu'}
            rules={editing ? [] : [{ required: true }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item name="vaiTro" label="Vai trò">
            <Select options={[{ value: 'ADMIN', label: 'Admin' }, { value: 'NHAN_VIEN', label: 'Nhân viên' }]} />
          </Form.Item>
          <Form.Item name="dangHoatDong" label="Hoạt động" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
