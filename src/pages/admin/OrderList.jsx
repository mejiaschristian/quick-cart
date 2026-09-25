import { useEffect, useMemo, useState } from "react";

const defaultStatusOptions = [
    "pending",
    "processing",
    "completed",
    "cancelled",
];
const defaultPaymentStatusOptions = ["pending", "paid", "failed"];

function normalizeStatus(status, allowedStatuses = defaultStatusOptions) {
    const value = String(status ?? "pending")
        .trim()
        .toLowerCase();
    const normalizedValue = value === "canceled" ? "cancelled" : value;

    return allowedStatuses.includes(normalizedValue)
        ? normalizedValue
        : allowedStatuses.includes("pending")
          ? "pending"
          : (allowedStatuses[0] ?? "pending");
}

function normalizePaymentStatus(
    status,
    allowedStatuses = defaultPaymentStatusOptions,
) {
    const value = String(status ?? "pending")
        .trim()
        .toLowerCase();
    const normalizedValue = value === "canceled" ? "failed" : value;

    return allowedStatuses.includes(normalizedValue)
        ? normalizedValue
        : allowedStatuses.includes("pending")
          ? "pending"
          : (allowedStatuses[0] ?? "pending");
}

function formatStatus(status) {
    const normalizedStatus = normalizeStatus(status, defaultStatusOptions);
    const displayValue =
        normalizedStatus === "cancelled" ? "Canceled" : normalizedStatus;

    return displayValue
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

function formatPaymentStatus(status) {
    const normalizedStatus = normalizePaymentStatus(
        status,
        defaultPaymentStatusOptions,
    );
    const displayValue =
        normalizedStatus === "failed" ? "Failed" : normalizedStatus;

    return displayValue
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

function statusClass(status) {
    if (status === "completed") return "bg-success";
    if (status === "cancelled") return "bg-danger";
    if (status === "processing") return "bg-primary";
    return "text-bg-warning";
}

function OrderCard({
    order,
    statusOptions,
    paymentStatusOptions,
    updatingId,
    onStatusChange,
    onPaymentStatusChange,
    paymentUpdatingId,
}) {
    const currentStatus = normalizeStatus(order.order_status, statusOptions);
    const currentPaymentStatus = normalizePaymentStatus(
        order.payment_status,
        paymentStatusOptions,
    );
    const isCashOrder =
        String(order.payment_method || "")
            .trim()
            .toLowerCase() === "cash";

    return (
        <article className="card border-0 shadow-sm h-100">
            <div className="card-body d-flex flex-column gap-3">
                <div className="d-flex justify-content-between align-items-start gap-3">
                    <div>
                        <p className="small text-uppercase text-body-secondary mb-1">
                            Order
                        </p>
                        <h2 className="h5 mb-0">#{order.transaction_id}</h2>
                    </div>
                    <span className={`badge ${statusClass(currentStatus)}`}>
                        {formatStatus(currentStatus)}
                    </span>
                </div>

                <div className="row g-3">
                    <div className="col-md-6">
                        <p className="small text-uppercase text-body-secondary mb-2">
                            Customer
                        </p>
                        <div className="fw-semibold">{order.customer_name}</div>
                        <div className="small text-body-secondary">
                            {order.customer_email}
                        </div>
                    </div>

                    <div className="col-md-6">
                        <p className="small text-uppercase text-body-secondary mb-2">
                            Delivery
                        </p>
                        <div className="text-capitalize">
                            {order.fulfillment_type || "pickup"}
                        </div>
                        {order.delivery_address && (
                            <div className="small text-body-secondary">
                                {order.delivery_address}
                            </div>
                        )}
                    </div>
                </div>

                <div className="border rounded p-3 bg-light-subtle">
                    <p className="small text-uppercase text-body-secondary mb-2">
                        Order details
                    </p>
                    {order.items?.length ? (
                        order.items.map((item) => (
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
                        ))
                    ) : (
                        <div className="small text-body-secondary">
                            No items listed.
                        </div>
                    )}
                </div>

                <div className="row g-2 small text-body-secondary">
                    <div className="col-sm-6">
                        <div>Payment</div>
                        <div className="text-capitalize text-dark">
                            {order.payment_method || "N/A"}
                        </div>
                    </div>
                    <div className="col-sm-6">
                        <div>Payment status</div>
                        {isCashOrder ? (
                            <select
                                className="form-select form-select-sm"
                                value={currentPaymentStatus}
                                onChange={(event) =>
                                    onPaymentStatusChange(
                                        order.transaction_id,
                                        event.target.value,
                                    )
                                }
                                disabled={
                                    paymentUpdatingId === order.transaction_id
                                }
                                aria-label={`Change payment status for order ${order.transaction_id}`}
                            >
                                {paymentStatusOptions.map((status) => (
                                    <option key={status} value={status}>
                                        {formatPaymentStatus(status)}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div className="text-capitalize text-dark">
                                {order.payment_status || "N/A"}
                            </div>
                        )}
                    </div>
                    <div className="col-sm-6">
                        <div>Placed</div>
                        <div className="text-dark">
                            {new Date(order.created_at).toLocaleString()}
                        </div>
                    </div>
                    <div className="col-sm-6">
                        <div>Total</div>
                        <div className="fw-bold text-dark">
                            ₱{Number(order.total_amount).toFixed(2)}
                        </div>
                    </div>
                </div>

                <div className="mt-auto pt-3 border-top">
                    <label
                        className="form-label small text-body-secondary mb-2"
                        htmlFor={`status-${order.transaction_id}`}
                    >
                        Update status
                    </label>
                    <select
                        id={`status-${order.transaction_id}`}
                        className="form-select"
                        value={currentStatus}
                        onChange={(event) =>
                            onStatusChange(
                                order.transaction_id,
                                event.target.value,
                            )
                        }
                        disabled={updatingId === order.transaction_id}
                        aria-label={`Change status for order ${order.transaction_id}`}
                    >
                        {statusOptions.map((status) => (
                            <option key={status} value={status}>
                                {formatStatus(status)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </article>
    );
}

function OrderList() {
    const [orders, setOrders] = useState([]);
    const [statusOptions, setStatusOptions] = useState(defaultStatusOptions);
    const [filter, setFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingId, setUpdatingId] = useState(null);
    const [paymentUpdatingId, setPaymentUpdatingId] = useState(null);

    const filterOptions = useMemo(
        () => [
            { value: "all", label: "All Orders" },
            ...statusOptions.map((status) => ({
                value: status,
                label: formatStatus(status),
            })),
        ],
        [statusOptions],
    );

    const loadOrders = () => {
        fetch("http://localhost/quickcart-api/admin_orders.php", {
            credentials: "include",
        })
            .then((response) => response.json())
            .then((data) => {
                if (!data.success) {
                    throw new Error(data.error || "Unable to load orders.");
                }

                const nextStatusOptions = Array.isArray(data.status_options)
                    ? data.status_options.filter(Boolean)
                    : defaultStatusOptions;
                const nextPaymentStatusOptions = Array.isArray(
                    data.payment_status_options,
                )
                    ? data.payment_status_options.filter(Boolean)
                    : defaultPaymentStatusOptions;

                setStatusOptions(
                    nextStatusOptions.length > 0
                        ? nextStatusOptions
                        : defaultStatusOptions,
                );
                setOrders(data.orders ?? []);
            })
            .catch((requestError) => setError(requestError.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadOrders();
    }, []);

    const handleStatusChange = async (transactionId, nextStatus) => {
        const normalizedStatus = normalizeStatus(nextStatus, statusOptions);
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
                        ? {
                              ...order,
                              order_status:
                                  data.order_status || normalizedStatus,
                          }
                        : order,
                ),
            );

            if (
                Array.isArray(data.status_options) &&
                data.status_options.length
            ) {
                setStatusOptions(data.status_options);
            }
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setUpdatingId(null);
        }
    };

    const handlePaymentStatusChange = async (transactionId, nextStatus) => {
        const normalizedStatus = normalizePaymentStatus(
            nextStatus,
            defaultPaymentStatusOptions,
        );
        if (!transactionId || !normalizedStatus) return;

        setPaymentUpdatingId(transactionId);
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
                        action: "update_payment_status",
                        transaction_id: transactionId,
                        payment_status: normalizedStatus,
                    }),
                },
            );

            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(
                    data.error || "Unable to update payment status.",
                );
            }

            setOrders((currentOrders) =>
                currentOrders.map((order) =>
                    order.transaction_id === transactionId
                        ? {
                              ...order,
                              payment_status:
                                  data.payment_status || normalizedStatus,
                          }
                        : order,
                ),
            );
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setPaymentUpdatingId(null);
        }
    };

    const visibleOrders = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        const filteredByStatus = orders.filter((order) => {
            if (filter === "all") {
                return (
                    order.order_status &&
                    String(order.order_status).trim() !== ""
                );
            }

            return (
                normalizeStatus(order.order_status, statusOptions) === filter
            );
        });

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
    }, [filter, orders, searchTerm, statusOptions]);

    return (
        <div className="container py-4">
            <div className="mb-4">
                <p className="text-success text-uppercase fw-bold small mb-1">
                    Sales
                </p>
                <h1 className="h2 mb-2">Order List</h1>
                <p className="text-body-secondary mb-0">
                    Review customer orders and update the fulfillment status for
                    each order.
                </p>
            </div>

            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div
                    className="btn-group flex-wrap"
                    role="group"
                    aria-label="Order status filter"
                >
                    {filterOptions.map(({ value, label }) => (
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
                        placeholder="Search by customer name or email"
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
                    No {filter === "all" ? "orders" : formatStatus(filter)}{" "}
                    orders found.
                </div>
            )}
            {!loading && !error && visibleOrders.length > 0 && (
                <div className="row g-4">
                    {visibleOrders.map((order) => (
                        <div className="col-xl-6" key={order.transaction_id}>
                            <OrderCard
                                order={order}
                                statusOptions={statusOptions}
                                paymentStatusOptions={
                                    defaultPaymentStatusOptions
                                }
                                updatingId={updatingId}
                                onStatusChange={handleStatusChange}
                                onPaymentStatusChange={
                                    handlePaymentStatusChange
                                }
                                paymentUpdatingId={paymentUpdatingId}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default OrderList;
