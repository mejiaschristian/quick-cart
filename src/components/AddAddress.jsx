import { useEffect, useRef, useState } from "react";
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

function AddAddress({ address = null, onSaved = () => {} }) {
    const [form, setForm] = useState(emptyAddress);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const modalRef = useRef(null);

    useEffect(() => {
        if (!address) {
            setForm(emptyAddress);
            return;
        }

        setForm({
            ...emptyAddress,
            ...address,
            is_default: Boolean(address.is_default),
        });
    }, [address]);

    // "hidden.bs.modal" fires once the modal has finished closing, no matter
    // whether that was a successful save, Cancel, Escape, or a backdrop click.
    // Resetting here (instead of only after a successful submit) is what
    // stops stale form values from carrying over into the next time it opens.
    useEffect(() => {
        const modalElement = modalRef.current;
        if (!modalElement) return undefined;

        const handleHidden = () => {
            setForm(emptyAddress);
            setError("");
        };

        modalElement.addEventListener("hidden.bs.modal", handleHidden);
        return () =>
            modalElement.removeEventListener("hidden.bs.modal", handleHidden);
    }, []);

    const closeModal = () => {
        if (!modalRef.current) return;
        Modal.getOrCreateInstance(modalRef.current).hide();
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
            const payload = {
                ...(address?.address_id
                    ? { address_id: address.address_id }
                    : {}),
                ...(address ? { action: "update" } : { action: "create" }),
                ...form,
            };

            const response = await fetch(
                "http://localhost/quickcart-api/addresses.php",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(payload),
                },
            );

            const data = await response.json();
            if (!response.ok || !data.success) {
                setError(data.error || "Unable to save address.");
                return;
            }

            onSaved?.(Boolean(address?.address_id));
            closeModal(); // form/error reset is handled by the hidden.bs.modal listener above
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
            ref={modalRef}
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
                                {address ? "Edit address" : "Add address"}
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
                                    Recipient name{" "}
                                    <span className="text-danger">*</span>
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
                                    Phone <span className="text-danger">*</span>
                                </label>
                                <input
                                    className="form-control"
                                    name="phone"
                                    type="tel"
                                    placeholder="09XXXXXXXXX"
                                    maxLength="11"
                                    minLength="11"
                                    pattern="^09[0-9]{9}$"
                                    title="Please enter a valid 11-digit Philippine mobile number starting with 09"
                                    value={form.phone}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-semibold">
                                    Address line{" "}
                                    <span className="text-danger">*</span>
                                </label>
                                <input
                                    className="form-control"
                                    name="address_line"
                                    type="text"
                                    placeholder="Block No., Lot No., Street Name"
                                    value={form.address_line}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="row g-3">
                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">
                                        City{" "}
                                        <span className="text-danger">*</span>
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
                                        Province{" "}
                                        <span className="text-danger">*</span>
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
                                        Postal code{" "}
                                        <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        className="form-control"
                                        name="postal_code"
                                        type="text"
                                        value={form.postal_code}
                                        onChange={handleChange}
                                        required
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
                                {saving
                                    ? "Saving..."
                                    : address
                                      ? "Save changes"
                                      : "Save address"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default AddAddress;
