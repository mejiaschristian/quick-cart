import { useState } from "react";
import { Modal } from "bootstrap";

const emptyAddress = {
    recipient_name: "",
    phone: "",
    address_line: "",
    city: "",
    province: "",
    postal_code: "",
    is_default: false,
};

function AddAddress({ onSaved = () => {} }) {
    const [form, setForm] = useState(emptyAddress);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const closeModal = () => {
        const modalElement = document.getElementById("addAddressModal");
        if (!modalElement) {
            return;
        }

        const modal = Modal.getOrCreateInstance(modalElement);
        modal.hide();
    };

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;
        setForm((current) => ({
            ...current,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSaving(true);

        try {
            const response = await fetch(
                "http://localhost/quickcart-api/addresses.php",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(form),
                },
            );

            const data = await response.json();
            if (!response.ok || !data.success) {
                setError(data.error || "Unable to save address.");
                return;
            }

            onSaved();
            closeModal();
            setForm(emptyAddress);
        } catch {
            setError("Unable to save address.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="modal fade"
            id="addAddressModal"
            tabIndex="-1"
            aria-labelledby="addAddressModalLabel"
            aria-hidden="true"
        >
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <form onSubmit={handleSubmit}>
                        <div className="modal-header">
                            <h5
                                className="modal-title"
                                id="addAddressModalLabel"
                            >
                                Add address
                            </h5>
                            <button
                                className="btn-close"
                                type="button"
                                data-bs-dismiss="modal"
                                aria-label="Close"
                            ></button>
                        </div>

                        <div className="modal-body">
                            {error && (
                                <div className="alert alert-danger">
                                    {error}
                                </div>
                            )}

                            <div className="mb-3">
                                <label className="form-label fw-semibold">
                                    Recipient name
                                </label>
                                <input
                                    className="form-control"
                                    name="recipient_name"
                                    type="text"
                                    value={form.recipient_name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-semibold">
                                    Phone
                                </label>
                                <input
                                    className="form-control"
                                    name="phone"
                                    type="tel"
                                    value={form.phone}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-semibold">
                                    Address line
                                </label>
                                <input
                                    className="form-control"
                                    name="address_line"
                                    type="text"
                                    value={form.address_line}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="row g-3">
                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">
                                        City
                                    </label>
                                    <input
                                        className="form-control"
                                        name="city"
                                        type="text"
                                        value={form.city}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">
                                        Province
                                    </label>
                                    <input
                                        className="form-control"
                                        name="province"
                                        type="text"
                                        value={form.province}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">
                                        Postal code
                                    </label>
                                    <input
                                        className="form-control"
                                        name="postal_code"
                                        type="text"
                                        value={form.postal_code}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="form-check mt-3">
                                <input
                                    className="form-check-input"
                                    id="isDefaultAddress"
                                    name="is_default"
                                    type="checkbox"
                                    checked={form.is_default}
                                    onChange={handleChange}
                                />
                                <label
                                    className="form-check-label"
                                    htmlFor="isDefaultAddress"
                                >
                                    Set as default address
                                </label>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                className="btn btn-outline-secondary"
                                type="button"
                                data-bs-dismiss="modal"
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-success"
                                type="submit"
                                disabled={saving}
                            >
                                {saving ? "Saving..." : "Save address"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default AddAddress;
