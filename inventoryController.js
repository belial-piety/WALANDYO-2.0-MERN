import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/axiosClient';
import { Plus, Edit2, Power } from 'lucide-react';
import Modal from '../../components/common/Modal';

export const BranchesPage = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'branch',
    address: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadBranches = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/branches');
      if (res.success) setBranches(res.data);
    } catch (err) {
      console.error('Failed to load branches', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  const handleOpenCreate = () => {
    setEditingBranch(null);
    setFormData({ name: '', type: 'branch', address: '' });
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      type: branch.type,
      address: branch.address || '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Branch name is required.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      let res;
      if (editingBranch) {
        res = await api.patch(`/branches/${editingBranch._id}`, formData);
      } else {
        res = await api.post('/branches', formData);
      }

      if (res.success) {
        setShowModal(false);
        await loadBranches();
      }
    } catch (err) {
      setError(err.message || 'Failed to save branch.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await api.patch(`/branches/${id}/status`);
      await loadBranches();
    } catch (err) {
      alert(err.message || 'Failed to toggle branch status.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Branch Management</h1>
          <p className="page-sub">Configure store locations and food truck units.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={16} /> Add Branch
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#8a8578' }}>
            Loading branch records...
          </div>
        ) : branches.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#8a8578' }}>
            No branches registered yet.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Branch Name</th>
                <th>Type</th>
                <th>Address</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((b) => (
                <tr key={b._id}>
                  <td style={{ fontWeight: 700 }}>{b.name}</td>
                  <td style={{ textTransform: 'capitalize' }}>
                    {b.type === 'food_truck' ? 'Food Truck' : 'Branch'}
                  </td>
                  <td>{b.address || '-'}</td>
                  <td>
                    <span className={`badge ${b.isActive ? 'badge-green' : 'badge-gray'}`}>
                      {b.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        onClick={() => handleOpenEdit(b)}
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button
                        className={`btn ${b.isActive ? 'btn-danger' : 'btn-secondary'}`}
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        onClick={() => handleToggleStatus(b._id)}
                      >
                        <Power size={14} /> {b.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Branch Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingBranch ? 'Edit Branch' : 'Add New Branch'}
        >
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <label className="field-label">Branch Name *</label>
            <input
              type="text"
              className="field-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Marikina (Main)"
              required
            />

            <label className="field-label">Type *</label>
            <select
              className="field-select"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="branch">Physical Branch</option>
              <option value="food_truck">Food Truck</option>
            </select>

            <label className="field-label">Address / Location Description</label>
            <input
              type="text"
              className="field-input"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. J.P. Rizal St., Marikina City"
            />

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : editingBranch ? 'Update Branch' : 'Create Branch'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default BranchesPage;
