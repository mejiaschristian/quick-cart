import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import AppToast from "../../components/Toast.jsx";

const emptyProfile = { email: "", full_name: "", phone: "", address: "" };

function Profile() {
    const { refreshUser, logout } = useAuth();
    const [profile, setProfile] = useState(emptyProfile);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [toast, setToast] = useState(null);
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
        } finally {
            navigate("/login", { replace: true });
        }
    };

    const loadProfile = async () => {
        try {
            const response = await fetch(
                "http://localhost/quickcart-api/profile.php",
                {
                    credentials: "include",
                },
            );
            const data = await response.json();

            if (!data.success) {
                setError(data.error || "Unable to load your profile.");
                return;
            }

            setProfile({ ...emptyProfile, ...data.user });
        } catch {
            setError("Unable to load your profile.");
        }
    };

    useEffect(() => {
        const bootstrapLoad = async () => {
            await loadProfile();
        };

        bootstrapLoad();
    }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setProfile((current) => ({ ...current, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setMessage("");
        setSaving(true);

        try {
            const response = await fetch(
                "http://localhost/quickcart-api/profile.php",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(profile),
                },
            );
            const data = await response.json();

            if (!response.ok || !data.success) {
                setError(data.error || "Unable to save your profile.");
                return;
            }

            await refreshUser();
            setMessage("Profile updated successfully.");
            setToast({
                title: "Profile updated",
                message: "Your details have been saved successfully.",
            });
        } catch {
            setError("Unable to save your profile.");
        } finally {
            setSaving(false);
        }
    };


    return (
        <>
            <div className="mb-4">
                <p className="text-success text-uppercase fw-bold small mb-1">
                    Delivery details
                </p>
                <h1 className="h2 mb-2">Your profile</h1>
                <p className="text-body-secondary mb-0">
                    Keep your contact and delivery information up to date.
                </p>
            </div>

            <form className="card shadow-sm p-4" onSubmit={handleSubmit}>
                {error && <div className="alert alert-danger">{error}</div>}
                {message && (
                    <div className="alert alert-success">{message}</div>
                )}
                <label className="form-label fw-semibold">
                    Email
                    <input
                        className="form-control mt-2"
                        name="email"
                        type="email"
                        value={profile.email}
                        disabled
                    />
                </label>

                <label className="form-label fw-semibold">
                    Full name
                    <input
                        className="form-control mt-2"
                        name="full_name"
                        type="text"
                        maxLength={35}
                        minLength={3}
                        value={profile.full_name}
                        onChange={handleChange}
                        required
                    />
                </label>

                <button
                    className="mt-2 btn btn-success align-self-start"
                    type="submit"
                    disabled={saving}
                >
                    {saving ? "Saving..." : "Save changes"}
                </button>

                <hr />
            </form>

            <button
                className="btn btn-outline-danger mt-2 w-100"
                type="button"
                onClick={handleLogout}
            >
                Logout
            </button>


            <AppToast toast={toast} onClose={() => setToast(null)} />
        </>
    );
}

export default Profile;
