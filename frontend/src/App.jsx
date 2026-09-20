import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LayoutDashboard, Package, ShoppingCart, FileText, Settings } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import InvoiceViewer from './pages/InvoiceViewer';
import SettingsPage from './pages/Settings';
import './index.css';

const navItems = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/products',  icon: Package,         label: 'Products'  },
  { to: '/orders',    icon: ShoppingCart,    label: 'Orders'    },
  { to: '/settings',  icon: Settings,        label: 'Settings'  },
];

const pageTitles = {
  '/':          { title: 'Dashboard',    sub: 'Overview of your shop' },
  '/products':  { title: 'Products',     sub: 'Manage your tyre inventory' },
  '/orders':    { title: 'Orders',       sub: 'Billing & invoices' },
  '/settings':  { title: 'Settings',     sub: 'Configure invoice preferences' },
};

function Shell() {
  const { pathname } = useLocation();
  const meta = pageTitles[pathname] ?? { title: 'Akhil Enterprises', sub: '' };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>Akhil Enterprises</h1>
          <span>Billing System</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="main">
        <header className="topbar">
          <div>
            <div className="topbar-title">{meta.title}</div>
            <div className="topbar-sub">{meta.sub}</div>
          </div>
        </header>
        <main className="page">
          <Routes>
            <Route path="/"               element={<Dashboard />} />
            <Route path="/products"       element={<Products />} />
            <Route path="/orders"         element={<Orders />} />
            <Route path="/invoice/:id"    element={<InvoiceViewer />} />
            <Route path="/settings"       element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1e2530', color: '#e6edf3', border: '1px solid #30363d' },
          duration: 3000,
        }}
      />
      <Shell />
    </BrowserRouter>
  );
}
