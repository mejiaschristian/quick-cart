function CategoryCardItem({ category, isSelected, onSelect }) {
    return (
        <label
            className={`category-card ${isSelected ? "category-card-selected" : ""}`}
            aria-label={`Filter products by ${category.name ?? "category"}`}
        >
            <input
                className="form-check-input category-card-radio"
                type="radio"
                name="category-filter"
                checked={Boolean(isSelected)}
                onChange={() => onSelect?.(category.category_id)}
            />

            <div className="category-card-text">
                <span className="category-card-title">{category.name}</span>
                <small>{category.description}</small>
            </div>
        </label>
    );
}

export default CategoryCardItem;
