import React from "react";

function CategoryCardItem({ category }) {
    return (
        <div className="card text-center">
            <div className="card-img-top">
                <img
                    src={
                        category.image_url ||
                        "https://placehold.co/150x100?text=No+Image"
                    }
                    alt={category.name ?? "Category"}
                />
            </div>
            <h4 className="card-title">{category.name}</h4>
            <small className="card-text text-muted">
                {category.description}
            </small>
        </div>
    );
}

export default CategoryCardItem;
