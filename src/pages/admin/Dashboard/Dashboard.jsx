import { useEffect, useState } from 'react';
import './Dashboard.css';
import SideBar from './SideBar';
import StatCard from './StatCard';
import PieChartWidget from './PieChartWidget';
import BarChartWidget from './BarChartWidget';
import ListWidget from './ListWidget';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('weekly');    // 'daily' | 'weekly' | 'monthly'
  const [selectedMonth, setSelectedMonth] = useState('2026-09'); // YYYY-MM
  const [selectedYear, setSelectedYear] = useState('2026');       // YYYY

  useEffect(() => {
    let isMounted = true;

    fetch(`http://localhost/quickcart-api/get_dashboard_data.php?timeframe=${timeframe}&month=${selectedMonth}&year=${selectedYear}`)
      .then((res) => res.json())
      .then((result) => {
        if (isMounted) {
          if (result.success) {
            setData(result);
          } else {
            console.error("Backend Error:", result.error);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Fetch Error:", err);
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [timeframe, selectedMonth, selectedYear]);

  const handleTimeframeChange = (newTimeframe) => {
    if (newTimeframe !== timeframe) {
      setLoading(true);
      setTimeframe(newTimeframe);
    }
  };

  const handleMonthChange = (newMonth) => {
    if (newMonth !== selectedMonth) {
      setLoading(true);
      setSelectedMonth(newMonth);
    }
  };

  const handleYearChange = (newYear) => {
    if (newYear !== selectedYear) {
      setLoading(true);
      setSelectedYear(newYear);
    }
  };

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'Poppins, sans-serif' }}>
        <h2>Loading QuickCart Dashboard...</h2>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <SideBar />
      
      <div className="dashboard-main-area">
        <main className="dashboard-content">
          
          <div className="header-text-area">
            <h1 className="welcome-title">Dashboard</h1>
            <p className="welcome-subtitle">Hi, LeBron. Welcome back to QuickCart Admin!</p>
          </div>

          <div className="background-image-container">
            
            {/* Stat Cards Grid */}
            <div className="stats-grid">
              <StatCard 
                title="Real Revenue (Paid)" 
                value={data?.stats?.real_revenue ?? "$0.00"} 
                percentage={data?.stats?.paid_orders ?? "0 Paid Orders"} 
                isUp={true} 
                icon="revenue" 
              />
              <StatCard 
                title="Expected Revenue" 
                value={data?.stats?.expected_revenue ?? "$0.00"} 
                percentage={data?.stats?.unpaid_orders ?? "0 Unpaid Orders"} 
                isUp={true} 
                icon="orders" 
              />
              <StatCard 
                title="Total Lost Revenue" 
                value={data?.stats?.total_lost ?? "$0.00"} 
                percentage={data?.stats?.lost_subtext ?? "Cancelled & Spoiled"} 
                isUp={false} 
                icon="canceled" 
              />
              <StatCard 
                title="Total Customers" 
                value={data?.stats?.total_customers ?? "0 Customers"} 
                percentage={data?.stats?.customer_subtext ?? "Registered Accounts"} 
                isUp={true} 
                icon="growth" 
              />
            </div>

            {/* Lower Widgets */}
            <div className="dashboard-body">
              <div className="dashboard-row">
                <PieChartWidget data={data?.pieChart} />
                <ListWidget type="expiring" items={data?.expiringGoods} />
              </div>

              <div className="dashboard-row">
                <BarChartWidget 
                  data={data?.barChart} 
                  timeframe={timeframe} 
                  onTimeframeChange={handleTimeframeChange}
                  selectedMonth={selectedMonth}
                  onMonthChange={handleMonthChange}
                  selectedYear={selectedYear}
                  onYearChange={handleYearChange}
                />
                <ListWidget type="lowstock" items={data?.lowStock} />
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}