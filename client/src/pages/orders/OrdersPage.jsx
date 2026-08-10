import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/axiosClient';
import { Search, Eye, AlertOctagon, Printer, RefreshCw, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '../../components/common/Modal';

export const OrdersPage = () => {
  const { user, selectedBranch } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 25;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [branches, setBranches] = useState([]);
  const [adminBranchFilter, setAdminBranchFilter] = useState('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [draftFilters, setDraftFilters] = useState({
    branchId: 'all',
    status: '',
    paymentMethod: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Selected Order for Receipt Modal
  const [viewOrder, setViewOrder] = useState(null);

  // Void Order Modal
  const [voidModalOrder, setVoidModalOrder] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  const [voidError, setVoidError] = useState('');
  const [voidSubmitting, setVoidSubmitting] = useState(false);

  const isAdmin = user?.role === 'admin';

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        search,
        status: statusFilter,
        paymentMethod: paymentFilter,
        dateFrom,
        dateTo,
        sortBy,
        sortOrder,
        page,
        limit: pageSize,
      };
      // Non-admin users are branch-locked by the backend. Admins default to all branches
      // and can optionally narrow Order History using the page-specific branch filter.
      if (isAdmin && adminBranchFilter !== 'all') {
        params.branchId = adminBranchFilter;
      }

      const res = await api.get('/orders', params);
      if (res.success) {
        setOrders(res.data);
        setTotalCount(res.meta?.totalCount || 0);
        setTotalPages(Math.max(res.meta?.totalPages || 1, 1));

        // If a filter change or deletion leaves us beyond the last page,
        // move back to the final valid page and reload.
        if ((res.meta?.totalPages || 0) > 0 && page > res.meta.totalPages) {
          setPage(res.meta.totalPages);
        }
      }
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, adminBranchFilter, search, statusFilter, paymentFilter, dateFrom, dateTo, sortBy, sortOrder, page]);

  useEffect(() => {
    if (!isAdmin) return;
    api.get('/branches').then((res) => {
      if (res.success) setBranches(res.data.filter((b) => b.isActive));
    }).catch((err) => console.error('Failed to load branches', err));
  }, [isAdmin]);

  useEffect(() => {
    loadOrders();

    const handleFocus = () => loadOrders();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') loadOrders();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadOrders]);

  const openFilterModal = () => {
    setDraftFilters({
      branchId: adminBranchFilter,
      status: statusFilter,
      paymentMethod: paymentFilter,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
    });
    setShowFilterModal(true);
  };

  const applyFilters = (e) => {
    e.preventDefault();
    setAdminBranchFilter(draftFilters.branchId || 'all');
    setStatusFilter(draftFilters.status);
    setPaymentFilter(draftFilters.paymentMethod);
    setDateFrom(draftFilters.dateFrom);
    setDateTo(draftFilters.dateTo);
    setSortBy(draftFilters.sortBy);
    setSortOrder(draftFilters.sortOrder);
    setPage(1);
    setShowFilterModal(false);
  };

  const clearFilters = () => {
    const cleared = {
      branchId: 'all',
      status: '',
      paymentMethod: '',
      dateFrom: '',
      dateTo: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };
    setDraftFilters(cleared);
    setAdminBranchFilter('all');
    setStatusFilter('');
    setPaymentFilter('');
    setDateFrom('');
    setDateTo('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setPage(1);
    setShowFilterModal(false);
  };

  const activeFilterCount = [
    isAdmin && adminBranchFilter !== 'all' ? adminBranchFilter : '',
    statusFilter,
    paymentFilter,
    dateFrom,
    dateTo,
    sortBy !== 'createdAt' || sortOrder !== 'desc' ? `${sortBy}-${sortOrder}` : '',
  ].filter(Boolean).length;

  const handleVoidOrder = async (e) => {
    e.preventDefault();
    if (!voidReason || !voidReason.trim()) {
      setVoidError('Please state a reason for voiding this order.');
      return;
    }

    try {
      setVoidSubmitting(true);
      setVoidError('');
      const res = await api.post(`/orders/${voidModalOrder._id}/void`, {
        voidReason: voidReason.trim(),
      });

      if (res.success) {
        setVoidModalOrder(null);
        setVoidReason('');
        await loadOrders();
      }
    } catch (err) {
      setVoidError(err.message || 'Failed to void order.');
    } finally {
      setVoidSubmitting(false);
    }
  };

  const firstItemIndex = totalCount === 0 ? 0 : ((page - 1) * pageSize) + 1;
  const lastItemIndex = totalCount === 0 ? 0 : Math.min(page * pageSize, totalCount);

  const handleReprint = async (orderId) => {
    try {
      await api.post(`/orders/${orderId}/reprint`);
      window.print();
    } catch (e) {
      //
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Order History</h1>
          <p className="page-sub">
            {isAdmin
              ? 'View orders across all branches, or filter to one branch.'
              : `Orders for ${selectedBranch?.name || user?.branch?.name || 'your assigned branch'}.`}
          </p>
        </div>
      </div>

      {/* Search + Filter Controls */}
      <div className="card" style={{ padding: '14px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div className="search-box" style={{ flex: 1, minWidth: '220px', marginBottom: 0 }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search Order # or Cashier..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <button type="button" className="btn btn-secondary" onClick={openFilterModal}>
          <SlidersHorizontal size={14} />
          Filter & Sort{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={loadOrders}
          disabled={loading}
          title="Refresh order history"
        >
          <RefreshCw size={14} /> {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Orders Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#8a8578' }}>
            Loading order history...
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#8a8578' }}>
            No orders found matching the filter criteria.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Date & Time</th>
                <th>Branch</th>
                <th>Cashier</th>
                <th>Payment</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id}>
                  <td style={{ fontWeight: 700 }}>{o.orderNumber}</td>
                  <td>{new Date(o.createdAt).toLocaleString()}</td>
                  <td>{o.branch?.name || 'Branch'}</td>
                  <td>{o.cashierNameSnap}</td>
                  <td style={{ textTransform: 'uppercase', fontSize: '12px', fontWeight: 600 }}>
                    {o.paymentMethod}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>
                    ₱{o.total.toFixed(2)}
                  </td>
                  <td>
                    <span className={`badge ${o.status === 'completed' ? 'badge-green' : 'badge-red'}`}>
                      {o.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        onClick={() => setViewOrder(o)}
                        title="View Receipt"
                      >
                        <Eye size={14} /> View
                      </button>

                      {o.status === 'completed' && (
                        <button
                          className="btn btn-danger"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                          onClick={() => {
                            setVoidModalOrder(o);
                            setVoidReason('');
                            setVoidError('');
                          }}
                          title="Void Order"
                        >
                          <AlertOctagon size={14} /> Void
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && totalCount > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              padding: '12px 14px',
              borderTop: '1px solid #eee8df',
              background: '#fff',
            }}
          >
            <span style={{ fontSize: '13px', color: '#6f6a61', minWidth: '120px', textAlign: 'right' }}>
              {firstItemIndex.toLocaleString()}–{lastItemIndex.toLocaleString()} of {totalCount.toLocaleString()}
            </span>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ padding: '6px 9px' }}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
              title="Previous page"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ padding: '6px 9px' }}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page >= totalPages}
              title="Next page"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* View Receipt Modal */}
      {/* Filter & Sort Modal */}
      {showFilterModal && (
        <Modal
          isOpen={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          title="Filter & Sort Orders"
          subtitle="Choose any combination of filters. Leave a field blank to include all values."
          boxStyle={{ width: '620px', maxWidth: '94vw' }}
        >
          <form onSubmit={applyFilters}>
            {isAdmin && (
              <>
                <label className="field-label">Branch</label>
                <select
                  className="field-select"
                  value={draftFilters.branchId}
                  onChange={(e) => setDraftFilters({ ...draftFilters, branchId: e.target.value })}
                >
                  <option value="all">All Branches</option>
                  {branches.map((branch) => (
                    <option key={branch._id} value={branch._id}>{branch.name}</option>
                  ))}
                </select>
              </>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="field-label">Payment Type</label>
                <select
                  className="field-select"
                  value={draftFilters.paymentMethod}
                  onChange={(e) => setDraftFilters({ ...draftFilters, paymentMethod: e.target.value })}
                >
                  <option value="">All Payments</option>
                  <option value="cash">Cash</option>
                  <option value="gcash">GCash</option>
                  <option value="card">Card</option>
                </select>
              </div>

              <div>
                <label className="field-label">Status</label>
                <select
                  className="field-select"
                  value={draftFilters.status}
                  onChange={(e) => setDraftFilters({ ...draftFilters, status: e.target.value })}
                >
                  <option value="">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="voided">Voided</option>
                </select>
              </div>
            </div>

            <label className="field-label">Time Frame</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <span className="field-hint">From</span>
                <input
                  type="datetime-local"
                  className="field-input"
                  style={{ width: '100%', minWidth: 0 }}
                  value={draftFilters.dateFrom}
                  onChange={(e) => setDraftFilters({ ...draftFilters, dateFrom: e.target.value })}
                />
              </div>
              <div>
                <span className="field-hint">To</span>
                <input
                  type="datetime-local"
                  className="field-input"
                  style={{ width: '100%', minWidth: 0 }}
                  value={draftFilters.dateTo}
                  min={draftFilters.dateFrom || undefined}
                  onChange={(e) => setDraftFilters({ ...draftFilters, dateTo: e.target.value })}
                />
              </div>
            </div>

            <label className="field-label">Sort By</label>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
              <select
                className="field-select"
                value={draftFilters.sortBy}
                onChange={(e) => setDraftFilters({ ...draftFilters, sortBy: e.target.value })}
              >
                <option value="createdAt">Date & Time</option>
                <option value="orderNumber">Order Number</option>
                <option value="cashier">Cashier Name (Alphabetical)</option>
                <option value="total">Total Amount</option>
                <option value="paymentMethod">Payment Type (Alphabetical)</option>
                <option value="status">Status (Alphabetical)</option>
              </select>
              <select
                className="field-select"
                value={draftFilters.sortOrder}
                onChange={(e) => setDraftFilters({ ...draftFilters, sortOrder: e.target.value })}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <button type="button" className="btn btn-ghost" onClick={clearFilters}>
                Clear Filters
              </button>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowFilterModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Apply Filters
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {viewOrder && (
        <Modal
          isOpen={Boolean(viewOrder)}
          onClose={() => setViewOrder(null)}
          title={`Receipt - ${viewOrder.orderNumber}`}
        >
          <div className="receipt" style={{ width: '100%', boxShadow: 'none', padding: 0 }}>
            <div className="receipt-header">
              <h1>WALANDYO TAPSILOGAN</h1>
              <p>{viewOrder.branch?.name}</p>
              <p style={{ fontSize: '11px', color: '#8a8578' }}>
                {new Date(viewOrder.createdAt).toLocaleString()}
              </p>
            </div>

            {viewOrder.status === 'voided' && (
              <div
                style={{
                  background: '#fdecec',
                  color: '#cf1f21',
                  padding: '8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  textAlign: 'center',
                  marginBottom: '12px',
                }}
              >
                VOIDED: {viewOrder.voidReason}
              </div>
            )}

            <table className="receipt-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th style={{ textAlign: 'center' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Price</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {viewOrder.items.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.itemName}</td>
                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right' }}>₱{item.unitPrice.toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>₱{item.lineTotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="receipt-totals">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span>Subtotal</span>
                <span>₱{viewOrder.subtotal.toFixed(2)}</span>
              </div>
              <div className="receipt-grand-total">
                <span>Total Amount ({viewOrder.paymentMethod.toUpperCase()})</span>
                <span>₱{viewOrder.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => handleReprint(viewOrder._id)}>
              <Printer size={14} /> Print Receipt
            </button>
            <button className="btn btn-ghost" onClick={() => setViewOrder(null)}>
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* Void Order Modal */}
      {voidModalOrder && (
        <Modal
          isOpen={Boolean(voidModalOrder)}
          onClose={() => setVoidModalOrder(null)}
          title={`Void Order ${voidModalOrder.orderNumber}`}
        >
          {voidError && <div className="alert alert-error">{voidError}</div>}

          <p style={{ fontSize: '14px', marginBottom: '12px' }}>
            Voiding this order will restore deducted stock back into inventory and record a permanent audit entry.
          </p>

          <form onSubmit={handleVoidOrder}>
            <label className="field-label">Reason for Voiding *</label>
            <textarea
              className="field-input"
              rows={3}
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="e.g. Customer cancelled, duplicate entry, wrong item ordered"
              required
            />

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setVoidModalOrder(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-danger"
                disabled={voidSubmitting}
              >
                {voidSubmitting ? 'Voiding...' : 'Confirm Void & Restore Stock'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default OrdersPage;
