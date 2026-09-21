import { useMemo } from "react";

function GroceryCardItem({ product, onSelect }) {
    const stockStatus = useMemo(() => {
        const stock = Number(product?.stock_quantity ?? 0);

        if (stock <= 0) {
            return {
                label: "Out of stock",
                color: "text-danger",
            };
        }

        if (stock < 10) {
            return {
                label: "Limited stocks!",
                color: "text-warning",
            };
        }

        return {
            label: "In stock",
            color: "text-success",
        };
    }, [product]);

    return (
        <article className="grocery-card h-100">
            <button
                className="grocery-card-button"
                type="button"
                data-bs-toggle="modal"
                data-bs-target="#itemDetailsModal"
                onClick={() => onSelect?.(product)}
                aria-label={`Open details for ${product?.name ?? "grocery item"}`}
            >
                <div className="grocery-card-image-wrap">
                    <img
                        className="grocery-card-image"
                        src={
                            product?.image_url ||
                            "https://placehold.co/300x200?text=No+Image"
                        }
                        alt={product?.name ?? "Grocery item"}
                    />
                    <span className="badge bg-light text-success grocery-card-category">
                        {product?.category_name ?? "Grocery"}
                    </span>
                </div>

                <div className="card-body">
                    <div className="d-flex m-2 justify-content-between">
                        <h5 className="m-0 p-0">
                            {product?.name ?? "Fresh Item"}
                        </h5>
                        <small className="text-success fw-bold">
                            ₱{Number(product?.price ?? 0).toFixed(2)}{" "}
                            <span className="text-muted">
                                / {product?.unit ?? "unit"}
                            </span>
                        </small>
                    </div>
                    <div className="grocery-card-description">
                        <small className=" text-muted mx-2">
                            {product?.description?.slice(0, 64) ||
                                "Fresh grocery essentials selected for your kitchen."}
                        </small>
                    </div>
                                    
                    <div className="m-2">
                        <span
                            className={`badge bg-success-subtle ${stockStatus.color}`}
                        >
                            {stockStatus.label}
                        </span>
                    </div>
                </div>
            </button>
        </article>
    );
}

export default GroceryCardItem;
