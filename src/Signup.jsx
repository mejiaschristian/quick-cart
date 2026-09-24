import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GoogleSignIn from "./components/GoogleSignIn";

function Signup() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setMessage("");

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                "http://localhost/quickcart-api/register.php",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, email, password }),
                },
            );
            const data = await response.json();

            if (!response.ok || !data.success) {
                setError(data.error || "Sign-up failed.");
                return;
            }

            setMessage("Account created. Redirecting to log in...");
            setTimeout(() => navigate("/login", { replace: true }), 800);
        } catch {
            setError("Something went wrong. Please try again.");
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
                            Get started
                        </p>
                        <h1 className="h2 fw-bold mb-4">
                            Create your QuickCart account
                        </h1>

                        <form onSubmit={handleSubmit} noValidate>
                            {error && (
                                <div className="alert alert-danger" role="alert">
                                    {error}
                                </div>
                            )}
                            {message && (
                                <div className="alert alert-success" role="alert">
                                    {message}
                                </div>
                            )}

                            <div className="mb-3">
                                <label className="form-label fw-semibold" htmlFor="signup-name">
                                    Name
                                </label>
                                <input
                                    id="signup-name"
                                    className="form-control form-control-lg"
                                    type="text"
                                    name="name"
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    required
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-semibold" htmlFor="signup-email">
                                    Email
                                </label>
                                <input
                                    id="signup-email"
                                    className="form-control form-control-lg"
                                    type="email"
                                    name="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    required
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-semibold" htmlFor="signup-password">
                                    Password
                                </label>
                                <div className="input-group input-group-lg">
                                    <input
                                        id="signup-password"
                                        className="form-control"
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={password}
                                        minLength={8}
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

                            <div className="mb-3">
                                <label
                                    className="form-label fw-semibold"
                                    htmlFor="signup-confirm-password"
                                >
                                    Confirm Password
                                </label>
                                <div className="input-group input-group-lg">
                                    <input
                                        id="signup-confirm-password"
                                        className="form-control"
                                        type={
                                            showConfirmPassword ? "text" : "password"
                                        }
                                        name="confirm-password"
                                        value={confirmPassword}
                                        onChange={(event) =>
                                            setConfirmPassword(event.target.value)
                                        }
                                        onCopy={(e) => e.preventDefault()}
                                        onPaste={(e) => e.preventDefault()}
                                        onCut={(e) => e.preventDefault()}
                                        onContextMenu={(e) => e.preventDefault()}
                                        minLength={8}
                                        required
                                    />
                                    <button
                                        className="btn btn-outline-secondary"
                                        type="button"
                                        onClick={() =>
                                            setShowConfirmPassword(
                                                (visible) => !visible,
                                            )
                                        }
                                        aria-label={
                                            showConfirmPassword
                                                ? "Hide password confirmation"
                                                : "Show password confirmation"
                                        }
                                    >
                                        {showConfirmPassword ? "🙈" : "🙉"}
                                    </button>
                                </div>
                            </div>

                            <button
                                className="btn btn-success btn-lg w-100 fw-bold mt-2"
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? "Creating account..." : "Sign Up"}
                            </button>

                            <p className="text-center text-body-secondary mt-3 mb-0">
                                Already have an account?{" "}
                                <Link to="/login" className="fw-semibold">
                                    Log in
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

                <div className="col-lg-6 d-none d-lg-block position-relative overflow-hidden">
                    {/* Swap this placeholder for a real photo of your produce/delivery — see note below */}
                    <img
                        src="c1.png"
                        alt=""
                        className="w-100 h-100 object-fit-cover position-absolute top-0 start-0"
                    />
                    <div className="position-absolute bottom-0 start-0 end-0 p-5 text-white auth-hero-scrim">
                        <p className="fs-4 fw-semibold mb-1">
                            Join thousands shopping smarter.
                        </p>
                        <p className="mb-0 text-white-50">
                            Groceries picked, packed, and on their way — same day.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Signup;