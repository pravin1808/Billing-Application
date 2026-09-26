import { useState, useEffect, useId } from 'react';
import toast from 'react-hot-toast';
import { api } from '../api';
import {
  Calendar,
  IndianRupee,
  TrendingUp,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  BarChart2
} from 'lucide-react';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatISODate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function DaySalesGraph() {
  const todayStr = formatISODate(new Date());
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const gradientId = useId();
  const strokeGradId = useId();

  const fetchDailySales = (dateStr) => {
    setLoading(true);
    api.getDailySales(dateStr)
      .then((res) => {
        if (res && typeof res === 'object') {
          const entries = Object.entries(res).map(([dateKey, rawAmount]) => {
            const parts = dateKey.split('-');
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const dayNum = parseInt(parts[2], 10);
            const d = new Date(year, month, dayNum);
            const weekday = WEEKDAYS[d.getDay()];
            const monthName = MONTHS[month];
            const amount = typeof rawAmount === 'number' ? rawAmount : parseFloat(rawAmount) || 0;

            return {
              key: dateKey,
              label: `${weekday} ${dayNum}`,
              fullLabel: `${weekday}, ${dayNum} ${monthName} ${year}`,
              amount
            };
          });
          setSalesData(entries);
        } else {
          setSalesData([]);
        }
      })
      .catch((err) => {
        toast.error(err?.message || 'Failed to load 7-day sales');
        setSalesData([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDailySales(selectedDate);
  }, [selectedDate]);

  // Statistics
  const totalSales = salesData.reduce((acc, d) => acc + d.amount, 0);
  const isToday = selectedDate === todayStr;
  const currentDayEntry = salesData.find((d) => d.key === selectedDate);
  const todaysSales = currentDayEntry ? currentDayEntry.amount : 0;
  const maxSaleItem = salesData.reduce(
    (max, d) => (d.amount > max.amount ? d : max),
    { amount: 0, fullLabel: 'N/A' }
  );
  const rawMax = Math.max(...salesData.map((d) => d.amount), 0);
  const yMax = rawMax > 0 ? Math.ceil(rawMax * 1.15) : 20000;

  // SVG Chart Layout
  const svgWidth = 520;
  const svgHeight = 240;
  const padLeft = 60;
  const padRight = 25;
  const padTop = 20;
  const padBottom = 35;

  const chartWidth = svgWidth - padLeft - padRight;
  const chartHeight = svgHeight - padTop - padBottom;

  const yTicks = [0, 0.33, 0.66, 1].map((ratio) => Math.round(yMax * ratio));

  const points = salesData.map((d, i) => {
    const x = padLeft + (i / Math.max(salesData.length - 1, 1)) * chartWidth;
    const y = padTop + (1 - d.amount / yMax) * chartHeight;
    return { ...d, x, y, index: i };
  });

  const linePath = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${padTop + chartHeight} L ${points[0].x} ${padTop + chartHeight} Z`
    : '';

  const formatCurrency = (val) => '₹' + Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  const formatShortCurrency = (val) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
    return `₹${val}`;
  };

  const activePoint = hoveredIndex !== null && points[hoveredIndex] ? points[hoveredIndex] : null;
  const prevActivePoint = hoveredIndex !== null && hoveredIndex > 0 ? points[hoveredIndex - 1] : null;

  let percentChange = null;
  if (activePoint && prevActivePoint) {
    if (prevActivePoint.amount > 0) {
      percentChange = (((activePoint.amount - prevActivePoint.amount) / prevActivePoint.amount) * 100).toFixed(1);
    } else if (prevActivePoint.amount === 0 && activePoint.amount > 0) {
      percentChange = '+100.0';
    } else if (prevActivePoint.amount === 0 && activePoint.amount === 0) {
      percentChange = '0.0';
    }
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header with Date Picker */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
        paddingBottom: 14,
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="stat-icon blue" style={{ width: 36, height: 36 }}>
            <Calendar size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Day-wise Sales (7 Days)</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Last 7 days ending on selected date</div>
          </div>
        </div>

        {/* Date Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              background: 'var(--surface2)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              fontSize: 13,
              cursor: 'pointer'
            }}
          />
          {selectedDate !== todayStr && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setSelectedDate(todayStr)}
              title="Reset to today"
              style={{ padding: '5px 8px', fontSize: 11 }}
            >
              Today
            </button>
          )}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => fetchDailySales(selectedDate)}
            title="Refresh daily data"
            disabled={loading}
            style={{ padding: '6px 8px' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Mini KPI row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10
      }}>
        <div style={{
          padding: '10px 12px',
          background: 'var(--surface2)',
          borderRadius: 8,
          border: '1px solid var(--border)'
        }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>7-Day Total</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--blue)', marginTop: 2 }}>
            {formatCurrency(totalSales)}
          </div>
        </div>

        <div style={{
          padding: '10px 12px',
          background: 'var(--surface2)',
          borderRadius: 8,
          border: '1px solid var(--border)'
        }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>
            {isToday ? "Today's Sales" : "Selected Day"}
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--accent)', marginTop: 2 }}>
            {formatCurrency(todaysSales)}
          </div>
        </div>

        <div style={{
          padding: '10px 12px',
          background: 'var(--surface2)',
          borderRadius: 8,
          border: '1px solid var(--border)'
        }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>Peak Day</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--green)', marginTop: 2 }}>
            {formatCurrency(maxSaleItem.amount)}
          </div>
        </div>
      </div>

      {/* SVG Linear Graph */}
      <div style={{
        position: 'relative',
        background: 'var(--chart-bg)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        padding: '16px 8px 8px 8px',
        overflow: 'hidden'
      }}>
        {loading && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--chart-overlay)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            color: 'var(--blue)',
            fontSize: 13,
            gap: 6
          }}>
            <RefreshCw size={16} className="spin" /> Loading Daily Sales...
          </div>
        )}

        {/* Hover Tooltip */}
        {activePoint && (
          <div style={{
            position: 'absolute',
            left: Math.min(Math.max(activePoint.x - 65, 8), svgWidth - 150),
            top: 14,
            pointerEvents: 'none',
            background: 'var(--chart-tooltip)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--blue)',
            borderRadius: 6,
            padding: '6px 10px',
            boxShadow: 'var(--shadow-md)',
            zIndex: 5,
            minWidth: 130
          }}>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{activePoint.fullLabel}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginTop: 1 }}>
              {formatCurrency(activePoint.amount)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--blue)', marginTop: 2, fontWeight: 500 }}>
              {totalSales > 0 ? ((activePoint.amount / totalSales) * 100).toFixed(1) : 0}% of 7-day total
            </div>
            {percentChange !== null && (
              <div style={{
                fontSize: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                marginTop: 2,
                color: parseFloat(percentChange) >= 0 ? 'var(--green)' : 'var(--red)'
              }}>
                {parseFloat(percentChange) >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                <span>{percentChange}% vs yesterday</span>
              </div>
            )}
          </div>
        )}

        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
              <stop offset="80%" stopColor="#38bdf8" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id={strokeGradId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((val, idx) => {
            const yPos = padTop + (1 - val / yMax) * chartHeight;
            return (
              <g key={idx}>
                <line
                  x1={padLeft}
                  y1={yPos}
                  x2={padLeft + chartWidth}
                  y2={yPos}
                  stroke="var(--chart-grid)"
                  strokeDasharray={val === 0 ? 'none' : '3 3'}
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 8}
                  y={yPos + 4}
                  textAnchor="end"
                  fill="#8b949e"
                  fontSize="10"
                  fontFamily="Inter, sans-serif"
                >
                  {formatShortCurrency(val)}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}

          {/* Line Path */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke={`url(#${strokeGradId})`}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Hover Line */}
          {activePoint && (
            <line
              x1={activePoint.x}
              y1={padTop}
              x2={activePoint.x}
              y2={padTop + chartHeight}
              stroke="rgba(56, 189, 248, 0.4)"
              strokeDasharray="3 3"
              strokeWidth="1.5"
            />
          )}

          {/* Points & Labels */}
          {points.map((pt, i) => {
            const isHovered = hoveredIndex === i;
            const isPeak = pt.amount > 0 && pt.amount === maxSaleItem.amount;

            return (
              <g key={pt.key}>
                <text
                  x={pt.x}
                  y={padTop + chartHeight + 18}
                  textAnchor="middle"
                  fill={isHovered ? 'var(--blue)' : '#8b949e'}
                  fontSize="10"
                  fontWeight={isHovered ? '600' : '400'}
                  fontFamily="Inter, sans-serif"
                >
                  {pt.label}
                </text>

                <rect
                  x={pt.x - chartWidth / (points.length * 2)}
                  y={padTop}
                  width={chartWidth / points.length}
                  height={chartHeight + 25}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredIndex(i)}
                />

                {(isHovered || isPeak) && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 10 : 7}
                    fill={isPeak ? 'rgba(63, 185, 80, 0.3)' : 'rgba(56, 189, 248, 0.3)'}
                  />
                )}

                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 5 : isPeak ? 4 : 3}
                  fill={isPeak ? '#3fb950' : '#38bdf8'}
                  stroke="var(--chart-bg)"
                  strokeWidth="2"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Mini 7-Day Breakdown Table */}
      <div style={{
        background: 'var(--surface2)',
        borderRadius: 8,
        border: '1px solid var(--border)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '8px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 12,
          fontWeight: 600
        }}>
          <span>Daily Breakdown</span>
          <span style={{ color: 'var(--muted)', fontSize: 11 }}>% Share of 7-Day Total</span>
        </div>
        <div>
          <table style={{ fontSize: 12, width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {salesData.map((d, index) => {
                const sharePercent = totalSales > 0
                  ? ((d.amount / totalSales) * 100).toFixed(1)
                  : '0.0';
                const isMax = d.amount > 0 && d.amount === maxSaleItem.amount;

                return (
                  <tr
                    key={d.key}
                    style={{
                      background: hoveredIndex === index ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <td style={{ padding: '6px 12px', width: '35%' }}>
                      <span style={{ fontWeight: 500, color: isMax ? 'var(--green)' : 'var(--text)' }}>
                        {d.label}
                      </span>
                    </td>
                    <td style={{ padding: '6px 12px', fontWeight: 600 }}>
                      {formatCurrency(d.amount)}
                    </td>
                    <td style={{ padding: '6px 12px', width: '35%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{
                          flex: 1,
                          height: 5,
                          background: 'var(--surface)',
                          borderRadius: 3,
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${Math.min(100, parseFloat(sharePercent))}%`,
                            height: '100%',
                            background: isMax ? 'var(--green)' : 'var(--blue)',
                            borderRadius: 3
                          }} />
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--muted)', width: 34 }}>
                          {sharePercent}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
