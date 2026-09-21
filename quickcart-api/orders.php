<?php
session_start();
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, OPTIONS");
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
$userId = $_SESSION['user_id'];

try {
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
}
