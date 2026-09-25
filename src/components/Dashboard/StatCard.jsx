import { DollarSign, ShoppingBag, AlertTriangle, UserPlus, TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ title, value, percentage, isUp, icon }) {
  // Select Lucide Icon based on prop
  const getIcon = () => {
    switch (icon) {
      case 'revenue':
        return <DollarSign style={{ width: 22, height: 22, color: '#10B981' }} />;
      case 'orders':
        return <ShoppingBag style={{ width: 22, height: 22, color: '#3B82F6' }} />;
      case 'canceled':
        return <AlertTriangle style={{ width: 22, height: 22, color: '#EF4444' }} />;
      case 'growth':
      default:
        return <UserPlus style={{ width: 22, height: 22, color: '#8B5CF6' }} />;
    }
  };

  return (
    <div className="card h-100 shadow-sm border-0">
      <div className="card-body d-flex align-items-center">
        <div className="stat-icon-wrapper">
          {getIcon()}
          <span className={`stat-check-badge ${isUp ? 'up' : 'down'}`}>
            {isUp ? <TrendingUp style={{ width: 10, height: 10 }} /> : <TrendingDown style={{ width: 10, height: 10 }} />}
          </span>
        </div>

        <div style={{ flex: 1 }}>
          <p className="stat-title">{title}</p>
          <h3 className="stat-value">{value}</h3>
          <p className={`stat-trend ${isUp ? 'up' : 'down'}`}>
            <span>{percentage}</span>
          </p>
        </div>
      </div>
    </div>
  );
}