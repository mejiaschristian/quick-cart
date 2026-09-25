import { useState } from 'react';
import { MoreVertical } from 'lucide-react';

// Dynamic color palette for categories and products
const BAR_COLORS = [
  '#10B981', // Emerald Green
  '#3B82F6', // Royal Blue
  '#EC4899', // Hot Pink
  '#F59E0B', // Amber Gold
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316'  // Coral Orange
];

export default function BarChartWidget({ 
  data, 
  timeframe, 
  onTimeframeChange, 
  selectedMonth, 
  onMonthChange, 
  selectedYear, 
  onYearChange 
}) {
  const [metricView, setMetricView] = useState('fulfillment');
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const fulfillmentData = data?.fulfillment ?? [];
  const categoryData    = data?.categories ?? [];
  const productData     = data?.products ?? [];
  const customerData    = data?.customers ?? [];

  const isTimeframeDisabled = metricView === 'categories' || metricView === 'products';
  const minChartWidth = timeframe === 'monthly' ? '700px' : '100%';

  return (
    <div className="card h-100 shadow-sm border-0">
      <div className="card-body">
      {/* UNIFIED HEADER */}
      <div 
        className="widget-header" 
        style={{ 
          marginBottom: '18px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'nowrap',
          gap: '16px' 
        }}
      >
        {/* STANDALONE TITLE */}
        <h3 className="widget-title" style={{ margin: 0, whiteSpace: 'nowrap' }}>
          Analytics Bar
        </h3>

        {/* CONTROLS GROUP */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          
          {/* METRIC SELECTOR */}
          <select 
            value={metricView} 
            onChange={(e) => setMetricView(e.target.value)}
            style={{
              padding: '5px 10px',
              fontSize: '11px',
              fontWeight: 600,
              fontFamily: 'Poppins, sans-serif',
              borderRadius: '6px',
              border: '1px solid #D1D5DB',
              color: '#1F2937',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              cursor: 'pointer',
              outline: 'none',
              maxWidth: '150px'
            }}
          >
            <option value="fulfillment">Fulfillment Volume</option>
            <option value="categories">Top Categories</option>
            <option value="products">Top Products</option>
            <option value="customers">Customer Growth</option>
          </select>

          {/* ADAPTIVE CALENDAR CONTROL */}
          {timeframe === 'monthly' ? (
            <select
              value={selectedYear}
              onChange={(e) => onYearChange(e.target.value)}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 600,
                fontFamily: 'Poppins, sans-serif',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
                color: '#374151',
                backgroundColor: '#FFFFFF',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          ) : (
            <input 
              type="month" 
              value={selectedMonth} 
              onChange={(e) => onMonthChange(e.target.value)}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 600,
                fontFamily: 'Poppins, sans-serif',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
                color: '#374151',
                backgroundColor: '#FFFFFF',
                cursor: 'pointer',
                outline: 'none'
              }}
            />
          )}

          {/* TIMEFRAME DROPDOWN */}
          <select 
            value={timeframe} 
            disabled={isTimeframeDisabled}
            onChange={(e) => onTimeframeChange(e.target.value)}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 600,
              fontFamily: 'Poppins, sans-serif',
              borderRadius: '6px',
              border: isTimeframeDisabled ? '1px solid #E5E7EB' : '1px solid #10B981',
              color: isTimeframeDisabled ? '#9CA3AF' : '#059669',
              backgroundColor: isTimeframeDisabled ? '#F3F4F6' : '#ECFDF5',
              cursor: isTimeframeDisabled ? 'not-allowed' : 'pointer',
              outline: 'none',
              opacity: isTimeframeDisabled ? 0.65 : 1
            }}
          >
            <option value="daily">Daily View</option>
            <option value="weekly">Weekly View</option>
            <option value="monthly">Monthly View</option>
          </select>

          <MoreVertical style={{ width: 18, height: 18, color: '#9CA3AF', cursor: 'pointer' }} />
        </div>
      </div>

      {/* CHART SCROLL AREA */}
      <div style={{ overflowX: 'auto', paddingBottom: '4px' }}>
        <div style={{ minWidth: minChartWidth }}>
          
          {metricView === 'fulfillment' && (
            <GroupedBarChart 
              items={fulfillmentData} 
              hoveredIdx={hoveredIdx} 
              setHoveredIdx={setHoveredIdx} 
            />
          )}

          {metricView === 'categories' && (
            <SingleValueBarChart 
              items={categoryData} 
              unit="$" 
              hoveredIdx={hoveredIdx} 
              setHoveredIdx={setHoveredIdx} 
            />
          )}

          {metricView === 'products' && (
            <SingleValueBarChart 
              items={productData} 
              unit="pcs" 
              hoveredIdx={hoveredIdx} 
              setHoveredIdx={setHoveredIdx} 
            />
          )}

          {metricView === 'customers' && (
            <SingleValueBarChart 
              items={customerData} 
              singleColor="#6366F1"
              unit="users" 
              hoveredIdx={hoveredIdx} 
              setHoveredIdx={setHoveredIdx} 
            />
          )}

        </div>
      </div>

      {/* LOWERED LEGEND FOR FULFILLMENT VOLUME */}
      {metricView === 'fulfillment' && (
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '20px', 
            fontSize: '11px', 
            fontWeight: 600, 
            marginTop: '20px',
            paddingTop: '8px'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669' }}>
            <span style={{ width: 10, height: 10, borderRadius: '2px', backgroundColor: '#10B981' }}></span>
            Delivery
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2563EB' }}>
            <span style={{ width: 10, height: 10, borderRadius: '2px', backgroundColor: '#3B82F6' }}></span>
            Pickup
          </span>
        </div>
      )}

      </div>
    </div>
  );
}

// Sub-Component 1: Grouped Dual-Bar Chart
function GroupedBarChart({ items, hoveredIdx, setHoveredIdx }) {
  const maxVal = Math.max(...items.map(d => Math.max(d.delivery ?? 0, d.pickup ?? 0)), 5);

  return (
    <div style={{ position: 'relative', marginTop: '6px' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: '26px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 1, pointerEvents: 'none' }}>
        <div style={{ borderBottom: '1px dashed #F3F4F6', width: '100%' }}></div>
        <div style={{ borderBottom: '1px dashed #F3F4F6', width: '100%' }}></div>
        <div style={{ borderBottom: '1px dashed #F3F4F6', width: '100%' }}></div>
        <div style={{ borderBottom: '1px solid #E5E7EB', width: '100%' }}></div>
      </div>

      <div style={{ height: '190px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', position: 'relative', zIndex: 2, padding: '0 10px' }}>
        {items.map((item, idx) => {
          const delH = Math.max(((item.delivery ?? 0) / maxVal) * 130, item.delivery > 0 ? 10 : 3);
          const pickH = Math.max(((item.pickup ?? 0) / maxVal) * 130, item.pickup > 0 ? 10 : 3);
          const isHovered = hoveredIdx === idx;

          return (
            <div 
              key={idx} 
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end', position: 'relative', cursor: 'pointer' }}
            >
              {isHovered && (
                <div 
                  style={{ 
                    position: 'absolute', 
                    top: '2px', 
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#111827', 
                    color: '#FFFFFF', 
                    padding: '3px 8px', 
                    borderRadius: '6px', 
                    fontSize: '10px', 
                    fontWeight: 600, 
                    zIndex: 25, 
                    whiteSpace: 'nowrap', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    pointerEvents: 'none'
                  }}
                >
                  {item.delivery} Delivery · {item.pickup} Pickup
                </div>
              )}

              <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '135px' }}>
                <div 
                  style={{ 
                    width: '16px', 
                    height: `${delH}px`, 
                    backgroundColor: item.delivery > 0 ? '#10B981' : '#E5E7EB', 
                    borderRadius: '3px 3px 0 0', 
                    transition: 'all 0.25s ease',
                    opacity: isHovered ? 1 : 0.85 
                  }} 
                />
                <div 
                  style={{ 
                    width: '16px', 
                    height: `${pickH}px`, 
                    backgroundColor: item.pickup > 0 ? '#3B82F6' : '#E5E7EB', 
                    borderRadius: '3px 3px 0 0', 
                    transition: 'all 0.25s ease',
                    opacity: isHovered ? 1 : 0.85 
                  }} 
                />
              </div>

              <span style={{ marginTop: '8px', fontSize: '11px', fontWeight: 600, color: isHovered ? '#111827' : '#6B7280' }}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Sub-Component 2: Single Value Bar Chart (Supports Multi-Color Bars)
function SingleValueBarChart({ items, unit, singleColor, hoveredIdx, setHoveredIdx }) {
  const maxVal = Math.max(...items.map(d => Number(d.value) || 0), 10);

  return (
    <div style={{ position: 'relative', marginTop: '6px' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: '26px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 1, pointerEvents: 'none' }}>
        <div style={{ borderBottom: '1px dashed #F3F4F6', width: '100%' }}></div>
        <div style={{ borderBottom: '1px dashed #F3F4F6', width: '100%' }}></div>
        <div style={{ borderBottom: '1px dashed #F3F4F6', width: '100%' }}></div>
        <div style={{ borderBottom: '1px solid #E5E7EB', width: '100%' }}></div>
      </div>

      <div style={{ height: '190px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', position: 'relative', zIndex: 2, padding: '0 10px' }}>
        {items.map((item, idx) => {
          const numericVal = Number(item.value) || 0;
          const barH = Math.max((numericVal / maxVal) * 130, numericVal > 0 ? 10 : 3);
          const isHovered = hoveredIdx === idx;
          
          // Use item-specific color or single color fallback
          const barColor = singleColor ? singleColor : BAR_COLORS[idx % BAR_COLORS.length];

          return (
            <div 
              key={idx} 
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                flex: '1 1 0px',
                maxWidth: '85px',
                height: '100%',
                justifyContent: 'flex-end',
                position: 'relative', 
                cursor: 'pointer' 
              }}
            >
              {isHovered && (
                <div 
                  style={{ 
                    position: 'absolute', 
                    top: '2px', 
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#111827', 
                    color: '#FFFFFF', 
                    padding: '3px 8px', 
                    borderRadius: '6px', 
                    fontSize: '10px', 
                    fontWeight: 600, 
                    zIndex: 25, 
                    whiteSpace: 'nowrap', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    pointerEvents: 'none'
                  }}
                >
                  {unit === '$' ? `$${numericVal.toFixed(2)}` : `${numericVal} ${unit}`}
                </div>
              )}

              <div style={{ height: '135px', display: 'flex', alignItems: 'flex-end' }}>
                <div 
                  style={{ 
                    width: '26px', 
                    height: `${barH}px`, 
                    backgroundColor: numericVal > 0 ? barColor : '#E5E7EB', 
                    borderRadius: '5px 5px 0 0', 
                    transition: 'all 0.25s ease',
                    opacity: isHovered ? 1 : 0.85 
                  }} 
                />
              </div>

              <span style={{ marginTop: '8px', fontSize: '11px', fontWeight: 600, color: isHovered ? '#111827' : '#6B7280', maxWidth: '75px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}