import { SearchOutlined } from '@ant-design/icons';
import { Input, Modal, Table, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { getBaoGiaLineHistory } from '../api';
import type { BaoGiaLineHistory } from '../types';

const { Text } = Typography;

type LineHistoryPickerModalProps = {
  open: boolean;
  initialSearch?: string;
  onClose: () => void;
  onSelect: (item: BaoGiaLineHistory) => void;
};

function formatDimensionSummary(item: BaoGiaLineHistory) {
  const parts: string[] = [];
  if (item.w) parts.push(`W ${item.w}`);
  if (item.h) parts.push(`H ${item.h}`);
  if (item.thamSoNhapJson) {
    try {
      const params = JSON.parse(item.thamSoNhapJson) as Record<string, number>;
      Object.entries(params).forEach(([key, value]) => {
        if (value) parts.push(`${key} ${value}`);
      });
    } catch {
      // Bỏ qua JSON không hợp lệ.
    }
  }
  return parts.join(' × ') || '—';
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('vi-VN');
}

export default function LineHistoryPickerModal({
  open,
  initialSearch = '',
  onClose,
  onSelect,
}: LineHistoryPickerModalProps) {
  const [search, setSearch] = useState(initialSearch);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<BaoGiaLineHistory[]>([]);

  useEffect(() => {
    if (!open) return;
    setSearch(initialSearch);
  }, [open, initialSearch]);

  useEffect(() => {
    if (!open) return undefined;

    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const data = await getBaoGiaLineHistory(search);
        setRows(data);
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [open, search]);

  return (
    <Modal
      title="Chọn sản phẩm từ đơn hàng cũ"
      open={open}
      onCancel={onClose}
      footer={null}
      width={980}
      destroyOnClose
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
        Nhấn F4 tại ô Tên sản phẩm để mở hộp thoại này. Chọn một dòng để điền nhanh thông tin.
      </Text>
      <Input
        allowClear
        autoFocus
        prefix={<SearchOutlined />}
        placeholder="Tìm theo tên sản phẩm, loại SP, mã đơn, khách hàng..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        style={{ marginBottom: 16 }}
      />
      <Table
        size="small"
        rowKey="id"
        loading={loading}
        dataSource={rows}
        pagination={{ pageSize: 8, showSizeChanger: false }}
        onRow={(record) => ({
          onClick: () => onSelect(record),
          onDoubleClick: () => onSelect(record),
          style: { cursor: 'pointer' },
        })}
        columns={[
          { title: 'Tên sản phẩm', dataIndex: 'tenSanPham', width: 180 },
          { title: 'Loại SP', dataIndex: 'tenNhom', width: 140 },
          {
            title: 'Kích thước',
            width: 160,
            render: (_: unknown, row: BaoGiaLineHistory) => formatDimensionSummary(row),
          },
          { title: 'Loại tôn', dataIndex: 'loaiTonLabel', width: 120 },
          { title: 'SL', dataIndex: 'soLuong', width: 56, align: 'center' },
          { title: 'Mã đơn', dataIndex: 'maBaoGia', width: 110 },
          { title: 'Khách hàng', dataIndex: 'tenKhachHang', width: 140 },
          {
            title: 'Ngày tạo',
            dataIndex: 'ngayTao',
            width: 100,
            render: (value: string) => formatDate(value),
          },
        ]}
      />
    </Modal>
  );
}
