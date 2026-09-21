import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Package, ShoppingCart, IndianRupee, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'products'
  const navigate = useNavigate();

  useEffect(() => {
    api.getOrders().then(setOrders).catch(() => {});
    api.getProducts().then(setProducts).catch(() => {});
  }, []);

  const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
  const recentOrders = [...orders].reverse().slice(0, 10);
  const allProducts = [...products];

  return (
    <>
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
          onClick={() => setActiveTab('orders')}
          style={{
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            borderColor: activeTab === 'orders' ? 'var(--accent)' : 'var(--border)',
            background: activeTab === 'orders' ? 'rgba(249,115,22,0.06)' : 'var(--surface)',
            boxShadow: activeTab === 'orders' ? '0 0 12px rgba(249,115,22,0.15)' : 'none',
          }}
          title="Click to view recent orders below"
        >
          <div className="stat-icon blue"><ShoppingCart size={20} /></div>
          <div>
            <div className="stat-value">{orders.length}</div>
            <div className="stat-label">
              Total Orders {activeTab === 'orders' && <span style={{ color: 'var(--accent)', fontSize: 11 }}>• Active</span>}
            </div>
          </div>
        </div>

        <div
          className="stat-card"
          onClick={() => setActiveTab('products')}
          style={{
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            borderColor: activeTab === 'products' ? 'var(--accent)' : 'var(--border)',
            background: activeTab === 'products' ? 'rgba(249,115,22,0.06)' : 'var(--surface)',
            boxShadow: activeTab === 'products' ? '0 0 12px rgba(249,115,22,0.15)' : 'none',
          }}
          title="Click to view recent products below"
        >
          <div className="stat-icon green"><Package size={20} /></div>
          <div>
            <div className="stat-value">{products.length}</div>
            <div className="stat-label">
              Products {activeTab === 'products' && <span style={{ color: 'var(--accent)', fontSize: 11 }}>• Active</span>}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange"><TrendingUp size={20} /></div>
          <div>
            <div className="stat-value">
              ₹{orders.length ? Math.round(totalRevenue / orders.length).toLocaleString('en-IN') : 0}
            </div>
            <div className="stat-label">Avg Order Value</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2>{activeTab === 'orders' ? 'Recent Orders' : 'All Products'}</h2>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
              {activeTab === 'orders' ? '(Latest 10)' : `(${allProducts.length} Total)`}
            </span>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate(activeTab === 'orders' ? '/orders' : '/products')}
          >
            {activeTab === 'orders' ? 'View All Orders' : 'Manage Products'}
          </button>
        </div>

        <div className="table-wrap">
          {activeTab === 'orders' ? (
            recentOrders.length === 0 ? (
              <div className="empty-state"><ShoppingCart /><p>No orders yet</p></div>
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
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o, index) => (
                    <tr key={o.orderId} style={{ cursor: 'pointer' }} onClick={() => navigate(`/invoice/${o.orderId}`)}>
                      <td><span style={{ color: 'var(--muted)' }}>{index + 1}</span></td>
                      <td style={{ fontWeight: 500 }}>{o.customerName}</td>
                      <td style={{ color: 'var(--muted)' }}>{o.customerMobileNumber}</td>
                      <td style={{ color: 'var(--muted)' }}>{o.orderDate}</td>
                      <td style={{ fontWeight: 600 }}>₹{o.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
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
  );
}
