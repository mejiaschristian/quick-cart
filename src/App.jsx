import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "./context/useAuth";
import userIconLight from "./assets/user-icon-light.svg";

export default function App() {
    const { user } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navLinkClass = ({ isActive }) =>
        `nav-link ${isActive ? "active" : ""}`;

    const closeMenu = () => setIsMobileMenuOpen(false);

    return (
        <div>
            <nav className="navbar navbar-expand-lg navbar-dark bg-success sticky-top app-navbar">
                <div className="container-fluid px-3 px-lg-4">
                    <NavLink
                        className="navbar-brand app-brand"
                        to="/"
                        end
                        onClick={closeMenu}
                    >
                        QuickCart
                    </NavLink>

                    <button
                        className="navbar-toggler"
                        type="button"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-controls="navbarSupportedContent"
                        aria-expanded={isMobileMenuOpen}
                        aria-label="Toggle navigation"
                    >
                        <span className="navbar-toggler-icon" />
                    </button>

                    <div
                        className={`collapse navbar-collapse ${isMobileMenuOpen ? "show" : ""} `}
                        id="navbarSupportedContent"
                    >
                        <ul className="navbar-nav me-auto mb-lg-0 align-items-lg-center gap-lg-1 ">
                            <li className="nav-item">
                                <NavLink
                                    className={navLinkClass}
                                    to="/"
                                    end
                                    onClick={closeMenu}
                                >
                                    Grocery
                                </NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink
                                    className={navLinkClass}
                                    to="/cart"
                                    onClick={closeMenu}
                                >
                                    Cart
                                </NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink
                                    className={navLinkClass}
                                    to="/orders"
                                    onClick={closeMenu}
                                >
                                    Orders
                                </NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink
                                    className={navLinkClass}
                                    to="/about"
                                    onClick={closeMenu}
                                >
                                    About
                                </NavLink>
                            </li>
                        </ul>

                        <ul className="navbar-nav mb-2 mb-lg-0 align-items-lg-center gap-2 app-nav-actions">
                            <li className="nav-item">
                                <NavLink
                                    className={({ isActive }) =>
                                        `nav-link btn app-profile-btn d-flex align-items-center ${isActive ? "active" : ""}`
                                    }
                                    to="/profile"
                                    onClick={closeMenu}
                                >
                                    <img
                                        className="app-profile-avatar me-2"
                                        src={userIconLight}
                                        alt="User profile"
                                        width="32"
                                        height="32"
                                    />
                                    <span className="text-light">
                                        {user?.full_name || "User"}
                                    </span>
                                </NavLink>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            <main>
                <Outlet />
            </main>
        </div>
    );
}
