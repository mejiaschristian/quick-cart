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

function OrderCard({ order }) {
    return (
        <article className="card border-0 shadow-sm h-100">
            <div className="card-body">
                <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                    <div>
                        <h2 className="h5 mb-1">
                            Order #{order.transaction_id}
                        </h2>
                        <small className="text-body-secondary">
                            {new Date(order.created_at).toLocaleString()}
                        </small>
                    </div>
                    <span
                        className={`badge ${statusClass(order.order_status)}`}
                    >
                        {formatStatus(order.order_status)}
                    </span>
                </div>

                <div className="small text-body-secondary mb-3">
                    <div>
                        {order.fulfillment_type === "delivery"
                            ? "Delivery"
                            : "Pickup"}
                    </div>
                    {order.delivery_address && (
                        <div>{order.delivery_address}</div>
                    )}
                </div>

                <div className="border-top pt-3">
                    {order.items?.map((item) => (
                        <div
                            className="d-flex justify-content-between gap-3 small mb-2"
                            key={`${order.transaction_id}-${item.product_id}`}
                        >
                            <span>
                                {item.name} x {item.quantity}
                            </span>
                            <span>
                                ₱
                                {Number(
                                    item.unit_price * item.quantity,
                                ).toFixed(2)}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="d-flex justify-content-between border-top pt-3 mt-3">
                    <span className="text-body-secondary">Payment</span>
                    <span className="text-capitalize">
                        {order.payment_method} ({order.payment_status})
                    </span>
                </div>
                <div className="d-flex justify-content-between mt-2 fw-bold">
                    <span>Total</span>
                    <span>₱{Number(order.total_amount).toFixed(2)}</span>
                </div>
            </div>
        </article>
    );
}

function Orders() {
    const [orders, setOrders] = useState([]);
    const [filter, setFilter] = useState("pending");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch("http://localhost/quickcart-api/orders.php", {
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
                    Account
                </p>
                <h1 className="h2 mb-2">My Orders</h1>
                <p className="text-body-secondary mb-0">
                    Track pending, completed, and cancelled orders.
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
                <div className="row g-4">
                    {visibleOrders.map((order) => (
                        <div className="col-lg-6" key={order.transaction_id}>
                            <OrderCard order={order} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Orders;
