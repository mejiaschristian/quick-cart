import { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";

function Grocery() {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch("http://localhost/quickcart-api/get_products.php")
            .then((res) => {
                if (!res.ok) throw new Error("Server error");
                return res.json();
            })
            .then((data) => {
                setProducts(data);
                setLoading(false);
            })
            .catch(() => {
                setError("Failed to load products");
                setLoading(false);
            });
    }, []);

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

            <div className="row">
                {products.map((item) => (
                    <div key={item.product_id} className="col-md-4 mb-4">
                        <div className="card">
                            <div className="card-body">
                                <h5 className="card-title">{item.name}</h5>
                                <p className="card-text">
                                    ₱{item.price} / {item.unit}
                                </p>
                                <p className="card-text">
                                    {item.stock_quantity} in stock
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}

export default Grocery;
