import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function GoogleSignIn() {
    const navigate = useNavigate();
    const { refreshUser } = useAuth();

    useEffect(() => {
        const handleCredentialResponse = async (response) => {
            try {
                const res = await fetch(
                    "http://localhost/quickcart-api/google_login.php",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({
                            credential: response.credential,
                        }),
                    },
                );

                const data = await res.json();
                console.log("Google Auth Response:", data); // Debug log

                if (data.success) {
                    const nextUser = await refreshUser();
                    navigate(nextUser?.role === "admin" ? "/admin" : "/", {
                        replace: true,
                    });
                } else {
                    console.error(
                        "Google login failed on backend:",
                        data.error,
                    );
                }
            } catch (error) {
                console.error("Error during Google Sign-In fetch:", error);
            }
        };

        const renderGoogleButton = () => {
            if (!window.google) return false;

            window.google.accounts.id.initialize({
                client_id:
                    "238416082781-p90el3d92sgvhp9tp7fva46nlqinapcr.apps.googleusercontent.com",
                callback: handleCredentialResponse,
            });

            window.google.accounts.id.renderButton(
                document.getElementById("googleSignInDiv"),
                { theme: "outline", size: "large", width: "100%" },
            );

            return true;
        };

        if (renderGoogleButton()) return undefined;

        const sdkCheck = window.setInterval(() => {
            if (renderGoogleButton()) window.clearInterval(sdkCheck);
        }, 100);

        return () => window.clearInterval(sdkCheck);
    }, [navigate, refreshUser]);

    return <div id="googleSignInDiv"></div>;
}

export default GoogleSignIn;
