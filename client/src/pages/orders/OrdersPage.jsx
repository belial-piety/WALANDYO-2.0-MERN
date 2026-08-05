import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/axiosClient';
import { Search, Eye, AlertOctagon, Printer } from 'lucide-react';
import Modal from '../../components/common/Modal';

export const OrdersPage = () => {
  const { user, selectedBranch } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  // Selected Order for Receipt Modal
  const [viewOrder, setViewOrder] = useState(null);

  // Void Order Modal
  const [voidModalOrder, setVoidModalOrder] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  const [voidError, setVoidError] = useState('');
  const [voidSubmitting, setVoidSubmitting] = useState(false);

  const branchId = selectedBranch ? selectedBranch._id || selectedBranch : null;

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        search,
        status: statusFilter,
        paymentMethod: paymentFilter,
      };
      if (branchId) params.branchId = branchId;

      const res = await api.get('/orders', params);
      if (res.success) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  }, [branchId, search, statusFilter, paymentFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

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
          <p className="page-sub">View, inspect, reprint receipts, or void completed orders.</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '14px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div className="search-box" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search Order # or Cashier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="field-select"
          style={{ width: 'auto' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="voided">Voided</option>
        </select>

        <select
          className="field-select"
          style={{ width: 'auto' }}
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
        >
          <option value="">All Payments</option>
          <option value="cash">Cash</option>
          <option value="gcash">GCash</option>
          <option value="card">Card</option>
        </select>
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
      </div>

      {/* View Receipt Modal */}
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
