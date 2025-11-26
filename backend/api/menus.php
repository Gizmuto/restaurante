<?php
// backend/api/menus.php - VERSIÓN CORREGIDA
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
ini_set('log_errors', 1);
error_reporting(E_ALL);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['ok' => true]);
    exit;
}

require_once __DIR__ . '/../db.php';

function send_json($code, $data) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// Leer y parsear body
$raw = file_get_contents("php://input");
$raw_trim = $raw !== null ? trim($raw) : '';
$input_json = [];

if ($raw_trim !== '') {
    $raw_trim = preg_replace('/^\xEF\xBB\xBF/', '', $raw_trim);
    $decoded = json_decode($raw_trim, true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
        $input_json = $decoded;
    } else {
        parse_str($raw_trim, $parsed);
        if (is_array($parsed)) $input_json = $parsed;
    }
}

$params = array_merge($_GET ?? [], $_POST ?? [], $input_json ?? []);

function get_param($k, $default = null) {
    global $params;
    return isset($params[$k]) ? $params[$k] : $default;
}

if (!isset($conn) || !($conn instanceof mysqli)) {
    send_json(500, ['error' => 'No hay conexión a la base de datos']);
}

$conn->set_charset('utf8mb4');
$method = $_SERVER['REQUEST_METHOD'];

// ============================================
// GET - Obtener menús
// ============================================
if ($method === 'GET') {
    $empresa_id = get_param('empresa_id', null);
    $empresa_id = $empresa_id !== null && $empresa_id !== '' ? intval($empresa_id) : null;

    if ($empresa_id) {
        $stmt = $conn->prepare("
            SELECT id, nombre, descripcion, created_at, empresa_id
            FROM menus
            WHERE empresa_id = ?
            ORDER BY created_at DESC, id DESC
        ");
        $stmt->bind_param("i", $empresa_id);
        $stmt->execute();
        $res = $stmt->get_result();
        $menus = [];
        
        while ($m = $res->fetch_assoc()) {
            $menu = [
                'id' => (int)$m['id'],
                'nombre' => $m['nombre'],
                'descripcion' => $m['descripcion'],
                'empresa_id' => $m['empresa_id'] !== null ? (int)$m['empresa_id'] : null,
                'created_at' => $m['created_at'],
                'opciones' => []
            ];

            $stmt2 = $conn->prepare("
                SELECT 
                    mo.id AS opcion_id, 
                    mo.opcion_idx, 
                    mo.nombre AS opcion_nombre, 
                    mo.descripcion AS opcion_descripcion, 
                    mp.precio
                FROM menu_opciones mo
                LEFT JOIN menu_precios mp ON mp.menu_opcion_id = mo.id AND mp.empresa_id = ?
                WHERE mo.menu_id = ? 
                ORDER BY mo.opcion_idx ASC
            ");
            $stmt2->bind_param("ii", $empresa_id, $menu['id']);
            $stmt2->execute();
            $r2 = $stmt2->get_result();
            
            while ($ro = $r2->fetch_assoc()) {
                $menu['opciones'][] = [
                    'opcion_id' => (int)$ro['opcion_id'],
                    'idx' => (int)$ro['opcion_idx'],
                    'nombre' => $ro['opcion_nombre'],
                    'descripcion' => $ro['opcion_descripcion'],
                    'precio' => $ro['precio'] !== null ? (float)$ro['precio'] : null
                ];
            }
            $stmt2->close();
            $menus[] = $menu;
        }
        $stmt->close();
        send_json(200, ["menus" => $menus]);
    }

    // Listar todos los menús
    $res = $conn->query("
        SELECT id, nombre, descripcion, empresa_id, created_at 
        FROM menus 
        ORDER BY created_at DESC, id DESC
    ");
    
    if (!$res) {
        send_json(500, ["error" => "Error en consulta: " . $conn->error]);
    }
    
    $menus = [];
    while ($m = $res->fetch_assoc()) {
        $menus[] = [
            'id' => (int)$m['id'],
            'nombre' => $m['nombre'],
            'descripcion' => $m['descripcion'],
            'empresa_id' => $m['empresa_id'] !== null ? (int)$m['empresa_id'] : null,
            'created_at' => $m['created_at']
        ];
    }
    send_json(200, ["menus" => $menus]);
}

$action = get_param('action', null);

// ============================================
// POST - Copiar menú
// ============================================
if ($method === 'POST' && $action === 'copy') {
    $menu_id = intval(get_param('menu_id', 0));
    $target_empresa_id = intval(get_param('target_empresa_id', 0));

    if (!$menu_id || !$target_empresa_id) {
        send_json(400, [
            "error" => "menu_id y target_empresa_id son requeridos",
            "received" => [
                "menu_id" => get_param('menu_id', null),
                "target_empresa_id" => get_param('target_empresa_id', null)
            ]
        ]);
    }

    $conn->begin_transaction();
    try {
        // Obtener menú original
        $stmt = $conn->prepare("SELECT nombre, descripcion, empresa_id FROM menus WHERE id = ?");
        $stmt->bind_param("i", $menu_id);
        $stmt->execute();
        $res = $stmt->get_result();
        $menu_orig = $res->fetch_assoc();
        $stmt->close();

        if (!$menu_orig) {
            $conn->rollback();
            send_json(404, ["error" => "Menú no encontrado"]);
        }

        $source_empresa_id = $menu_orig['empresa_id'] !== null ? intval($menu_orig['empresa_id']) : null;

        // Crear nuevo menú
        $stmt = $conn->prepare("INSERT INTO menus (nombre, descripcion, empresa_id) VALUES (?, ?, ?)");
        $stmt->bind_param("ssi", $menu_orig['nombre'], $menu_orig['descripcion'], $target_empresa_id);
        $stmt->execute();
        $new_menu_id = $conn->insert_id;
        $stmt->close();

        // Copiar opciones
        $stmt = $conn->prepare("SELECT id, opcion_idx, nombre, descripcion FROM menu_opciones WHERE menu_id = ?");
        $stmt->bind_param("i", $menu_id);
        $stmt->execute();
        $res = $stmt->get_result();
        
        while ($opt = $res->fetch_assoc()) {
            $stmt2 = $conn->prepare("INSERT INTO menu_opciones (menu_id, opcion_idx, nombre, descripcion) VALUES (?, ?, ?, ?)");
            $stmt2->bind_param("iiss", $new_menu_id, $opt['opcion_idx'], $opt['nombre'], $opt['descripcion']);
            $stmt2->execute();
            $new_opcion_id = $conn->insert_id;
            $stmt2->close();

            // Copiar precio si existe
            if ($source_empresa_id !== null) {
                $stmt3 = $conn->prepare("SELECT precio FROM menu_precios WHERE menu_opcion_id = ? AND empresa_id = ?");
                $stmt3->bind_param("ii", $opt['id'], $source_empresa_id);
                $stmt3->execute();
                $res3 = $stmt3->get_result();
                $precio_row = $res3->fetch_assoc();
                $stmt3->close();

                if ($precio_row) {
                    $stmt4 = $conn->prepare("INSERT INTO menu_precios (menu_opcion_id, empresa_id, precio) VALUES (?, ?, ?)");
                    $stmt4->bind_param("iid", $new_opcion_id, $target_empresa_id, $precio_row['precio']);
                    $stmt4->execute();
                    $stmt4->close();
                }
            }
        }
        $stmt->close();

        $conn->commit();
        send_json(201, [
            "ok" => true,
            "mensaje" => "Menú copiado exitosamente",
            "new_menu_id" => $new_menu_id
        ]);
    } catch (Exception $e) {
        $conn->rollback();
        send_json(500, ["error" => "Error al copiar menú: " . $e->getMessage()]);
    }
}

// ============================================
// POST - Crear nuevo menú
// ============================================
if ($method === 'POST' && $action !== 'copy') {
    $nombre = trim(get_param('nombre', ''));
    $descripcion = trim(get_param('descripcion', ''));
    $empresa_id = intval(get_param('empresa_id', 0));
    $opciones = get_param('opciones', null);

    if (!$nombre || !$empresa_id || !is_array($opciones) || count($opciones) !== 3) {
        send_json(400, [
            "error" => "Datos incompletos: se requiere nombre, empresa_id y 3 opciones",
            "received" => [
                "nombre" => $nombre,
                "empresa_id" => $empresa_id,
                "opciones_count" => is_array($opciones) ? count($opciones) : 0
            ]
        ]);
    }

    $conn->begin_transaction();
    try {
        // Crear menú
        $stmt = $conn->prepare("INSERT INTO menus (nombre, descripcion, empresa_id) VALUES (?, ?, ?)");
        $stmt->bind_param("ssi", $nombre, $descripcion, $empresa_id);
        $stmt->execute();
        $menu_id = $conn->insert_id;
        $stmt->close();

        // Crear opciones
        for ($i = 0; $i < 3; $i++) {
            $opcion = $opciones[$i];
            $opcion_idx = $i + 1;
            $opcion_nombre = trim($opcion['nombre'] ?? '');
            $opcion_desc = trim($opcion['descripcion'] ?? '');
            $precio = isset($opcion['precio']) ? floatval($opcion['precio']) : 0;

            $stmt = $conn->prepare("INSERT INTO menu_opciones (menu_id, opcion_idx, nombre, descripcion) VALUES (?, ?, ?, ?)");
            $stmt->bind_param("iiss", $menu_id, $opcion_idx, $opcion_nombre, $opcion_desc);
            $stmt->execute();
            $opcion_id = $conn->insert_id;
            $stmt->close();

            $stmt = $conn->prepare("INSERT INTO menu_precios (menu_opcion_id, empresa_id, precio) VALUES (?, ?, ?)");
            $stmt->bind_param("iid", $opcion_id, $empresa_id, $precio);
            $stmt->execute();
            $stmt->close();
        }

        $conn->commit();
        send_json(201, [
            "ok" => true,
            "mensaje" => "Menú creado exitosamente",
            "menu_id" => $menu_id
        ]);
    } catch (Exception $e) {
        $conn->rollback();
        send_json(500, ["error" => "Error al crear menú: " . $e->getMessage()]);
    }
}

// ============================================
// PUT - Actualizar menú
// ============================================
if ($method === 'PUT') {
    $menu_id = intval(get_param('id', 0));
    $nombre = trim(get_param('nombre', ''));
    $descripcion = trim(get_param('descripcion', ''));
    $opciones = get_param('opciones', null);

    if (!$menu_id || !$nombre || !is_array($opciones) || count($opciones) !== 3) {
        send_json(400, [
            "error" => "Datos incompletos: se requiere id, nombre y 3 opciones",
            "received" => [
                "id" => $menu_id,
                "nombre" => $nombre,
                "opciones_count" => is_array($opciones) ? count($opciones) : 0
            ]
        ]);
    }

    $conn->begin_transaction();
    try {
        // Actualizar menú
        $stmt = $conn->prepare("UPDATE menus SET nombre = ?, descripcion = ? WHERE id = ?");
        $stmt->bind_param("ssi", $nombre, $descripcion, $menu_id);
        $stmt->execute();
        $stmt->close();

        // Actualizar opciones
        for ($i = 0; $i < 3; $i++) {
            $opcion = $opciones[$i];
            $opcion_id = intval($opcion['opcion_id'] ?? 0);
            $opcion_nombre = trim($opcion['nombre'] ?? '');
            $opcion_desc = trim($opcion['descripcion'] ?? '');
            $precio = isset($opcion['precio']) ? floatval($opcion['precio']) : 0;

            if ($opcion_id) {
                $stmt = $conn->prepare("UPDATE menu_opciones SET nombre = ?, descripcion = ? WHERE id = ?");
                $stmt->bind_param("ssi", $opcion_nombre, $opcion_desc, $opcion_id);
                $stmt->execute();
                $stmt->close();

                $stmt = $conn->prepare("UPDATE menu_precios SET precio = ? WHERE menu_opcion_id = ?");
                $stmt->bind_param("di", $precio, $opcion_id);
                $stmt->execute();
                $stmt->close();
            }
        }

        $conn->commit();
        send_json(200, [
            "ok" => true,
            "mensaje" => "Menú actualizado exitosamente"
        ]);
    } catch (Exception $e) {
        $conn->rollback();
        send_json(500, ["error" => "Error al actualizar menú: " . $e->getMessage()]);
    }
}

// ============================================
// DELETE - Eliminar menú (CORREGIDO)
// ============================================
if ($method === 'DELETE') {
    $menu_id = intval(get_param('id', 0));
    
    if (!$menu_id) {
        send_json(400, [
            "error" => "Se requiere el ID del menú",
            "received" => [
                "id" => get_param('id', null),
                "raw_body" => $raw_trim
            ]
        ]);
    }

    $conn->begin_transaction();
    try {
        // 1. Verificar si el menú existe
        $stmt = $conn->prepare("SELECT id, nombre FROM menus WHERE id = ?");
        $stmt->bind_param("i", $menu_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $menu = $result->fetch_assoc();
        $stmt->close();

        if (!$menu) {
            $conn->rollback();
            send_json(404, ["error" => "Menú no encontrado con ID: " . $menu_id]);
        }

        // 2. Obtener IDs de opciones del menú
        $stmt = $conn->prepare("SELECT id FROM menu_opciones WHERE menu_id = ?");
        $stmt->bind_param("i", $menu_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $opcion_ids = [];
        while ($row = $result->fetch_assoc()) {
            $opcion_ids[] = (int)$row['id'];
        }
        $stmt->close();

        // 3. Verificar si hay pedidos usando estas opciones
        if (!empty($opcion_ids)) {
            $placeholders = implode(',', array_fill(0, count($opcion_ids), '?'));
            $query = "SELECT COUNT(*) as total FROM pedidos WHERE opcion_id IN ($placeholders)";
            $stmt = $conn->prepare($query);
            
            $types = str_repeat('i', count($opcion_ids));
            $stmt->bind_param($types, ...$opcion_ids);
            $stmt->execute();
            $result = $stmt->get_result();
            $count_row = $result->fetch_assoc();
            $stmt->close();

            if ($count_row['total'] > 0) {
                $conn->rollback();
                send_json(400, [
                    "error" => "No se puede eliminar el menú porque tiene pedidos asociados",
                    "pedidos_count" => $count_row['total'],
                    "detalle" => "Primero debes eliminar o reasignar los pedidos relacionados"
                ]);
            }

            // 4. Eliminar precios de las opciones
            $query = "DELETE FROM menu_precios WHERE menu_opcion_id IN ($placeholders)";
            $stmt = $conn->prepare($query);
            $stmt->bind_param($types, ...$opcion_ids);
            $stmt->execute();
            $precios_eliminados = $stmt->affected_rows;
            $stmt->close();
        }

        // 5. Eliminar opciones del menú
        $stmt = $conn->prepare("DELETE FROM menu_opciones WHERE menu_id = ?");
        $stmt->bind_param("i", $menu_id);
        $stmt->execute();
        $opciones_eliminadas = $stmt->affected_rows;
        $stmt->close();

        // 6. Eliminar el menú
        $stmt = $conn->prepare("DELETE FROM menus WHERE id = ?");
        $stmt->bind_param("i", $menu_id);
        $stmt->execute();
        $menus_eliminados = $stmt->affected_rows;
        $stmt->close();

        if ($menus_eliminados > 0) {
            $conn->commit();
            send_json(200, [
                "ok" => true,
                "mensaje" => "Menú '" . $menu['nombre'] . "' eliminado exitosamente",
                "detalle" => [
                    "menu_id" => $menu_id,
                    "opciones_eliminadas" => $opciones_eliminadas,
                    "precios_eliminados" => $precios_eliminados ?? 0
                ]
            ]);
        } else {
            $conn->rollback();
            send_json(500, ["error" => "No se pudo eliminar el menú"]);
        }
    } catch (Exception $e) {
        $conn->rollback();
        send_json(500, [
            "error" => "Error al eliminar menú: " . $e->getMessage(),
            "trace" => $e->getTraceAsString()
        ]);
    }
}

$conn->close();
send_json(405, ["error" => "Método HTTP no soportado: " . $method]);
?>