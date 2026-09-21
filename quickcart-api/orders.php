<?php
session_start();
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "error" => "You must be logged in."]);
    exit;
}

require "db_connection.php";
require __DIR__ . "/payrex-php-client.php";
require __DIR__ . "/config.php";

$userId = (int) $_SESSION['user_id'];

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $raw = file_get_contents("php://input");
        $payload = json_decode($raw, true) ?? [];
        $action = $payload['action'] ?? null;
        $transactionId = isset($payload['transaction_id']) ? (int)$payload['transaction_id'] : 0;

        if ($action === 'cancel_order') {
            if ($transactionId <= 0) {
                http_response_code(400);
                echo json_encode(["success" => false, "error" => "Invalid transaction id."]);
                exit;
            }

            $checkStmt = $pdo->prepare(
                "SELECT t.transaction_id, t.order_status, p.payment_status
                 FROM transactions t
                 JOIN payments p ON p.transaction_id = t.transaction_id
                 WHERE t.transaction_id = ? AND t.user_id = ?"
            );
            $checkStmt->execute([$transactionId, $userId]);
            $order = $checkStmt->fetch();

            if (!$order) {
                http_response_code(404);
                echo json_encode(["success" => false, "error" => "Order not found."]);
                exit;
            }

            $pdo->prepare(
                "UPDATE transactions SET order_status = 'cancelled' WHERE transaction_id = ? AND user_id = ?"
            )->execute([$transactionId, $userId]);

            $pdo->prepare(
                "UPDATE payments SET payment_status = 'failed' WHERE transaction_id = ? AND payment_status = 'pending'"
            )->execute([$transactionId]);

            echo json_encode(["success" => true, "message" => "Order cancelled."]);
            exit;
        }

        if ($action === 'retry_payment') {
            if ($transactionId <= 0) {
                http_response_code(400);
                echo json_encode(["success" => false, "error" => "Invalid transaction id."]);
                exit;
            }

            $orderStmt = $pdo->prepare(
                "SELECT t.transaction_id, t.total_amount, t.order_status, p.payment_method, p.payment_status, p.payrex_session_id
                 FROM transactions t
                 JOIN payments p ON p.transaction_id = t.transaction_id
                 WHERE t.transaction_id = ? AND t.user_id = ? AND t.order_status = 'pending'"
            );
            $orderStmt->execute([$transactionId, $userId]);
            $order = $orderStmt->fetch();

            if (!$order) {
                http_response_code(404);
                echo json_encode(["success" => false, "error" => "Pending PayRex order not found."]);
                exit;
            }

            if (($order['payment_method'] ?? '') !== 'payrex') {
                http_response_code(400);
                echo json_encode(["success" => false, "error" => "This order is not using PayRex."]);
                exit;
            }

            $lineItems = [];
            $itemsStmt = $pdo->prepare(
                "SELECT ti.quantity, ti.unit_price, p.name
                 FROM transaction_items ti
                 JOIN products p ON p.product_id = ti.product_id
                 WHERE ti.transaction_id = ?"
            );
            $itemsStmt->execute([$transactionId]);

            foreach ($itemsStmt->fetchAll() as $item) {
                $lineItems[] = [
                    "name" => $item['name'],
                    "quantity" => (int)$item['quantity'],
                    "amount" => (int) round((float)$item['unit_price'] * 100),
                ];
            }

            if (empty($lineItems)) {
                http_response_code(400);
                echo json_encode(["success" => false, "error" => "This order has no items to pay for."]);
                exit;
            }

            $secret = getenv("PAYREX_SECRET_KEY");
            if (!$secret) {
                http_response_code(500);
                echo json_encode(["success" => false, "error" => "PayRex secret key is not configured."]);
                exit;
            }

            $client = new \PayRex\Client($secret);
            $session = $client->checkoutSessions->create([
                "currency" => "PHP",
                "line_items" => $lineItems,
                "success_url" => "http://localhost:5173/orders?checkout=success&order=" . $transactionId,
                "cancel_url" => "http://localhost:5173/orders?checkout=cancel&order=" . $transactionId,
                "metadata" => [
                    "cart_source" => "quickcart",
                    "transaction_id" => (string)$transactionId,
                    "user_id" => (string)$userId,
                ],
            ]);

            $pdo->prepare(
                "UPDATE payments
                 SET payrex_session_id = ?, payment_status = 'pending', payment_reference = NULL, paid_at = NULL
                 WHERE transaction_id = ?"
            )->execute([$session->id, $transactionId]);

            echo json_encode(["success" => true, "url" => $session->url, "transaction_id" => $transactionId]);
            exit;
        }

        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Unsupported action."]);
        exit;
    }

    // GET request handling
    // Pass ?transaction_id=123 for a single order (e.g. an order confirmation
    // page); omit it to list all of the logged-in customer's orders.
    $transactionId = isset($_GET['transaction_id']) ? (int)$_GET['transaction_id'] : null;

    $sql = "
        SELECT
            t.transaction_id,
            t.total_amount,
            t.fulfillment_type,
            t.delivery_address,
            t.order_status,
            t.created_at,
            p.payment_method,
            p.payment_status,
            p.payment_reference,
            p.paid_at
        FROM transactions t
        JOIN payments p ON p.transaction_id = t.transaction_id
        WHERE t.user_id = ?
    ";
    $params = [$userId];

    if ($transactionId) {
        $sql .= " AND t.transaction_id = ?";
        $params[] = $transactionId;
    }

    $sql .= " ORDER BY t.created_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $orders = $stmt->fetchAll();

    if ($transactionId && !$orders) {
        http_response_code(404);
        echo json_encode(["success" => false, "error" => "Order not found."]);
        exit;
    }

    $itemsStmt = $pdo->prepare(
        "SELECT ti.product_id, p.name, ti.quantity, ti.unit_price
         FROM transaction_items ti
         JOIN products p ON p.product_id = ti.product_id
         WHERE ti.transaction_id = ?"
    );

    foreach ($orders as &$order) {
        $itemsStmt->execute([$order['transaction_id']]);
        $order['items'] = $itemsStmt->fetchAll();
    }
    unset($order);

    if ($transactionId) {
        echo json_encode(["success" => true, "order" => $orders[0]]);
    } else {
        echo json_encode(["success" => true, "orders" => $orders]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Unable to load orders."]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
