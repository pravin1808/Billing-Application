import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { api } from '../api';
import { X, Printer, RefreshCw, AlertCircle, FileText, Download } from 'lucide-react';

export default function InvoiceModal({ orderId, onClose }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [printing, setPrinting] = useState(false);
  const iframeRef = useRef(null);

  const fetchPdf = () => {
    setLoading(true);
    setError(null);

    fetch(`/api/order/${orderId}/invoice`)
      .then(async (res) => {
        if (!res.ok) {
          let msg = `Failed to load invoice (${res.status})`;
          try {
            const json = await res.json();
            if (json.message) msg = json.message;
          } catch {
            const txt = await res.text();
            if (txt) msg = txt;
          }
          throw new Error(msg);
        }
        return res.blob();
      })
      .then((blob) => {
        const fileBlob = new Blob([blob], { type: 'application/pdf' });
        const url = URL.createObjectURL(fileBlob);
        setBlobUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      })
      .catch((err) => {
        setError(err.message || 'Invoice PDF could not be loaded.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPdf();
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [orderId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePrint = async () => {
    setPrinting(true);
    try {
      await api.printInvoice(orderId);
      toast.success('Sent to printer successfully');
    } catch (e) {
      toast.error(e?.message || 'Server printer failed. Opening system print...');
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.print();
      }
    } finally {
      setPrinting(false);
    }
  };

  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `Invoice-Order-${orderId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Invoice downloaded');
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{ zIndex: 1200, padding: '16px' }}
    >
      <div
        className="modal"
        style={{
          width: '860px',
          maxWidth: '96vw',
          height: '94vh',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: '12px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={18} style={{ color: 'var(--accent)' }} />
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>
              Invoice Preview — Order #{orderId}
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {blobUrl && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleDownload}
                title="Download local copy"
              >
                <Download size={13} /> Save PDF
              </button>
            )}

            <button
              className="btn btn-primary"
              onClick={handlePrint}
              disabled={printing || loading || !!error}
              style={{ padding: '6px 16px', fontSize: 13 }}
            >
              <Printer size={14} />
              {printing ? 'Printing…' : 'Print Invoice'}
            </button>

            <button
              className="btn btn-ghost btn-sm"
              onClick={onClose}
              title="Close (Esc)"
              style={{ padding: '6px' }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Full PDF Viewer Area (Fitted to viewport height without scrolling) */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            background: 'var(--pdf-bg, #23272e)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {loading ? (
            <div
              style={{
                color: 'var(--muted)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <RefreshCw size={26} className="spin" style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: 13 }}>Loading invoice preview...</span>
            </div>
          ) : error ? (
            <div style={{ color: 'var(--red)', textAlign: 'center', padding: 24 }}>
              <AlertCircle size={36} style={{ margin: '0 auto 10px', display: 'block' }} />
              <p style={{ fontWeight: 600, marginBottom: 6 }}>Unable to display invoice</p>
              <p style={{ fontSize: 12, color: 'var(--muted)', maxWidth: 400 }}>{error}</p>
              <button
                className="btn btn-primary btn-sm"
                onClick={fetchPdf}
                style={{ marginTop: 12 }}
              >
                <RefreshCw size={13} /> Retry
              </button>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              src={`${blobUrl}#view=Fit&toolbar=0&navpanes=0`}
              title={`Invoice #${orderId}`}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                display: 'block',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
