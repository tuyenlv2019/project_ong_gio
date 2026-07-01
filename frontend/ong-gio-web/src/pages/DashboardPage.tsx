/**
 * Trang dashboard hiển thị thống kê tổng quan của hệ thống.
 */
import { Alert, Button, Card, Col, Row, Space, Statistic } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatMoney, getDashboardStats } from '../api';
import { authService } from '../authService';
import type { DashboardStats } from '../types';

type LoadState = 'loading' | 'ready' | 'error';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const navigate = useNavigate();

  const load = useCallback((silent = false) => {
    if (!silent) setLoadState('loading');
    return getDashboardStats()
      .then((data) => {
        setStats(data);
        setLoadState('ready');
      })
      .catch(() => {
        if (!silent) setLoadState('error');
      });
  }, []);

  useEffect(() => {
    void load();
    const onFocus = () => void load(true);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  if (loadState === 'loading' && !stats) {
    return <Card loading />;
  }

  if (loadState === 'error' && !stats) {
    return (
      <Alert
        type="error"
        showIcon
        message="Không tải được thống kê dashboard"
        description="Kiểm tra kết nối mạng hoặc thử lại sau."
        action={(
          <Button size="small" onClick={() => void load()}>
            Thử lại
          </Button>
        )}
      />
    );
  }

  if (!stats) return <Card loading />;

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={() => navigate('/don-hang/tao-moi')}>
          + Tạo đơn hàng
        </Button>
        <Button onClick={() => navigate('/nguyen-lieu', { state: { openCreate: true } })}>+ Thêm nguyên liệu</Button>
        <Button onClick={() => navigate('/san-pham', { state: { openCreate: true } })}>+ Thêm sản phẩm</Button>
        {authService.isAdmin() && (
          <Button onClick={() => navigate('/nguoi-dung', { state: { openCreate: true } })}>+ Thêm user</Button>
        )}
      </Space>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Tổng đơn hàng" value={stats.tongDonHang} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Chưa xử lý" value={stats.donHangChuaXuLy} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Đang xử lý" value={stats.donHangDangXuLy} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Hoàn thành" value={stats.donHangHoanThanh} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Doanh thu (hoàn thành)" value={formatMoney(stats.tongDoanhThu)} suffix="đ" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic title="Tổng tiền nguyên liệu" value={formatMoney(stats.tongTienNguyenLieu)} suffix="đ" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic title="Sản phẩm" value={stats.tongSanPham} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic title="Loại tôn / User" value={`${stats.tongLoaiTon} / ${stats.tongNguoiDung}`} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
