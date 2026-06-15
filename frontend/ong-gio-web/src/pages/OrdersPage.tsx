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
        columns={[
          { title: 'Mã BG', dataIndex: 'maBaoGia', width: 120 },
          { title: 'Khách hàng', dataIndex: 'tenKhachHang' },
          {
            title: 'Ngày tạo',
            dataIndex: 'ngayTao',
            render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm'),
          },
          {
            title: 'Trạng thái',
            dataIndex: 'trangThai',
            render: (v: string, row) => (
              <Select
                size="small"
                value={v || 'DANG_XU_LY'}
                style={{ width: 140 }}
                options={Object.entries(TRANG_THAI_DON).map(([k, o]) => ({ value: k, label: o.label }))}
                onChange={(val) => onStatusChange(row.id, val)}
              />
            ),
          },
          {
            title: 'Tổng tiền',
            dataIndex: 'tongTienSauThue',
            render: (v: number) => `${formatMoney(v)} đ`,
          },
          {
            title: 'Thao tác',
            width: 200,
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
