import { SearchOutlined } from '@ant-design/icons';
import { Modal, Table, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { getBaoGiaLineHistory } from '../api';
import HintInput from './HintInput';
import { renderEllipsisCell } from '../utils/tableCellRender';
import type { BaoGiaLineHistory } from '../types';

const { Text } = Typography;

const LINE_HISTORY_TABLE_SCROLL_X = 1006;

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
    if (!open) return undefined;

    document.body.classList.add('order-line-history-open');
    return () => {
      document.body.classList.remove('order-line-history-open');
    };
  }, [open]);

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
      width={1060}
      destroyOnClose
      className="line-history-picker-modal"
      styles={{
        body: {
          overflow: 'hidden',
        },
      }}
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
        Nhấn F4 tại ô Tên sản phẩm để mở hộp thoại này. Chọn một dòng để điền nhanh thông tin.
      </Text>
      <HintInput
        allowClear
        autoFocus
        prefix={<SearchOutlined />}
        placeholder="Tìm theo tên sản phẩm, loại SP, mã đơn, khách hàng..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        style={{ marginBottom: 16 }}
      />
      <div className="line-history-table-wrap">
        <Table
          className="line-history-table"
          size="small"
          rowKey="id"
          loading={loading}
          dataSource={rows}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          scroll={{ x: LINE_HISTORY_TABLE_SCROLL_X }}
          onRow={(record) => ({
            onClick: () => onSelect(record),
            onDoubleClick: () => onSelect(record),
            style: { cursor: 'pointer' },
          })}
          columns={[
          { title: 'Tên sản phẩm', dataIndex: 'tenSanPham', width: 180, ellipsis: true, render: renderEllipsisCell },
          { title: 'Loại SP', dataIndex: 'tenNhom', width: 140, ellipsis: true, render: renderEllipsisCell },
          {
            title: 'Kích thước',
            width: 160,
            ellipsis: true,
            render: (_: unknown, row: BaoGiaLineHistory) => renderEllipsisCell(formatDimensionSummary(row)),
          },
          { title: 'Loại tôn', dataIndex: 'loaiTonLabel', width: 120, ellipsis: true, render: renderEllipsisCell },
          { title: 'SL', dataIndex: 'soLuong', width: 56, align: 'center' },
          { title: 'Mã đơn', dataIndex: 'maBaoGia', width: 110, ellipsis: true, render: renderEllipsisCell },
          { title: 'Khách hàng', dataIndex: 'tenKhachHang', width: 140, ellipsis: true, render: renderEllipsisCell },
          {
            title: 'Ngày tạo',
            dataIndex: 'ngayTao',
            width: 100,
            render: (value: string) => formatDate(value),
          },
        ]}
        />
      </div>
    </Modal>
  );
}
