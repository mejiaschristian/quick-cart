
import { Search, Bell, MessageSquare, Gift, Settings } from 'lucide-react';

export default function Header() {
  return (
    <> <header className="header">
      <div className="search-box">
        <input type="text" placeholder="Search here" className="search-input" />
        <Search className="search-icon" />
      </div>

      <div className="header-actions">
        <div className="icon-group">
          <ActionIcon icon={Bell} badge="21" bg="#EFF6FF" color="#3B82F6" />
          <ActionIcon icon={MessageSquare} badge="53" bg="#ECFEFF" color="#06B6D4" />
          <ActionIcon icon={Gift} badge="15" bg="#EEF2FF" color="#6366F1" />
          <ActionIcon icon={Settings} badge="19" bg="#FFF1F2" color="#F43F5E" />
        </div>

        <div className="user-profile">
          <div style={{ fontSize: '14px' }}>
            <span style={{ color: '#6B7280' }}>Hello, </span>
            <span style={{ fontWeight: 600, color: '#374151' }}>LeBron</span>
          </div>
          <img 
            src="https://i.pravatar.cc/150?u=lebron" 
            alt="Profile" 
            className="user-avatar"
          />
        </div>
      </div>
    </header></>
   
  );
}

function ActionIcon({ icon: Icon, badge, bg, color }) {
  return (
    <div className="action-icon-btn" style={{ backgroundColor: bg }}>
      <Icon style={{ width: 20, height: 20, color: color }} />
      <span className="icon-badge">{badge}</span>
    </div>
  );
}