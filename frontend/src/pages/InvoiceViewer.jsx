import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { api } from '../api';
import { ArrowLeft, Printer, RefreshCw, AlertCircle, FileText, Download } from 'lucide-react';

export default function InvoiceViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [printing, setPrinting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const iframeRef = useRef(null);

  const fetchPdf = () => {
    setLoading(true);
    setError(null);

    fetch(`/api/order/${id}/invoice`)
      .then(async (res) => {
        if (!res.ok) {
          let msg = `Failed to load invoice (${res.status})`;
          try {
            const json = await res.json();
            if (json.message) msg = json.message;
          } catch {
            const text = await res.text();
            if (text) msg = text;
          }
          throw new Error(msg);
        }
        return res.blob();
      })
      .then((blob) => {
        const fileBlob = new Blob([blob], { type: 'application/pdf' });
        const url = URL.createObjectURL(fileBlob);
        setPdfUrl((prev) => {
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
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [id]);

  const handlePrint = async () => {
    setPrinting(true);
    try {
      await api.printInvoice(id);
      toast.success('Invoice sent to shop printer successfully!');
    } catch (e) {
      // If server print fails, offer browser printing fallback
      toast.error(e?.message || 'Server printer unavailable. Trying system print...');
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.print();
      }
    } finally {
      setPrinting(false);
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `Invoice-Order-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Invoice downloaded');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top Header Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/orders')}>
            <ArrowLeft size={14} /> Back to Orders
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} style={{ color: 'var(--accent)' }} />
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>Invoice — Order #{id}</h2>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={fetchPdf}
            disabled={loading}
            title="Reload PDF"
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
            Refresh
          </button>

          {pdfUrl && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleDownload}
              title="Save a copy of this invoice"
            >
              <Download size={13} />
              Save PDF
            </button>
          )}

          <button
            className="btn btn-primary"
            onClick={handlePrint}
            disabled={printing || loading || !!error}
            style={{ padding: '7px 16px', fontSize: 13.5 }}
          >
            <Printer size={15} />
            {printing ? 'Sending to Printer…' : 'Print Invoice'}
          </button>
        </div>
      </div>

      {/* PDF Display Container */}
      <div
        className="card"
        style={{
          padding: 0,
          overflow: 'hidden',
          flex: 1,
          minHeight: 'calc(100vh - 170px)',
          display: 'flex',
          flexDirection: 'column',
          background: '#1a1f26',
        }}
      >
        {loading ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              color: 'var(--muted)',
              minHeight: 400,
            }}
          >
            <RefreshCw size={28} className="spin" style={{ color: 'var(--accent)' }} />
            <p style={{ fontSize: 14 }}>Loading invoice preview...</p>
          </div>
        ) : error ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              padding: 40,
              textAlign: 'center',
              minHeight: 400,
            }}
          >
            <AlertCircle size={36} style={{ color: 'var(--red)' }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
              Unable to display invoice
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted)', maxWidth: 440 }}>{error}</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="btn btn-primary btn-sm" onClick={fetchPdf}>
                <RefreshCw size={13} /> Retry
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/orders')}>
                Return to Orders
              </button>
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={pdfUrl}
            className="pdf-viewer"
            title={`Invoice for Order #${id}`}
            style={{ width: '100%', height: 'calc(100vh - 170px)', border: 'none' }}
          />
        )}
      </div>
    </div>
  );
}
