import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import {
  ShoppingBag,
  Receipt,
  UtensilsCrossed,
  Package,
  BarChart3,
  Building2,
  Users,
  Bell,
  LogOut,
} from 'lucide-react';

const ROLE_LABELS = {
  admin: 'Owner / Admin',
  manager: 'Branch Manager',
  cashier: 'Cashier',
  inventory: 'Inventory Clerk',
};

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  if (!user) return null;

  const role = user.role;

  const navItems = [
    {
      label: 'POS Counter',
      path: '/counter',
      icon: <ShoppingBag size={18} />,
      roles: ['admin', 'manager', 'cashier'],
    },
    {
      label: 'Orders',
      path: '/orders',
      icon: <Receipt size={18} />,
      roles: ['admin', 'manager', 'cashier'],
    },
    {
      label: 'Menu Items',
      path: '/menu',
      icon: <UtensilsCrossed size={18} />,
      roles: ['admin', 'manager'],
    },
    {
      label: 'Inventory',
      path: '/inventory',
      icon: <Package size={18} />,
      roles: ['admin', 'manager', 'inventory'],
    },
    {
      label: 'Reports',
      path: '/reports',
      icon: <BarChart3 size={18} />,
      roles: ['admin', 'manager'],
    },
    {
      label: 'Branches',
      path: '/branches',
      icon: <Building2 size={18} />,
      roles: ['admin'],
    },
    {
      label: 'Staff',
      path: '/staff',
      icon: <Users size={18} />,
      roles: ['admin'],
    },
    {
      label: 'Notifications',
      path: '/notifications',
      icon: <Bell size={18} />,
      badge: unreadCount,
      roles: ['admin', 'manager', 'inventory'],
    },
  ];

  const allowedNav = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-badge">W</div>
        <div>
          <div className="brand-name">WALANDYO</div>
          <div className="brand-sub">TAPSILOGAN POS</div>
        </div>
      </div>

      <nav className="nav">
        <div className="nav-label">MAIN MENU</div>
        {allowedNav.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
            <span>{item.label}</span>
            {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-chip">
          <div className="user-avatar">{user.fullName[0]}</div>
          <div style={{ overflow: 'hidden' }}>
            <div className="user-name" style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {user.fullName}
            </div>
            <div className="user-role">{ROLE_LABELS[role] || role}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={logout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <LogOut size={14} /> Log out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
