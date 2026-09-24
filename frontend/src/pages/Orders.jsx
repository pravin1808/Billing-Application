import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../api';
import {
  Plus,
  Pencil,
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
  const [orderTab, setOrderTab] = useState('active'); // 'active' | 'cancelled'

  const [productSearchResults, setProductSearchResults] = useState([]);
  const [debouncedProductSearch, setDebouncedProductSearch] = useState('');
  const [searchingProducts, setSearchingProducts] = useState(false);

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyOrder);
  const [saving, setSaving] = useState(false);
  const [printing, setPrinting] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingInvoiceId, setViewingInvoiceId] = useState(null);
  const navigate = useNavigate();

  // Edit order modal states
  const [editModal, setEditModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editTab, setEditTab] = useState('customer'); // 'customer' | 'products'
  const [customerEditForm, setCustomerEditForm] = useState({
    customerName: '',
    customerMobileNumber: '',
    gstInNumber: '',
    paymentMethod: 'CASH',
  });
  const [productsEditList, setProductsEditList] = useState([]);
  const [savingCustomerEdit, setSavingCustomerEdit] = useState(false);
  const [savingProductsEdit, setSavingProductsEdit] = useState(false);

  // Debounce search input so backend isn't bombarded on each keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(orderSearch.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [orderSearch]);

  // Debounce product search inside modals
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedProductSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Query backend search API for products whenever modal product search changes
  useEffect(() => {
    if (!modal && !editModal) return;
    if (!debouncedProductSearch) {
      setProductSearchResults([]);
      setSearchingProducts(false);
      return;
    }
    setSearchingProducts(true);
    api
      .getProductsPaged(0, 15, 'productId', 'asc', debouncedProductSearch)
      .then((res) => {
        if (res && res.content) {
          setProductSearchResults(res.content);
        } else if (Array.isArray(res)) {
          setProductSearchResults(res);
        } else {
          setProductSearchResults([]);
        }
      })
      .catch(() => toast.error('Failed to search products'))
      .finally(() => setSearchingProducts(false));
  }, [debouncedProductSearch, modal, editModal]);

  const load = (
    targetPage = page,
    targetSize = pageSize,
    targetSearch = debouncedSearch,
    targetTab = orderTab
  ) => {
    setLoadingOrders(true);
    const isCancelled = targetTab === 'cancelled';
    api
      .getOrdersPaged(targetPage, targetSize, 'orderId', 'desc', targetSearch, isCancelled)
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
  };

  useEffect(() => {
    load(page, pageSize, debouncedSearch, orderTab);
  }, [page, pageSize, debouncedSearch, orderTab]);

  const handleTabChange = (newTab) => {
    setOrderTab(newTab);
    setPage(0);
  };

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
    setDebouncedProductSearch('');
    setProductSearchResults([]);
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
      const pId = product.productId || product.product_id;
      const existingIndex = f.orderedProducts.findIndex(
        (item) =>
          !item.isExternal &&
          ((pId && item.productId === pId) ||
            (item.description === product.description && item.size === product.size))
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
        productId: pId || null,
        isExternal: false,
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

  const addExternalItem = () => {
    setForm((f) => ({
      ...f,
      orderedProducts: [
        ...f.orderedProducts,
        {
          productId: null,
          isExternal: true,
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
  const addCustomItem = addExternalItem;

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

    // Check for stock warning only for inventory items
    const overStock = form.orderedProducts.find(
      (p) => !p.isExternal && p.stock !== null && p.stock !== undefined && +p.quantitySell > p.stock
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
      const inventoryProducts = form.orderedProducts
        .filter((p) => !p.isExternal && p.productId)
        .map((p) => ({
          productId: +p.productId,
          description: p.description.trim(),
          size: p.size.trim(),
          gst: +p.gst,
          hsnNumber: +p.hsnNumber,
          gstPrice: +p.gstPrice,
          quantitySell: +p.quantitySell,
        }));

      const externalOrderedProducts = form.orderedProducts
        .filter((p) => p.isExternal || !p.productId)
        .map((p) => ({
          productId: null,
          description: p.description.trim(),
          size: p.size.trim(),
          gst: +p.gst,
          hsnNumber: +p.hsnNumber,
          gstPrice: +p.gstPrice,
          quantitySell: +p.quantitySell,
        }));

      const payload = {
        customerName: form.customerName.trim(),
        customerMobileNumber: +form.customerMobileNumber,
        gstInNumber: form.gstInNumber ? form.gstInNumber.trim() : null,
        paymentMethod: form.paymentMethod,
        orderedProducts: inventoryProducts,
        externalOrderedProducts: externalOrderedProducts,
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
      const msg = e?.message || 'Failed to place order';

      // Check if order and PDF were saved successfully before the printer failure
      if (msg.includes('was saved and PDF created') || msg.includes('sending to printer failed')) {
        toast.success('Order placed & invoice generated!');
        const errorDetail = msg.includes('sending to printer failed: ')
          ? msg.split('sending to printer failed: ')[1]
          : 'Printer offline';
        toast.error(`Printer alert: ${errorDetail}. You can print from the preview.`, { duration: 6000 });

        setModal(false);
        setForm(emptyOrder);
        if (page !== 0) {
          setPage(0);
        } else {
          load(0, pageSize, debouncedSearch);
        }

        // Open invoice viewer for the newly saved order
        const orderIdMatch = msg.match(/Order #(\d+)/);
        if (orderIdMatch) {
          setViewingInvoiceId(+orderIdMatch[1]);
        }
      } else {
        toast.error(msg);
      }
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
    if (!confirm('Cancel this order? Tyre stock will be restored to inventory.')) return;
    setDeleting(id);
    try {
      await api.cancelOrder(id);
      toast.success('Order cancelled & stock restored');
      if (orders.length === 1 && page > 0) {
        setPage(page - 1);
      } else {
        load(page, pageSize, debouncedSearch, orderTab);
      }
    } catch (e) {
      toast.error(e?.message || 'Cancel failed');
    } finally {
      setDeleting(null);
    }
  };

  const openEditOrderModal = (order) => {
    setEditingOrder(order);
    setEditTab('customer');
    setCustomerEditForm({
      customerName: order.customerName || '',
      customerMobileNumber: order.customerMobileNumber ? String(order.customerMobileNumber) : '',
      gstInNumber: order.gstInNumber || '',
      paymentMethod: order.paymentMethod || 'CASH',
    });
    setProductsEditList(
      (order.orderedProducts || []).map((p) => ({
        productId: p.productId || null,
        isExternal: !p.productId,
        description: p.description || '',
        size: p.size || '',
        gst: p.gst ?? 18,
        hsnNumber: p.hsnNumber ?? 4011,
        gstPrice: p.gstPrice ?? '',
        quantitySell: p.quantitySell ?? 1,
        stock: null,
      }))
    );
    setSearchQuery('');
    setDebouncedProductSearch('');
    setProductSearchResults([]);
    setEditModal(true);
  };

  const setCustomerEditField = (k, v) =>
    setCustomerEditForm((f) => ({ ...f, [k]: v }));

  const setProductsEditItem = (i, k, v) =>
    setProductsEditList((list) => {
      const updated = [...list];
      updated[i] = { ...updated[i], [k]: v };
      return updated;
    });

  const removeProductsEditItem = (i) =>
    setProductsEditList((list) => list.filter((_, idx) => idx !== i));

  const addProductToEditList = (product) => {
    setProductsEditList((list) => {
      const pId = product.productId || product.product_id;
      const existingIndex = list.findIndex(
        (item) =>
          !item.isExternal &&
          ((pId && item.productId === pId) ||
            (item.description === product.description && item.size === product.size))
      );
      if (existingIndex >= 0) {
        const updated = [...list];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantitySell: Number(updated[existingIndex].quantitySell) + 1,
        };
        toast.success(`Increased quantity for ${product.description}`);
        return updated;
      }
      const newItem = {
        productId: pId || null,
        isExternal: false,
        description: product.description,
        size: product.size,
        gst: product.gst,
        hsnNumber: product.hsnNumber,
        gstPrice: '',
        quantitySell: 1,
        stock: product.quantity,
      };
      toast.success(`Added "${product.description}" to order`);
      return [...list, newItem];
    });
  };

  const addExternalItemToEdit = () => {
    setProductsEditList((list) => [
      ...list,
      {
        productId: null,
        isExternal: true,
        description: '',
        size: '',
        gst: 18,
        hsnNumber: 4011,
        gstPrice: '',
        quantitySell: 1,
        stock: null,
      },
    ]);
  };
  const addCustomItemToEdit = addExternalItemToEdit;

  const editTotalAmount = productsEditList.reduce(
    (s, p) =>
      s + (parseFloat(p.gstPrice) || 0) * (parseInt(p.quantitySell) || 0),
    0
  );

  const submitCustomerEdit = async () => {
    if (!customerEditForm.customerName.trim()) {
      return toast.error('Customer name is required');
    }
    if (!customerEditForm.customerMobileNumber) {
      return toast.error('Mobile number is required');
    }
    const mob = Number(customerEditForm.customerMobileNumber);
    if (isNaN(mob) || mob < 1000000000 || mob > 9999999999) {
      return toast.error('Please enter a valid 10-digit mobile number');
    }

    setSavingCustomerEdit(true);
    try {
      const payload = {
        customerName: customerEditForm.customerName.trim(),
        customerMobileNumber: mob,
        gstInNumber: customerEditForm.gstInNumber ? customerEditForm.gstInNumber.trim() : '',
        paymentMethod: customerEditForm.paymentMethod,
      };
      const updated = await api.updateOrderCustomer(editingOrder.orderId, payload);
      toast.success('Customer details updated & invoice regenerated!');
      setEditModal(false);
      load(page, pageSize, debouncedSearch);
      if (updated?.orderId) {
        setViewingInvoiceId(updated.orderId);
      }
    } catch (e) {
      toast.error(e?.message || 'Failed to update customer details');
    } finally {
      setSavingCustomerEdit(false);
    }
  };

  const submitProductsEdit = async () => {
    if (productsEditList.length === 0) {
      return toast.error('Order must contain at least one product');
    }
    if (
      productsEditList.some(
        (p) => !p.description || !p.size || !p.gstPrice || p.gstPrice <= 0 || !p.quantitySell || p.quantitySell <= 0
      )
    ) {
      return toast.error('Please fill Rate and valid quantity for all products');
    }

    setSavingProductsEdit(true);
    try {
      const inventoryProducts = productsEditList
        .filter((p) => !p.isExternal && p.productId)
        .map((p) => ({
          productId: +p.productId,
          description: p.description.trim(),
          size: p.size.trim(),
          gst: +p.gst,
          hsnNumber: +p.hsnNumber,
          gstPrice: +p.gstPrice,
          quantitySell: +p.quantitySell,
        }));

      const externalOrderedProducts = productsEditList
        .filter((p) => p.isExternal || !p.productId)
        .map((p) => ({
          productId: null,
          description: p.description.trim(),
          size: p.size.trim(),
          gst: +p.gst,
          hsnNumber: +p.hsnNumber,
          gstPrice: +p.gstPrice,
          quantitySell: +p.quantitySell,
        }));

      const itemsPayload = {
        orderedProducts: inventoryProducts,
        externalOrderedProducts: externalOrderedProducts,
      };
      const updated = await api.updateOrderProducts(editingOrder.orderId, itemsPayload);
      toast.success('Order products & stock updated, invoice regenerated!');
      setEditModal(false);
      load(page, pageSize, debouncedSearch);
      if (updated?.orderId) {
        setViewingInvoiceId(updated.orderId);
      }
    } catch (e) {
      toast.error(e?.message || 'Failed to update order products');
    } finally {
      setSavingProductsEdit(false);
    }
  };

  const trimmedSearch = searchQuery.trim();

  return (
    <>
      <div className="card">
        <div className="section-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0 }}>Orders</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--surface-2)', padding: 3, borderRadius: 8 }}>
              <button
                type="button"
                style={{
                  background: orderTab === 'active' ? 'var(--accent)' : 'transparent',
                  color: orderTab === 'active' ? '#fff' : 'var(--muted)',
                  border: 'none',
                  padding: '5px 14px',
                  fontSize: 12.5,
                  fontWeight: orderTab === 'active' ? 600 : 500,
                  borderRadius: 6,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onClick={() => handleTabChange('active')}
              >
                Active
              </button>
              <button
                type="button"
                style={{
                  background: orderTab === 'cancelled' ? 'var(--danger)' : 'transparent',
                  color: orderTab === 'cancelled' ? '#fff' : 'var(--muted)',
                  border: 'none',
                  padding: '5px 14px',
                  fontSize: 12.5,
                  fontWeight: orderTab === 'cancelled' ? 600 : 500,
                  borderRadius: 6,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onClick={() => handleTabChange('cancelled')}
              >
                Cancelled
              </button>
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
                placeholder={orderTab === 'cancelled' ? "Search cancelled orders..." : "Search orders..."}
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
            {orderTab === 'active' && (
              <button className="btn btn-primary" onClick={openNewOrderModal}>
                <Plus size={16} /> New Order
              </button>
            )}
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
                <p>{orderTab === 'cancelled' ? 'No cancelled orders.' : 'No orders yet.'}</p>
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
                  <th>{orderTab === 'cancelled' ? 'Status' : 'Payment'}</th>
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
                      {o.isCancelled ? (
                        <span className="badge badge-red">CANCELLED</span>
                      ) : (
                        <span
                          className={`badge ${
                            o.paymentMethod === 'CASH' ? 'badge-green' : 'badge-blue'
                          }`}
                        >
                          {o.paymentMethod}
                        </span>
                      )}
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
                        {!o.isCancelled && (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => openEditOrderModal(o)}
                            title="Edit Order"
                          >
                            <Pencil size={13} />
                          </button>
                        )}
                        <button
                          className="btn btn-ghost btn-sm"
                          disabled={printing === o.orderId}
                          onClick={() => print(o.orderId)}
                          title="Print"
                        >
                          <Printer size={13} />
                        </button>
                        {!o.isCancelled && (
                          <button
                            className="btn btn-danger btn-sm"
                            disabled={deleting === o.orderId}
                            onClick={() => remove(o.orderId)}
                            title="Cancel Order"
                          >
                            <Trash2 size={13} />
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
                      {trimmedSearch && !searchingProducts && (
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                          Found {productSearchResults.length} {productSearchResults.length === 1 ? 'match' : 'matches'}
                        </span>
                      )}
                    </div>

                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="Search tyres by brand, size, or model (e.g., 195, CEAT, MRF)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            setDebouncedProductSearch(searchQuery.trim());
                          }
                        }}
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
                          onClick={() => {
                            setSearchQuery('');
                            setDebouncedProductSearch('');
                            setProductSearchResults([]);
                          }}
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
                    {searchingProducts ? (
                      <div className="search-hint" style={{ marginTop: 10 }}>
                        <div
                          className="spin"
                          style={{
                            display: 'inline-block',
                            width: 13,
                            height: 13,
                            border: '2px solid var(--accent)',
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                          }}
                        />
                        <span>Searching available tyres in inventory...</span>
                      </div>
                    ) : !trimmedSearch ? (
                      <div className="search-hint" style={{ marginTop: 10 }}>
                        <Search size={14} />
                        <span>Type any tyre brand or size above to search available stock</span>
                      </div>
                    ) : productSearchResults.length === 0 ? (
                      <div className="search-hint" style={{ marginTop: 10 }}>
                        <AlertCircle size={14} style={{ color: 'var(--accent)' }} />
                        <span>No tyres in stock matching "{searchQuery}"</span>
                      </div>
                    ) : (
                      <div className="search-results-list">
                        {productSearchResults.map((p) => {
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
                    <div className="order-items-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Package size={15} style={{ color: 'var(--accent)' }} />
                        <h3 style={{ margin: 0 }}>Ordered Items ({form.orderedProducts.length})</h3>
                      </div>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={addExternalItem}
                        title="Add external product (not in inventory, won't deduct stock)"
                      >
                        <Plus size={13} /> Add External Product
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

                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    fontSize: 11,
                                    marginTop: 4,
                                  }}
                                >
                                  {item.isExternal || !item.productId ? (
                                    <span
                                      className="badge badge-purple"
                                      style={{ fontSize: 10, padding: '1px 6px' }}
                                    >
                                      External Item (Stock not deducted)
                                    </span>
                                  ) : (
                                    <>
                                      <span
                                        className="badge badge-blue"
                                        style={{ fontSize: 10, padding: '1px 6px' }}
                                      >
                                        Inventory Tyre
                                      </span>
                                      {hasStock && (
                                        <>
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
                                        </>
                                      )}
                                    </>
                                  )}
                                </div>
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

      {/* ── EDIT ORDER MODAL ── */}
      {editModal && editingOrder && (
        <div className="modal-backdrop" onClick={() => setEditModal(false)}>
          <div
            className="modal"
            style={{ width: 1100, maxWidth: '96vw', maxHeight: '92vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="modal-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <h2>Edit Order #{editingOrder.orderId}</h2>
                  <span className="badge badge-blue" style={{ fontSize: 12 }}>
                    Invoice #{editingOrder.invoiceNumber}
                  </span>
                  <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                    Date: {editingOrder.orderDate}
                  </span>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditModal(false)}>
                  <X size={14} />
                </button>
              </div>

              {/* Sub-Tabs: Customer Details vs Products & Stock */}
              <div
                style={{
                  display: 'inline-flex',
                  background: 'var(--surface2)',
                  padding: 3,
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  alignSelf: 'flex-start',
                }}
              >
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{
                    background: editTab === 'customer' ? 'var(--accent)' : 'transparent',
                    color: editTab === 'customer' ? '#fff' : 'var(--muted)',
                    border: 'none',
                    padding: '6px 16px',
                    fontWeight: editTab === 'customer' ? 600 : 400,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    borderRadius: 6,
                    transition: 'all 0.15s ease',
                    cursor: 'pointer',
                  }}
                  onClick={() => setEditTab('customer')}
                >
                  <User size={14} /> Customer Details
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{
                    background: editTab === 'products' ? 'var(--accent)' : 'transparent',
                    color: editTab === 'products' ? '#fff' : 'var(--muted)',
                    border: 'none',
                    padding: '6px 16px',
                    fontWeight: editTab === 'products' ? 600 : 400,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    borderRadius: 6,
                    transition: 'all 0.15s ease',
                    cursor: 'pointer',
                  }}
                  onClick={() => setEditTab('products')}
                >
                  <Package size={14} /> Products & Stock ({productsEditList.length})
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="modal-body" style={{ padding: '18px 24px' }}>
              {editTab === 'customer' ? (
                /* ── TAB 1: CUSTOMER DETAILS ── */
                <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: 'var(--radius)',
                      background: 'rgba(59, 130, 246, 0.08)',
                      border: '1px solid rgba(59, 130, 246, 0.25)',
                      display: 'flex',
                      gap: 12,
                      alignItems: 'flex-start',
                      fontSize: 13,
                    }}
                  >
                    <AlertCircle size={18} style={{ color: '#3b82f6', flexShrink: 0, marginTop: 1 }} />
                    <span style={{ color: 'var(--text)', lineHeight: 1.5 }}>
                      <strong>Customer Metadata:</strong> Updates billing details and regenerates the invoice PDF directly without touching product inventory stock or line items.
                    </span>
                  </div>

                  <div className="form-group">
                    <label>Customer Name *</label>
                    <input
                      value={customerEditForm.customerName}
                      onChange={(e) => setCustomerEditField('customerName', e.target.value)}
                      placeholder="e.g. Ramesh Patel"
                      autoFocus
                    />
                  </div>

                  <div className="form-group">
                    <label>Mobile Number *</label>
                    <input
                      type="number"
                      value={customerEditForm.customerMobileNumber}
                      onChange={(e) => setCustomerEditField('customerMobileNumber', e.target.value)}
                      placeholder="10-digit number"
                    />
                  </div>

                  <div className="form-group">
                    <label>GSTIN (Optional)</label>
                    <input
                      value={customerEditForm.gstInNumber}
                      onChange={(e) => setCustomerEditField('gstInNumber', e.target.value)}
                      placeholder="27XXXXX..."
                    />
                  </div>

                  <div className="form-group">
                    <label>Payment Method</label>
                    <select
                      value={customerEditForm.paymentMethod}
                      onChange={(e) => setCustomerEditField('paymentMethod', e.target.value)}
                    >
                      <option value="CASH">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="CARD">Card</option>
                      <option value="CREDIT">Credit</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setEditModal(false)}
                      disabled={savingCustomerEdit}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={submitCustomerEdit}
                      disabled={savingCustomerEdit}
                      style={{ padding: '8px 20px' }}
                    >
                      {savingCustomerEdit ? 'Saving...' : 'Save Customer Details'}
                    </button>
                  </div>
                </div>
              ) : (
                /* ── TAB 2: PRODUCTS & STOCK ── */
                <div className="order-layout-grid">
                  {/* Left Column: Summary & Save */}
                  <div className="order-customer-panel">
                    <h3>
                      <Package size={15} style={{ color: 'var(--accent)' }} />
                      Order Items Summary
                    </h3>

                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius)',
                        background: 'rgba(234, 179, 8, 0.08)',
                        border: '1px solid rgba(234, 179, 8, 0.25)',
                        display: 'flex',
                        gap: 8,
                        alignItems: 'flex-start',
                        fontSize: 12,
                        marginBottom: 12,
                      }}
                    >
                      <AlertCircle size={16} style={{ color: '#eab308', flexShrink: 0, marginTop: 2 }} />
                      <span style={{ color: 'var(--text)', lineHeight: 1.4 }}>
                        Inventory tyres will restore previous stock and deduct updated quantities. External products are billed directly without altering inventory stock.
                      </span>
                    </div>

                    <div className="summary-card">
                      <div className="summary-row">
                        <span>Items in Order:</span>
                        <strong>{productsEditList.length}</strong>
                      </div>
                      <div className="summary-row total">
                        <span>Grand Total:</span>
                        <span>
                          ₹
                          {editTotalAmount.toLocaleString('en-IN', {
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={submitProductsEdit}
                        disabled={savingProductsEdit}
                        style={{ justifyContent: 'center', padding: '10px 16px', fontSize: 14 }}
                      >
                        {savingProductsEdit ? 'Updating Products…' : 'Save Products & Update Stock'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => setEditModal(false)}
                        disabled={savingProductsEdit}
                        style={{ justifyContent: 'center' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Search & Items list */}
                  <div className="order-products-panel">
                    {/* Tyre Search Box */}
                    <div className="order-search-box">
                      <div className="order-search-header">
                        <h3>
                          <Search size={15} style={{ color: 'var(--accent)' }} />
                          Add Tyres from Inventory
                        </h3>
                        {trimmedSearch && !searchingProducts && (
                          <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                            Found {productSearchResults.length} {productSearchResults.length === 1 ? 'match' : 'matches'}
                          </span>
                        )}
                      </div>

                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          placeholder="Search tyres to add by brand, size, or model..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              setDebouncedProductSearch(searchQuery.trim());
                            }
                          }}
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
                            onClick={() => {
                              setSearchQuery('');
                              setDebouncedProductSearch('');
                              setProductSearchResults([]);
                            }}
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
                            }}
                            title="Clear search"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      {/* Search Results */}
                      {searchingProducts ? (
                        <div style={{ padding: '16px', textAlign: 'center', fontSize: 12, color: 'var(--muted)' }}>
                          Searching tyres...
                        </div>
                      ) : trimmedSearch && productSearchResults.length === 0 ? (
                        <div
                          style={{
                            padding: '12px 14px',
                            background: 'rgba(234, 179, 8, 0.08)',
                            borderRadius: 6,
                            border: '1px solid rgba(234, 179, 8, 0.2)',
                            fontSize: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            color: 'var(--text)',
                          }}
                        >
                          <AlertCircle size={14} style={{ color: 'var(--accent)' }} />
                          <span>No tyres in stock matching "{searchQuery}"</span>
                        </div>
                      ) : (
                        <div className="search-results-list">
                          {productSearchResults.map((p) => {
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
                                    onClick={() => addProductToEditList(p)}
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
                      <div className="order-items-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Package size={15} style={{ color: 'var(--accent)' }} />
                          <h3 style={{ margin: 0 }}>Current Items in Order ({productsEditList.length})</h3>
                        </div>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={addExternalItemToEdit}
                          title="Add external product (not in inventory, won't deduct stock)"
                        >
                          <Plus size={13} /> Add External Product
                        </button>
                      </div>

                      {productsEditList.length === 0 ? (
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
                          No products left in order. Add at least one tyre.
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
                            {productsEditList.map((item, i) => (
                              <div
                                key={i}
                                style={{
                                  padding: '8px 10px',
                                  background: 'var(--surface)',
                                  borderRadius: 8,
                                  border: '1px solid var(--border)',
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
                                    onChange={(e) => setProductsEditItem(i, 'description', e.target.value)}
                                    placeholder="Tyre description"
                                    style={{ fontSize: 13 }}
                                  />

                                  <input
                                    value={item.size}
                                    onChange={(e) => setProductsEditItem(i, 'size', e.target.value)}
                                    placeholder="Size (e.g. 195/65)"
                                    style={{ fontSize: 13 }}
                                  />

                                  <select
                                    value={item.gst}
                                    onChange={(e) => setProductsEditItem(i, 'gst', e.target.value)}
                                    style={{ fontSize: 13 }}
                                  >
                                    <option value={12}>12%</option>
                                    <option value={18}>18%</option>
                                    <option value={28}>28%</option>
                                  </select>

                                  <input
                                    type="number"
                                    value={item.gstPrice}
                                    onChange={(e) => setProductsEditItem(i, 'gstPrice', e.target.value)}
                                    placeholder="₹ Price"
                                    style={{ fontSize: 13 }}
                                  />

                                  <input
                                    type="number"
                                    value={item.quantitySell}
                                    min={1}
                                    onChange={(e) =>
                                      setProductsEditItem(i, 'quantitySell', e.target.value)
                                    }
                                    style={{ fontSize: 13 }}
                                  />

                                  <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    onClick={() => removeProductsEditItem(i)}
                                    title="Remove item"
                                    style={{ padding: '6px' }}
                                  >
                                    <X size={13} />
                                  </button>
                                </div>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    fontSize: 11,
                                    marginTop: 4,
                                  }}
                                >
                                  {item.isExternal || !item.productId ? (
                                    <span
                                      className="badge badge-purple"
                                      style={{ fontSize: 10, padding: '1px 6px' }}
                                    >
                                      External Item (Stock not deducted)
                                    </span>
                                  ) : (
                                    <span
                                      className="badge badge-blue"
                                      style={{ fontSize: 10, padding: '1px 6px' }}
                                    >
                                      Inventory Tyre (Stock tracked)
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
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
