/**
 * Trang danh sách báo giá, hỗ trợ sửa, xóa, đổi trạng thái và export.
 */
import { DeleteOutlined, DownloadOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Popconfirm, Select, Space, Table, message } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TRANG_THAI_DON,
  deleteBaoGia,
  formatMoney,
  getBaoGiaExportUrl,
  getBaoGias,
  updateBaoGiaStatus,
} from '../api';
import type { BaoGia } from '../types';

function formatDateTime(value?: string) {
  if (!value) return '—';
  const parsed = dayjs(value);
  if (!parsed.isValid() || parsed.year() <= 1) return '—';
  return parsed.format('DD/MM/YYYY HH:mm');
}

function getCreatedAt(row: BaoGia) {
  return formatDateTime(row.createdAt || row.ngayTao);
}

function getUpdatedAt(row: BaoGia) {
  return formatDateTime(row.updatedAt);
}

function getCreatedBy(row: BaoGia) {
  return row.createdBy?.trim() || '—';
}

function getUpdatedBy(row: BaoGia) {
  return row.updatedBy?.trim() || '—';
}

export default function OrdersPage() {
  const [data, setData] = useState<BaoGia[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      setData(await getBaoGias());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onDelete = async (id: number) => {
    await deleteBaoGia(id);
    message.success('Đã xóa đơn hàng');
    load();
  };

  const onStatusChange = async (id: number, trangThai: string) => {
    await updateBaoGiaStatus(id, trangThai);
    message.success('Đã cập nhật trạng thái');
    load();
  };

  return (
    <Card
      title="Quản lý đơn hàng"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/don-hang/tao-moi')}>
          Tạo đơn hàng
        </Button>
      }
    >
      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        scroll={{ x: 1420 }}
        columns={[
          { title: 'Mã BG', dataIndex: 'maBaoGia', width: 120, fixed: 'left' as const },
          { title: 'Khách hàng', dataIndex: 'tenKhachHang', width: 160 },
          {
            title: 'Ngày giờ tạo',
            width: 150,
            render: (_: unknown, row: BaoGia) => getCreatedAt(row),
          },
          {
            title: 'Người tạo',
            width: 140,
            render: (_: unknown, row: BaoGia) => getCreatedBy(row),
          },
          {
            title: 'Trạng thái',
            dataIndex: 'trangThai',
            width: 170,
            render: (v: string, row) => (
              <Select
                size="small"
                value={v || 'CHUA_XU_LY'}
                style={{ width: 160 }}
                options={Object.entries(TRANG_THAI_DON).map(([k, o]) => ({ value: k, label: o.label }))}
                onChange={(val) => onStatusChange(row.id, val)}
              />
            ),
          },
          {
            title: 'Người cập nhật',
            width: 140,
            render: (_: unknown, row: BaoGia) => getUpdatedBy(row),
          },
          {
            title: 'Cập nhật lúc',
            width: 150,
            render: (_: unknown, row: BaoGia) => getUpdatedAt(row),
          },
          {
            title: 'Tổng tiền',
            dataIndex: 'tongTienSauThue',
            width: 140,
            render: (v: number) => `${formatMoney(v)} đ`,
          },
          {
            title: 'Thao tác',
            width: 200,
            fixed: 'right' as const,
            render: (_, row) => (
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/don-hang/${row.id}`)} />
                <Button
                  size="small"
                  icon={<DownloadOutlined />}
                  onClick={() => window.open(getBaoGiaExportUrl(row.id), '_blank')}
                />
                <Popconfirm title="Xóa đơn hàng?" onConfirm={() => onDelete(row.id)}>
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
    </Card>
  );
}
