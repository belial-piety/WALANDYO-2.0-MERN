import React, { useEffect } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { Bell, CheckCheck, AlertTriangle } from 'lucide-react';

export const NotificationsPage = () => {
  const { notifications, fetchNotifications, markAsRead, markAllAsRead } = useNotifications();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Stock Notifications & Alerts</h1>
          <p className="page-sub">Automated alerts for low-stock and out-of-stock inventory items.</p>
        </div>
        {notifications.some((n) => !n.isRead) && (
          <button className="btn btn-secondary" onClick={markAllAsRead}>
            <CheckCheck size={16} /> Mark All as Read
          </button>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#8a8578' }}>
            <Bell size={32} color="#8a8578" style={{ margin: '0 auto 8px' }} />
            <p>No inventory alerts at this time. All stock levels are healthy!</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Branch</th>
                <th>Alert Message</th>
                <th>Type</th>
                <th>Date & Time</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((n) => (
                <tr
                  key={n._id}
                  style={{
                    background: n.isRead ? 'transparent' : 'var(--amber-tint)',
                  }}
                >
                  <td style={{ fontWeight: 700 }}>{n.branch?.name}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertTriangle
                        size={16}
                        color={n.type === 'out_of_stock' ? '#cf1f21' : '#d9a400'}
                      />
                      <span>{n.message}</span>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        n.type === 'out_of_stock' ? 'badge-red' : 'badge-amber'
                      }`}
                    >
                      {n.type === 'out_of_stock' ? 'OUT OF STOCK' : 'LOW STOCK'}
                    </span>
                  </td>
                  <td>{new Date(n.createdAt).toLocaleString()}</td>
                  <td style={{ textAlign: 'center' }}>
                    {!n.isRead ? (
                      <button
                        className="btn btn-ghost"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        onClick={() => markAsRead(n._id)}
                      >
                        Mark Read
                      </button>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#8a8578' }}>Read</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
