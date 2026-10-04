import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import toast, { Toaster, ToastBar } from 'react-hot-toast';
import { LayoutDashboard, Package, ShoppingCart, TrendingUp, Settings, X } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Sales from './pages/Sales';
import InvoiceViewer from './pages/InvoiceViewer';
import SettingsPage from './pages/Settings';
import { ThemeProvider } from './context/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import './index.css';

const navItems = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/products',  icon: Package,         label: 'Products'  },
  { to: '/orders',    icon: ShoppingCart,    label: 'Orders'    },
  { to: '/sales',     icon: TrendingUp,      label: 'Sales'     },
  { to: '/settings',  icon: Settings,        label: 'Settings'  },
];

const pageTitles = {
  '/':          { title: 'Dashboard',    sub: 'Overview of your shop' },
  '/products':  { title: 'Products',     sub: 'Manage your tyre inventory' },
  '/orders':    { title: 'Orders',       sub: 'Billing & invoices' },
  '/sales':     { title: 'Sales Analytics', sub: 'Performance & 12-month revenue trend' },
  '/settings':  { title: 'Settings',     sub: 'Configure shop preferences and theme' },
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ThemeToggle />
          </div>
        </header>
        <main className="page">
          <Routes>
            <Route path="/"               element={<Dashboard />} />
            <Route path="/products"       element={<Products />} />
            <Route path="/orders"         element={<Orders />} />
            <Route path="/sales"          element={<Sales />} />
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
    <ThemeProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          gutter={10}
          containerStyle={{
            top: 24,
            right: 24,
          }}
          toastOptions={{
            className: 'app-toast',
            style: {
              background: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-lg)',
              padding: '12px 14px 12px 16px',
              fontSize: '13.5px',
              fontWeight: 500,
              lineHeight: 1.55,
              maxWidth: '520px',
              borderRadius: 'var(--radius)',
              letterSpacing: '0.01em',
            },
            duration: 3500,
            success: {
              duration: 3500,
              iconTheme: {
                primary: 'var(--green)',
                secondary: '#ffffff',
              },
              style: {
                borderLeft: '4px solid var(--green)',
              },
            },
            error: {
              duration: 6500,
              iconTheme: {
                primary: 'var(--red)',
                secondary: '#ffffff',
              },
              style: {
                borderLeft: '4px solid var(--red)',
              },
            },
          }}
        >
          {(t) => (
            <ToastBar toast={t}>
              {({ icon, message }) => (
                <>
                  <div
                    className="toast-icon-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      toast.dismiss(t.id);
                    }}
                    title="Dismiss notification"
                    role="button"
                    tabIndex={0}
                  >
                    {icon}
                  </div>
                  <div className="toast-text-content">{message}</div>
                  {t.type !== 'loading' && (
                    <button
                      type="button"
                      className="toast-dismiss-cross-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.dismiss(t.id);
                      }}
                      title="Close notification"
                      aria-label="Close notification"
                    >
                      <X size={15} />
                    </button>
                  )}
                </>
              )}
            </ToastBar>
          )}
        </Toaster>
        <Shell />
      </BrowserRouter>
    </ThemeProvider>
  );
}

