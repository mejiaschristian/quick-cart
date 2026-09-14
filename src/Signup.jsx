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
        <>
            <div className="container card p-3 mt-5">
                <h2 className="mt-3 text-center">
                    Create your QuickCart account
                </h2>
                <form onSubmit={handleSubmit} className="login-form">
                    {error && <p className="login-error">{error}</p>}
                    {message && <p>{message}</p>}

                    <div className="mb-3">
                        <label className="form-label" htmlFor="name">
                            Name
                        </label>
                        <input
                            className="form-control"
                            type="text"
                            name="name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label" htmlFor="email">
                            Email
                        </label>
                        <input
                            className="form-control"
                            type="email"
                            name="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
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
                            className="form-label"
                            htmlFor="confirm-password"
                        >
                            Confirm Password
                        </label>
                        <div className="input-group">
                            <input
                                className="form-control"
                                type={showConfirmPassword ? "text" : "password"}
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
                        className="btn btn-success w-100 fw-bold"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Creating account..." : "Sign Up"}
                    </button>

                    <p className="mt-2 text-center">
                        Already have an account? <Link to="/login">Log in</Link>
                    </p>
                </form>
                <hr />
                <GoogleSignIn />
            </div>
        </>
    );
}

export default Signup;
