<?php
session_start();
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

$_SESSION = [];
session_destroy();
echo json_encode(["success" => true]);
?>