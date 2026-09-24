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

function OrderCard({ order, onRetryPayment, onCancelOrder }) {
    const canActOnPendingPayRexOrder =
        order.order_status === "pending" &&
        order.payment_method === "payrex" &&
        order.payment_status === "pending";

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

                {canActOnPendingPayRexOrder && (
                    <div className="d-flex gap-2 mt-3">
                        <button
                            type="button"
                            className="btn btn-success btn-sm flex-fill"
                            onClick={() => onRetryPayment?.(order)}
                        >
                            Proceed payment
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => onCancelOrder?.(order)}
                        >
                            Cancel order
                        </button>
                    </div>
                )}
            </div>
        </article>
    );
}

function Orders() {
    const [orders, setOrders] = useState([]);
    const [filter, setFilter] = useState("pending");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const refreshOrders = () => {
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
    };

    useEffect(() => {
        refreshOrders();
    }, []);

    const handleRetryPayment = async (order) => {
        try {
            const response = await fetch(
                "http://localhost/quickcart-api/orders.php",
                {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "retry_payment",
                        transaction_id: order.transaction_id,
                    }),
                },
            );

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || "Unable to retry payment.");
            }

            window.location.href = data.url;
        } catch (requestError) {
            setError(requestError.message);
        }
    };

    const handleCancelOrder = async (order) => {
        const confirmed = window.confirm(
            "Cancel this pending order? This will mark the payment as failed.",
        );

        if (!confirmed) return;

        try {
            const response = await fetch(
                "http://localhost/quickcart-api/orders.php",
                {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "cancel_order",
                        transaction_id: order.transaction_id,
                    }),
                },
            );

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || "Unable to cancel order.");
            }

            setOrders((currentOrders) =>
                currentOrders.map((currentOrder) =>
                    currentOrder.transaction_id === order.transaction_id
                        ? {
                              ...currentOrder,
                              order_status: "cancelled",
                              payment_status: "failed",
                          }
                        : currentOrder,
                ),
            );
        } catch (requestError) {
            setError(requestError.message);
        }
    };

    const visibleOrders = useMemo(() => {
        if (filter === "all") {
            return orders.filter(
                (order) =>
                    order.order_status &&
                    String(order.order_status).trim() !== "",
            );
        }
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
                    ["all", "All Orders"],
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
                            <OrderCard
                                order={order}
                                onRetryPayment={handleRetryPayment}
                                onCancelOrder={handleCancelOrder}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Orders;
