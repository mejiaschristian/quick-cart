import { useEffect, useState } from "react";
import { Modal } from "bootstrap";
import { useAuth } from "../../context/useAuth";
import GroceryCardItem from "../../components/GroceryCardItem.jsx";
import ItemDetailsModal from "../../components/ItemDetailsModal.jsx";

function Grocery() {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);

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

    const openDetails = (product) => {
        setSelectedProduct(product);
        const modalElement = document.getElementById("itemDetailsModal");
        if (modalElement) {
            Modal.getOrCreateInstance(modalElement).show();
        }
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
    };

    if (loading) return <p>Loading products...</p>;
    if (error) return <p>{error}</p>;

    return (
        <>
            <div className="mb-4">
                <p className="text-success text-uppercase fw-bold small mb-1">
                    Grocery Items
                </p>
                <h1 className="h2 mb-2">
                    Welcome, {user?.full_name || "User"}!
                </h1>
                <p className="text-body-secondary mb-0">
                    Browse our selection of fresh groceries and essentials.
                </p>
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
                onClose={() => setSelectedProduct(null)}
                onAddToCart={addToCart}
            />
        </>
    );
}

export default Grocery;
