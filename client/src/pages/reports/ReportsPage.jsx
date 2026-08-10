import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/axiosClient';
import {
  PhilippinePeso,
  ShoppingBag,
  ReceiptText,
  TrendingUp,
  AlertTriangle,
  PackageX,
  RefreshCw,
  BarChart3,
  Clock3,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';

const peso = (value) => `₱${Number(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (value) => `${Number(value || 0).toFixed(1)}%`;

const toDateInput = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const defaultRange = () => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 6);
  return { dateFrom: toDateInput(from), dateTo: toDateInput(to) };
};

const paymentLabel = (method) => ({ cash: 'Cash', gcash: 'GCash', card: 'Card' }[method] || method);

const hourLabel = (hour) => {
  const h = Number(hour);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const display = h % 12 || 12;
  return `${display}:00 ${suffix}`;
};

const ChangeText = ({ value, label = 'previous period' }) => {
  const n = Number(value || 0);
  return (
    <div style={{ fontSize: 11, marginTop: 4, color: n >= 0 ? '#1f9d5c' : '#cf1f21', fontWeight: 700 }}>
      {n >= 0 ? '+' : ''}{n.toFixed(1)}% vs {label}
    </div>
  );
};

export const ReportsPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [analytics, setAnalytics] = useState(null);
  const [branches, setBranches] = useState([]);
  const [reportBranchId, setReportBranchId] = useState('all');
  const [range, setRange] = useState(defaultRange);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    api.get('/branches')
      .then((res) => {
        if (res.success) setBranches(res.data.filter((b) => b.isActive));
      })
      .catch((err) => console.error('Failed to load branches for reports', err));
  }, [isAdmin]);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        dateFrom: range.dateFrom,
        dateTo: range.dateTo,
        ...(isAdmin ? { branchId: reportBranchId } : {}),
      };
      const res = await api.get('/reports/sales-analytics', params);
      if (res.success) setAnalytics(res.data);
    } catch (err) {
      console.error('Failed to load sales analytics', err);
      setError(err.message || 'Failed to generate sales analytics.');
    } finally {
      setLoading(false);
    }
  }, [range.dateFrom, range.dateTo, isAdmin, reportBranchId]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const applyPreset = (days) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - (days - 1));
    setRange({ dateFrom: toDateInput(from), dateTo: toDateInput(to) });
  };

  const trendData = useMemo(
    () => (analytics?.salesTrend || []).map((row) => ({ ...row, label: new Date(`${row.date}T00:00:00`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) })),
    [analytics]
  );

  const hourlyData = useMemo(
    () => (analytics?.hourlySales || []).map((row) => ({ ...row, label: hourLabel(row.hour) })),
    [analytics]
  );

  const paymentData = useMemo(
    () => (analytics?.paymentBreakdown || []).map((row) => ({ ...row, name: paymentLabel(row.paymentMethod), value: row.revenue })),
    [analytics]
  );

  const summary = analytics?.summary || {};
  const inventory = analytics?.inventory || {};
  const movements = analytics?.stockMovements || {};
  const scopeName = isAdmin
    ? reportBranchId === 'all'
      ? 'All Branches'
      : branches.find((b) => b._id === reportBranchId)?.name || 'Selected Branch'
    : user?.branch?.name || analytics?.scope?.branchName || 'Assigned Branch';

  if (loading && !analytics) {
    return <div style={{ padding: 60, textAlign: 'center', color: '#8a8578' }}>Generating sales reports & analytics...</div>;
  }

  return (
    <div>
      <div className="page-header" style={{ alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1>Sales Reports & Analytics</h1>
          <p className="page-sub">
            {isAdmin
              ? 'Owner view: compare company-wide and branch performance.'
              : `Manager view: operational analytics restricted to ${scopeName}.`}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={loadReports} disabled={loading}>
          <RefreshCw size={15} /> {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1.2fr 1fr 1fr auto' : '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
          {isAdmin && (
            <div>
              <label className="field-label">REPORT SCOPE</label>
              <select className="field-select" value={reportBranchId} onChange={(e) => setReportBranchId(e.target.value)}>
                <option value="all">All Branches</option>
                {branches.map((branch) => <option key={branch._id} value={branch._id}>{branch.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="field-label">FROM</label>
            <input className="field-input" type="date" value={range.dateFrom} max={range.dateTo} onChange={(e) => setRange((r) => ({ ...r, dateFrom: e.target.value }))} />
          </div>
          <div>
            <label className="field-label">TO</label>
            <input className="field-input" type="date" value={range.dateTo} min={range.dateFrom} onChange={(e) => setRange((r) => ({ ...r, dateTo: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost" onClick={() => applyPreset(1)}>Today</button>
            <button className="btn btn-ghost" onClick={() => applyPreset(7)}>7 Days</button>
            <button className="btn btn-ghost" onClick={() => applyPreset(30)}>30 Days</button>
          </div>
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: '#8a8578' }}>
          Scope: <strong>{scopeName}</strong>. {isAdmin ? 'Branch comparisons below remain company-wide for owner oversight.' : 'Branch scope is enforced by the server and cannot be changed by manager accounts.'}
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="stat-cards">
        <div className="stat-card stat-red">
          <div>
            <div className="stat-value">{peso(summary.revenue)}</div>
            <div className="stat-label">SALES REVENUE</div>
            <ChangeText value={summary.revenueChangePct} />
          </div>
          <PhilippinePeso size={28} color="#cf1f21" style={{ marginLeft: 'auto' }} />
        </div>
        <div className="stat-card stat-blue">
          <div>
            <div className="stat-value">{summary.orders || 0}</div>
            <div className="stat-label">COMPLETED ORDERS</div>
            <ChangeText value={summary.orderChangePct} />
          </div>
          <ShoppingBag size={28} color="#2f6fed" style={{ marginLeft: 'auto' }} />
        </div>
        <div className="stat-card stat-green">
          <div>
            <div className="stat-value">{peso(summary.avgOrderValue)}</div>
            <div className="stat-label">AVERAGE ORDER VALUE</div>
            <ChangeText value={summary.avgOrderChangePct} />
          </div>
          <TrendingUp size={28} color="#1f9d5c" style={{ marginLeft: 'auto' }} />
        </div>
        <div className="stat-card stat-amber">
          <div>
            <div className="stat-value">{summary.voidedOrders || 0}</div>
            <div className="stat-label">VOIDED ORDERS</div>
            <div style={{ fontSize: 11, marginTop: 4, color: '#8a8578', fontWeight: 700 }}>{pct(summary.voidRate)} void rate</div>
          </div>
          <ReceiptText size={28} color="#d9a400" style={{ marginLeft: 'auto' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 18, marginBottom: 18 }}>
        <div className="card">
          <h2 className="card-title">Sales Trend</h2>
          <p className="page-sub">Revenue and completed-order activity across the selected period.</p>
          <div style={{ width: '100%', height: 300, marginTop: 12 }}>
            {trendData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 8, right: 18, left: 8, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" fontSize={11} />
                  <YAxis fontSize={11} tickFormatter={(v) => `₱${Math.round(v / 1000)}k`} />
                  <Tooltip formatter={(value, name) => [name === 'Revenue' ? peso(value) : value, name]} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#cf1f21" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : <div style={{ padding: 60, textAlign: 'center', color: '#8a8578' }}>No completed sales in this period.</div>}
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">Payment Mix</h2>
          <p className="page-sub">How customers paid for completed orders.</p>
          <div style={{ width: '100%', height: 250, marginTop: 10 }}>
            {paymentData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentData} dataKey="value" nameKey="name" outerRadius={85} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {paymentData.map((entry, index) => <Cell key={`${entry.name}-${index}`} fill={['#cf1f21', '#2f6fed', '#d9a400'][index % 3]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => peso(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div style={{ padding: 60, textAlign: 'center', color: '#8a8578' }}>No payment data.</div>}
          </div>
          <table className="data-table">
            <tbody>
              {paymentData.map((row) => (
                <tr key={row.paymentMethod}>
                  <td>{row.name}</td><td>{row.orders} orders</td><td className="text-right" style={{ fontWeight: 700 }}>{peso(row.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
        <div className="card">
          <h2 className="card-title">Top Selling Menu Items</h2>
          <p className="page-sub">Ranked by quantity sold.</p>
          {(analytics?.topItems || []).length ? (
            <div style={{ width: '100%', height: 300, marginTop: 12 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.topItems} layout="vertical" margin={{ top: 5, right: 15, left: 45, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" fontSize={11} />
                  <YAxis type="category" dataKey="itemName" width={105} fontSize={11} />
                  <Tooltip formatter={(value, name) => [name === 'Revenue' ? peso(value) : value, name]} />
                  <Bar dataKey="quantitySold" name="Quantity Sold" fill="#cf1f21" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <div style={{ padding: 50, textAlign: 'center', color: '#8a8578' }}>No product sales data.</div>}
        </div>

        <div className="card">
          <h2 className="card-title">Slow-Moving Menu Items</h2>
          <p className="page-sub">Items with the lowest sales among products sold during this period.</p>
          <table className="data-table" style={{ marginTop: 10 }}>
            <thead><tr><th>Item</th><th className="text-right">Qty</th><th className="text-right">Revenue</th></tr></thead>
            <tbody>
              {(analytics?.bottomItems || []).map((item) => (
                <tr key={`${item.menuItemId}-${item.itemName}`}><td style={{ fontWeight: 600 }}>{item.itemName}</td><td className="text-right">{item.quantitySold}</td><td className="text-right">{peso(item.revenue)}</td></tr>
              ))}
              {!(analytics?.bottomItems || []).length && <tr><td colSpan="3" style={{ textAlign: 'center', color: '#8a8578', padding: 35 }}>No product sales data.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 18, marginBottom: 18 }}>
        <div className="card">
          <h2 className="card-title">Sales by Hour</h2>
          <p className="page-sub">Use this to identify peak service periods and staffing needs.</p>
          <div style={{ width: '100%', height: 280, marginTop: 12 }}>
            {hourlyData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData} margin={{ top: 5, right: 10, left: 0, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" angle={-35} textAnchor="end" interval={0} fontSize={10} />
                  <YAxis fontSize={11} />
                  <Tooltip formatter={(value, name) => [name === 'Revenue' ? peso(value) : value, name]} />
                  <Bar dataKey="orders" name="Orders" fill="#2f6fed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div style={{ padding: 50, textAlign: 'center', color: '#8a8578' }}>No hourly sales data.</div>}
          </div>
          {analytics?.peakHour && (
            <div className="alert" style={{ background: '#eef4ff', color: '#244b88', marginTop: 8 }}>
              <Clock3 size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              Peak revenue hour: <strong>{hourLabel(analytics.peakHour.hour)}</strong> — {peso(analytics.peakHour.revenue)} from {analytics.peakHour.orders} orders.
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="card-title">Sales by Category</h2>
          <p className="page-sub">Revenue contribution by menu category.</p>
          <table className="data-table" style={{ marginTop: 10 }}>
            <thead><tr><th>Category</th><th className="text-right">Qty</th><th className="text-right">Revenue</th></tr></thead>
            <tbody>
              {(analytics?.categoryPerformance || []).map((row) => (
                <tr key={row.category}><td style={{ fontWeight: 600 }}>{row.category}</td><td className="text-right">{row.quantitySold}</td><td className="text-right">{peso(row.revenue)}</td></tr>
              ))}
              {!(analytics?.categoryPerformance || []).length && <tr><td colSpan="3" style={{ textAlign: 'center', color: '#8a8578', padding: 35 }}>No category data.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <h2 className="card-title">Cashier Performance</h2>
        <p className="page-sub">Completed transactions handled during the selected period. This is an operational workload/sales view, not an employee rating.</p>
        <table className="data-table" style={{ marginTop: 10 }}>
          <thead><tr><th>Cashier</th><th className="text-right">Orders</th><th className="text-right">Avg. Order</th><th className="text-right">Sales Handled</th></tr></thead>
          <tbody>
            {(analytics?.cashierPerformance || []).map((row) => (
              <tr key={`${row.cashierId}-${row.cashierName}`}><td style={{ fontWeight: 600 }}>{row.cashierName}</td><td className="text-right">{row.orders}</td><td className="text-right">{peso(row.avgOrderValue)}</td><td className="text-right" style={{ fontWeight: 700 }}>{peso(row.revenue)}</td></tr>
            ))}
            {!(analytics?.cashierPerformance || []).length && <tr><td colSpan="4" style={{ textAlign: 'center', color: '#8a8578', padding: 35 }}>No cashier activity for this period.</td></tr>}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
        <div className="card">
          <h2 className="card-title">Inventory Health</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
            <div className="stat-card stat-amber" style={{ margin: 0 }}><div><div className="stat-value">{inventory.lowStock || 0}</div><div className="stat-label">LOW STOCK ITEMS</div></div><AlertTriangle size={24} color="#d9a400" style={{ marginLeft: 'auto' }} /></div>
            <div className="stat-card stat-red" style={{ margin: 0 }}><div><div className="stat-value">{inventory.outOfStock || 0}</div><div className="stat-label">OUT OF STOCK</div></div><PackageX size={24} color="#cf1f21" style={{ marginLeft: 'auto' }} /></div>
          </div>
          <div style={{ marginTop: 14, fontSize: 13, color: '#625d53' }}>Tracked items: <strong>{inventory.itemCount || 0}</strong> · Units currently on hand: <strong>{inventory.totalUnits || 0}</strong></div>
        </div>

        <div className="card">
          <h2 className="card-title">Stock Movement Summary</h2>
          <p className="page-sub">Inventory changes recorded during the selected period.</p>
          <table className="data-table" style={{ marginTop: 10 }}>
            <tbody>
              <tr><td>Consumed by sales</td><td className="text-right" style={{ fontWeight: 700 }}>−{movements.salesUnits || 0}</td></tr>
              <tr><td>Restocked</td><td className="text-right" style={{ fontWeight: 700 }}>+{movements.restockedUnits || 0}</td></tr>
              <tr><td>Manual deductions / spoilage</td><td className="text-right" style={{ fontWeight: 700, color: '#cf1f21' }}>−{movements.manualDeductions || 0}</td></tr>
              <tr><td>Manual additions</td><td className="text-right" style={{ fontWeight: 700 }}>+{movements.manualAdds || 0}</td></tr>
              <tr><td>Restored from voids</td><td className="text-right" style={{ fontWeight: 700 }}>+{movements.voidRestoredUnits || 0}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {isAdmin && (
        <div className="card" style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><BarChart3 size={20} color="#cf1f21" /><h2 className="card-title" style={{ margin: 0 }}>Company-Wide Branch Performance</h2></div>
          <p className="page-sub">Owner-only comparison across all branches for the selected date range.</p>
          <table className="data-table" style={{ marginTop: 10 }}>
            <thead><tr><th>Branch</th><th className="text-right">Orders</th><th className="text-right">Avg. Order</th><th className="text-right">Revenue</th><th className="text-right">Revenue Share</th></tr></thead>
            <tbody>
              {(analytics?.branchPerformance || []).map((row) => {
                const companyRevenue = (analytics?.branchPerformance || []).reduce((sum, b) => sum + Number(b.revenue || 0), 0);
                return (
                  <tr key={row.branchId}>
                    <td style={{ fontWeight: 700 }}>{row.branchName}</td>
                    <td className="text-right">{row.orders}</td>
                    <td className="text-right">{peso(row.avgOrderValue)}</td>
                    <td className="text-right" style={{ fontWeight: 700 }}>{peso(row.revenue)}</td>
                    <td className="text-right">{companyRevenue ? pct((row.revenue / companyRevenue) * 100) : '0.0%'}</td>
                  </tr>
                );
              })}
              {!(analytics?.branchPerformance || []).length && <tr><td colSpan="5" style={{ textAlign: 'center', color: '#8a8578', padding: 35 }}>No branch sales in this period.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ fontSize: 12, color: '#8a8578', paddingBottom: 10 }}>
        Profit and margin analytics are intentionally not shown because the current menu-item model records selling price but not product cost. Adding a cost field later will allow gross profit and margin reports to be calculated accurately.
      </div>
    </div>
  );
};

export default ReportsPage;
