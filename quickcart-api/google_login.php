<?php
session_start();
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

$GOOGLE_CLIENT_ID = "238416082781-p90el3d92sgvhp9tp7fva46nlqinapcr.apps.googleusercontent.com";

$data = json_decode(file_get_contents("php://input"), true);
$credential = $data['credential'] ?? '';

if (!$credential) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Missing credential."]);
    exit;
}

// Verify the token directly with Google — no library needed
$verifyUrl = "https://oauth2.googleapis.com/tokeninfo?id_token=" . urlencode($credential);
$response = file_get_contents($verifyUrl);
$payload = json_decode($response, true);

if (!$payload || $payload['aud'] !== $GOOGLE_CLIENT_ID) {
    http_response_code(401);
    echo json_encode(["success" => false, "error" => "Invalid Google token."]);
    exit;
}

$googleId = $payload['sub'];
$email = $payload['email'];
$name = $payload['name'] ?? $email;

try {
    // Check if this Google account already has a users row
    $stmt = $pdo->prepare("SELECT user_id, full_name, role FROM users WHERE google_id = ?");
    $stmt->execute([$googleId]);
    $user = $stmt->fetch();

    if (!$user) {
        // Check if the email is already registered via QuickCart signup
        $check = $pdo->prepare("SELECT user_id FROM users WHERE email = ?");
        $check->execute([$email]);
        if ($check->fetch()) {
            http_response_code(409);
            echo json_encode(["success" => false, "error" => "This email is already registered. Please log in with your password."]);
            exit;
        }

        // Create a new account for this Google user
        $insert = $pdo->prepare(
            "INSERT INTO users (full_name, email, google_id, role) VALUES (?, ?, ?, 'customer')"
        );
        $insert->execute([$name, $email, $googleId]);

        $userId = $pdo->lastInsertId();
        $role = 'customer';
        $fullName = $name;
    } else {
        $userId = $user['user_id'];
        $role = $user['role'];
        $fullName = $user['full_name'];
    }

    $_SESSION['user_id'] = $userId;
    $_SESSION['role'] = $role;
    $_SESSION['full_name'] = $fullName;

    echo json_encode([
        "success" => true,
        "user" => ["user_id" => $userId, "full_name" => $fullName, "role" => $role]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Google login failed."]);
}
