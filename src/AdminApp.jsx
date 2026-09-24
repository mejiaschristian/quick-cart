import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "./context/useAuth";

export default function AdminApp() {
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
        <div className="admin-app d-flex min-vh-100">
            <aside className="admin-sidebar bg-success text-white p-3">
                <div className="d-flex align-items-center justify-content-between">
                    <div className="admin-brand fw-bold fs-5">
                        QuickCart Admin
                    </div>
                    <button
                        className="btn btn-sm btn-outline-light"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#adminSidebarNav"
                        aria-label="Toggle admin navigation"
                    >
                        ☰
                    </button>
                </div>

                <div className="collapse show mt-4" id="adminSidebarNav">
                    <ul className="nav flex-column gap-2">
                        <li className="nav-item">
                            <Link className="nav-link text-white" to="/admin">
                                <span className="me-2">▦</span>
                                Dashboard (Analytics)
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link
                                className="nav-link text-white"
                                to="/admin/orders"
                            >
                                <span className="me-2">▤</span>
                                Order List
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link
                                className="nav-link text-white"
                                to="/admin/inventory"
                            >
                                <span className="me-2">▥</span>
                                Inventory / Products
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link
                                className="nav-link text-white"
                                to="/admin/customers"
                            >
                                <span className="me-2">♙</span>
                                Customer Accounts List
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link
                                className="nav-link text-white"
                                to="/admin/admins"
                            >
                                <span className="me-2">⚙</span>
                                Admin Accounts List
                            </Link>
                        </li>
                    </ul>
                </div>

                <div className="admin-sidebar-user mt-4 pt-4 border-top border-light">
                    <Link
                        className="btn btn-success text-light d-flex align-items-center justify-content-center w-100"
                        to="/admin/profile"
                    >
                        <img
                            className="me-2"
                            src="src\assets\user-icon.svg"
                            alt="userIcon"
                            width="25"
                        />
                        <span className="m-0 p-0">
                            {user?.full_name || "Admin"}
                        </span>
                    </Link>
                    <button
                        className="btn btn-danger w-100 mt-2"
                        type="button"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>
            </aside>

            <main className="admin-main flex-grow-1 bg-light">
                <Outlet />
            </main>
        </div>
    );
}
