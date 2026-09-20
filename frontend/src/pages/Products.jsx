import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../api';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';

const empty = { description: '', size: '', gst: 18, hsnNumber: 0, quantity: 0 };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = () => api.getProducts().then(setProducts).catch(() => toast.error('Failed to load products'));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(empty); setEditId(null); setModal('add'); };
  const openEdit = (p) => { setForm({ description: p.description, size: p.size, gst: p.gst, hsnNumber: p.hsnNumber, quantity: p.quantity }); setEditId(p.productId); setModal('edit'); };
  const close = () => setModal(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.description || !form.size) return toast.error('Description and Size are required');
    setSaving(true);
    try {
      if (modal === 'add') {
        await api.addProduct({ ...form, gst: +form.gst, hsnNumber: +form.hsnNumber, quantity: +form.quantity });
        toast.success('Product added');
      } else {
        await api.updateProduct(editId, { ...form, gst: +form.gst, hsnNumber: +form.hsnNumber, quantity: +form.quantity });
        toast.success('Product updated');
      }
      close(); load();
    } catch {
      toast.error('Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this product?')) return;
    setDeleting(id);
    try {
      await api.deleteProduct(id);
      toast.success('Product deleted');
      load();
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <>
      <div className="card">
        <div className="section-header">
          <h2>Product Inventory</h2>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Product</button>
        </div>
        <div className="table-wrap">
          {products.length === 0 ? (
            <div className="empty-state"><Package /><p>No products yet. Add your first product.</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Description</th>
                  <th>Size</th>
                  <th>GST %</th>
                  <th>HSN</th>
                  <th>Qty</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => (
                  <tr key={p.productId}>
                    <td style={{ color: 'var(--muted)' }}>{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>{p.description}</td>
                    <td>{p.size}</td>
                    <td><span className="badge badge-orange">{p.gst}%</span></td>
                    <td style={{ color: 'var(--muted)' }}>{p.hsnNumber || '—'}</td>
                    <td>
                      <span className={`badge ${p.quantity > 5 ? 'badge-green' : 'badge-orange'}`}>
                        {p.quantity}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}><Pencil size={13} /></button>
                        <button className="btn btn-danger btn-sm" disabled={deleting === p.productId} onClick={() => remove(p.productId)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <div className="modal-backdrop" onClick={close}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modal === 'add' ? 'Add Product' : 'Edit Product'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={close}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group full">
                  <label>Description</label>
                  <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="e.g. CEAT Milaze X3" />
                </div>
                <div className="form-group">
                  <label>Size</label>
                  <input value={form.size} onChange={e => set('size', e.target.value)} placeholder="e.g. 185/65 R15" />
                </div>
                <div className="form-group">
                  <label>GST %</label>
                  <select value={form.gst} onChange={e => set('gst', e.target.value)}>
                    <option value={18}>18%</option>
                    <option value={28}>28%</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>HSN Number</label>
                  <input type="number" value={form.hsnNumber} onChange={e => set('hsnNumber', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Quantity</label>
                  <input type="number" value={form.quantity} onChange={e => set('quantity', e.target.value)} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={close}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
