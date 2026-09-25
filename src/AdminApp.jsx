import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { Home, List, Box, User, Users, Menu, X } from "lucide-react";
import { useAuth } from "./context/useAuth";
import userIconDark from "./assets/user-icon-dark.svg";
import "../src/pages/admin/Dashboard.css";

export default function AdminApp() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { user } = useAuth();

    const menuItems = [
        { name: "Dashboard", path: "/admin", end: true, icon: Home },
        { name: "Orders", path: "/admin/orders", end: false, icon: List },
        { name: "Inventory", path: "/admin/inventory", end: false, icon: Box },
        {
            name: "Customer Accounts",
            path: "/admin/customers",
            end: false,
            icon: User,
        },
        {
            name: "Admin Accounts",
            path: "/admin/admins",
            end: false,
            icon: Users,
        },
    ];

    return (
        // Flex-column for mobile (top nav), flex-lg-row for desktop (side nav)
        <div className="admin-app d-flex flex-column flex-lg-row min-vh-100">
            {/* 1. MOBILE TOP NAVBAR (Hidden on Desktop) */}
            <nav className="navbar navbar-light bg-white border-bottom sticky-top d-lg-none px-3 py-3">
                <div className="container-fluid p-0 d-flex justify-content-between align-items-center">
                    <h2 className="brand-logo m-0 fs-4">
                        Qcart<span className="brand-dot text-success">.</span>
                    </h2>

                    {/* Toggle Button */}
                    <button
                        className="navbar-toggler border-0 shadow-none px-0"
                        type="button"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? (
                            <X size={28} />
                        ) : (
                            <Menu size={28} />
                        )}
                    </button>
                </div>

                {/* Mobile Collapsible Menu Area */}
                <div
                    className={`collapse navbar-collapse w-100 ${isMobileMenuOpen ? "show mt-3" : ""}`}
                >
                    <ul className="navbar-nav me-auto mb-2 gap-1">
                        {menuItems.map((item, index) => (
                            <li className="nav-item" key={index}>
                                <NavLink
                                    to={item.path}
                                    end={item.end}
                                    className={({ isActive }) =>
                                        `nav-link d-flex align-items-center rounded px-3 py-2 ${isActive ? "bg-success bg-opacity-10 text-success fw-medium" : "text-secondary"}`
                                    }
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <item.icon size={20} className="me-3" />
                                    {item.name}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                    <hr className="my-2 border-secondary opacity-25" />
                    <NavLink
                        to="/profile"
                        className="d-flex align-items-center px-3 py-2 text-decoration-none"
                    >
                        <img
                            className="rounded-circle me-3"
                            src={userIconDark}
                            alt="User profile"
                            width="32"
                            height="32"
                        />
                        <span className="text-dark fw-medium">
                            {user?.full_name || "User"}
                        </span>
                    </NavLink>
                </div>
            </nav>

            {/* 2. DESKTOP SIDEBAR (Hidden on Mobile) */}
            <aside
                className={`sidebar position-sticky top-0 d-none d-lg-flex ${isCollapsed ? "collapsed" : ""}`}
            >
                <button
                    className="sidebar-toggle-btn"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    <Menu size={18} />
                </button>

                <div className="sidebar-header text-center">
                    <h2 className="brand-logo">
                        {isCollapsed ? (
                            "Q."
                        ) : (
                            <>
                                Qcart<span className="brand-dot">.</span>
                            </>
                        )}
                    </h2>
                    {!isCollapsed && <p className="brand-subtitle">Admin</p>}
                </div>

                <nav className="sidebar-nav">
                    {menuItems.map((item, index) => (
                        <NavLink
                            key={index}
                            to={item.path}
                            end={item.end}
                            className={({ isActive }) =>
                                `nav-item ${isActive ? "active" : ""}`
                            }
                        >
                            <item.icon className="nav-icon" />
                            {!isCollapsed && <span className="mx-2">{item.name}</span>}
                        </NavLink>
                    ))}
                </nav>

                <div className="mt-auto p-3 border-top">
                    <NavLink
                        className="btn app-profile-btn d-flex align-items-center justify-content-center text-decoration-none"
                        to="/admin/profile"
                    >
                        <img
                            className={`app-profile-avatar ${isCollapsed ? "" : "me-2"}`}
                            src={userIconDark}
                            alt="User profile"
                            width="32"
                            height="32"
                        />
                        {!isCollapsed && (
                            <span className="text-dark fw-medium text-truncate">
                                {user?.full_name || "User"}
                            </span>
                        )}
                    </NavLink>
                </div>
            </aside>

            {/* 3. MAIN CONTENT */}
            <main className="admin-main flex-grow-1 bg-light">
                <Outlet />
            </main>
        </div>
    );
}
