import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { api } from '../api';
import { FolderOpen, Hash, CheckCircle, Percent, Trash2, Plus, Sun, Moon, Palette } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [invoicePath, setInvoicePath] = useState(() => {
    return localStorage.getItem('tyreshop_invoice_path') || '';
  });
  const [currentPath, setCurrentPath] = useState(() => {
    return localStorage.getItem('tyreshop_invoice_path') || '';
  });
  const [loadingPath, setLoadingPath] = useState(true);
  const [invoiceNum, setInvoiceNum] = useState('');
  const [browsing, setBrowsing] = useState(false);
  const [savingPath, setSavingPath] = useState(false);
  const [savingNum, setSavingNum] = useState(false);

  // GST rates state
  const [gstRates, setGstRates] = useState([]);
  const [loadingGst, setLoadingGst] = useState(true);
  const [newGst, setNewGst] = useState('');
  const [addingGst, setAddingGst] = useState(false);
  const [deletingGstId, setDeletingGstId] = useState(null);

  const fileInputRef = useRef(null);

  // Fetch actual active folder from PostgreSQL database on mount
  useEffect(() => {
    let isMounted = true;
    api.getInvoicePath()
      .then((res) => {
        if (!isMounted) return;
        const path = (typeof res === 'object' && res?.invoicePath) ? res.invoicePath : res;
        if (path && typeof path === 'string') {
          setCurrentPath(path);
          setInvoicePath(path);
          localStorage.setItem('tyreshop_invoice_path', path);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch invoice path from backend:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingPath(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Direct folder choosing from disk with exact drive letter and full path
  const handleChooseFolder = async () => {
    setBrowsing(true);
    try {
      // Primary: Native Windows Folder Dialog (reads full drive & path accurately e.g. C:/Invoices Demo)
      const res = await api.selectFolderFromDisk(invoicePath);
      if (res && res.path) {
        setInvoicePath(res.path);
        toast.success(`Selected folder: ${res.path}`);
        return;
      } else if (res && res.path === null) {
        // User clicked cancel in dialog
        return;
      }
    } catch {
      // Fallback: Browser showDirectoryPicker if endpoint is not responding
      try {
        if ('showDirectoryPicker' in window) {
          const dirHandle = await window.showDirectoryPicker({
            id: 'invoice_save_folder',
            mode: 'read',
          });
          if (dirHandle && dirHandle.name) {
            const driveMatch = invoicePath.match(/^([a-zA-Z]:[/\\]?)/);
            const drive = driveMatch ? driveMatch[1].replace('\\', '/') : 'C:/';
            const cleanDrive = drive.endsWith('/') ? drive : drive + '/';
            const newPath = `${cleanDrive}${dirHandle.name}`;
            setInvoicePath(newPath);
            toast.success(`Selected folder: ${dirHandle.name}`);
          }
        } else {
          fileInputRef.current?.click();
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          toast.error('Could not select folder');
        }
      }
    } finally {
      setBrowsing(false);
    }
  };

  const handleFileInputFallback = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const relPath = files[0].webkitRelativePath || '';
      const folderName = relPath.split('/')[0] || files[0].name;
      const driveMatch = invoicePath.match(/^([a-zA-Z]:[/\\]?)/);
      const drive = driveMatch ? driveMatch[1].replace('\\', '/') : 'C:/';
      const cleanDrive = drive.endsWith('/') ? drive : drive + '/';
      const newPath = `${cleanDrive}${folderName}`;
      setInvoicePath(newPath);
      toast.success(`Selected folder: ${folderName}`);
    }
    e.target.value = '';
    setBrowsing(false);
  };

  const updatePath = async () => {
    if (!invoicePath.trim()) return toast.error('Please choose or enter a folder path');
    setSavingPath(true);
    try {
      await api.updateInvoicePath(invoicePath.trim());
      setCurrentPath(invoicePath.trim());
      localStorage.setItem('tyreshop_invoice_path', invoicePath.trim());
      toast.success('Invoice save folder updated successfully!');
    } catch (err) {
      toast.error(err?.message || 'Failed to update folder path');
    } finally {
      setSavingPath(false);
    }
  };

  const updateNum = async () => {
    const n = parseInt(invoiceNum);
    if (!n || n < 1) return toast.error('Enter a valid invoice number');
    setSavingNum(true);
    try {
      await api.updateInvoiceNumber(n);
      toast.success(`Invoice number set to ${n}`);
      setInvoiceNum('');
    } catch (err) {
      toast.error(err?.message || 'Failed to update invoice number');
    } finally {
      setSavingNum(false);
    }
  };

  // Load GST rates from backend
  const loadGstRates = () => {
    setLoadingGst(true);
    api.getGstRates()
      .then((res) => {
        if (Array.isArray(res)) {
          setGstRates(res.sort((a, b) => a.gst - b.gst));
        }
      })
      .catch((err) => {
        console.error('Failed to load GST rates:', err);
      })
      .finally(() => {
        setLoadingGst(false);
      });
  };

  useEffect(() => {
    loadGstRates();
  }, []);

  const handleAddGst = async () => {
    const val = parseInt(newGst, 10);
    if (isNaN(val) || val < 0 || val > 100) {
      return toast.error('Enter a valid GST rate between 0 and 100');
    }
    if (gstRates.some((g) => g.gst === val)) {
      return toast.error(`GST rate ${val}% already exists`);
    }

    setAddingGst(true);
    try {
      await api.addGstRate(val);
      toast.success(`Added ${val}% GST rate`);
      setNewGst('');
      loadGstRates();
    } catch (err) {
      toast.error(err?.message || 'Failed to add GST rate');
    } finally {
      setAddingGst(false);
    }
  };

  const handleDeleteGst = async (gstId, rate) => {
    if (!confirm(`Delete ${rate}% GST rate?`)) return;
    setDeletingGstId(gstId);
    try {
      await api.deleteGstRate(gstId);
      toast.success(`Deleted ${rate}% GST rate`);
      loadGstRates();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete GST rate');
    } finally {
      setDeletingGstId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 620 }}>
      {/* Hidden fallback file input with directory support */}
      <input
        ref={fileInputRef}
        type="file"
        webkitdirectory="true"
        directory="true"
        style={{ display: 'none' }}
        onChange={handleFileInputFallback}
      />

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div className="stat-icon blue"><FolderOpen size={18} /></div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Invoice Save Folder</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Where PDF invoices will be saved on your computer</div>
          </div>
        </div>

        {/* Active folder indicator banner */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.25)',
          borderRadius: 8,
          color: 'var(--success)',
          fontSize: 13,
          marginBottom: 16
        }}>
          <CheckCircle size={16} />
          <span>Active Folder: <strong>{currentPath || (loadingPath ? 'Loading...' : 'Not configured')}</strong></span>
        </div>

        <div className="form-group" style={{ marginBottom: 14 }}>
          <label>Folder Path on Disk</label>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={invoicePath}
              onChange={e => setInvoicePath(e.target.value)}
              placeholder={loadingPath ? "Loading active path..." : "e.g. C:/Invoices or D:/Invoices"}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleChooseFolder}
              disabled={browsing}
              title="Select a folder from your disk"
              style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
            >
              <FolderOpen size={16} />
              {browsing ? 'Opening...' : 'Choose Folder'}
            </button>
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
            Click <strong>"Choose Folder"</strong> to select a folder from your computer. The exact path and drive will be read automatically.
          </div>
        </div>

        <button className="btn btn-primary" onClick={updatePath} disabled={savingPath}>
          {savingPath ? 'Saving…' : 'Update Folder'}
        </button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div className="stat-icon orange"><Hash size={18} /></div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Invoice Number</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Manually reset or advance the current invoice counter</div>
          </div>
        </div>
        <div className="form-group" style={{ marginBottom: 14 }}>
          <label>Set Invoice Number To</label>
          <input
            type="number"
            value={invoiceNum}
            onChange={e => setInvoiceNum(e.target.value)}
            placeholder="e.g. 200"
            min={1}
          />
        </div>
        <button className="btn btn-primary" onClick={updateNum} disabled={savingNum}>
          {savingNum ? 'Saving…' : 'Update Number'}
        </button>
      </div>

      {/* ── GST Rates (Tax Slabs) ── */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div className="stat-icon purple" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
            <Percent size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>GST Rates (Tax Slabs)</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Manage available GST percentage options for products and billing</div>
          </div>
        </div>

        {/* Existing rates */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8 }}>Configured GST Rates</label>
          {loadingGst ? (
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>Loading GST rates...</div>
          ) : gstRates.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--muted)', padding: '10px 12px', background: 'var(--surface2)', borderRadius: 8 }}>
              No custom GST rates configured in database yet. Default rates (12%, 18%, 28%) are being used.
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {gstRates.map((g) => (
                <div
                  key={g.gstId}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <span>{g.gst}%</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteGst(g.gstId, g.gst)}
                    disabled={deletingGstId === g.gstId}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--danger)',
                      cursor: 'pointer',
                      padding: 2,
                      display: 'flex',
                      alignItems: 'center',
                      opacity: deletingGstId === g.gstId ? 0.4 : 0.8,
                    }}
                    title={`Delete ${g.gst}% rate`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add rate form */}
        <div className="form-group" style={{ marginBottom: 14 }}>
          <label>Add New GST Rate (%)</label>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="number"
              value={newGst}
              onChange={(e) => setNewGst(e.target.value)}
              placeholder="e.g. 5, 12, 18, 28"
              min={0}
              max={100}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddGst();
                }
              }}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAddGst}
              disabled={addingGst || !newGst}
              style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
            >
              <Plus size={16} />
              {addingGst ? 'Adding...' : 'Add Rate'}
            </button>
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
            Added GST rates will immediately be available in product creation and order billing dropdowns.
          </div>
        </div>
      </div>

      {/* ── Appearance & Theme ── */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div className="stat-icon orange">
            <Palette size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Appearance & Theme</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Choose between Dark mode and Light mode</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          {/* Dark Mode Option */}
          <button
            type="button"
            onClick={() => {
              setTheme('dark');
              toast.success('Dark theme activated');
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
              padding: '16px 14px',
              borderRadius: 'var(--radius)',
              border: `2px solid ${theme === 'dark' ? 'var(--accent)' : 'var(--border)'}`,
              background: theme === 'dark' ? 'var(--accent-dim)' : 'var(--surface2)',
              cursor: 'pointer',
              color: 'var(--text)',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: '#0d1117',
              border: '1px solid #30363d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8'
            }}>
              <Moon size={18} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>Dark Theme</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>High contrast, easier on the eyes</div>
            </div>
            {theme === 'dark' && (
              <span className="badge badge-orange" style={{ fontSize: 11, marginTop: 4 }}>Active</span>
            )}
          </button>

          {/* Light Mode Option */}
          <button
            type="button"
            onClick={() => {
              setTheme('light');
              toast.success('Light theme activated');
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
              padding: '16px 14px',
              borderRadius: 'var(--radius)',
              border: `2px solid ${theme === 'light' ? 'var(--accent)' : 'var(--border)'}`,
              background: theme === 'light' ? 'var(--accent-dim)' : 'var(--surface2)',
              cursor: 'pointer',
              color: 'var(--text)',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: '#ffffff',
              border: '1px solid #d0d7de',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ea580c'
            }}>
              <Sun size={18} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>Light Theme</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Crisp and clean for bright daylight</div>
            </div>
            {theme === 'light' && (
              <span className="badge badge-orange" style={{ fontSize: 11, marginTop: 4 }}>Active</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
