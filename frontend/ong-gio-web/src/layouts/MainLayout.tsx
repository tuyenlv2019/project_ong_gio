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
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { Layout, Menu, Typography, Button, Space, Dropdown } from 'antd';
import { useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import ChangePasswordModal from '../components/ChangePasswordModal';
import { authService } from '../authService';
import './MainLayout.css';

const { Header, Sider, Content } = Layout;
const SIDER_WIDTH = 240;
const SIDER_COLLAPSED_WIDTH = 80;
const SIDEBAR_COLLAPSED_KEY = 'sidebarCollapsed';

function readSidebarCollapsed() {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

function writeSidebarCollapsed(collapsed: boolean) {
  try {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
  } catch {
    // Bỏ qua khi localStorage không khả dụng.
  }
}

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
  const sidebarPreferenceRef = useRef(readSidebarCollapsed());
  const [collapsed, setCollapsed] = useState(() => sidebarPreferenceRef.current);

  const updateCollapsed = (value: boolean, persist: boolean) => {
    setCollapsed(value);
    if (persist) {
      sidebarPreferenceRef.current = value;
      writeSidebarCollapsed(value);
    }
  };
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
    <Layout className="app-layout-root">
      <Sider
        breakpoint="lg"
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => updateCollapsed(value, true)}
        collapsedWidth={SIDER_COLLAPSED_WIDTH}
        trigger={null}
        theme="dark"
        className="brand-sider"
        width={SIDER_WIDTH}
        onBreakpoint={(broken) => {
          if (broken) {
            updateCollapsed(true, false);
          } else {
            updateCollapsed(sidebarPreferenceRef.current, false);
          }
        }}
      >
        <div className="brand-logo-wrap">
          <img src="/logo-cty.png" alt="THUAN PHONG M&E Co.Ltd" className="brand-logo" />
        </div>
        <Menu
          theme="dark"
          mode="inline"
          inlineCollapsed={collapsed}
          className="brand-sidebar-menu"
          selectedKeys={[location.pathname === '/' ? '/' : location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout className={`layout-with-sider${collapsed ? ' is-collapsed' : ''}`}>
        <Header className="brand-header">
          <div className="brand-header-left">
            <Button
              type="text"
              className="brand-sider-toggle"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => updateCollapsed(!collapsed, true)}
              aria-label={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
            />
            <Typography.Title level={4} className="brand-header-title">
              Hệ thống Báo giá & Quản lý Sản xuất Ống gió
            </Typography.Title>
          </div>
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
        <Content className="layout-content">
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
