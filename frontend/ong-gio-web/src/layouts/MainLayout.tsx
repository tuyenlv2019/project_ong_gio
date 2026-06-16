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
} from '@ant-design/icons';
import { Layout, Menu, Typography, Button, Space, Dropdown } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../authService';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/don-hang', icon: <FileTextOutlined />, label: 'Quản lý đơn hàng' },
  { key: '/nguyen-lieu', icon: <GoldOutlined />, label: 'Quản lý nguyên liệu' },
  { key: '/san-pham', icon: <AppstoreOutlined />, label: 'Quản lý sản phẩm' },
  { key: '/nguoi-dung', icon: <UserOutlined />, label: 'Quản lý user' },
];

/**
 * Layout ứng dụng sau khi đăng nhập.
 * @returns Khung giao diện chính của hệ thống.
 */
export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const userMenu = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth={0} theme="dark">
        <div style={{ padding: '16px 24px', color: '#fff', fontWeight: 700, fontSize: 16 }}>
          Ống Gió 2026
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname === '/' ? '/' : location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px', 
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            Hệ thống Báo giá & Quản lý Sản xuất Ống gió
          </Typography.Title>
          {user && (
            <Space>
              <span>Xin chào: <strong>{user.hoTen}</strong></span>
              <Dropdown menu={{ items: userMenu }} placement="bottomRight">
                <Button type="text" icon={<UserOutlined />} />
              </Dropdown>
            </Space>
          )}
        </Header>
        <Content style={{ margin: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
