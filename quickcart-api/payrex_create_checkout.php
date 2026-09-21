<?php
session_start();

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Only POST is allowed."]);
    exit;
}

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "error" => "You must be logged in."]);
    exit;
}

require __DIR__ . "/db_connection.php";
require __DIR__ . "/payrex-php-client.php";
require __DIR__ . "/config.php"; // <- put putenv() calls for local secrets here, see notes

$userId = (int) $_SESSION['user_id'];

$raw = file_get_contents("php://input");
$payload = json_decode($raw, true);

if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Invalid JSON payload."]);
    exit;
}

$fulfillmentType = $payload["fulfillmentType"] ?? "delivery";
$selectedAddressId = $payload["selectedAddressId"] ?? null;
$clientCart = $payload["cart"] ?? [];

if (!in_array($fulfillmentType, ["delivery", "pickup"], true)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Invalid fulfillment type."]);
    exit;
}

if (empty($clientCart)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Cart is empty."]);
    exit;
}

try {
    // --- Re-price and validate every item from the DB. Never trust price/name from the client. ---
    $productIds = array_values(array_unique(array_filter(array_map(
        fn($item) => (int)($item["product_id"] ?? 0),
        $clientCart
    ))));

    if (empty($productIds)) {
        throw new Exception("Cart items are missing product IDs.");
    }

    $placeholders = implode(",", array_fill(0, count($productIds), "?"));
    $stmt = $pdo->prepare(
        "SELECT p.product_id, p.name, p.price, p.is_active,
                COALESCE(SUM(sb.quantity_remaining), 0) AS stock_quantity
         FROM products p
         LEFT JOIN stock_batches sb ON sb.product_id = p.product_id
         WHERE p.product_id IN ($placeholders)
         GROUP BY p.product_id, p.name, p.price, p.is_active"
    );
    $stmt->execute($productIds);

    $dbProducts = [];
    foreach ($stmt->fetchAll() as $row) {
        $dbProducts[(int)$row['product_id']] = $row;
    }

    $lineItems = [];   // for PayRex
    $orderItems = [];  // for transaction_items
    $totalAmount = 0.0;

    foreach ($clientCart as $item) {
        $productId = (int)($item["product_id"] ?? 0);
        $quantity = max(1, (int)($item["quantity"] ?? 1));

        if (!isset($dbProducts[$productId])) {
            throw new Exception("One of the items in your cart is no longer available.");
        }

        $product = $dbProducts[$productId];

        if (!$product['is_active']) {
            throw new Exception($product['name'] . " is currently unavailable.");
        }

        if ($quantity > (int)$product['stock_quantity']) {
            throw new Exception("Not enough stock for " . $product['name'] . ".");
        }

        $unitPrice = (float)$product['price'];
        $totalAmount += $unitPrice * $quantity;

        $orderItems[] = [
            "product_id" => $productId,
            "quantity" => $quantity,
            "unit_price" => $unitPrice,
        ];

        $lineItems[] = [
            "name" => $product['name'],
            "quantity" => $quantity,
            // PayRex calls this "amount" — it's the unit price in centavos.
            "amount" => (int) round($unitPrice * 100),
        ];
    }

    // --- Resolve delivery address (delivery orders only) ---
    $deliveryAddress = null;
    if ($fulfillmentType === 'delivery') {
        if (!$selectedAddressId) {
            throw new Exception("Please select a delivery address.");
        }
        $addrStmt = $pdo->prepare(
            "SELECT address_line, city, province, postal_code
             FROM user_addresses WHERE address_id = ? AND user_id = ?"
        );
        $addrStmt->execute([(int)$selectedAddressId, $userId]);
        $address = $addrStmt->fetch();

        if (!$address) {
            throw new Exception("Selected address was not found.");
        }

        $deliveryAddress = trim(
            "{$address['address_line']}, {$address['city']}, {$address['province']} {$address['postal_code']}"
        );
    }

    // --- Create the order as 'pending' BEFORE contacting PayRex ---
    $pdo->beginTransaction();

    $txnStmt = $pdo->prepare(
        "INSERT INTO transactions (user_id, total_amount, fulfillment_type, delivery_address, order_status)
         VALUES (?, ?, ?, ?, 'pending')"
    );
    $txnStmt->execute([$userId, $totalAmount, $fulfillmentType, $deliveryAddress]);
    $transactionId = (int)$pdo->lastInsertId();

    $itemStmt = $pdo->prepare(
        "INSERT INTO transaction_items (transaction_id, product_id, quantity, unit_price)
         VALUES (?, ?, ?, ?)"
    );
    foreach ($orderItems as $item) {
        $itemStmt->execute([$transactionId, $item['product_id'], $item['quantity'], $item['unit_price']]);
    }

    $paymentStmt = $pdo->prepare(
        "INSERT INTO payments (transaction_id, payment_method, amount, payment_status)
         VALUES (?, 'payrex', ?, 'pending')"
    );
    $paymentStmt->execute([$transactionId, $totalAmount]);

    // --- Create the PayRex checkout session ---
    $secret = getenv("PAYREX_SECRET_KEY");
    if (!$secret) {
        throw new Exception("PAYREX_SECRET_KEY is not configured on the server.");
    }

    $client = new \PayRex\Client($secret);

    $payrexPayload = [
        "currency" => "PHP",
        "line_items" => $lineItems,
        "success_url" => "http://localhost:5173/cart?checkout=success&order=" . $transactionId,
        "cancel_url" => "http://localhost:5173/cart?checkout=cancel&order=" . $transactionId,
        "metadata" => [
            "cart_source" => "quickcart",
            "transaction_id" => (string) $transactionId,
            "user_id" => (string) $userId,
        ],
    ];

    $session = $client->checkoutSessions->create($payrexPayload);

    $pdo->prepare("UPDATE payments SET payrex_session_id = ? WHERE transaction_id = ?")
        ->execute([$session->id, $transactionId]);

    $pdo->commit();

    echo json_encode([
        "success" => true,
        "url" => $session->url,
        "transaction_id" => $transactionId,
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(400);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}