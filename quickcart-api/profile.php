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
        $stmt = $pdo->prepare("SELECT email, full_name FROM users WHERE user_id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user) {
            http_response_code(404);
            echo json_encode(["success" => false, "error" => "User not found."]);
            exit;
        }

        echo json_encode(["success" => true, "user" => $user]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(["success" => false, "error" => "Method not allowed."]);
        exit;
    }

    $data = json_decode(file_get_contents("php://input"), true);
    $fullName = trim($data['full_name'] ?? '');

    if ($fullName === '') {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Full name is required."]);
        exit;
    }

    if (mb_strlen($fullName) > 35 || mb_strlen($fullName) < 3) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Full name must be 35 characters or fewer."]);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE users SET full_name = ? WHERE user_id = ?");
    $stmt->execute([$fullName, $userId]);

    $_SESSION['full_name'] = $fullName;
    echo json_encode(["success" => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Unable to update profile."]);
}
