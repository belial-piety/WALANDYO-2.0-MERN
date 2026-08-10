import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/axiosClient';
import { Building2, Bell } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';

export const Topbar = () => {
  const { user, selectedBranch, setSelectedBranch } = useAuth();
  const { unreadCount } = useNotifications();
  const [branches, setBranches] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const hideAdminBranchSelector = user?.role === 'admin' && location.pathname === '/orders';

  useEffect(() => {
    if (user && user.role === 'admin') {
      api.get('/branches').then((res) => {
        if (res.success) {
          setBranches(res.data.filter((b) => b.isActive));
          if (!selectedBranch && res.data.length > 0) {
            setSelectedBranch(res.data[0]);
          }
        }
      });
    }
  }, [user]);

  const handleBranchChange = (e) => {
    const bId = e.target.value;
    const found = branches.find((b) => b._id === bId);
    if (found) {
      setSelectedBranch(found);
    }
  };

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {!hideAdminBranchSelector && (
          <>
            <Building2 size={18} color="#8a8578" />
            {user?.role === 'admin' ? (
              <select
                className="field-select"
                style={{ padding: '6px 12px', fontSize: '13px', width: 'auto', fontWeight: 600 }}
                value={selectedBranch ? selectedBranch._id : ''}
                onChange={handleBranchChange}
              >
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name} ({b.type === 'food_truck' ? 'Food Truck' : 'Branch'})
                  </option>
                ))}
              </select>
            ) : (
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#2a2621' }}>
                {selectedBranch ? selectedBranch.name : 'Main Branch'}
              </span>
            )}
          </>
        )}
      </div>

      <div className="topbar-spacer" />

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {user?.role !== 'cashier' && (
          <button
            onClick={() => navigate('/notifications')}
            style={{
              background: 'none',
              border: 'none',
              position: 'relative',
              cursor: 'pointer',
              color: '#2a2621',
            }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#cf1f21',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  fontSize: '10px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>
        )}

        <div className="system-status">
          <span className="status-dot"></span>
          <span>System Online</span>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
