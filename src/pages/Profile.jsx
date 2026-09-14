import { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";

const emptyProfile = { full_name: "", phone: "", address: "" };

function Profile() {
    const { refreshUser } = useAuth();
    const [profile, setProfile] = useState(emptyProfile);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        fetch("http://localhost/quickcart-api/profile.php", {
            credentials: "include",
        })
            .then((response) => response.json())
            .then((data) => {
                if (!data.success) {
                    setError(data.error || "Unable to load your profile.");
                    return;
                }

                setProfile({ ...emptyProfile, ...data.user });
            })
            .catch(() => setError("Unable to load your profile."))
            .finally(() => setLoading(false));
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
        } catch {
            setError("Unable to save your profile.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="container py-4">
                <p className="text-muted">Loading profile...</p>
            </div>
        );
    }

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

                <label className="form-label fw-semibold">
                    Phone
                    <input
                        className="form-control mt-2"
                        name="phone"
                        type="tel"
                        value={profile.phone}
                        onChange={handleChange}
                        placeholder="e.g. 09123456789"
                    />
                </label>

                <label className="form-label fw-semibold">
                    Delivery address
                    <textarea
                        className="form-control mt-2"
                        name="address"
                        value={profile.address}
                        onChange={handleChange}
                        rows="4"
                        placeholder="House number, street, barangay, city"
                    />
                </label>

                <button
                    className="btn btn-success align-self-start"
                    type="submit"
                    disabled={saving}
                >
                    {saving ? "Saving..." : "Save changes"}
                </button>
            </form>
        </>
    );
}

export default Profile;
