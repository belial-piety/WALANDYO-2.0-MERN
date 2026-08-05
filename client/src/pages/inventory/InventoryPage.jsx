import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/axiosClient';
import { Search, PlusCircle, History, Settings2 } from 'lucide-react';
import Modal from '../../components/common/Modal';

export const InventoryPage = () => {
  const { selectedBranch } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [catFilter, setCatFilter] = useState('');

  // Restock Modal
  const [restockItem, setRestockItem] = useState(null);
  const [restockQty, setRestockQty] = useState('');
  const [restockNotes, setRestockNotes] = useState('');
  const [restockError, setRestockError] = useState('');
  const [restockSubmitting, setRestockSubmitting] = useState(false);

  // Min Level Modal
  const [minLevelItem, setMinLevelItem] = useState(null);
  const [newMinLevel, setNewMinLevel] = useState('');
  const [minLevelError, setMinLevelError] = useState('');

  // Movements Audit History Modal
  const [movementItem, setMovementItem] = useState(null);
  const [movements, setMovements] = useState([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  const branchId = selectedBranch ? selectedBranch._id || selectedBranch : null;

  const loadInventory = useCallback(async () => {
    if (!branchId) return;
    try {
      setLoading(true);
      const [invRes, catRes] = await Promise.all([
        api.get('/inventory', { branchId }),
        api.get('/categories'),
      ]);

      if (invRes.success) setInventory(invRes.data);
      if (catRes.success) setCategories(catRes.data);
    } catch (err) {
      console.error('Failed to load inventory', err);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const handleRestock = async (e) => {
    e.preventDefault();
    if (!restockQty || Number(restockQty) <= 0) {
      setRestockError('Please enter a valid positive quantity.');
      return;
    }

    try {
      setRestockSubmitting(true);
      setRestockError('');
      const res = await api.post(`/inventory/${restockItem._id}/restock`, {
        quantity: Number(restockQty),
        notes: restockNotes.trim(),
      });

      if (res.success) {
        setRestockItem(null);
        setRestockQty('');
        setRestockNotes('');
        await loadInventory();
      }
    } catch (err) {
      setRestockError(err.message || 'Restock failed.');
    } finally {
      setRestockSubmitting(false);
    }
  };

  const handleUpdateMinLevel = async (e) => {
    e.preventDefault();
    if (newMinLevel === '' || Number(newMinLevel) < 0) {
      setMinLevelError('Minimum level must be a non-negative number.');
      return;
    }

    try {
      setMinLevelError('');
      const res = await api.patch(`/inventory/${minLevelItem._id}/min-level`, {
        minLevel: Number(newMinLevel),
      });

      if (res.success) {
        setMinLevelItem(null);
        await loadInventory();
      }
    } catch (err) {
      setMinLevelError(err.message || 'Update failed.');
    }
  };

  const openMovements = async (item) => {
    setMovementItem(item);
    setLoadingMovements(true);
    try {
      const res = await api.get(`/inventory/${item._id}/movements`);
      if (res.success) {
        setMovements(res.data);
      }
    } catch (e) {
      //
    } finally {
      setLoadingMovements(false);
    }
  };

  const filteredInventory = inventory.filter((inv) => {
    if (!inv.menuItem) return false;
    const matchesSearch = inv.menuItem.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = !catFilter || (inv.menuItem.category && inv.menuItem.category._id === catFilter);
    const matchesStatus = !statusFilter || inv.status === statusFilter;
    return matchesSearch && matchesCat && matchesStatus;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Branch Inventory</h1>
          <p className="page-sub">Monitor stock levels, set alerts, and log stock movements.</p>
        </div>
      </div>

      <div className="card" style={{ padding: '14px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div className="search-box" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search stock item..."
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
          <option value="">All Stock Statuses</option>
          <option value="ok">OK (In Stock)</option>
          <option value="low">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>

        <select
          className="field-select"
          style={{ width: 'auto' }}
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#8a8578' }}>
            Loading inventory records...
          </div>
        ) : filteredInventory.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#8a8578' }}>
            No inventory items found.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Menu Item</th>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Current Stock</th>
                <th style={{ textAlign: 'right' }}>Min Alert Level</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((inv) => (
                <tr key={inv._id}>
                  <td style={{ fontWeight: 600 }}>{inv.menuItem?.name}</td>
                  <td>{inv.menuItem?.category?.name || 'Uncategorized'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '15px' }}>
                    {inv.currentStock} {inv.unit}
                  </td>
                  <td style={{ textAlign: 'right', color: '#8a8578' }}>
                    {inv.minLevel} {inv.unit}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        inv.status === 'ok'
                          ? 'badge-green'
                          : inv.status === 'low'
                          ? 'badge-amber'
                          : 'badge-red'
                      }`}
                    >
                      {inv.status === 'ok'
                        ? 'OK'
                        : inv.status === 'low'
                        ? 'LOW STOCK'
                        : 'OUT OF STOCK'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '4px 10px', fontSize: '12px' }}
                        onClick={() => {
                          setRestockItem(inv);
                          setRestockQty('');
                          setRestockNotes('');
                          setRestockError('');
                        }}
                      >
                        <PlusCircle size={14} /> Restock
                      </button>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        onClick={() => {
                          setMinLevelItem(inv);
                          setNewMinLevel(inv.minLevel.toString());
                          setMinLevelError('');
                        }}
                        title="Set Alert Level"
                      >
                        <Settings2 size={14} /> Alert
                      </button>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        onClick={() => openMovements(inv)}
                        title="View Movements History"
                      >
                        <History size={14} /> History
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Restock Modal */}
      {restockItem && (
        <Modal
          isOpen={Boolean(restockItem)}
          onClose={() => setRestockItem(null)}
          title={`Restock: ${restockItem.menuItem?.name}`}
        >
          {restockError && <div className="alert alert-error">{restockError}</div>}

          <form onSubmit={handleRestock}>
            <p style={{ fontSize: '13px', color: '#8a8578', marginBottom: '12px' }}>
              Current stock: <strong>{restockItem.currentStock} {restockItem.unit}</strong>
            </p>

            <label className="field-label">Quantity to Add *</label>
            <input
              type="number"
              min="1"
              className="field-input"
              value={restockQty}
              onChange={(e) => setRestockQty(e.target.value)}
              placeholder="e.g. 50"
              required
              autoFocus
            />

            <label className="field-label">Notes / Supplier (Optional)</label>
            <input
              type="text"
              className="field-input"
              value={restockNotes}
              onChange={(e) => setRestockNotes(e.target.value)}
              placeholder="e.g. Weekly delivery from main kitchen"
            />

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setRestockItem(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={restockSubmitting}
              >
                {restockSubmitting ? 'Saving...' : 'Add Stock'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Min Level Threshold Modal */}
      {minLevelItem && (
        <Modal
          isOpen={Boolean(minLevelItem)}
          onClose={() => setMinLevelItem(null)}
          title={`Set Min Alert Level: ${minLevelItem.menuItem?.name}`}
        >
          {minLevelError && <div className="alert alert-error">{minLevelError}</div>}

          <form onSubmit={handleUpdateMinLevel}>
            <label className="field-label">Minimum Stock Alert Threshold *</label>
            <input
              type="number"
              min="0"
              className="field-input"
              value={newMinLevel}
              onChange={(e) => setNewMinLevel(e.target.value)}
              placeholder="10"
              required
              autoFocus
            />

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setMinLevelItem(null)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Update Alert Level
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Movements Audit History Modal */}
      {movementItem && (
        <Modal
          isOpen={Boolean(movementItem)}
          onClose={() => setMovementItem(null)}
          title={`Movement History: ${movementItem.menuItem?.name}`}
        >
          {loadingMovements ? (
            <p style={{ textAlign: 'center', padding: '20px', color: '#8a8578' }}>
              Loading movement history...
            </p>
          ) : movements.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px', color: '#8a8578' }}>
              No stock movements logged yet.
            </p>
          ) : (
            <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
              <table className="data-table" style={{ fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th style={{ textAlign: 'right' }}>Change</th>
                    <th>By</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr key={m._id}>
                      <td style={{ fontSize: '11px' }}>
                        {new Date(m.createdAt).toLocaleString()}
                      </td>
                      <td style={{ textTransform: 'capitalize', fontWeight: 600 }}>{m.type}</td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: 700,
                          color: m.changeQty > 0 ? '#1f9d5c' : '#cf1f21',
                        }}
                      >
                        {m.changeQty > 0 ? `+${m.changeQty}` : m.changeQty}
                      </td>
                      <td>{m.createdBy?.fullName || 'System'}</td>
                      <td style={{ fontSize: '12px', color: '#8a8578' }}>{m.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setMovementItem(null)}>
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default InventoryPage;
