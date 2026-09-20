import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Package, ShoppingCart, IndianRupee, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.getOrders().then(setOrders).catch(() => {});
    api.getProducts().then(setProducts).catch(() => {});
  }, []);

  const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
  const recentOrders = [...orders].reverse().slice(0, 6);

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
        <div className="stat-card">
          <div className="stat-icon blue"><ShoppingCart size={20} /></div>
          <div>
            <div className="stat-value">{orders.length}</div>
            <div className="stat-label">Total Orders</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Package size={20} /></div>
          <div>
            <div className="stat-value">{products.length}</div>
            <div className="stat-label">Products</div>
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
          <h2>Recent Orders</h2>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/orders')}>View All</button>
        </div>
        <div className="table-wrap">
          {recentOrders.length === 0 ? (
            <div className="empty-state"><ShoppingCart /><p>No orders yet</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Mobile</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(o => (
                  <tr key={o.orderId} style={{ cursor: 'pointer' }} onClick={() => navigate(`/invoice/${o.orderId}`)}>
                    <td><span className="badge badge-orange">#{o.invoiceNumber}</span></td>
                    <td style={{ fontWeight: 500 }}>{o.customerName}</td>
                    <td style={{ color: 'var(--muted)' }}>{o.customerMobileNumber}</td>
                    <td style={{ color: 'var(--muted)' }}>{o.orderDate}</td>
                    <td style={{ fontWeight: 600 }}>₹{o.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                    <td><span className={`badge ${o.paymentMethod === 'CASH' ? 'badge-green' : 'badge-blue'}`}>{o.paymentMethod}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
