import { useEffect, useState } from "react";
import { AuthContext } from "./authContext";

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = async () => {
        try {
            const response = await fetch(
                "http://localhost/quickcart-api/check_session.php",
                { credentials: "include" },
            );
            const data = await response.json();
            setUser(data.loggedIn ? data.user : null);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetch("http://localhost/quickcart-api/check_session.php", {
            credentials: "include",
        })
            .then((response) => response.json())
            .then((data) => setUser(data.loggedIn ? data.user : null))
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    const logout = async () => {
        await fetch("http://localhost/quickcart-api/logout.php", {
            method: "POST",
            credentials: "include",
        });
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, refreshUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
