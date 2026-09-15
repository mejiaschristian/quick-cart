import { useMemo } from "react";

function GroceryCardItem({ product, onSelect }) {
    const stockStatus = useMemo(() => {
        const stock = Number(product?.stock_quantity ?? 0);
        if (stock <= 0) return "Out of stock";
        if (stock < 10) return "Low stock";
        return "In stock";
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
                    <span className="grocery-card-category">
                        {product?.category_name ?? "Grocery"}
                    </span>
                </div>

                <div className="grocery-card-body">
                    <div className="grocery-card-top">
                        <h4 className="grocery-card-title">
                            {product?.name ?? "Fresh Item"}
                        </h4>
                        <span className="grocery-card-price">
                            ₱{Number(product?.price ?? 0).toFixed(2)} {" "}
                            <span className="text-muted">/ {product?.unit ?? "unit"}</span>
                        </span>
                    </div>
                    <p className="grocery-card-description">
                        {product?.description?.slice(0, 64) ||
                            "Fresh grocery essentials selected for your kitchen."}
                    </p>

                    <div className="grocery-card-bottom">
                        <span
                            className={`grocery-card-stock ${stockStatus === "Out of stock" ? "text-danger" : ""}`}
                        >
                            {stockStatus}
                        </span>
                    </div>
                </div>
            </button>
        </article>
    );
}

export default GroceryCardItem;
