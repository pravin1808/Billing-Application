import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../api';
import {
  Plus,
  Trash2,
  FileText,
  Printer,
  ShoppingCart,
  X,
  Search,
  AlertCircle,
  Package,
  User,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import InvoiceModal from '../components/InvoiceModal';

const emptyOrder = {
  customerName: '',
  customerMobileNumber: '',
  gstInNumber: '',
  paymentMethod: 'CASH',
  orderedProducts: [],
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [inventory, setInventory] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyOrder);
  const [saving, setSaving] = useState(false);
  const [printing, setPrinting] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingInvoiceId, setViewingInvoiceId] = useState(null);
  const navigate = useNavigate();

  // Debounce search input so backend isn't bombarded on each keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(orderSearch.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [orderSearch]);

  const load = (targetPage = page, targetSize = pageSize, targetSearch = debouncedSearch) => {
    setLoadingOrders(true);
    api
      .getOrdersPaged(targetPage, targetSize, 'orderId', 'desc', targetSearch)
      .then((res) => {
        if (res && res.content) {
          setOrders(res.content);
          setPage(res.pageNumber);
          setTotalPages(res.totalPages || 1);
          setTotalElements(res.totalElements || 0);
        } else if (Array.isArray(res)) {
          setOrders([...res].reverse());
          setTotalElements(res.length);
        }
      })
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoadingOrders(false));

    api
      .getProducts()
      .then(setInventory)
      .catch(() => {});
  };

  useEffect(() => {
    load(page, pageSize, debouncedSearch);
  }, [page, pageSize, debouncedSearch]);

  const handleClearOrderSearch = () => {
    setOrderSearch('');
    setDebouncedSearch('');
    setPage(0);
  };

  const handleOrderSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setDebouncedSearch(orderSearch.trim());
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

  const openNewOrderModal = () => {
    setForm(emptyOrder);
    setSearchQuery('');
    // Refresh inventory so stock is always up to date
    api.getProducts().then(setInventory).catch(() => {});
    setModal(true);
  };

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const setItem = (i, k, v) =>
    setForm((f) => {
      const items = [...f.orderedProducts];
      items[i] = { ...items[i], [k]: v };
      return { ...f, orderedProducts: items };
    });

  const addProductFromSearch = (product) => {
    setForm((f) => {
      // Check if product is already in the list
      const existingIndex = f.orderedProducts.findIndex(
        (item) =>
          item.description === product.description && item.size === product.size
      );

      if (existingIndex >= 0) {
        // Increment quantity of existing item
        const updated = [...f.orderedProducts];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantitySell: Number(updated[existingIndex].quantitySell) + 1,
        };
        toast.success(`Increased quantity for ${product.description}`);
        return { ...f, orderedProducts: updated };
      }

      // Add as new item
      const newItem = {
        description: product.description,
        size: product.size,
        gst: product.gst,
        hsnNumber: product.hsnNumber,
        gstPrice: '',
        quantitySell: 1,
        stock: product.quantity,
      };
      toast.success(`Added "${product.description}" to order`);
      return { ...f, orderedProducts: [...f.orderedProducts, newItem] };
    });
  };

  const addCustomItem = () => {
    setForm((f) => ({
      ...f,
      orderedProducts: [
        ...f.orderedProducts,
        {
          description: '',
          size: '',
          gst: 18,
          hsnNumber: 4011,
          gstPrice: '',
          quantitySell: 1,
          stock: null,
        },
      ],
    }));
  };

  const removeItem = (i) =>
    setForm((f) => ({
      ...f,
      orderedProducts: f.orderedProducts.filter((_, idx) => idx !== i),
    }));

  const totalAmount = form.orderedProducts.reduce(
    (s, p) =>
      s + (parseFloat(p.gstPrice) || 0) * (parseInt(p.quantitySell) || 0),
    0
  );

  const submitOrder = async () => {
    if (!form.customerName.trim()) return toast.error('Customer name is required');
    if (!form.customerMobileNumber) return toast.error('Mobile number is required');
    if (form.orderedProducts.length === 0) {
      return toast.error('Please add at least one product to the order');
    }
    if (
      form.orderedProducts.some(
        (p) => !p.description || !p.size || !p.gstPrice || p.gstPrice <= 0
      )
    ) {
      return toast.error('Please fill Rate and details for all products');
    }

    // Check for stock warning
    const overStock = form.orderedProducts.find(
      (p) => p.stock !== null && p.stock !== undefined && +p.quantitySell > p.stock
    );
    if (overStock) {
      if (
        !confirm(
          `Notice: "${overStock.description}" quantity (${overStock.quantitySell}) exceeds current stock (${overStock.stock}). Do you want to proceed?`
        )
      ) {
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        customerMobileNumber: +form.customerMobileNumber,
        orderedProducts: form.orderedProducts.map((p) => ({
          ...p,
          gst: +p.gst,
          hsnNumber: +p.hsnNumber,
          gstPrice: +p.gstPrice,
          quantitySell: +p.quantitySell,
        })),
      };
      const createdOrder = await api.addOrder(payload);
      toast.success('Order placed & invoice generated!');
      setModal(false);
      setForm(emptyOrder);
      if (page !== 0) {
        setPage(0);
      } else {
        load(0, pageSize, debouncedSearch);
      }
      if (createdOrder?.orderId) {
        setViewingInvoiceId(createdOrder.orderId);
      }
    } catch (e) {
      toast.error(e?.message ?? 'Failed to place order');
    } finally {
      setSaving(false);
    }
  };

  const print = async (id) => {
    setPrinting(id);
    try {
      await api.printInvoice(id);
      toast.success('Sent to printer');
    } catch (e) {
      toast.error(e?.message || 'Print failed');
    } finally {
      setPrinting(null);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this order?')) return;
    setDeleting(id);
    try {
      await api.deleteOrder(id);
      toast.success('Order deleted');
      if (orders.length === 1 && page > 0) {
        setPage(page - 1);
      } else {
        load(page, pageSize, debouncedSearch);
      }
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  // Only show products if user entered some text
  const trimmedSearch = searchQuery.trim().toLowerCase();
  const searchResults = trimmedSearch
    ? inventory.filter((p) => {
        return (
          (p.description && p.description.toLowerCase().includes(trimmedSearch)) ||
          (p.size && p.size.toLowerCase().includes(trimmedSearch)) ||
          String(p.hsnNumber || '').includes(trimmedSearch)
        );
      })
    : [];

  return (
    <>
      <div className="card">
        <div className="section-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <h2>All Orders</h2>
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
                placeholder="Search orders..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                onKeyDown={handleOrderSearchKeyDown}
                style={{
                  padding: '7px 32px 7px 34px',
                  fontSize: 13,
                  width: '100%',
                }}
              />
              {orderSearch && (
                <button
                  type="button"
                  onClick={handleClearOrderSearch}
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
            <button className="btn btn-primary" onClick={openNewOrderModal}>
              <Plus size={16} /> New Order
            </button>
          </div>
        </div>
        <div className="table-wrap">
          {orders.length === 0 ? (
            <div className="empty-state">
              <ShoppingCart />
              {debouncedSearch ? (
                <>
                  <p>No orders found matching "{debouncedSearch}"</p>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={handleClearOrderSearch}
                    style={{ marginTop: 4 }}
                  >
                    Clear Search
                  </button>
                </>
              ) : (
                <p>No orders yet.</p>
              )}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Sr. No</th>
                  <th>Customer</th>
                  <th>Mobile</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o, index) => (
                  <tr key={o.orderId}>
                    <td>
                      <span >{page * pageSize + index + 1}</span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{o.customerName}</td>
                    <td style={{ color: 'var(--muted)' }}>{o.customerMobileNumber}</td>
                    <td style={{ color: 'var(--muted)', fontSize: 12 }}>{o.orderDate}</td>
                    <td style={{ fontWeight: 600 }}>
                      ₹{o.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          o.paymentMethod === 'CASH' ? 'badge-green' : 'badge-blue'
                        }`}
                      >
                        {o.paymentMethod}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setViewingInvoiceId(o.orderId)}
                          title="View Invoice"
                        >
                          <FileText size={13} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          disabled={printing === o.orderId}
                          onClick={() => print(o.orderId)}
                          title="Print"
                        >
                          <Printer size={13} />
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          disabled={deleting === o.orderId}
                          onClick={() => remove(o.orderId)}
                          title="Delete"
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
                Showing <strong>{totalElements === 0 ? 0 : page * pageSize + 1}</strong> to <strong>{Math.min((page + 1) * pageSize, totalElements)}</strong> of <strong>{totalElements}</strong> orders{debouncedSearch ? ` (filtered)` : ''}
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
                disabled={page === 0 || loadingOrders}
                onClick={() => handlePageChange(page - 1)}
              >
                <ChevronLeft size={14} /> Prev
              </button>

              {Array.from({ length: totalPages }, (_, idx) => {
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
                      disabled={loadingOrders}
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
                disabled={page >= totalPages - 1 || loadingOrders}
                onClick={() => handlePageChange(page + 1)}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(false)}>
          <div
            className="modal"
            style={{ width: 1100, maxWidth: '96vw', maxHeight: '92vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Create New Order</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(false)}>
                <X size={14} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '18px 24px' }}>
              <div className="order-layout-grid">
                {/* ── LEFT COLUMN: Customer Section & Summary ── */}
                <div className="order-customer-panel">
                  <h3>
                    <User size={15} style={{ color: 'var(--accent)' }} />
                    Customer Information
                  </h3>

                  <div className="form-group">
                    <label>Customer Name *</label>
                    <input
                      value={form.customerName}
                      onChange={(e) => setField('customerName', e.target.value)}
                      placeholder="e.g. Ramesh Patel"
                      autoFocus
                    />
                  </div>

                  <div className="form-group">
                    <label>Mobile Number *</label>
                    <input
                      type="number"
                      value={form.customerMobileNumber}
                      onChange={(e) => setField('customerMobileNumber', e.target.value)}
                      placeholder="10-digit number"
                    />
                  </div>

                  <div className="form-group">
                    <label>GSTIN (Optional)</label>
                    <input
                      value={form.gstInNumber}
                      onChange={(e) => setField('gstInNumber', e.target.value)}
                      placeholder="27XXXXX..."
                    />
                  </div>

                  <div className="form-group">
                    <label>Payment Method</label>
                    <select
                      value={form.paymentMethod}
                      onChange={(e) => setField('paymentMethod', e.target.value)}
                    >
                      <option value="CASH">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="CARD">Card</option>
                      <option value="CREDIT">Credit</option>
                    </select>
                  </div>

                  <div className="summary-card">
                    <div className="summary-row">
                      <span>Items Added:</span>
                      <strong>{form.orderedProducts.length}</strong>
                    </div>
                    <div className="summary-row total">
                      <span>Grand Total:</span>
                      <span>
                        ₹
                        {totalAmount.toLocaleString('en-IN', {
                          maximumFractionDigits: 2,
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                    <button
                      className="btn btn-primary"
                      onClick={submitOrder}
                      disabled={saving}
                      style={{ justifyContent: 'center', padding: '10px 16px', fontSize: 14 }}
                    >
                      {saving ? 'Placing Order…' : 'Place Order & Print'}
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => setModal(false)}
                      style={{ justifyContent: 'center' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                {/* ── RIGHT COLUMN: Search Product & Order Items ── */}
                <div className="order-products-panel">
                  {/* Search Section */}
                  <div className="order-search-box">
                    <div className="order-search-header">
                      <h3>
                        <Search size={15} style={{ color: 'var(--accent)' }} />
                        Search Available Tyres
                      </h3>
                      {trimmedSearch && (
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                          Found {searchResults.length} {searchResults.length === 1 ? 'match' : 'matches'}
                        </span>
                      )}
                    </div>

                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="Search tyres by brand, size, or model (e.g., 195, CEAT, MRF)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ padding: '8px 12px 8px 34px', fontSize: 13.5 }}
                      />
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
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          style={{
                            position: 'absolute',
                            right: 10,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: 'var(--muted)',
                            cursor: 'pointer',
                          }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {/* Don't show products when search query is empty */}
                    {!trimmedSearch ? (
                      <div className="search-hint" style={{ marginTop: 10 }}>
                        <Search size={14} />
                        <span>Type any tyre brand or size above to search available stock</span>
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="search-hint" style={{ marginTop: 10 }}>
                        <AlertCircle size={14} style={{ color: 'var(--accent)' }} />
                        <span>No tyres in stock matching "{searchQuery}"</span>
                      </div>
                    ) : (
                      <div className="search-results-list">
                        {searchResults.map((p) => {
                          const isLow = p.quantity <= 5;
                          const isOut = p.quantity <= 0;
                          return (
                            <div key={p.productId} className="search-result-card">
                              <div className="search-result-info">
                                <div className="search-result-name">{p.description}</div>
                                <div className="search-result-meta">
                                  <span>
                                    Size: <strong>{p.size}</strong>
                                  </span>
                                  <span>•</span>
                                  <span>GST: {p.gst}%</span>
                                  <span>•</span>
                                  <span>HSN: {p.hsnNumber}</span>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span
                                  className={`stock-pill ${
                                    isOut ? 'out-stock' : isLow ? 'low-stock' : 'in-stock'
                                  }`}
                                >
                                  {p.quantity > 0 ? `${p.quantity} in stock` : 'Out of stock'}
                                </span>
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => addProductFromSearch(p)}
                                  style={{ padding: '4px 10px', fontSize: 12 }}
                                >
                                  <Plus size={13} /> Add to Order
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Ordered Items Table */}
                  <div className="order-items-box">
                    <div className="order-items-header">
                      <h3>
                        <Package size={15} style={{ color: 'var(--accent)' }} />
                        Ordered Items ({form.orderedProducts.length})
                      </h3>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={addCustomItem}
                      >
                        <Plus size={13} /> Add Blank Row
                      </button>
                    </div>

                    {form.orderedProducts.length === 0 ? (
                      <div
                        style={{
                          padding: '30px 16px',
                          textAlign: 'center',
                          color: 'var(--muted)',
                          fontSize: 13,
                          border: '1px dashed var(--border)',
                          borderRadius: 8,
                        }}
                      >
                        <ShoppingCart
                          size={28}
                          style={{ margin: '0 auto 8px', opacity: 0.4, display: 'block' }}
                        />
                        No products added yet.
                        <div style={{ fontSize: 12, marginTop: 4 }}>
                          Search tyres above and click <strong>"+ Add to Order"</strong>.
                        </div>
                      </div>
                    ) : (
                      <>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '2.4fr 1.2fr 0.8fr 1.2fr 1fr 34px',
                            gap: 8,
                            marginBottom: 8,
                            padding: '0 6px',
                          }}
                        >
                          {['Description', 'Size', 'GST %', 'Rate (incl. GST)', 'Qty', ''].map(
                            (h) => (
                              <span
                                key={h}
                                style={{
                                  fontSize: 11,
                                  color: 'var(--muted)',
                                  fontWeight: 600,
                                  textTransform: 'uppercase',
                                  letterSpacing: '.04em',
                                }}
                              >
                                {h}
                              </span>
                            )
                          )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {form.orderedProducts.map((item, i) => {
                            const hasStock = item.stock !== null && item.stock !== undefined;
                            const isOver = hasStock && item.quantitySell > item.stock;

                            return (
                              <div
                                key={i}
                                style={{
                                  padding: '8px 10px',
                                  background: 'var(--surface)',
                                  borderRadius: 8,
                                  border: isOver
                                    ? '1px solid rgba(248,81,73,0.4)'
                                    : '1px solid var(--border)',
                                }}
                              >
                                <div
                                  style={{
                                    display: 'grid',
                                    gridTemplateColumns: '2.4fr 1.2fr 0.8fr 1.2fr 1fr 34px',
                                    gap: 8,
                                    alignItems: 'center',
                                  }}
                                >
                                  <input
                                    value={item.description}
                                    onChange={(e) => setItem(i, 'description', e.target.value)}
                                    placeholder="Tyre description"
                                    style={{ fontSize: 13 }}
                                  />

                                  <input
                                    value={item.size}
                                    onChange={(e) => setItem(i, 'size', e.target.value)}
                                    placeholder="Size (e.g. 195/65)"
                                    style={{ fontSize: 13 }}
                                  />

                                  <select
                                    value={item.gst}
                                    onChange={(e) => setItem(i, 'gst', e.target.value)}
                                    style={{ fontSize: 13 }}
                                  >
                                    <option value={12}>12%</option>
                                    <option value={18}>18%</option>
                                    <option value={28}>28%</option>
                                  </select>

                                  <input
                                    type="number"
                                    value={item.gstPrice}
                                    onChange={(e) => setItem(i, 'gstPrice', e.target.value)}
                                    placeholder="₹ Price"
                                    style={{ fontSize: 13 }}
                                    autoFocus={!item.gstPrice}
                                  />

                                  <input
                                    type="number"
                                    value={item.quantitySell}
                                    min={1}
                                    onChange={(e) =>
                                      setItem(i, 'quantitySell', e.target.value)
                                    }
                                    style={{ fontSize: 13 }}
                                  />

                                  <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    onClick={() => removeItem(i)}
                                    title="Remove item"
                                    style={{ padding: '6px' }}
                                  >
                                    <X size={13} />
                                  </button>
                                </div>

                                {hasStock && (
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 6,
                                      fontSize: 11,
                                      marginTop: 4,
                                    }}
                                  >
                                    <span
                                      className={`stock-pill ${
                                        item.stock <= 0
                                          ? 'out-stock'
                                          : item.stock <= 5
                                          ? 'low-stock'
                                          : 'in-stock'
                                      }`}
                                      style={{ fontSize: 10, padding: '1px 5px' }}
                                    >
                                      {item.stock > 0
                                        ? `${item.stock} in stock`
                                        : 'Out of stock'}
                                    </span>
                                    {isOver && (
                                      <span className="stock-warning">
                                        <AlertCircle size={12} />
                                        Requested ({item.quantitySell}) exceeds current stock ({item.stock})
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingInvoiceId && (
        <InvoiceModal
          orderId={viewingInvoiceId}
          onClose={() => setViewingInvoiceId(null)}
        />
      )}
    </>
  );
}
