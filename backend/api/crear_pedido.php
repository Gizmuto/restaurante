<?php
/**
 * ============================================
 * API DE GESTIÓN DE PEDIDOS - PUNTO 5
 * Sistema de Gestión de Almuerzos
 * Restaurante Comer Bien
 * ============================================
 * 
 * DESCRIPCIÓN:
 * Esta API permite a los trabajadores seleccionar y enviar
 * una de las tres opciones de menú disponibles cada día.
 * 
 * ENDPOINTS:
 * - GET:    Consultar pedido del trabajador para una fecha
 * - POST:   Crear o actualizar pedido
 * - DELETE: Cancelar pedido
 * 
 * VALIDACIONES:
 * - Solo trabajadores activos pueden hacer pedidos
 * - Un pedido por trabajador por día
 * - Horario límite: 17:00 (5:00 PM)
 * - La opción debe pertenecer a la empresa del trabajador
 * 
 * @author  Tu Nombre
 * @version 3.0
 * @date    2025-11-26
 */

// ============================================
// CONFIGURACIÓN INICIAL
// ============================================

// Headers para permitir peticiones desde cualquier origen (CORS)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// Configuración de errores
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../logs/error.log');
error_reporting(E_ALL);

// Manejo de preflight OPTIONS para CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['ok' => true, 'message' => 'CORS preflight successful']);
    exit;
}

// Incluir conexión a la base de datos
require_once __DIR__ . '/../db.php';

// Verificar que la conexión existe
if (!isset($conn) || !($conn instanceof mysqli)) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Error de configuración del servidor',
        'detalle' => 'No se pudo establecer conexión con la base de datos',
        'codigo' => 'DB_CONNECTION_ERROR'
    ]);
    exit;
}

// Configurar charset de la conexión
$conn->set_charset('utf8mb4');

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Enviar respuesta JSON y terminar ejecución
 * 
 * @param int $code Código HTTP de respuesta
 * @param array $data Datos a enviar
 * @return void
 */
function send_json($code, $data) {
    global $conn;
    
    // Cerrar conexión si existe
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
    
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * Validar horario de pedidos (antes de las 17:00)
 * 
 * @param string $fecha Fecha del pedido (Y-m-d)
 * @return array [valido => bool, mensaje => string]
 */
function validar_horario($fecha) {
    $hora_actual = date('H:i:s');
    $fecha_actual = date('Y-m-d');
    $hora_cierre = '17:00:00';
    
    // Validar que no sea fecha pasada
    if ($fecha < $fecha_actual) {
        return [
            'valido' => false,
            'mensaje' => 'No se pueden crear pedidos para fechas pasadas',
            'codigo' => 'FECHA_PASADA'
        ];
    }
    
    // Validar horario si es el día actual
    if ($fecha === $fecha_actual && $hora_actual >= $hora_cierre) {
        return [
            'valido' => false,
            'mensaje' => 'El horario de pedidos ha cerrado. Los pedidos cierran a las 17:00',
            'codigo' => 'HORARIO_CERRADO'
        ];
    }
    
    return [
        'valido' => true,
        'mensaje' => 'Horario válido',
        'tiempo_restante' => $fecha === $fecha_actual 
            ? calcular_tiempo_restante($hora_actual, $hora_cierre)
            : null
    ];
}

/**
 * Calcular tiempo restante hasta el cierre
 * 
 * @param string $hora_actual
 * @param string $hora_cierre
 * @return string
 */
function calcular_tiempo_restante($hora_actual, $hora_cierre) {
    $actual = strtotime($hora_actual);
    $cierre = strtotime($hora_cierre);
    $diferencia = $cierre - $actual;
    
    if ($diferencia <= 0) return '0 minutos';
    
    $horas = floor($diferencia / 3600);
    $minutos = floor(($diferencia % 3600) / 60);
    
    if ($horas > 0) {
        return "$horas hora(s) y $minutos minuto(s)";
    }
    return "$minutos minuto(s)";
}

/**
 * Registrar actividad en log
 * 
 * @param string $accion
 * @param array $detalles
 * @return void
 */
function log_actividad($accion, $detalles = []) {
    $log_file = __DIR__ . '/../logs/actividad.log';
    $timestamp = date('Y-m-d H:i:s');
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $mensaje = "[$timestamp] [$ip] $accion - " . json_encode($detalles, JSON_UNESCAPED_UNICODE);
    
    // Crear directorio de logs si no existe
    $log_dir = dirname($log_file);
    if (!is_dir($log_dir)) {
        mkdir($log_dir, 0755, true);
    }
    
    file_put_contents($log_file, $mensaje . PHP_EOL, FILE_APPEND);
}

// ============================================
// PARSEAR ENTRADA
// ============================================

$raw = file_get_contents("php://input");
$input = json_decode($raw, true) ?? [];
$method = $_SERVER['REQUEST_METHOD'];

// ============================================
// ENDPOINT: GET - Consultar pedido del trabajador
// ============================================

if ($method === 'GET') {
    $trabajador_id = isset($_GET['trabajador_id']) ? intval($_GET['trabajador_id']) : 0;
    $fecha = isset($_GET['fecha']) ? trim($_GET['fecha']) : date('Y-m-d');

    // Validar parámetros obligatorios
    if (!$trabajador_id) {
        send_json(400, [
            'error' => 'El parámetro trabajador_id es requerido',
            'codigo' => 'PARAM_MISSING',
            'parametros_recibidos' => $_GET
        ]);
    }

    // Validar formato de fecha
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
        send_json(400, [
            'error' => 'Formato de fecha inválido. Use YYYY-MM-DD',
            'codigo' => 'INVALID_DATE_FORMAT',
            'fecha_recibida' => $fecha
        ]);
    }

    try {
        // Verificar que el usuario existe, es trabajador y está activo
        $stmt = $conn->prepare("
            SELECT 
                u.id, 
                u.nombre, 
                u.identificacion,
                u.email,
                u.perfil, 
                u.empresa_id,
                u.activo,
                e.nombre AS empresa_nombre
            FROM usuarios u
            LEFT JOIN empresas e ON u.empresa_id = e.id
            WHERE u.id = ?
        ");
        
        $stmt->bind_param("i", $trabajador_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            $stmt->close();
            send_json(404, [
                'error' => 'Trabajador no encontrado',
                'codigo' => 'USER_NOT_FOUND',
                'trabajador_id' => $trabajador_id
            ]);
        }
        
        $trabajador = $result->fetch_assoc();
        $stmt->close();

        // Validar que sea trabajador
        if ($trabajador['perfil'] !== 'trabajador') {
            send_json(403, [
                'error' => 'Solo usuarios con perfil trabajador pueden consultar pedidos',
                'codigo' => 'INVALID_PROFILE',
                'perfil_actual' => $trabajador['perfil']
            ]);
        }

        // Validar que esté activo
        if ($trabajador['activo'] != 1) {
            send_json(403, [
                'error' => 'El usuario está inactivo',
                'codigo' => 'USER_INACTIVE'
            ]);
        }

        // Buscar pedido del trabajador para la fecha especificada
        $stmt = $conn->prepare("
            SELECT 
                p.id,
                p.fecha,
                p.estado,
                p.observaciones,
                p.created_at,
                p.updated_at,
                p.trabajador_id,
                p.opcion_id,
                mo.nombre AS opcion_nombre,
                mo.descripcion AS opcion_descripcion,
                mo.opcion_idx,
                mo.ingredientes AS opcion_ingredientes,
                mo.calorias AS opcion_calorias,
                mo.menu_id,
                m.nombre AS menu_nombre,
                m.descripcion AS menu_descripcion,
                COALESCE(mp.precio, 0) AS precio
            FROM pedidos p
            INNER JOIN menu_opciones mo ON p.opcion_id = mo.id
            INNER JOIN menus m ON mo.menu_id = m.id
            LEFT JOIN menu_precios mp ON mp.menu_opcion_id = mo.id 
                AND mp.empresa_id = ?
            WHERE p.trabajador_id = ? 
                AND p.fecha = ?
                AND p.estado != 'cancelado'
            LIMIT 1
        ");
        
        $stmt->bind_param("iis", $trabajador['empresa_id'], $trabajador_id, $fecha);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            // Pedido encontrado
            $pedido = $result->fetch_assoc();
            $stmt->close();
            
            // Verificar si aún puede modificar el pedido
            $validacion_horario = validar_horario($fecha);
            
            log_actividad('CONSULTA_PEDIDO', [
                'trabajador_id' => $trabajador_id,
                'fecha' => $fecha,
                'pedido_encontrado' => true
            ]);
            
            send_json(200, [
                'tiene_pedido' => true,
                'puede_modificar' => $validacion_horario['valido'],
                'tiempo_restante' => $validacion_horario['tiempo_restante'] ?? null,
                'pedido' => [
                    'id' => (int)$pedido['id'],
                    'fecha' => $pedido['fecha'],
                    'estado' => $pedido['estado'],
                    'trabajador_id' => (int)$pedido['trabajador_id'],
                    'opcion_id' => (int)$pedido['opcion_id'],
                    'opcion_idx' => (int)$pedido['opcion_idx'],
                    'opcion_nombre' => $pedido['opcion_nombre'],
                    'opcion_descripcion' => $pedido['opcion_descripcion'],
                    'opcion_ingredientes' => $pedido['opcion_ingredientes'],
                    'opcion_calorias' => $pedido['opcion_calorias'] ? (int)$pedido['opcion_calorias'] : null,
                    'menu_id' => (int)$pedido['menu_id'],
                    'menu_nombre' => $pedido['menu_nombre'],
                    'menu_descripcion' => $pedido['menu_descripcion'],
                    'precio' => (float)$pedido['precio'],
                    'observaciones' => $pedido['observaciones'],
                    'created_at' => $pedido['created_at'],
                    'updated_at' => $pedido['updated_at']
                ],
                'trabajador' => [
                    'nombre' => $trabajador['nombre'],
                    'identificacion' => $trabajador['identificacion'],
                    'empresa' => $trabajador['empresa_nombre']
                ]
            ]);
        } else {
            // No hay pedido para esta fecha
            $stmt->close();
            
            log_actividad('CONSULTA_PEDIDO', [
                'trabajador_id' => $trabajador_id,
                'fecha' => $fecha,
                'pedido_encontrado' => false
            ]);
            
            $validacion_horario = validar_horario($fecha);
            
            send_json(200, [
                'tiene_pedido' => false,
                'puede_crear' => $validacion_horario['valido'],
                'tiempo_restante' => $validacion_horario['tiempo_restante'] ?? null,
                'mensaje' => 'No hay pedido registrado para esta fecha',
                'trabajador' => [
                    'nombre' => $trabajador['nombre'],
                    'identificacion' => $trabajador['identificacion'],
                    'empresa' => $trabajador['empresa_nombre']
                ]
            ]);
        }
        
    } catch (Exception $e) {
        log_actividad('ERROR_CONSULTA', [
            'trabajador_id' => $trabajador_id,
            'error' => $e->getMessage()
        ]);
        
        send_json(500, [
            'error' => 'Error al consultar pedido',
            'detalle' => $e->getMessage(),
            'codigo' => 'DB_ERROR'
        ]);
    }
}

// ============================================
// ENDPOINT: POST - Crear o actualizar pedido
// ============================================

if ($method === 'POST') {
    $trabajador_id = isset($input['trabajador_id']) ? intval($input['trabajador_id']) : 0;
    $opcion_id = isset($input['opcion_id']) ? intval($input['opcion_id']) : 0;
    $fecha = isset($input['fecha']) ? trim($input['fecha']) : date('Y-m-d');
    $observaciones = isset($input['observaciones']) ? trim($input['observaciones']) : null;

    // Validar parámetros obligatorios
    if (!$trabajador_id || !$opcion_id) {
        send_json(400, [
            'error' => 'Los parámetros trabajador_id y opcion_id son requeridos',
            'codigo' => 'PARAM_MISSING',
            'parametros_recibidos' => [
                'trabajador_id' => $trabajador_id,
                'opcion_id' => $opcion_id,
                'fecha' => $fecha
            ]
        ]);
    }

    // Validar formato de fecha
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
        send_json(400, [
            'error' => 'Formato de fecha inválido. Use YYYY-MM-DD',
            'codigo' => 'INVALID_DATE_FORMAT'
        ]);
    }

    // Validar horario
    $validacion = validar_horario($fecha);
    if (!$validacion['valido']) {
        send_json(400, [
            'error' => $validacion['mensaje'],
            'codigo' => $validacion['codigo'],
            'fecha' => $fecha,
            'hora_actual' => date('H:i:s')
        ]);
    }

    // Truncar observaciones si es muy largo
    if ($observaciones && strlen($observaciones) > 500) {
        $observaciones = substr($observaciones, 0, 500);
    }

    try {
        // Iniciar transacción
        $conn->begin_transaction();

        // 1. Verificar que el trabajador existe, es activo y tiene empresa
        $stmt = $conn->prepare("
            SELECT 
                u.id, 
                u.nombre, 
                u.identificacion,
                u.empresa_id, 
                u.perfil,
                u.activo,
                e.nombre AS empresa_nombre
            FROM usuarios u
            LEFT JOIN empresas e ON u.empresa_id = e.id
            WHERE u.id = ?
        ");
        
        $stmt->bind_param("i", $trabajador_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            $conn->rollback();
            $stmt->close();
            send_json(404, [
                'error' => 'Trabajador no encontrado',
                'codigo' => 'USER_NOT_FOUND'
            ]);
        }
        
        $trabajador = $result->fetch_assoc();
        $stmt->close();

        // Validar perfil
        if ($trabajador['perfil'] !== 'trabajador') {
            $conn->rollback();
            send_json(403, [
                'error' => 'Solo usuarios con perfil trabajador pueden hacer pedidos',
                'codigo' => 'INVALID_PROFILE',
                'perfil_actual' => $trabajador['perfil']
            ]);
        }

        // Validar que esté activo
        if ($trabajador['activo'] != 1) {
            $conn->rollback();
            send_json(403, [
                'error' => 'El trabajador está inactivo',
                'codigo' => 'USER_INACTIVE'
            ]);
        }

        // Validar que tenga empresa asignada
        if (!$trabajador['empresa_id']) {
            $conn->rollback();
            send_json(403, [
                'error' => 'El trabajador no tiene empresa asignada',
                'codigo' => 'NO_EMPRESA'
            ]);
        }

        // 2. Verificar que la opción existe, está disponible y pertenece a un menú activo
        $stmt = $conn->prepare("
            SELECT 
                mo.id, 
                mo.menu_id, 
                mo.opcion_idx,
                mo.nombre AS opcion_nombre,
                mo.descripcion AS opcion_descripcion,
                mo.disponible,
                m.nombre AS menu_nombre,
                m.empresa_id AS menu_empresa_id,
                m.activo AS menu_activo
            FROM menu_opciones mo
            INNER JOIN menus m ON mo.menu_id = m.id
            WHERE mo.id = ?
        ");
        
        $stmt->bind_param("i", $opcion_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            $conn->rollback();
            $stmt->close();
            send_json(404, [
                'error' => 'Opción de menú no encontrada',
                'codigo' => 'OPCION_NOT_FOUND',
                'opcion_id' => $opcion_id
            ]);
        }
        
        $opcion = $result->fetch_assoc();
        $stmt->close();

        // Validar que el menú esté activo
        if ($opcion['menu_activo'] != 1) {
            $conn->rollback();
            send_json(403, [
                'error' => 'El menú seleccionado no está activo',
                'codigo' => 'MENU_INACTIVE'
            ]);
        }

        // Validar que la opción esté disponible
        if ($opcion['disponible'] != 1) {
            $conn->rollback();
            send_json(403, [
                'error' => 'La opción seleccionada no está disponible',
                'codigo' => 'OPCION_UNAVAILABLE'
            ]);
        }

        // 3. Verificar que la opción pertenece a la empresa del trabajador (si el menú es específico)
        if ($opcion['menu_empresa_id'] !== null && 
            $opcion['menu_empresa_id'] != $trabajador['empresa_id']) {
            $conn->rollback();
            send_json(403, [
                'error' => 'Esta opción no está disponible para tu empresa',
                'codigo' => 'EMPRESA_MISMATCH',
                'tu_empresa' => $trabajador['empresa_nombre'],
                'menu_empresa_id' => $opcion['menu_empresa_id']
            ]);
        }

        // 4. Verificar si ya tiene pedido para esta fecha
        $stmt = $conn->prepare("
            SELECT id, estado, opcion_id
            FROM pedidos 
            WHERE trabajador_id = ? AND fecha = ?
        ");
        
        $stmt->bind_param("is", $trabajador_id, $fecha);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            // ======================================
            // YA TIENE PEDIDO - ACTUALIZAR
            // ======================================
            $pedido_existente = $result->fetch_assoc();
            $pedido_id = $pedido_existente['id'];
            $opcion_anterior = $pedido_existente['opcion_id'];
            $stmt->close();

            // Si la opción es la misma, solo actualizar observaciones
            if ($opcion_anterior == $opcion_id) {
                $stmt = $conn->prepare("
                    UPDATE pedidos 
                    SET observaciones = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                ");
                $stmt->bind_param("si", $observaciones, $pedido_id);
            } else {
                // Cambió la opción, actualizar todo
                $stmt = $conn->prepare("
                    UPDATE pedidos 
                    SET opcion_id = ?, 
                        observaciones = ?,
                        estado = 'confirmado',
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                ");
                $stmt->bind_param("isi", $opcion_id, $observaciones, $pedido_id);
            }
            
            if ($stmt->execute()) {
                $conn->commit();
                $stmt->close();
                
                log_actividad('PEDIDO_ACTUALIZADO', [
                    'pedido_id' => $pedido_id,
                    'trabajador_id' => $trabajador_id,
                    'opcion_id' => $opcion_id,
                    'fecha' => $fecha
                ]);
                
                send_json(200, [
                    'ok' => true,
                    'mensaje' => 'Pedido actualizado correctamente',
                    'pedido_id' => $pedido_id,
                    'accion' => 'actualizado',
                    'detalles' => [
                        'trabajador' => $trabajador['nombre'],
                        'identificacion' => $trabajador['identificacion'],
                        'empresa' => $trabajador['empresa_nombre'],
                        'menu' => $opcion['menu_nombre'],
                        'opcion' => $opcion['opcion_nombre'],
                        'opcion_idx' => (int)$opcion['opcion_idx'],
                        'fecha' => $fecha,
                        'observaciones' => $observaciones
                    ]
                ]);
            } else {
                $conn->rollback();
                $error = $stmt->error;
                $stmt->close();
                
                log_actividad('ERROR_ACTUALIZAR', [
                    'pedido_id' => $pedido_id,
                    'error' => $error
                ]);
                
                send_json(500, [
                    'error' => 'Error al actualizar pedido',
                    'detalle' => $error,
                    'codigo' => 'UPDATE_ERROR'
                ]);
            }
            
        } else {
            // ======================================
            // NO TIENE PEDIDO - CREAR NUEVO
            // ======================================
            $stmt->close();

            $stmt = $conn->prepare("
                INSERT INTO pedidos (trabajador_id, opcion_id, fecha, observaciones, estado) 
                VALUES (?, ?, ?, ?, 'confirmado')
            ");
            
            $stmt->bind_param("iiss", $trabajador_id, $opcion_id, $fecha, $observaciones);
            
            if ($stmt->execute()) {
                $pedido_id = $conn->insert_id;
                $conn->commit();
                $stmt->close();
                
                log_actividad('PEDIDO_CREADO', [
                    'pedido_id' => $pedido_id,
                    'trabajador_id' => $trabajador_id,
                    'opcion_id' => $opcion_id,
                    'fecha' => $fecha
                ]);
                
                send_json(201, [
                    'ok' => true,
                    'mensaje' => 'Pedido creado correctamente',
                    'pedido_id' => $pedido_id,
                    'accion' => 'creado',
                    'detalles' => [
                        'trabajador' => $trabajador['nombre'],
                        'identificacion' => $trabajador['identificacion'],
                        'empresa' => $trabajador['empresa_nombre'],
                        'menu' => $opcion['menu_nombre'],
                        'opcion' => $opcion['opcion_nombre'],
                        'opcion_idx' => (int)$opcion['opcion_idx'],
                        'fecha' => $fecha,
                        'observaciones' => $observaciones,
                        'hora_registro' => date('H:i:s')
                    ]
                ]);
            } else {
                $conn->rollback();
                $error = $stmt->error;
                $stmt->close();
                
                log_actividad('ERROR_CREAR', [
                    'trabajador_id' => $trabajador_id,
                    'error' => $error
                ]);
                
                send_json(500, [
                    'error' => 'Error al crear pedido',
                    'detalle' => $error,
                    'codigo' => 'INSERT_ERROR'
                ]);
            }
        }
        
    } catch (Exception $e) {
        $conn->rollback();
        
        log_actividad('ERROR_EXCEPTION', [
            'trabajador_id' => $trabajador_id,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        
        send_json(500, [
            'error' => 'Error interno del servidor',
            'detalle' => $e->getMessage(),
            'codigo' => 'SERVER_ERROR'
        ]);
    }
}

// ============================================
// ENDPOINT: DELETE - Cancelar pedido
// ============================================

if ($method === 'DELETE') {
    $trabajador_id = isset($input['trabajador_id']) ? intval($input['trabajador_id']) : 0;
    $fecha = isset($input['fecha']) ? trim($input['fecha']) : date('Y-m-d');

    // Validar parámetros
    if (!$trabajador_id) {
        send_json(400, [
            'error' => 'El parámetro trabajador_id es requerido',
            'codigo' => 'PARAM_MISSING'
        ]);
    }

    // Validar formato de fecha
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
        send_json(400, [
            'error' => 'Formato de fecha inválido. Use YYYY-MM-DD',
            'codigo' => 'INVALID_DATE_FORMAT'
        ]);
    }

    // Validar horario
    $validacion = validar_horario($fecha);
    if (!$validacion['valido']) {
        send_json(400, [
            'error' => $validacion['mensaje'],
            'codigo' => $validacion['codigo']
        ]);
    }

    try {
        // Actualizar estado a cancelado (no eliminar físicamente)
        $stmt = $conn->prepare("
            UPDATE pedidos 
            SET estado = 'cancelado', 
                updated_at = CURRENT_TIMESTAMP
            WHERE trabajador_id = ? 
                AND fecha = ? 
                AND estado != 'cancelado'
        ");
        
        $stmt->bind_param("is", $trabajador_id, $fecha);
        
        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                $stmt->close();
                
                log_actividad('PEDIDO_CANCELADO', [
                    'trabajador_id' => $trabajador_id,
                    'fecha' => $fecha
                ]);
                
                send_json(200, [
                    'ok' => true,
                    'mensaje' => 'Pedido cancelado correctamente',
                    'fecha' => $fecha,
                    'hora_cancelacion' => date('H:i:s')
                ]);
            } else {
                $stmt->close();
                send_json(404, [
                    'error' => 'No se encontró pedido para cancelar o ya estaba cancelado',
                    'codigo' => 'PEDIDO_NOT_FOUND',
                    'fecha' => $fecha
                ]);
            }
        } else {
            $error = $stmt->error;
            $stmt->close();
            
            log_actividad('ERROR_CANCELAR', [
                'trabajador_id' => $trabajador_id,
                'error' => $error
            ]);
            
            send_json(500, [
                'error' => 'Error al cancelar pedido',
                'detalle' => $error,
                'codigo' => 'DELETE_ERROR'
            ]);
        }
        
    } catch (Exception $e) {
        log_actividad('ERROR_EXCEPTION_DELETE', [
            'trabajador_id' => $trabajador_id,
            'error' => $e->getMessage()
        ]);
        
        send_json(500, [
            'error' => 'Error interno del servidor',
            'detalle' => $e->getMessage(),
            'codigo' => 'SERVER_ERROR'
        ]);
    }
}

// ============================================
// MÉTODO NO PERMITIDO
// ============================================

send_json(405, [
    'error' => 'Método HTTP no permitido',
    'metodo_recibido' => $method,
    'metodos_permitidos' => ['GET', 'POST', 'DELETE'],
    'codigo' => 'METHOD_NOT_ALLOWED'
]);

// ============================================
// FIN DEL ARCHIVO
// ============================================