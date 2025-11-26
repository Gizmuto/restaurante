<?php
// Forzar salida JSON y evitar mostrar warnings en pantalla (usar logs)
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Evitar que cualquier salida previa rompa el JSON
ob_start();

/**
 * Enviar respuesta JSON y terminar ejecución.
 */
function send_json($code, $data) {
    // Limpiar cualquier salida previa
    if (ob_get_length()) ob_clean();
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    send_json(200, ["ok" => true]);
}

require_once __DIR__ . '/../db.php';

$metodo = $_SERVER['REQUEST_METHOD'];

// GET - Listar usuarios
if ($metodo === 'GET') {
    $sql = "SELECT id, identificacion, nombre, email, perfil FROM usuarios ORDER BY id DESC";
    $result = $conn->query($sql);
    
    $usuarios = [];
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $usuarios[] = $row;
        }
    }
    
    send_json(200, ["usuarios" => $usuarios]);
}

// POST - Crear usuario (SIN validación de admin)
if ($metodo === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $identificacion = trim($data['identificacion'] ?? '');
    $nombre = trim($data['nombre'] ?? '');
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';
    $perfil = $data['perfil'] ?? 'trabajador';
    $empresa_id = isset($data['empresa_id']) && is_numeric($data['empresa_id']) ? intval($data['empresa_id']) : null;
    
    // Validar campos obligatorios
    if (empty($identificacion) || empty($nombre) || empty($email) || empty($password)) {
        send_json(400, ["error" => "Todos los campos son obligatorios"]);
    }
    
    // Validar formato de email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        send_json(400, ["error" => "El formato del email no es válido"]);
    }
    
    // Verificar si la identificación ya existe
    $stmt = $conn->prepare("SELECT id FROM usuarios WHERE identificacion = ?");
    $stmt->bind_param("s", $identificacion);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($res && $res->num_rows > 0) {
        $stmt->close();
        $conn->close();
        send_json(400, ["error" => "La identificación ya está registrada"]);
    }
    $stmt->close();
    
    // Verificar si el email ya existe
    $stmt = $conn->prepare("SELECT id FROM usuarios WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($res && $res->num_rows > 0) {
        $stmt->close();
        $conn->close();
        send_json(400, ["error" => "El email ya está registrado"]);
    }
    $stmt->close();
    
    // Validar longitud de contraseña
    if (strlen($password) < 6) {
        $conn->close();
        send_json(400, ["error" => "La contraseña debe tener al menos 6 caracteres"]);
    }
    
    // Encriptar contraseña
    $password_hash = password_hash($password, PASSWORD_DEFAULT);
    
    // Si es trabajador, empresa_id es obligatorio
    if ($perfil === 'trabajador' && empty($empresa_id)) {
        send_json(400, ["error" => "La empresa es obligatoria para trabajadores"]);
    }
    
    // Insertar usuario
    $stmt = $conn->prepare("INSERT INTO usuarios (identificacion, nombre, email, password, perfil, empresa_id) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("sssssi", $identificacion, $nombre, $email, $password_hash, $perfil, $empresa_id);
    
    if ($stmt->execute()) {
        $nuevo_id = $conn->insert_id;
        $stmt->close();
        $conn->close();
        send_json(201, [
            'ok' => true,
            'mensaje' => 'Usuario creado',
            'usuario_id' => $nuevo_id
        ]);
    } else {
        $error = $stmt->error;
        $stmt->close();
        $conn->close();
        send_json(500, ["error" => "Error al crear usuario: " . $error]);
    }
}

// PUT - Actualizar usuario (SIN validación de admin)
if ($metodo === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $usuario_id = $data['id'] ?? null;
    $nombre = trim($data['nombre'] ?? '');
    $email = trim($data['email'] ?? '');
    $perfil = $data['perfil'] ?? '';
    $password = $data['password'] ?? null;
    
    if (empty($usuario_id) || empty($nombre) || empty($email) || empty($perfil)) {
        $conn->close();
        send_json(400, ["error" => "Faltan campos obligatorios"]);
    }
    
    // Si hay contraseña nueva, actualizar con contraseña
    if (!empty($password)) {
        $password_hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $conn->prepare("UPDATE usuarios SET nombre = ?, email = ?, password = ?, perfil = ? WHERE id = ?");
        $stmt->bind_param("ssssi", $nombre, $email, $password_hash, $perfil, $usuario_id);
    } else {
        // Actualizar sin cambiar contraseña
        $stmt = $conn->prepare("UPDATE usuarios SET nombre = ?, email = ?, perfil = ? WHERE id = ?");
        $stmt->bind_param("sssi", $nombre, $email, $perfil, $usuario_id);
    }
    
    if ($stmt->execute()) {
        $stmt->close();
        $conn->close();
        send_json(200, [
            "success" => true,
            "mensaje" => "Usuario actualizado exitosamente"
        ]);
    } else {
        $stmt->close();
        $conn->close();
        send_json(500, ["error" => "Error al actualizar usuario"]);
    }
}

// DELETE - Eliminar usuario (SIN validación de admin)
if ($metodo === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $usuario_id = $data['id'] ?? null;
    
    if (empty($usuario_id)) {
        $conn->close();
        send_json(400, ["error" => "ID de usuario requerido"]);
    }
    
    // Eliminar usuario
    $stmt = $conn->prepare("DELETE FROM usuarios WHERE id = ?");
    $stmt->bind_param("i", $usuario_id);
    
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            $stmt->close();
            $conn->close();
            send_json(200, [
                "success" => true,
                "mensaje" => "Usuario eliminado exitosamente"
            ]);
        } else {
            $stmt->close();
            $conn->close();
            send_json(404, ["error" => "Usuario no encontrado"]);
        }
    } else {
        $error = $stmt->error;
        $stmt->close();
        $conn->close();
        send_json(500, ["error" => "Error al eliminar usuario: " . $error]);
    }
}

// Si llega hasta aquí, devolver error por defecto
$conn->close();
send_json(400, ["error" => "Método no soportado"]);