<?php
session_start();
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

if (isset($_SESSION['user_id'])) {
    echo json_encode([
        "loggedIn" => true,
        "user" => [
            "user_id" => $_SESSION['user_id'],
            "full_name" => $_SESSION['full_name'],
            "role" => $_SESSION['role']
        ]
    ]);
} else {
    echo json_encode(["loggedIn" => false]);
}
