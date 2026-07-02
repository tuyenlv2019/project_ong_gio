/**
 * Trang quản lý người dùng nội bộ và phân quyền.
 */
import { DeleteOutlined, EditOutlined, KeyOutlined, PlusOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Form, Input, Modal, Popconfirm, Select, Space, Switch, Table, Tag, message } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createNguoiDung, deleteNguoiDung, getNguoiDungs, resetNguoiDungPassword, updateNguoiDung } from '../api';
import TableSearchBar from '../components/TableSearchBar';
import { useOpenCreateFromNavigation } from '../hooks/useOpenCreateFromNavigation';
import { authService } from '../authService';
import type { NguoiDung } from '../types';
import { createSttColumn } from '../utils/tableColumns';
import { getAuditSearchText, createAuditColumns } from '../utils/auditDisplay';
import { renderEllipsisCell } from '../utils/tableCellRender';
import { getApiErrorMessage } from '../utils/apiError';
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

type LoadState = 'loading' | 'ready' | 'error';

export default function UsersPage() {
  const [data, setData] = useState<NguoiDung[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [editing, setEditing] = useState<NguoiDung | null>(null);
  const [resettingUser, setResettingUser] = useState<NguoiDung | null>(null);
  const [form] = Form.useForm();
  const [resetForm] = Form.useForm<{ matKhauMoi: string; xacNhanMatKhauMoi: string }>();
  const isAdmin = authService.isAdmin();

  const reload = useCallback((silent = false) => {
    if (!silent) {
      setLoadState('loading');
      setLoadError('');
    }
    return getNguoiDungs()
      .then((rows) => {
        setData(rows);
        setLoadState('ready');
      })
      .catch((err: unknown) => {
        setLoadError(getApiErrorMessage(err, 'Không tải được danh sách user'));
        if (!silent) setLoadState('error');
      });
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

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
    reload();
  };

  const openResetModal = (item: NguoiDung) => {
    setResettingUser(item);
    resetForm.resetFields();
    setResetOpen(true);
  };

  const onResetPassword = async () => {
    if (!resettingUser) return;
    const values = await resetForm.validateFields();
    try {
      const result = await resetNguoiDungPassword(resettingUser.id, values);
      message.success(result.message || 'Đã reset mật khẩu');
      setResetOpen(false);
      setResettingUser(null);
    } catch (err: unknown) {
      message.error(getApiErrorMessage(err, 'Reset mật khẩu thất bại'));
    }
  };

  if (loadState === 'loading' && data.length === 0) {
    return <Card title="Quản lý user" loading />;
  }

  return (
    <Card
      title="Quản lý user"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
          Thêm user
        </Button>
      }
    >
      {loadState === 'error' && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="Không tải được danh sách user"
          description={
            loadError.includes('401') || loadError.includes('hết hạn')
              ? 'Phiên đăng nhập hết hạn hoặc không hợp lệ. Vui lòng đăng xuất và đăng nhập lại bằng tài khoản ADMIN.'
              : loadError.includes('403')
                ? 'Chỉ tài khoản ADMIN mới xem được danh sách user.'
                : `${loadError}. Kiểm tra kết nối API hoặc thử đăng nhập lại.`
          }
          action={(
            <Button size="small" onClick={() => void reload()}>
              Thử lại
            </Button>
          )}
        />
      )}
      <TableSearchBar value={search} onChange={setSearch} />
      <Table
        className="brand-list-table"
        rowKey="id"
        loading={loadState === 'loading'}
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
            width: isAdmin ? 70 : 50,
            render: (_, row) => (
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => openModal(row)} />
                {isAdmin && (
                  <Button
                    size="small"
                    icon={<KeyOutlined />}
                    title="Reset mật khẩu"
                    onClick={() => openResetModal(row)}
                  />
                )}
                <Popconfirm
                  title="Xóa user?"
                  onConfirm={async () => {
                    await deleteNguoiDung(row.id);
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

      <Modal
        title={resettingUser ? `Reset mật khẩu — ${resettingUser.tenDangNhap}` : 'Reset mật khẩu'}
        open={resetOpen}
        onOk={onResetPassword}
        onCancel={() => {
          setResetOpen(false);
          setResettingUser(null);
        }}
        okText="Reset"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={resetForm} layout="vertical">
          <Form.Item
            name="matKhauMoi"
            label="Mật khẩu mới"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới' },
              { min: 6, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' },
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="xacNhanMatKhauMoi"
            label="Xác nhận mật khẩu mới"
            dependencies={['matKhauMoi']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('matKhauMoi') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                },
              }),
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
