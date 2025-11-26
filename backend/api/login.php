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

// ⭐ MODIFICADO: Incluir empresa_id en la consulta
$stmt = $conn->prepare("SELECT id, identificacion, nombre, email, password, perfil, empresa_id FROM usuarios WHERE identificacion = ?");
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
    
    // ⭐ MODIFICADO: Incluir empresa_id en la sesión
    $_SESSION['user'] = [
        "id" => $usuario["id"],
        "identificacion" => $usuario["identificacion"],
        "nombre" => $usuario["nombre"],
        "email" => $usuario["email"],
        "perfil" => $usuario["perfil"],
        "empresa_id" => $usuario["empresa_id"] ? (int)$usuario["empresa_id"] : null
    ];
    $_SESSION['token'] = $token;
    
    // ⭐ MODIFICADO: Incluir empresa_id en la respuesta
    http_response_code(200);
    echo json_encode([
        "ok" => true,
        "user" => [
            "id" => (int)$usuario["id"],
            "identificacion" => $usuario["identificacion"],
            "nombre" => $usuario["nombre"],
            "email" => $usuario["email"],
            "perfil" => $usuario["perfil"],
            "empresa_id" => $usuario["empresa_id"] ? (int)$usuario["empresa_id"] : null
        ],
        "token" => $token,
        "admin_id" => (int)$usuario["id"]
    ]);
} else {
    http_response_code(401);
    echo json_encode(["error" => "Credenciales inválidas"]);
}

$conn->close();
?>