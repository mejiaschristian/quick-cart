import { useState } from "react";

export default function AddProductModal({
    categories,
    form,
    saving,
    onChange,
    onSubmit,
    onCreateCategory,
    mode = "add",
}) {
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [categoryForm, setCategoryForm] = useState({
        name: "",
        description: "",
    });
    const [categorySaving, setCategorySaving] = useState(false);
    const [categoryError, setCategoryError] = useState("");

    const handleCategoryFieldChange = (event) => {
        const { name, value } = event.target;
        setCategoryForm((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const handleCreateCategory = async (event) => {
        event.preventDefault();
        setCategoryError("");

        const trimmedName = categoryForm.name.trim();
        if (!trimmedName) {
            setCategoryError("Category name is required.");
            return;
        }

        setCategorySaving(true);

        try {
            const response = await fetch(
                "http://localhost/quickcart-api/categories.php",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        name: trimmedName,
                        description: categoryForm.description.trim(),
                    }),
                },
            );

            const data = await response.json();
            if (!response.ok || !data.success) {
                setCategoryError(data.error || "Unable to create category.");
                return;
            }

            if (typeof onCreateCategory === "function") {
                onCreateCategory(data.category);
            }

            setCategoryForm({ name: "", description: "" });
            setShowCategoryForm(false);
        } catch {
            setCategoryError("Unable to create category.");
        } finally {
            setCategorySaving(false);
        }
    };

    return (
        <div
            className="modal fade"
            id="addProductModal"
            tabIndex="-1"
            aria-labelledby="addProductModalLabel"
            aria-hidden="true"
        >
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                    <form onSubmit={onSubmit}>
                        <div className="modal-header">
                            <h5
                                className="modal-title"
                                id="addProductModalLabel"
                            >
                                {mode === "edit" ? "Edit product" : "Add product"}
                            </h5>
                            <button
                                type="button"
                                className="btn-close"
                                data-bs-dismiss="modal"
                                aria-label="Close"
                            ></button>
                        </div>

                        <div className="modal-body">
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">
                                        Product name
                                    </label>
                                    <input
                                        className="form-control"
                                        name="name"
                                        type="text"
                                        value={form.name}
                                        onChange={onChange}
                                        required
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">
                                        Category
                                    </label>
                                    <div className="input-group">
                                        <select
                                            className="form-select"
                                            name="category_id"
                                            value={form.category_id}
                                            onChange={onChange}
                                            required
                                        >
                                            <option value="">
                                                Choose category
                                            </option>
                                            {categories.map((category) => (
                                                <option
                                                    key={category.category_id}
                                                    value={category.category_id}
                                                >
                                                    {category.name}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            className="btn btn-outline-success"
                                            type="button"
                                            onClick={() =>
                                                setShowCategoryForm((value) => !value)
                                            }
                                        >
                                            + Category
                                        </button>
                                    </div>

                                    {showCategoryForm && (
                                        <div className="border rounded p-3 mt-3 bg-light">
                                            <div className="row g-2">
                                                <div className="col-md-6">
                                                    <label className="form-label small fw-semibold">
                                                        Category name
                                                    </label>
                                                    <input
                                                        className="form-control"
                                                        name="name"
                                                        type="text"
                                                        value={categoryForm.name}
                                                        onChange={
                                                            handleCategoryFieldChange
                                                        }
                                                        placeholder="e.g. Fruits"
                                                    />
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label small fw-semibold">
                                                        Category description
                                                    </label>
                                                    <input
                                                        className="form-control"
                                                        name="description"
                                                        type="text"
                                                        value={
                                                            categoryForm.description
                                                        }
                                                        onChange={
                                                            handleCategoryFieldChange
                                                        }
                                                        placeholder="e.g. Fresh produce"
                                                    />
                                                </div>
                                            </div>

                                            {categoryError && (
                                                <div className="alert alert-danger py-2 mt-2 mb-0">
                                                    {categoryError}
                                                </div>
                                            )}

                                            <div className="d-flex justify-content-end gap-2 mt-3">
                                                <button
                                                    className="btn btn-outline-secondary btn-sm"
                                                    type="button"
                                                    onClick={() => {
                                                        setCategoryForm({
                                                            name: "",
                                                            description: "",
                                                        });
                                                        setCategoryError("");
                                                        setShowCategoryForm(false);
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    className="btn btn-success btn-sm"
                                                    type="button"
                                                    onClick={handleCreateCategory}
                                                    disabled={categorySaving}
                                                >
                                                    {categorySaving
                                                        ? "Creating..."
                                                        : "Save category"}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="col-md-12">
                                    <label className="form-label fw-semibold">
                                        Description
                                    </label>
                                    <textarea
                                        className="form-control"
                                        name="description"
                                        rows="3"
                                        value={form.description}
                                        onChange={onChange}
                                    ></textarea>
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">
                                        Unit
                                    </label>
                                    <select
                                        className="form-select"
                                        name="unit"
                                        value={form.unit}
                                        onChange={onChange}
                                    >
                                        <option value="kg">kg</option>
                                        <option value="g">g</option>
                                        <option value="L">L</option>
                                        <option value="ml">ml</option>
                                        <option value="pc">pc</option>
                                    </select>
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">
                                        Price
                                    </label>
                                    <input
                                        className="form-control"
                                        name="price"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.price}
                                        onChange={onChange}
                                        required
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">
                                        Quantity
                                    </label>
                                    <input
                                        className="form-control"
                                        name="stock_quantity"
                                        type="number"
                                        min="0"
                                        value={form.stock_quantity}
                                        onChange={onChange}
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">
                                        Image URL
                                    </label>
                                    <input
                                        className="form-control"
                                        name="image_url"
                                        type="url"
                                        value={form.image_url}
                                        onChange={onChange}
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">
                                        Expiry date
                                    </label>
                                    <input
                                        className="form-control"
                                        name="expiry_date"
                                        type="date"
                                        value={form.expiry_date}
                                        onChange={onChange}
                                    />
                                </div>

                                <div className="col-md-12">
                                    <div className="form-check mt-2">
                                        <input
                                            className="form-check-input"
                                            name="is_active"
                                            type="checkbox"
                                            checked={form.is_active}
                                            onChange={onChange}
                                            id="productActive"
                                        />
                                        <label
                                            className="form-check-label"
                                            htmlFor="productActive"
                                        >
                                            Active product
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                data-bs-dismiss="modal"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-success"
                                disabled={saving}
                            >
                                {saving ? "Saving..." : mode === "edit" ? "Update product" : "Save product"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
