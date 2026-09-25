import { useState } from 'react';
import { MoreVertical } from 'lucide-react';

export default function PieChartWidget({ data }) {
  const [showChart, setShowChart] = useState(true);
  const [showValue, setShowValue] = useState(true);

  // Selector state for middle ring
  const [middleMetric, setMiddleMetric] = useState('category'); // 'category' | 'payment' | 'delivery'

  // Safely extract payload properties with default fallbacks
  const fulfillment = data?.fulfillment ?? { completedPct: 0, processingPct: 50, pendingPct: 50, completed: 0, processing: 1, pending: 1 };
  const categoryMix = data?.categoryMix ?? { topCategory: "Meat", topPct: 100, othersPct: 0 };
  const paymentMethods = data?.paymentMethods ?? { cashPct: 0, digitalPct: 100 };
  const deliveryTypes = data?.deliveryTypes ?? { deliveryPct: 50, pickupPct: 50 };
  const revRatio = data?.revenueRatio ?? { paidPct: 50, unpaidPct: 50, paidAmount: "$249.00", unpaidAmount: "$250.00" };

  // Calculate dominant payment method (e.g. 100% Digital)
  const isDigitalDominant = paymentMethods.digitalPct >= paymentMethods.cashPct;
  const dominantPaymentLabel = isDigitalDominant ? "Digital" : "Cash";
  const dominantPaymentPct = isDigitalDominant ? paymentMethods.digitalPct : paymentMethods.cashPct;

  return (
    <div className="card h-100 shadow-sm border-0">
      <div className="card-body">
      {/* Widget Header */}
      <div className="widget-header" style={{ marginBottom: '16px' }}>
        <h3 className="widget-title">Performance Analytics</h3>

        <div className="widget-actions">
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              checked={showChart} 
              onChange={(e) => setShowChart(e.target.checked)} 
            />
            <span>Chart</span>
          </label>

          <label className="checkbox-label">
            <input 
              type="checkbox" 
              checked={showValue} 
              onChange={(e) => setShowValue(e.target.checked)} 
            />
            <span>Show Value</span>
          </label>
          <MoreVertical style={{ width: 18, height: 18, color: '#9CA3AF', cursor: 'pointer' }} />
        </div>
      </div>

      {/* 3 Donut Rings Layout */}
      <div 
        className="donut-grid" 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '20px', 
          alignItems: 'start' 
        }}
      >
        
        {/* RING 1: 3-COLOR ORDER FULFILLMENT STATUS */}
        <TripleDonutChart 
          completedPct={fulfillment.completedPct}
          processingPct={fulfillment.processingPct}
          pendingPct={fulfillment.pendingPct}
          completedCount={fulfillment.completed}
          processingCount={fulfillment.processing}
          pendingCount={fulfillment.pending}
          showChart={showChart}
          showValue={showValue}
        />

        {/* RING 2: INTERACTIVE MIDDLE RING WITH DROPDOWN ABOVE IT */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          <select 
            value={middleMetric} 
            onChange={(e) => setMiddleMetric(e.target.value)}
            style={{
              marginBottom: '10px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: '600',
              fontFamily: 'Poppins, sans-serif',
              borderRadius: '8px',
              border: '1px solid #D1D5DB',
              color: '#1F2937',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="category">Category Mix</option>
            <option value="payment">Payment Method</option>
            <option value="delivery">Fulfillment Type</option>
          </select>

          {/* Category Mix */}
          {middleMetric === 'category' && (
            <DualDonutChart 
              firstPct={categoryMix.topPct}
              secondPct={categoryMix.othersPct}
              firstColor="#831843" 
              secondColor="#777e8b" 
              firstLabel={`● ${categoryMix.topCategory}: ${categoryMix.topPct}%`}
              secondLabel={`● Other Categories: ${categoryMix.othersPct}%`}
              title="Category Share"
              showChart={showChart}
              showValue={showValue}
              centerText={`${categoryMix.topPct}%`}
              subText={categoryMix.topCategory}
            />
          )}

          {/* Payment Method */}
          {middleMetric === 'payment' && (
            <DualDonutChart 
              firstPct={paymentMethods.digitalPct}
              secondPct={paymentMethods.cashPct}
              firstColor="#0D9488" 
              secondColor="#E11D48" 
              firstLabel={`● Digital: ${paymentMethods.digitalPct}%`}
              secondLabel={`● Cash: ${paymentMethods.cashPct}%`}
              title="Payment Breakdown"
              showChart={showChart}
              showValue={showValue}
              centerText={`${dominantPaymentPct}%`}
              subText={dominantPaymentLabel}
            />
          )}

          {/* Delivery Types */}
          {middleMetric === 'delivery' && (
            <DualDonutChart 
              firstPct={deliveryTypes.deliveryPct}
              secondPct={deliveryTypes.pickupPct}
              firstColor="#7C3AED" 
              secondColor="#EA580C" 
              firstLabel={`● Delivery: ${deliveryTypes.deliveryPct}%`}
              secondLabel={`● Pickup: ${deliveryTypes.pickupPct}%`}
              title="Delivery vs Pickup"
              showChart={showChart}
              showValue={showValue}
              centerText={`${deliveryTypes.deliveryPct}%`}
              subText="Delivery"
            />
          )}
        </div>

        {/* RING 3: PAID VS UNPAID REVENUE */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '29px' }}>
          <DualDonutChart 
            firstPct={revRatio.paidPct}
            secondPct={revRatio.unpaidPct}
            firstColor="#2563EB" 
            secondColor="#EF4444" 
            firstLabel={`● Paid: ${revRatio.paidAmount} (${revRatio.paidPct}%)`}
            secondLabel={`● Unpaid: ${revRatio.unpaidAmount} (${revRatio.unpaidPct}%)`}
            title="Paid vs Unpaid"
            showChart={showChart}
            showValue={showValue}
            centerText={`${revRatio.paidPct}%`}
            subText="Paid"
          />
        </div>

      </div>
      </div>
    </div>
  );
}

// 1. Triple-Color Segmented Ring for Order Fulfillment
function TripleDonutChart({ completedPct, processingPct, pendingPct, completedCount, processingCount, pendingCount, showChart, showValue }) {
  const p1 = completedPct;
  const p2 = completedPct + processingPct;

  const chartStyle = {
    background: showChart 
      ? `conic-gradient(#10B981 0% ${p1}%, #3B82F6 ${p1}% ${p2}%, #F59E0B ${p2}% 100%)` 
      : '#F3F4F6'
  };

  return (
    <div className="donut-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '29px' }}>
      <div className="donut-chart" style={chartStyle}>
        <div className="donut-hole" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {showValue ? (
            <>
              <span style={{ fontWeight: 700, fontSize: '13px', color: '#10B981' }}>{completedPct}%</span>
              <span style={{ fontSize: '9px', color: '#6B7280', fontWeight: 600 }}>Completed</span>
            </>
          ) : '•'}
        </div>
      </div>

      <p className="donut-label" style={{ fontWeight: 700, fontSize: '12px', color: '#111827', marginTop: '8px' }}>Fulfillment Status</p>

      <div style={{ marginTop: '4px', fontSize: '10px', textAlign: 'center', lineHeight: '1.3' }}>
        <div style={{ color: '#059669', fontWeight: 600 }}>● Completed: {completedCount} ({completedPct}%)</div>
        <div style={{ color: '#2563EB', fontWeight: 600 }}>● Processing: {processingCount} ({processingPct}%)</div>
        <div style={{ color: '#D97706', fontWeight: 600 }}>● Pending: {pendingCount} ({pendingPct}%)</div>
      </div>
    </div>
  );
}

// 2. Dual-Segment Donut
function DualDonutChart({ firstPct, firstColor, secondColor, firstLabel, secondLabel, title, showChart, showValue, centerText, subText }) {
  const chartStyle = {
    background: showChart 
      ? `conic-gradient(${firstColor} 0% ${firstPct}%, ${secondColor} ${firstPct}% 100%)` 
      : '#F3F4F6'
  };

  return (
    <div className="donut-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="donut-chart" style={chartStyle}>
        <div className="donut-hole" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {showValue ? (
            <>
              <span style={{ fontWeight: 700, fontSize: '13px', color: '#1F2937' }}>{centerText}</span>
              <span style={{ fontSize: '9px', color: '#6B7280', fontWeight: 600 }}>{subText}</span>
            </>
          ) : '•'}
        </div>
      </div>

      <p className="donut-label" style={{ fontWeight: 700, fontSize: '12px', color: '#111827', marginTop: '8px' }}>{title}</p>

      <div style={{ marginTop: '4px', fontSize: '10px', textAlign: 'center', lineHeight: '1.3' }}>
        <div style={{ color: firstColor === '#E5E7EB' ? '#4B5563' : firstColor, fontWeight: 600 }}>{firstLabel}</div>
        <div style={{ color: secondColor === '#E5E7EB' ? '#6B7280' : secondColor, fontWeight: 600 }}>{secondLabel}</div>
      </div>
    </div>
  );
}