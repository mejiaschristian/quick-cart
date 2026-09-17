<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require "db_connection.php";

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents("php://input"), true) ?? [];

        $name = trim($input["name"] ?? "");
        $description = trim($input["description"] ?? "");

        if ($name === "") {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Category name is required."]);
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO categories (name, description) VALUES (?, ?)");
        $stmt->execute([$name, $description]);

        $categoryId = (int)$pdo->lastInsertId();

        echo json_encode([
            "success" => true,
            "category" => [
                "category_id" => $categoryId,
                "name" => $name,
                "description" => $description,
                "created_at" => date("c"),
            ],
        ]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $pdo->query("
            SELECT
                category_id,
                name,
                description,
                created_at
            FROM categories
            ORDER BY name ASC
        ");

        echo json_encode([
            "success" => true,
            "categories" => $stmt->fetchAll()
        ]);
        exit;
    }

    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Method not allowed."]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Unable to save category: " . $e->getMessage()]);
}
