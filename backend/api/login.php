<?php
// CORS - Permitir solicitudes desde el frontend
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

// Preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Iniciar sesión después de los headers
session_start();
header("Content-Type: application/json; charset=UTF-8");

// Usuario codificado para pruebas
$usuarioPrueba = [
    "id" => 1,
    "nombre" => "Bachata",
    "email" => "admin@app.com",
    "password" => "Admin123",
    "perfil" => "trabajador"
];

// Leer datos del frontend
$data = json_decode(file_get_contents("php://input"), true);

$id = $data["id"] ?? '';
$password = $data["password"] ?? '';

if (!$id || !$password) {
    http_response_code(400);
    echo json_encode(["error" => "Faltan credenciales"]);
    exit;
}

// Verificar usuario codificado
if ((int)$id === $usuarioPrueba["id"] && $password === $usuarioPrueba["password"]) {
    $_SESSION['user'] = $usuarioPrueba;
    $token = bin2hex(random_bytes(16));

    echo json_encode([
        "ok" => true,
        "user" => [
            "id" => $usuarioPrueba["id"],
            "nombre" => $usuarioPrueba["nombre"],
            "email" => $usuarioPrueba["email"],
            "perfil" => $usuarioPrueba["perfil"]
        ],
        "token" => $token
    ]);
} else {
    http_response_code(401);
    echo json_encode(["error" => "Credenciales inválidas"]);
}
?>