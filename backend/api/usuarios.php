<?php
// backend/api/pedidos.php
// Compatible con tu db.php que define $conn (mysqli)

// DEBUG local (activar solo si necesitas ver errores en desarrollo)
// ini_set('display_errors', 1);
// ini_set('display_startup_errors', 1);
// error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['ok' => true]);
    exit;
}

require_once __DIR__ . '/../db.php';

// --- parsear body / params (mismo patrón que menus.php) ---
$raw = file_get_contents("php://input");
$raw_trim = $raw !== null ? trim($raw) : '';
$input_json = [];
if ($raw_trim !== '') {
    $raw_trim = preg_replace('/^\xEF\xBB\xBF/', '', $raw_trim); // BOM
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

function send_json($code, $data) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// Validaciones básicas
if (!isset($conn) || !($conn instanceof mysqli)) {
    send_json(500, ['error' => 'No hay conexión mysqli', 'detalle' => 'Verificar db.php que exporte $conn como mysqli']);
}

$conn->set_charset('utf8mb4');

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    // Solo GET para listar pedidos (RecepcionPedidos.jsx usa GET)
    send_json(405, ['error' => 'Método no permitido']);
}

// parámetros
$fecha = get_param('fecha', null);
$empresa_id = get_param('empresa_id', null);
$empresa_id = ($empresa_id !== null && $empresa_id !== '') ? intval($empresa_id) : null;

if (!$fecha) {
    send_json(400, ['error' => 'Falta la fecha (param fecha)']);
}

// Query: devuelve exactamente los campos que usa el frontend
$sql = "
    SELECT 
      p.id,
      p.fecha,
      u.id AS trabajador_id,
      u.nombre AS trabajador_nombre,
      u.identificacion AS trabajador_identificacion,
      u.empresa_id,
      e.nombre AS empresa_nombre,
      mo.id AS opcion_id,
      mo.nombre AS opcion_nombre,
      mo.descripcion AS opcion_descripcion,
      m.id AS menu_id,
      m.nombre AS menu_nombre,
      mp.precio AS opcion_precio
    FROM pedidos p
    JOIN usuarios u ON p.trabajador_id = u.id
    LEFT JOIN empresas e ON u.empresa_id = e.id
    JOIN menu_opciones mo ON p.opcion_id = mo.id
    JOIN menus m ON mo.menu_id = m.id
    LEFT JOIN menu_precios mp 
      ON mp.menu_opcion_id = mo.id 
      AND mp.empresa_id = u.empresa_id
    WHERE p.fecha = ?
";

if ($empresa_id) {
    $sql .= " AND u.empresa_id = ?";
}
$sql .= " ORDER BY e.nombre, u.nombre, m.created_at DESC, mo.opcion_idx ASC";

$stmt = $conn->prepare($sql);
if (!$stmt) {
    send_json(500, ['error' => 'Error al preparar consulta', 'detalle' => $conn->error]);
}

if ($empresa_id) {
    $stmt->bind_param('si', $fecha, $empresa_id);
} else {
    $stmt->bind_param('s', $fecha);
}

if (!$stmt->execute()) {
    send_json(500, ['error' => 'Error al ejecutar consulta', 'detalle' => $stmt->error]);
}

$res = $stmt->get_result();
$pedidos = [];
while ($row = $res->fetch_assoc()) {
    // casteos limpios para frontend
    $row['id'] = isset($row['id']) ? (int)$row['id'] : null;
    $row['trabajador_id'] = isset($row['trabajador_id']) ? (int)$row['trabajador_id'] : null;
    $row['empresa_id'] = isset($row['empresa_id']) && $row['empresa_id'] !== null ? (int)$row['empresa_id'] : null;
    $row['opcion_id'] = isset($row['opcion_id']) ? (int)$row['opcion_id'] : null;
    $row['menu_id'] = isset($row['menu_id']) ? (int)$row['menu_id'] : null;
    $row['opcion_precio'] = $row['opcion_precio'] === null ? null : (float)$row['opcion_precio'];
    $pedidos[] = $row;
}

$stmt->close();
$conn->close();

send_json(200, ['pedidos' => $pedidos]);
