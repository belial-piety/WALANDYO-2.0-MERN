import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/axiosClient';
import { Plus, Edit2, Archive, Search } from 'lucide-react';
import Modal from '../../components/common/Modal';

export const MenuPage = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    newCategoryName: '',
    price: '',
    imageUrl: '',
    isAvailable: true,
  });
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [menuRes, catRes] = await Promise.all([
        api.get('/menu-items'),
        api.get('/categories'),
      ]);

      if (menuRes.success) setItems(menuRes.data);
      if (catRes.success) setCategories(catRes.data);
    } catch (err) {
      console.error('Error loading menu', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      categoryId: categories[0]?._id || '',
      newCategoryName: '',
      price: '',
      imageUrl: '',
      isAvailable: true,
    });
    setModalError('');
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      categoryId: item.category?._id || '',
      newCategoryName: '',
      price: item.price.toString(),
      imageUrl: item.imageUrl || '',
      isAvailable: item.isAvailable,
    });
    setModalError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) {
      setModalError('Please enter dish name and price.');
      return;
    }

    try {
      setSubmitting(true);
      setModalError('');

      const payload = {
        name: formData.name.trim(),
        price: Number(formData.price),
        imageUrl: formData.imageUrl.trim() || null,
        isAvailable: formData.isAvailable,
      };

      if (formData.newCategoryName.trim()) {
        payload.categoryName = formData.newCategoryName.trim();
      } else {
        payload.categoryId = formData.categoryId;
      }

      let res;
      if (editingItem) {
        res = await api.patch(`/menu-items/${editingItem._id}`, payload);
      } else {
        res = await api.post('/menu-items', payload);
      }

      if (res.success) {
        setShowModal(false);
        await loadData();
      }
    } catch (err) {
      setModalError(err.message || 'Failed to save menu item.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (id) => {
    if (!window.confirm('Are you sure you want to archive this menu item?')) return;
    try {
      await api.delete(`/menu-items/${id}`);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to archive item');
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesCat = !catFilter || (item.category && item.category._id === catFilter);
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Menu Items</h1>
          <p className="page-sub">Manage food, drinks, prices, and categories.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={16} /> Add Menu Item
        </button>
      </div>

      <div className="card" style={{ padding: '14px', display: 'flex', gap: '12px' }}>
        <div className="search-box" style={{ flex: 1, marginBottom: 0 }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search dish name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="field-select"
          style={{ width: '200px' }}
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
            Loading menu items...
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#8a8578' }}>
            No menu items found.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Price</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item._id}>
                  <td style={{ fontWeight: 600 }}>{item.name}</td>
                  <td>{item.category ? item.category.name : 'Uncategorized'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>
                    ₱{item.price.toFixed(2)}
                  </td>
                  <td>
                    <span className={`badge ${item.isAvailable ? 'badge-green' : 'badge-gray'}`}>
                      {item.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        onClick={() => handleOpenEdit(item)}
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        onClick={() => handleArchive(item._id)}
                      >
                        <Archive size={14} /> Archive
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Item Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
        >
          {modalError && <div className="alert alert-error">{modalError}</div>}

          <form onSubmit={handleSubmit}>
            <label className="field-label">Item Name *</label>
            <input
              type="text"
              className="field-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Tapsilog Special"
              required
            />

            <label className="field-label">Category *</label>
            <select
              className="field-select"
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>

            <label className="field-label">Or Create New Category</label>
            <input
              type="text"
              className="field-input"
              value={formData.newCategoryName}
              onChange={(e) => setFormData({ ...formData, newCategoryName: e.target.value })}
              placeholder="Type new category name..."
            />

            <label className="field-label">Price (₱) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="field-input"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="99.00"
              required
            />

            <label className="field-label">Image URL (Optional)</label>
            <input
              type="url"
              className="field-input"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://..."
            />

            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="isAvailable"
                checked={formData.isAvailable}
                onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
              />
              <label htmlFor="isAvailable" style={{ fontSize: '14px', fontWeight: 600 }}>
                Available for sale on POS
              </label>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : editingItem ? 'Update Item' : 'Create Item'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default MenuPage;
