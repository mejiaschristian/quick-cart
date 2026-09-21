import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "bootstrap";
import { useAuth } from "../../context/useAuth";
import AddAddress from "../../components/AddAddress.jsx";
import AppToast from "../../components/Toast.jsx";

const emptyProfile = { email: "", full_name: "", phone: "", address: "" };

function Profile() {
    const { refreshUser, logout } = useAuth();
    const [profile, setProfile] = useState(emptyProfile);
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [toast, setToast] = useState(null);
    const [editingAddress, setEditingAddress] = useState(null);
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

    const loadAddresses = async () => {
        try {
            const response = await fetch(
                "http://localhost/quickcart-api/addresses.php",
                {
                    credentials: "include",
                },
            );
            const data = await response.json();

            if (data.success) {
                setAddresses(data.addresses ?? []);
            }
        } catch {
            setError("Unable to load your saved addresses.");
        }
    };

    useEffect(() => {
        const bootstrapLoad = async () => {
            await loadProfile();
            await loadAddresses();
            setLoading(false);
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

    const handleAddressDefaultChange = async (addressId) => {
        try {
            const response = await fetch(
                "http://localhost/quickcart-api/addresses.php",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        action: "set_default",
                        address_id: addressId,
                    }),
                },
            );

            const data = await response.json();
            if (!response.ok || !data.success) {
                setError(data.error || "Unable to update default address.");
                return;
            }

            await loadAddresses();
            setToast({
                title: "Default updated",
                message: "Your default delivery address has been changed.",
            });
        } catch {
            setError("Unable to update default address.");
        }
    };

    const handleAddressSaved = async (isEdit) => {
        await loadAddresses();
        setToast({
            title: isEdit ? "Address updated" : "Address added",
            message: isEdit
                ? "Your delivery address has been updated."
                : "Your delivery address has been saved.",
        });
        setEditingAddress(null);
    };

    const handleDeleteAddress = async (address) => {
        const confirmed = window.confirm(
            `Delete this address for ${address.recipient_name}?`,
        );

        if (!confirmed) return;

        try {
            const response = await fetch(
                "http://localhost/quickcart-api/addresses.php",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        action: "delete",
                        address_id: address.address_id,
                    }),
                },
            );

            const data = await response.json();
            if (!response.ok || !data.success) {
                setError(data.error || "Unable to delete address.");
                return;
            }

            await loadAddresses();
            setToast({
                title: "Address removed",
                message: "The selected delivery address has been removed.",
            });
        } catch {
            setError("Unable to delete address.");
        }
    };

    // Per Bootstrap's "via JavaScript" docs: set state first, then show()
    // the modal ourselves — rather than a data-bs-toggle attribute doing it
    // declaratively — so AddAddress always receives the right `address`
    // prop before it ever becomes visible.
    const openAddressModal = (address = null) => {
        setEditingAddress(address);

        const modalElement = document.getElementById("addAddressModal");
        if (modalElement) {
            Modal.getOrCreateInstance(modalElement).show();
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

                <div className="mb-3">
                    <div className="d-flex align-items-center justify-content-between gap-3">
                        <span className="form-label fw-semibold mb-0">
                            Delivery address
                        </span>
                        <button
                            className="btn btn-outline-primary btn-sm"
                            type="button"
                            onClick={() => openAddressModal(null)}
                        >
                            + Add an address
                        </button>
                    </div>

                    <div className="mt-3">
                        {addresses.length === 0 ? (
                            <div className="text-muted small">
                                No saved addresses yet.
                            </div>
                        ) : (
                            addresses.map((address) => (
                                <div
                                    className="form-check"
                                    key={address.address_id}
                                >
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="default_address"
                                        id={`address-${address.address_id}`}
                                        checked={Boolean(address.is_default)}
                                        onChange={() =>
                                            handleAddressDefaultChange(
                                                address.address_id,
                                            )
                                        }
                                    />
                                    <label
                                        className="form-check-label"
                                        htmlFor={`address-${address.address_id}`}
                                    >
                                        {address.recipient_name} —{" "}
                                        {address.address_line}, {address.city},{" "}
                                        {address.province}{" "}
                                        {address.postal_code || ""}
                                        {address.is_default ? " (Default)" : ""}
                                    </label>
                                    <button
                                        className="btn btn-link btn-sm p-0 ms-2 text-success"
                                        type="button"
                                        onClick={() =>
                                            openAddressModal(address)
                                        }
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="btn btn-link btn-sm p-0 ms-2 text-danger"
                                        type="button"
                                        onClick={() =>
                                            handleDeleteAddress(address)
                                        }
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <button
                    className="btn btn-success align-self-start"
                    type="submit"
                    disabled={saving}
                >
                    {saving ? "Saving..." : "Save changes"}
                </button>
            </form>

            <button
                className="btn btn-outline-danger mt-2 w-100"
                type="button"
                onClick={handleLogout}
            >
                Logout
            </button>

            <AddAddress address={editingAddress} onSaved={handleAddressSaved} />

            <AppToast toast={toast} onClose={() => setToast(null)} />
        </>
    );
}

export default Profile;