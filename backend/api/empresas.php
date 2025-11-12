<?php
// Forzar salida JSON y evitar mostrar warnings en pantalla (usar logs)
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);
ob_start();

function send_json($code, $data) {
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

$method = $_SERVER['REQUEST_METHOD'];

// GET - listar empresas
if ($method === 'GET') {
    $res = $conn->query("SELECT id, nombre FROM empresas ORDER BY nombre ASC");
    $empresas = [];
    if ($res) {
        while ($r = $res->fetch_assoc()) $empresas[] = $r;
    }
    $conn->close();
    send_json(200, ["empresas" => $empresas]);
}

// Leer body
$input = json_decode(file_get_contents("php://input"), true);

// POST - crear empresa
if ($method === 'POST') {
    $nombre = trim($input['nombre'] ?? '');
    if (empty($nombre)) {
        $conn->close();
        send_json(400, ["error" => "Nombre de empresa requerido"]);
    }

    // Evitar duplicados
    $stmt = $conn->prepare("SELECT id FROM empresas WHERE nombre = ?");
    $stmt->bind_param("s", $nombre);
    $stmt->execute();
    $r = $stmt->get_result();
    if ($r && $r->num_rows > 0) {
        $stmt->close();
        $conn->close();
        send_json(400, ["error" => "Ya existe una empresa con ese nombre"]);
    }
    $stmt->close();

    $stmt = $conn->prepare("INSERT INTO empresas (nombre) VALUES (?)");
    $stmt->bind_param("s", $nombre);
    if ($stmt->execute()) {
        $id = $conn->insert_id;
        $stmt->close();
        $conn->close();
        send_json(201, ["ok" => true, "mensaje" => "Empresa creada", "empresa_id" => $id]);
    } else {
        $err = $stmt->error;
        $stmt->close();
        $conn->close();
        send_json(500, ["error" => "Error al crear empresa: " . $err]);
    }
}

// PUT - actualizar empresa
if ($method === 'PUT') {
    $id = intval($input['id'] ?? 0);
    $nombre = trim($input['nombre'] ?? '');

    if (!$id || empty($nombre)) {
        $conn->close();
        send_json(400, ["error" => "ID y nombre requeridos"]);
    }

    $stmt = $conn->prepare("UPDATE empresas SET nombre = ? WHERE id = ?");
    $stmt->bind_param("si", $nombre, $id);
    if ($stmt->execute()) {
        $stmt->close();
        $conn->close();
        send_json(200, ["ok" => true, "mensaje" => "Empresa actualizada"]);
    } else {
        $err = $stmt->error;
        $stmt->close();
        $conn->close();
        send_json(500, ["error" => "Error al actualizar: " . $err]);
    }
}

// DELETE - eliminar empresa
if ($method === 'DELETE') {
    $id = intval($input['id'] ?? 0);
    if (!$id) {
        $conn->close();
        send_json(400, ["error" => "ID requerido"]);
    }

    // Opcional: comprobar relaciones (ej. usuarios o menus). Aquí permitimos eliminación y dejamos que FK ON DELETE SET NULL lo maneje si está configurado.
    $stmt = $conn->prepare("DELETE FROM empresas WHERE id = ?");
    $stmt->bind_param("i", $id);
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            $stmt->close();
            $conn->close();
            send_json(200, ["ok" => true, "mensaje" => "Empresa eliminada"]);
        } else {
            $stmt->close();
            $conn->close();
            send_json(404, ["error" => "Empresa no encontrada"]);
        }
    } else {
        $err = $stmt->error;
        $stmt->close();
        $conn->close();
        send_json(500, ["error" => "Error al eliminar: " . $err]);
    }
}

$conn->close();
send_json(400, ["error" => "Método no soportado"]);