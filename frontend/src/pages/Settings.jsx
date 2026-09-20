import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { api } from '../api';
import { FolderOpen, Hash, CheckCircle } from 'lucide-react';

export default function Settings() {
  const [invoicePath, setInvoicePath] = useState(() => {
    return localStorage.getItem('tyreshop_invoice_path') || 'C:/Invoices Demo';
  });
  const [currentPath, setCurrentPath] = useState(() => {
    return localStorage.getItem('tyreshop_invoice_path') || 'C:/Invoices Demo';
  });
  const [invoiceNum, setInvoiceNum] = useState('');
  const [browsing, setBrowsing] = useState(false);
  const [savingPath, setSavingPath] = useState(false);
  const [savingNum, setSavingNum] = useState(false);

  const fileInputRef = useRef(null);

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
          <span>Active Folder: <strong>{currentPath}</strong></span>
        </div>

        <div className="form-group" style={{ marginBottom: 14 }}>
          <label>Folder Path on Disk</label>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={invoicePath}
              onChange={e => setInvoicePath(e.target.value)}
              placeholder="e.g. C:/Invoices Demo or D:/Invoices"
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
    </div>
  );
}
