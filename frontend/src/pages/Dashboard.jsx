import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Package, ShoppingCart, IndianRupee, TrendingUp, BarChart3, Layers } from 'lucide-react';
import DaySalesGraph from '../components/DaySalesGraph';
import MonthSalesGraph from '../components/MonthSalesGraph';

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  // 'sales' is ON THE LEFT and is DEFAULT
  const [activeMode, setActiveMode] = useState('sales'); // 'sales' | 'orders-products'
  const [orderProductTab, setOrderProductTab] = useState('orders'); // 'orders' | 'products'
  const navigate = useNavigate();

  useEffect(() => {
    api.getOrders().then(setOrders).catch(() => {});
    api.getProducts().then(setProducts).catch(() => {});
  }, []);

  const activeOrders = orders.filter(o => !o.isCancelled);
  const cancelledOrders = orders.filter(o => o.isCancelled);
  const totalRevenue = activeOrders.reduce((s, o) => s + o.totalAmount, 0);
  const avgOrderValue = activeOrders.length ? Math.round(totalRevenue / activeOrders.length) : 0;
  const recentOrders = [...orders].reverse().slice(0, 10);
  const allProducts = [...products];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Primary Dashboard Mode Switcher */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        padding: '10px 16px',
        background: 'var(--surface)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)'
      }}>
        <div style={{
          display: 'inline-flex',
          background: 'var(--surface2)',
          padding: 3,
          borderRadius: 8,
          border: '1px solid var(--border)'
        }}>
          {/* Left: Sales Dashboard (DEFAULT) */}
          <button
            className="btn btn-sm"
            style={{
              background: activeMode === 'sales' ? 'var(--accent)' : 'transparent',
              color: activeMode === 'sales' ? '#fff' : 'var(--muted)',
              border: 'none',
              padding: '8px 18px',
              fontWeight: activeMode === 'sales' ? 600 : 400,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              borderRadius: 6,
              transition: 'all 0.15s ease'
            }}
            onClick={() => setActiveMode('sales')}
          >
            <TrendingUp size={16} />
            Sales Dashboard
          </button>

          {/* Right: Orders & Products Dashboard */}
          <button
            className="btn btn-sm"
            style={{
              background: activeMode === 'orders-products' ? 'var(--accent)' : 'transparent',
              color: activeMode === 'orders-products' ? '#fff' : 'var(--muted)',
              border: 'none',
              padding: '8px 18px',
              fontWeight: activeMode === 'orders-products' ? 600 : 400,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              borderRadius: 6,
              transition: 'all 0.15s ease'
            }}
            onClick={() => setActiveMode('orders-products')}
          >
            <Package size={16} />
            Orders & Products Dashboard
          </button>
        </div>

        <div style={{ fontSize: 13, color: 'var(--muted)' }}>
          {activeMode === 'sales'
            ? 'Showing day-wise and month-wise sales analytics'
            : 'Showing tyre inventory, orders, and shop stats'}
        </div>
      </div>

      {/* ─────────────────── PART 1: SALES DASHBOARD (DEFAULT) ─────────────────── */}
      {activeMode === 'sales' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
          gap: 20
        }}>
          {/* Left Side: Day-wise Sales Graph (Last 7 Days with Date Selector) */}
          <DaySalesGraph />

          {/* Right Side: Month-wise Sales Graph (Last 12 Months with Month & Year Selectors) */}
          <MonthSalesGraph />
        </div>
      )}

      {/* ─────────────────── PART 2: ORDERS & PRODUCTS DASHBOARD ─────────────────── */}
      {activeMode === 'orders-products' && (
        <>
          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon orange"><IndianRupee size={20} /></div>
              <div>
                <div className="stat-value">₹{totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                <div className="stat-label">Total Revenue</div>
              </div>
            </div>

            <div
              className="stat-card"
              onClick={() => setOrderProductTab('orders')}
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                borderColor: orderProductTab === 'orders' ? 'var(--accent)' : 'var(--border)',
                background: orderProductTab === 'orders' ? 'rgba(249,115,22,0.08)' : 'var(--surface)',
                boxShadow: orderProductTab === 'orders' ? '0 0 12px rgba(249,115,22,0.18)' : 'none',
              }}
              title="Click to view recent orders"
            >
              <div className="stat-icon blue"><ShoppingCart size={20} /></div>
              <div>
                <div className="stat-value">{activeOrders.length}</div>
                <div className="stat-label">
                  Active Orders {cancelledOrders.length > 0 && <span style={{ color: 'var(--muted)', fontSize: 11 }}>({cancelledOrders.length} cancelled)</span>}
                </div>
              </div>
            </div>

            <div
              className="stat-card"
              onClick={() => setOrderProductTab('products')}
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                borderColor: orderProductTab === 'products' ? 'var(--accent)' : 'var(--border)',
                background: orderProductTab === 'products' ? 'rgba(249,115,22,0.08)' : 'var(--surface)',
                boxShadow: orderProductTab === 'products' ? '0 0 12px rgba(249,115,22,0.18)' : 'none',
              }}
              title="Click to view all products"
            >
              <div className="stat-icon green"><Package size={20} /></div>
              <div>
                <div className="stat-value">{products.length}</div>
                <div className="stat-label">
                  Products {orderProductTab === 'products' && <span style={{ color: 'var(--accent)', fontSize: 11 }}>• Active</span>}
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon orange"><TrendingUp size={20} /></div>
              <div>
                <div className="stat-value">
                  ₹{avgOrderValue.toLocaleString('en-IN')}
                </div>
                <div className="stat-label">Avg Order Value</div>
              </div>
            </div>
          </div>

          {/* Table Card */}
          <div className="card">
            <div className="section-header" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  display: 'inline-flex',
                  background: 'var(--surface2)',
                  padding: 3,
                  borderRadius: 8,
                  border: '1px solid var(--border)'
                }}>
                  <button
                    className="btn btn-sm"
                    style={{
                      background: orderProductTab === 'orders' ? 'var(--accent)' : 'transparent',
                      color: orderProductTab === 'orders' ? '#fff' : 'var(--muted)',
                      border: 'none',
                      padding: '6px 14px',
                      fontWeight: orderProductTab === 'orders' ? 600 : 400,
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => setOrderProductTab('orders')}
                  >
                    Recent Orders ({recentOrders.length})
                  </button>
                  <button
                    className="btn btn-sm"
                    style={{
                      background: orderProductTab === 'products' ? 'var(--accent)' : 'transparent',
                      color: orderProductTab === 'products' ? '#fff' : 'var(--muted)',
                      border: 'none',
                      padding: '6px 14px',
                      fontWeight: orderProductTab === 'products' ? 600 : 400,
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => setOrderProductTab('products')}
                  >
                    All Products ({allProducts.length})
                  </button>
                </div>
              </div>

              <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigate(orderProductTab === 'orders' ? '/orders' : '/products')}
              >
                {orderProductTab === 'orders' ? 'View All Orders' : 'Manage Products'}
              </button>
            </div>

            <div className="table-wrap">
              {orderProductTab === 'orders' ? (
                recentOrders.length === 0 ? (
                  <div className="empty-state"><ShoppingCart /><p>No orders yet</p></div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Sr. No</th>
                        <th>Customer</th>
                        <th>Invoice No</th>
                        <th>Mobile</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Payment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((o, index) => (
                        <tr key={o.orderId} style={{ cursor: 'pointer', opacity: o.isCancelled ? 0.75 : 1 }} onClick={() => navigate(`/invoice/${o.orderId}`)}>
                          <td><span style={{ color: 'var(--muted)' }}>{index + 1}</span></td>
                          <td style={{ fontWeight: 500 }}>
                            {o.customerName}
                            {o.isCancelled && (
                              <span className="badge badge-danger" style={{ marginLeft: 8, fontSize: 10, background: '#fee2e2', color: '#dc2626' }}>Cancelled</span>
                            )}
                          </td>
                          <td>{o.invoiceNumber}</td>
                          <td style={{ color: 'var(--muted)' }}>{o.customerMobileNumber}</td>
                          <td style={{ color: 'var(--muted)' }}>{o.orderDate}</td>
                          <td style={{ fontWeight: 600, textDecoration: o.isCancelled ? 'line-through' : 'none' }}>
                            ₹{o.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </td>
                          <td><span className={`badge ${o.paymentMethod === 'CASH' ? 'badge-green' : 'badge-blue'}`}>{o.paymentMethod}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              ) : (
                allProducts.length === 0 ? (
                  <div className="empty-state"><Package /><p>No products yet</p></div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Sr. No</th>
                        <th>Description</th>
                        <th>Size</th>
                        <th>GST %</th>
                        <th>HSN</th>
                        <th>Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allProducts.map((p, index) => (
                        <tr key={p.productId || p.product_id} style={{ cursor: 'pointer' }} onClick={() => navigate('/products')}>
                          <td><span style={{ color: 'var(--muted)' }}>{index + 1}</span></td>
                          <td style={{ fontWeight: 500 }}>{p.description}</td>
                          <td>{p.size}</td>
                          <td><span className="badge badge-orange">{p.gst}%</span></td>
                          <td style={{ color: 'var(--muted)' }}>{p.hsnNumber || '—'}</td>
                          <td>
                            <span className={`badge ${p.quantity > 5 ? 'badge-green' : 'badge-orange'}`}>
                              {p.quantity}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
