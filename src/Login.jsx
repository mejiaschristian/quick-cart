import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GoogleSignIn from "./components/GoogleSignIn";
import { useAuth } from "./context/useAuth";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { refreshUser } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch(
                "http://localhost/quickcart-api/login.php",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include", // required so PHP's session cookie gets set
                    body: JSON.stringify({ email, password }),
                },
            );

            const data = await res.json();

            if (data.success) {
                await refreshUser();
                navigate("/", { replace: true });
            } else {
                setError(data.error || "Login failed");
            }
        } catch (err) {
            setError("Something went wrong. Please try again." + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="container card p-3 mt-5">
                <h2 className="mt-3 text-center">Log in to QuickCart</h2>
                <form onSubmit={handleSubmit}>
                    {error && <p className="login-error">{error}</p>}

                    <div className="mb-3">
                        <label className="form-label" for="email">Email</label>
                        <input
                            className="form-control"
                            type="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label" htmlFor="password">
                            Password
                        </label>
                        <div className="input-group">
                            <input
                                className="form-control"
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onCopy={(e) => e.preventDefault()}
                                onPaste={(e) => e.preventDefault()}
                                onCut={(e) => e.preventDefault()}
                                onContextMenu={(e) => e.preventDefault()}
                                required
                            />
                            <button
                                className="btn btn-outline-secondary"
                                type="button"
                                onClick={() =>
                                    setShowPassword((visible) => !visible)
                                }
                                aria-label={
                                    showPassword
                                        ? "Hide password"
                                        : "Show password"
                                }
                            >
                                {showPassword ? "🙈" : "🙉"}
                            </button>
                        </div>
                    </div>

                    <button
                        className="btn btn-success w-100 fw-bold"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Log In"}
                    </button>

                    <p className="mt-2 text-center">
                        Don't have an account? <Link to="/signup">Sign up</Link>
                    </p>
                </form>
                <hr />
                <GoogleSignIn />
            </div>
        </>
    );
}

export default Login;
