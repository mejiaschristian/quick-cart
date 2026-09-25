import { AlertCircle } from 'lucide-react';

export default function ListWidget({ type, items = [] }) {
  const isExpiring = type === 'expiring';

  // Fallback static data if database returns empty lists during testing
  const fallbackExpiring = [
    { id: '#CM9801', item: 'Meat', extra: 'Sept 12' },
    { id: '#CM9802', item: 'Snacks', extra: 'Sept 10' },
    { id: '#CM9803', item: 'Meat', extra: 'Sept 15' },
  ];

  const fallbackLowStock = [
    { id: '#CM9801', item: 'Meat', extra: '12' },
    { id: '#CM9802', item: 'Snacks', extra: '10' },
    { id: '#CM9803', item: 'Meat', extra: '15' },
  ];

  const displayItems = (items && items.length > 0) 
    ? items 
    : (isExpiring ? fallbackExpiring : fallbackLowStock);

  return (
    <div className="card h-100 shadow-sm border-0">
      <div className="card-body">
      <div className="widget-header">
        <h3 className="widget-title">{isExpiring ? 'Expiring Goods' : 'Low stock'}</h3>
        <AlertCircle style={{ width: 20, height: 20, color: isExpiring ? '#F43F5E' : '#F59E0B' }} />
      </div>

      <div>
        <div className="table-header">
          <div>{isExpiring ? 'Batch ID' : 'Item ID'}</div>
          <div>Item</div>
          <div>{isExpiring ? 'Date' : 'Stock'}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {displayItems.map((row, index) => (
            <div key={index} className={`table-row ${index % 2 !== 0 ? 'alt' : ''}`}>
              <div className="id-cell">{row.id}</div>
              <div className="item-cell">{row.item}</div>
              <div className="extra-cell">
                {isExpiring && <span>📅</span>}
                {row.extra}
                {!isExpiring && <AlertCircle style={{ width: 14, height: 14, color: '#F59E0B', fill: '#F59E0B' }} />}
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}