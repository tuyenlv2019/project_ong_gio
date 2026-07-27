/**
 * Trang danh sách báo giá, hỗ trợ sửa, xóa, đổi trạng thái và export.
 */
import { CopyOutlined, DeleteOutlined, DownloadOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Popconfirm, Select, Space, Table, Tooltip, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TableSearchBar from '../components/TableSearchBar';
import {
  TRANG_THAI_DON,
  deleteBaoGia,
  downloadBaoGiaExcel,
  formatMoney,
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
    row.tongSoSanPham,
    ...getAuditSearchText(row),
  );
}

export default function OrdersPage() {
  const [data, setData] = useState<BaoGia[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const reload = () => {
    setLoading(true);
    void getBaoGias()
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
  }, []);

  const filteredData = useMemo(
    () => filterBySearch(data, search, getOrderSearchText),
    [data, search],
  );

  const isCompleted = (trangThai?: string) => trangThai === 'HOAN_THANH';

  const onDelete = async (id: number) => {
    try {
      await deleteBaoGia(id);
      message.success('Đã xóa đơn hàng');
      reload();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg || 'Xóa thất bại');
    }
  };

  const onStatusChange = async (id: number, trangThai: string) => {
    await updateBaoGiaStatus(id, trangThai);
    message.success('Đã cập nhật trạng thái');
    reload();
  };

  const onExportExcel = async (row: BaoGia) => {
    try {
      await downloadBaoGiaExcel(row.id, row.maBaoGia);
      message.success('Đã tải file Excel');
    } catch {
      message.error('Không xuất được file Excel. Vui lòng thử lại.');
    }
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
        scroll={{ x: 1480 }}
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
            title: 'Tổng số dòng',
            dataIndex: 'tongSoSanPham',
            width: 90,
            align: 'center' as const,
            render: (v: number | undefined) => v ?? 0,
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
            width: 160,
            onHeaderCell: () => ({ style: { whiteSpace: 'nowrap' } }),
            render: (_, row) => {
              const completed = isCompleted(row.trangThai);
              return (
              <Space size={4} wrap={false}>
                <Tooltip title={completed ? 'Xem (đã hoàn thành)' : 'Sửa'}>
                  <Button
                    size="small"
                    icon={completed ? <EyeOutlined /> : <EditOutlined />}
                    onClick={() => navigate(`/don-hang/${row.id}`)}
                  />
                </Tooltip>
                <Tooltip title="Sao chép đơn">
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => navigate(`/don-hang/tao-moi?copyFrom=${row.id}`)}
                  />
                </Tooltip>
                <Tooltip title="Xuất Excel">
                  <Popconfirm
                    title="Xuất file Excel?"
                    description={
                      row.tenKhachHang?.trim()
                        ? `${row.maBaoGia} — ${row.tenKhachHang}`
                        : row.maBaoGia
                    }
                    okText="Xuất"
                    cancelText="Hủy"
                    onConfirm={() => onExportExcel(row)}
                  >
                    <Button size="small" icon={<DownloadOutlined />} />
                  </Popconfirm>
                </Tooltip>
                <Tooltip title={completed ? 'Đơn hoàn thành — không xóa được' : 'Xóa'}>
                  <Popconfirm
                    title="Xóa đơn hàng?"
                    onConfirm={() => onDelete(row.id)}
                    disabled={completed}
                  >
                    <Button size="small" danger icon={<DeleteOutlined />} disabled={completed} />
                  </Popconfirm>
                </Tooltip>
              </Space>
              );
            },
          },
        ]}
      />
    </Card>
  );
}
