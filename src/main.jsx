import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App.jsx";
import AdminApp from "./AdminApp.jsx";
import Grocery from "./pages/user/Grocery.jsx";
import Cart from "./pages/user/Cart.jsx";
import About from "./pages/user/About.jsx";
import Profile from "./pages/user/Profile.jsx";
import Dashboard from "./pages/admin/Dashboard.jsx";
import OrderList from "./pages/admin/OrderList.jsx";
import Inventory from "./pages/admin/Inventory.jsx";
import CustomerAccounts from "./pages/admin/CustomerAccounts.jsx";
import AdminAccounts from "./pages/admin/AdminAccounts.jsx";
import Login from "./Login.jsx";
import Signup from "./Signup.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

const router = createBrowserRouter([
    {
        path: "/",
        element: (
            <ProtectedRoute>
                <App />
            </ProtectedRoute>
        ),
        children: [
            {
                index: true,
                element: <Grocery />,
            },
            {
                path: "cart",
                element: <Cart />,
            },
            {
                path: "about",
                element: <About />,
            },
            {
                path: "profile",
                element: <Profile />,
            },
        ],
    },
    {
        path: "/admin",
        element: (
            <ProtectedRoute>
                <AdminApp />
            </ProtectedRoute>
        ),
        children: [
            {
                index: true,
                element: <Dashboard />,
            },
            {
                path: "orders",
                element: <OrderList />,
            },
            {
                path: "inventory",
                element: <Inventory />,
            },
            {
                path: "customers",
                element: <CustomerAccounts />,
            },
            {
                path: "admins",
                element: <AdminAccounts />,
            },
        ],
    },
    {
        path: "/login",
        element: <Login />,
    },
    {
        path: "/signup",
        element: <Signup />,
    },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <AuthProvider>
            <RouterProvider router={router} />
        </AuthProvider>
    </React.StrictMode>,
);
