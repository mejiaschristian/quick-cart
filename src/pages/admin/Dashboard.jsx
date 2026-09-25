import { useEffect, useState } from "react";
import "./Dashboard.css";
import StatCard from "../../components/Dashboard/StatCard";
import PieChartWidget from "../../components/Dashboard/PieChartWidget";
import BarChartWidget from "../../components/Dashboard/BarChartWidget";
import ListWidget from "../../components/Dashboard/ListWidget";
import { useAuth } from "../../context/useAuth";

export default function Dashboard() {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState("weekly"); // 'daily' | 'weekly' | 'monthly'
    const [selectedMonth, setSelectedMonth] = useState("2026-09"); // YYYY-MM
    const [selectedYear, setSelectedYear] = useState("2026"); // YYYY

    useEffect(() => {
        let isMounted = true;

        // Previously this request carried no query params at all, so changing
        // the timeframe/month/year controls just re-fetched identical,
        // unfiltered data — the backend had nothing to filter by.
        const params = new URLSearchParams({
            timeframe,
            month: selectedMonth,
            year: selectedYear,
        });

        fetch(
            `http://localhost/quickcart-api/get_dashboard_data.php?${params}`,
        )
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
            <div
                className="d-flex justify-content-center align-items-center"
                style={{ height: "100vh" }}
            >
                <h2>Loading QuickCart Dashboard...</h2>
            </div>
        );
    }

    // Data-driven instead of four near-identical <StatCard /> calls.
    const statCards = [
        {
            title: "Real Revenue (Paid)",
            value: data?.stats?.real_revenue ?? "$0.00",
            percentage: data?.stats?.paid_orders ?? "0 Paid Orders",
            isUp: true,
            icon: "revenue",
        },
        {
            title: "Expected Revenue",
            value: data?.stats?.expected_revenue ?? "$0.00",
            percentage: data?.stats?.unpaid_orders ?? "0 Unpaid Orders",
            isUp: true,
            icon: "orders",
        },
        {
            title: "Total Lost Revenue",
            value: data?.stats?.total_lost ?? "$0.00",
            percentage: data?.stats?.lost_subtext ?? "Cancelled & Spoiled",
            isUp: false,
            icon: "canceled",
        },
        {
            title: "Total Customers",
            value: data?.stats?.total_customers ?? "0 Customers",
            percentage:
                data?.stats?.customer_subtext ?? "Registered Accounts",
            isUp: true,
            icon: "growth",
        },
    ];

    return (
        <main className="container-fluid p-4">
            <p className="text-success text-uppercase fw-bold small mb-1">
                Dashboard
            </p>
            <h2 className="mb-2">Greetings, {user?.full_name || "User"}!</h2>
            <p className="text-body-secondary mb-4">
                Welcome back to QuickCart Admin!
            </p>

            <div className="background-image-container">
                <div className="row g-3">
                    {statCards.map((card) => (
                        <div className="col-sm-6 col-xl-3" key={card.title}>
                            <StatCard {...card} />
                        </div>
                    ))}
                </div>

                <div className="row g-4 mt-1">
                    <div className="col-lg-8">
                        <PieChartWidget data={data?.pieChart} />
                    </div>
                    <div className="col-lg-4">
                        <ListWidget
                            type="expiring"
                            items={data?.expiringGoods}
                        />
                    </div>
                </div>

                <div className="row g-4 mt-1">
                    <div className="col-lg-8">
                        <BarChartWidget
                            data={data?.barChart}
                            timeframe={timeframe}
                            onTimeframeChange={handleTimeframeChange}
                            selectedMonth={selectedMonth}
                            onMonthChange={handleMonthChange}
                            selectedYear={selectedYear}
                            onYearChange={handleYearChange}
                        />
                    </div>
                    <div className="col-lg-4">
                        <ListWidget type="lowstock" items={data?.lowStock} />
                    </div>
                </div>
            </div>
        </main>
    );
}