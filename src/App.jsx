import { useRef } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { Collapse } from "bootstrap";
import { useAuth } from "./context/useAuth";
import userIcon from "./assets/user-icon.svg";

export default function App() {
    const { user } = useAuth();
    const navRef = useRef(null);

    const navLinkClass = ({ isActive }) =>
        `nav-link ${isActive ? "active" : ""}`;

    // Bootstrap's collapse only reacts to its own toggler — it doesn't know
    // React Router just navigated. { toggle: false } matches how Bootstrap's
    // own data-bs-toggle handler constructs instances internally, so we
    // don't accidentally trigger a toggle-on-construct if this is the first
    // time the collapse is touched (e.g. a link click at desktop width,
    // where the menu was never manually opened at all).
    const closeMobileMenu = (event) => {
        if (!event.target.closest("a")) return;

        const navElement = navRef.current;
        if (navElement) {
            Collapse.getOrCreateInstance(navElement, { toggle: false }).hide();
        }
    };

    return (
        <div>
            <nav className="navbar navbar-expand-lg navbar-dark bg-success sticky-top app-navbar">
                <div className="container-fluid px-3 px-lg-4">
                    <NavLink className="navbar-brand app-brand" to="/" end>
                        QuickCart
                    </NavLink>

                    <button
                        className="navbar-toggler"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapsibleNavId"
                        aria-controls="collapsibleNavId"
                        aria-expanded="false"
                        aria-label="Toggle navigation"
                    >
                        <span className="navbar-toggler-icon" />
                    </button>

                    <div
                        ref={navRef}
                        className="collapse navbar-collapse justify-content-between"
                        id="collapsibleNavId"
                        onClick={closeMobileMenu}
                    >
                        <ul className="navbar-nav me-auto align-items-lg-center gap-lg-1">
                            <li className="nav-item">
                                <NavLink className={navLinkClass} to="/" end>
                                    Grocery
                                </NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink className={navLinkClass} to="/cart">
                                    Cart
                                </NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink className={navLinkClass} to="/orders">
                                    Orders
                                </NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink className={navLinkClass} to="/about">
                                    About
                                </NavLink>
                            </li>
                        </ul>

                        <ul className="navbar-nav align-items-lg-center gap-2 app-nav-actions">
                            <li className="nav-item">
                                <NavLink
                                    className="btn app-profile-btn d-flex"
                                    to="/profile"
                                >
                                    <img
                                        className="app-profile-avatar"
                                        src={userIcon}
                                        alt="User profile"
                                    />
                                    <span className="text-light">{user?.full_name || "User"}</span>
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