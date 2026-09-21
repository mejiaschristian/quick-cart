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

if (!isset($_SESSION['user_id']) || !in_array($_SESSION['role'] ?? '', ['admin', 'staff'], true)) {
    http_response_code(403);
    echo json_encode(["success" => false, "error" => "You are not authorized to view this."]);
    exit;
}

require "db_connection.php";

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(["success" => false, "error" => "Method not allowed."]);
        exit;
    }

    $stmt = $pdo->query("
        SELECT
            t.transaction_id,
            t.user_id,
            u.full_name AS customer_name,
            u.email AS customer_email,
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
        JOIN users u ON u.user_id = t.user_id
        JOIN payments p ON p.transaction_id = t.transaction_id
        ORDER BY t.created_at DESC
    ");
    $orders = $stmt->fetchAll();

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

    echo json_encode(["success" => true, "orders" => $orders]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Unable to load orders."]);
}
