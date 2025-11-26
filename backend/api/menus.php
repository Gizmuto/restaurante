<?php
// DEBUG
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
ini_set('log_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['ok' => true]);
    exit;
}

require_once __DIR__ . '/../db.php';

function send_json($code, $data) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

// Leer cuerpo raw y parsear JSON si existe
$raw = file_get_contents("php://input");
$raw_trim = $raw !== null ? trim($raw) : '';
$input_json = [];
if ($raw_trim !== '') {
    // permitir BOM
    $raw_trim = preg_replace('/^\xEF\xBB\xBF/', '', $raw_trim);
    $decoded = json_decode($raw_trim, true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
        $input_json = $decoded;
    } else {
        // si no es JSON, parsear como query string (form-urlencoded)
        parse_str($raw_trim, $parsed);
        if (is_array($parsed)) $input_json = $parsed;
    }
}
// Unificar fuente de parámetros: preferir JSON body, luego $_POST, luego $_GET
$params = array_merge($_GET ?? [], $_POST ?? [], $input_json ?? []);

// helper
function get_param($k, $default = null) {
    global $params;
    return isset($params[$k]) ? $params[$k] : $default;
}

$method = $_SERVER['REQUEST_METHOD'];

/* GET - Obtener menús */
if ($method === 'GET') {
    $empresa_id = get_param('empresa_id', null);
    $empresa_id = $empresa_id !== null && $empresa_id !== '' ? intval($empresa_id) : null;

    if ($empresa_id) {
        $stmt = $conn->prepare("
            SELECT id, nombre, descripcion, created_at, empresa_id
            FROM menus
            WHERE empresa_id = ?
            ORDER BY id DESC
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
                SELECT mo.id AS opcion_id, mo.opcion_idx, mo.nombre AS opcion_nombre, mo.descripcion AS opcion_descripcion, mp.precio
                FROM menu_opciones mo
                LEFT JOIN menu_precios mp ON mp.menu_opcion_id = mo.id AND mp.empresa_id = ?
                WHERE mo.menu_id = ? ORDER BY mo.opcion_idx ASC
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
        $conn->close();
        send_json(200, ["menus" => $menus]);
    }

    // listar todos
    $res = $conn->query("SELECT id, nombre, descripcion, empresa_id, created_at FROM menus ORDER BY id DESC");
    if (!$res) {
        $conn->close();
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
    $conn->close();
    send_json(200, ["menus" => $menus]);
}

// Actions that use body input: create/copy/update/delete
$action = get_param('action', null);

/* COPY - Copiar menú a otra empresa */
if ($method === 'POST' && $action === 'copy') {
    $menu_id = intval(get_param('menu_id', 0));
    $target_empresa_id = intval(get_param('target_empresa_id', 0));

    if (!$menu_id || !$target_empresa_id) {
        send_json(400, ["error" => "menu_id y target_empresa_id son requeridos", "received" => ["menu_id" => get_param('menu_id', null), "target_empresa_id" => get_param('target_empresa_id', null), "raw" => $raw_trim]]);
    }

    $conn->begin_transaction();
    try {
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

        $stmt = $conn->prepare("INSERT INTO menus (nombre, descripcion, empresa_id) VALUES (?, ?, ?)");
        $stmt->bind_param("ssi", $menu_orig['nombre'], $menu_orig['descripcion'], $target_empresa_id);
        $stmt->execute();
        $new_menu_id = $conn->insert_id;
        $stmt->close();

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

            // copiar precio desde empresa origen (si existe)
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
        send_json(201, ["ok" => true, "mensaje" => "Menú copiado", "new_menu_id" => $new_menu_id]);
    } catch (Exception $e) {
        $conn->rollback();
        send_json(500, ["error" => "Error al copiar: " . $e->getMessage()]);
    }
}

/* CREATE - Crear nuevo menú */
if ($method === 'POST' && $action !== 'copy') {
    $nombre = trim(get_param('nombre', ''));
    $descripcion = trim(get_param('descripcion', ''));
    $empresa_id = intval(get_param('empresa_id', 0));
    $opciones = get_param('opciones', null); // puede venir como array json

    if (!$nombre || !$empresa_id || !is_array($opciones) || count($opciones) !== 3) {
        send_json(400, ["error" => "nombre, empresa_id y 3 opciones obligatorios", "received" => ["nombre" => $nombre, "empresa_id" => $empresa_id, "opciones" => $opciones]]);
    }

    $conn->begin_transaction();
    try {
        $stmt = $conn->prepare("INSERT INTO menus (nombre, descripcion, empresa_id) VALUES (?, ?, ?)");
        $stmt->bind_param("ssi", $nombre, $descripcion, $empresa_id);
        $stmt->execute();
        $menu_id = $conn->insert_id;
        $stmt->close();

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
        send_json(201, ["ok" => true, "mensaje" => "Menú creado", "menu_id" => $menu_id]);
    } catch (Exception $e) {
        $conn->rollback();
        send_json(500, ["error" => "Error al crear: " . $e->getMessage()]);
    }
}

/* UPDATE - Actualizar menú */
if ($method === 'PUT') {
    $menu_id = intval(get_param('id', 0));
    $nombre = trim(get_param('nombre', ''));
    $descripcion = trim(get_param('descripcion', ''));
    $opciones = get_param('opciones', null);

    if (!$menu_id || !$nombre || !is_array($opciones) || count($opciones) !== 3) {
        send_json(400, ["error" => "id, nombre y 3 opciones son obligatorios", "received" => ["id" => $menu_id, "nombre" => $nombre, "opciones" => $opciones]]);
    }

    $conn->begin_transaction();
    try {
        $stmt = $conn->prepare("UPDATE menus SET nombre = ?, descripcion = ? WHERE id = ?");
        $stmt->bind_param("ssi", $nombre, $descripcion, $menu_id);
        $stmt->execute();
        $stmt->close();

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
        send_json(200, ["ok" => true, "mensaje" => "Menú actualizado"]);
    } catch (Exception $e) {
        $conn->rollback();
        send_json(500, ["error" => "Error al actualizar: " . $e->getMessage()]);
    }
}

/* DELETE - Eliminar menú */
if ($method === 'DELETE') {
    $menu_id = intval(get_param('id', 0));
    if (!$menu_id) {
        send_json(400, ["error" => "id requerido", "received" => ["id" => get_param('id', null), "raw" => $raw_trim]]);
    }

    try {
        $stmt = $conn->prepare("DELETE FROM menus WHERE id = ?");
        $stmt->bind_param("i", $menu_id);
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            send_json(200, ["ok" => true, "mensaje" => "Menú eliminado"]);
        } else {
            send_json(404, ["error" => "Menú no encontrado"]);
        }
        $stmt->close();
    } catch (Exception $e) {
        send_json(500, ["error" => "Error al eliminar: " . $e->getMessage()]);
    }
}

$conn->close();
send_json(400, ["error" => "Método no soportado"]);
?>
{/* Create / Edit Menu Modal */}
      {showMenuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">{menuForm.id ? 'Editar Menú' : 'Crear Menú'}</h3>
            <div className="space-y-3">
              <input 
                className="w-full border p-2 rounded" 
                placeholder="Nombre del menú" 
                value={menuForm.nombre} 
                onChange={e => setMenuForm(f => ({ ...f, nombre: e.target.value }))} 
              />
              <textarea 
                className="w-full border p-2 rounded" 
                placeholder="Descripción general" 
                value={menuForm.descripcion} 
                onChange={e => setMenuForm(f => ({ ...f, descripcion: e.target.value }))} 
              />
              
              <div className="grid grid-cols-3 gap-4">
                {menuForm.opciones.map((op, idx) => (
                  <div key={idx} className="p-2 border rounded bg-gray-50">
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Opción {String.fromCharCode(65 + idx)}</label>
                    <input 
                      className="w-full border p-2 rounded mb-1 text-sm" 
                      placeholder="Nombre" 
                      value={op.nombre} 
                      onChange={e => {
                        const copy = [...menuForm.opciones]; 
                        copy[idx].nombre = e.target.value; 
                        setMenuForm(f => ({ ...f, opciones: copy }));
                      }} 
                    />
                    <input 
                      className="w-full border p-2 rounded mb-1 text-sm" 
                      placeholder="Descripción" 
                      value={op.descripcion} 
                      onChange={e => {
                        const copy = [...menuForm.opciones]; 
                        copy[idx].descripcion = e.target.value; 
                        setMenuForm(f => ({ ...f, opciones: copy }));
                      }} 
                    />
                    <input 
                      type="number" 
                      step="0.01" 
                      className="w-full border p-2 rounded text-sm" 
                      placeholder="Precio" 
                      value={op.precio} 
                      onChange={e => {
                        const copy = [...menuForm.opciones]; 
                        copy[idx].precio = e.target.value; 
                        setMenuForm(f => ({ ...f, opciones: copy }));
                      }} 
                    />
                  </div>
                ))}
              </div>

              <select 
                className="w-full border p-2 rounded" 
                value={menuForm.empresa_id || ''} 
                onChange={e => setMenuForm(f => ({ ...f, empresa_id: e.target.value }))}
              >
                <option value="">Seleccione una empresa</option>
                {empresas.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button 
                className="px-4 py-2 bg-gray-200 rounded" 
                onClick={() => setShowMenuModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded" 
                onClick={handleSaveMenu}
              >
                {menuForm.id ? 'Actualizar Menú' : 'Crear Menú'}
              </button>
            </div>
          </div>
        </div>
      )}