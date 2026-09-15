import { useEffect, useState } from "react";
import { useAuth } from "../../context/useAuth";
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
    };

    const closeDetails = () => {
        setSelectedProduct(null);
    };

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
                <p className="text-success text-uppercase fw-bold small mb-1">
                    Grocery Items
                </p>
                <h2 className="mb-2">Welcome, {user?.full_name || "User"}!</h2>
                <p className="text-body-secondary mb-0">
                    Browse our selection of fresh groceries and essentials.
                </p>
            </div>

            <div className="mb-4">
                <h2>All Categories</h2>
                <div className="d-flex gap-3">
                    {categories.map((category) => (
                        <CategoryCardItem
                            key={category.category_id}
                            category={category}
                        />
                    ))}
                </div>
            </div>

            <div className="grocery-grid">
                {products.map((product) => (
                    <GroceryCardItem
                        key={product.product_id}
                        product={product}
                        onSelect={openDetails}
                    />
                ))}
            </div>

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
