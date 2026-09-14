import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "./context/useAuth";

export default function App() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
        } finally {
            navigate("/login", { replace: true });
        }
    };

    return (
        <div>
            <nav className="navbar navbar-expand-sm navbar-dark bg-success p-2">
                <a className="navbar-brand fw-bold" href="#">
                    QuickCart
                </a>
                <button
                    className="navbar-toggler d-lg-none"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#collapsibleNavId"
                    aria-controls="collapsibleNavId"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                ></button>
                <div
                    className="collapse navbar-collapse justify-content-between"
                    id="collapsibleNavId"
                >
                    <ul className="navbar-nav me-auto mt-2 mt-lg-0">
                        <li className="nav-item">
                            <Link className="nav-link" to="/">
                                Grocery
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/cart">
                                Cart
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/about">
                                About
                            </Link>
                        </li>
                    </ul>
                    <ul className="navbar-nav gap-2">
                        <li className="nav-item">
                            <Link
                                className="btn btn-success text-light d-flex align-items-center justify-content-center"
                                to="/profile"
                            >
                                <img
                                    className="me-2"
                                    src="src\assets\user-icon.svg"
                                    alt="userIcon"
                                    width="25"
                                />
                                <p className="m-0 p-0">{user?.full_name || "User"}</p>
                            </Link>
                        </li>
                        <li className="nav-item">
                            <button
                                className="btn btn-danger"
                                type="button"
                                onClick={handleLogout}
                            >
                                Logout
                            </button>
                        </li>
                    </ul>
                </div>
            </nav>
            <main>
                <Outlet />
            </main>
        </div>
    );
}
