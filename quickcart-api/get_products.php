<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require "db_connection.php";

try {
    $stmt = $pdo->query("
        SELECT
            p.product_id,
            p.name,
            p.description,
            p.category_id,
            c.name AS category_name,
            p.unit,
            p.price,
            p.reorder_level,
            p.is_active,
            p.created_at,
            p.updated_at,
            COALESCE(SUM(sb.quantity_remaining), 0) AS stock_quantity,
            (
                SELECT pi.image_url
                FROM product_images pi
                WHERE pi.product_id = p.product_id
                ORDER BY pi.image_id ASC
                LIMIT 1
            ) AS image_url
        FROM products p
        JOIN categories c ON c.category_id = p.category_id
        LEFT JOIN stock_batches sb ON sb.product_id = p.product_id
        GROUP BY p.product_id, p.name, p.description, p.category_id, c.name, p.unit, p.price, p.reorder_level, p.is_active, p.created_at, p.updated_at
        ORDER BY p.name ASC
    ");

    $products = $stmt->fetchAll();
    echo json_encode(["success" => true, "products" => $products]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Query failed: " . $e->getMessage()]);
}
