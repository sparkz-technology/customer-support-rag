import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu, Avatar, Dropdown, Typography } from 'antd';
import {
  DashboardOutlined,
  MessageOutlined,
  FileTextOutlined,
  UserOutlined,
  TeamOutlined,
  LogoutOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../../store/authStore';
import { authApi } from '../../../api/client';

const { Sider, Content } = AntLayout;
const { Text } = Typography;

export default function Layout({ variant }) {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  // Resolve the UI variant: prefer explicit prop, otherwise derive from user role.
  const resolvedVariant = variant || (user?.role ? String(user.role).toLowerCase() : 'user');

  // Debug: log resolved variant and user role to help diagnose incorrect label
  // (remove in production)
  // eslint-disable-next-line no-console
  console.log('Layout: resolvedVariant=', resolvedVariant, 'user.role=', user?.role);

  const handleLogout = () => {
    authApi.logout().catch(() => {});
    logout();
    navigate('/login');
  };

  const menuConfigs = {
    user: [
      { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
      { key: '/chat', icon: <MessageOutlined />, label: 'AI Chat' },
      { key: '/tickets', icon: <FileTextOutlined />, label: 'My Tickets' },
    ],
    agent: [
      { key: '/agent', icon: <DashboardOutlined />, label: 'Dashboard' },
      { key: '/agent/tickets', icon: <FileTextOutlined />, label: 'All Tickets' },
    ],
    admin: [
      { key: '/admin', icon: <DashboardOutlined />, label: 'Dashboard' },
      { key: '/admin/tickets', icon: <FileTextOutlined />, label: 'Tickets' },
      { key: '/admin/agents', icon: <TeamOutlined />, label: 'Agents' },
      { key: '/admin/users', icon: <UserOutlined />, label: 'Users' },
      { key: '/admin/audit-log', icon: <AuditOutlined />, label: 'Audit Log' },
    ],
  };

  const menuItems = menuConfigs[resolvedVariant] || menuConfigs.user;

  const variantLabels = {
    user: { label: 'User', color: '#22c55e' },
    agent: { label: 'Agent', color: '#3b82f6' },
    admin: { label: 'Admin', color: '#ef4444' },
  };

  const currentVariant = variantLabels[resolvedVariant];

  const userMenuItems = [
    { key: 'logout', label: 'Logout', icon: <LogoutOutlined />, danger: true, onClick: handleLogout },
  ];

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === '/dashboard' || path === '/agent' || path === '/admin') return path;
    if (path.startsWith('/agent/tickets')) return '/agent/tickets';
    if (path.startsWith('/admin/tickets')) return '/admin/tickets';
    if (path.startsWith('/admin/agents')) return '/admin/agents';
    if (path.startsWith('/admin/users')) return '/admin/users';
    if (path.startsWith('/admin/audit-log')) return '/admin/audit-log';
    if (path.startsWith('/tickets')) return '/tickets';
    if (path.startsWith('/chat')) return '/chat';
    return path;
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        width={200}
        style={{
          background: '#1a1a1a',
          borderRight: '1px solid #303030',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          height: '100vh',
          overflow: 'auto',
          zIndex: 100,
        }}
      >
        {/* Logo */}
        <div style={{ 
          padding: '12px', 
          borderBottom: '1px solid #303030',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <div style={{
            width: 28,
            height: 28,
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: 12,
          }}>
            S
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <Text strong style={{ fontSize: 13 }}>Support AI</Text>
            <div>
              <Text style={{ fontSize: 10, color: currentVariant.color, background: `${currentVariant.color}20`, padding: '1px 6px', borderRadius: 3 }}>
                {currentVariant.label}
              </Text>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <Menu
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          style={{ border: 'none', fontSize: 13, background: '#1a1a1a' }}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />

        {/* User section */}
        <div style={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0,
          padding: '8px',
          borderTop: '1px solid #303030',
          background: '#1a1a1a',
        }}>
          <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="topRight">
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8, 
              cursor: 'pointer',
              padding: '6px 8px',
              borderRadius: 6,
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#262626'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Avatar size={28} style={{ background: currentVariant.color, fontSize: 12 }} icon={<UserOutlined />} />
              <div style={{ flex: 1, minWidth: 0, lineHeight: 1.2 }}>
                <Text strong style={{ display: 'block', fontSize: 12 }} ellipsis>
                  {user?.name || user?.email?.split('@')[0]}
                </Text>
                <Text type="secondary" style={{ fontSize: 10 }}>{user?.email}</Text>
              </div>
            </div>
          </Dropdown>
        </div>
      </Sider>

      <Content style={{ marginLeft: 200, background: '#0f0f0f', height: '100vh', overflow: 'hidden' }}>
        <div style={{ height: '100%', overflow: 'auto' }}>
          <Outlet />
        </div>
      </Content>
    </AntLayout>
  );
}
