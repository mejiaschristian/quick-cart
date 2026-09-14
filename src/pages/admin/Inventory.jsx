import { useEffect, useState } from "react";
import { Modal } from "bootstrap";
import AddProductModal from "../../components/AddProductModal";

const emptyProduct = {
    name: "",
    description: "",
    category_id: "",
    unit: "pc",
    price: "",
    is_active: true,
    image_url: "",
    stock_quantity: "",
    expiry_date: "",
};

function Inventory() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState(emptyProduct);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [editingProductId, setEditingProductId] = useState(null);

    const loadInventory = async () => {
        try {
            const response = await fetch(
                "http://localhost/quickcart-api/inventory.php",
                {
                    credentials: "include",
                },
            );
            const data = await response.json();

            if (!data.success) {
                setError(data.error || "Unable to load inventory.");
                return;
            }

            setProducts(data.products ?? []);
            setCategories(data.categories ?? []);
        } catch {
            setError("Unable to load inventory.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInventory();
    }, []);

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;
        setForm((current) => ({
            ...current,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleCategoryCreated = (category) => {
        setCategories((current) => {
            const exists = current.some(
                (item) =>
                    Number(item.category_id) === Number(category.category_id),
            );

            if (exists) {
                return current;
            }

            return [...current, category];
        });

        setForm((current) => ({
            ...current,
            category_id: String(category.category_id),
        }));
    };

    const openCreateModal = () => {
        setEditingProductId(null);
        setForm(emptyProduct);
        const modalElement = document.getElementById("addProductModal");
        if (modalElement) {
            const modal = Modal.getOrCreateInstance(modalElement);
            modal.show();
        }
    };

    const openEditModal = (product) => {
        setEditingProductId(product.product_id);
        setForm({
            name: product.name ?? "",
            description: product.description ?? "",
            category_id: String(product.category_id ?? ""),
            unit: product.unit ?? "pc",
            price: product.price ?? "",
            is_active: product.is_active ?? true,
            image_url: product.image_url ?? "",
            stock_quantity: product.stock_quantity ?? "",
            expiry_date: product.expiry_date ?? "",
        });

        const modalElement = document.getElementById("addProductModal");
        if (modalElement) {
            const modal = Modal.getOrCreateInstance(modalElement);
            modal.show();
        }
    };

    const closeAddProductModal = () => {
        const modalElement = document.getElementById("addProductModal");
        if (!modalElement) {
            return;
        }

        const modal = Modal.getInstance(modalElement);
        if (modal) {
            modal.hide();
        }

        const backdrops = document.querySelectorAll(".modal-backdrop");
        backdrops.forEach((item) => item.remove());

        document.body.classList.remove("modal-open");
        document.body.style.removeProperty("overflow");
        document.body.style.removeProperty("padding-right");

        modalElement.classList.remove("show");
        modalElement.setAttribute("aria-hidden", "true");
        modalElement.style.display = "none";
    };

    const handleSave = async (event) => {
        event.preventDefault();
        setError("");
        setSaving(true);

        try {
            const isEditing = editingProductId !== null;
            const response = await fetch(
                "http://localhost/quickcart-api/inventory.php",
                {
                    method: isEditing ? "PUT" : "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(
                        isEditing
                            ? { ...form, product_id: editingProductId }
                            : form,
                    ),
                },
            );

            const data = await response.json();
            if (!response.ok || !data.success) {
                setError(
                    data.error ||
                        (isEditing
                            ? "Unable to update product."
                            : "Unable to create product."),
                );
                return;
            }

            closeAddProductModal();

            setForm(emptyProduct);
            setEditingProductId(null);
            await loadInventory();
        } catch {
            setError(
                editingProductId !== null
                    ? "Unable to update product."
                    : "Unable to create product.",
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="container py-4">
            <div className="mb-4 d-flex justify-content-between align-items-center gap-3">
                <div>
                    <p className="text-success text-uppercase fw-bold small mb-1">
                        Catalog
                    </p>
                    <h1 className="h2 mb-2">Inventory / Products</h1>
                    <p className="text-body-secondary mb-0">
                        Manage product stock, categories, pricing, and listings.
                    </p>
                </div>

                <button
                    className="btn btn-success"
                    type="button"
                    onClick={openCreateModal}
                    data-bs-toggle="modal"
                    data-bs-target="#addProductModal"
                >
                    + Add Product
                </button>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            {loading ? (
                <div className="alert alert-light">Loading inventory...</div>
            ) : (
                <div className="card shadow-sm border-0">
                    <div className="card-body">
                        <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
                            <input
                                className="form-control"
                                type="text"
                                placeholder="Search products..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                style={{ maxWidth: "280px" }}
                            />

                            <select
                                className="form-select"
                                value={categoryFilter}
                                onChange={(event) =>
                                    setCategoryFilter(event.target.value)
                                }
                                style={{ maxWidth: "220px" }}
                            >
                                <option value="">All categories</option>
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
                                className="btn btn-outline-secondary"
                                type="button"
                                onClick={() => {
                                    setSearch("");
                                    setCategoryFilter("");
                                }}
                            >
                                Reset
                            </button>
                        </div>

                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Category</th>
                                        <th>Unit</th>
                                        <th>Price</th>
                                        <th>Stock</th>
                                        <th>Order Count</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.filter((product) => {
                                        const matchesSearch =
                                            `${product.name ?? ""} ${product.description ?? ""}`
                                                .toLowerCase()
                                                .includes(search.toLowerCase());
                                        const matchesCategory =
                                            categoryFilter === "" ||
                                            String(product.category_id) ===
                                                String(categoryFilter);

                                        return matchesSearch && matchesCategory;
                                    }).length === 0 ? (
                                        <tr>
                                            <td
                                                className="text-muted"
                                                colSpan="7"
                                            >
                                                No products found.
                                            </td>
                                        </tr>
                                    ) : (
                                        products
                                            .filter((product) => {
                                                const matchesSearch =
                                                    `${product.name ?? ""} ${product.description ?? ""}`
                                                        .toLowerCase()
                                                        .includes(
                                                            search.toLowerCase(),
                                                        );
                                                const matchesCategory =
                                                    categoryFilter === "" ||
                                                    String(
                                                        product.category_id,
                                                    ) ===
                                                        String(categoryFilter);

                                                return (
                                                    matchesSearch &&
                                                    matchesCategory
                                                );
                                            })
                                            .map((product) => (
                                                <tr key={product.product_id}>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-2">
                                                            {product.image_url && (
                                                                <img
                                                                    src={
                                                                        product.image_url
                                                                    }
                                                                    alt=""
                                                                    className="rounded"
                                                                    width="42"
                                                                    height="42"
                                                                    style={{
                                                                        objectFit:
                                                                            "cover",
                                                                    }}
                                                                />
                                                            )}
                                                            <span className="fw-semibold">
                                                                {product.name}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {product.category_name}
                                                    </td>
                                                    <td>{product.unit}</td>
                                                    <td>
                                                        ₱
                                                        {Number(
                                                            product.price,
                                                        ).toFixed(2)}
                                                    </td>
                                                    <td>
                                                        {product.stock_quantity}
                                                    </td>
                                                    <td>
                                                        {product.order_count ??
                                                            0}
                                                    </td>
                                                    <td>
                                                        <span
                                                            className={`badge ${product.is_active ? "text-bg-success" : "text-bg-secondary"}`}
                                                        >
                                                            {product.is_active
                                                                ? "Active"
                                                                : "Inactive"}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-outline-primary"
                                                            type="button"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    product,
                                                                )
                                                            }
                                                        >
                                                            Edit
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            <AddProductModal
                categories={categories}
                form={form}
                saving={saving}
                onChange={handleChange}
                onSubmit={handleSave}
                onCreateCategory={handleCategoryCreated}
                mode={editingProductId !== null ? "edit" : "add"}
            />
        </div>
    );
}

export default Inventory;
