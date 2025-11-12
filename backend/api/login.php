<?php

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../db.php';
session_start();

$data = json_decode(file_get_contents("php://input"), true);

$identificacion = $data["identificacion"] ?? '';
$password = $data["password"] ?? '';

if (empty($identificacion) || empty($password)) {
    http_response_code(400);
    echo json_encode(["error" => "Faltan credenciales"]);
    $conn->close();
    exit;
}

// Buscar usuario por IDENTIFICACION en lugar de ID
$stmt = $conn->prepare("SELECT id, identificacion, nombre, email, password, perfil FROM usuarios WHERE identificacion = ?");
$stmt->bind_param("s", $identificacion);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(401);
    echo json_encode(["error" => "Credenciales inválidas"]);
    $stmt->close();
    $conn->close();
    exit;
}

$usuario = $result->fetch_assoc();
$stmt->close();

if (password_verify($password, $usuario['password'])) {
    $token = bin2hex(random_bytes(32));
    
    $_SESSION['user'] = [
        "id" => $usuario["id"],
        "identificacion" => $usuario["identificacion"],
        "nombre" => $usuario["nombre"],
        "email" => $usuario["email"],
        "perfil" => $usuario["perfil"]
    ];
    $_SESSION['token'] = $token;
    
    http_response_code(200);
    echo json_encode([
        "ok" => true,
        "user" => [
            "id" => $usuario["id"],
            "identificacion" => $usuario["identificacion"],
            "nombre" => $usuario["nombre"],
            "email" => $usuario["email"],
            "perfil" => $usuario["perfil"]
        ],
        "token" => $token,
        "admin_id" => $usuario["id"]
    ]);
} else {
    http_response_code(401);
    echo json_encode(["error" => "Credenciales inválidas"]);
}

$conn->close();
?>