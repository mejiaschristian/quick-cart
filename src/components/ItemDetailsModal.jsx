import { useEffect, useState } from "react";
import { Modal } from "bootstrap";

export default function ItemDetailsModal({ product, onClose, onAddToCart }) {
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        setQuantity(1);
    }, [product?.product_id]);

    if (!product) return null;

    const handleAdd = () => {
        onAddToCart?.(product, quantity);
        const modalElement = document.getElementById("itemDetailsModal");
        if (modalElement) {
            Modal.getOrCreateInstance(modalElement).hide();
        }
        onClose?.();
    };

    return (
        <div
            className="modal fade"
            id="itemDetailsModal"
            tabIndex="-1"
            aria-labelledby="itemDetailsModalLabel"
            aria-hidden="true"
        >
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content border-0 item-detail-modal">
                    <div className="modal-header border-0 pb-0">
                        <span className="detail-modal-chip">
                            {product.category_name || "Grocery"}
                        </span>
                        <button
                            type="button"
                            className="btn-close"
                            data-bs-dismiss="modal"
                            aria-label="Close"
                            onClick={onClose}
                        ></button>
                    </div>

                    <div className="modal-body p-4">
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
                                    <div className="d-flex align-items-center justify-content-between gap-3">
                                        <span className="detail-type-label">
                                            {product.unit || "unit"}
                                        </span>
                                        <span className="detail-stock-label">
                                            {Number(
                                                product.stock_quantity ?? 0,
                                            )}{" "}
                                            available
                                        </span>
                                    </div>

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
                                            {Number(product.price ?? 0).toFixed(
                                                2,
                                            )}
                                        </span>
                                        <span className="detail-price-unit">
                                            / {product.unit || "item"}
                                        </span>
                                    </div>

                                    <div className="detail-quantity-row">
                                        <label className="detail-label">
                                            Quantity
                                        </label>
                                        <div className="detail-quantity-controls">
                                            <button
                                                type="button"
                                                className="qty-button"
                                                onClick={() =>
                                                    setQuantity((current) =>
                                                        Math.max(
                                                            1,
                                                            current - 1,
                                                        ),
                                                    )
                                                }
                                            >
                                                −
                                            </button>
                                            <input
                                                className="quantity-input"
                                                type="number"
                                                min="1"
                                                value={quantity}
                                                onChange={(event) =>
                                                    setQuantity(
                                                        Math.max(
                                                            1,
                                                            Number(
                                                                event.target
                                                                    .value,
                                                            ) || 1,
                                                        ),
                                                    )
                                                }
                                            />
                                            <button
                                                type="button"
                                                className="qty-button"
                                                onClick={() =>
                                                    setQuantity((current) =>
                                                        Math.min(
                                                            99,
                                                            current + 1,
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
                                            className="btn btn-success detail-add"
                                            onClick={handleAdd}
                                        >
                                            <span className="me-2">+</span>
                                            Add to cart
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
