import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

function readCart() {
    try {
        const value = localStorage.getItem("quickcart_cart");
        return value ? JSON.parse(value) : [];
    } catch {
        return [];
    }
}

function readCheckoutResult() {
    return new URLSearchParams(window.location.search).get("checkout");
}

function Cart() {
    const [items, setItems] = useState(() =>
        readCheckoutResult() === "success" ? [] : readCart(),
    );
    const [fulfillmentType, setFulfillmentType] = useState("delivery");
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState("");
    const [addressError, setAddressError] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("payrex");
    const [checkoutMessage, setCheckoutMessage] = useState(() => {
        const checkoutResult = readCheckoutResult();
        if (checkoutResult === "success") {
            return "Payment received! Your order is being processed.";
        }
        if (checkoutResult === "cancel") {
            return "Checkout was cancelled. Your cart is still here.";
        }
        return "";
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const loadAddresses = async () => {
            try {
                const response = await fetch(
                    "http://localhost/quickcart-api/addresses.php",
                    {
                        credentials: "include",
                    },
                );
                const data = await response.json();

                if (!data.success) {
                    setAddressError(data.error || "Unable to load addresses.");
                    return;
                }

                const loadedAddresses = data.addresses ?? [];
                setAddresses(loadedAddresses);

                const defaultAddress = loadedAddresses.find(
                    (address) => address.is_default,
                );
                setSelectedAddressId(
                    defaultAddress?.address_id ??
                        loadedAddresses[0]?.address_id ??
                        "",
                );
            } catch {
                setAddressError("Unable to load saved addresses.");
            }
        };

        loadAddresses();
    }, []);

    // Handle the redirect PayRex sends the customer back to after checkout.
    // The webhook (server-to-server) is the source of truth for whether the
    // payment actually succeeded — this is just for showing the right message
    // and clearing a cart that's now been paid for.
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const checkoutResult = params.get("checkout");

        if (checkoutResult === "success") {
            localStorage.removeItem("quickcart_cart");
        }

        if (checkoutResult) {
            params.delete("checkout");
            params.delete("order");
            const newSearch = params.toString();
            window.history.replaceState(
                {},
                "",
                window.location.pathname + (newSearch ? `?${newSearch}` : ""),
            );
        }
    }, []);

    const subtotal = useMemo(
        () =>
            items.reduce(
                (sum, item) => sum + Number(item.price) * Number(item.quantity),
                0,
            ),
        [items],
    );

    const updateQuantity = (productId, nextQuantity) => {
        const cart = readCart();
        const target = cart.find((item) => item.product_id === productId);
        if (!target) return;

        target.quantity = Math.max(1, Number(nextQuantity) || 1);
        localStorage.setItem("quickcart_cart", JSON.stringify(cart));
        setItems(cart);
    };

    const removeItem = (productId) => {
        const cart = readCart().filter((item) => item.product_id !== productId);
        localStorage.setItem("quickcart_cart", JSON.stringify(cart));
        setItems(cart);
    };

    const handleCheckout = async () => {
        if (isSubmitting) return; // avoid double-clicks creating duplicate pending orders

        setCheckoutMessage("");

        if (fulfillmentType === "delivery" && !selectedAddressId) {
            setCheckoutMessage(
                "Please choose a delivery address before checking out.",
            );
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch(
                "http://localhost/quickcart-api/payrex_create_checkout.php",
                {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        cart: items.map((i) => ({
                            product_id: i.product_id,
                            quantity: i.quantity,
                        })),
                        fulfillmentType, // "delivery" | "pickup"
                        selectedAddressId, // required for delivery
                        paymentMethod,
                    }),
                },
            );

            const data = await res.json();

            if (data.success) {
                localStorage.removeItem("quickcart_cart");
                setItems([]);

                if (data.url) {
                    window.location.href = data.url;
                    return; // leaving the page — don't clear isSubmitting
                }

                window.location.href = `/orders?checkout=success&order=${data.transaction_id ?? ""}`;
                return;
            }

            setCheckoutMessage(
                data.error || "Checkout failed. Please try again.",
            );
        } catch {
            setCheckoutMessage("Could not reach the server. Please try again.");
        }

        setIsSubmitting(false);
    };

    return (
        <div className="container py-4">
            <div className="mb-4">
                <p className="text-success text-uppercase fw-bold small mb-1">
                    Shopping Cart
                </p>
                <h1 className="h2 mb-2">My Cart</h1>
            </div>

            {items.length === 0 ? (
                <div className="empty-cart">
                    <div className="empty-cart-icon">🛒</div>
                    <h3>Your cart is empty</h3>
                    <p>Add fresh groceries from the grocery page.</p>
                    {checkoutMessage && (
                        <div className="checkout-message mt-3">
                            {checkoutMessage}
                        </div>
                    )}
                </div>
            ) : (
                <div className="row g-4">
                    <div className="col-lg-8">
                        <div className="cart-list">
                            {items.map((item) => (
                                <div className="cart-row" key={item.product_id}>
                                    <div className="cart-row-image-wrap">
                                        <img
                                            className="cart-row-image"
                                            src={
                                                item.image_url ||
                                                "https://placehold.co/160x120?text=Grocery"
                                            }
                                            alt={item.name}
                                        />
                                    </div>

                                    <div className="cart-row-details">
                                        <div className="cart-row-title">
                                            {item.name}
                                        </div>
                                        <div className="cart-row-meta">
                                            <span>
                                                ₱{Number(item.price).toFixed(2)}
                                            </span>
                                            <span>{item.unit}</span>
                                        </div>

                                        <div className="cart-qty">
                                            <button
                                                type="button"
                                                className="qty-button mini"
                                                onClick={() =>
                                                    updateQuantity(
                                                        item.product_id,
                                                        item.quantity - 1,
                                                    )
                                                }
                                            >
                                                −
                                            </button>
                                            <input
                                                className="quantity-input mini"
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(event) =>
                                                    updateQuantity(
                                                        item.product_id,
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                            <button
                                                type="button"
                                                className="qty-button mini"
                                                onClick={() =>
                                                    updateQuantity(
                                                        item.product_id,
                                                        item.quantity + 1,
                                                    )
                                                }
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    <div className="cart-row-actions">
                                        <div className="cart-row-total">
                                            ₱
                                            {(
                                                Number(item.price) *
                                                Number(item.quantity)
                                            ).toFixed(2)}
                                        </div>
                                        <button
                                            className="btn btn-sm btn-outline-danger"
                                            type="button"
                                            onClick={() =>
                                                removeItem(item.product_id)
                                            }
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="cart-fulfillment">
                            <div className="cart-fulfillment-title">
                                Fulfillment type
                            </div>
                            <div className="cart-fulfillment-options">
                                <label className="fulfillment-option">
                                    <input
                                        type="radio"
                                        name="fulfillment_type"
                                        value="delivery"
                                        checked={fulfillmentType === "delivery"}
                                        onChange={() =>
                                            setFulfillmentType("delivery")
                                        }
                                    />
                                    <span>Delivery</span>
                                </label>
                                <label className="fulfillment-option">
                                    <input
                                        type="radio"
                                        name="fulfillment_type"
                                        value="pickup"
                                        checked={fulfillmentType === "pickup"}
                                        onChange={() =>
                                            setFulfillmentType("pickup")
                                        }
                                    />
                                    <span>Pickup</span>
                                </label>
                            </div>

                            {fulfillmentType === "delivery" && (
                                <div className="delivery-address-panel">
                                    <div className="delivery-address-title">
                                        Delivery address
                                    </div>

                                    {addressError && (
                                        <div className="text-danger small">
                                            {addressError}
                                        </div>
                                    )}

                                    {addresses.length === 0 ? (
                                        <div className="text-muted small">
                                            No saved addresses found. Add one in
                                            your profile. 
                                            <Link className="d-block m-2 btn btn-outline-success" to="/profile">
                                                + Add Address
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="address-list">
                                            {addresses.map((address) => (
                                                <label
                                                    className="address-option"
                                                    key={address.address_id}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="selected_address"
                                                        value={
                                                            address.address_id
                                                        }
                                                        checked={
                                                            String(
                                                                selectedAddressId,
                                                            ) ===
                                                            String(
                                                                address.address_id,
                                                            )
                                                        }
                                                        onChange={() =>
                                                            setSelectedAddressId(
                                                                address.address_id,
                                                            )
                                                        }
                                                    />
                                                    <span>
                                                        <strong>
                                                            {
                                                                address.recipient_name
                                                            }
                                                        </strong>
                                                        <span className="address-line">
                                                            {
                                                                address.address_line
                                                            }
                                                            , {address.city},{" "}
                                                            {address.province}{" "}
                                                            {address.postal_code ||
                                                                ""}
                                                        </span>
                                                        {address.is_default && (
                                                            <span className="default-address">
                                                                Default
                                                            </span>
                                                        )}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="col-lg-4">
                        <aside className="cart-summary">
                            <div className="cart-summary-title">
                                Cart Summary
                            </div>
                            <div className="cart-summary-line">
                                <span>Subtotal</span>
                                <span>₱{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="cart-summary-line">
                                <span>Delivery</span>
                                <span>₱0.00</span>
                            </div>
                            <div className="cart-summary-line total">
                                <span>Total</span>
                                <span>₱{subtotal.toFixed(2)}</span>
                            </div>

                            <div className="payment-panel">
                                <div className="payment-panel-title">
                                    Payment method
                                </div>
                                <label className="payment-option">
                                    <input
                                        type="radio"
                                        name="payment_method"
                                        value="payrex"
                                        checked={paymentMethod === "payrex"}
                                        onChange={() =>
                                            setPaymentMethod("payrex")
                                        }
                                    />
                                    <span>
                                        <img
                                            className="img-fluid"
                                            src="/payrex-social-card.png"
                                            width="180"
                                            alt="PayRex"
                                        />
                                    </span>
                                </label>

                                {fulfillmentType === "pickup" && (
                                    <label className="payment-option">
                                        <input
                                            type="radio"
                                            name="payment_method"
                                            value="cash"
                                            checked={paymentMethod === "cash"}
                                            onChange={() =>
                                                setPaymentMethod("cash")
                                            }
                                        />
                                        <span>Cash on pickup</span>
                                    </label>
                                )}
                            </div>

                            {checkoutMessage && (
                                <div className="checkout-message">
                                    {checkoutMessage}
                                </div>
                            )}

                            <button
                                className="btn btn-success w-100 checkout-btn"
                                type="button"
                                onClick={handleCheckout}
                                disabled={isSubmitting}
                            >
                                {isSubmitting
                                    ? "Processing..."
                                    : paymentMethod === "payrex"
                                      ? "Checkout with PayRex"
                                      : "Checkout with Cash on Pickup"}
                            </button>
                        </aside>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Cart;
