/**
 * Trang danh sách báo giá, hỗ trợ sửa, xóa, đổi trạng thái và export.
 */
import { DeleteOutlined, DownloadOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Popconfirm, Select, Space, Table, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TableSearchBar from '../components/TableSearchBar';
import {
  TRANG_THAI_DON,
  deleteBaoGia,
  formatMoney,
  getBaoGiaExportUrl,
  getBaoGias,
  updateBaoGiaStatus,
} from '../api';
import type { BaoGia } from '../types';
import { createSttColumn } from '../utils/tableColumns';
import {
  formatAuditDateTime,
  formatAuditUser,
  getAuditSearchText,
  createAuditColumns,
} from '../utils/auditDisplay';
import { renderEllipsisCell } from '../utils/tableCellRender';
import { filterBySearch, joinSearchParts } from '../utils/tableSearch';

function getCreatedAt(row: BaoGia) {
  return formatAuditDateTime(row.createdAt || row.ngayTao);
}

function getUpdatedAt(row: BaoGia) {
  return formatAuditDateTime(row.updatedAt);
}

function getCreatedBy(row: BaoGia) {
  return formatAuditUser(row.createdBy);
}

function getUpdatedBy(row: BaoGia) {
  return formatAuditUser(row.updatedBy);
}

function getOrderSearchText(row: BaoGia) {
  const status = TRANG_THAI_DON[row.trangThai]?.label ?? row.trangThai;
  return joinSearchParts(
    row.maBaoGia,
    row.tenKhachHang,
    getCreatedAt(row),
    getCreatedBy(row),
    status,
    row.trangThai,
    getUpdatedBy(row),
    getUpdatedAt(row),
    formatMoney(row.tongTienSauThue),
    formatMoney(row.tongTienTruocThue),
    row.tongTienSauThue,
    row.tongTienTruocThue,
    ...getAuditSearchText(row),
  );
}

export default function OrdersPage() {
  const [data, setData] = useState<BaoGia[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
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

  const filteredData = useMemo(
    () => filterBySearch(data, search, getOrderSearchText),
    [data, search],
  );

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
      <TableSearchBar value={search} onChange={setSearch} />
      <Table
        className="brand-list-table"
        rowKey="id"
        loading={loading}
        dataSource={filteredData}
        scroll={{ x: 1380 }}
        columns={[
          createSttColumn<BaoGia>(),
          { title: 'Mã Báo Giá', dataIndex: 'maBaoGia', width: 130, ellipsis: true, render: renderEllipsisCell },
          { title: 'Khách hàng', dataIndex: 'tenKhachHang', width: 160, ellipsis: true, render: renderEllipsisCell },
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
            title: 'Tổng tiền',
            dataIndex: 'tongTienSauThue',
            width: 140,
            ellipsis: true,
            render: (v: number) => renderEllipsisCell(`${formatMoney(v)} đ`),
          },
          ...createAuditColumns<BaoGia>({
            getCreatedAt: (row) => getCreatedAt(row),
            getUpdatedAt: (row) => getUpdatedAt(row),
          }),
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
