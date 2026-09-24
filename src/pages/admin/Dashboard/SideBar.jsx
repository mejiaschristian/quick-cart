import { Home, List, Box, Package, BarChart2, User, Users } from 'lucide-react';

export default function SideBar() {
  const menuItems = [
    { name: 'Dashboard', icon: Home, active: true },
    { name: 'Order List', icon: List, active: false },
    { name: 'Inventory', icon: Box, active: false },
    { name: 'Products', icon: Package, active: false },
    { name: 'Analytics', icon: BarChart2, active: false },
    { name: 'Customer Account', icon: User, active: false },
    { name: 'Employee Account', icon: Users, active: false },
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <h2 className="brand-logo">
          Qcart<span className="brand-dot">.</span>
        </h2>
        <p className="brand-subtitle">Admin Dashboard</p>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.name}
              href="#"
              className={`nav-item ${item.active ? 'active' : ''}`}
            >
              <Icon className="nav-icon" />
              {item.name}
            </a>
          );
        })}
      </nav>
    </aside>
  );
}