import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../api';
import { Plus, Pencil, Trash2, Package, ChevronLeft, ChevronRight, Search, X, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

const empty = { description: '', size: '', gst: 18, hsnNumber: 0, quantity: 0 };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [gstRates, setGstRates] = useState([18, 28]);

  // Quick Stock Adjustment & Confirmation states for Edit Product
  const [originalStock, setOriginalStock] = useState(0);
  const [addStock, setAddStock] = useState('');
  const [reduceStock, setReduceStock] = useState('');
  const [showConfirmStep, setShowConfirmStep] = useState(false);

  useEffect(() => {
    api.getGstRates()
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          setGstRates(res.map((g) => g.gst).sort((a, b) => a - b));
        }
      })
      .catch(() => {});
  }, []);

  // Debounce search input so backend isn't bombarded on each keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(productSearch.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [productSearch]);

  const load = (targetPage = page, targetSize = pageSize, targetSearch = debouncedSearch) => {
    setLoading(true);
    api.getProductsPaged(targetPage, targetSize, 'productId', 'asc', targetSearch)
      .then((res) => {
        if (res && res.content) {
          setProducts(res.content);
          setPage(res.pageNumber);
          setTotalPages(res.totalPages || 1);
          setTotalElements(res.totalElements || 0);
        } else if (Array.isArray(res)) {
          setProducts(res);
          setTotalElements(res.length);
        }
      })
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(page, pageSize, debouncedSearch);
  }, [page, pageSize, debouncedSearch]);

  const handleClearSearch = () => {
    setProductSearch('');
    setDebouncedSearch('');
    setPage(0);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setDebouncedSearch(productSearch.trim());
      setPage(0);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
    }
  };

  const handleSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setPageSize(newSize);
    setPage(0);
  };

  const openAdd = () => {
    setForm(empty);
    setOriginalStock(0);
    setAddStock('');
    setReduceStock('');
    setShowConfirmStep(false);
    setEditId(null);
    setModal('add');
  };

  const openEdit = (p) => {
    const qty = Number(p.quantity) || 0;
    setForm({
      description: p.description,
      size: p.size,
      gst: p.gst,
      hsnNumber: p.hsnNumber,
      quantity: qty
    });
    setOriginalStock(qty);
    setAddStock('');
    setReduceStock('');
    setShowConfirmStep(false);
    setEditId(p.productId);
    setModal('edit');
  };

  const close = () => {
    setModal(null);
    setShowConfirmStep(false);
    setAddStock('');
    setReduceStock('');
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleStockAddChange = (e) => {
    const val = e.target.value;
    setAddStock(val);
    const addNum = val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0);
    const reduceNum = reduceStock === '' ? 0 : Math.max(0, parseInt(reduceStock, 10) || 0);
    const newQty = Math.max(0, originalStock + addNum - reduceNum);
    set('quantity', newQty);
  };

  const handleStockReduceChange = (e) => {
    const val = e.target.value;
    setReduceStock(val);
    const reduceNum = val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0);
    const addNum = addStock === '' ? 0 : Math.max(0, parseInt(addStock, 10) || 0);
    const newQty = Math.max(0, originalStock + addNum - reduceNum);
    set('quantity', newQty);
  };

  const handleDirectQuantityChange = (e) => {
    const val = e.target.value;
    set('quantity', val);
    setAddStock('');
    setReduceStock('');
  };

  const stockDiff = (Number(form.quantity) || 0) - originalStock;

  const handleInitiateSave = () => {
    if (!form.description.trim() || !form.size.trim()) {
      return toast.error('Description and Size are required');
    }
    if (form.quantity === '' || isNaN(form.quantity) || +form.quantity < 0) {
      return toast.error('Stock quantity must be a non-negative number');
    }

    if (modal === 'edit') {
      setShowConfirmStep(true);
    } else {
      executeSave();
    }
  };

  const executeSave = async () => {
    setSaving(true);
    try {
      if (modal === 'add') {
        await api.addProduct({
          ...form,
          description: form.description.trim(),
          size: form.size.trim(),
          gst: +form.gst,
          hsnNumber: +form.hsnNumber,
          quantity: +form.quantity
        });
        toast.success('Product added');
      } else {
        await api.updateProduct(editId, {
          ...form,
          description: form.description.trim(),
          size: form.size.trim(),
          gst: +form.gst,
          hsnNumber: +form.hsnNumber,
          quantity: +form.quantity
        });
        toast.success('Product updated');
      }
      close();
      load(page, pageSize, debouncedSearch);
    } catch (err) {
      toast.error(err?.message || 'Operation failed');
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
      // If deleting the last item on a page, step back
      if (products.length === 1 && page > 0) {
        setPage(page - 1);
      } else {
        load(page, pageSize, debouncedSearch);
      }
    } catch (err) {
      toast.error(err?.message || 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const startIndex = totalElements === 0 ? 0 : page * pageSize + 1;
  const endIndex = Math.min((page + 1) * pageSize, totalElements);

  return (
    <>
      <div className="card" style={{ paddingBottom: 0 }}>
        <div className="section-header" style={{ padding: '0 4px 16px', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2>Product Inventory</h2>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              Manage Tyre products, sizes, stock quantities and GST rates
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: 280, maxWidth: '100%' }}>
              <Search
                size={15}
                style={{
                  position: 'absolute',
                  left: 11,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--muted)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                style={{
                  padding: '7px 32px 7px 34px',
                  fontSize: 13,
                  width: '100%',
                }}
              />
              {productSearch && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button className="btn btn-primary" onClick={openAdd}>
              <Plus size={16} /> Add Product
            </button>
          </div>
        </div>

        <div className="table-wrap">
          {products.length === 0 && !loading ? (
            <div className="empty-state">
              <Package />
              {debouncedSearch ? (
                <>
                  <p>No products found matching "{debouncedSearch}"</p>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={handleClearSearch}
                    style={{ marginTop: 4 }}
                  >
                    Clear Search
                  </button>
                </>
              ) : (
                <p>No products yet. Add your first product.</p>
              )}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Sr.</th>
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
                    <td style={{ color: 'var(--muted)' }}>{page * pageSize + i + 1}</td>
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
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)} title="Edit product">
                          <Pencil size={13} />
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          disabled={deleting === p.productId}
                          onClick={() => remove(p.productId)}
                          title="Delete product"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Controls */}
        {totalElements > 0 && (
          <div className="pagination-wrap">
            <div className="pagination-left">
              <span>
                Showing <strong>{startIndex}</strong> to <strong>{endIndex}</strong> of <strong>{totalElements}</strong> products{debouncedSearch ? ' (filtered)' : ''}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>Rows:</span>
                <select className="pagination-size-select" value={pageSize} onChange={handleSizeChange}>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="pagination-controls">
              <button
                className="pagination-btn"
                disabled={page === 0 || loading}
                onClick={() => handlePageChange(page - 1)}
              >
                <ChevronLeft size={14} /> Prev
              </button>

              {Array.from({ length: totalPages }, (_, idx) => {
                // Show first, last, and window around current page
                if (
                  idx === 0 ||
                  idx === totalPages - 1 ||
                  (idx >= page - 1 && idx <= page + 1)
                ) {
                  return (
                    <button
                      key={idx}
                      className={`pagination-btn ${page === idx ? 'active' : ''}`}
                      onClick={() => handlePageChange(idx)}
                      disabled={loading}
                    >
                      {idx + 1}
                    </button>
                  );
                } else if (idx === page - 2 || idx === page + 2) {
                  return <span key={idx} style={{ color: 'var(--muted)', padding: '0 2px' }}>…</span>;
                }
                return null;
              })}

              <button
                className="pagination-btn"
                disabled={page >= totalPages - 1 || loading}
                onClick={() => handlePageChange(page + 1)}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-backdrop" onClick={close}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            {modal === 'edit' && showConfirmStep ? (
              <>
                <div className="modal-header">
                  <h2>Confirm Stock Update</h2>
                  <button className="btn btn-ghost btn-sm" onClick={close}>✕</button>
                </div>
                <div className="modal-body">
                  <div className="confirm-product-header">
                    <div className="confirm-product-title">{form.description}</div>
                    <div className="confirm-product-meta">
                      <span>Size: <strong>{form.size}</strong></span>
                      <span>•</span>
                      <span>HSN: <strong>{form.hsnNumber}</strong></span>
                      <span>•</span>
                      <span>GST: <strong>{form.gst}%</strong></span>
                    </div>
                  </div>

                  <div className="confirm-flow-card">
                    <div className="confirm-stat-col">
                      <span className="confirm-stat-label">Initial Stock</span>
                      <span className="confirm-stat-value">{originalStock} <small>units</small></span>
                    </div>

                    <div className="confirm-arrow-col">
                      <div className={`confirm-badge ${stockDiff > 0 ? 'increase' : stockDiff < 0 ? 'decrease' : 'neutral'}`}>
                        {stockDiff > 0 && <><TrendingUp size={14} /> +{stockDiff} Increased</>}
                        {stockDiff < 0 && <><TrendingDown size={14} /> {stockDiff} Decreased</>}
                        {stockDiff === 0 && <>Unchanged</>}
                      </div>
                      <ArrowRight size={20} className="confirm-flow-arrow" />
                    </div>

                    <div className="confirm-stat-col">
                      <span className="confirm-stat-label">Updated Stock</span>
                      <span className="confirm-stat-value updated">{form.quantity} <small>units</small></span>
                    </div>
                  </div>

                  <div className="confirm-note">
                    {stockDiff > 0 && (
                      <span>Stock will be <strong>increased by {stockDiff} units</strong> from <strong>{originalStock}</strong> to <strong>{form.quantity} units</strong>.</span>
                    )}
                    {stockDiff < 0 && (
                      <span>Stock will be <strong>reduced by {Math.abs(stockDiff)} units</strong> from <strong>{originalStock}</strong> to <strong>{form.quantity} units</strong>.</span>
                    )}
                    {stockDiff === 0 && (
                      <span>Stock quantity will remain unchanged at <strong>{originalStock} units</strong>.</span>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-ghost" onClick={() => setShowConfirmStep(false)} disabled={saving}>
                    Back
                  </button>
                  <button className="btn btn-primary" onClick={executeSave} disabled={saving || Number(form.quantity) < 0}>
                    {saving ? 'Updating…' : 'Proceed'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="modal-header">
                  <h2>{modal === 'add' ? 'Add Product' : 'Edit Product'}</h2>
                  <button className="btn btn-ghost btn-sm" onClick={close}>✕</button>
                </div>
                <div className="modal-body">
                  <div className="form-grid">
                    <div className="form-group full">
                      <label>Description</label>
                      <input
                        value={form.description}
                        onChange={e => set('description', e.target.value)}
                        placeholder="e.g. CEAT Milaze X3"
                      />
                    </div>
                    <div className="form-group">
                      <label>Size</label>
                      <input
                        value={form.size}
                        onChange={e => set('size', e.target.value)}
                        placeholder="e.g. 185/65 R15"
                      />
                    </div>
                    <div className="form-group">
                      <label>GST %</label>
                      <select value={form.gst} onChange={e => set('gst', Number(e.target.value))}>
                        {Array.from(new Set([...gstRates, Number(form.gst) || 18])).sort((a, b) => a - b).map(r => (
                          <option key={r} value={r}>{r}%</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>HSN Number</label>
                      <input
                        type="number"
                        value={form.hsnNumber}
                        onChange={e => set('hsnNumber', e.target.value)}
                      />
                    </div>

                    {modal === 'add' ? (
                      <div className="form-group">
                        <label>Quantity</label>
                        <input
                          type="number"
                          value={form.quantity}
                          onChange={e => set('quantity', e.target.value)}
                        />
                      </div>
                    ) : (
                      <div className="stock-adjust-box">
                        <div className="stock-adjust-header">
                          <span className="stock-adjust-title">
                            <Package size={15} /> Quick Stock Adjustment
                          </span>
                          <span className="stock-current-badge">
                            Current Stock: <strong>{originalStock} units</strong>
                          </span>
                        </div>

                        <div className="stock-adjust-grid">
                          <div className="form-group">
                            <label className="stock-label-add">
                              <Plus size={13} /> Add Stock (+)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={addStock}
                              onChange={handleStockAddChange}
                              placeholder="Enter units to add"
                              className="stock-input-add"
                            />
                          </div>
                          <div className="form-group">
                            <label className="stock-label-reduce">
                              <span style={{ fontSize: 14, fontWeight: 'bold' }}>−</span> Reduce Stock (−)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={reduceStock}
                              onChange={handleStockReduceChange}
                              placeholder="Enter units to reduce"
                              className="stock-input-reduce"
                            />
                          </div>
                        </div>

                        <div className={`stock-live-banner ${stockDiff > 0 ? 'increase' : stockDiff < 0 ? 'decrease' : 'neutral'}`}>
                          {stockDiff > 0 && (
                            <>
                              <TrendingUp size={15} />
                              <span>Stock will <strong>increase</strong> by <strong>+{stockDiff} units</strong>: {originalStock} → <strong>{form.quantity} units</strong></span>
                            </>
                          )}
                          {stockDiff < 0 && (
                            <>
                              <TrendingDown size={15} />
                              <span>Stock will <strong>decrease</strong> by <strong>{stockDiff} units</strong>: {originalStock} → <strong>{form.quantity} units</strong></span>
                            </>
                          )}
                          {stockDiff === 0 && (
                            <span>Stock quantity unchanged at <strong>{originalStock} units</strong></span>
                          )}
                        </div>

                        <div className="form-group" style={{ marginTop: 4 }}>
                          <label style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Final Quantity (Total Stock)</span>
                            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Direct edit also allowed</span>
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={form.quantity}
                            onChange={handleDirectQuantityChange}
                            style={{ fontWeight: 600 }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-ghost" onClick={close}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleInitiateSave} disabled={saving}>
                    {modal === 'edit' ? 'Review & Save' : 'Save'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
