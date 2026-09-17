<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require "db_connection.php";

$data = json_decode(file_get_contents("php://input"), true);
$name = trim($data['name'] ?? '');
$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

if ($name === '' || $email === '' || $password === '') {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "All fields are required."]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Invalid email format."]);
    exit;
}

if (strlen($password) < 8) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Password must be at least 8 characters."]);
    exit;
}

try {
    // Check for existing email
    $check = $pdo->prepare("SELECT user_id FROM users WHERE email = ?");
    $check->execute([$email]);

    if ($check->fetch()) {
        http_response_code(409);
        echo json_encode(["success" => false, "error" => "An account with this email already exists."]);
        exit;
    }

    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare(
        "INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, 'customer')"
    );
    $stmt->execute([$name, $email, $hashedPassword]);

    echo json_encode(["success" => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Registration failed."]);
}
