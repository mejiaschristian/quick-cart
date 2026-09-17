<?php
session_start();
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
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

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $products = $pdo->query(
            "SELECT
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
                COALESCE(MIN(sb.expiry_date), NULL) AS expiry_date,
                COALESCE(oi.order_count, 0) AS order_count,
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
            LEFT JOIN (
                SELECT product_id, COUNT(*) AS order_count
                FROM transaction_items
                GROUP BY product_id
            ) oi ON oi.product_id = p.product_id
            GROUP BY p.product_id, p.name, p.description, p.category_id, c.name, p.unit, p.price, p.reorder_level, p.is_active, p.created_at, p.updated_at, oi.order_count
            ORDER BY p.name ASC"
        )->fetchAll();

        $categories = $pdo->query(
            "SELECT category_id, name FROM categories ORDER BY name ASC"
        )->fetchAll();

        echo json_encode([
            "success" => true,
            "products" => $products,
            "categories" => $categories,
        ]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $input = json_decode(file_get_contents("php://input"), true) ?? [];

        $productId = (int)($input['product_id'] ?? 0);
        $name = trim($input['name'] ?? '');
        $description = trim($input['description'] ?? '');
        $categoryId = (int)($input['category_id'] ?? 0);
        $unit = trim($input['unit'] ?? 'pc');
        $price = (float)($input['price'] ?? 0);
        $active = isset($input['is_active']) ? (int)$input['is_active'] : 1;
        $imageUrl = trim($input['image_url'] ?? '');
        $stockQuantity = (int)($input['stock_quantity'] ?? 0);
        $expiryDate = trim($input['expiry_date'] ?? '');

        if ($productId <= 0 || $name === '' || $categoryId <= 0 || !in_array($unit, ['kg', 'g', 'L', 'ml', 'pc'], true)) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Product name, category, and product unit are required."]);
            exit;
        }

        if ($price < 0) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Price must be zero or greater."]);
            exit;
        }

        $pdo->beginTransaction();

        $updateStmt = $pdo->prepare(
            "UPDATE products
             SET name = ?, description = ?, category_id = ?, unit = ?, price = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
             WHERE product_id = ?"
        );

        $updateStmt->execute([
            $name,
            $description,
            $categoryId,
            $unit,
            $price,
            $active,
            $productId,
        ]);

        $pdo->prepare("DELETE FROM product_images WHERE product_id = ?")->execute([$productId]);
        if ($imageUrl !== '') {
            $pdo->prepare("INSERT INTO product_images (product_id, image_url) VALUES (?, ?)")
                ->execute([$productId, $imageUrl]);
        }

        $existingBatch = $pdo->prepare(
            "SELECT batch_id FROM stock_batches WHERE product_id = ? ORDER BY batch_id DESC LIMIT 1"
        );
        $existingBatch->execute([$productId]);
        $batch = $existingBatch->fetch();

        if ($batch) {
            $pdo->prepare(
                "UPDATE stock_batches
                 SET quantity_remaining = ?, expiry_date = ?
                 WHERE batch_id = ?"
            )->execute([
                $stockQuantity,
                $expiryDate === '' ? null : $expiryDate,
                (int)$batch['batch_id'],
            ]);
        } else if ($stockQuantity > 0 || $expiryDate !== '') {
            $pdo->prepare(
                "INSERT INTO stock_batches (product_id, quantity_remaining, expiry_date, added_by)
                 VALUES (?, ?, ?, ?)"
            )->execute([
                $productId,
                $stockQuantity,
                $expiryDate === '' ? null : $expiryDate,
                $_SESSION['user_id'] ?? null,
            ]);
        }

        $pdo->commit();

        echo json_encode([
            "success" => true,
            "message" => "Product updated successfully.",
            "product_id" => $productId,
        ]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(["success" => false, "error" => "Method not allowed."]);
        exit;
    }

    $input = json_decode(file_get_contents("php://input"), true) ?? [];

    $name = trim($input['name'] ?? '');
    $description = trim($input['description'] ?? '');
    $categoryId = (int)($input['category_id'] ?? 0);
    $unit = trim($input['unit'] ?? 'pc');
    $price = (float)($input['price'] ?? 0);
    $reorderLevel = (int)($input['reorder_level'] ?? 0);
    $active = isset($input['is_active']) ? (int)$input['is_active'] : 1;
    $imageUrl = trim($input['image_url'] ?? '');
    $stockQuantity = (int)($input['stock_quantity'] ?? 0);
    $expiryDate = trim($input['expiry_date'] ?? '');
    $adminId = $_SESSION['user_id'];

    if ($name === '' || $categoryId <= 0 || !in_array($unit, ['kg', 'g', 'L', 'ml', 'pc'], true)) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Product name, category, and product unit are required."]);
        exit;
    }

    if ($price < 0) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Price must be zero or greater."]);
        exit;
    }

    $pdo->beginTransaction();

    $productStmt = $pdo->prepare(
        "INSERT INTO products (name, description, category_id, unit, price, reorder_level, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    );

    $productStmt->execute([
        $name,
        $description,
        $categoryId,
        $unit,
        $price,
        $reorderLevel,
        $active,
    ]);

    $productId = (int)$pdo->lastInsertId();

    if ($imageUrl !== '') {
        $imageStmt = $pdo->prepare(
            "INSERT INTO product_images (product_id, image_url)
             VALUES (?, ?)"
        );
        $imageStmt->execute([$productId, $imageUrl]);
    }

    if ($stockQuantity > 0 || $expiryDate !== '') {
        $batchStmt = $pdo->prepare(
            "INSERT INTO stock_batches (product_id, quantity_remaining, expiry_date, added_by)
             VALUES (?, ?, ?, ?)"
        );
        $expiry = $expiryDate === '' ? null : $expiryDate;
        $batchStmt->execute([$productId, $stockQuantity, $expiry, $adminId]);

        $batchId = (int)$pdo->lastInsertId();

        $movementStmt = $pdo->prepare(
            "INSERT INTO stock_movements (batch_id, movement_type, quantity, reference_id, created_by)
             VALUES (?, 'stock_in', ?, ?, ?)"
        );
        $movementStmt->execute([$batchId, $stockQuantity, $productId, $adminId]);
    }

    $pdo->commit();

    echo json_encode([
        "success" => true,
        "message" => "Product added successfully.",
        "product_id" => $productId,
    ]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Unable to save product: " . $e->getMessage()]);
}
