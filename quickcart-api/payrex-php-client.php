<?php

namespace PayRex;

class Client
{
    private string $secretKey;
    public object $checkoutSessions;

    public function __construct(string $secretKey)
    {
        $this->secretKey = $secretKey;
        $this->checkoutSessions = new CheckoutSessions($secretKey);
    }
}

class CheckoutSessions
{
    private string $secretKey;

    public function __construct(string $secretKey)
    {
        $this->secretKey = $secretKey;
    }

    public function create(array $payload): object
    {
        $ch = curl_init("https://api.payrexhq.com/checkout_sessions");

        curl_setopt($ch, CURLOPT_POST, true);
        // PayRex expects form-urlencoded data (line_items[][name]=..., etc.),
        // not a JSON body. http_build_query produces the matching bracket syntax.
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($payload));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        // PayRex authenticates via HTTP Basic Auth: secret key as the username,
        // blank password. It is NOT a Bearer token.
        curl_setopt($ch, CURLOPT_USERPWD, $this->secretKey . ":");
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Accept: application/json",
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if ($response === false || $httpCode < 200 || $httpCode >= 300) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new \RuntimeException($error ?: "PayRex checkout session failed: HTTP $httpCode $response");
        }

        curl_close($ch);
        $data = json_decode($response, false);

        if (!isset($data->url)) {
            throw new \RuntimeException("PayRex checkout session did not return a URL.");
        }

        // Return the session id too — you need it to store against the order
        // and to match it back up when the webhook fires.
        return (object)[
            "id" => $data->id ?? null,
            "url" => $data->url,
        ];
    }
}