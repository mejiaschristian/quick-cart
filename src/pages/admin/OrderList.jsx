import { useEffect, useMemo, useState } from "react";

const pendingStatuses = new Set([
    "pending",
    "processing",
    "packed",
    "out_for_delivery",
]);

// Utility functions for order status handling Update -09/23/26
const statusOptions = ["pending", "completed", "cancelled"];

function normalizeStatus(status) {
    const value = String(status ?? "pending")
        .trim()
        .toLowerCase();
    const normalizedValue = value === "canceled" ? "cancelled" : value;
    return statusOptions.includes(normalizedValue)
        ? normalizedValue
        : "pending";
}

function formatStatus(status) {
    const normalizedStatus = normalizeStatus(status);
    const displayValue =
        normalizedStatus === "cancelled" ? "Canceled" : normalizedStatus;

    return displayValue
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

// End of utility functions for order status handling Update -09/23/26

function statusClass(status) {
    if (status === "completed") return "text-bg-success";
    if (status === "cancelled") return "text-bg-danger";
    return "text-bg-warning";
}

function OrderList() {
    const [orders, setOrders] = useState([]);
    const [filter, setFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingId, setUpdatingId] = useState(null);

    const loadOrders = () => {
        fetch("http://localhost/quickcart-api/admin_orders.php", {
            credentials: "include",
        })
            .then((response) => response.json())
            .then((data) => {
                if (!data.success) {
                    throw new Error(data.error || "Unable to load orders.");
                }
                setOrders(data.orders ?? []);
            })
            .catch((requestError) => setError(requestError.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadOrders();
    }, []);

    const handleStatusChange = async (transactionId, nextStatus) => {
        const normalizedStatus = normalizeStatus(nextStatus);
        if (!transactionId || !normalizedStatus) return;

        setUpdatingId(transactionId);
        setError("");

        try {
            const response = await fetch(
                "http://localhost/quickcart-api/admin_orders.php",
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        action: "update_order_status",
                        transaction_id: transactionId,
                        order_status: normalizedStatus,
                    }),
                },
            );

            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.error || "Unable to update order status.");
            }

            setOrders((currentOrders) =>
                currentOrders.map((order) =>
                    order.transaction_id === transactionId
                        ? { ...order, order_status: normalizedStatus }
                        : order,
                ),
            );
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setUpdatingId(null);
        }
    };

    const visibleOrders = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        const filteredByStatus = (() => {
            if (filter === "all") {
                return orders.filter(
                    (order) =>
                        order.order_status &&
                        String(order.order_status).trim() !== "",
                );
            }
            if (filter === "completed") {
                return orders.filter(
                    (order) => order.order_status === "completed",
                );
            }
            if (filter === "cancelled") {
                return orders.filter(
                    (order) => order.order_status === "cancelled",
                );
            }
            return orders.filter((order) =>
                pendingStatuses.has(order.order_status),
            );
        })();

        if (!normalizedSearch) {
            return filteredByStatus;
        }

        return filteredByStatus.filter((order) => {
            const customerName = (order.customer_name || "").toLowerCase();
            const customerEmail = (order.customer_email || "").toLowerCase();
            return (
                customerName.includes(normalizedSearch) ||
                customerEmail.includes(normalizedSearch)
            );
        });
    }, [filter, orders, searchTerm]);

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

            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div
                    className="btn-group"
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

                <div style={{ minWidth: 220, maxWidth: 320, width: "100%" }}>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search by customer name"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                    />
                </div>
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
                <div className="table-responsive shadow-sm admin-order-table-wrap">
                    <table className="table table-hover align-middle mb-0 admin-order-table">
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
                                        <div className="d-flex align-items-center gap-2">
                                            <span
                                                className={`badge ${statusClass(order.order_status)}`}
                                            >
                                                {formatStatus(
                                                    order.order_status,
                                                )}
                                            </span>
                                            <select
                                                className="form-select form-select-sm w-auto"
                                                value={normalizeStatus(
                                                    order.order_status,
                                                )}
                                                onChange={(event) =>
                                                    handleStatusChange(
                                                        order.transaction_id,
                                                        event.target.value,
                                                    )
                                                }
                                                disabled={
                                                    updatingId ===
                                                    order.transaction_id
                                                }
                                                aria-label={`Change status for order ${order.transaction_id}`}
                                            >
                                                {statusOptions.map((status) => (
                                                    <option
                                                        key={status}
                                                        value={status}
                                                    >
                                                        {formatStatus(status)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
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
