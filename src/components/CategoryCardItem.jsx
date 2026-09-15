function CategoryCardItem({ category }) {
    return (
        <div className="category-card card text-center d-flex flex-row align-items-center justify-content-center">
            <div className="card-img">
                <img
                    src={
                        category.image_url ||
                        "https://placehold.co/130x80?text=No+Image"
                    }
                    alt={category.name ?? "Category"}
                />
            </div>
            <div className="container">
                <p className="card-title fw-bold">{category.name}</p>
                <small className="card-text text-muted">
                    {category.description}
                </small>
            </div>
        </div>
    );
}

export default CategoryCardItem;
