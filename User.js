import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../api/axiosClient';
import { UserPlus, Edit2, ShieldAlert, ArrowUpDown } from 'lucide-react';
import Modal from '../../components/common/Modal';

export const StaffPage = () => {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState('name-asc');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    password: '',
    role: 'cashier',
    branchId: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [uRes, bRes] = await Promise.all([
        api.get('/users'),
        api.get('/branches'),
      ]);

      if (uRes.success) setUsers(uRes.data);
      if (bRes.success) setBranches(bRes.data);
    } catch (err) {
      console.error('Failed to load staff data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const sortedUsers = useMemo(() => {
    const rows = [...users];
    const branchName = (u) => (u.role === 'admin' ? 'All Branches' : u.branch?.name || '');

    rows.sort((a, b) => {
      switch (sortOption) {
        case 'name-desc':
          return b.fullName.localeCompare(a.fullName, undefined, { sensitivity: 'base' });
        case 'username-asc':
          return a.username.localeCompare(b.username, undefined, { sensitivity: 'base' });
        case 'role-asc':
          return a.role.localeCompare(b.role, undefined, { sensitivity: 'base' }) || a.fullName.localeCompare(b.fullName);
        case 'branch-asc':
          return branchName(a).localeCompare(branchName(b), undefined, { sensitivity: 'base' }) || a.fullName.localeCompare(b.fullName);
        case 'status-active':
          return Number(b.isActive) - Number(a.isActive) || a.fullName.localeCompare(b.fullName);
        case 'status-inactive':
          return Number(a.isActive) - Number(b.isActive) || a.fullName.localeCompare(b.fullName);
        case 'name-asc':
        default:
          return a.fullName.localeCompare(b.fullName, undefined, { sensitivity: 'base' });
      }
    });

    return rows;
  }, [users, sortOption]);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      fullName: '',
      username: '',
      password: '',
      role: 'cashier',
      branchId: branches[0]?._id || '',
    });
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName,
      username: user.username,
      password: '',
      role: user.role,
      branchId: user.branch?._id || '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || (!editingUser && !formData.username.trim())) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      let res;
      if (editingUser) {
        res = await api.patch(`/users/${editingUser._id}`, formData);
      } else {
        res = await api.post('/users', formData);
      }

      if (res.success) {
        setShowModal(false);
        await loadData();
      }
    } catch (err) {
      setError(err.message || 'Failed to save staff account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await api.patch(`/users/${id}/status`);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to toggle account status');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Staff & User Management</h1>
          <p className="page-sub">Manage user roles, access permissions, and branch assignments.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <UserPlus size={16} /> Add Staff Member
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ArrowUpDown size={15} color="#8a8578" />
          <label className="field-label" style={{ margin: 0 }}>SORT</label>
          <select
            className="field-select"
            style={{ width: 'auto', minWidth: 190 }}
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="name-asc">Name — A to Z</option>
            <option value="name-desc">Name — Z to A</option>
            <option value="username-asc">Username — A to Z</option>
            <option value="role-asc">Role — A to Z</option>
            <option value="branch-asc">Branch — A to Z</option>
            <option value="status-active">Status — Active first</option>
            <option value="status-inactive">Status — Deactivated first</option>
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#8a8578' }}>
            Loading staff directory...
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#8a8578' }}>
            No staff accounts found.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Username</th>
                <th>Role</th>
                <th>Assigned Branch</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((u) => (
                <tr key={u._id}>
                  <td style={{ fontWeight: 700 }}>{u.fullName}</td>
                  <td><code>{u.username}</code></td>
                  <td style={{ textTransform: 'capitalize', fontWeight: 600 }}>{u.role}</td>
                  <td>{u.role === 'admin' ? 'All Branches (Global)' : u.branch?.name || '-'}</td>
                  <td>
                    <span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>
                      {u.isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        onClick={() => handleOpenEdit(u)}
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button
                        className={`btn ${u.isActive ? 'btn-danger' : 'btn-secondary'}`}
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        onClick={() => handleToggleStatus(u._id)}
                      >
                        <ShieldAlert size={14} /> {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Staff Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingUser ? 'Edit Staff Account' : 'Add Staff Account'}
        >
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <label className="field-label">Full Name *</label>
            <input
              type="text"
              className="field-input"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="e.g. Juan dela Cruz"
              required
            />

            {!editingUser && (
              <>
                <label className="field-label">Username *</label>
                <input
                  type="text"
                  className="field-input"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="e.g. juancashier"
                  required
                />
              </>
            )}

            <label className="field-label">
              {editingUser ? 'New Password (leave blank to keep current)' : 'Password *'}
            </label>
            <input
              type="password"
              className="field-input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required={!editingUser}
            />

            <label className="field-label">Role *</label>
            <select
              className="field-select"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="cashier">Cashier</option>
              <option value="manager">Branch Manager</option>
              <option value="inventory">Inventory Clerk</option>
              <option value="admin">Owner / Admin</option>
            </select>

            {formData.role !== 'admin' && (
              <>
                <label className="field-label">Assigned Branch *</label>
                <select
                  className="field-select"
                  value={formData.branchId}
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                >
                  {branches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </>
            )}

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : editingUser ? 'Update Account' : 'Create Account'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default StaffPage;
