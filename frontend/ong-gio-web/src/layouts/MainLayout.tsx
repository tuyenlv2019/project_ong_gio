/**
 * Layout chính sau đăng nhập: sidebar, header và vùng nội dung.
 */
import {
  DashboardOutlined,
  FileTextOutlined,
  GoldOutlined,
  AppstoreOutlined,
  UserOutlined,
  LogoutOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import { Layout, Menu, Typography, Button, Space, Dropdown } from 'antd';
import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import ChangePasswordModal from '../components/ChangePasswordModal';
import { authService } from '../authService';
import './MainLayout.css';

const { Header, Sider, Content } = Layout;

const allMenuItems = [
  { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/don-hang', icon: <FileTextOutlined />, label: 'Quản lý đơn hàng' },
  { key: '/nguyen-lieu', icon: <GoldOutlined />, label: 'Quản lý nguyên liệu' },
  { key: '/san-pham', icon: <AppstoreOutlined />, label: 'Quản lý sản phẩm' },
  { key: '/nguoi-dung', icon: <UserOutlined />, label: 'Quản lý user', adminOnly: true },
] as const;

/**
 * Layout ứng dụng sau khi đăng nhập.
 * @returns Khung giao diện chính của hệ thống.
 */
export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getUser();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const menuItems = allMenuItems
    .filter((item) => !('adminOnly' in item && item.adminOnly) || authService.isAdmin())
    .map(({ key, icon, label }) => ({ key, icon, label }));

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const userMenu = [
    {
      key: 'change-password',
      icon: <KeyOutlined />,
      label: 'Đổi mật khẩu',
      onClick: () => setChangePasswordOpen(true),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth={0} theme="dark" className="brand-sider" width={240}>
        <div className="brand-logo-wrap">
          <img src="/logo-cty.png" alt="THUAN PHONG M&E Co.Ltd" className="brand-logo" />
        </div>
        <Menu
          theme="dark"
          mode="inline"
          className="brand-sidebar-menu"
          selectedKeys={[location.pathname === '/' ? '/' : location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header className="brand-header">
          <Typography.Title level={4} className="brand-header-title">
            Hệ thống Báo giá & Quản lý Sản xuất Ống gió
          </Typography.Title>
          {user && (
            <Space className="brand-header-user">
              <span>
                Xin chào: <strong>{user.hoTen}</strong>
              </span>
              <Dropdown menu={{ items: userMenu }} placement="bottomRight" trigger={['click']}>
                <Button type="text" icon={<UserOutlined />} aria-label="Tài khoản" />
              </Dropdown>
            </Space>
          )}
        </Header>
        <Content style={{ margin: 24 }}>
          <Outlet />
        </Content>
      </Layout>
      <ChangePasswordModal
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        onSuccess={() => {
          authService.logout();
          navigate('/login');
        }}
      />
    </Layout>
  );
}
