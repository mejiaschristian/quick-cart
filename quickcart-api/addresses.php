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
$userId = $_SESSION['user_id'];

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $pdo->prepare(
            "SELECT address_id, recipient_name, phone, address_line, city, province, postal_code, is_default
             FROM user_addresses
             WHERE user_id = ?
             ORDER BY is_default DESC, address_id DESC"
        );
        $stmt->execute([$userId]);
        $addresses = $stmt->fetchAll();

        echo json_encode(["success" => true, "addresses" => $addresses]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(["success" => false, "error" => "Method not allowed."]);
        exit;
    }

    $data = json_decode(file_get_contents("php://input"), true) ?? [];
    $action = $data['action'] ?? 'create';

    if ($action === 'set_default') {
        $addressId = (int)($data['address_id'] ?? 0);

        if ($addressId <= 0) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Address is required."]);
            exit;
        }

        $pdo->beginTransaction();

        $clear = $pdo->prepare("UPDATE user_addresses SET is_default = 0 WHERE user_id = ?");
        $clear->execute([$userId]);

        $set = $pdo->prepare(
            "UPDATE user_addresses SET is_default = 1 WHERE user_id = ? AND address_id = ?"
        );
        $set->execute([$userId, $addressId]);

        $pdo->commit();

        echo json_encode(["success" => true]);
        exit;
    }

    $recipientName = trim($data['recipient_name'] ?? '');
    $phone = trim($data['phone'] ?? '');
    $addressLine = trim($data['address_line'] ?? '');
    $city = trim($data['city'] ?? '');
    $province = trim($data['province'] ?? '');
    $postalCode = trim($data['postal_code'] ?? '');
    $isDefault = isset($data['is_default']) ? (int)$data['is_default'] : 0;

    if ($recipientName === '' || $addressLine === '' || $city === '' || $province === '') {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Recipient name, address line, city, and province are required."]);
        exit;
    }

    $phone = $phone === '' ? null : $phone;
    $postalCode = $postalCode === '' ? null : $postalCode;

    $pdo->beginTransaction();

    if ($isDefault) {
        $clear = $pdo->prepare("UPDATE user_addresses SET is_default = 0 WHERE user_id = ?");
        $clear->execute([$userId]);
    }

    $stmt = $pdo->prepare(
        "INSERT INTO user_addresses (user_id, recipient_name, phone, address_line, city, province, postal_code, is_default)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );

    $stmt->execute([
        $userId,
        $recipientName,
        $phone,
        $addressLine,
        $city,
        $province,
        $postalCode,
        $isDefault ? 1 : 0,
    ]);

    $addressId = $pdo->lastInsertId();

    $pdo->commit();

    echo json_encode(["success" => true, "address_id" => (int)$addressId]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Unable to save address."]);
}
