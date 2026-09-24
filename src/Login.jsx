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
                const nextUser = await refreshUser();
                navigate(nextUser?.role === "admin" ? "/admin" : "/", {
                    replace: true,
                });
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
        <div className="container-fluid p-0">
            <div className="row g-0 min-vh-100">
                <div className="col-lg-6 d-flex align-items-center justify-content-center py-5">
                    <div className="w-100 px-4 px-sm-5" style={{ maxWidth: "440px" }}>
                        <p className="text-success text-uppercase fw-bold small mb-1">
                            Welcome back
                        </p>
                        <h1 className="h2 fw-bold mb-4">Log in to QuickCart</h1>

                        <form onSubmit={handleSubmit} noValidate>
                            {error && (
                                <div className="alert alert-danger" role="alert">
                                    {error}
                                </div>
                            )}

                            <div className="mb-3">
                                <label className="form-label fw-semibold" htmlFor="login-email">
                                    Email
                                </label>
                                <input
                                    id="login-email"
                                    className="form-control form-control-lg"
                                    type="email"
                                    name="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-semibold" htmlFor="login-password">
                                    Password
                                </label>
                                <div className="input-group input-group-lg">
                                    <input
                                        id="login-password"
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
                                className="btn btn-success btn-lg w-100 fw-bold mt-2"
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? "Logging in..." : "Log In"}
                            </button>

                            <p className="text-center text-body-secondary mt-3 mb-0">
                                Don't have an account?{" "}
                                <Link to="/signup" className="fw-semibold">
                                    Sign up
                                </Link>
                            </p>
                        </form>

                        <div className="d-flex align-items-center gap-3 my-4">
                            <hr className="flex-grow-1" />
                            <span className="text-body-secondary small">or</span>
                            <hr className="flex-grow-1" />
                        </div>

                        <GoogleSignIn />
                    </div>
                </div>

                <div className="col-lg-6 d-none d-lg-block position-relative overflow-hidden bg-black">
                    {/* Swap this placeholder for a real photo of your produce/delivery — see note below */}
                    <img
                        src="login.png"
                        alt=""
                        className="w-100 h-100 object-fit-cover position-absolute top-0 start-0 opacity-50"
                    />
                    <div className="position-absolute bottom-0 start-0 end-0 p-5 text-white auth-hero-scrim">
                        <p className="fs-4 fw-semibold mb-1">
                            Fresh groceries, delivered same day.
                        </p>
                        <p className="mb-0 text-white-50">
                            Order from QuickCart and skip the trip to the store.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;