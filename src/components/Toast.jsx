import { useEffect, useRef } from "react";
import Toast from "bootstrap/js/dist/toast";

export default function AppToast({ toast, onClose }) {
    const toastRef = useRef(null);

    useEffect(() => {
        const toastElement = toastRef.current;
        if (!toastElement) return;

        const handleHidden = () => onClose?.();
        toastElement.addEventListener("hidden.bs.toast", handleHidden);

        return () => {
            toastElement.removeEventListener("hidden.bs.toast", handleHidden);
        };
    }, []);

    useEffect(() => {
        if (!toastRef.current || !toast) return;

        Toast.getOrCreateInstance(toastRef.current, {
            autohide: true,
            delay: 2600,
        }).show();
    }, [toast]);

    return (
        <div
            className="toast-container position-fixed bottom-0 end-0 p-3"
            aria-live="polite"
            aria-atomic="true"
        >
            <div
                ref={toastRef}
                className="toast hide"
                role="status"
                aria-live="polite"
                aria-atomic="true"
            >
                <div className="toast-header">
                    <strong className="me-auto">
                        {toast?.title || "QuickCart"}
                    </strong>
                    <button
                        type="button"
                        className="btn-close"
                        data-bs-dismiss="toast"
                        aria-label="Close"
                    />
                </div>
                <div className="toast-body">{toast?.message || ""}</div>
            </div>
        </div>
    );
}
