import { useEffect, useState } from "react";
import { Modal } from "bootstrap";
import { useAuth } from "../../context/useAuth";
import GroceryCarousel from "../../components/GroceryCarousel.jsx";
import GroceryCardItem from "../../components/GroceryCardItem.jsx";
import ItemDetailsModal from "../../components/ItemDetailsModal.jsx";
import CategoryCardItem from "../../components/CategoryCardItem.jsx";
import AppToast from "../../components/Toast.jsx";

function Grocery() {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState("all");
    const [quantity, setQuantity] = useState(1);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        fetch("http://localhost/quickcart-api/get_products.php", {
            credentials: "include",
        })
            .then((res) => {
                if (!res.ok) throw new Error("Server error");
                return res.json();
            })
            .then((data) => {
                if (!data.success) {
                    throw new Error(data.error || "Failed to load products");
                }
                setProducts(data.products ?? []);
                setLoading(false);
            })
            .catch(() => {
                setError("Failed to load products");
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        fetch("http://localhost/quickcart-api/categories.php", {
            credentials: "include",
        })
            .then((res) => {
                if (!res.ok) throw new Error("Server error");
                return res.json();
            })
            .then((data) => {
                if (!data.success) {
                    throw new Error(data.error || "Failed to load categories");
                }
                setCategories(data.categories ?? []);
            })
            .catch(() => {
                setError("Failed to load categories");
            });
    }, []);

    const openDetails = (product) => {
        setSelectedProduct(product);
        setQuantity(1);

        // ItemDetailsModal only listens for hidden.bs.modal to clear its own
        // state — it never shows itself. This is the one call that actually
        // opens it, following Bootstrap's documented JS API.
        const modalElement = document.getElementById("itemDetailsModal");
        if (modalElement) {
            Modal.getOrCreateInstance(modalElement).show();
        }
    };

    const closeDetails = () => {
        setSelectedProduct(null);
    };

    const filteredProducts =
        selectedCategoryId === "all"
            ? products
            : products.filter(
                  (product) =>
                      String(product.category_id) ===
                      String(selectedCategoryId),
              );

    const addToCart = (product, quantity) => {
        const cart = JSON.parse(localStorage.getItem("quickcart_cart") ?? "[]");
        const existing = cart.find(
            (item) => item.product_id === product.product_id,
        );

        if (existing) {
            existing.quantity += quantity;
        } else {
            cart.push({
                product_id: product.product_id,
                name: product.name,
                price: product.price,
                image_url: product.image_url,
                unit: product.unit,
                quantity,
            });
        }

        localStorage.setItem("quickcart_cart", JSON.stringify(cart));

        setToast({
            title: "Added to cart",
            message: `${product.name} x ${quantity}`,
        });
    };

    if (loading) return <p>Loading products...</p>;
    if (error) return <p>{error}</p>;

    return (
        <>
            <div className="mb-4">
                <div className="my-3">
                    <p className="text-success text-uppercase fw-bold small mb-1">
                        Grocery Items
                    </p>
                    <h2 className="mb-2">
                        Welcome, {user?.full_name || "User"}!
                    </h2>
                    <p className="text-body-secondary mb-0">
                        Browse our selection of fresh groceries and essentials.
                    </p>
                </div>
                <GroceryCarousel />
            </div>

            <div className="mb-4">
                <h2>All Categories</h2>
                <div className="d-flex flex-row flex-wrap gap-3 py-2">
                    <CategoryCardItem
                        category={{
                            category_id: "all",
                            name: "All",
                            description: "View every item",
                            image_url:
                                "https://placehold.co/130x80?text=All+Items",
                        }}
                        isSelected={selectedCategoryId === "all"}
                        onSelect={() => setSelectedCategoryId("all")}
                    />
                    {categories.map((category) => (
                        <CategoryCardItem
                            key={category.category_id}
                            category={category}
                            isSelected={
                                String(category.category_id) ===
                                String(selectedCategoryId)
                            }
                            onSelect={() =>
                                setSelectedCategoryId(category.category_id)
                            }
                        />
                    ))}
                </div>
            </div>

            {filteredProducts.length === 0 ? (
                <div className="alert alert-light border text-center text-muted">
                    No products found in this category.
                </div>
            ) : (
                <div className="row">
                    {filteredProducts.map((product) => (
                        <div className="col-md-3" key={product.product_id}>
                            <GroceryCardItem
                                product={product}
                                onSelect={openDetails}
                            />
                        </div>
                    ))}
                </div>
            )}

            <ItemDetailsModal
                product={selectedProduct}
                onClose={closeDetails}
                quantity={quantity}
                onQuantityChange={setQuantity}
                onAddToCart={addToCart}
            />

            <AppToast toast={toast} onClose={() => setToast(null)} />
        </>
    );
}

export default Grocery;
