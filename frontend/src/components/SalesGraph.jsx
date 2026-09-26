import { useState, useEffect, useId } from 'react';
import toast from 'react-hot-toast';
import { api } from '../api';
import {
  TrendingUp,
  Calendar,
  IndianRupee,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  BarChart2
} from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export default function SalesGraph({ isStandalone = false }) {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // 1-indexed

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const gradientId = useId();
  const strokeGradId = useId();

  const fetchSales = (year, month) => {
    setLoading(true);
    api.getMonthlySales(year, month)
      .then((res) => {
        // res is a Map of "YYYY-MM": amount
        if (res && typeof res === 'object') {
          const entries = Object.entries(res).map(([ym, rawAmount]) => {
            const [yStr, mStr] = ym.split('-');
            const mIndex = parseInt(mStr, 10) - 1;
            const amount = typeof rawAmount === 'number' ? rawAmount : parseFloat(rawAmount) || 0;
            return {
              key: ym,
              year: parseInt(yStr, 10),
              monthNum: parseInt(mStr, 10),
              label: `${SHORT_MONTHS[mIndex]} '${yStr.slice(2)}`,
              fullLabel: `${MONTH_NAMES[mIndex]} ${yStr}`,
              amount
            };
          });
          setSalesData(entries);
        } else {
          setSalesData([]);
        }
      })
      .catch((err) => {
        toast.error(err?.message || 'Failed to load sales data');
        setSalesData([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSales(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  // Statistics
  const total12MSales = salesData.reduce((acc, d) => acc + d.amount, 0);
  const isCurrentMonth = selectedYear === currentYear && selectedMonth === currentMonth;
  const selectedYMKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const currentMonthEntry = salesData.find((d) => d.key === selectedYMKey) || salesData[salesData.length - 1];
  const currentMonthSales = currentMonthEntry ? currentMonthEntry.amount : 0;
  const maxSaleItem = salesData.reduce(
    (max, d) => (d.amount > max.amount ? d : max),
    { amount: 0, fullLabel: 'N/A' }
  );
  const latestMonthItem = salesData.length ? salesData[salesData.length - 1] : { amount: 0 };

  // SVG Chart Layout dimensions
  const svgWidth = 840;
  const svgHeight = 280;
  const padLeft = 70;
  const padRight = 30;
  const padTop = 25;
  const padBottom = 40;

  const chartWidth = svgWidth - padLeft - padRight;
  const chartHeight = svgHeight - padTop - padBottom;

  const rawMax = Math.max(...salesData.map((d) => d.amount), 0);
  // Give 15% headroom or fallback to 50000 if all 0
  const yMax = rawMax > 0 ? Math.ceil(rawMax * 1.15) : 50000;

  // Grid tick intervals (4 segments)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => Math.round(yMax * ratio));

  // Compute points
  const points = salesData.map((d, i) => {
    const x = padLeft + (i / Math.max(salesData.length - 1, 1)) * chartWidth;
    const y = padTop + (1 - d.amount / yMax) * chartHeight;
    return { ...d, x, y, index: i };
  });

  // Build SVG Path
  const linePath = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${padTop + chartHeight} L ${points[0].x} ${padTop + chartHeight} Z`
    : '';

  // Helpers
  const formatCurrency = (val) => {
    return '₹' + Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  const formatShortCurrency = (val) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
    return `₹${val}`;
  };

  const activePoint = hoveredIndex !== null && points[hoveredIndex] ? points[hoveredIndex] : null;
  const prevActivePoint = hoveredIndex !== null && hoveredIndex > 0 ? points[hoveredIndex - 1] : null;

  let percentChange = null;
  if (activePoint && prevActivePoint && prevActivePoint.amount > 0) {
    percentChange = (((activePoint.amount - prevActivePoint.amount) / prevActivePoint.amount) * 100).toFixed(1);
  }

  // Available year options (e.g. current year - 3 to current year + 1)
  const yearOptions = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Controls Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        padding: '12px 16px',
        background: 'var(--surface2)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="stat-icon orange" style={{ width: 34, height: 34 }}>
            <TrendingUp size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>12-Month Sales Trend Analysis</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              Tracking monthly revenue leading up to {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
            <Calendar size={15} /> Ending Period:
          </div>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              background: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={i + 1} value={i + 1}>{name}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              background: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <button
            className="btn btn-ghost btn-sm"
            onClick={() => fetchSales(selectedYear, selectedMonth)}
            title="Refresh sales data"
            disabled={loading}
            style={{ padding: '6px 10px', height: 33 }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 14
      }}>
        <div style={{
          padding: '14px 16px',
          background: 'var(--surface2)',
          borderRadius: 8,
          border: '1px solid var(--border)'
        }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            12-Month Total
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)', marginTop: 4 }}>
            {formatCurrency(total12MSales)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Sum of last 12 months</div>
        </div>

        <div style={{
          padding: '14px 16px',
          background: 'var(--surface2)',
          borderRadius: 8,
          border: '1px solid var(--border)'
        }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {isCurrentMonth ? "Current Month Sales" : "Selected Month Sales"}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--blue)', marginTop: 4 }}>
            {formatCurrency(currentMonthSales)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
            {isCurrentMonth ? "Sales for this month" : "Sales for selected month"}
          </div>
        </div>

        <div style={{
          padding: '14px 16px',
          background: 'var(--surface2)',
          borderRadius: 8,
          border: '1px solid var(--border)'
        }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Peak Month
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--green)', marginTop: 4 }}>
            {formatCurrency(maxSaleItem.amount)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{maxSaleItem.fullLabel}</div>
        </div>

        <div style={{
          padding: '14px 16px',
          background: 'var(--surface2)',
          borderRadius: 8,
          border: '1px solid var(--border)'
        }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Selected Month
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginTop: 4 }}>
            {formatCurrency(latestMonthItem.amount)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
            {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
          </div>
        </div>
      </div>

      {/* SVG Linear Graph Container */}
      <div style={{
        position: 'relative',
        background: 'var(--chart-bg)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        padding: '20px 10px 10px 10px',
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
            color: 'var(--accent)',
            fontSize: 14,
            fontWeight: 500,
            gap: 8
          }}>
            <RefreshCw size={18} className="spin" /> Loading Sales Graph...
          </div>
        )}

        {/* Hover Tooltip Overlay */}
        {activePoint && (
          <div style={{
            position: 'absolute',
            left: Math.min(Math.max(activePoint.x - 75, 10), svgWidth - 170),
            top: 20,
            pointerEvents: 'none',
            background: 'var(--chart-tooltip)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--accent)',
            borderRadius: 8,
            padding: '8px 12px',
            boxShadow: 'var(--shadow-md)',
            zIndex: 5,
            minWidth: 150
          }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>
              {activePoint.fullLabel}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginTop: 2 }}>
              {formatCurrency(activePoint.amount)}
            </div>
            {percentChange !== null && (
              <div style={{
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                marginTop: 3,
                color: parseFloat(percentChange) >= 0 ? 'var(--green)' : 'var(--red)'
              }}>
                {parseFloat(percentChange) >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                <span>{percentChange}% vs prior month</span>
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
            {/* Gradient for area fill beneath line */}
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.38" />
              <stop offset="70%" stopColor="#f97316" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.00" />
            </linearGradient>

            {/* Gradient for linear curve stroke */}
            <linearGradient id={strokeGradId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ff4500" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines and Y-axis values */}
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
                  strokeDasharray={val === 0 ? 'none' : '4 4'}
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 10}
                  y={yPos + 4}
                  textAnchor="end"
                  fill="#8b949e"
                  fontSize="11"
                  fontFamily="Inter, sans-serif"
                >
                  {formatShortCurrency(val)}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          {areaPath && (
            <path
              d={areaPath}
              fill={`url(#${gradientId})`}
            />
          )}

          {/* Linear Graph Stroke Path */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke={`url(#${strokeGradId})`}
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Hover Vertical Guide Line */}
          {activePoint && (
            <line
              x1={activePoint.x}
              y1={padTop}
              x2={activePoint.x}
              y2={padTop + chartHeight}
              stroke="rgba(249,115,22,0.4)"
              strokeDasharray="3 3"
              strokeWidth="1.5"
            />
          )}

          {/* Interactive Data Points & Month Labels */}
          {points.map((pt, i) => {
            const isHovered = hoveredIndex === i;
            const isPeak = pt.amount > 0 && pt.amount === maxSaleItem.amount;

            return (
              <g key={pt.key}>
                {/* Month label on X-axis */}
                <text
                  x={pt.x}
                  y={padTop + chartHeight + 22}
                  textAnchor="middle"
                  fill={isHovered ? 'var(--accent)' : '#8b949e'}
                  fontSize="11"
                  fontWeight={isHovered ? '600' : '400'}
                  fontFamily="Inter, sans-serif"
                >
                  {pt.label}
                </text>

                {/* Invisible wide column trigger for easy mouse hovering */}
                <rect
                  x={pt.x - (chartWidth / (points.length * 2))}
                  y={padTop}
                  width={chartWidth / points.length}
                  height={chartHeight + 30}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredIndex(i)}
                />

                {/* Outer Glow Ring on Hover or Peak */}
                {(isHovered || isPeak) && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 11 : 8}
                    fill={isPeak ? 'rgba(63, 185, 80, 0.25)' : 'rgba(249, 115, 22, 0.25)'}
                  />
                )}

                {/* Point Circle */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 5.5 : isPeak ? 4.5 : 3.5}
                  fill={isPeak ? '#3fb950' : '#f97316'}
                  stroke="var(--chart-bg)"
                  strokeWidth="2"
                  style={{ transition: 'all 0.15s ease' }}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Detailed Month-by-Month Breakdown Table */}
      <div style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart2 size={16} color="var(--accent)" />
            Monthly Sales Breakdown
          </div>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
            12 Months Chronological Table
          </span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 60 }}>Sr. No</th>
                <th>Month</th>
                <th>Revenue</th>
                <th>Share of 12M Total</th>
                <th style={{ width: '35%' }}>Relative Strength</th>
              </tr>
            </thead>
            <tbody>
              {salesData.map((d, index) => {
                const sharePercent = total12MSales > 0
                  ? ((d.amount / total12MSales) * 100).toFixed(1)
                  : 0;
                const barPercent = rawMax > 0
                  ? Math.round((d.amount / rawMax) * 100)
                  : 0;
                const isMax = d.amount > 0 && d.amount === maxSaleItem.amount;

                return (
                  <tr
                    key={d.key}
                    style={{
                      background: hoveredIndex === index ? 'rgba(249,115,22,0.06)' : 'transparent',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <td>
                      <span style={{ color: 'var(--muted)' }}>{index + 1}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 500, color: isMax ? 'var(--green)' : 'var(--text)' }}>
                        {d.fullLabel}
                      </span>
                      {isMax && (
                        <span className="badge badge-green" style={{ marginLeft: 8, fontSize: 10 }}>
                          Peak
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{formatCurrency(d.amount)}</span>
                    </td>
                    <td style={{ color: 'var(--muted)' }}>
                      {sharePercent}%
                    </td>
                    <td>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}>
                        <div style={{
                          flex: 1,
                          height: 6,
                          background: 'var(--surface2)',
                          borderRadius: 3,
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${barPercent}%`,
                            height: '100%',
                            background: isMax ? 'var(--green)' : 'var(--accent)',
                            borderRadius: 3,
                            transition: 'width 0.4s ease'
                          }} />
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--muted)', width: 34 }}>
                          {barPercent}%
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
