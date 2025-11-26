<?php
// backend/api/crear_pedido.php

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../db.php';

// Parsear input
$raw = file_get_contents("php://input");
$input_json = [];
if (trim($raw) !== '') {
    $raw = preg_replace('/^\xEF\xBB\xBF/', '', $raw);
    $decoded = json_decode($raw, true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
        $input_json = $decoded;
    }
}

$params = array_merge($_GET ?? [], $_POST ?? [], $input_json ?? []);

function get_param($k, $default = null) {
    global $params;
    return isset($params[$k]) ? $params[$k] : $default;
}

function send_json($code, $data) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// Validar conexión
if (!isset($conn) || !($conn instanceof mysqli)) {
    send_json(500, ['error' => 'No hay conexión a la base de datos']);
}

$conn->set_charset('utf8mb4');
$method = $_SERVER['REQUEST_METHOD'];

// ======================
// GET - Consultar pedido existente
// ======================
if ($method === 'GET') {
    $trabajador_id = get_param('trabajador_id');
    $fecha = get_param('fecha');
    
    if (!$trabajador_id || !$fecha) {
        send_json(400, ['error' => 'Faltan parámetros: trabajador_id y fecha']);
    }
    
    $sql = "
        SELECT 
            p.id,
            p.trabajador_id,
            p.opcion_id,
            p.fecha,
            p.observaciones,
            p.created_at,
            mo.nombre AS opcion_nombre,
            mo.descripcion AS opcion_descripcion,
            mo.menu_id,
            m.nombre AS menu_nombre,
            mp.precio AS opcion_precio
        FROM pedidos p
        JOIN menu_opciones mo ON p.opcion_id = mo.id
        JOIN menus m ON mo.menu_id = m.id
        JOIN usuarios u ON p.trabajador_id = u.id
        LEFT JOIN menu_precios mp 
            ON mp.menu_opcion_id = mo.id 
            AND mp.empresa_id = u.empresa_id
        WHERE p.trabajador_id = ? AND p.fecha = ?
        LIMIT 1
    ";
    
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        send_json(500, ['error' => 'Error al preparar consulta', 'detalle' => $conn->error]);
    }
    
    $stmt->bind_param('is', $trabajador_id, $fecha);
    
    if (!$stmt->execute()) {
        send_json(500, ['error' => 'Error al ejecutar consulta', 'detalle' => $stmt->error]);
    }
    
    $result = $stmt->get_result();
    $pedido = $result->fetch_assoc();
    
    if ($pedido) {
        // Convertir tipos
        $pedido['id'] = (int)$pedido['id'];
        $pedido['trabajador_id'] = (int)$pedido['trabajador_id'];
        $pedido['opcion_id'] = (int)$pedido['opcion_id'];
        $pedido['menu_id'] = (int)$pedido['menu_id'];
        $pedido['opcion_precio'] = $pedido['opcion_precio'] ? (float)$pedido['opcion_precio'] : null;
        
        send_json(200, [
            'ok' => true,
            'tiene_pedido' => true,
            'pedido' => $pedido
        ]);
    } else {
        send_json(200, [
            'ok' => true,
            'tiene_pedido' => false,
            'pedido' => null
        ]);
    }
}

// ======================
// POST - Crear o actualizar pedido
// ======================
if ($method === 'POST') {
    $trabajador_id = get_param('trabajador_id');
    $opcion_id = get_param('opcion_id');
    $fecha = get_param('fecha');
    $observaciones = get_param('observaciones', null);
    
    // Validaciones
    if (!$trabajador_id || !$opcion_id || !$fecha) {
        send_json(400, ['error' => 'Faltan parámetros requeridos: trabajador_id, opcion_id, fecha']);
    }
    
    // Validar que el trabajador existe
    $stmt = $conn->prepare("SELECT id FROM usuarios WHERE id = ? AND perfil = 'trabajador'");
    $stmt->bind_param('i', $trabajador_id);
    $stmt->execute();
    if ($stmt->get_result()->num_rows === 0) {
        send_json(404, ['error' => 'Trabajador no encontrado']);
    }
    
    // Validar que la opción existe
    $stmt = $conn->prepare("SELECT id FROM menu_opciones WHERE id = ?");
    $stmt->bind_param('i', $opcion_id);
    $stmt->execute();
    if ($stmt->get_result()->num_rows === 0) {
        send_json(404, ['error' => 'Opción de menú no encontrada']);
    }
    
    // Verificar si ya existe un pedido
    $stmt = $conn->prepare("SELECT id FROM pedidos WHERE trabajador_id = ? AND fecha = ?");
    $stmt->bind_param('is', $trabajador_id, $fecha);
    $stmt->execute();
    $result = $stmt->get_result();
    $pedido_existente = $result->fetch_assoc();
    
    if ($pedido_existente) {
        // ACTUALIZAR pedido existente
        $sql = "UPDATE pedidos SET opcion_id = ?, observaciones = ? WHERE trabajador_id = ? AND fecha = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param('isis', $opcion_id, $observaciones, $trabajador_id, $fecha);
        
        if ($stmt->execute()) {
            send_json(200, [
                'ok' => true,
                'accion' => 'actualizado',
                'mensaje' => 'Pedido actualizado correctamente',
                'pedido_id' => $pedido_existente['id']
            ]);
        } else {
            send_json(500, ['error' => 'Error al actualizar pedido', 'detalle' => $stmt->error]);
        }
    } else {
        // CREAR nuevo pedido
        $sql = "INSERT INTO pedidos (trabajador_id, opcion_id, fecha, observaciones) VALUES (?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param('iiss', $trabajador_id, $opcion_id, $fecha, $observaciones);
        
        if ($stmt->execute()) {
            send_json(201, [
                'ok' => true,
                'accion' => 'creado',
                'mensaje' => 'Pedido creado correctamente',
                'pedido_id' => $conn->insert_id
            ]);
        } else {
            send_json(500, ['error' => 'Error al crear pedido', 'detalle' => $stmt->error]);
        }
    }
}

// ======================
// DELETE - Cancelar pedido
// ======================
if ($method === 'DELETE') {
    $trabajador_id = get_param('trabajador_id');
    $fecha = get_param('fecha');
    
    if (!$trabajador_id || !$fecha) {
        send_json(400, ['error' => 'Faltan parámetros: trabajador_id y fecha']);
    }
    
    $sql = "DELETE FROM pedidos WHERE trabajador_id = ? AND fecha = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('is', $trabajador_id, $fecha);
    
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            send_json(200, [
                'ok' => true,
                'mensaje' => 'Pedido cancelado correctamente'
            ]);
        } else {
            send_json(404, ['error' => 'No se encontró el pedido para cancelar']);
        }
    } else {
        send_json(500, ['error' => 'Error al cancelar pedido', 'detalle' => $stmt->error]);
    }
}

// Método no permitido
send_json(405, ['error' => 'Método no permitido']);