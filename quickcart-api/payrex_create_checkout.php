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
$paymentMethod = strtolower((string)($payload["paymentMethod"] ?? "payrex"));
$existingTransactionId = isset($payload["transaction_id"]) ? (int)$payload["transaction_id"] : 0;

if (!in_array($fulfillmentType, ["delivery", "pickup"], true)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Invalid fulfillment type."]);
    exit;
}

if (!in_array($paymentMethod, ["payrex", "cash"], true)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Invalid payment method."]);
    exit;
}

try {
    $existingTransaction = null;
    if ($existingTransactionId > 0) {
        $existingStmt = $pdo->prepare(
            "SELECT t.transaction_id, t.user_id, t.total_amount, t.fulfillment_type, t.delivery_address, t.order_status,
                    p.payment_status, p.payment_method, p.payrex_session_id
             FROM transactions t
             JOIN payments p ON p.transaction_id = t.transaction_id
             WHERE t.transaction_id = ? AND t.user_id = ? AND t.order_status = 'pending'"
        );
        $existingStmt->execute([$existingTransactionId, $userId]);
        $existingTransaction = $existingStmt->fetch();
    }

    if (empty($clientCart) && !$existingTransaction) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Cart is empty."]);
        exit;
    }

    // --- Re-price and validate every item from the DB. Never trust price/name from the client. ---
    $productIds = array_values(array_unique(array_filter(array_map(
        fn($item) => (int)($item["product_id"] ?? 0),
        $clientCart ?: []
    ))));

    if (!empty($clientCart)) {
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
                "amount" => (int) round($unitPrice * 100),
            ];
        }
    } else {
        $lineItems = [];
        $orderItems = [];
        $totalAmount = (float)$existingTransaction['total_amount'];

        $itemsStmt = $pdo->prepare(
            "SELECT ti.product_id, ti.quantity, ti.unit_price, p.name
             FROM transaction_items ti
             JOIN products p ON p.product_id = ti.product_id
             WHERE ti.transaction_id = ?"
        );
        $itemsStmt->execute([$existingTransactionId]);

        foreach ($itemsStmt->fetchAll() as $item) {
            $orderItems[] = [
                "product_id" => (int)$item['product_id'],
                "quantity" => (int)$item['quantity'],
                "unit_price" => (float)$item['unit_price'],
            ];

            $lineItems[] = [
                "name" => $item['name'],
                "quantity" => (int)$item['quantity'],
                "amount" => (int) round((float)$item['unit_price'] * 100),
            ];
        }
    }

    if (empty($lineItems)) {
        throw new Exception("There are no items to checkout.");
    }

    // --- Resolve delivery address (delivery orders only) ---
    $deliveryAddress = null;

    if ($totalAmount < 20) {
        throw new Exception("Your order must total at least ₱20.00 to check out with PayRex.");
    }

    if ($fulfillmentType === 'delivery') {
        if (!$selectedAddressId && !$existingTransaction) {
            throw new Exception("Please select a delivery address.");
        }

        if ($selectedAddressId) {
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
        } elseif (!empty($existingTransaction['delivery_address'])) {
            $deliveryAddress = $existingTransaction['delivery_address'];
        }
    }

    $transactionId = $existingTransactionId > 0 ? $existingTransactionId : null;

    // --- Create or reuse the order as 'pending' BEFORE contacting PayRex ---
    $pdo->beginTransaction();

    if ($transactionId) {
        $pdo->prepare(
            "UPDATE transactions
             SET total_amount = ?, fulfillment_type = ?, delivery_address = ?, order_status = 'pending', updated_at = CURRENT_TIMESTAMP
             WHERE transaction_id = ? AND user_id = ?"
        )->execute([$totalAmount, $fulfillmentType, $deliveryAddress, $transactionId, $userId]);

        $pdo->prepare("DELETE FROM transaction_items WHERE transaction_id = ?")->execute([$transactionId]);

        $itemStmt = $pdo->prepare(
            "INSERT INTO transaction_items (transaction_id, product_id, quantity, unit_price)
             VALUES (?, ?, ?, ?)"
        );
        foreach ($orderItems as $item) {
            $itemStmt->execute([$transactionId, $item['product_id'], $item['quantity'], $item['unit_price']]);
        }

        $paymentMethodValue = $paymentMethod === "cash" ? "cash" : "payrex";

        $pdo->prepare(
            "UPDATE payments
             SET payment_method = ?, amount = ?, payment_status = 'pending', payment_reference = NULL, paid_at = NULL
             WHERE transaction_id = ?"
        )->execute([$paymentMethodValue, $totalAmount, $transactionId]);
    } else {
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

        $paymentMethodValue = $paymentMethod === "cash" ? "cash" : "payrex";

        $paymentStmt = $pdo->prepare(
            "INSERT INTO payments (transaction_id, payment_method, amount, payment_status)
             VALUES (?, ?, ?, 'pending')"
        );
        $paymentStmt->execute([$transactionId, $paymentMethodValue, $totalAmount]);
    }

    if ($paymentMethod === "cash") {
        $pdo->commit();
        echo json_encode([
            "success" => true,
            "transaction_id" => $transactionId,
            "message" => "Order placed successfully. Pay on pickup.",
        ]);
        exit;
    }

    // --- Create the PayRex checkout session ---
    $secret = getenv("PAYREX_SECRET_KEY");
    if (!$secret) {
        throw new Exception("PAYREX_SECRET_KEY is not configured on the server.");
    }

    $client = new \PayRex\Client($secret);

    $payrexPayload = [
        "currency" => "PHP",
        "line_items" => $lineItems,
        "success_url" => "http://localhost:5173/orders?checkout=success&order=" . $transactionId,
        "cancel_url" => "http://localhost:5173/orders?checkout=cancel&order=" . $transactionId,
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