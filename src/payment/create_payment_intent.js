export async function createPayRexPaymentIntent(payload) {
    try {
        const response = await fetch(
            "http://localhost/quickcart-api/payrex_create_checkout.php",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            },
        );

        const data = await response.json();

        if (!response.ok || !data.success || !data.url) {
            throw new Error(data.error || "Unable to start PayRex checkout.");
        }

        return data.url;
    } catch {
        throw new Error("Unable to start PayRex checkout.");
    }
}
