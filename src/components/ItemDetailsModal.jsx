import { useEffect, useRef } from "react";
import GroceryCardItem from "./GroceryCardItem";

export default function ItemDetailsModal({
    product,
    onClose,
    quantity,
    onQuantityChange,
    onAddToCart,
}) {
    const modalRef = useRef(null);
    const isOutOfStock = Number(product?.stock_quantity ?? 0) <= 0;

    useEffect(() => {
        const modalElement = modalRef.current;
        if (!modalElement) return;

        const handleHidden = () => onClose?.();
        modalElement.addEventListener("hidden.bs.modal", handleHidden);

        return () =>
            modalElement.removeEventListener("hidden.bs.modal", handleHidden);
    }, [onClose]);

    const handleAdd = () => {
        if (!product || isOutOfStock) return;
        onAddToCart?.(product, quantity);
    };

    const relatedItems = [
        {
            id: 1,
            name: "Organic Bananas",
            description: "Fresh organic bananas from local farms.",
        },
        {
            id: 2,
            name: "Organic Apples",
            description: "Fresh organic apples from local farms.",
        },
        {
            id: 3,
            name: "Organic Grapes",
            description: "Fresh organic grapes from local farms.",
        },
    ];

    return (
        <div
            ref={modalRef}
            className="modal fade"
            id="itemDetailsModal"
            tabIndex="-1"
            aria-labelledby="itemDetailsModalLabel"
            aria-hidden="true"
        >
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content border-0 item-detail-modal">
                    <div className="modal-header border-0 pb-0">
                        <button
                            type="button"
                            className="btn-close"
                            data-bs-dismiss="modal"
                            aria-label="Close"
                        ></button>
                    </div>

                    <div className="modal-body p-4">
                        {product && (
                            <div className="row g-4 align-items-center">
                                <div className="col-md-5">
                                    <div className="item-detail-image-wrap">
                                        <img
                                            src={
                                                product.image_url ||
                                                "https://placehold.co/300x200?text=No+Image"
                                            }
                                            alt={product.name}
                                            className="item-detail-image"
                                        />
                                    </div>
                                </div>

                                <div className="col-md-7">
                                    <div className="item-detail-content">
                                        <span className="detail-modal-chip">
                                            {product?.category_name ||
                                                "Grocery"}
                                        </span>
                                        <h3 className="item-detail-title">
                                            {product.name}
                                        </h3>

                                        <p className="item-detail-description">
                                            {product.description ||
                                                "Fresh, quality grocery item selected for your kitchen."}
                                        </p>

                                        <div className="detail-price-row">
                                            <span className="detail-price">
                                                ₱
                                                {Number(
                                                    product.price ?? 0,
                                                ).toFixed(2)}
                                            </span>
                                            <span className="detail-price-unit">
                                                / {product.unit || "item"}
                                            </span>
                                        </div>
                                        <span className="text-muted">
                                            {Number(
                                                product.stock_quantity ?? 0,
                                            )}{" "}
                                            available
                                        </span>
                                        <div className="detail-quantity-row">
                                            <label className="detail-label">
                                                Quantity
                                            </label>
                                            <div className="detail-quantity-controls">
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary qty-button"
                                                    disabled={isOutOfStock}
                                                    onClick={() =>
                                                        onQuantityChange?.(
                                                            Math.max(
                                                                1,
                                                                quantity - 1,
                                                            ),
                                                        )
                                                    }
                                                >
                                                    −
                                                </button>
                                                <input
                                                    className="form-control quantity-input border-secondary"
                                                    type="number"
                                                    min="1"
                                                    max={Math.max(1, Number(product.stock_quantity ?? 1))}
                                                    value={isOutOfStock ? 0 : quantity}
                                                    onChange={(event) => {
                                                        if (isOutOfStock) return;

                                                        onQuantityChange?.(
                                                            Math.min(
                                                                Math.max(
                                                                    1,
                                                                    Number(
                                                                        event.target
                                                                            .value,
                                                                    ) || 1,
                                                                ),
                                                                Math.max(
                                                                    1,
                                                                    Number(
                                                                        product.stock_quantity ?? 1,
                                                                    ),
                                                                ),
                                                            ),
                                                        );
                                                    }}
                                                    aria-label="Quantity"
                                                    disabled={isOutOfStock}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary qty-button"
                                                    disabled={isOutOfStock}
                                                    onClick={() =>
                                                        onQuantityChange?.(
                                                            Math.min(
                                                                Math.max(
                                                                    1,
                                                                    Number(
                                                                        product.stock_quantity ?? 1,
                                                                    ),
                                                                ),
                                                                quantity + 1,
                                                            ),
                                                        )
                                                    }
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>

                                        <div className="detail-actions">
                                            <button
                                                type="button"
                                                className="btn btn-success w-100 fw-bold"
                                                data-bs-dismiss={isOutOfStock ? undefined : "modal"}
                                                onClick={handleAdd}
                                                disabled={isOutOfStock}
                                            >
                                                <span className="me-2">{isOutOfStock ? "!" : "+"}</span>
                                                {isOutOfStock ? "Out of stock" : "Add to cart"}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <h4>Related Items</h4>

                                <div className="row">
                                    {relatedItems.map((product) => (
                                        <div
                                            className="col-md-4"
                                            key={product.id}
                                        >
                                            <GroceryCardItem
                                                product={product}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
