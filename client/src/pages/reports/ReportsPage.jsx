import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/axiosClient';
import { DollarSign, ShoppingBag, AlertTriangle, Building2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export const ReportsPage = () => {
  const { selectedBranch } = useAuth();
  const [dailyOverview, setDailyOverview] = useState(null);
  const [branchPerformance, setBranchPerformance] = useState(null);
  const [loading, setLoading] = useState(true);

  const branchId = selectedBranch ? selectedBranch._id || selectedBranch : null;

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const params = branchId ? { branchId } : {};

      const [dailyRes, perfRes] = await Promise.all([
        api.get('/reports/daily-overview', params),
        api.get('/reports/branch-performance', params),
      ]);

      if (dailyRes.success) setDailyOverview(dailyRes.data);
      if (perfRes.success) setBranchPerformance(perfRes.data);
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#8a8578' }}>
        Generating reports & analytics...
      </div>
    );
  }

  const topItemsData =
    branchPerformance?.topItems?.map((i) => ({
      name: i.itemName,
      Quantity: i.quantitySold,
      Revenue: i.totalRevenue,
    })) || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Reports & Business Analytics</h1>
          <p className="page-sub">
            Real-time performance overview for {selectedBranch ? selectedBranch.name : 'All Branches'}.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stat-cards">
        <div className="stat-card stat-red">
          <div>
            <div className="stat-value">₱{(dailyOverview?.todayRevenue || 0).toFixed(2)}</div>
            <div className="stat-label">TODAY'S REVENUE</div>
          </div>
          <DollarSign size={28} color="#cf1f21" style={{ marginLeft: 'auto' }} />
        </div>

        <div className="stat-card stat-blue">
          <div>
            <div className="stat-value">{dailyOverview?.todayOrders || 0}</div>
            <div className="stat-label">ORDERS TODAY</div>
          </div>
          <ShoppingBag size={28} color="#2f6fed" style={{ marginLeft: 'auto' }} />
        </div>

        <div className="stat-card stat-amber">
          <div>
            <div className="stat-value">{dailyOverview?.lowStockCount || 0}</div>
            <div className="stat-label">LOW STOCK ALERTS</div>
          </div>
          <AlertTriangle size={28} color="#d9a400" style={{ marginLeft: 'auto' }} />
        </div>

        <div className="stat-card stat-green">
          <div>
            <div className="stat-value">{dailyOverview?.activeBranchesCount || 0}</div>
            <div className="stat-label">ACTIVE BRANCHES</div>
          </div>
          <Building2 size={28} color="#1f9d5c" style={{ marginLeft: 'auto' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Top 10 Best Sellers Chart */}
        <div className="card">
          <h2 className="card-title">Top 10 Selling Menu Items</h2>
          {topItemsData.length === 0 ? (
            <p style={{ color: '#8a8578', textAlign: 'center', padding: '40px 0' }}>
              No completed orders yet to generate top selling chart.
            </p>
          ) : (
            <div style={{ width: '100%', height: 280, marginTop: '16px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topItemsData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip
                    formatter={(value, name) => [
                      name === 'Revenue' ? `₱${value.toFixed(2)}` : value,
                      name,
                    ]}
                  />
                  <Bar dataKey="Quantity" fill="#cf1f21" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Sales by Branch Breakdown */}
        <div className="card">
          <h2 className="card-title">Today's Sales by Branch</h2>
          {!dailyOverview?.salesByBranch || dailyOverview.salesByBranch.length === 0 ? (
            <p style={{ color: '#8a8578', textAlign: 'center', padding: '40px 0' }}>
              No sales logged across branches today.
            </p>
          ) : (
            <table className="data-table" style={{ marginTop: '12px' }}>
              <thead>
                <tr>
                  <th>Branch</th>
                  <th style={{ textAlign: 'center' }}>Orders</th>
                  <th style={{ textAlign: 'right' }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {dailyOverview.salesByBranch.map((b) => (
                  <tr key={b.branchId}>
                    <td style={{ fontWeight: 600 }}>{b.branchName}</td>
                    <td style={{ textAlign: 'center' }}>{b.orders}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#cf1f21' }}>
                      ₱{b.revenue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
