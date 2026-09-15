import { useEffect, useMemo, useState } from "react";

const pendingStatuses = new Set([
    "pending",
    "processing",
    "packed",
    "out_for_delivery",
]);

function formatStatus(status) {
    return String(status || "pending")
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

function statusClass(status) {
    if (status === "completed") return "text-bg-success";
    if (status === "cancelled") return "text-bg-danger";
    return "text-bg-warning";
}

function OrderList() {
    const [orders, setOrders] = useState([]);
    const [filter, setFilter] = useState("pending");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch("http://localhost/quickcart-api/admin_orders.php", {
            credentials: "include",
        })
            .then((response) => response.json())
            .then((data) => {
                if (!data.success)
                    throw new Error(data.error || "Unable to load orders.");
                setOrders(data.orders ?? []);
            })
            .catch((requestError) => setError(requestError.message))
            .finally(() => setLoading(false));
    }, []);

    const visibleOrders = useMemo(() => {
        if (filter === "completed") {
            return orders.filter((order) => order.order_status === "completed");
        }
        if (filter === "cancelled") {
            return orders.filter((order) => order.order_status === "cancelled");
        }
        return orders.filter((order) =>
            pendingStatuses.has(order.order_status),
        );
    }, [filter, orders]);

    return (
        <div className="container py-4">
            <div className="mb-4">
                <p className="text-success text-uppercase fw-bold small mb-1">
                    Sales
                </p>
                <h1 className="h2 mb-2">Order List</h1>
                <p className="text-body-secondary mb-0">
                    Review customer orders and fulfillment status.
                </p>
            </div>

            <div
                className="btn-group mb-4"
                role="group"
                aria-label="Order status filter"
            >
                {[
                    ["pending", "Pending"],
                    ["completed", "Completed"],
                    ["cancelled", "Cancelled"],
                ].map(([value, label]) => (
                    <button
                        className={`btn ${filter === value ? "btn-success" : "btn-outline-success"}`}
                        key={value}
                        type="button"
                        onClick={() => setFilter(value)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {loading && <p>Loading orders...</p>}
            {!loading && error && (
                <div className="alert alert-danger">{error}</div>
            )}
            {!loading && !error && visibleOrders.length === 0 && (
                <div className="alert alert-light border">
                    No {filter} orders found.
                </div>
            )}
            {!loading && !error && visibleOrders.length > 0 && (
                <div className="table-responsive bg-white shadow-sm rounded">
                    <table className="table table-hover align-middle mb-0">
                        <thead>
                            <tr>
                                <th>Order</th>
                                <th>Customer</th>
                                <th>Fulfillment</th>
                                <th>Payment</th>
                                <th>Status</th>
                                <th>Total</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleOrders.map((order) => (
                                <tr key={order.transaction_id}>
                                    <td>
                                        <strong>#{order.transaction_id}</strong>
                                        <div className="small text-body-secondary">
                                            {order.items?.length ?? 0} item(s)
                                        </div>
                                    </td>
                                    <td>
                                        <div>{order.customer_name}</div>
                                        <small className="text-body-secondary">
                                            {order.customer_email}
                                        </small>
                                    </td>
                                    <td className="text-capitalize">
                                        {order.fulfillment_type}
                                        {order.delivery_address && (
                                            <div className="small text-body-secondary">
                                                {order.delivery_address}
                                            </div>
                                        )}
                                    </td>
                                    <td className="text-capitalize">
                                        {order.payment_method}
                                        <div className="small text-body-secondary">
                                            {order.payment_status}
                                        </div>
                                    </td>
                                    <td>
                                        <span
                                            className={`badge ${statusClass(order.order_status)}`}
                                        >
                                            {formatStatus(order.order_status)}
                                        </span>
                                    </td>
                                    <td>
                                        ₱{Number(order.total_amount).toFixed(2)}
                                    </td>
                                    <td>
                                        {new Date(
                                            order.created_at,
                                        ).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default OrderList;
